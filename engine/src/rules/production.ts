import { hexNeighbours, type Hex } from '../hex/index.js';
import {
  unitType,
  type City,
  type Unit,
  type UnitType,
  type UnitTypeId,
  UNIT_TYPE_IDS,
} from '../entities/index.js';
import { canStandOn } from './movement.js';
import { tileAt, unitAt, type GameState } from '../state/index.js';

/**
 * Building things.
 *
 * The last phase from the plan that had no implementation. Until now a city
 * collected resources and did nothing with them, which meant an empire could
 * lose units and never replace one: once the Silo Horde started raiding, the
 * game had no counterplay in it at all.
 *
 * ⚠️ **Production spends Compute, the same resource as research, and that is
 * the point.** Every Compute spent on a soldier is a Compute not spent on
 * learning something. In a game whose subject is studying, that is the
 * tension worth having, and it means a player who ignores the tech tree to
 * build an army wins the battle and loses the exam.
 *
 * The tech tree is also what hands out the army: `unlockedBySkill` on a unit
 * type is a 1-based index into the topic graph, so a Pipeline Runner exists
 * only once its skill is known. That field has been sitting in the unit table
 * since the beginning with nothing reading it.
 */

/**
 * The most Compute a single city may draw in one turn.
 *
 * ⚠️ Without a cap, production and research fight over the same treasury and
 * whichever is funded first takes all of it: a player who queued a unit would
 * silently stop researching, and the tech tree would look broken rather than
 * starved. The cap means both advance every turn, and a queued unit costs a
 * few turns rather than everything.
 */
export const PRODUCTION_CAP_PER_TURN = 15;

/** Flat cost every unit pays before its strength is considered. */
export const PRODUCTION_BASE_COST = 24;

export function unitCost(type: UnitType): number {
  return Math.round(PRODUCTION_BASE_COST + type.strength * 1.5);
}

/**
 * Whether the tech tree has unlocked this unit yet.
 *
 * `unlockedBySkill` is a 1-based index into the topic graph rather than a
 * topic id, because the engine must not assume anything about what a topic id
 * looks like (D35). An index past the end of the graph means "not in this
 * tree", which is locked rather than free: a generic tree with six nodes
 * should not hand out the Direct Lake Titan.
 */
export function unitUnlocked(state: GameState, typeId: UnitTypeId): boolean {
  const skill = unitType(typeId).unlockedBySkill;
  if (skill === null) return true;
  const node = state.topics.nodes[skill - 1];
  if (!node) return false;
  return state.research.known.includes(node.id);
}

/** Every unit type this faction could currently queue. */
export function buildableUnits(state: GameState): UnitTypeId[] {
  return UNIT_TYPE_IDS.filter((id) => unitUnlocked(state, id));
}

export type ProductionResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: string };

/**
 * Order a city to build something.
 *
 * Switching to a different unit keeps the progress. Half-built things are a
 * classic place to punish a player for changing their mind, and there is
 * nothing to be learned from it here.
 */
export function setProduction(
  state: GameState,
  cityId: string,
  typeId: UnitTypeId,
): ProductionResult {
  const city = state.cities.get(cityId);
  if (!city) return { ok: false, reason: 'No such city' };
  if (city.factionId !== state.activeFactionId) {
    return { ok: false, reason: 'Not your city' };
  }
  if (!unitUnlocked(state, typeId)) {
    return { ok: false, reason: `${unitType(typeId).label} has not been researched` };
  }

  const cities = new Map(state.cities);
  cities.set(cityId, { ...city, producing: typeId });
  return { ok: true, state: { ...state, cities } };
}

/** Stop building, keeping whatever Compute has already gone in. */
export function cancelProduction(state: GameState, cityId: string): ProductionResult {
  const city = state.cities.get(cityId);
  if (!city) return { ok: false, reason: 'No such city' };
  const cities = new Map(state.cities);
  const next = { ...city };
  delete (next as { producing?: UnitTypeId }).producing;
  cities.set(cityId, next);
  return { ok: true, state: { ...state, cities } };
}

/** Where a newly built unit can stand: the city itself, or beside it. */
export function musterTile(state: GameState, city: City): Hex | undefined {
  const type = (id: UnitTypeId) => unitType(id);
  const candidate = (hex: Hex): boolean => {
    const tile = tileAt(state, hex);
    if (!tile) return false;
    if (unitAt(state, hex)) return false;
    return canStandOn(type(city.producing ?? 'engineer'), tile);
  };
  if (candidate(city.hex)) return city.hex;
  return hexNeighbours(city.hex).find(candidate);
}

export interface ProductionEvent {
  readonly cityId: string;
  readonly typeId: UnitTypeId;
  readonly unitId: string;
  readonly hex: Hex;
}

export interface ProductionTick {
  readonly state: GameState;
  readonly spent: number;
  readonly built: readonly ProductionEvent[];
  /** Cities that finished something but had nowhere to put it. */
  readonly blocked: readonly string[];
}

/**
 * PRODUCTION: move Compute into what each city is building, and muster what
 * is finished.
 *
 * Cities are processed in id order so a treasury that cannot fund all of them
 * funds the same ones every time.
 */
export function productionPhase(state: GameState, factionId: string): ProductionTick {
  const faction = state.factions.get(factionId);
  if (!faction) return { state, spent: 0, built: [], blocked: [] };

  const ids = [...state.cities.keys()].sort();
  const cities = new Map(state.cities);
  const units = new Map(state.units);
  const built: ProductionEvent[] = [];
  const blocked: string[] = [];
  let purse = faction.resources.compute;
  let spent = 0;
  let nextEntityId = state.nextEntityId;

  for (const id of ids) {
    const city = cities.get(id);
    if (!city || city.factionId !== factionId || !city.producing) continue;

    const type = unitType(city.producing);
    const cost = unitCost(type);
    const remaining = cost - city.productionProgress;
    const draw = Math.max(0, Math.min(remaining, PRODUCTION_CAP_PER_TURN, purse));
    const progress = city.productionProgress + draw;
    purse -= draw;
    spent += draw;

    if (progress < cost) {
      cities.set(id, { ...city, productionProgress: progress });
      continue;
    }

    // Finished. Find somewhere to stand before spending the progress, so a
    // hemmed-in city keeps its unit rather than losing it to a full tile.
    const working: GameState = { ...state, cities, units };
    const hex = musterTile(working, { ...city, productionProgress: progress });
    if (!hex) {
      blocked.push(id);
      cities.set(id, { ...city, productionProgress: progress });
      continue;
    }

    const unitId = `unit-${nextEntityId++}`;
    const unit: Unit = {
      id: unitId,
      typeId: city.producing,
      factionId,
      hex,
      hp: type.maxHp,
      // Mustered units stand to this turn and march the next one, which stops
      // a city from building and attacking in the same instant.
      movesLeft: 0,
      fortified: false,
    };
    units.set(unitId, unit);
    built.push({ cityId: id, typeId: city.producing, unitId, hex });

    const done = { ...city, productionProgress: 0 };
    // Keep building the same thing, which is what a player almost always
    // wants and saves a click every few turns.
    cities.set(id, done);
  }

  if (spent === 0 && built.length === 0 && blocked.length === 0) {
    return { state, spent: 0, built: [], blocked: [] };
  }

  const factions = new Map(state.factions);
  factions.set(factionId, {
    ...faction,
    resources: { ...faction.resources, compute: faction.resources.compute - spent },
  });

  return {
    state: { ...state, factions, cities, units, nextEntityId },
    spent,
    built,
    blocked,
  };
}
