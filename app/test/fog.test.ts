import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Color, Mesh, ShaderMaterial } from 'three';
import { hex, type Hex } from '@fabric-empires/engine';
import { createFog } from '../src/three/fog.js';
import type { Terrain } from '../src/three/terrain.js';

/*
  The fog SHEET, as opposed to the lid geometry underneath it (`fogLid.test.ts`).

  ⚠️ The defect this file exists to prevent is the one that shipped: a sheet
  that was, measured on screen, rgb(9, 13, 19) with a luminance standard
  deviation of 2 in 255. It read as a hole cut in the world rather than as
  weather, and nothing was broken. The colour was simply authored in sRGB and
  then seen through ACES filmic tone mapping at exposure 0.78, which crushes
  darks, and the mottling that was supposed to break it up multiplied a value
  near zero by 1 ± 0.11 and therefore moved it by less than one level.

  None of that can be asserted from here, because it is a fact about pixels and
  there is no GPU in this process. What CAN be pinned is everything that made
  the mistake possible in the first place, plus the rules that keep the new
  sheet from revealing ground it is supposed to hide.
*/

const source = readFileSync(
  fileURLToPath(new URL('../src/three/fog.ts', import.meta.url)),
  'utf8',
);

/** A flat terrain is enough: this file is about the sheet, not the lids. */
function flatTerrain(): Terrain {
  return {
    heightAt: () => 1,
    peakAt: () => 1,
    surfaceAt: () => 1,
    sampleHeight: () => 1,
    setGridVisible: () => {},
    triangleCount: 0,
  } as unknown as Terrain;
}

function build(unseen: Hex[], remembered: Hex[] = []) {
  const added: Mesh[] = [];
  const layer = createFog((a) => added.push(...a));
  layer.set(unseen, remembered, flatTerrain());
  return { layer, added };
}

const materialOf = (mesh: Mesh) => mesh.material as ShaderMaterial;

describe('the fog sheet', () => {
  it('builds one merged mesh per state, not one per hex', () => {
    const hexes = [hex(0, 0), hex(1, 0), hex(0, 1), hex(1, 1), hex(2, 0)];
    const { added } = build(hexes, [hex(5, 5), hex(6, 5)]);
    // Two states present, so two meshes, whatever the hex count.
    expect(added).toHaveLength(2);
  });

  it('draws nothing at all when there is nothing hidden', () => {
    const { added } = build([], []);
    expect(added).toEqual([]);
  });

  it('⚠️ keeps unseen ground fully opaque', () => {
    /*
     * The whole point of the unseen layer. If this ever goes below 1 the
     * coastline of an unexplored map becomes readable through the fog, which
     * is information the player is supposed to have to go and earn.
     */
    const { added } = build([hex(0, 0), hex(1, 0)]);
    const unseen = materialOf(added[0]!);
    expect(unseen.uniforms.uOpacity!.value).toBe(1);
    expect(unseen.transparent).toBe(false);
    expect(unseen.depthWrite).toBe(true);
  });

  it('keeps remembered ground translucent, because it is known but stale', () => {
    const { added } = build([hex(0, 0)], [hex(5, 5)]);
    const remembered = materialOf(added[1]!);
    expect(remembered.uniforms.uOpacity!.value).toBeLessThan(1);
    expect(remembered.transparent).toBe(true);
  });

  it('⚠️ displaces the bank upward only', () => {
    /*
     * The rule that lets the sheet roll at all. The lid sits at each hex's own
     * peak so nothing beneath it can be seen; a negative displacement would
     * sink it into the hillside and open a window onto unexplored terrain.
     *
     * A source check, because the displacement happens on the GPU. It is worth
     * having anyway: the clamp is one `max` that reads like a formality and
     * would be the obvious thing to delete while tidying the shader.
     */
    expect(source).toMatch(/world\.y \+= max\(0\.0, vBillow\) \* uBillowHeight/);
    expect(source, 'the height must be ADDED, never mixed towards')
      .not.toMatch(/world\.y = mix\(/);
  });

  it('⚠️ samples its noise on world position, so lids meet without a seam', () => {
    /*
     * Neighbouring lids own separate copies of the vertices along the edge
     * they share, so anything derived from a hex id, a local coordinate or a
     * vertex index differs across that seam and draws a line down it. World
     * position is identical for both copies by construction.
     */
    expect(source).toMatch(/feBillow\(world\.xz, uTime\)/);
    expect(source).toMatch(/feFbm\(vWorld\.xz \*/);
    expect(source, 'a vertex-index or uv term would break the seam')
      .not.toMatch(/feBillow\(\s*(uv|position)/);
  });

  it('⚠️ states its colours as linear values, not as hex strings', () => {
    /*
     * The original defect, stated as itself. `new Color('#171f29')` looks like
     * a considered choice and lands at rgb(9, 13, 19) once the tone curve has
     * had it. Anything written as a hex in this file is a colour chosen in a
     * space nobody ever sees it in.
     */
    const hexColours = source.match(/new Color\(\s*['"`]#/g) ?? [];
    expect(hexColours, 'fog colours must be setRGB, so they are linear').toEqual([]);
    expect(source).toMatch(/UNSEEN_CREST = new Color\(\)\.setRGB\(/);
  });

  it('⚠️ has a crest bright enough to be seen against its own trough', () => {
    /*
     * The flatness, stated as a number rather than as a hex. The old sheet's
     * range was 11 percent of a near-black value; measured, that was a swing
     * of one level in 255. Whatever the colours become, the crest has to be a
     * large multiple of the trough or the billowing is computed and invisible.
     */
    const read = (name: string): number => {
      const m = source.match(new RegExp(`${name} = new Color\\(\\)\\.setRGB\\(([^)]+)\\)`));
      const parts = m![1]!.split(',').map((v) => Number(v.trim()));
      return 0.2126 * parts[0]! + 0.7152 * parts[1]! + 0.0722 * parts[2]!;
    };
    expect(read('UNSEEN_CREST') / read('UNSEEN_TROUGH')).toBeGreaterThan(5);
  });

  it('advances its own clock, because fog that does not move is a backdrop', () => {
    const { layer, added } = build([hex(0, 0)]);
    const material = materialOf(added[0]!);
    expect(material.uniforms.uTime!.value).toBe(0);
    layer.update(0.5);
    layer.update(0.25);
    expect(material.uniforms.uTime!.value).toBeCloseTo(0.75, 6);
  });

  it('⚠️ takes the distance haze, which a raw ShaderMaterial does not get free', () => {
    /*
     * Without `fog: true` and the merged uniforms this sheet would be the one
     * surface in the scene that ignores distance, staying sharp to the horizon
     * while the land beside it hazed away. Measured, that haze is also what
     * lifted the old far fog from rgb(9,13,19) to rgb(38,43,48), which is why
     * it only ever looked like fog when it was a long way off.
     */
    const { added } = build([hex(0, 0)]);
    const material = materialOf(added[0]!);
    expect(material.fog).toBe(true);
    expect(material.uniforms.fogColor).toBeDefined();
    expect(material.uniforms.fogDensity).toBeDefined();
    expect(material.vertexShader).toContain('#include <fog_vertex>');
    expect(material.fragmentShader).toContain('#include <fog_fragment>');
  });

  it('⚠️ grows the bounding sphere by the height the bank rolls', () => {
    /*
     * The mesh is taller than its geometry claims, because the swell happens
     * in the vertex shader. Three culls on the bounding sphere and would pop
     * the whole sheet out of view at grazing angles.
     */
    const { added } = build([hex(0, 0), hex(1, 0), hex(0, 1)]);
    const sphere = added[0]!.geometry.boundingSphere;
    expect(sphere).not.toBeNull();

    const flat = added[0]!.geometry.clone();
    flat.computeBoundingSphere();
    expect(sphere!.radius).toBeGreaterThan(flat.boundingSphere!.radius);
    flat.dispose();
  });

  it('releases meshes and materials when disposed', () => {
    const removed: Mesh[] = [];
    const layer = createFog((_a, r) => removed.push(...r));
    layer.set([hex(0, 0)], [hex(4, 4)], flatTerrain());
    expect(layer.meshes).toHaveLength(2);
    layer.dispose();
    expect(layer.meshes).toHaveLength(0);
    expect(removed).toHaveLength(2);
  });

  it('does not leak the colour objects it was handed', () => {
    // The uniforms hold their own Colors, so a later tweak to one material
    // cannot reach across into the other.
    const { added } = build([hex(0, 0)], [hex(4, 4)]);
    const a = materialOf(added[0]!).uniforms.uCrest!.value as Color;
    const b = materialOf(added[1]!).uniforms.uCrest!.value as Color;
    expect(a).not.toBe(b);
  });
});
