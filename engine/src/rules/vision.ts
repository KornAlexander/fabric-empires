/**
 * What the player can see, and what they merely remember.
 *
 * The whole map used to be visible from turn one, which gave away all seven
 * camps before a single move, removed every reason to scout, and left the
 * Profiler as nothing but a faster soldier.
 *
 * Three states, and the difference between the last two is the whole feature:
 *
 *   - **visible**: something of yours can see it right now. Drawn live.
 *   - **explored**: you have seen it before. The ground is remembered; what is
 *     standing on it now is not.
 *   - **unseen**: never seen. Draws as nothing at all.
 *
 * ⚠️ **The antagonists do not use fog, and that is deliberate** (section 21.3).
 * They know where the player is. Seven factions wandering a dark map looking
 * for someone would not be a harder game, it would be an absent one: they are a
 * besieging pressure on a learner, not an opponent in a fair match, and the
 * aggro leash is what keeps that fair rather than mutual blindness.
 *
 * ⚠️ **So only the player's memory is stored.** The plan (21.2) said "per
 * faction", which 21.3 then makes pointless: six of the seven would never read
 * theirs. One set, documented, rather than a map of sets that is empty for
 * everybody but one.
 */

import { hexKey, hexSpiral, type Hex } from '../hex/index.js';
import { unitType } from '../entities/index.js';
import type { GameState } from '../state/gameState.js';

/**
 * How far a city sees.
 *
 * A settlement watches its own territory and a little beyond. Slightly more
 * than `CITY_WORK_RADIUS`, so founding a city always shows you the ground it
 * is about to start working.
 */
export const CITY_SIGHT = 3;

/**
 * Fold in what ONE unit would see standing at each hex of a route.
 *
 * ⚠️ **Deliberately not `rememberVisible` per step.** That recomputes sight for
 * the entire faction, every city and every other unit included, none of which
 * moved. Calling it once per hex of a march made the engine's own world-setup
 * tests time out under load: a march of three hexes did three full-faction
 * sweeps to learn what one scout could see.
 *
 * Nothing else on the board changes while a single unit walks, so the only new
 * knowledge is its own sight radius along the way.
 */
export function rememberAlong(
  state: GameState,
  steps: readonly Hex[],
  sight: number,
): GameState {
  if (steps.length === 0) return state;

  /*
   * ⚠️ **Collect first, copy only if there is something to copy.**
   *
   * Most moves reveal nothing: the AI walks its own units around ground it has
   * already explored, all game long. Copying the explored set before checking
   * meant cloning up to 6,211 strings on every one of those, which is what
   * made the world-setup tests time out. `rememberVisible` has always had this
   * shape for the same reason.
   */
  let fresh: string[] | undefined;
  for (const step of steps) {
    for (const hex of hexSpiral(step, sight)) {
      const key = hexKey(hex);
      // Off-map hexes are not secrets, they are nothing.
      if (!state.map.tiles.has(key)) continue;
      if (state.explored.has(key)) continue;
      (fresh ??= []).push(key);
    }
  }
  if (!fresh) return state;

  const explored = new Set(state.explored);
  for (const key of fresh) explored.add(key);
  return { ...state, explored };
}

/**
 * Every hex this faction can see right now.
 *
 * ⚠️ Named `sightOf` rather than `visibleHexes`, which the renderer already
 * uses for camera culling. Those are two genuinely different questions, "what
 * is on screen" and "what does this empire know about", and a shared name would
 * eventually get them confused.
 */
export function sightOf(state: GameState, factionId: string): Set<string> {
  const seen = new Set<string>();

  const add = (centre: Hex, radius: number): void => {
    for (const hex of hexSpiral(centre, radius)) {
      const key = hexKey(hex);
      // Off-map hexes are not secrets, they are nothing.
      if (state.map.tiles.has(key)) seen.add(key);
    }
  };

  for (const unit of state.units.values()) {
    if (unit.factionId !== factionId) continue;
    add(unit.hex, unitType(unit.typeId).sight);
  }
  for (const city of state.cities.values()) {
    if (city.factionId !== factionId) continue;
    add(city.hex, CITY_SIGHT);
  }

  return seen;
}

/**
 * Fold what the player can see now into what they have ever seen.
 *
 * Returns the same state when nothing new was revealed, so a turn that
 * uncovered nothing does not churn a fresh Set for every listener downstream.
 */
export function rememberVisible(state: GameState, factionId: string): GameState {
  const visible = sightOf(state, factionId);
  let added = 0;
  for (const key of visible) {
    if (!state.explored.has(key)) added += 1;
  }
  if (added === 0) return state;

  const explored = new Set(state.explored);
  for (const key of visible) explored.add(key);
  return { ...state, explored };
}

/** Whether the player has ever seen this hex. */
export function isExplored(state: GameState, hex: Hex): boolean {
  return state.explored.has(hexKey(hex));
}
