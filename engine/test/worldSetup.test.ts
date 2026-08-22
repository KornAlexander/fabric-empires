/**
 * The presets offered on the setup screen.
 *
 * ⚠️ **A preset is a promise.** "Many small islands" has to be many small
 * islands, and every shape has to leave seven reachable factions, because each
 * faction carries one cluster of the exam: a world shape that quietly strands
 * two of them is a world shape that quietly removes two branches of DP-600
 * from the game. Neither of those failures throws, and neither shows up in any
 * other test.
 */

import { describe, expect, it } from 'vitest';
import {
  ANTAGONISTS,
  ROUGHNESS_LEVELS,
  WORLD_SHAPES,
  chooseAntagonistCamps,
  chooseStartPosition,
  createGameState,
  generateMap,
  hexKey,
  hexNeighbours,
  isPassableByLand,
  worldOptions,
  type GameMap,
} from '../src/index.js';

const SEEDS = ['FABRIC', 'DP600', 'HORDE', 'CONTOSO'];

function landmasses(map: GameMap): number[] {
  const land = new Set<string>();
  for (const tile of map.tiles.values()) {
    if (tile.terrain !== 'onelake') land.add(hexKey(tile.hex));
  }
  const seen = new Set<string>();
  const sizes: number[] = [];
  for (const key of land) {
    if (seen.has(key)) continue;
    let size = 0;
    const stack = [key];
    seen.add(key);
    while (stack.length > 0) {
      const current = stack.pop()!;
      size += 1;
      for (const n of hexNeighbours(map.tiles.get(current)!.hex)) {
        const nk = hexKey(n);
        if (land.has(nk) && !seen.has(nk)) {
          seen.add(nk);
          stack.push(nk);
        }
      }
    }
    sizes.push(size);
  }
  return sizes.sort((a, b) => b - a);
}

const everyCombination = WORLD_SHAPES.flatMap((shape) =>
  ROUGHNESS_LEVELS.flatMap((rough) =>
    SEEDS.map((seed) => ({ shape, rough, seed })),
  ),
);

describe('world presets', () => {
  it('leaves every faction reachable on land, on every combination', () => {
    for (const { shape, rough, seed } of everyCombination) {
      const map = generateMap(seed, worldOptions({ shape: shape.id, roughness: rough.id }));
      const camps = chooseAntagonistCamps(map, chooseStartPosition(map), ANTAGONISTS.length);
      const label = `${shape.id}/${rough.id}/${seed}`;

      // All seven, or a branch of the exam has no village to take.
      expect(camps, `${label} camp count`).toHaveLength(ANTAGONISTS.length);
      for (const camp of camps) {
        expect(map.mainland.has(hexKey(camp)), `${label} camp off the home island`).toBe(true);
      }
    }
  });

  it('starts a real game on every combination', () => {
    for (const { shape, rough, seed } of everyCombination) {
      const state = createGameState(seed, {
        map: worldOptions({ shape: shape.id, roughness: rough.id }),
      });
      const label = `${shape.id}/${rough.id}/${seed}`;
      expect([...state.factions.keys()], label).toHaveLength(ANTAGONISTS.length + 1);
      expect([...state.cities.values()], label).toHaveLength(ANTAGONISTS.length);
    }
  });

  it('gives each shape the number of landmasses its label claims', () => {
    for (const seed of SEEDS) {
      const count = (id: 'continent' | 'islands' | 'archipelago') => {
        const shape = WORLD_SHAPES.find((s) => s.id === id)!;
        const map = generateMap(seed, worldOptions({ shape: id, roughness: 'rolling' }));
        const min = shape.map.minIslandSize ?? 6;
        return landmasses(map).filter((s) => s >= min).length;
      };

      expect(count('continent'), `${seed} continent`).toBe(1);
      expect(count('islands'), `${seed} islands`).toBeGreaterThan(1);
      expect(count('archipelago'), `${seed} archipelago`).toBeGreaterThan(4);
      // The labels have to stay in the right order relative to each other.
      expect(count('archipelago'), `${seed} ordering`).toBeGreaterThan(count('islands'));
    }
  });

  it('leaves a home island worth playing on, even at its smallest', () => {
    /*
     * ⚠️ Every faction shares the player's landmass, so it has to hold the
     * player and seven camps. The first version of the archipelago preset left
     * a 99-tile home island and villages two hexes apart, which is why the home
     * island now gets a larger reach than the rest.
     */
    for (const seed of SEEDS) {
      for (const shape of WORLD_SHAPES) {
        const map = generateMap(seed, worldOptions({ shape: shape.id, roughness: 'rugged' }));
        expect(map.mainland.size, `${seed}/${shape.id} home island`).toBeGreaterThan(150);
      }
    }
  });

  it('makes roughness mean something, and the same thing on every seed', () => {
    const impassableShare = (id: 'gentle' | 'rolling' | 'rugged', seed: string) => {
      const map = generateMap(seed, worldOptions({ shape: 'continent', roughness: id }));
      let land = 0;
      let blocked = 0;
      for (const tile of map.tiles.values()) {
        if (tile.terrain === 'onelake') continue;
        land += 1;
        if (!isPassableByLand(tile.terrain)) blocked += 1;
      }
      return blocked / land;
    };

    for (const seed of SEEDS) {
      const gentle = impassableShare('gentle', seed);
      const rolling = impassableShare('rolling', seed);
      const rugged = impassableShare('rugged', seed);
      expect(gentle, seed).toBeLessThan(rolling);
      expect(rolling, seed).toBeLessThan(rugged);
    }

    // Composition is a quantile, so the same setting gives the same share on
    // every seed. That is the guarantee that makes a named preset meaningful
    // rather than a suggestion.
    const shares = SEEDS.map((s) => impassableShare('rugged', s));
    for (const share of shares) {
      expect(share).toBeCloseTo(shares[0]!, 3);
    }
  });

  it('is deterministic: the same choices and seed give the same world', () => {
    const options = worldOptions({ shape: 'archipelago', roughness: 'rugged' });
    expect(landmasses(generateMap('FABRIC', options))).toEqual(
      landmasses(generateMap('FABRIC', options)),
    );
  });
});
