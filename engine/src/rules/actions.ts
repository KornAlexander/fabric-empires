/**
 * Player actions.
 *
 * Every action takes a state and returns either a new state or a refusal with
 * a reason. Nothing throws for an illegal move: the UI needs to know why a
 * button is disabled, and "why not" is part of teaching the rules.
 */

import { hexKey, type Hex } from '../hex/index.js';
import { terrain } from '../map/index.js';
import { cityKind, unitType, type City, type CityKind, type Unit } from '../entities/index.js';
import { FIRST_RANK } from '../entities/rank.js';
import { tileAt, unitAt, type GameState } from '../state/index.js';
import { canFoundCity, pathTo, reachable } from './movement.js';
import { rememberVisible } from './vision.js';

export type ActionResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: string };

function fail(reason: string): ActionResult {
  return { ok: false, reason };
}

function replaceUnit(state: GameState, unit: Unit): GameState {
  const units = new Map(state.units);
  units.set(unit.id, unit);
  return { ...state, units };
}

/**
 * Move a unit to a tile it can reach this turn.
 *
 * Movement is resolved through `reachable`, so every rule that constrains
 * reachability (terrain, occupancy, zones of control, the minimum-move rule)
 * automatically constrains movement too. There is no second implementation to
 * drift out of step with the first.
 */
export function moveUnit(
  state: GameState,
  unitId: string,
  target: Hex,
): ActionResult {
  const unit = state.units.get(unitId);
  if (!unit) return fail('No such unit');
  if (unit.factionId !== state.activeFactionId) return fail('Not your unit');
  if (unit.movesLeft <= 0) return fail('This unit has already moved');

  const targetKey = hexKey(target);
  if (targetKey === hexKey(unit.hex)) return fail('Already there');
  if (!state.map.tiles.has(targetKey)) return fail('Off the map');

  const reach = reachable(state, unit);
  const destination = reach.get(targetKey);
  if (!destination) return fail('Out of range this turn');

  const path = pathTo(reach, target);
  if (!path) return fail('No route');

  // Stepping into a zone of control ends the turn for this unit, whatever it
  // had left. That is the whole point of a zone of control.
  const movesLeft = destination.stops ? 0 : unit.movesLeft - destination.cost;

  const moved = replaceUnit(state, {
    ...unit,
    hex: target,
    movesLeft: Math.max(0, movesLeft),
    fortified: false,
  });

  /*
   * Reveal as you go, not at the end of the turn.
   *
   * ⚠️ A scout that walked six hexes and only lit up the last one would be
   * useless, and worse, would show a corridor of ground it never passed
   * through. Folding sight in after each move is also what makes the fog
   * respond while the player is still deciding where to stop.
   */
  return { ok: true, state: rememberVisible(moved, unit.factionId) };
}

/** Terrain decides what kind of settlement an Architect can raise. */
export function cityKindFor(state: GameState, hex: Hex): CityKind {
  const tile = tileAt(state, hex);
  if (!tile) return 'lakehouse';
  if (tile.terrain === 'deltaHighlands' || tile.terrain === 'parquetQuarry') {
    return 'warehouse';
  }
  if (tile.river) return 'eventhouse';
  return 'lakehouse';
}

export interface FoundCityOptions {
  readonly name?: string;
}

export function foundCity(
  state: GameState,
  unitId: string,
  options: FoundCityOptions = {},
): ActionResult {
  const unit = state.units.get(unitId);
  if (!unit) return fail('No such unit');
  if (unit.factionId !== state.activeFactionId) return fail('Not your unit');
  if (unit.typeId !== 'architect') return fail('Only an Architect can found a city');

  const tile = tileAt(state, unit.hex);
  if (!tile) return fail('Off the map');
  if (!terrain(tile.terrain).settleable) {
    return fail(`Cannot settle on ${terrain(tile.terrain).label}`);
  }
  if (!canFoundCity(state, unit)) return fail('Too close to another city');

  const isFirst = [...state.cities.values()].every(
    (c) => c.factionId !== unit.factionId,
  );
  // The first city of an empire is always the Workspace, which is the joke
  // and also correct: everything in Fabric starts in a workspace.
  const kind: CityKind = isFirst ? 'workspace' : cityKindFor(state, unit.hex);

  const id = `city-${state.nextEntityId}`;
  const city: City = {
    id,
    factionId: unit.factionId,
    hex: unit.hex,
    name: options.name ?? cityKind(kind).label,
    kind,
    hp: cityKind(kind).baseHp,
    population: 1,
    rank: FIRST_RANK,
    growthStore: 0,
    boundSkills: [],
    unrest: 0,
    ignoredReviews: 0,
    reviewBonusUntilTurn: 0,
    lastReviewTurn: -1,
    productionProgress: 0,
    lastRaidedTurn: -1,
  };

  const cities = new Map(state.cities);
  cities.set(id, city);
  const units = new Map(state.units);
  units.delete(unit.id); // the Architect becomes the city

  return {
    ok: true,
    state: { ...state, cities, units, nextEntityId: state.nextEntityId + 1 },
  };
}

/** Dig in: trade movement for defence until the unit is ordered elsewhere. */
export function fortifyUnit(state: GameState, unitId: string): ActionResult {
  const unit = state.units.get(unitId);
  if (!unit) return fail('No such unit');
  if (unit.factionId !== state.activeFactionId) return fail('Not your unit');
  if (unitType(unit.typeId).strength === 0) return fail('Civilians cannot fortify');
  if (unit.fortified) return fail('Already fortified');

  return {
    ok: true,
    state: replaceUnit(state, { ...unit, fortified: true, movesLeft: 0 }),
  };
}

/** Spend the rest of a unit's turn without moving it. */
export function skipUnit(state: GameState, unitId: string): ActionResult {
  const unit = state.units.get(unitId);
  if (!unit) return fail('No such unit');
  if (unit.factionId !== state.activeFactionId) return fail('Not your unit');
  return { ok: true, state: replaceUnit(state, { ...unit, movesLeft: 0 }) };
}

/** Units that still have something to do, so the UI can nag before ending a turn. */
export function idleUnits(state: GameState, factionId: string): Unit[] {
  return [...state.units.values()].filter(
    (u) => u.factionId === factionId && u.movesLeft > 0 && !u.fortified,
  );
}

/** Convenience for the UI: is there a unit here belonging to the active player? */
export function selectableUnitAt(state: GameState, hex: Hex): Unit | undefined {
  const unit = unitAt(state, hex);
  if (!unit || unit.factionId !== state.activeFactionId) return undefined;
  return unit;
}
