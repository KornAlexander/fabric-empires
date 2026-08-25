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
  BufferAttribute,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { fbm2 } from './noise.js';
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
   * ⚠️ `hexLid` follows the surface around its rim and rides the hex's own
   * peak at the centre, so this is only a margin against sampling error, and
   * it wants to stay small: every unit of lift is a lip standing above the
   * visible ground wherever fog meets explored terrain.
   */
  const LIFT = 0.12;

  /**
   * How far each lid's rim hangs below itself. Zero, now.
   *
   * ⚠️ **This was 4, and the cure had become the disease.**
   *
   * Lids used to be flat plates at each hex's own peak, so neighbours whose
   * peaks differed left an open vertical slot along their shared edge, and a
   * deep skirt was the way to close it. On steep ground that showed: a four
   * unit wall between two plates at different heights is not hidden, it IS
   * the picture, and unexplored mountains read as a flight of dark slate
   * steps with one thick band per tile boundary.
   *
   * `hexLid` now samples its rim at the corner and edge-midpoint positions two
   * neighbours share, so both compute the same heights and the lids simply
   * join. There is no slot left to close.
   *
   * ⚠️ Which makes a skirt worse than useless. Measured at 0.5 it still cost
   * **147,600 of the fog's 221,400 triangles**, every one of them hanging
   * below the neighbouring lid's own surface and therefore buried by the
   * depth test. Two thirds of the layer, drawing nothing. At zero the fog is
   * 73,800 triangles: smoother than the banded version AND a third of the
   * geometry it started with.
   */
  const SKIRT = 0;

  /**
   * Fog is scattered light, so it is not black.
   *
   * The unseen layer was `#05070a`, lightness 0.03. That is not weather, it is
   * a hole cut in the world, and it is the same mistake section 41 already
   * corrected once for the atmosphere: "the old colour was a mid blue at
   * lightness 0.44, which darkened the distance instead of washing it out, and
   * dark distance reads as a storm rather than as depth".
   *
   * ⚠️ Not taken all the way to the sky's own pale haze, deliberately, and the
   * first attempt at this proved the point. Real fog at this hour would be
   * brighter than the ground, and the unexplored region is most of the board:
   * at lightness 0.20 the sheet became the brightest thing on screen and the
   * explored island was lost inside it, which is a different failure from the
   * black one but no more readable. Distance is left to the scene's own
   * `FogExp2`, which these unlit materials already respect, and which pulls
   * the far field towards the sky on its own without help here.
   *
   * So: several times lighter than the void it replaces, still clearly darker
   * than land the player has actually uncovered.
   */
  const UNSEEN = '#171f29';
  const REMEMBERED = '#141d28';

  /** Roughly one cloud feature per fifteen hexes. */
  const MOTTLE_SCALE = 0.07;
  /** Peak-to-peak brightness swing across the sheet. */
  const MOTTLE_STRENGTH = 0.22;
  /** How much darker the bottom of a skirt is than its lid. */
  const SKIRT_SHADE = 0.5;

  const unseenMaterial = new MeshBasicMaterial({
    color: new Color(UNSEEN),
    transparent: false,
    depthWrite: true,
    vertexColors: true,
    // ⚠️ The skirt is a vertical wall seen from either side depending on which
    // neighbour is taller. Rather than re-derive the winding that already cost
    // a long hunt above, let both faces draw: this material is unlit, so
    // double-siding costs no shading and changes no draw call.
    side: DoubleSide,
  });

  const rememberedMaterial = new MeshBasicMaterial({
    color: new Color(REMEMBERED),
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    vertexColors: true,
    side: DoubleSide,
  });

  /**
   * Break the flat colour up so the sheet reads as a bank rather than a plate.
   *
   * Sampled on world XZ, so neighbouring lids agree wherever they share a
   * corner and the mottling runs continuously across the whole layer instead
   * of stopping at every hex. The vertical term darkens the skirt towards its
   * base, which is the only depth cue an unlit material can carry.
   */
  function mottle(geometry: BufferGeometry): void {
    const position = geometry.getAttribute('position');
    let top = -Infinity;
    for (let i = 0; i < position.count; i += 1) {
      top = Math.max(top, position.getY(i));
    }

    const shades = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i += 1) {
      const n = fbm2(
        position.getX(i) * MOTTLE_SCALE,
        position.getZ(i) * MOTTLE_SCALE,
        { octaves: 3 },
      );
      const depth = SKIRT > 0 ? Math.min(1, (top - position.getY(i)) / SKIRT) : 0;
      const shade = (1 + (n - 0.5) * MOTTLE_STRENGTH) * (1 - depth * SKIRT_SHADE);
      shades[i * 3] = shade;
      shades[i * 3 + 1] = shade;
      shades[i * 3 + 2] = shade;
    }
    geometry.setAttribute('color', new BufferAttribute(shades, 3));
  }

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
    const patches = hexes.map((hex) => hexLid(hex, terrain, LIFT, SKIRT));
    for (const patch of patches) mottle(patch);
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
