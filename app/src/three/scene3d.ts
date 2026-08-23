/**
 * The 3D presentation of a game state.
 *
 * This is the only place that knows both the engine and three.js. The engine
 * still knows nothing about rendering (D35), and the renderer holds no game
 * state: every frame it is told what the world looks like and reconciles its
 * objects against that.
 *
 * Reconciliation rather than rebuilding matters here. Tearing down and
 * rebuilding every unit each turn would drop the animation state and rebuild
 * geometry for objects that did not change.
 */

import {
  Group,
  MOUSE,
  Mesh,
  Object3D,
  Raycaster,
  Vector2,
  Vector3,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  hexKey,
  hexRound,
  unitType,
  PLAYER_FACTION_ID,
  type GameMap,
  type GameState,
  type Hex,
  type ReachableTile,
} from '@fabric-empires/engine';
import { createWorld, HIGH_QUALITY, type World, type WorldQuality } from './world.js';
import {
  HEX_RADIUS,
  SEA_LEVEL,
  buildTerrain,
  hexPatch,
  hexToWorld,
  overlayMaterial,
  worldToAxial,
  type Terrain,
} from './terrain.js';
import { createWater, type WaterSurface } from './water.js';
import { buildScatter, type Scatter } from './scatter.js';
import { createCombatFx, type CombatFx } from './combatFx.js';
import { buildCity, buildRuin, buildUnit, disposeEntityMaterials } from './entities.js';
import { createFlyControls, type FlyTelemetry } from './flyControls.js';
import type { CinematicShot } from './cinematic.js';
import { createCorruption } from './corruption.js';
import { createFog } from './fog.js';

export interface Scene3DView {
  readonly selectedUnitId?: string | undefined;
  readonly reachable?: ReadonlyMap<string, ReachableTile> | undefined;
  readonly attackTargets?: ReadonlySet<string> | undefined;
  /**
   * Tiles proposed as somewhere to found a city, best first.
   *
   * Drawn brightest at the head of the list, so the ranking is visible on the
   * map rather than only in a panel: the point of the advice is that it can be
   * taken without reading anything.
   */
  readonly settleSites?: readonly Hex[] | undefined;
  readonly hover?: Hex | undefined;
  /** World-space display offset for a unit that is mid-animation. */
  readonly unitOffset?: ((unitId: string) => { x: number; z: number } | undefined) | undefined;
  /** 0 while a destroyed unit fades out. */
  readonly unitOpacity?: ((unitId: string) => number) | undefined;
  /**
   * Hexes the player can currently see, if fog is on.
   *
   * ⚠️ Units and cities outside it are not drawn at all, rather than drawn
   * dimmed. Remembered ground shows the hill; it must not show who is standing
   * on the hill now, or scouting would be pointless after the first look.
   * Undefined means no fog, which is what every test and the map editor use.
   */
  readonly visibleHexes?: ReadonlySet<string> | undefined;
}

export interface Scene3D {
  readonly world: World;
  /** Sparks, dust, tracers and per-unit pose overrides. */
  readonly fx: CombatFx;
  /**
   * The free camera, shared verbatim with the digital twins.
   *
   * There is no toggle to find: pressing W A S D Q E R F takes the camera, and
   * it hands itself back a second after the keys come up. See `flyControls.ts`
   * for why that latch replaced a button.
   */
  readonly drone: {
    readonly engaged: boolean;
    /** Speed, altitude, height above ground, heading and throttle. */
    telemetry(): FlyTelemetry;
    /** Take or release the camera explicitly, for a button. */
    setEngaged(on: boolean): void;
    /** Swing the view round to due north without moving the camera. */
    faceNorth(): void;
    /**
     * Where the orbit camera is currently centred.
     *
     * Exposed for the hand-back check: the interesting question when the drone
     * lets go is not whether a target exists but whether it is one the orbit
     * camera will accept without snapping.
     */
    orbitTarget(): Vector3;
    /** Subscribe to the latch. Returns an unsubscribe. */
    onEngagedChange(listener: (engaged: boolean) => void): () => void;
  };
  /**
   * Scripted camera moves for the game's first-time moments.
   *
   * Owns the camera outright while a shot runs, for the same reason the drone
   * does: `OrbitControls.update()` re-applies the orbit pose on every call and
   * would drag a cinematic back towards the orbit centre one frame at a time.
   */
  readonly cinema: {
    /** Resolves when the shot ends, or immediately when one is already running. */
    play(shot: CinematicShot): Promise<void>;
    /** End the current shot now. The promise still resolves. */
    skip(): void;
    readonly active: boolean;
  };
  /** Rebuild the ground for a new map. Slow, and only called on a new game. */
  loadMap(map: GameMap): void;
  /** Reconcile units, cities and overlays against the current state. */
  sync(state: GameState, view: Scene3DView): void;
  /** Which hex is under a screen point, if any. */
  hexAt(screenX: number, screenY: number): Hex | undefined;
  /** Glide the camera to look at a hex. */
  focus(hex: Hex, immediate?: boolean): void;
  /**
   * Glide the camera to an arbitrary point, optionally closing to a given
   * distance. Used to frame a fight between two hexes rather than one.
   */
  focusWorld(point: Vector3, distance?: number): void;
  /** World position of the ground at a hex, for effects. */
  groundAt(hex: Hex): Vector3;
  /** Project a world position to screen pixels, for HTML overlays. */
  project(point: Vector3): { x: number; y: number; visible: boolean };
  setSize(width: number, height: number): void;
  setQuality(quality: WorldQuality): void;
  setGridVisible(visible: boolean): void;
  /**
   * Which hexes are corrupted: the Ungoverned Wastes, and any ground an
   * antagonist holds. Drawn as torn scanlines rather than a border tint (D56).
   */
  setCorrupted(hexes: readonly Hex[]): void;
  /**
   * Replace the fog.
   *
   * `unseen` has never been visited; `remembered` has been seen before but is
   * not currently watched. Both are hex lists rather than sets, because the
   * renderer only ever iterates them.
   */
  setFog(unseen: readonly Hex[], remembered: readonly Hex[]): void;
  /**
   * Draw one frame. The shake is applied to the camera for this frame only
   * and then undone, so it can never accumulate into the orbit state.
   */
  render(deltaSeconds: number, shake?: { x: number; y: number }): void;
  readonly stats: () => { triangles: number; draws: number };
  /**
   * Measured facts about the built ground.
   *
   * Exists because the surface came out uniformly grey once and three
   * different theories all sounded plausible. Numbers settled it in one
   * round trip; staring at screenshots would not have.
   */
  readonly probe: () => {
    vertices: number;
    meanColour: [number, number, number];
    colourSpread: number;
    flatFraction: number;
    minY: number;
    maxY: number;
    upFacing: number;
    detailNormalZ: number;
    erosionMaxDelta: number;
    trees: number;
    rocks: number;
  } | undefined;
  dispose(): void;
}

const HOVER_COLOUR = '#cfe8ff';
const MOVE_COLOUR = '#4ea8ff';
const MOVE_STOP_COLOUR = '#ffb64d';
const ATTACK_COLOUR = '#ff5a48';
const SELECT_COLOUR = '#ffd166';
/*
 * Settle proposals.
 *
 * ⚠️ Green, and deliberately not any of the four above. Blue already means
 * "you can walk here", orange "and that ends your turn", red "you can attack
 * this" and yellow "this is selected". A fifth meaning needs a fifth colour or
 * it is not a meaning.
 */
const SETTLE_COLOUR = '#8fd694';

export function createScene3D(
  canvas: HTMLCanvasElement,
  quality: WorldQuality = HIGH_QUALITY,
): Scene3D {
  const world = createWorld(canvas, quality);
  const { scene, camera } = world;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  // Left drag pans, right drag orbits. A click is detected separately, so
  // selection and panning can share the left button without fighting.
  controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE };
  controls.screenSpacePanning = false;
  controls.minDistance = 6;
  /*
   * Far enough to see the whole world.
   *
   * This was 150, which framed a radius-25 map at 87 units across with room
   * to spare. The map is now 156 units across, so 150 could not pull back far
   * enough to see it: the limit silently became a cap on how much of your own
   * empire you were allowed to look at.
   */
  controls.maxDistance = 320;
  // Stop just short of the horizon. Going below it shows the underside of
  // the world, and there is nothing there.
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.minPolarAngle = Math.PI * 0.06;

  const terrainGroup = new Group();
  const entityGroup = new Group();
  const overlayGroup = new Group();
  const fx = createCombatFx();
  scene.add(terrainGroup, entityGroup, overlayGroup, fx.group);

  const corruption = createCorruption((mesh) => {
    for (const child of [...overlayGroup.children]) {
      if (child.userData.corruption === true) overlayGroup.remove(child);
    }
    if (mesh) {
      mesh.userData.corruption = true;
      overlayGroup.add(mesh);
    }
  });

  /*
   * Fog lives in its own group, not in `overlayGroup`.
   *
   * ⚠️ The overlay group is cleared and rebuilt on every sync, which is right
   * for reachable-tile highlights and wrong for fog: rebuilding six thousand
   * merged patches every time a unit is selected would be the most expensive
   * thing in the frame, for a layer that only changes when ground is uncovered.
   */
  const fogGroup = new Group();
  fogGroup.name = 'fog';
  scene.add(fogGroup);

  const fog = createFog((added, removed) => {
    for (const mesh of removed) fogGroup.remove(mesh);
    for (const mesh of added) fogGroup.add(mesh);
  });

  let terrain: Terrain | undefined;
  let scatter: Scatter | undefined;
  let water: WaterSurface | undefined;
  let groundMesh: Mesh | undefined;
  let mapRadius = 0;

  // Drone camera --------------------------------------------------------
  /*
   * The free camera, ported unchanged from the digital twins. Every number it
   * takes is an option precisely so a host at a different scale does not have
   * to edit the module, and this host is at a *very* different scale: the
   * twins fly over tens of kilometres, this world is about 86 units across
   * with a couple of units of relief. Left on its defaults the drone would
   * cross the entire empire in a fifth of a second and hand the camera back
   * 1200 units away, which is eight times the orbit limit.
   *
   * So the units below are hexes, not metres. One hex radius is 1.
   */
  const droneListeners = new Set<(engaged: boolean) => void>();

  /**
   * Ground height for the drone, or null past the edge of the map.
   *
   * Returning null rather than sea level matters: the altimeter then reads
   * "off the map" instead of confidently reporting a height above water that
   * does not exist, and the speed scaling stops pretending it knows how close
   * the ground is.
   */
  function droneGroundAt(x: number, z: number): number | null {
    if (!terrain) return null;
    const reach = (mapRadius + 1) * HEX_RADIUS * 1.9;
    if (Math.hypot(x, z) > reach) return null;
    return terrain.surfaceAt(x, z);
  }

  const fly = createFlyControls({
    camera,
    domElement: canvas,
    controls,
    groundAt: droneGroundAt,
    // Crossing the map takes about eight seconds at the default setting, and
    // the slowest step is a walking pace along a ridge line.
    cruiseMinMs: 1.5,
    cruiseMaxMs: 45,
    cruiseDefaultMs: 9,
    boost: 3,
    // The orbit camera is bounded at 150, so the old 1200 would have been
    // clamped on the first frame after the hand-back: a visible jump.
    handoffDistanceM: 28,
    // Roughly the height a city looks right from. Below it the camera slows
    // down, which is what makes flying between trees feel controllable
    // without anyone touching the throttle.
    referenceAglM: 5,
    // Mass and a gimbal. Both are what separates a camera that flies from one
    // that teleports, and this scene is the one place in the game where the
    // player is meant to just look at the thing.
    accelerateTauS: 0.45,
    brakeTauS: 0.22,
    lookTauS: 0.07,
    onEngagedChange: (engaged) => {
      // A scripted flight and the player cannot both own the camera. The
      // player wins; a duel that framed itself mid-takeoff simply stops.
      if (engaged) {
        flightFrom = undefined;
        flightTo = undefined;
        flightDistance = undefined;
      }
      for (const listener of droneListeners) listener(engaged);
    },
  });

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const shakeRight = new Vector3();
  const shakeUp = new Vector3();
  const shakeForward = new Vector3();

  const unitObjects = new Map<string, Group>();
  const cityObjects = new Map<string, Group>();
  const ruinObjects = new Map<string, Group>();
  const overlayObjects: Object3D[] = [];

  // Camera flight -------------------------------------------------------
  let flightFrom: Vector3 | undefined;
  let flightTo: Vector3 | undefined;
  let flightStart = 0;
  let flightDistance: number | undefined;
  let flightFromDistance = 0;
  const FLIGHT_MS = 520;

  // Cinematics ----------------------------------------------------------
  /*
   * A shot owns the camera outright while it runs.
   *
   * ⚠️ It also has to put the orbit camera back on the way out. Leaving the
   * player wherever the last frame ended would strand the map camera at a
   * cinematic angle, frequently below the terrain, and `OrbitControls` would
   * then snap it on the very next update. So the pose from before the shot is
   * saved and restored, which is the same hand-back problem the drone had.
   */
  let shot: CinematicShot | undefined;
  let shotStart = 0;
  let shotResolve: (() => void) | undefined;
  const shotReturnPosition = new Vector3();
  const shotReturnTarget = new Vector3();

  function endShot(): void {
    if (!shot) return;
    shot = undefined;
    // Back to the playing grade. Walked, not cut: see `grade.ts`.
    world.setCinematic(false);
    camera.position.copy(shotReturnPosition);
    controls.target.copy(shotReturnTarget);
    controls.enabled = true;
    controls.update();
    const resolve = shotResolve;
    shotResolve = undefined;
    resolve?.();
  }

  function clearOverlays(): void {
    for (const object of overlayObjects) {
      overlayGroup.remove(object);
      if (object instanceof Mesh) object.geometry.dispose();
    }
    overlayObjects.length = 0;
  }

  function addPatch(hex: Hex, colour: string, opacity: number, lift: number): void {
    if (!terrain) return;
    const geometry = hexPatch(hex, terrain, lift);
    const mesh = new Mesh(geometry, overlayMaterial(colour, opacity));
    mesh.renderOrder = 3;
    overlayGroup.add(mesh);
    overlayObjects.push(mesh);
  }

  function placeOnGround(object: Object3D, hex: Hex): void {
    if (!terrain) return;
    const { x, z } = hexToWorld(hex);
    object.position.set(x, terrain.heightAt(hex), z);
  }

  return {
    world,
    fx,

    drone: {
      get engaged() {
        return fly.engaged;
      },
      telemetry: () => fly.telemetry(),
      setEngaged: (on) => fly.setEngaged(on),
      faceNorth: () => fly.faceNorth(),
      orbitTarget: () => controls.target.clone(),
      onEngagedChange(listener) {
        droneListeners.add(listener);
        return () => droneListeners.delete(listener);
      },
    },

    cinema: {
      play(next) {
        // One shot at a time. A second trigger during a cinematic resolves at
        // once rather than queueing, because the moment it was announcing has
        // already passed by the time the first one ends.
        if (shot) return Promise.resolve();
        shot = next;
        shotStart = performance.now();
        // Deeper vignette and a little more contrast for the length of the
        // shot. The measured reason is in `grade.ts`: a photograph of a
        // landscape carries less local contrast than this renderer does, and
        // a film is the one place legibility is not the first priority.
        world.setCinematic(true);
        shotReturnPosition.copy(camera.position);
        shotReturnTarget.copy(controls.target);
        // Hand the drone back first, so it cannot fight the shot for the camera.
        fly.setEngaged(false);
        controls.enabled = false;
        flightFrom = undefined;
        flightTo = undefined;
        flightDistance = undefined;
        return new Promise<void>((resolve) => {
          shotResolve = resolve;
        });
      },
      skip: endShot,
      get active() {
        return shot !== undefined;
      },
    },

    loadMap(map) {
      if (terrain) {
        terrainGroup.remove(terrain.group);
        terrain.dispose();
      }
      if (scatter) {
        terrainGroup.remove(scatter.group);
        scatter.dispose();
      }
      if (water) {
        scene.remove(water.mesh);
        water.dispose();
      }

      terrain = buildTerrain(map);
      terrainGroup.add(terrain.group);
      groundMesh = terrain.group.children.find((c): c is Mesh => c instanceof Mesh);
      mapRadius = map.radius;

      scatter = buildScatter(map, terrain);
      terrainGroup.add(scatter.group);

      // The sea extends well past the land so the horizon is water rather
      // than an abrupt edge where the map stops.
      const extent = map.radius * HEX_RADIUS * 4;
      water = createWater(extent * 2.6, SEA_LEVEL, quality.shadowMapSize >= 2048 ? 512 : 256);
      water.setSunDirection(world.sun.position.clone().normalize());
      scene.add(water.mesh);

      const half = map.radius * HEX_RADIUS * 1.9;
      world.fitShadows(new Vector3(0, 0, 0), half);

      // Open on a low, wide establishing view of the whole landmass.
      controls.target.set(0, 0, 0);
      camera.position.set(0, half * 0.72, half * 0.95);
      controls.update();
    },

    sync(state, view) {
      if (!terrain) return;

      /*
       * What the player can see right now.
       *
       * ⚠️ Own units and cities are ALWAYS drawn, whatever the fog says. They
       * are what generates sight in the first place, so hiding one would be a
       * self-inflicted blindness the player could do nothing about, and a
       * rounding error in the sight radius would make a unit vanish.
       */
      const canSee = (hex: Hex, factionId: string): boolean => {
        if (!view.visibleHexes) return true;
        if (factionId === PLAYER_FACTION_ID) return true;
        return view.visibleHexes.has(hexKey(hex));
      };

      // Units ------------------------------------------------------------
      const liveUnits = new Set<string>();
      for (const unit of state.units.values()) {
        if (!canSee(unit.hex, unit.factionId)) continue;
        liveUnits.add(unit.id);
        let object = unitObjects.get(unit.id);
        if (!object) {
          const colour = state.factions.get(unit.factionId)?.colour ?? '#888888';
          object = buildUnit(unit, colour);
          entityGroup.add(object);
          unitObjects.set(unit.id, object);
        }
        placeOnGround(object, unit.hex);

        // Animation is a display offset applied after placement, so the
        // engine position stays the single source of truth and a dropped
        // frame can never leave a unit stranded off its hex.
        const offset = view.unitOffset?.(unit.id);
        if (offset) {
          object.position.x += offset.x;
          object.position.z += offset.z;
        }

        // Remembered before any pose is applied, so a wreck can keep being
        // animated after the engine has stopped reporting the unit at all.
        (object.userData as { basePosition?: Vector3 }).basePosition =
          object.position.clone();

        // A combat pose sits on top of that: where the unit has been thrown,
        // which way it is facing, and how far it has toppled over.
        const pose = fx.poseOf(unit.id);
        const spent = unit.factionId === state.activeFactionId && unit.movesLeft <= 0;

        if (pose) {
          object.position.add(pose.offset);
          object.position.y -= pose.sink;
          object.rotation.set(pose.pitch, pose.yaw ?? object.rotation.y, pose.roll);
        } else {
          // Spent units settle; ready units stand up. Cheaper to read than a
          // badge and it survives at any zoom.
          object.rotation.set(spent ? 0.09 : 0, object.rotation.y, 0);
        }

        const opacity = (view.unitOpacity?.(unit.id) ?? 1) * (pose?.opacity ?? 1);
        object.visible = opacity > 0.02;
        if (opacity < 1) object.scale.setScalar(Math.max(0.05, opacity));
        else object.scale.setScalar(1);

        const type = unitType(unit.typeId);
        const hurt = 1 - unit.hp / type.maxHp;
        object.position.y -= hurt * 0.04;
      }
      for (const [id, object] of unitObjects) {
        if (liveUnits.has(id)) continue;

        /**
         * A wreck outlives its unit.
         *
         * The engine removes a destroyed unit the instant the blow lands,
         * which is correct for the rules and useless for the animation: the
         * object was being deleted on the same frame the death sequence
         * started, so the topple never played and units simply blinked out.
         * While a pose exists the object is kept and driven from it; the
         * duel decides when the wreck is finally gone.
         */
        const pose = fx.poseOf(id);
        if (pose) {
          const base = (object.userData as { basePosition?: Vector3 }).basePosition;
          if (base) {
            object.position.copy(base).add(pose.offset);
            object.position.y -= pose.sink;
          }
          object.rotation.set(pose.pitch, pose.yaw ?? object.rotation.y, pose.roll);
          object.visible = pose.opacity > 0.02;
          object.scale.setScalar(Math.max(0.05, pose.opacity));
          continue;
        }

        entityGroup.remove(object);
        unitObjects.delete(id);
      }

      // Cities -----------------------------------------------------------
      const liveCities = new Set<string>();
      for (const city of state.cities.values()) {
        /*
         * ⚠️ A remembered village is NOT drawn.
         *
         * Tempting to keep it on screen once seen, and wrong: the player would
         * have a permanent live readout of a place they walked past once,
         * including whether it still stands after somebody else took it.
         * Remembered ground shows terrain, never occupants.
         */
        if (!canSee(city.hex, city.factionId)) continue;
        liveCities.add(city.id);

        const existing = cityObjects.get(city.id);
        const colour = state.factions.get(city.factionId)?.colour ?? '#888888';
        // Population, rank and ownership all change the model, so those three
        // are the rebuild triggers rather than rebuilding blindly every turn.
        // ⚠️ Rank belongs here: a promotion adds walls and a keep, and without
        // it in the signature the town keeps its old shape until it happens to
        // grow a citizen or change hands.
        const signature = `${city.population}:${city.rank}:${city.factionId}`;
        if (existing && existing.userData.signature === signature) {
          placeOnGround(existing, city.hex);
          continue;
        }
        if (existing) entityGroup.remove(existing);
        const object = buildCity(city, colour);
        object.userData.signature = signature;
        entityGroup.add(object);
        cityObjects.set(city.id, object);
        placeOnGround(object, city.hex);
      }
      for (const [id, object] of cityObjects) {
        if (liveCities.has(id)) continue;
        entityGroup.remove(object);
        cityObjects.delete(id);
      }

      // Ruins ------------------------------------------------------------
      // Never rebuilt: a ruin does not change once it exists, so the only
      // work here is adding the ones that are new since the last sync.
      for (const ruin of state.ruins.values()) {
        if (ruinObjects.has(ruin.id)) continue;
        const object = buildRuin(ruin);
        entityGroup.add(object);
        ruinObjects.set(ruin.id, object);
        placeOnGround(object, ruin.hex);
      }

      // Overlays ---------------------------------------------------------
      clearOverlays();

      if (view.reachable) {
        for (const entry of view.reachable.values()) {
          if (entry.cost === 0) continue;
          addPatch(
            entry.hex,
            entry.stops ? MOVE_STOP_COLOUR : MOVE_COLOUR,
            entry.stops ? 0.15 : 0.1,
            0.035,
          );
        }
      }
      if (view.attackTargets) {
        for (const key of view.attackTargets) {
          const tile = state.map.tiles.get(key);
          if (tile) addPatch(tile.hex, ATTACK_COLOUR, 0.22, 0.045);
        }
      }
      /*
       * Settle proposals, above the movement patches so they read as advice
       * rather than as reachable ground. The best site is drawn at full
       * strength and the rest fade, which puts the ranking on the map.
       */
      if (view.settleSites) {
        view.settleSites.forEach((hex, index) => {
          const strength = index === 0 ? 0.34 : Math.max(0.1, 0.26 - index * 0.05);
          addPatch(hex, SETTLE_COLOUR, strength, 0.05 + (index === 0 ? 0.012 : 0));
        });
      }
      if (view.hover && state.map.tiles.has(hexKey(view.hover))) {
        addPatch(view.hover, HOVER_COLOUR, 0.1, 0.05);
      }
      if (view.selectedUnitId) {
        const unit = state.units.get(view.selectedUnitId);
        if (unit) addPatch(unit.hex, SELECT_COLOUR, 0.24, 0.055);
      }
    },

    hexAt(screenX, screenY) {
      if (!groundMesh) return undefined;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((screenX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((screenY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(groundMesh, false);
      const hit = hits[0];
      if (!hit) return undefined;
      const { q, r } = worldToAxial(hit.point.x, hit.point.z);
      return hexRound(q, r);
    },

    focus(hex, immediate = false) {
      const { x, z } = hexToWorld(hex);
      const target = new Vector3(x, terrain?.heightAt(hex) ?? 0, z);
      if (immediate) {
        const delta = target.clone().sub(controls.target);
        controls.target.copy(target);
        camera.position.add(delta);
        controls.update();
        return;
      }
      flightFrom = controls.target.clone();
      flightTo = target;
      flightStart = performance.now();
      flightDistance = undefined;
    },

    focusWorld(point, distance) {
      flightFrom = controls.target.clone();
      flightTo = point.clone();
      flightStart = performance.now();
      flightDistance = distance;
      flightFromDistance = camera.position.distanceTo(controls.target);
    },

    groundAt(hex) {
      const { x, z } = hexToWorld(hex);
      return new Vector3(x, terrain?.heightAt(hex) ?? 0, z);
    },

    project(point) {
      const projected = point.clone().project(camera);
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((projected.x + 1) / 2) * rect.width,
        y: ((1 - projected.y) / 2) * rect.height,
        visible: projected.z < 1,
      };
    },

    setSize(width, height) {
      world.setSize(width, height);
    },

    setQuality(next) {
      world.setQuality(next);
    },

    setGridVisible(visible) {
      terrain?.setGridVisible(visible);
    },

    setCorrupted(hexes) {
      if (terrain) corruption.set(hexes, terrain);
    },

    setFog(unseen, remembered) {
      if (terrain) fog.set(unseen, remembered, terrain);
      /*
       * ⚠️ Props have to be hidden too, not just covered.
       *
       * The fog lid clears the tallest terrain vertex in its hex by a tenth
       * of a unit, which covers the ground and does not come close to
       * covering a two-unit tree. Measured: every one of 6,150 lids sat above
       * its terrain and the map still looked unfogged, because the forest was
       * standing straight through it.
       */
      scatter?.setHidden(new Set(unseen.map((h) => hexKey(h))));
    },

    render(delta, shake) {
      /*
       * Exactly one thing may drive the camera per frame. While the drone is
       * latched, `controls.update()` must not run: it re-applies the orbit
       * pose every call whether anything moved or not, so leaving it in would
       * silently drag the camera back towards the orbit centre and the drone
       * would feel like it was flying through treacle.
       */
      if (shot) {
        // A shot outranks everything: no orbit, no drone, no scripted flight.
        const elapsed = performance.now() - shotStart;
        const frame = shot.frame(Math.min(1, elapsed / shot.durationMs));
        camera.position.copy(frame.position);
        camera.lookAt(frame.target);
        if (elapsed >= shot.durationMs) endShot();
      } else if (fly.engaged) {
        fly.update(delta);
      } else {
        if (flightFrom && flightTo) {
          const t = Math.min(1, (performance.now() - flightStart) / FLIGHT_MS);
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const next = flightFrom.clone().lerp(flightTo, eased);
          const move = next.clone().sub(controls.target);
          controls.target.copy(next);
          camera.position.add(move);

          // Dolly along the existing view direction rather than teleporting,
          // so the approach keeps whatever angle the player had chosen.
          if (flightDistance !== undefined) {
            const wanted = flightFromDistance + (flightDistance - flightFromDistance) * eased;
            const direction = camera.position.clone().sub(controls.target).normalize();
            camera.position.copy(controls.target).addScaledVector(direction, wanted);
          }

          if (t >= 1) {
            flightFrom = undefined;
            flightTo = undefined;
            flightDistance = undefined;
          }
        }

        controls.update();
      }

      water?.update(delta * 0.35);
      fx.update(delta);
      corruption.update(delta);

      // Keep the shadow frustum around the camera target rather than the
      // whole map: a frustum big enough for a radius-25 map wastes most of
      // its resolution on ground nobody is looking at.
      const focusRadius = Math.min(mapRadius * HEX_RADIUS * 1.9, 46);
      world.fitShadows(controls.target, focusRadius);

      if (shake && (shake.x !== 0 || shake.y !== 0)) {
        // Shake along the camera's own right and up axes, scaled by distance
        // so the kick looks the same size whether zoomed in or out.
        const distance = camera.position.distanceTo(controls.target);
        const amount = (distance / 600) * 1;
        camera.matrixWorld.extractBasis(shakeRight, shakeUp, shakeForward);
        const offset = shakeRight
          .multiplyScalar(shake.x * amount)
          .add(shakeUp.multiplyScalar(shake.y * amount));
        camera.position.add(offset);
        world.render();
        camera.position.sub(offset);
        return;
      }

      world.render();
    },

    stats: () => ({
      triangles: world.renderer.info.render.triangles,
      draws: world.renderer.info.render.calls,
    }),

    probe: () => {
      if (!groundMesh) return undefined;
      const geometry = groundMesh.geometry;
      const position = geometry.getAttribute('position');
      const normal = geometry.getAttribute('normal');
      const colour = geometry.getAttribute('color');
      if (!position || !normal || !colour) return undefined;

      let r = 0;
      let g = 0;
      let b = 0;
      let flat = 0;
      let up = 0;
      let minY = Infinity;
      let maxY = -Infinity;
      const sample = Math.max(1, Math.floor(position.count / 20000));
      let counted = 0;

      for (let i = 0; i < position.count; i += sample) {
        r += colour.getX(i);
        g += colour.getY(i);
        b += colour.getZ(i);
        const ny = normal.getY(i);
        if (ny > 0.97) flat += 1;
        if (ny > 0) up += 1;
        const y = position.getY(i);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        counted += 1;
      }

      // Spread is the mean absolute deviation of the channels from the mean
      // grey: near zero means every vertex is the same colour, which is the
      // symptom the probe was written to catch.
      const mr = r / counted;
      const mg = g / counted;
      const mb = b / counted;
      const mean = (mr + mg + mb) / 3;
      const spread = (Math.abs(mr - mean) + Math.abs(mg - mean) + Math.abs(mb - mean)) / 3;

      return {
        vertices: position.count,
        meanColour: [mr, mg, mb],
        colourSpread: spread,
        flatFraction: flat / counted,
        minY,
        maxY,
        upFacing: up / counted,
        detailNormalZ: terrain?.detailNormalZ ?? 0,
        erosionMaxDelta: terrain?.erosionMaxDelta ?? 0,
        trees: scatter?.counts.trees ?? 0,
        rocks: scatter?.counts.rocks ?? 0,
      };
    },

    dispose() {
      endShot();
      corruption.dispose();
      fog.dispose();
      fly.dispose();
      controls.dispose();
      clearOverlays();
      fx.dispose();
      terrain?.dispose();
      scatter?.dispose();
      water?.dispose();
      disposeEntityMaterials();
      world.dispose();
    },
  };
}
