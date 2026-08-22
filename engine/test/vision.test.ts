/**
 * Fog of war.
 *
 * The whole map used to be visible from turn one, which gave away all seven
 * camps before a single move and left the Profiler, whose entire purpose is a
 * sight radius, as nothing but a faster soldier.
 *
 * ⚠️ The most important test in this file is the last one: that the
 * antagonists are NOT fogged. That is a deliberate asymmetry (section 21.3) and
 * exactly the kind of thing a later reader would "fix" into a bug.
 */

import { describe, expect, it } from 'vitest';
import {
  CITY_SIGHT,
  PLAYER_FACTION_ID,
  createGameState,
  deserialise,
  endTurn,
  foundCity,
  hexDistance,
  hexKey,
  moveUnit,
  rememberVisible,
  serialise,
  sightOf,
  unitType,
  unitsOf,
  type GameState,
} from '../src/index.js';

const architectOf = (state: GameState) =>
  unitsOf(state, PLAYER_FACTION_ID).find((u) => u.typeId === 'architect')!;

describe('what you can see', () => {
  it('covers each unit\u2019s own sight radius and no further', () => {
    const state = createGameState('FABRIC');
    const visible = sightOf(state, PLAYER_FACTION_ID);

    for (const key of visible) {
      const near = unitsOf(state, PLAYER_FACTION_ID).some((unit) => {
        const [q, r] = key.split(',').map(Number) as [number, number];
        return hexDistance(unit.hex, { q, r }) <= unitType(unit.typeId).sight;
      });
      expect(near, `${key} is visible but nothing is near it`).toBe(true);
    }
  });

  it('never reports a hex that is off the map', () => {
    const state = createGameState('FABRIC');
    for (const key of sightOf(state, PLAYER_FACTION_ID)) {
      expect(state.map.tiles.has(key), key).toBe(true);
    }
  });

  it('makes a scout worth having', () => {
    // The Profiler's whole point. If this ever equalises, so does the unit.
    expect(unitType('profiler').sight).toBeGreaterThan(unitType('pipelineRunner').sight);
    expect(unitType('lineageHawk').sight).toBeGreaterThan(unitType('profiler').sight);
    // And a siege train is nearly blind, which is why it needs an escort.
    expect(unitType('notebookCannon').sight).toBeLessThan(unitType('pipelineRunner').sight);
  });
});

describe('a new game starts dark', () => {
  it('reveals only what the player brought with them', () => {
    for (const seed of ['FABRIC', 'DP600', 'HORDE']) {
      const state = createGameState(seed);
      // A sliver of a 6,211 tile map, not most of it.
      expect(state.explored.size, seed).toBeGreaterThan(0);
      expect(state.explored.size / state.map.tiles.size, seed).toBeLessThan(0.02);
    }
  });

  it('hides every antagonist camp at the start', () => {
    /*
     * The reason the feature exists. Seven villages sitting in plain view on
     * turn one is the entire scouting game given away for nothing.
     */
    const state = createGameState('FABRIC');
    const seen = [...state.cities.values()].filter((c) =>
      state.explored.has(hexKey(c.hex)),
    );
    expect(seen).toHaveLength(0);
  });

  it('shows the ground the player is standing on', () => {
    const state = createGameState('FABRIC');
    for (const unit of unitsOf(state, PLAYER_FACTION_ID)) {
      expect(state.explored.has(hexKey(unit.hex))).toBe(true);
    }
  });
});

describe('memory grows and never shrinks', () => {
  it('reveals ground as a unit walks, not only where it stops', () => {
    const state = createGameState('FABRIC');
    const scout = unitsOf(state, PLAYER_FACTION_ID).find((u) => u.typeId === 'profiler');
    if (!scout) return;

    const before = state.explored.size;
    const target = { q: scout.hex.q + 1, r: scout.hex.r };
    const moved = moveUnit(state, scout.id, target);
    if (!moved.ok) return;

    expect(moved.state.explored.size).toBeGreaterThanOrEqual(before);
    expect(moved.state.explored.has(hexKey(target))).toBe(true);
  });

  it('remembers ground after the unit has walked away', () => {
    const state = createGameState('FABRIC');
    const scout = unitsOf(state, PLAYER_FACTION_ID).find((u) => u.typeId === 'profiler');
    if (!scout) return;

    const start = hexKey(scout.hex);
    const moved = moveUnit(state, scout.id, { q: scout.hex.q + 1, r: scout.hex.r });
    if (!moved.ok) return;

    // Explored is memory, not current sight: the tile stays known.
    expect(moved.state.explored.has(start)).toBe(true);
  });

  it('lights up a city\u2019s surroundings the moment it is founded', () => {
    const state = createGameState('FABRIC');
    const architect = architectOf(state);
    const founded = foundCity(state, architect.id);
    if (!founded.ok) return;

    // The city itself does not fold in sight until a turn passes, but its
    // radius must be reachable at all, or a capital would sit in the dark.
    const withSight = rememberVisible(founded.state, PLAYER_FACTION_ID);
    const city = [...withSight.cities.values()][0]!;
    let far = 0;
    for (const key of withSight.explored) {
      const [q, r] = key.split(',').map(Number) as [number, number];
      far = Math.max(far, hexDistance(city.hex, { q, r }));
    }
    expect(far).toBeGreaterThanOrEqual(CITY_SIGHT);
  });

  it('never forgets, over many turns', () => {
    let state = createGameState('FABRIC');
    let seen = state.explored.size;
    for (let i = 0; i < 8; i++) {
      state = endTurn(state).state;
      expect(state.explored.size, `turn ${state.turn}`).toBeGreaterThanOrEqual(seen);
      seen = state.explored.size;
    }
  });
});

describe('saving what you know', () => {
  it('round-trips the explored ground', () => {
    let state = createGameState('FABRIC');
    state = endTurn(state).state;

    const restored = deserialise(serialise(state), state.topics);
    expect(restored.explored.size).toBe(state.explored.size);
    for (const key of state.explored) {
      expect(restored.explored.has(key), key).toBe(true);
    }
  });

  it('does not quietly reveal the map through a reload', () => {
    const state = createGameState('FABRIC');
    const restored = deserialise(serialise(state), state.topics);
    expect(restored.explored.size).toBeLessThan(restored.map.tiles.size);
  });
});

describe('⚠️ the antagonists are deliberately not fogged', () => {
  it('lets them march on the player from the dark', () => {
    /*
     * Section 21.3, written down so nobody "fixes" it. The factions know where
     * the player is. Seven of them wandering a dark map looking for someone
     * would not be a harder game, it would be an absent one: they are a
     * besieging pressure on a learner, not an opponent in a fair match.
     *
     * The check is behavioural: a passive player still gets raided, even
     * though they have explored almost none of the map.
     */
    let state = createGameState('HORDE');
    let fought = false;
    for (let i = 0; i < 40 && !fought; i++) {
      const turn = endTurn(state);
      state = turn.state;
      fought = turn.report.enemyEvents.some((e) => e.log !== undefined);
    }

    expect(fought, 'nobody ever arrived').toBe(true);
    // And they did it while most of the world was still dark to the player.
    expect(state.explored.size / state.map.tiles.size).toBeLessThan(0.9);
  });
});
