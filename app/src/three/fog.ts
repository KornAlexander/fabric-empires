/**
 * Fog of war, as two merged layers.
 *
 * ⚠️ **One mesh per state, not one per hex.** Unexplored ground is most of the
 * map: about 6,000 hexes on a standard world at the start of a game. Six
 * thousand meshes is six thousand draw calls for something that is, visually, a
 * single flat colour, and it would cost more than the terrain underneath it.
 * Merging is what makes the layer free to draw.
 *
 * The two layers are genuinely different things, which is why they are not one:
 *
 *   - **unseen** is opaque. There is nothing to look at, so nothing is drawn
 *     through it and the shape of the coastline stays secret.
 *   - **remembered** is translucent and cool, so the ground reads as known but
 *     stale. Units standing on it are hidden by the renderer rather than by
 *     this layer, because "I remember the hill, not who is on it now" is the
 *     whole distinction fog of war exists to draw.
 */

import {
  Color,
  Mesh,
  MeshBasicMaterial,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hexLid, type Terrain } from './terrain.js';
import type { Hex } from '@fabric-empires/engine';

export interface FogLayer {
  /** Replace both layers. Pass the hexes, not the whole map. */
  set(unseen: readonly Hex[], remembered: readonly Hex[], terrain: Terrain): void;
  readonly meshes: readonly Mesh[];
  dispose(): void;
}

export function createFog(
  onChange: (added: readonly Mesh[], removed: readonly Mesh[]) => void,
): FogLayer {
  /*
   * Clear of the ground, not hugging it.
   *
   * ⚠️ `hexLid` already lays the tile above the highest point it can find
   * inside the hex, so this is only a margin for what the nineteen samples
   * miss. Erosion can cut and heap by nearly a metre in world units, and a
   * lid that dips below the surface at one point is a bright hole in the fog.
   */
  const LIFT = 0.12;

  const unseenMaterial = new MeshBasicMaterial({
    color: new Color('#05070a'),
    transparent: false,
    depthWrite: true,
  });

  const rememberedMaterial = new MeshBasicMaterial({
    color: new Color('#0b1622'),
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });

  let meshes: Mesh[] = [];
  let geometries: BufferGeometry[] = [];

  function clear(): void {
    const removed = meshes;
    meshes = [];
    for (const geometry of geometries) geometry.dispose();
    geometries = [];
    if (removed.length > 0) onChange([], removed);
  }

  function build(hexes: readonly Hex[], terrain: Terrain, material: MeshBasicMaterial):
    | { mesh: Mesh; geometry: BufferGeometry }
    | undefined {
    if (hexes.length === 0) return undefined;
    const patches = hexes.map((hex) => hexLid(hex, terrain, LIFT));
    const merged = mergeGeometries(patches, false);
    for (const patch of patches) patch.dispose();
    if (!merged) return undefined;

    const mesh = new Mesh(merged, material);
    // Above the corruption layer (2) and the grid, below nothing.
    mesh.renderOrder = 4;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return { mesh, geometry: merged };
  }

  return {
    set(unseen, remembered, terrain) {
      clear();

      const added: Mesh[] = [];
      for (const [hexes, material] of [
        [unseen, unseenMaterial],
        [remembered, rememberedMaterial],
      ] as const) {
        const built = build(hexes, terrain, material);
        if (!built) continue;
        meshes.push(built.mesh);
        geometries.push(built.geometry);
        added.push(built.mesh);
      }

      if (added.length > 0) onChange(added, []);
    },

    get meshes() {
      return meshes;
    },

    dispose() {
      clear();
      unseenMaterial.dispose();
      rememberedMaterial.dispose();
    },
  };
}
