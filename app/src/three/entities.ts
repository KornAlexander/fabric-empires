/**
 * Units and cities as physical objects.
 *
 * These are built from primitives rather than modelled, which is the honest
 * constraint of having no artist and no asset budget. What makes them read
 * as real is not the silhouette but the material response: metal that is
 * actually metallic, paint that is actually rough, real shadows underneath,
 * and the same environment lighting that the ground gets.
 *
 * The faction colour appears as painted panels and an emissive strip, not as
 * a flat tint over the whole object, because a uniformly coloured object
 * looks like a game token and a painted machine looks like a machine.
 */

import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Color,
  ConeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  type BufferGeometry,
} from 'three';
import { cityKind, unitType, type City, type Unit } from '@fabric-empires/engine';

const materialCache = new Map<string, MeshStandardMaterial>();

function material(
  key: string,
  build: () => MeshStandardMaterial,
): MeshStandardMaterial {
  const cached = materialCache.get(key);
  if (cached) return cached;
  const made = build();
  materialCache.set(key, made);
  return made;
}

const steel = () =>
  material(
    'steel',
    () =>
      new MeshStandardMaterial({
        color: new Color('#8d9299'),
        metalness: 0.92,
        roughness: 0.36,
        envMapIntensity: 1,
      }),
  );

const darkSteel = () =>
  material(
    'darkSteel',
    () =>
      new MeshStandardMaterial({
        color: new Color('#3b4046'),
        metalness: 0.85,
        roughness: 0.48,
      }),
  );

const concrete = () =>
  material(
    'concrete',
    () =>
      new MeshStandardMaterial({
        color: new Color('#9a958c'),
        metalness: 0,
        roughness: 0.94,
      }),
  );

const glass = () =>
  material(
    'glass',
    () =>
      new MeshStandardMaterial({
        color: new Color('#1c2b36'),
        metalness: 0.1,
        roughness: 0.08,
        emissive: new Color('#ffd9a0'),
        emissiveIntensity: 0.35,
      }),
  );

function paint(colour: string): MeshStandardMaterial {
  return material(
    `paint:${colour}`,
    () =>
      new MeshStandardMaterial({
        color: new Color(colour),
        metalness: 0.25,
        roughness: 0.55,
      }),
  );
}

function emissive(colour: string): MeshStandardMaterial {
  return material(
    `emissive:${colour}`,
    () =>
      new MeshStandardMaterial({
        color: new Color(colour),
        emissive: new Color(colour),
        emissiveIntensity: 2.4,
        metalness: 0,
        roughness: 0.5,
      }),
  );
}

/*
 * The 1600 palette.
 *
 * Nothing here is metallic and nothing glows. That is the whole point: the old
 * city read as science fiction because it was concrete, glass and emission,
 * and a fortified town of this period is earth, rubble stone, lime plaster,
 * oak and fired clay.
 */
const stone = () =>
  material(
    'stone',
    () =>
      new MeshStandardMaterial({ color: new Color('#8d8578'), metalness: 0, roughness: 0.92 }),
  );

const earth = () =>
  material(
    'earth',
    () =>
      new MeshStandardMaterial({ color: new Color('#6b5c46'), metalness: 0, roughness: 1 }),
  );

const plaster = () =>
  material(
    'plaster',
    () =>
      new MeshStandardMaterial({ color: new Color('#cfc4ad'), metalness: 0, roughness: 0.88 }),
  );

const timber = () =>
  material(
    'timber',
    () =>
      new MeshStandardMaterial({ color: new Color('#59422e'), metalness: 0, roughness: 0.9 }),
  );

/** Fired clay roof tile, which is what carries the period from above. */
const tile = () =>
  material(
    'tile',
    () =>
      new MeshStandardMaterial({ color: new Color('#8c4a33'), metalness: 0, roughness: 0.82 }),
  );

const slate = () =>
  material(
    'slate',
    () =>
      new MeshStandardMaterial({ color: new Color('#4a4f57'), metalness: 0, roughness: 0.7 }),
  );

function part(geometry: BufferGeometry, mat: MeshStandardMaterial): Mesh {
  const mesh = new Mesh(geometry, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Unit chassis.
 *
 * The twelve unit types share one vocabulary of parts so they read as one
 * army rather than twelve unrelated props, and differ by the loadout on top,
 * which is the part the player actually needs to tell apart at a glance.
 */
export function buildUnit(unit: Unit, factionColour: string): Group {
  const type = unitType(unit.typeId);
  const group = new Group();

  // Tracked base, shared by everything that moves.
  const base = part(new BoxGeometry(0.52, 0.13, 0.72), darkSteel());
  base.position.y = 0.075;
  group.add(base);

  for (const side of [-1, 1]) {
    const track = part(new CylinderGeometry(0.1, 0.1, 0.7, 12), darkSteel());
    track.rotation.x = Math.PI / 2;
    track.position.set(side * 0.28, 0.1, 0);
    group.add(track);
  }

  const hull = part(new BoxGeometry(0.46, 0.2, 0.56), paint(factionColour));
  hull.position.y = 0.24;
  group.add(hull);

  // A thin emissive strip, which is what makes a unit findable in shadow.
  const strip = part(new BoxGeometry(0.48, 0.03, 0.1), emissive(factionColour));
  strip.position.set(0, 0.35, 0.2);
  group.add(strip);

  const loadout = new Group();
  loadout.position.y = 0.36;

  if (type.range > 1) {
    // Ranged: a long barrel on a turret ring.
    const ring = part(new CylinderGeometry(0.17, 0.19, 0.09, 14), steel());
    ring.position.y = 0.05;
    loadout.add(ring);
    const barrel = part(new CylinderGeometry(0.045, 0.055, 0.62, 10), steel());
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.1, 0.3);
    loadout.add(barrel);
  } else if (type.strength === 0) {
    // Civilian: a survey mast and an instrument pod.
    const mast = part(new CylinderGeometry(0.022, 0.03, 0.5, 8), steel());
    mast.position.y = 0.26;
    loadout.add(mast);
    const pod = part(new SphereGeometry(0.09, 14, 10), glass());
    pod.position.y = 0.52;
    loadout.add(pod);
  } else {
    // Melee: a hunched armoured cowl.
    const cowl = part(new CapsuleGeometry(0.15, 0.16, 6, 14), steel());
    cowl.rotation.z = Math.PI / 2;
    cowl.position.y = 0.12;
    loadout.add(cowl);
    const blade = part(new ConeGeometry(0.1, 0.34, 10), steel());
    blade.rotation.x = Math.PI / 2;
    blade.position.set(0, 0.12, 0.3);
    loadout.add(blade);
  }

  group.add(loadout);

  // Bigger units are bigger. The colossus and the titan are supposed to be
  // frightening on the field, and scale is the cheapest way to say so.
  const scale = 0.85 + Math.min(type.strength, 60) / 90;
  group.scale.setScalar(scale);

  group.userData.kind = 'unit';
  group.userData.id = unit.id;
  return group;
}

/**
 * A settlement.
 *
 * Grows with population: the same city at size 1 and size 6 should not be
 * the same object with a different number painted on it.
 */
/**
 * A fortified town, around 1600.
 *
 * ⚠️ **This replaces concrete towers with glass windows and a glowing beacon.**
 * The old city was science fiction standing in a landscape that aims at
 * plausibility, next to units and terrain from no particular century, and it
 * looked exactly as mixed up as that description sounds.
 *
 * The period is chosen, not decorative. Around 1600 is when the *trace
 * italienne* had made the high medieval curtain wall obsolete: cannon flattened
 * tall stone, so ramparts went low, thick and earthen, and corners grew angled
 * **bastions** so that every face could be covered by fire from another. That
 * is the shape being drawn here, and it is the same shape the siege is built
 * to attack: a bastioned front is a thing you have to reduce, not climb.
 *
 * All geometry, no assets. A pyramid is a four-sided cone, a bastion is a
 * three-sided cylinder, and a roof is the same trick at a different scale.
 */
export function buildCity(city: City, factionColour: string): Group {
  const group = new Group();
  const kind = cityKind(city.kind);

  // Deterministic jitter, so a town looks built rather than stamped, and looks
  // the same every time the same game is loaded.
  const seed = city.hex.q * 73856093 + city.hex.r * 19349663;
  const rand = (n: number): number => {
    const x = Math.sin(seed + n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  const RAMPART_RADIUS = 0.74;
  const RAMPART_HEIGHT = 0.2;

  /*
   * The glacis: a broad, shallow earth slope leading up to the rampart.
   *
   * Historically the point was that attackers crossing it were exposed and
   * had no cover; visually it is what stops the fort looking like a model
   * dropped on the ground.
   */
  const glacis = part(new CylinderGeometry(0.94, 1.02, 0.07, 6), earth());
  glacis.position.y = 0.035;
  glacis.rotation.y = Math.PI / 6;
  group.add(glacis);

  // The rampart itself: low, thick, and battered (wider at the base).
  const rampart = part(
    new CylinderGeometry(RAMPART_RADIUS, RAMPART_RADIUS + 0.1, RAMPART_HEIGHT, 6),
    stone(),
  );
  rampart.position.y = 0.07 + RAMPART_HEIGHT / 2;
  rampart.rotation.y = Math.PI / 6;
  group.add(rampart);

  // The courtyard, slightly lower than the wall head, so the rampart reads as
  // a wall rather than as a plinth.
  const courtyard = part(new CylinderGeometry(RAMPART_RADIUS - 0.08, RAMPART_RADIUS - 0.08, 0.14, 6), earth());
  courtyard.position.y = 0.07 + 0.07;
  courtyard.rotation.y = Math.PI / 6;
  group.add(courtyard);

  /*
   * Bastions on alternating corners: arrowhead platforms projecting from the
   * wall so their flanks can sweep the face between them. Three, not six,
   * because six on a hex reads as a cog rather than a fort.
   */
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const bastion = part(new CylinderGeometry(0.2, 0.26, RAMPART_HEIGHT + 0.03, 3), stone());
    bastion.position.set(
      Math.cos(angle) * (RAMPART_RADIUS + 0.02),
      0.07 + (RAMPART_HEIGHT + 0.03) / 2,
      Math.sin(angle) * (RAMPART_RADIUS + 0.02),
    );
    // Point the arrowhead outwards, which is the whole idea of a bastion.
    bastion.rotation.y = -angle + Math.PI / 2;
    group.add(bastion);
  }

  /*
   * Houses: a huddle of steep-roofed blocks inside the walls. Steep because
   * these are northern European tiled and thatched roofs, and because a steep
   * roof still reads as a roof from a map camera looking down at it.
   */
  const houses = Math.min(11, 3 + city.population * 2);
  for (let i = 0; i < houses; i++) {
    const angle = rand(i) * Math.PI * 2;
    const ring = 0.16 + rand(i + 40) * 0.4;
    const w = 0.13 + rand(i + 80) * 0.07;
    const d = 0.13 + rand(i + 120) * 0.06;
    const h = 0.14 + rand(i + 160) * 0.1;
    const x = Math.cos(angle) * ring;
    const z = Math.sin(angle) * ring;
    const lean = rand(i + 200) * Math.PI;

    const walls = part(new BoxGeometry(w, h, d), rand(i + 240) > 0.55 ? plaster() : timber());
    walls.position.set(x, 0.14 + h / 2, z);
    walls.rotation.y = lean;
    group.add(walls);

    const roof = part(new ConeGeometry(Math.max(w, d) * 0.82, h * 0.85, 4), tile());
    roof.position.set(x, 0.14 + h + h * 0.425, z);
    roof.rotation.y = lean + Math.PI / 4;
    group.add(roof);
  }

  /*
   * The church tower, which is what a 1600 town is recognised by from a
   * distance, and the keep in the faction's colours beside it.
   */
  const towerHeight = 0.42 + city.population * 0.05;
  const tower = part(new BoxGeometry(0.16, towerHeight, 0.16), stone());
  tower.position.set(-0.12, 0.14 + towerHeight / 2, 0.06);
  group.add(tower);

  const spire = part(new ConeGeometry(0.13, 0.28, 4), slate());
  spire.position.set(-0.12, 0.14 + towerHeight + 0.14, 0.06);
  spire.rotation.y = Math.PI / 4;
  group.add(spire);

  const keepHeight = 0.3 + city.population * 0.05;
  const keep = part(new CylinderGeometry(0.15, 0.18, keepHeight, 8), stone());
  keep.position.set(0.16, 0.14 + keepHeight / 2, -0.08);
  group.add(keep);

  const keepRoof = part(new ConeGeometry(0.2, 0.18, 8), tile());
  keepRoof.position.set(0.16, 0.14 + keepHeight + 0.09, -0.08);
  group.add(keepRoof);

  /*
   * The banner. It replaces an emissive sphere, which was the single most
   * science-fiction thing on the map, and it does the same job: says whose
   * town this is, from above, at a glance.
   */
  const pole = part(new CylinderGeometry(0.008, 0.008, 0.26, 6), timber());
  pole.position.set(0.16, 0.14 + keepHeight + 0.3, -0.08);
  group.add(pole);

  const banner = part(new BoxGeometry(0.13, 0.08, 0.006), paint(factionColour));
  banner.position.set(0.16 + 0.065, 0.14 + keepHeight + 0.36, -0.08);
  group.add(banner);

  // Bigger kinds sit on a broader footprint, which is the readability aid the
  // old platform scale used to provide.
  const footprint = 0.92 + (kind.baseHp / 120) * 0.3;
  group.scale.setScalar(footprint);

  group.userData.kind = 'city';
  group.userData.id = city.id;
  return group;
}

/** Release every cached material. Called when the renderer is torn down. */
export function disposeEntityMaterials(): void {
  for (const mat of materialCache.values()) mat.dispose();
  materialCache.clear();
}

/** Recursively enable shadows on an imported or built object. */
export function enableShadows(object: Object3D): void {
  object.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}
