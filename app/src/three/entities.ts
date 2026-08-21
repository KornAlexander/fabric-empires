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
export function buildCity(city: City, factionColour: string): Group {
  const group = new Group();
  const kind = cityKind(city.kind);

  const platform = part(new CylinderGeometry(0.82, 0.9, 0.12, 6), concrete());
  platform.position.y = 0.06;
  platform.rotation.y = Math.PI / 6;
  group.add(platform);

  const towers = Math.min(9, 2 + city.population);
  for (let i = 0; i < towers; i++) {
    const angle = (i / towers) * Math.PI * 2 + city.hex.q * 0.7;
    const ring = i === 0 ? 0 : 0.34 + (i % 3) * 0.13;
    const height = 0.3 + ((i * 37) % 11) / 11 * 0.55 + city.population * 0.06;
    const width = 0.17 + ((i * 53) % 7) / 7 * 0.1;

    const tower = part(new BoxGeometry(width, height, width), concrete());
    tower.position.set(Math.cos(angle) * ring, 0.12 + height / 2, Math.sin(angle) * ring);
    tower.rotation.y = angle;
    group.add(tower);

    // Lit windows, which is what says "inhabited" rather than "monument".
    const windows = part(new BoxGeometry(width * 0.72, height * 0.5, width * 0.72), glass());
    windows.position.copy(tower.position);
    windows.rotation.y = angle;
    group.add(windows);
  }

  // The keep, painted in the faction colour.
  const keepHeight = 0.5 + city.population * 0.1;
  const keep = part(new CylinderGeometry(0.22, 0.28, keepHeight, 8), paint(factionColour));
  keep.position.y = 0.12 + keepHeight / 2;
  group.add(keep);

  const beacon = part(new SphereGeometry(0.085, 14, 10), emissive(factionColour));
  beacon.position.y = 0.12 + keepHeight + 0.09;
  group.add(beacon);

  // A blunt readability aid: the taller the keep, the bigger the city, and
  // the kind is legible from the platform footprint.
  const footprint = 0.9 + (kind.baseHp / 120) * 0.35;
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
