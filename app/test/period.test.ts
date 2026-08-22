/**
 * The period, and the scale contract behind it.
 *
 * ⚠️ **The rule this file exists to enforce is "a stronger unit is a bigger
 * crowd, never a bigger man".** The old units were scaled bodily by strength,
 * so a Direct Lake Titan was drawn at 1.5x an Architect: same object, inflated.
 * That is the exact thing the standing instruction on 3D scenes forbids, and
 * it is invisible in a screenshot because there is nothing beside it to
 * compare against.
 *
 * These tests build the real geometry. `buildUnit` needs no renderer and no
 * canvas, only three's maths, so the assertions here are measurements of the
 * actual objects the game puts on the map rather than greps for words in the
 * source that produced them.
 */

import { Box3, Mesh, type Group } from 'three';
import { describe, expect, it } from 'vitest';
import {
  UNIT_TYPE_IDS,
  unitType,
  type Unit,
  type UnitTypeId,
} from '@fabric-empires/engine';
import { buildUnit } from '../src/three/entities.js';

const FACTION = '#4c8fd6';

const make = (typeId: UnitTypeId): Group =>
  buildUnit(
    {
      id: `u-${typeId}`,
      typeId,
      factionId: 'player',
      hex: { q: 0, r: 0 },
      hp: 100,
      movesLeft: 2,
      fortified: false,
    } satisfies Unit,
    FACTION,
  );

/**
 * How far the stand reaches ABOVE the ground, measured, not declared.
 *
 * ⚠️ Not the bounding box's height. The base is a plinth that is deliberately
 * mostly underground, so the full box is a fifth of a unit taller than
 * anything a player can see, and measuring it reports a two metre soldier as
 * a four metre one.
 */
const standsProud = (group: Group): number => new Box3().setFromObject(group).max.y;

const meshCount = (group: Group): number => {
  let n = 0;
  group.traverse((o) => {
    if ((o as Mesh).isMesh) n += 1;
  });
  return n;
};

describe('every unit is a stand of figures', () => {
  it('builds one for every type in the roster', () => {
    for (const id of UNIT_TYPE_IDS) {
      const group = make(id);
      expect(group.userData.kind, id).toBe('unit');
      expect(meshCount(group), id).toBeGreaterThan(3);
    }
  });

  it('⚠️ never scales the whole unit, which is how a man gets bigger', () => {
    for (const id of UNIT_TYPE_IDS) {
      const group = make(id);
      expect(
        [group.scale.x, group.scale.y, group.scale.z],
        `${id} is scaled bodily`,
      ).toEqual([1, 1, 1]);
    }
  });

  it('⚠️ answers strength with more bodies, not taller ones', () => {
    /*
     * The Direct Lake Titan has three times the strength of a Pipeline Runner
     * and they are both blocks of pikemen. The Titan must be the heavier
     * block, and it must not be the block of giants.
     */
    const weakest = make('pipelineRunner');
    const strongest = make('directLakeTitan');
    expect(unitType('directLakeTitan').strength).toBeGreaterThan(
      unitType('pipelineRunner').strength,
    );

    expect(meshCount(strongest)).toBeGreaterThan(meshCount(weakest));
    // Same men, so the same height, give or take the deterministic slop in
    // how far each individual pike is leaning.
    expect(standsProud(strongest)).toBeCloseTo(standsProud(weakest), 1);
  });

  it('⚠️ keeps every soldier shorter than the house he is marching past', () => {
    /*
     * The cross-check that catches a figure quietly growing. A village house
     * stands about 0.35 to its ridge, and the tallest thing on a stand is a
     * pike or a flag, roughly a man and a half. If a stand ever approaches
     * the height of a building, the scale has drifted.
     */
    for (const id of UNIT_TYPE_IDS) {
      const height = standsProud(make(id));
      expect(height, `${id} stands ${height.toFixed(2)} above ground`).toBeLessThan(0.35);
      expect(height, `${id} has nothing standing on it`).toBeGreaterThan(0.05);
    }
  });

  it('⚠️ makes every foot stand the same height, because they are the same men', () => {
    /*
     * The sharper version of the rule. Twelve unit types, one man: a pike
     * block, a musket line, a gun crew and a party of pioneers must all come
     * out within a few centimetres of each other, because the only thing that
     * differs between them is what the men are holding.
     *
     * The boat is excluded and is the reason this is a separate test. A hoy
     * with a five metre mast really is taller than a soldier, and folding it
     * in would have meant loosening the bound until it stopped catching
     * anything.
     */
    const feet = UNIT_TYPE_IDS.filter((id) => unitType(id).domain !== 'water').map((id) => ({
      id,
      height: standsProud(make(id)),
    }));

    const tallest = feet.reduce((a, b) => (a.height > b.height ? a : b));
    const shortest = feet.reduce((a, b) => (a.height < b.height ? a : b));
    expect(
      tallest.height - shortest.height,
      `${tallest.id} towers over ${shortest.id}`,
    ).toBeLessThan(0.05);
  });

  it('gives every stand its faction colour somewhere', () => {
    for (const id of UNIT_TYPE_IDS) {
      let found = false;
      make(id).traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as { color?: { getHexString(): string } };
        if (mat.color && `#${mat.color.getHexString()}` === FACTION) found = true;
      });
      expect(found, `${id} shows nothing of whose it is`).toBe(true);
    }
  });
});

describe('⚠️ nothing on the map glows any more', () => {
  /*
   * The old unit carried an emissive strip at intensity 2.4, and the old city
   * a glowing beacon. Both were the most science-fiction objects in a scene
   * that is trying to be 1600. The tray band under a stand is the single
   * exception and is documented as one: it is a painted counter, not an
   * object in the world, and it is what keeps a unit findable in shadow.
   */
  it('keeps the one exception faint enough to stay a colour, not a lamp', () => {
    const emitters: { intensity: number }[] = [];
    for (const id of UNIT_TYPE_IDS) {
      make(id).traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as {
          emissive?: { getHex(): number };
          emissiveIntensity?: number;
        };
        if (mat.emissive && mat.emissive.getHex() !== 0 && (mat.emissiveIntensity ?? 0) > 0) {
          emitters.push({ intensity: mat.emissiveIntensity ?? 0 });
        }
      });
    }

    expect(emitters.length).toBeGreaterThan(0);
    for (const e of emitters) {
      expect(e.intensity, 'an emissive this strong is a light source').toBeLessThan(0.6);
    }
  });
});
