import { describe, expect, it } from 'vitest';
import { generateMap, hexKey, isPassableByLand, type GameMap } from '../src/index.js';

/**
 * Archipelago generation.
 *
 * ⚠️ Off by default until ships exist, so without these tests the whole
 * capability would quietly rot: nothing else in the suite ever asks for more
 * than one island.
 */
function landmasses(map: GameMap): number[] {
  const seen = new Set<string>();
  const sizes: number[] = [];
  const neighbours = (h: { q: number; r: number }) =>
    [
      { q: h.q + 1, r: h.r },
      { q: h.q + 1, r: h.r - 1 },
      { q: h.q, r: h.r - 1 },
      { q: h.q - 1, r: h.r },
      { q: h.q - 1, r: h.r + 1 },
      { q: h.q, r: h.r + 1 },
    ];

  for (const tile of map.tiles.values()) {
    if (!isPassableByLand(tile.terrain)) continue;
    const key = hexKey(tile.hex);
    if (seen.has(key)) continue;
    const stack = [tile.hex];
    seen.add(key);
    let size = 0;
    while (stack.length > 0) {
      const current = stack.pop()!;
      size++;
      for (const next of neighbours(current)) {
        const nextKey = hexKey(next);
        if (seen.has(nextKey)) continue;
        const nextTile = map.tiles.get(nextKey);
        if (!nextTile || !isPassableByLand(nextTile.terrain)) continue;
        seen.add(nextKey);
        stack.push(next);
      }
    }
    sizes.push(size);
  }
  return sizes.sort((a, b) => b - a);
}

const ARCHIPELAGO = { islands: 5, landFraction: 0.3, minIslandSize: 12 } as const;
const SEEDS = ['FABRIC', 'CONTOSO', 'DP600', 'HORDE'];

describe('archipelago generation', () => {
  it('really does break the land into separate islands', () => {
    /*
     * The assertion the whole feature turns on. Raising the noise frequency,
     * lowering the land fraction and steepening the falloff were all measured
     * first and every combination still left one continent holding 97 to 100
     * percent of the land, because classification is by quantile and fbm is
     * dominated by its lowest octave. Only a multi-centre mask separates them.
     */
    for (const seed of SEEDS) {
      const sizes = landmasses(generateMap(seed, ARCHIPELAGO));
      const real = sizes.filter((s) => s >= ARCHIPELAGO.minIslandSize);
      expect(real.length, `${seed} should be an archipelago, got ${sizes.join(',')}`).toBeGreaterThan(2);
    }
  });

  it('leaves a home island big enough to be an empire', () => {
    for (const seed of SEEDS) {
      const sizes = landmasses(generateMap(seed, ARCHIPELAGO));
      expect(sizes[0], seed).toBeGreaterThan(150);
    }
  });

  it('does not let one island swallow the world', () => {
    for (const seed of SEEDS) {
      const sizes = landmasses(generateMap(seed, ARCHIPELAGO));
      const total = sizes.reduce((a, b) => a + b, 0);
      expect(sizes[0]! / total, seed).toBeLessThan(0.75);
    }
  });

  it('leaves plenty of open water to sail', () => {
    for (const seed of SEEDS) {
      const map = generateMap(seed, ARCHIPELAGO);
      const land = [...map.tiles.values()].filter((t) => isPassableByLand(t.terrain)).length;
      expect(land / map.tiles.size, seed).toBeLessThan(0.4);
    }
  });

  it('one island reproduces the single continent exactly', () => {
    // The old behaviour is the special case, not a separate code path.
    const sizes = landmasses(generateMap('FABRIC', { islands: 1, minIslandSize: 12 }));
    expect(sizes.filter((s) => s >= 12)).toHaveLength(1);
  });

  it('is deterministic, like everything else the seed decides', () => {
    const a = landmasses(generateMap('FABRIC', ARCHIPELAGO));
    const b = landmasses(generateMap('FABRIC', ARCHIPELAGO));
    expect(a).toEqual(b);
    expect(a).not.toEqual(landmasses(generateMap('CONTOSO', ARCHIPELAGO)));
  });
});
