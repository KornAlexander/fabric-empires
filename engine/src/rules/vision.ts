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
import { unitType, type City, type SeenCity } from '../entities/index.js';
import { isBreached } from './walls.js';
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
  factionId?: string,
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
  /*
   * ⚠️ Towns passed EN ROUTE are photographed too, not just ones still in
   * sight at the destination.
   *
   * A scout that marches six hexes past a village and keeps going would
   * otherwise remember the ground and not the village, which is precisely the
   * "I found it once and now I cannot find it again" case. Only collected
   * when there is a town to collect, so the common march over empty country
   * allocates nothing.
   *
   * ⚠️ The town hexes are indexed ONCE. This runs for every step of every
   * move by every AI unit on the map, and a scan of the city list per hex per
   * step is the kind of nested loop that only shows up as a slow turn.
   */
  const townHexes = new Set<string>();
  for (const city of state.cities.values()) townHexes.add(hexKey(city.hex));

  /*
   * ⚠️ **Only the human's marches fill the human's memory.**
   *
   * `moveUnit` is the same function the antagonists use, so without this the
   * player's map would fill in with every town the seven AI factions happened
   * to walk past. That is not a small leak: they roam the whole map, so it
   * would hand the player the entire town list within a few turns while the
   * ground around it stayed dark, which looks less like a feature than like
   * the fog being broken.
   *
   * Decided from `isPlayer` on the faction rather than by importing
   * `PLAYER_FACTION_ID`: that constant lives in the module which imports this
   * one, and taking the value rather than the type would close the cycle.
   */
  const mine = factionId === undefined || state.factions.get(factionId)?.isPlayer === true;

  let passed: Set<string> | undefined;
  for (const step of steps) {
    for (const hex of hexSpiral(step, sight)) {
      const key = hexKey(hex);
      // Off-map hexes are not secrets, they are nothing.
      if (!state.map.tiles.has(key)) continue;
      if (mine && townHexes.has(key)) (passed ??= new Set()).add(key);
      if (state.explored.has(key)) continue;
      (fresh ??= []).push(key);
    }
  }

  const remembered = passed ? rememberCities(state, passed) : state;
  if (!fresh) return remembered;

  const explored = new Set(remembered.explored);
  for (const key of fresh) explored.add(key);
  return { ...remembered, explored };
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

  /*
   * ⚠️ Town memory is the HUMAN's, and this function runs for every faction.
   * See the note in `rememberAlong`: without the guard the seven antagonists
   * would fill the player's map in for them.
   */
  const withCities = state.factions.get(factionId)?.isPlayer
    ? rememberCities(state, visible)
    : state;
  if (added === 0) return withCities;

  const explored = new Set(withCities.explored);
  for (const key of visible) explored.add(key);
  return { ...withCities, explored };
}

/**
 * Update the town memory from whatever is in sight right now.
 *
 * Three cases, and the third is the one that makes this a memory rather than
 * a growing pile of ghosts:
 *
 *   - a town in sight is photographed, replacing any older picture;
 *   - a town out of sight is left exactly as it was, however stale;
 *   - a remembered tile that is in sight and has NO town on it forgets.
 *
 * ⚠️ **That last case is what stops a razed town haunting the map for ever.**
 * Without it, taking a village off the board would leave its ghost standing
 * on empty ground, and the one place the player could check, by walking back,
 * is exactly where the lie would persist.
 *
 * Returns the same state when nothing changed, because this runs every turn
 * and most turns see no town at all.
 */
export function rememberCities(state: GameState, visible: ReadonlySet<string>): GameState {
  let next: Map<string, SeenCity> | undefined;

  const seenNow = new Map<string, City>();
  for (const city of state.cities.values()) {
    if (visible.has(hexKey(city.hex))) seenNow.set(hexKey(city.hex), city);
  }

  for (const [key, city] of seenNow) {
    const before = state.seenCities.get(key);
    const picture: SeenCity = {
      hex: city.hex,
      name: city.name,
      factionId: city.factionId,
      kind: city.kind,
      rank: city.rank,
      population: city.population,
      wallLevel: city.wallLevel,
      breached: isBreached(city),
      turnSeen: state.turn,
    };
    if (before && samePicture(before, picture)) continue;
    (next ??= new Map(state.seenCities)).set(key, picture);
  }

  // Forget anything that is visibly no longer there.
  for (const key of state.seenCities.keys()) {
    if (!visible.has(key) || seenNow.has(key)) continue;
    (next ??= new Map(state.seenCities)).delete(key);
  }

  if (!next) return state;
  return { ...state, seenCities: next };
}

/**
 * Whether two pictures are the same one.
 *
 * ⚠️ `turnSeen` is excluded on purpose. Including it would make every turn a
 * change, which would rebuild the memory map and every ghost model in the
 * scene once a turn for a town that has not altered in any way. The staleness
 * a player cares about is "has anything happened since", not "how many turns
 * have I been staring at it".
 */
function samePicture(a: SeenCity, b: SeenCity): boolean {
  return (
    a.name === b.name &&
    a.factionId === b.factionId &&
    a.kind === b.kind &&
    a.rank === b.rank &&
    a.population === b.population &&
    a.wallLevel === b.wallLevel &&
    a.breached === b.breached
  );
}

/** Whether the player has ever seen this hex. */
export function isExplored(state: GameState, hex: Hex): boolean {
  return state.explored.has(hexKey(hex));
}
