/**
 * Fog of war, as two merged layers.
 *
 * ⚠️ **One mesh per state, not one per hex.** Unexplored ground is most of the
 * map: about 6,000 hexes on a standard world at the start of a game. Six
 * thousand meshes is six thousand draw calls for something that is, visually, a
 * single sheet, and it would cost more than the terrain underneath it.
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
 *
 * ⚠️ **It was a flat plate, and it read as a hole rather than as weather.**
 * Measured on screen, the near fog was rgb(9, 13, 19) against sunlit land at
 * rgb(126, 120, 100): nine times darker, with a luminance standard deviation
 * of 2 in 255 across the whole sheet, which is below anything an eye resolves.
 * Both numbers had a cause, and neither cause was the colour written down.
 * See the notes on `FRAGMENT` and `VERTEX` for what replaced it.
 */

import {
  Color,
  Mesh,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  type BufferGeometry,
  type IUniform,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { hexLid, type Terrain } from './terrain.js';
import type { Hex } from '@fabric-empires/engine';

export interface FogLayer {
  /** Replace both layers. Pass the hexes, not the whole map. */
  set(unseen: readonly Hex[], remembered: readonly Hex[], terrain: Terrain): void;
  /** Advance the drift. Fog that does not move is a painted backdrop. */
  update(deltaSeconds: number): void;
  readonly meshes: readonly Mesh[];
  dispose(): void;
}

/**
 * The shared noise, and the one rule that keeps the sheet seamless.
 *
 * ⚠️ **Sampled on world XZ, never on anything per-hex.** Two neighbouring lids
 * own separate copies of the vertices along the edge they share, so any value
 * derived from a hex id, a local coordinate or a vertex index would differ
 * across that seam and draw a line down it. World position is identical for
 * both copies by construction, which is the same argument that fixed the lid
 * heights in section 78.8, and it holds for colour and for displacement too.
 */
const NOISE = `
float feHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float feNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(feHash(i), feHash(i + vec2(1.0, 0.0)), u.x),
             mix(feHash(i + vec2(0.0, 1.0)), feHash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float feFbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * feNoise(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

// The bank: two drifts crossing at different speeds and directions, which is
// how you get something that curls without simulating anything.
float feBillow(vec2 world, float time) {
  float slow = feFbm(world * 0.075 + vec2(time * 0.010, time * 0.006));
  float fast = feFbm(world * 0.190 - vec2(time * 0.021, time * 0.005));
  return clamp(slow * 0.70 + fast * 0.30, 0.0, 1.0);
}
`;

/**
 * ⚠️ **Displacement is upward only, and that is a correctness rule, not taste.**
 *
 * A rolling top is the strongest single cue that this is weather rather than a
 * lid, and it is nearly free: the same noise the colour uses, added to Y. But
 * the lid sits at the hex's own peak precisely so nothing beneath it can be
 * seen, so a downward displacement would sink it into the hillside and open a
 * window onto unexplored ground. `max(0.0, ...)` is the whole guard, and the
 * height is added rather than mixed so the floor can never rise.
 */
const VERTEX = `
#include <common>
#include <fog_pars_vertex>

uniform float uTime;
uniform float uBillowHeight;
varying vec3 vWorld;
varying float vBillow;

${NOISE}

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vBillow = feBillow(world.xz, uTime);
  world.y += max(0.0, vBillow) * uBillowHeight;
  vWorld = world.xyz;

  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;

  #include <fog_vertex>
}
`;

/**
 * ⚠️ **Colours here are LINEAR, and that is why the old ones were invisible.**
 *
 * The sheet was authored as the hex `#171f29` and read back off the screen at
 * rgb(9, 13, 19). Nothing was broken: an unlit material emits its colour into
 * a pipeline with ACES filmic tone mapping at exposure 0.78, and that curve
 * crushes darks hard. Choosing a fog colour in a hex editor is choosing it in
 * a space nobody ever sees it in.
 *
 * The same arithmetic explains the flatness. The old mottling multiplied that
 * colour by 1 ± 0.11, and eleven percent of a value landing near 13/255 is a
 * swing of one unit, under the quantisation of the framebuffer. The variation
 * was real, recomputed for every vertex, and mathematically incapable of being
 * seen. A brightness range only exists where there is brightness to range over.
 */
const FRAGMENT = `
#include <common>
#include <fog_pars_fragment>

uniform float uTime;
uniform vec3 uTrough;
uniform vec3 uCrest;
uniform float uOpacity;
varying vec3 vWorld;
varying float vBillow;

${NOISE}

void main() {
  /*
   * The vertex carries the shape of the bank; this adds detail finer than
   * thirteen vertices per hex could ever hold. Fog is lit by light bouncing
   * around inside it, so the thick parts are the BRIGHT parts: crest and
   * height come from the same number, which is what stops the shading
   * contradicting the silhouette.
   */
  float detail = feFbm(vWorld.xz * 0.52 + vec2(uTime * 0.014, -uTime * 0.011));
  float density = clamp(vBillow * 0.78 + detail * 0.22, 0.0, 1.0);

  /*
   * ⚠️ **A third octave that only exists near the camera.**
   *
   * Everything above is sized for looking at the map: features every few
   * hexes. Zoomed right in, the visible ground is a couple of world units
   * across, the low frequencies are all but constant over it, and the sheet
   * goes back to being a flat pane, which is most of what was wrong with it
   * before.
   *
   * Simply adding a high frequency everywhere is the wrong fix: at map zoom it
   * lands well under a pixel per feature and crawls. Weighting it by distance
   * gives detail exactly where there is screen area to show it, and none where
   * it would alias.
   *
   * NOTE: no backticks anywhere in this file's GLSL. These shaders live in
   * template literals, so a backtick in a comment ends the string and the
   * error surfaces as a TypeScript syntax error a hundred lines away.
   *
   * cameraPosition is one of the uniforms three provides to every shader, so
   * this costs nothing to obtain.
   */
  float closeness = 1.0 - smoothstep(6.0, 34.0, distance(vWorld, cameraPosition));
  if (closeness > 0.0) {
    float fine = feFbm(vWorld.xz * 2.30 + vec2(uTime * 0.030, uTime * 0.017));
    density = clamp(density + (fine - 0.5) * 0.42 * closeness, 0.0, 1.0);
  }

  density = smoothstep(0.18, 0.88, density);

  vec3 colour = mix(uTrough, uCrest, density);
  gl_FragColor = vec4(colour, uOpacity);

  #include <fog_fragment>
}
`;

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
   * How high the bank rolls above the ground it covers, in world units.
   *
   * A hex is about 1.73 units across, so this is a swell of roughly two thirds
   * of a tile: enough to give the sheet a horizon and a silhouette, small
   * enough that it never reads as terrain of its own.
   *
   * ⚠️ **Remembered ground gets almost none of it.** That layer is a veil over
   * ground the player has actually walked, and lifting a veil clear of its own
   * hillside makes it look like a separate object floating above the map. It
   * keeps a trace, so it is not a perfectly flat pane, and no more.
   */
  const UNSEEN_BILLOW = 1.15;
  const REMEMBERED_BILLOW = 0.14;

  /*
   * Linear, and tuned against measured screenshots rather than picked by eye.
   * See the note on FRAGMENT for why these are not hex strings.
   *
   *   trough  the thin gaps between banks, clearly darker than any land
   *   crest   the thick tops, still well below sunlit ground so the explored
   *           island stays the brightest thing in the frame
   *
   * Read back off the deployed build, near fog against the land beside it:
   *
   * | version | fog luminance | fog variation (sd) |
   * | --- | --- | --- |
   * | the flat plate | 12 | 2.1 |
   * | first pass | 43 | 4.1 |
   * | wider trough-to-crest | 48 | 7.1 |
   * | **shipped** | **55** | **10.1** |
   *
   * Sunlit land measures 121 throughout, so the island keeps better than
   * twice the fog's brightness and three times its local contrast. ⚠️ That
   * ratio is the actual constraint, not the fog's own number: an earlier
   * attempt recorded in this file took the sheet to lightness 0.20 and lost
   * the island inside it, which is a different failure from the black one and
   * no more readable.
   */
  const UNSEEN_TROUGH = new Color().setRGB(0.014, 0.019, 0.028);
  const UNSEEN_CREST = new Color().setRGB(0.235, 0.278, 0.340);
  const REMEMBERED_TROUGH = new Color().setRGB(0.030, 0.038, 0.050);
  const REMEMBERED_CREST = new Color().setRGB(0.120, 0.145, 0.180);

  function makeMaterial(opts: {
    trough: Color;
    crest: Color;
    opacity: number;
    billowHeight: number;
    transparent: boolean;
  }): ShaderMaterial {
    /*
     * ⚠️ A raw `ShaderMaterial` gets no distance haze for free. `UniformsLib.fog`
     * plus `fog: true` is what makes the renderer keep `fogColor` and
     * `fogDensity` up to date, and the two chunks in the shaders are what use
     * them. Without it this sheet would be the one surface in the scene that
     * ignores distance, staying sharp out to the horizon while the land beside
     * it hazes away. That haze is also load-bearing here: measured, it is what
     * lifted the far fog from rgb(9,13,19) to rgb(38,43,48), which is why the
     * old fog only ever looked like fog when it was a long way off.
     */
    const uniforms: Record<string, IUniform> = UniformsUtils.merge([
      UniformsLib.fog,
      {
        uTime: { value: 0 },
        uTrough: { value: new Color() },
        uCrest: { value: new Color() },
        uOpacity: { value: opts.opacity },
        uBillowHeight: { value: opts.billowHeight },
      },
    ]);
    (uniforms.uTrough!.value as Color).copy(opts.trough);
    (uniforms.uCrest!.value as Color).copy(opts.crest);

    return new ShaderMaterial({
      uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: opts.transparent,
      depthWrite: !opts.transparent,
      fog: true,
    });
  }

  const unseenMaterial = makeMaterial({
    trough: UNSEEN_TROUGH,
    crest: UNSEEN_CREST,
    opacity: 1,
    billowHeight: UNSEEN_BILLOW,
    transparent: false,
  });

  const rememberedMaterial = makeMaterial({
    trough: REMEMBERED_TROUGH,
    crest: REMEMBERED_CREST,
    opacity: 0.58,
    billowHeight: REMEMBERED_BILLOW,
    transparent: true,
  });

  const materials = [unseenMaterial, rememberedMaterial];

  let meshes: Mesh[] = [];
  let geometries: BufferGeometry[] = [];
  let time = 0;

  function clear(): void {
    const removed = meshes;
    meshes = [];
    for (const geometry of geometries) geometry.dispose();
    geometries = [];
    if (removed.length > 0) onChange([], removed);
  }

  function build(hexes: readonly Hex[], terrain: Terrain, material: ShaderMaterial):
    | { mesh: Mesh; geometry: BufferGeometry }
    | undefined {
    if (hexes.length === 0) return undefined;
    const patches = hexes.map((hex) => hexLid(hex, terrain, LIFT, SKIRT));
    const merged = mergeGeometries(patches, false);
    for (const patch of patches) patch.dispose();
    if (!merged) return undefined;

    const mesh = new Mesh(merged, material);
    // Above the corruption layer (2) and the grid, below nothing.
    mesh.renderOrder = 4;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    /*
     * ⚠️ The bank rolls above the lid, so the drawn surface is taller than the
     * geometry claims. Three culls against the bounding sphere and would pop
     * the whole sheet out of view at grazing angles; growing the sphere by the
     * displacement is cheaper and more honest than turning culling off.
     */
    merged.computeBoundingSphere();
    if (merged.boundingSphere) merged.boundingSphere.radius += UNSEEN_BILLOW;
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

    update(deltaSeconds) {
      time += deltaSeconds;
      for (const material of materials) {
        material.uniforms.uTime!.value = time;
      }
    },

    get meshes() {
      return meshes;
    },

    dispose() {
      clear();
      for (const material of materials) material.dispose();
    },
  };
}
