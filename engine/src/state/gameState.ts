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

/**
 * The first antagonist.
 *
 * The plan calls for one faction per skill cluster. This is the placeholder
 * that lets combat exist on screen before the full roster and their AI arrive:
 * its units are placed and do not yet act.
 */
export const ANTAGONIST_FACTION_ID = 'silo-horde';

export interface NewGameOptions {
  readonly difficulty?: Difficulty;
  readonly map?: Partial<MapOptions>;
  /** Set false for a sandbox with no opposition. */
  readonly spawnAntagonists?: boolean;
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

/**
 * Where the antagonists muster.
 *
 * The nearest frontier wastes to the player, but never close enough to reach
 * the capital before the player has done anything. A raid on turn two teaches
 * nothing except that the game is unfair.
 */
export const MIN_ANTAGONIST_DISTANCE = 7;

export function chooseAntagonistCamp(map: GameMap, playerStart: Hex): Hex[] {
  const candidates = [...map.tiles.values()]
    .filter((tile) => {
      if (!map.mainland.has(hexKey(tile.hex))) return false;
      if (!isPassableByLand(tile.terrain)) return false;
      if (tile.terrain !== 'ungovernedWastes') return false;
      return hexDistance(tile.hex, playerStart) >= MIN_ANTAGONIST_DISTANCE;
    })
    .sort(
      (a, b) =>
        hexDistance(a.hex, playerStart) - hexDistance(b.hex, playerStart) ||
        hexKey(a.hex).localeCompare(hexKey(b.hex)),
    );

  // Fall back to any distant passable land if the wastes are unreachable,
  // so a strange map cannot produce a game with no opposition at all.
  const pool =
    candidates.length > 0
      ? candidates
      : [...map.tiles.values()]
          .filter(
            (tile) =>
              map.mainland.has(hexKey(tile.hex)) &&
              isPassableByLand(tile.terrain) &&
              hexDistance(tile.hex, playerStart) >= MIN_ANTAGONIST_DISTANCE,
          )
          .sort(
            (a, b) =>
              hexDistance(a.hex, playerStart) - hexDistance(b.hex, playerStart) ||
              hexKey(a.hex).localeCompare(hexKey(b.hex)),
          );

  return pool.slice(0, 3).map((tile) => tile.hex);
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

  const place = (typeId: UnitTypeId, hex: Hex, factionId: string): void => {
    const id = `unit-${nextId++}`;
    units.set(id, {
      id,
      typeId,
      factionId,
      hex,
      hp: unitType(typeId).maxHp,
      movesLeft: unitType(typeId).movement,
      fortified: false,
    });
    taken.add(hexKey(hex));
  };

  place('architect', start, PLAYER_FACTION_ID);
  const escortHex = freeAdjacent(map, start, taken);
  if (escortHex) place('profiler', escortHex, PLAYER_FACTION_ID);

  const factions = new Map<string, Faction>([[player.id, player]]);

  if (options.spawnAntagonists !== false) {
    const antagonist: Faction = {
      id: ANTAGONIST_FACTION_ID,
      label: 'The Silo Horde',
      isPlayer: false,
      colour: '#b5533f',
      resources: emptyResources(),
      topicCluster: 'B1',
    };
    factions.set(antagonist.id, antagonist);

    const camp = chooseAntagonistCamp(map, start);
    const roster: UnitTypeId[] = ['pipelineRunner', 'pipelineRunner', 'profiler'];
    camp.forEach((hex, index) => {
      if (taken.has(hexKey(hex))) return;
      place(roster[index] ?? 'pipelineRunner', hex, ANTAGONIST_FACTION_ID);
    });
  }

  return {
    seed: map.seed,
    difficulty: options.difficulty ?? 'analyst',
    turn: 1,
    map,
    mapOverrides,
    factions,
    units,
    cities: new Map(),
    activeFactionId: PLAYER_FACTION_ID,
    nextEntityId: nextId,
  };
}
