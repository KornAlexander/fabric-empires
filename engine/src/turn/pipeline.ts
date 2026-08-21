/**
 * The turn pipeline.
 *
 * Phases run in a fixed order and each one is a pure function from state to
 * state. The report they build up is what the UI shows the player, and it is
 * also what tests assert against, so the two never disagree about what
 * happened during a turn.
 *
 * Phases from the plan not yet implemented (research, production, enemy AI,
 * events) have no hook here on purpose: an empty phase that does nothing is
 * indistinguishable from a phase that silently broke.
 */

import { unitType, type Faction } from '../entities/index.js';
import { addResources, empireIncome, growthThreshold } from '../rules/yields.js';
import { fundResearch, researchReady } from '../rules/research.js';
import type { GameState } from '../state/index.js';

export interface TurnReport {
  /** The turn that just ended. */
  readonly turn: number;
  readonly factionId: string;
  readonly treasuryGained: {
    readonly compute: number;
    readonly cu: number;
    readonly trust: number;
  };
  readonly upkeepPaid: number;
  /** Cities that gained a citizen. */
  readonly grownCities: readonly string[];
  /** Compute moved into research this turn. */
  readonly researchSpent: number;
  /**
   * A topic that is fully funded and waiting for its challenge.
   *
   * The engine stops here on purpose: presenting a question is the app's job,
   * and the result comes back through `completeResearch`.
   */
  readonly researchReadyTopicId: string | undefined;
  /** True when upkeep could not be paid in full. */
  readonly bankrupt: boolean;
}

export interface TurnResult {
  readonly state: GameState;
  readonly report: TurnReport;
}

/**
 * UPKEEP: collect income, pay the army, grow the cities.
 *
 * A negative treasury is clamped at zero rather than going into debt, and the
 * shortfall is reported. Debt spirals are a punishing mechanic to explain and
 * this game already asks the player to learn something else.
 */
function upkeepPhase(state: GameState, factionId: string): TurnResult {
  const faction = state.factions.get(factionId);
  if (!faction) {
    throw new Error(`Unknown faction ${factionId}`);
  }

  const income = empireIncome(state, factionId);
  const combined = addResources(faction.resources, income.treasury);
  const bankrupt = combined.cu < 0;

  const updatedFaction: Faction = {
    ...faction,
    resources: Object.freeze({
      data: combined.data,
      compute: combined.compute,
      cu: Math.max(0, combined.cu),
      trust: combined.trust,
    }),
  };

  const cities = new Map(state.cities);
  const grown: string[] = [];
  for (const [id, city] of cities) {
    if (city.factionId !== factionId) continue;
    const gained = income.growth.get(id) ?? 0;
    let store = city.growthStore + gained;
    let population = city.population;
    // A single turn can only ever add one citizen, so a windfall does not
    // detonate a city from size 1 to size 5.
    const threshold = growthThreshold(population);
    if (store >= threshold) {
      store -= threshold;
      population += 1;
      grown.push(id);
    }
    cities.set(id, { ...city, growthStore: store, population });
  }

  const factions = new Map(state.factions);
  factions.set(factionId, updatedFaction);

  return {
    state: { ...state, factions, cities },
    report: {
      turn: state.turn,
      factionId,
      treasuryGained: {
        compute: income.treasury.compute,
        cu: income.treasury.cu,
        trust: income.treasury.trust,
      },
      upkeepPaid: income.upkeep,
      grownCities: grown,
      researchSpent: 0,
      researchReadyTopicId: undefined,
      bankrupt,
    },
  };
}

/** REFRESH: give every unit of the faction its movement back. */
function refreshPhase(state: GameState, factionId: string): GameState {
  const units = new Map(state.units);
  for (const [id, unit] of units) {
    if (unit.factionId !== factionId) continue;
    units.set(id, {
      ...unit,
      // A fortified unit stays put until ordered elsewhere, so it keeps no
      // movement and does not appear in the "units still to move" list.
      movesLeft: unit.fortified ? 0 : unitType(unit.typeId).movement,
    });
  }
  return { ...state, units };
}

/**
 * End the active faction's turn.
 *
 * With one faction this is the whole turn. When antagonists arrive their AI
 * runs between the upkeep and refresh phases.
 */
export function endTurn(state: GameState): TurnResult {
  const factionId = state.activeFactionId;
  const afterUpkeep = upkeepPhase(state, factionId);
  const funded = fundResearch(afterUpkeep.state, factionId);
  const refreshed = refreshPhase(funded.state, factionId);

  return {
    state: { ...refreshed, turn: refreshed.turn + 1 },
    report: {
      ...afterUpkeep.report,
      researchSpent: funded.spent,
      researchReadyTopicId: funded.readyTopicId ?? researchReady(funded.state),
    },
  };
}
