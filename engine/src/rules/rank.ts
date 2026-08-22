/**
 * Settlements rising.
 *
 * ⚠️ **Called by the app, not by the turn pipeline, and that is on purpose.**
 * Promotion needs to know how well each topic is retained, and that lives in
 * the spaced-repetition data on the other side of the D35 line. Threading a
 * knowledge callback down through `runUpkeep` would put a certification-shaped
 * hole in the middle of the engine's turn loop for the sake of one rule. So
 * the caller, which already holds the mastery tracker, hands in a plain
 * function of an opaque topic id and calls this after upkeep.
 */

import {
  nextRankNeed,
  promotionFor,
  rankInfo,
  type CityRankInfo,
  type StrengthOf,
} from '../entities/rank.js';
import type { City } from '../entities/index.js';
import type { GameState } from '../state/index.js';

export interface Promotion {
  readonly cityId: string;
  readonly cityName: string;
  readonly from: CityRankInfo;
  readonly to: CityRankInfo;
}

export interface PromotionResult {
  readonly state: GameState;
  readonly promoted: readonly Promotion[];
}

/**
 * Raise every settlement that has earned it.
 *
 * Returns the same state object when nothing changed, so a caller can skip a
 * redraw cheaply and so this is safe to run every turn.
 */
export function promoteCities(
  state: GameState,
  strengthOf: StrengthOf,
  factionId: string = state.activeFactionId,
): PromotionResult {
  const promoted: Promotion[] = [];
  let cities: Map<string, City> | undefined;

  for (const [id, city] of state.cities) {
    if (city.factionId !== factionId) continue;
    const next = promotionFor(city, strengthOf);
    if (!next) continue;

    promoted.push({
      cityId: id,
      cityName: city.name,
      from: rankInfo(city.rank),
      to: next,
    });
    cities ??= new Map(state.cities);
    cities.set(id, {
      ...city,
      rank: next.id,
      // A bigger place is harder to take. Granted rather than healed: the
      // ceiling moves up and the current damage is kept.
      hp: city.hp + (next.bonusHp - rankInfo(city.rank).bonusHp),
    });
  }

  if (!cities) return { state, promoted: [] };
  return { state: { ...state, cities }, promoted };
}

/**
 * Settlements that have the citizens but not the knowledge.
 *
 * The interesting list, and the one worth putting in front of a player: these
 * are the towns held back purely by revision. Everything else is waiting on
 * food, which time fixes on its own.
 */
export function stalledOnKnowledge(
  state: GameState,
  strengthOf: StrengthOf,
  factionId: string = state.activeFactionId,
): readonly City[] {
  const out: City[] = [];
  for (const city of state.cities.values()) {
    if (city.factionId !== factionId) continue;
    if (nextRankNeed(city, strengthOf)?.blockedByKnowledge) out.push(city);
  }
  return out;
}
