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
import { reviewOpportunities, reviewPhase, type ReviewOpportunity } from '../rules/review.js';
import { runFactionTurn, garrisonPhase, type AiEvent } from '../rules/ai.js';
import { productionPhase, type ProductionEvent } from '../rules/production.js';
import { checkOutcome, type Outcome } from '../rules/victory.js';
import type { GameState } from '../state/index.js';

export interface TurnOptions {
  /**
   * Topics the learning layer says have fallen due.
   *
   * Passed in rather than looked up, because the engine has no idea what a
   * topic is or when it should come back. Omitting it disables reviews
   * entirely, which is what the standalone strategy game does (D35).
   */
  readonly dueTopics?: readonly string[] | undefined;
  /**
   * How well the player answered when an antagonist raids them, in -1..+1.
   *
   * Defaults to zero, which means no challenge was asked and the raid is
   * fought on the units alone. It is an option rather than a callback because
   * the engine stays synchronous and pure: asking a human a question is the
   * app's job, exactly as it is for research (D35).
   */
  readonly defenderChallengeScore?: number | undefined;
}

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
  /**
   * Council reviews the player can hold next turn.
   *
   * Reported as an opportunity rather than a demand: this is the list the UI
   * flags on cities, and ignoring it costs only the bonus (D49).
   */
  readonly reviewsAvailable: readonly ReviewOpportunity[];
  /** Reviews that were available this turn and were not held. */
  readonly reviewsIgnored: readonly ReviewOpportunity[];
  /** Cities whose unrest rose this turn. */
  readonly citiesUnsettled: readonly string[];
  /**
   * Everything the antagonists did, in the order they did it.
   *
   * The app replays this as movement and duels. It is a list rather than a
   * summary because "the Silo Horde attacked" and "the Silo Horde attacked
   * your Architect and killed it" are different messages, and only the second
   * one tells the player where to look.
   */
  readonly enemyEvents: readonly AiEvent[];
  /** Compute moved into production this turn. */
  readonly productionSpent: number;
  /** Units that finished building and are standing in the world. */
  readonly unitsBuilt: readonly ProductionEvent[];
  /** Cities that finished something with nowhere to put it. */
  readonly citiesBlocked: readonly string[];
  /**
   * How the game stands, or undefined while it is still being played.
   *
   * Computed after the antagonists have moved, so a raid that takes the last
   * unit ends the game on the turn it happens rather than the turn after.
   */
  readonly outcome: Outcome | undefined;
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
      reviewsAvailable: [],
      reviewsIgnored: [],
      citiesUnsettled: [],
      enemyEvents: [],
      productionSpent: 0,
      unitsBuilt: [],
      citiesBlocked: [],
      outcome: undefined,
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
 * The antagonists move last, after the player's upkeep, research and refresh.
 * Putting them at the end means the board the player sees at the start of
 * their turn is the board they will act on: an opponent that moved *after*
 * the screen was drawn would look like it teleported.
 */
export function endTurn(state: GameState, options: TurnOptions = {}): TurnResult {
  const factionId = state.activeFactionId;
  const afterUpkeep = upkeepPhase(state, factionId);

  // UNREST: anything still due at the end of a turn was not attended to. A
  // review the player actually held has already been rescheduled by the
  // learning layer and is therefore no longer in this list.
  const due = options.dueTopics ?? [];
  const reviewed = reviewPhase(afterUpkeep.state, due, factionId);

  /*
   * PRODUCTION before RESEARCH, both drawing on Compute.
   *
   * Production is capped per city per turn and research is not, so running
   * production first lets a queued unit take its slice while research still
   * sweeps up everything left. The other order would starve production
   * completely whenever a topic was being studied, which is most of the game.
   */
  const produced = productionPhase(reviewed.state, factionId);
  const funded = fundResearch(produced.state, factionId);
  const refreshed = refreshPhase(funded.state, factionId);

  /*
   * ENEMY: every faction that is not the one whose turn just ended.
   *
   * Each is refreshed before it acts, because `refreshPhase` only ever
   * restored movement for the faction ending its turn. Without that the
   * antagonists would spend the movement they were created with and then
   * stand still for the rest of the game, which is indistinguishable from
   * having no opponent at all.
   */
  let world = refreshed;
  const enemyEvents: AiEvent[] = [];
  for (const id of [...world.factions.keys()].filter((f) => f !== factionId)) {
    // Villages raise troops first, so a unit mustered this turn is on the map
    // when the faction plans, but with no moves left to use.
    const raised = garrisonPhase(refreshPhase(world, id), id);
    enemyEvents.push(...raised.events);
    const played = runFactionTurn(raised.state, id, {
      defenderChallengeScore: options.defenderChallengeScore ?? 0,
    });
    world = played.state;
    enemyEvents.push(...played.events);
  }

  const next: GameState = { ...world, turn: world.turn + 1 };

  return {
    state: next,
    report: {
      ...afterUpkeep.report,
      researchSpent: funded.spent,
      researchReadyTopicId: funded.readyTopicId ?? researchReady(funded.state),
      // Recomputed against the new turn, so a city that reviewed this turn is
      // offered again next turn rather than looking permanently spent.
      reviewsAvailable: reviewOpportunities(next, due, factionId),
      reviewsIgnored: reviewed.ignored,
      citiesUnsettled: reviewed.unsettled,
      enemyEvents,
      productionSpent: produced.spent,
      unitsBuilt: produced.built,
      citiesBlocked: produced.blocked,
      outcome: checkOutcome(next, factionId),
    },
  };
}
