import { describe, it, expect } from 'vitest';
import {
  PLAYER_FACTION_ID,
  PRODUCTION_CAP_PER_TURN,
  SAVE_VERSION,
  buildableUnits,
  cancelProduction,
  createGameState,
  deserialise,
  endTurn,
  foundCity,
  serialise,
  setProduction,
  unitCost,
  unitType,
  unitUnlocked,
  unitsOf,
  type GameState,
  type TopicGraph,
} from '../src/index.js';

/**
 * Building things.
 *
 * ⚠️ The assertions that matter are the ones about a unit existing that did
 * not exist before, and about research and production both advancing in the
 * same turn. A production phase that runs, spends nothing and reports an empty
 * list would pass any test written about shapes.
 */

/**
 * A topic graph the size of the real outline.
 *
 * ⚠️ `GENERIC_TOPIC_GRAPH` is much smaller than 41 nodes, so against it a
 * Pipeline Runner (skill 14) can never unlock. That is correct behaviour and
 * is asserted separately; it just makes the generic tree the wrong place to
 * test unlocking. The app plays the DP-600 tree, which has all 41.
 */
function fullTree(): TopicGraph {
  return {
    nodes: Array.from({ length: 41 }, (_, i) => ({
      id: `skill-${i + 1}`,
      label: `Skill ${i + 1}`,
      cluster: 'A1',
      requires: [],
      weight: 1,
    })),
  };
}

/** A game with a capital and enough Compute to build with. */
function withCapital(seed = 'FABRIC', compute = 400): GameState {
  const base = createGameState(seed, { topics: fullTree() });
  const architect = unitsOf(base, PLAYER_FACTION_ID).find((u) => u.typeId === 'architect')!;
  const founded = foundCity(base, architect.id);
  if (!founded.ok) throw new Error(founded.reason);
  const state = founded.state;
  const faction = state.factions.get(PLAYER_FACTION_ID)!;
  const factions = new Map(state.factions);
  factions.set(PLAYER_FACTION_ID, {
    ...faction,
    resources: { ...faction.resources, compute },
  });
  return { ...state, factions };
}

const capital = (state: GameState) =>
  [...state.cities.values()].find((c) => c.factionId === PLAYER_FACTION_ID)!;

describe('production', () => {
  it('builds a unit that did not exist before', () => {
    let state = withCapital();
    const before = unitsOf(state, PLAYER_FACTION_ID).length;

    const ordered = setProduction(state, capital(state).id, 'engineer');
    expect(ordered.ok).toBe(true);
    if (!ordered.ok) return;
    state = ordered.state;

    let built = 0;
    for (let i = 0; i < 10 && built === 0; i++) {
      const turn = endTurn(state);
      state = turn.state;
      built = turn.report.unitsBuilt.length;
    }

    expect(built).toBe(1);
    expect(unitsOf(state, PLAYER_FACTION_ID).length).toBeGreaterThan(before);
    expect(unitsOf(state, PLAYER_FACTION_ID).some((u) => u.typeId === 'engineer')).toBe(true);
  });

  it('takes the number of turns the cost and the cap imply', () => {
    let state = withCapital();
    state = (setProduction(state, capital(state).id, 'engineer') as { state: GameState }).state;

    const cost = unitCost(unitType('engineer'));
    const expected = Math.ceil(cost / PRODUCTION_CAP_PER_TURN);

    let turns = 0;
    let built = 0;
    while (built === 0 && turns < 20) {
      const turn = endTurn(state);
      state = turn.state;
      turns++;
      built = turn.report.unitsBuilt.length;
    }
    expect(turns).toBe(expected);
  });

  it('spends Compute, and not more than the cap in one turn', () => {
    let state = withCapital();
    state = (setProduction(state, capital(state).id, 'engineer') as { state: GameState }).state;

    const before = state.factions.get(PLAYER_FACTION_ID)!.resources.compute;
    const turn = endTurn(state);
    expect(turn.report.productionSpent).toBeGreaterThan(0);
    expect(turn.report.productionSpent).toBeLessThanOrEqual(PRODUCTION_CAP_PER_TURN);

    // Income lands in the same turn, so compare against what production says
    // it took rather than against a bare difference.
    const after = turn.state.factions.get(PLAYER_FACTION_ID)!.resources.compute;
    expect(after).toBeLessThan(before + turn.report.treasuryGained.compute + 1);
  });

  it('lets research and production advance in the same turn', () => {
    /*
     * The cap exists for exactly this. Without it whichever phase ran first
     * drained the treasury and the other silently stopped, which looks like a
     * broken tech tree rather than a starved one.
     */
    let state = withCapital();
    state = (setProduction(state, capital(state).id, 'engineer') as { state: GameState }).state;
    const topic = state.topics.nodes[0]!;
    state = {
      ...state,
      research: { known: [], current: topic.id, progress: 0 },
    };

    const turn = endTurn(state);
    expect(turn.report.productionSpent).toBeGreaterThan(0);
    expect(turn.report.researchSpent).toBeGreaterThan(0);
  });

  it('keeps progress when the order changes', () => {
    let state = withCapital();
    state = (setProduction(state, capital(state).id, 'engineer') as { state: GameState }).state;
    state = endTurn(state).state;
    const progress = capital(state).productionProgress;
    expect(progress).toBeGreaterThan(0);

    const switched = setProduction(state, capital(state).id, 'profiler');
    expect(switched.ok).toBe(true);
    if (!switched.ok) return;
    expect(capital(switched.state).productionProgress).toBe(progress);
  });

  it('can be cancelled without losing what was spent', () => {
    let state = withCapital();
    state = (setProduction(state, capital(state).id, 'engineer') as { state: GameState }).state;
    state = endTurn(state).state;
    const progress = capital(state).productionProgress;

    const stopped = cancelProduction(state, capital(state).id);
    expect(stopped.ok).toBe(true);
    if (!stopped.ok) return;
    expect(capital(stopped.state).producing).toBeUndefined();
    expect(capital(stopped.state).productionProgress).toBe(progress);

    // And nothing is built while no order stands.
    expect(endTurn(stopped.state).report.unitsBuilt).toEqual([]);
  });

  it('does not let another faction give orders', () => {
    const state = withCapital();
    const enemyTurn: GameState = { ...state, activeFactionId: 'silo-horde' };
    const result = setProduction(enemyTurn, capital(state).id, 'engineer');
    expect(result.ok).toBe(false);
  });
});

describe('the tech tree hands out the army', () => {
  it('starts with only the units that need no research', () => {
    const state = withCapital();
    const available = buildableUnits(state);

    expect(available).toContain('architect');
    expect(available).toContain('engineer');
    expect(available).toContain('profiler');
    // `unlockedBySkill` has been sitting in the unit table unread since the
    // beginning. If everything is buildable at turn one, nothing reads it.
    expect(available).not.toContain('pipelineRunner');
    expect(available).not.toContain('directLakeTitan');
  });

  it('unlocks a unit when its skill is known', () => {
    const state = withCapital();
    const skill = unitType('pipelineRunner').unlockedBySkill!;
    const node = state.topics.nodes[skill - 1]!;

    expect(unitUnlocked(state, 'pipelineRunner')).toBe(false);
    const learned: GameState = {
      ...state,
      research: { ...state.research, known: [node.id] },
    };
    expect(unitUnlocked(learned, 'pipelineRunner')).toBe(true);
    expect(buildableUnits(learned)).toContain('pipelineRunner');
  });

  it('refuses an order for a unit that has not been researched', () => {
    const state = withCapital();
    const result = setProduction(state, capital(state).id, 'directLakeTitan');
    expect(result.ok).toBe(false);
  });

  it('locks anything whose skill is past the end of the tree', () => {
    // The generic tree is much smaller than the DP-600 outline. A unit whose
    // index does not exist there must be locked, not free.
    const small = withCapital();
    const tiny: GameState = { ...small, topics: { nodes: small.topics.nodes.slice(0, 2) } };
    expect(unitUnlocked(tiny, 'directLakeTitan')).toBe(false);
  });
});

describe('saves', () => {
  it('carries production orders through a round trip', () => {
    let state = withCapital();
    state = (setProduction(state, capital(state).id, 'engineer') as { state: GameState }).state;
    state = endTurn(state).state;

    const loaded = deserialise(serialise(state), state.topics);
    expect(capital(loaded).producing).toBe('engineer');
    expect(capital(loaded).productionProgress).toBe(capital(state).productionProgress);
  });

  it('upgrades a version 2 save rather than refusing it', () => {
    const state = withCapital();
    const save = JSON.parse(serialise(state));
    const old = {
      ...save,
      version: 2,
      cities: save.cities.map((c: Record<string, unknown>) => {
        const { productionProgress, producing, ...rest } = c;
        void productionProgress;
        void producing;
        return rest;
      }),
    };

    const loaded = deserialise(JSON.stringify(old), state.topics);
    expect(capital(loaded).productionProgress).toBe(0);
    expect(capital(loaded).producing).toBeUndefined();
    expect(SAVE_VERSION).toBe(3);
  });
});
