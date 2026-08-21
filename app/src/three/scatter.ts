/**
 * Scattered ground cover: trees, scrub and boulders.
 *
 * This is the cheapest large gain in perceived realism available here. Bare
 * shaded ground reads as a model of a landscape; the same ground with things
 * standing on it reads as a place, because the props give the eye a sense of
 * scale that a smooth surface cannot.
 *
 * Everything is instanced. One draw call per prop type covers the whole map,
 * so several thousand objects cost roughly what one costs.
 */

import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hexKey, type GameMap, type TerrainId } from '@fabric-empires/engine';
import { hexToWorld, type Terrain } from './terrain.js';
import { fbm2 } from './noise.js';

/**
 * How much of each terrain is covered, and by what.
 *
 * Density is props per tile. The numbers are deliberately uneven: an evenly
 * vegetated world looks synthetic, and the contrast between a wooded plain
 * and a bare quarry is what makes the biomes legible from the air.
 */
interface Cover {
  readonly trees: number;
  readonly rocks: number;
}

const COVER: Readonly<Record<TerrainId, Cover>> = Object.freeze({
  onelake: { trees: 0, rocks: 0 },
  rawFilePlains: { trees: 3.2, rocks: 0.25 },
  deltaHighlands: { trees: 0.5, rocks: 1.1 },
  parquetQuarry: { trees: 0.1, rocks: 2.2 },
  legacySwamp: { trees: 2.4, rocks: 0.1 },
  semanticPeaks: { trees: 0, rocks: 2.6 },
  geothermalVent: { trees: 0, rocks: 1.4 },
  ungovernedWastes: { trees: 0.2, rocks: 0.9 },
});

/** Deterministic per-tile, per-index random in 0..1. */
function rand(q: number, r: number, salt: number): number {
  let n = (Math.imul(q, 374761393) + Math.imul(r, 668265263) + Math.imul(salt, 2246822519)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** A conifer: trunk plus three stacked skirts. */
function treeGeometry(): BufferGeometry {
  const trunk = new CylinderGeometry(0.022, 0.032, 0.16, 5);
  trunk.translate(0, 0.08, 0);

  const parts: BufferGeometry[] = [trunk];
  const skirts = [
    { r: 0.12, h: 0.2, y: 0.19 },
    { r: 0.095, h: 0.18, y: 0.3 },
    { r: 0.065, h: 0.16, y: 0.4 },
  ];
  for (const s of skirts) {
    const cone = new ConeGeometry(s.r, s.h, 7);
    cone.translate(0, s.y, 0);
    parts.push(cone);
  }
  return mergeGeometries(parts, false)!;
}

/** A boulder: one lumpy solid, squashed so it does not read as a ball. */
function rockGeometry(): BufferGeometry {
  const rock = new DodecahedronGeometry(0.1, 0);
  rock.scale(1, 0.62, 0.85);
  rock.translate(0, 0.045, 0);
  return rock;
}

export interface Scatter {
  readonly group: Group;
  readonly counts: { trees: number; rocks: number };
  dispose(): void;
}

export function buildScatter(map: GameMap, terrain: Terrain): Scatter {
  const group = new Group();

  const trunkMaterial = new MeshStandardMaterial({
    color: new Color('#4a5f3a'),
    roughness: 0.95,
    metalness: 0,
  });
  const rockMaterial = new MeshStandardMaterial({
    color: new Color('#7c7970'),
    roughness: 0.92,
    metalness: 0,
  });

  const treeSlots: Matrix4[] = [];
  const rockSlots: Matrix4[] = [];

  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  const up = new Vector3(0, 1, 0);

  for (const tile of map.tiles.values()) {
    const cover = COVER[tile.terrain];
    if (cover.trees <= 0 && cover.rocks <= 0) continue;
    // Water tiles and anything below the waterline get nothing.
    if (terrain.heightAt(tile.hex) < 0.06) continue;

    const centre = hexToWorld(tile.hex);
    const key = hexKey(tile.hex);
    void key;

    // A slow noise field modulates density, so woodland forms patches rather
    // than an even sprinkle at exactly the tile rate.
    const clump = fbm2(centre.x * 0.09, centre.z * 0.09, { octaves: 3, seed: 77 });

    const place = (count: number, slots: Matrix4[], salt: number, isTree: boolean) => {
      const scaled = count * (isTree ? 0.35 + clump * 1.5 : 0.6 + clump * 0.8);
      const whole = Math.floor(scaled);
      const extra = rand(tile.hex.q, tile.hex.r, salt) < scaled - whole ? 1 : 0;
      for (let i = 0; i < whole + extra; i++) {
        const a = rand(tile.hex.q, tile.hex.r, salt + i * 17);
        const b = rand(tile.hex.q, tile.hex.r, salt + i * 17 + 5);
        const c = rand(tile.hex.q, tile.hex.r, salt + i * 17 + 11);
        // Rejection-free disc sampling, inset so nothing straddles an edge.
        const radius = 0.78 * Math.sqrt(a);
        const angle = b * Math.PI * 2;
        const x = centre.x + radius * Math.cos(angle);
        const z = centre.z + radius * Math.sin(angle);
        const y = terrain.sampleHeight(x, z);
        if (y < 0.05) continue;

        position.set(x, y - 0.02, z);
        quaternion.setFromAxisAngle(up, c * Math.PI * 2);
        const size = isTree ? 0.72 + c * 0.85 : 0.5 + c * 1.3;
        scale.set(size, isTree ? size * (0.85 + a * 0.5) : size * (0.7 + a * 0.6), size);
        slots.push(new Matrix4().compose(position, quaternion, scale));
      }
    };

    place(cover.trees, treeSlots, 101, true);
    place(cover.rocks, rockSlots, 811, false);
  }

  const treeGeo = treeGeometry();
  const rockGeo = rockGeometry();

  if (treeSlots.length > 0) {
    const trees = new InstancedMesh(treeGeo, trunkMaterial, treeSlots.length);
    trees.castShadow = true;
    trees.receiveShadow = true;
    for (let i = 0; i < treeSlots.length; i++) trees.setMatrixAt(i, treeSlots[i]!);
    trees.instanceMatrix.needsUpdate = true;
    // Instanced meshes have no useful bounding sphere until it is computed,
    // and without one three culls the whole batch as soon as the origin
    // leaves the frustum: the forest vanishes when the camera pans.
    trees.computeBoundingSphere();
    group.add(trees);
  }

  if (rockSlots.length > 0) {
    const rocks = new InstancedMesh(rockGeo, rockMaterial, rockSlots.length);
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    for (let i = 0; i < rockSlots.length; i++) rocks.setMatrixAt(i, rockSlots[i]!);
    rocks.instanceMatrix.needsUpdate = true;
    rocks.computeBoundingSphere();
    group.add(rocks);
  }

  return {
    group,
    counts: { trees: treeSlots.length, rocks: rockSlots.length },
    dispose() {
      treeGeo.dispose();
      rockGeo.dispose();
      trunkMaterial.dispose();
      rockMaterial.dispose();
    },
  };
}
