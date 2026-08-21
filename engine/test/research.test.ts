import { describe, it, expect } from 'vitest';
import {
  COMPUTE_PER_WEIGHT,
  EMPTY_RESEARCH,
  GENERIC_TOPIC_GRAPH,
  PLAYER_FACTION_ID,
  clusterProgress,
  completeResearch,
  createGameState,
  deserialise,
  endTurn,
  fundResearch,
  isResearched,
  researchCost,
  researchProgress,
  researchReady,
  researchable,
  serialise,
  startResearch,
  topicById,
  validateTopicGraph,
  type GameState,
} from '../src/index.js';

function withCompute(state: GameState, compute: number): GameState {
  const factions = new Map(state.factions);
  const player = factions.get(PLAYER_FACTION_ID)!;
  factions.set(PLAYER_FACTION_ID, {
    ...player,
    resources: { ...player.resources, compute },
  });
  return { ...state, factions };
}

function fresh(): GameState {
  return createGameState('FABRIC', { spawnAntagonists: false });
}

/** Fund and complete a topic outright, for building up a research position. */
function learn(state: GameState, topicId: string): GameState {
  const started = startResearch(state, topicId);
  if (!started.ok) throw new Error(`start ${topicId}: ${started.reason}`);
  const node = topicById(state.topics, topicId)!;
  const funded = fundResearch(
    withCompute(started.state, researchCost(node)),
    PLAYER_FACTION_ID,
  );
  const done = completeResearch(funded.state, 1);
  if (!done.ok) throw new Error(`complete ${topicId}: ${done.reason}`);
  return done.state;
}

describe('starting state', () => {
  it('knows nothing and is researching nothing', () => {
    const state = fresh();
    expect(state.research).toEqual(EMPTY_RESEARCH);
    expect(researchProgress(state)).toBe(0);
  });

  it('uses the subject-free tree unless one is supplied', () => {
    expect(fresh().topics).toBe(GENERIC_TOPIC_GRAPH);
  });

  it('opens with only the root topics available', () => {
    const options = researchable(fresh());
    expect(options.length).toBeGreaterThan(0);
    for (const node of options) expect(node.requires).toEqual([]);
  });
});

describe('choosing a topic', () => {
  it('refuses one whose prerequisites are unmet', () => {
    const state = fresh();
    const locked = state.topics.nodes.find((n) => n.requires.length > 0)!;
    const result = startResearch(state, locked.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain('Prerequisites');
  });

  it('refuses an unknown topic', () => {
    expect(startResearch(fresh(), 'not-a-topic').ok).toBe(false);
  });

  it('refuses one already researched', () => {
    const state = learn(fresh(), researchable(fresh())[0]!.id);
    const result = startResearch(state, state.research.known[0]!);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain('Already researched');
  });

  it('unlocks its dependants once known', () => {
    const state = fresh();
    const root = researchable(state)[0]!;
    const before = new Set(researchable(state).map((n) => n.id));
    const after = researchable(learn(state, root.id));
    expect(after.some((n) => !before.has(n.id))).toBe(true);
  });

  it('forfeits progress when the player changes their mind', () => {
    // Switching topics has to cost something, or the choice is not a choice.
    let state = fresh();
    const [first, ...rest] = researchable(state);
    const second = rest[0] ?? first;
    state = startResearch(state, first!.id).ok
      ? (startResearch(state, first!.id) as { ok: true; state: GameState }).state
      : state;
    state = fundResearch(withCompute(state, 5), PLAYER_FACTION_ID).state;
    expect(state.research.progress).toBe(5);

    if (second && second.id !== first!.id) {
      const switched = startResearch(state, second.id);
      expect(switched.ok).toBe(true);
      if (!switched.ok) return;
      expect(switched.state.research.progress).toBe(0);
    }
  });
});

describe('funding', () => {
  it('costs Compute in proportion to the topic weight', () => {
    for (const node of GENERIC_TOPIC_GRAPH.nodes) {
      expect(researchCost(node)).toBe(node.weight * COMPUTE_PER_WEIGHT);
    }
  });

  it('drains the treasury rather than diverting income invisibly', () => {
    // The player must be able to watch the bill being paid.
    let state = fresh();
    const root = researchable(state)[0]!;
    state = (startResearch(state, root.id) as { ok: true; state: GameState }).state;
    state = withCompute(state, 4);

    const tick = fundResearch(state, PLAYER_FACTION_ID);
    expect(tick.spent).toBe(4);
    expect(
      tick.state.factions.get(PLAYER_FACTION_ID)!.resources.compute,
    ).toBe(0);
    expect(tick.state.research.progress).toBe(4);
  });

  it('never spends more than the topic costs', () => {
    let state = fresh();
    const root = researchable(state)[0]!;
    const cost = researchCost(root);
    state = (startResearch(state, root.id) as { ok: true; state: GameState }).state;
    state = withCompute(state, cost + 100);

    const tick = fundResearch(state, PLAYER_FACTION_ID);
    expect(tick.spent).toBe(cost);
    expect(
      tick.state.factions.get(PLAYER_FACTION_ID)!.resources.compute,
    ).toBe(100);
  });

  it('does nothing when nothing is being researched', () => {
    const tick = fundResearch(withCompute(fresh(), 50), PLAYER_FACTION_ID);
    expect(tick.spent).toBe(0);
    expect(tick.readyTopicId).toBeUndefined();
  });

  it('does nothing when the treasury is empty', () => {
    let state = fresh();
    const root = researchable(state)[0]!;
    state = (startResearch(state, root.id) as { ok: true; state: GameState }).state;
    expect(fundResearch(withCompute(state, 0), PLAYER_FACTION_ID).spent).toBe(0);
  });

  it('reports the topic as ready once fully funded', () => {
    let state = fresh();
    const root = researchable(state)[0]!;
    state = (startResearch(state, root.id) as { ok: true; state: GameState }).state;
    const tick = fundResearch(withCompute(state, researchCost(root)), PLAYER_FACTION_ID);
    expect(tick.readyTopicId).toBe(root.id);
    expect(researchReady(tick.state)).toBe(root.id);
  });
});

describe('completing', () => {
  it('refuses when nothing is funded', () => {
    expect(completeResearch(fresh(), 1).ok).toBe(false);
  });

  it('a right answer learns the topic and clears the slot', () => {
    const state = fresh();
    const root = researchable(state)[0]!;
    const learned = learn(state, root.id);
    expect(isResearched(learned, root.id)).toBe(true);
    expect(learned.research.current).toBeUndefined();
    expect(learned.research.progress).toBe(0);
  });

  it('a neutral answer still completes it, so the null provider can play', () => {
    // The standalone game presents no questions at all (D35). If a score of
    // zero blocked research, that game could never advance.
    let state = fresh();
    const root = researchable(state)[0]!;
    state = (startResearch(state, root.id) as { ok: true; state: GameState }).state;
    state = fundResearch(withCompute(state, researchCost(root)), PLAYER_FACTION_ID).state;
    const done = completeResearch(state, 0);
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    expect(isResearched(done.state, root.id)).toBe(true);
  });

  it('a wrong answer is a delay, not a wall', () => {
    /*
     * The investment is kept and the topic stays ready, so the player can try
     * again next turn. Losing the progress would mean a player who does not
     * yet know something can never learn it, which is backwards for a study
     * tool.
     */
    let state = fresh();
    const root = researchable(state)[0]!;
    state = (startResearch(state, root.id) as { ok: true; state: GameState }).state;
    state = fundResearch(withCompute(state, researchCost(root)), PLAYER_FACTION_ID).state;

    const failed = completeResearch(state, -1);
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(isResearched(failed.state, root.id)).toBe(false);
    expect(researchReady(failed.state)).toBe(root.id);

    const retried = completeResearch(failed.state, 1);
    expect(retried.ok).toBe(true);
    if (!retried.ok) return;
    expect(isResearched(retried.state, root.id)).toBe(true);
  });
});

describe('through the turn pipeline', () => {
  it('funds research from income and reports what was spent', () => {
    let state = fresh();
    const root = researchable(state)[0]!;
    state = (startResearch(state, root.id) as { ok: true; state: GameState }).state;
    state = withCompute(state, 3);

    const result = endTurn(state);
    expect(result.report.researchSpent).toBeGreaterThan(0);
    expect(result.state.research.progress).toBeGreaterThan(0);
  });

  it('stops at ready rather than completing the topic itself', () => {
    // Presenting a question is the app's job; the engine must not decide the
    // outcome of a challenge it never saw.
    let state = fresh();
    const root = researchable(state)[0]!;
    state = (startResearch(state, root.id) as { ok: true; state: GameState }).state;
    state = withCompute(state, researchCost(root));

    const result = endTurn(state);
    expect(result.report.researchReadyTopicId).toBe(root.id);
    expect(isResearched(result.state, root.id)).toBe(false);
  });

  it('reports nothing ready when no topic is chosen', () => {
    expect(endTurn(fresh()).report.researchReadyTopicId).toBeUndefined();
  });
});

describe('progress reporting', () => {
  it('rises as topics are learned', () => {
    const state = fresh();
    const learned = learn(state, researchable(state)[0]!.id);
    expect(researchProgress(learned)).toBeGreaterThan(researchProgress(state));
  });

  it('counts every cluster, including untouched ones', () => {
    const progress = clusterProgress(fresh());
    const clusters = new Set(GENERIC_TOPIC_GRAPH.nodes.map((n) => n.cluster));
    expect(progress.size).toBe(clusters.size);
    for (const entry of progress.values()) {
      expect(entry.known).toBe(0);
      expect(entry.total).toBeGreaterThan(0);
    }
  });

  it('totals match the tree', () => {
    let total = 0;
    for (const entry of clusterProgress(fresh()).values()) total += entry.total;
    expect(total).toBe(GENERIC_TOPIC_GRAPH.nodes.length);
  });
});

describe('saving research', () => {
  it('round trips what has been learned', () => {
    const state = learn(fresh(), researchable(fresh())[0]!.id);
    const restored = deserialise(serialise(state));
    expect(restored.research).toEqual(state.research);
  });

  it('round trips a part-funded topic', () => {
    let state = fresh();
    const root = researchable(state)[0]!;
    state = (startResearch(state, root.id) as { ok: true; state: GameState }).state;
    state = fundResearch(withCompute(state, 5), PLAYER_FACTION_ID).state;

    const restored = deserialise(serialise(state));
    expect(restored.research.current).toBe(root.id);
    expect(restored.research.progress).toBe(5);
  });

  it('takes the tech tree from the provider, not from the save file', () => {
    // The graph is content. Trusting a copy on disk would pin players to
    // whatever tree existed when they last saved.
    const custom = {
      nodes: [{ id: 'solo', label: 'Solo', cluster: 'z', requires: [], weight: 1 }],
    };
    const state = fresh();
    const restored = deserialise(serialise(state), custom);
    expect(restored.topics).toBe(custom);
    expect(validateTopicGraph(restored.topics)).toEqual([]);
  });
});
