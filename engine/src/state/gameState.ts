/**
 * Game state and its construction.
 *
 * `GameState` is plain readonly data. Every rule takes a state and returns a
 * new one, which makes save, load, undo and replay fall out of the design
 * rather than needing machinery.
 */

import {
  hexDistance,
  hexKey,
  hexNeighbours,
  type Hex,
} from '../hex/index.js';
import {
  generateMap,
  isPassableByLand,
  terrain,
  tileYields,
  type GameMap,
  type MapOptions,
  type MapTile,
} from '../map/index.js';
import {
  emptyResources,
  unitType,
  type City,
  type Faction,
  type Unit,
  type UnitTypeId,
} from '../entities/index.js';

export type Difficulty = 'apprentice' | 'analyst' | 'architect';

export interface GameState {
  readonly seed: string;
  readonly difficulty: Difficulty;
  readonly turn: number;
  readonly map: GameMap;
  /**
   * Map generation overrides used for this game.
   *
   * Kept so a save can carry the seed and these few numbers instead of two
   * thousand tiles, and regenerate an identical map on load.
   */
  readonly mapOverrides: Partial<MapOptions>;
  readonly factions: ReadonlyMap<string, Faction>;
  readonly units: ReadonlyMap<string, Unit>;
  readonly cities: ReadonlyMap<string, City>;
  readonly activeFactionId: string;
  /** Monotonic counter behind entity ids, so ids stay stable across saves. */
  readonly nextEntityId: number;
}

export const PLAYER_FACTION_ID = 'player';

export interface NewGameOptions {
  readonly difficulty?: Difficulty;
  readonly map?: Partial<MapOptions>;
}

// Lookups ---------------------------------------------------------------

export function tileAt(state: GameState, hex: Hex): MapTile | undefined {
  return state.map.tiles.get(hexKey(hex));
}

export function unitAt(state: GameState, hex: Hex): Unit | undefined {
  const key = hexKey(hex);
  for (const unit of state.units.values()) {
    if (hexKey(unit.hex) === key) return unit;
  }
  return undefined;
}

export function cityAt(state: GameState, hex: Hex): City | undefined {
  const key = hexKey(hex);
  for (const city of state.cities.values()) {
    if (hexKey(city.hex) === key) return city;
  }
  return undefined;
}

export function unitsOf(state: GameState, factionId: string): Unit[] {
  return [...state.units.values()].filter((u) => u.factionId === factionId);
}

export function citiesOf(state: GameState, factionId: string): City[] {
  return [...state.cities.values()].filter((c) => c.factionId === factionId);
}

// Start positions -------------------------------------------------------

/**
 * Score a tile as a starting site.
 *
 * Deliberately favours a balanced neighbourhood over a single rich tile: a
 * start next to one geothermal vent and nothing else is a trap, and a player
 * who opens on a bad site has already lost before learning anything.
 */
export function startScore(map: GameMap, tile: MapTile): number {
  const info = terrain(tile.terrain);
  if (!info.settleable) return Number.NEGATIVE_INFINITY;
  if (!map.mainland.has(hexKey(tile.hex))) return Number.NEGATIVE_INFINITY;

  let score = 0;
  let freshWater = tile.river;
  let coastal = false;
  let localData = 0;
  const resourcesSeen = new Set<string>();

  const ring = [tile, ...hexNeighbours(tile.hex).flatMap((h) => {
    const t = map.tiles.get(hexKey(h));
    return t ? [t] : [];
  })];

  for (const neighbour of ring) {
    const y = tileYields(neighbour.terrain, neighbour.river);
    score += y.data * 1.0 + y.compute * 1.0 + y.cu * 1.4 + y.trust * 0.9;
    localData += y.data;

    if (neighbour.river) freshWater = true;
    if (neighbour.terrain === 'onelake') coastal = true;
    // Wastes next door mean an antagonist on the doorstep from turn one.
    if (neighbour.terrain === 'ungovernedWastes') score -= 6;
    if (neighbour.terrain !== 'onelake') resourcesSeen.add(neighbour.terrain);
  }

  // A site with nothing to eat cannot grow, however rich it looks. An early
  // version happily chose a highland capital ringed by Compute and Capacity
  // Units, which then needed nineteen turns to reach size two.
  if (localData < 4) score -= 18;

  if (freshWater) score += 5;
  if (coastal) score += 3;
  // Variety is what lets a city build more than one thing.
  score += resourcesSeen.size * 1.5;

  // Keep starts out of the frontier ring without a hard cutoff.
  const edgeDistance = hexDistance({ q: 0, r: 0 }, tile.hex) / map.radius;
  score -= Math.max(0, edgeDistance - 0.5) * 20;

  return score;
}

export function chooseStartPosition(map: GameMap): Hex {
  let best: MapTile | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestKey = '';

  for (const [key, tile] of map.tiles) {
    const score = startScore(map, tile);
    if (score === Number.NEGATIVE_INFINITY) continue;
    // Key tiebreak keeps the choice deterministic regardless of Map order.
    if (score > bestScore || (score === bestScore && key < bestKey)) {
      best = tile;
      bestScore = score;
      bestKey = key;
    }
  }

  if (!best) {
    throw new Error(`Map ${map.seed} has no settleable tile on its mainland`);
  }
  return best.hex;
}

/**
 * A free tile adjacent to `origin` that the given unit type can stand on.
 * Used to place the second starting unit without stacking.
 */
function freeAdjacent(
  map: GameMap,
  origin: Hex,
  taken: ReadonlySet<string>,
): Hex | undefined {
  for (const h of hexNeighbours(origin)) {
    const key = hexKey(h);
    if (taken.has(key)) continue;
    const tile = map.tiles.get(key);
    if (!tile || !isPassableByLand(tile.terrain)) continue;
    return h;
  }
  return undefined;
}

// Construction ----------------------------------------------------------

export function createGameState(
  seed: string,
  options: NewGameOptions = {},
): GameState {
  const mapOverrides = options.map ?? {};
  const map = generateMap(seed, mapOverrides);
  const start = chooseStartPosition(map);

  const player: Faction = {
    id: PLAYER_FACTION_ID,
    label: 'Your Empire',
    isPlayer: true,
    colour: '#4c8fd6',
    resources: emptyResources(),
    topicCluster: '',
  };

  const units = new Map<string, Unit>();
  const taken = new Set<string>([hexKey(start)]);
  let nextId = 1;

  const place = (typeId: UnitTypeId, hex: Hex): void => {
    const id = `unit-${nextId++}`;
    units.set(id, {
      id,
      typeId,
      factionId: PLAYER_FACTION_ID,
      hex,
      hp: unitType(typeId).maxHp,
      movesLeft: unitType(typeId).movement,
      fortified: false,
    });
    taken.add(hexKey(hex));
  };

  place('architect', start);
  const escortHex = freeAdjacent(map, start, taken);
  if (escortHex) place('profiler', escortHex);

  return {
    seed: map.seed,
    difficulty: options.difficulty ?? 'analyst',
    turn: 1,
    map,
    mapOverrides,
    factions: new Map([[player.id, player]]),
    units,
    cities: new Map(),
    activeFactionId: PLAYER_FACTION_ID,
    nextEntityId: nextId,
  };
}
