import { hexDistance, hexKey, type Hex } from '../hex/index.js';
import { isCivilian, unitType, type UnitTypeId } from '../entities/index.js';
import type { GameState } from '../state/index.js';
import { cityAt, unitAt } from '../state/index.js';
import { moveUnit } from './actions.js';
import { canAttack, previewAttack, resolveAttack, type CombatLog } from './combat.js';

/**
 * How many turns of pounding an antagonist will accept before it looks
 * elsewhere.
 *
 * Generous on purpose. A real siege should take several turns, so this must
 * not talk the AI out of a fight it would actually win: it exists to stop the
 * pathological case where the arithmetic says never, not to make antagonists
 * cautious.
 */
export const HOPELESS_ASSAULT_TURNS = 12;
import { findPath, reachable } from './movement.js';
import { musterTile } from './production.js';
import { maxWallHp, mendedBy, wallWork, WALL_MEND_PER_CYCLE } from './walls.js';

/**
 * The antagonist's turn.
 *
 * ⚠️ **Deterministic, with no randomness of its own.** A seed has always
 * decided this game's map and its combat rolls, so an opponent that drew from
 * `Math.random` would be the one thing in it that could not be replayed, and
 * "send a friend your seed and compare" (D39) would quietly stop meaning
 * anything. Every choice below breaks ties on a stable key.
 *
 * The decision is small on purpose. It is one function, {@link planUnitAction},
 * used twice: once by {@link runFactionTurn} to actually act, and once by
 * {@link planFactionTurn} to say what it *would* do without touching the
 * state. Two implementations of "what does the enemy do" would drift, and the
 * one that drifts is always the one nothing asserts.
 *
 * What it does not do yet is as important. It does not build, it does not
 * research, and it does not co-ordinate between units: each unit takes the
 * best move it can see for itself. That is enough to make the map dangerous,
 * which is the thing the game was missing, and it is honest about being
 * enough rather than pretending to be a general.
 */

/** How many times one unit may act in a turn. Move, then strike, then stop. */
const MAX_ACTIONS_PER_UNIT = 3;

/**
 * How far from itself an antagonist will go looking for a fight, in hexes.
 *
 * ⚠️ **This exists because the first version had none, and it was measurably
 * too good.** With a free rein the Silo Horde crossed the map and wiped out a
 * passive player's entire empire by turn six. That is a working opponent and
 * the wrong game: the plan's first raid is meant to be a teaching moment that
 * the player wins, and someone still learning which key fortifies should not
 * lose everything while reading the interface.
 *
 * A radius rather than a timer, because it is stateless. Nothing new is
 * stored on a unit, nothing has to be migrated into old saves, and it keeps
 * the one property that matters: **step inside it and they will always fight
 * back.** A leash is not a truce.
 */
export const BASE_AGGRO_RADIUS = 5;

/**
 * Turns before the horde will look one hex further.
 *
 * The pressure has to arrive eventually or the map is scenery again. Widening
 * rather than switching on means there is no single turn where the game
 * changes character, and it stays a pure function of the turn number, so a
 * replayed seed meets the same opposition at the same time.
 */
export const AGGRO_TURNS_PER_HEX = 3;

/**
 * The map these numbers were measured against.
 *
 * ⚠️ **The leash is proportional to the world, not a fixed number of hexes.**
 * Both constants above were tuned on a radius-25 map, where the first raid
 * lands on turn 9 to 20. Left absolute, a map three times the area would put
 * the far camps 45 hexes away and the leash would take 121 turns to reach
 * them: six of the seven factions would simply never arrive, and making the
 * map bigger would quietly make the game emptier.
 *
 * Scaling by the ratio keeps the measured pacing wherever the map size ends
 * up, because a camp's distance scales with the map for the same reason.
 */
export const REFERENCE_MAP_RADIUS = 25;

export function aggroRadius(turn: number, mapRadius: number = REFERENCE_MAP_RADIUS): number {
  const scale = Math.max(1, mapRadius) / REFERENCE_MAP_RADIUS;
  const widened = BASE_AGGRO_RADIUS + Math.floor(Math.max(0, turn - 1) / AGGRO_TURNS_PER_HEX);
  return widened * scale;
}

export type AiIntent =
  | {
      readonly kind: 'move';
      readonly unitId: string;
      readonly to: Hex;
      /** What the unit is walking towards, for the log and for tests. */
      readonly towards: Hex;
    }
  | {
      readonly kind: 'raid';
      readonly unitId: string;
      readonly target: Hex;
      readonly targetKind: 'unit' | 'city';
    };

export interface AiEvent {
  readonly factionId: string;
  readonly unitId: string;
  readonly intent: AiIntent;
  /** Present for a raid that was actually fought. */
  readonly log?: CombatLog;
}

export interface AiTurnResult {
  readonly state: GameState;
  readonly events: readonly AiEvent[];
}

/**
 * Units in a stable order.
 *
 * Ids look like `unit-12`, and a plain string sort puts `unit-12` before
 * `unit-2`. That is still deterministic, so nothing would break, but the order
 * would jump around as a game grows and any test reading the event list would
 * look arbitrary. Sorting on the number reads the way the ids do.
 */
function inTurnOrder(ids: readonly string[]): string[] {
  const rank = (id: string): number => {
    const n = Number.parseInt(id.replace(/^\D+/, ''), 10);
    return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
  };
  return [...ids].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/**
 * Every tile holding something this faction would like to attack.
 *
 * ⚠️ **Antagonists are hostile to the player and to nobody else.** The first
 * version returned everything not their own, and with seven factions on the
 * map that meant they spent the opening turns fighting each other: the first
 * raid landed on turn 2 of every seed and had nothing to do with the player,
 * who then watched their opposition delete itself for free.
 *
 * There is no diplomacy model here and there should not be one. These are
 * seven misconceptions besieging a learner, not seven nations with interests.
 * The player is hostile to everyone; everyone is hostile to the player.
 */
function targetsFor(state: GameState, factionId: string): Hex[] {
  const acting = state.factions.get(factionId);
  const hostile = (ownerId: string): boolean => {
    if (ownerId === factionId) return false;
    if (acting?.isPlayer) return true;
    return state.factions.get(ownerId)?.isPlayer === true;
  };

  const out: Hex[] = [];
  for (const city of state.cities.values()) {
    if (hostile(city.factionId)) out.push(city.hex);
  }
  for (const unit of state.units.values()) {
    if (hostile(unit.factionId)) out.push(unit.hex);
  }
  return out;
}

/**
 * What one unit should do right now, or nothing.
 *
 * Order of preference: hit something in reach, otherwise walk towards the
 * nearest thing worth hitting. A city outranks a unit at equal distance
 * because a captured city is the only permanent gain on this map.
 */
export function planUnitAction(state: GameState, unitId: string): AiIntent | undefined {
  const unit = state.units.get(unitId);
  if (!unit || unit.movesLeft <= 0) return undefined;

  const type = unitType(unit.typeId);
  const hostile = targetsFor(state, unit.factionId);

  if (!isCivilian(unit.typeId)) {
    let best: { hex: Hex; kind: 'unit' | 'city'; score: number } | undefined;
    for (const hex of hostile) {
      if (hexDistance(unit.hex, hex) > Math.max(1, type.range)) continue;
      if (!canAttack(state, unitId, hex).ok) continue;

      const city = cityAt(state, hex);
      const defender = unitAt(state, hex);
      const kind: 'unit' | 'city' = !defender && city ? 'city' : 'unit';

      /*
       * ⚠️ **Do not batter a fortress that cannot be broken** (section 19.2).
       *
       * Cities outrank units, so without this an army that reaches a walled
       * capital stands there hitting it at the damage floor for the rest of
       * the game while a soft target waits one hex away. Walls made that
       * reachable: they roughly double the defence, and the floor is
       * `MIN_DAMAGE`.
       *
       * The test is how long the target would take at the rate actually being
       * achieved, which is a number the engine already computes for the
       * player's own odds display. Nothing here guesses at wall levels.
       */
      if (kind === 'city' && city) {
        const preview = previewAttack(state, unitId, hex);
        if (preview) {
          const perHit = preview.expectedDamageToDefender;
          const shield = city.wallHp + city.hp;
          if (perHit <= 0 || shield / perHit > HOPELESS_ASSAULT_TURNS) continue;
        }
      }

      // Lower is better: cities first, then whatever is closest to dying.
      const score = (kind === 'city' ? 0 : 1_000) + (defender?.hp ?? city?.hp ?? 0);
      if (!best || score < best.score || (score === best.score && hexKey(hex) < hexKey(best.hex))) {
        best = { hex, kind, score };
      }
    }
    if (best) {
      return { kind: 'raid', unitId, target: best.hex, targetKind: best.kind };
    }
  }

  // Nothing in reach, so close the distance. Civilians walk too: an enemy
  // settler wandering the map is a target the player can take, which is more
  // interesting than one that stands in its camp forever.
  //
  // Only towards something inside the leash, though. Everything further away
  // is not yet this faction's business.
  const limit = aggroRadius(state.turn, state.map.radius);
  let towards: Hex | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const hex of hostile) {
    const distance = hexDistance(unit.hex, hex);
    if (distance > limit) continue;
    if (distance < bestDistance || (distance === bestDistance && towards && hexKey(hex) < hexKey(towards))) {
      bestDistance = distance;
      towards = hex;
    }
  }
  if (!towards) return undefined;

  const planned = findPath(state, unit, towards);
  if (!planned || planned.path.length < 2) return undefined;

  /*
   * Walk as far along the path as this turn allows.
   *
   * ⚠️ The last tile of the path is the target itself, which is occupied, so
   * it is never a legal destination. Stepping backwards from the end and
   * taking the first tile that is genuinely reachable also handles zones of
   * control and terrain costs, because `reachable` is the same function that
   * constrains the player.
   */
  const reach = reachable(state, unit);
  for (let i = planned.path.length - 2; i >= 1; i--) {
    const step = planned.path[i]!;
    if (reach.has(hexKey(step))) {
      return { kind: 'move', unitId, to: step, towards };
    }
  }
  return undefined;
}

/** What the faction would do from this state, without changing it. */
export function planFactionTurn(state: GameState, factionId: string): AiIntent[] {
  const ids = inTurnOrder(
    [...state.units.values()].filter((u) => u.factionId === factionId).map((u) => u.id),
  );
  const out: AiIntent[] = [];
  for (const id of ids) {
    const intent = planUnitAction(state, id);
    if (intent) out.push(intent);
  }
  return out;
}

/**
 * Play the faction's turn.
 *
 * ⚠️ **`activeFactionId` is switched for the duration and restored at the end.**
 * `moveUnit` and `canAttack` both refuse a unit that does not belong to the
 * active faction, which is exactly right and means an AI turn has to genuinely
 * be that faction's turn rather than a special case that bypasses the rules.
 * Every move the opponent makes is therefore legal by the same code that
 * judges the player's.
 *
 * Units are re-planned after each action, so one can close the distance and
 * strike in the same turn if it has the movement for it.
 */
/**
 * Turns a village spends raising one unit.
 *
 * ⚠️ **Deliberately slow.** The antagonists are not plugged into the economy:
 * they have no treasury the player can see, so an income-driven garrison would
 * look arbitrary. A fixed cadence is legible instead, and it is the single knob
 * that decides whether villages are a standing threat or scenery. Measured
 * against the section 16.7 experiment before it was allowed to stay.
 */
export const GARRISON_INTERVAL_TURNS = 6;

/**
 * Units a faction may field from its villages.
 *
 * Counts the whole faction, not the city, so seven factions cannot each grow an
 * unbounded army while the player is busy elsewhere. Starting strength is two,
 * so this is room for two more.
 */
export const MAX_GARRISON_PER_FACTION = 4;

/** What a village raises. Melee, because a village defends and marches. */
const GARRISON_UNIT: UnitTypeId = 'pipelineRunner';

/**
 * Villages raise troops.
 *
 * Uses `productionProgress` as the counter rather than adding state, because it
 * is already on every city, already saved, and already means exactly this.
 * A faction at its cap holds at the threshold instead of resetting, so losing a
 * unit is followed by a replacement rather than another six turns of nothing.
 */
export function garrisonPhase(state: GameState, factionId: string): AiTurnResult {
  const faction = state.factions.get(factionId);
  if (!faction || faction.isPlayer) return { state, events: [] };

  const cities = new Map(state.cities);
  const units = new Map(state.units);
  const events: AiEvent[] = [];
  let nextEntityId = state.nextEntityId;
  let standing = [...state.units.values()].filter((u) => u.factionId === factionId).length;
  let changed = false;

  for (const id of [...state.cities.keys()].sort()) {
    const city = state.cities.get(id)!;
    if (city.factionId !== factionId) continue;

    const progress = city.productionProgress + 1;
    if (progress < GARRISON_INTERVAL_TURNS) {
      cities.set(id, { ...city, productionProgress: progress });
      changed = true;
      continue;
    }
    if (standing >= MAX_GARRISON_PER_FACTION) {
      /*
       * ⚠️ **An army at full strength digs in.**
       *
       * This cycle used to be thrown away: a faction at its unit cap held at
       * the threshold and did nothing with the tick. Walls were therefore
       * something only the player ever had, which left half the siege system
       * unexercised in an actual game and made every antagonist city a soft
       * target no matter how late it was taken.
       *
       * Spending the spare cycle here keeps the AI's simple-timer model, needs
       * no new saved field, and gives the same competition the player has:
       * troops first, earthworks with what is left over. A faction that loses
       * units drops below the cap and goes back to raising them, which is the
       * right priority.
       *
       * `wallWork` is the player's own rule, so an antagonist mends a breach
       * exactly as a player would and stops when there is nothing to do.
       */
      const work = wallWork(city);
      if (work) {
        // ⚠️ A raise builds the new course to its full height, because that is
        // what building it means. A **mend** only patches: this cycle is free,
        // and a free rebuild to full made a level-three wall unbreakable by
        // anything but the heaviest unit in the game. See WALL_MEND_PER_CYCLE.
        const raising = work.kind === 'raise';
        const level = raising ? work.level : city.wallLevel;
        cities.set(id, {
          ...city,
          wallLevel: level,
          wallHp: raising ? maxWallHp(level) : mendedBy(city, WALL_MEND_PER_CYCLE),
          productionProgress: 0,
        });
        changed = true;
        continue;
      }
      // Nothing left to raise or mend: ready, but with nowhere to put anyone.
      cities.set(id, { ...city, productionProgress: GARRISON_INTERVAL_TURNS });
      changed = true;
      continue;
    }

    const spot = musterTile({ ...state, cities }, { ...city, producing: GARRISON_UNIT });
    if (!spot) {
      cities.set(id, { ...city, productionProgress: GARRISON_INTERVAL_TURNS });
      changed = true;
      continue;
    }

    const unitId = `unit-${nextEntityId++}`;
    const type = unitType(GARRISON_UNIT);
    units.set(unitId, {
      id: unitId,
      typeId: GARRISON_UNIT,
      factionId,
      hex: spot,
      hp: type.maxHp,
      movesLeft: 0, // raised this turn, marches the next one
      fortified: false,
    });
    cities.set(id, { ...city, productionProgress: 0 });
    standing += 1;
    changed = true;
    events.push({
      factionId,
      unitId,
      intent: { kind: 'move', unitId, to: spot, towards: spot },
    });
  }

  if (!changed) return { state, events };
  return { state: { ...state, cities, units, nextEntityId }, events };
}

export function runFactionTurn(
  state: GameState,
  factionId: string,
  options: { readonly defenderChallengeScore?: number } = {},
): AiTurnResult {
  const events: AiEvent[] = [];
  const restoreTo = state.activeFactionId;
  let current: GameState = { ...state, activeFactionId: factionId };

  const ids = inTurnOrder(
    [...current.units.values()].filter((u) => u.factionId === factionId).map((u) => u.id),
  );

  for (const id of ids) {
    for (let step = 0; step < MAX_ACTIONS_PER_UNIT; step++) {
      const intent = planUnitAction(current, id);
      if (!intent) break;

      if (intent.kind === 'move') {
        const moved = moveUnit(current, id, intent.to);
        // A refused move means the plan and the rules disagree, and repeating
        // it would spin. Give up on this unit rather than loop.
        if (!moved.ok) break;
        current = moved.state;
        events.push({ factionId, unitId: id, intent });
        continue;
      }

      const fought = resolveAttack(current, id, intent.target, {
        defenderChallengeScore: options.defenderChallengeScore ?? 0,
      });
      if (!fought.ok) break;
      current = fought.result.state;
      events.push({ factionId, unitId: id, intent, log: fought.result.log });
      // One strike each. Attacking spends the unit's turn.
      break;
    }
  }

  return { state: { ...current, activeFactionId: restoreTo }, events };
}
