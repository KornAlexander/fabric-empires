import { describe, it, expect } from 'vitest';
import {
  ANTAGONIST_FACTION_ID,
  PLAYER_FACTION_ID,
  createGameState,
  endTurn,
  hexDistance,
  hexKey,
  hexNeighbours,
  planFactionTurn,
  planUnitAction,
  reachable,
  runFactionTurn,
  terrain,
  unitType,
  unitsOf,
  type GameState,
  type Hex,
  type UnitTypeId,
} from '../src/index.js';

/**
 * The opponent.
 *
 * ⚠️ **The point of this file is that the antagonist actually does something.**
 * Adding the AI broke none of the 521 tests that existed before it, which is
 * either very good news or a sign that nothing exercises it. Almost every
 * assertion below is therefore about observable movement or damage, not about
 * the shape of a returned object: a planner that returns a tidy empty list on
 * every turn would satisfy a type check and leave the map as dead as it was.
 */

function place(
  state: GameState,
  id: string,
  typeId: UnitTypeId,
  hex: Hex,
  factionId: string,
  overrides: Partial<{ hp: number; movesLeft: number }> = {},
): GameState {
  const units = new Map(state.units);
  units.set(id, {
    id,
    typeId,
    factionId,
    hex,
    hp: overrides.hp ?? unitType(typeId).maxHp,
    movesLeft: overrides.movesLeft ?? unitType(typeId).movement,
    fortified: false,
  });
  return { ...state, units };
}

/**
 * A neighbouring tile a unit can actually stand on.
 *
 * ⚠️ Asserted rather than `!`-ed. The first version used a terrain predicate
 * that is not on the terrain record at all, so `find` returned undefined,
 * `!` waved it through, and four tests failed deep inside `hexDistance` with
 * an error that said nothing about the real cause.
 */
function walkableNeighbour(state: GameState, from: Hex): Hex {
  const hex = hexNeighbours(from).find((h) => {
    const tile = state.map.tiles.get(hexKey(h));
    return tile !== undefined && terrain(tile.terrain).settleable;
  });
  expect(hex, 'the start position should have a walkable neighbour').toBeDefined();
  return hex!;
}

/** One antagonist raider standing next to one player unit, and nothing else. */
function raidSetup(seed = 'FABRIC') {
  const base = createGameState(seed);
  const playerHex = unitsOf(base, PLAYER_FACTION_ID)[0]!.hex;
  const enemyHex = walkableNeighbour(base, playerHex);
  let state: GameState = { ...base, units: new Map() };
  state = place(state, 'p1', 'profiler', playerHex, PLAYER_FACTION_ID);
  state = place(state, 'e1', 'pipelineRunner', enemyHex, ANTAGONIST_FACTION_ID);
  return { state, playerHex, enemyHex };
}

function nearestEnemyDistance(state: GameState): number {
  const mine = unitsOf(state, PLAYER_FACTION_ID);
  const theirs = unitsOf(state, ANTAGONIST_FACTION_ID);
  let best = Number.POSITIVE_INFINITY;
  for (const a of mine) {
    for (const b of theirs) best = Math.min(best, hexDistance(a.hex, b.hex));
  }
  return best;
}

describe('the antagonist acts at all', () => {
  /*
   * ⚠️ These bounds are measured, not chosen. Across the seeds below the horde
   * first moves on turn 7 to 16 and lands its first raid on turn 9 to 20, and
   * a player who never does anything is wiped out between turn 11 and 22.
   * A passive player losing is correct; losing on turn six while still
   * reading the interface was not, which is why the leash exists.
   */
  const SEEDS = ['FABRIC', 'CONTOSO', 'LAKEHOUSE', 'DP600', 'HORDE'];

  it('leaves a new empire alone while it finds its feet', () => {
    // FABRIC starts them 10 hexes away, well outside the opening leash of 5.
    let state = createGameState('FABRIC');
    for (let i = 0; i < 5; i++) {
      const turn = endTurn(state);
      expect(turn.report.enemyEvents).toEqual([]);
      state = turn.state;
    }
  });

  it('comes for the player eventually, on every seed', () => {
    for (const seed of SEEDS) {
      let state = createGameState(seed);
      let raided = false;
      for (let i = 0; i < 25 && !raided; i++) {
        const turn = endTurn(state);
        state = turn.state;
        raided = turn.report.enemyEvents.some((e) => e.intent.kind === 'raid');
      }
      // A leash that never lets go is just scenery with extra steps.
      expect(raided, `${seed} should be raided within 25 turns`).toBe(true);
    }
  });

  it('reports what it did, and it is all the antagonist', () => {
    let state = createGameState('FABRIC');
    const events = [];
    for (let i = 0; i < 20; i++) {
      const turn = endTurn(state);
      state = turn.state;
      events.push(...turn.report.enemyEvents);
    }
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.factionId === ANTAGONIST_FACTION_ID)).toBe(true);
  });

  it('actually closes the distance', () => {
    let state = createGameState('FABRIC');
    const before = nearestEnemyDistance(state);
    let closest = before;
    for (let i = 0; i < 18; i++) {
      state = endTurn(state).state;
      const now = nearestEnemyDistance(state);
      // Once a side is wiped out the distance is Infinity, which is not a
      // measurement. Track the closest they ever got instead.
      if (Number.isFinite(now)) closest = Math.min(closest, now);
    }
    expect(closest).toBeLessThan(before);
  });

  it('keeps acting once engaged, rather than spending its movement once', () => {
    let state = createGameState('HORDE');
    const perTurn: number[] = [];
    for (let i = 0; i < 8; i++) {
      const turn = endTurn(state);
      state = turn.state;
      perTurn.push(turn.report.enemyEvents.length);
    }
    // Refreshing the enemy faction is what makes this pass. Without it the
    // first engaged turn acts and every turn after it is silent.
    expect(perTurn.filter((n) => n > 0).length).toBeGreaterThan(1);
  });

  it('does nothing, and does not throw, in a sandbox with no antagonists', () => {
    const state = createGameState('FABRIC', { spawnAntagonists: false });
    const { report } = endTurn(state);
    expect(report.enemyEvents).toEqual([]);
  });

  it('fights back at once when the player walks up to it, leash or no leash', () => {
    // The grace period must never read as immunity.
    const { state } = raidSetup();
    expect(state.turn).toBe(1);
    const played = runFactionTurn(state, ANTAGONIST_FACTION_ID);
    expect(played.events.some((e) => e.intent.kind === 'raid')).toBe(true);
  });
});

describe('raiding', () => {
  it('attacks an adjacent player unit and hurts it', () => {
    const { state } = raidSetup();
    const before = state.units.get('p1')!.hp;
    const played = runFactionTurn(state, ANTAGONIST_FACTION_ID);

    const raid = played.events.find((e) => e.intent.kind === 'raid');
    expect(raid).toBeDefined();
    expect(raid?.log?.damageToDefender).toBeGreaterThan(0);

    const after = played.state.units.get('p1');
    expect(after === undefined || after.hp < before).toBe(true);
  });

  it('lets the defender answer for themselves', () => {
    const { state } = raidSetup();
    const weak = runFactionTurn(state, ANTAGONIST_FACTION_ID, { defenderChallengeScore: -1 });
    const strong = runFactionTurn(state, ANTAGONIST_FACTION_ID, { defenderChallengeScore: 1 });

    const hurt = (r: ReturnType<typeof runFactionTurn>) =>
      r.events.find((e) => e.intent.kind === 'raid')?.log?.damageToDefender ?? 0;

    // Knowing the answer is the defence. If these are equal, the score is
    // being accepted and quietly dropped, which is the failure mode that
    // looks exactly like success.
    expect(hurt(strong)).toBeLessThan(hurt(weak));
  });

  it('does not send civilians into a fight', () => {
    const base = createGameState('FABRIC');
    const playerHex = unitsOf(base, PLAYER_FACTION_ID)[0]!.hex;
    const enemyHex = walkableNeighbour(base, playerHex);
    let state: GameState = { ...base, units: new Map() };
    state = place(state, 'p1', 'profiler', playerHex, PLAYER_FACTION_ID);
    state = place(state, 'e1', 'architect', enemyHex, ANTAGONIST_FACTION_ID);

    const intent = planUnitAction({ ...state, activeFactionId: ANTAGONIST_FACTION_ID }, 'e1');
    expect(intent?.kind).not.toBe('raid');
  });
});

describe('it plays by the same rules as the player', () => {
  it('only ever moves to tiles the movement rules allow', () => {
    let state = createGameState('FABRIC');
    for (let turn = 0; turn < 5; turn++) {
      const before = { ...state, activeFactionId: ANTAGONIST_FACTION_ID };
      for (const intent of planFactionTurn(before, ANTAGONIST_FACTION_ID)) {
        if (intent.kind !== 'move') continue;
        const unit = before.units.get(intent.unitId)!;
        expect(reachable(before, unit).has(hexKey(intent.to))).toBe(true);
      }
      state = endTurn(state).state;
    }
  });

  it('hands the turn back to the player', () => {
    const state = createGameState('FABRIC');
    const played = runFactionTurn(state, ANTAGONIST_FACTION_ID);
    expect(played.state.activeFactionId).toBe(PLAYER_FACTION_ID);
    expect(endTurn(state).state.activeFactionId).toBe(PLAYER_FACTION_ID);
  });

  it('cannot touch the player\'s units', () => {
    const state = createGameState('FABRIC');
    const before = unitsOf(state, PLAYER_FACTION_ID).map((u) => hexKey(u.hex));
    const played = runFactionTurn(state, ANTAGONIST_FACTION_ID);
    const after = unitsOf(played.state, PLAYER_FACTION_ID).map((u) => hexKey(u.hex));
    expect(after).toEqual(before);
  });
});

describe('determinism', () => {
  /** Every enemy action of a game, as comparable text. */
  function trace(seed: string, turns = 20): string[] {
    let state = createGameState(seed);
    const out: string[] = [];
    for (let i = 0; i < turns; i++) {
      const turn = endTurn(state);
      state = turn.state;
      for (const e of turn.report.enemyEvents) {
        out.push(
          e.intent.kind === 'move'
            ? `${e.unitId} move ${hexKey(e.intent.to)}`
            : `${e.unitId} raid ${hexKey(e.intent.target)} ${e.log?.damageToDefender ?? 0}`,
        );
      }
    }
    return out;
  }

  it('plays an identical game from an identical seed', () => {
    // Seed sharing (D39) is only meaningful if the opponent is part of what
    // the seed decides. Twenty turns, because the leash keeps the first few
    // deliberately empty and an empty list proves nothing.
    expect(trace('FABRIC')).toEqual(trace('FABRIC'));
    expect(trace('FABRIC').length).toBeGreaterThan(0);
  });

  it('plays a different game from a different seed', () => {
    expect(trace('FABRIC')).not.toEqual(trace('CONTOSO'));
  });
});

