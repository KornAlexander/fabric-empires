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
  cityKind,
  type City,
  type CityKind,
  type Faction,
  type Ruin,
  type Unit,
  type UnitTypeId,
} from '../entities/index.js';
import { GENERIC_TOPIC_GRAPH, type TopicGraph } from '../challenge/index.js';
import { EMPTY_RESEARCH, type ResearchState } from '../rules/research.js';

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
  /** Where cities were razed. Inert, but remembered. */
  readonly ruins: ReadonlyMap<string, Ruin>;
  /**
   * The tech tree, supplied by the challenge provider.
   *
   * Held on the state rather than threaded through every call, but never
   * serialised: it belongs to the provider, and a save rebuilds it on load.
   */
  readonly topics: TopicGraph;
  readonly research: ResearchState;
  readonly activeFactionId: string;
  /** Monotonic counter behind entity ids, so ids stay stable across saves. */
  readonly nextEntityId: number;
}

export const PLAYER_FACTION_ID = 'player';

/**
 * The first antagonist, and the one every test names.
 *
 * Kept as a constant because it is the faction closest to the player on most
 * maps and therefore the one a scenario usually means.
 */
export const ANTAGONIST_FACTION_ID = 'silo-horde';

/**
 * The seven antagonists, one per cluster of the outline.
 *
 * ⚠️ **The cluster is the whole point.** Each faction quizzes on its own
 * cluster, so who is marching on you tells you what you are about to be tested
 * on, and fighting on two fronts means revising two branches. With only the
 * Silo Horde in the game, six of the seven clusters never tested the player at
 * all and the study planner covered one seventh of the exam.
 *
 * They are misconceptions, not products: no competitor is named, and nobody
 * real is either.
 */
export interface AntagonistDefinition {
  readonly id: string;
  readonly label: string;
  /** Opaque to the engine; the learning layer maps it to skills. */
  readonly topicCluster: string;
  readonly colour: string;
  /**
   * The village this faction holds from turn one.
   *
   * ⚠️ Every antagonist owns one. Before this they were two units standing on
   * open ground, which meant they could raid the player forever but the player
   * could never take anything from them: there was no object of the war. It
   * also meant Domination was decided purely by killing units, and the capture
   * path already written in `combat.ts` was unreachable code.
   */
  readonly seat: string;
  readonly seatKind: CityKind;
}

export const ANTAGONISTS: readonly AntagonistDefinition[] = Object.freeze([
  { id: ANTAGONIST_FACTION_ID, label: 'The Silo Horde', topicCluster: 'B1', colour: '#b5533f', seat: 'Silo Hold', seatKind: 'lakehouse' },
  { id: 'open-gate', label: 'The Open Gate', topicCluster: 'A1', colour: '#c2793a', seat: 'Unbarred Yard', seatKind: 'workspace' },
  { id: 'untracked', label: 'The Untracked', topicCluster: 'A2', colour: '#8a6fb0', seat: 'Tallyless', seatKind: 'eventhouse' },
  { id: 'denormalizers', label: 'The Denormalizers', topicCluster: 'B2', colour: '#a8474f', seat: 'Wide Row', seatKind: 'warehouse' },
  { id: 'scan-wraiths', label: 'The Scan Wraiths', topicCluster: 'B3', colour: '#4f7f7a', seat: 'Full Sweep', seatKind: 'warehouse' },
  { id: 'flat-table-cult', label: 'The Flat Table Cult', topicCluster: 'C1', colour: '#9c5f8a', seat: 'One Great Table', seatKind: 'semanticModel' },
  { id: 'import-zealots', label: 'The Import Zealots', topicCluster: 'C2', colour: '#7b8a3f', seat: 'Copy Landing', seatKind: 'semanticModel' },
]);

export interface NewGameOptions {
  readonly difficulty?: Difficulty;
  readonly map?: Partial<MapOptions>;
  /** Set false for a sandbox with no opposition. */
  readonly spawnAntagonists?: boolean;
  /** Tech tree to play with. Defaults to the subject-free generic tree. */
  readonly topics?: TopicGraph;
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

export function ruinAt(state: GameState, hex: Hex): Ruin | undefined {
  const key = hexKey(hex);
  for (const ruin of state.ruins.values()) {
    if (hexKey(ruin.hex) === key) return ruin;
  }
  return undefined;
}

export function unitsOf(state: GameState, factionId: string): Unit[] {  return [...state.units.values()].filter((u) => u.factionId === factionId);
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

/**
 * The closest a camp may be, for a given map size.
 *
 * ⚠️ **This has to stay ahead of the aggro leash at turn one, and it did not.**
 * When the map grew, the leash became proportional to the radius and this
 * constant stayed absolute at 7. On a radius-45 map the leash opens at 9, so a
 * camp spawning at 7 was already inside it: measured on seed DP600, the player
 * was raided on turn 4 and wiped out on turn 5, which is precisely the
 * "lost while still reading the interface" failure the leash exists to
 * prevent.
 *
 * Both now scale from the same reference map, and a test asserts the ordering
 * rather than trusting two constants to stay in step by hand.
 */
export function minAntagonistDistance(mapRadius: number): number {
  return MIN_ANTAGONIST_DISTANCE * Math.max(1, mapRadius / 25);
}

/**
 * How far apart two camps must be.
 *
 * Without a separation rule the greedy pick takes the seven closest wastes
 * tiles, which are usually neighbours, and all seven factions spawn in one
 * heap: a single doom-stack rather than seven fronts, and six of the seven
 * clusters would still never reach the player.
 *
 * Like the aggro leash, this is expressed against a radius-25 map and scaled
 * from there, so seven camps stay spread across whatever size the world is.
 */
export const MIN_CAMP_SEPARATION = 6;

/**
 * Camp anchors, one per antagonist, spread around the map.
 *
 * Sorted by distance from the player and picked greedily, so the nearest
 * faction arrives first and the far ones take many more turns. That ordering
 * is the difficulty ramp: nobody had to schedule it.
 */
export function chooseAntagonistCamps(
  map: GameMap,
  playerStart: Hex,
  count: number,
): Hex[] {
  /*
   * ⚠️ **On the player's landmass, and nowhere else.**
   *
   * This has now been both ways. It originally required `map.mainland`, which
   * was correct while every map was one continent. When archipelagos landed it
   * was opened up to any island, on the reasoning that leaving the rest of the
   * world empty defeated the point of islands.
   *
   * That reasoning was wrong, because land units cannot cross water. A faction
   * on another island never raids you, you can never reach its village, and
   * Domination becomes unwinnable while a rival still stands: the game quietly
   * loses one of its three endings. Now that world shape is something a player
   * CHOOSES at the start, that failure would be one menu click away.
   *
   * So islands are terrain, not separation, until ships can carry an army
   * (phase 23). The other islands are unclaimed ground and look like it.
   */
  const onPlayerLand = (tile: MapTile): boolean =>
    map.mainland.size === 0 || map.mainland.has(hexKey(tile.hex));

  const byDistance = (a: MapTile, b: MapTile): number =>
    hexDistance(a.hex, playerStart) - hexDistance(b.hex, playerStart) ||
    hexKey(a.hex).localeCompare(hexKey(b.hex));

  /*
   * Relax the spacing, and then the head start, rather than run out of camps.
   *
   * ⚠️ A small home island cannot hold seven camps six hexes apart and twelve
   * hexes from the player, and the old code simply returned fewer anchors.
   * That silently deleted factions, and since each faction carries one cluster
   * of the exam, a missing faction is a missing BRANCH OF THE SYLLABUS: the
   * world shape a player picked from a menu would have been quietly deciding
   * how much of DP-600 they could be tested on. Crowding is much the lesser
   * evil, so distance gives way before the roster does.
   *
   * Spacing is relaxed first because it only affects how clustered the enemy
   * is. The minimum distance from the player is relaxed second because that is
   * the opening breathing room, and losing it is felt immediately.
   */
  const fullSeparation = MIN_CAMP_SEPARATION * Math.max(1, map.radius / 25);
  const fullDistance = minAntagonistDistance(map.radius);

  const attempt = (separation: number, minDistance: number): Hex[] => {
    const far = (tile: MapTile): boolean =>
      isPassableByLand(tile.terrain) &&
      onPlayerLand(tile) &&
      hexDistance(tile.hex, playerStart) >= minDistance;

    const wastes = [...map.tiles.values()]
      .filter((tile) => far(tile) && tile.terrain === 'ungovernedWastes')
      .sort(byDistance);

    // Fall back to any distant passable land if the wastes are unreachable or
    // too few, so a strange map cannot produce a game with no opposition.
    const rest = [...map.tiles.values()]
      .filter((tile) => far(tile) && tile.terrain !== 'ungovernedWastes')
      .sort(byDistance);

    const anchors: Hex[] = [];
    for (const tile of [...wastes, ...rest]) {
      if (anchors.length >= count) break;
      if (anchors.some((a) => hexDistance(a, tile.hex) < separation)) continue;
      anchors.push(tile.hex);
    }
    return anchors;
  };

  let best: Hex[] = [];
  for (const distance of [fullDistance, fullDistance * 0.6, fullDistance * 0.35, 2]) {
    for (const separation of [fullSeparation, fullSeparation * 0.6, fullSeparation * 0.35, 1]) {
      const anchors = attempt(separation, distance);
      if (anchors.length >= count) return anchors;
      if (anchors.length > best.length) best = anchors;
    }
  }
  return best;
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
  const cities = new Map<string, City>();

  if (options.spawnAntagonists !== false) {
    /*
     * Two units each, not three.
     *
     * Seven factions of three would be twenty-one raiders against a starting
     * pair, all converging. Two each keeps every front survivable on its own
     * while the total still makes standing still fatal, which is the balance
     * this was meant to correct.
     */
    const roster: UnitTypeId[] = ['pipelineRunner', 'profiler'];
    const camps = chooseAntagonistCamps(map, start, ANTAGONISTS.length);

    camps.forEach((anchor, index) => {
      const definition = ANTAGONISTS[index];
      if (!definition) return;

      factions.set(definition.id, {
        id: definition.id,
        label: definition.label,
        isPlayer: false,
        colour: definition.colour,
        resources: emptyResources(),
        topicCluster: definition.topicCluster,
      });

      /*
       * The village sits on the camp anchor, and the raiders start on it.
       *
       * Population 2 rather than 1: `cityCombatSide` defends at
       * `20 + population * 6`, so 2 is 32, which a lone starting unit cannot
       * chew through but a purpose-built siege unit can. A village that fell
       * to the first thing that wandered past would not be worth marching to.
       */
      const seatId = `city-${nextId++}`;
      cities.set(seatId, {
        id: seatId,
        factionId: definition.id,
        hex: anchor,
        name: definition.seat,
        kind: definition.seatKind,
        hp: cityKind(definition.seatKind).baseHp,
        population: 2,
        growthStore: 0,
        boundSkills: [],
        unrest: 0,
        ignoredReviews: 0,
        reviewBonusUntilTurn: 0,
        lastReviewTurn: -1,
        productionProgress: 0,
        lastRaidedTurn: -1,
      });

      for (const typeId of roster) {
        const hex = taken.has(hexKey(anchor))
          ? freeAdjacent(map, anchor, taken)
          : anchor;
        if (!hex) break;
        place(typeId, hex, definition.id);
      }
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
    cities,
    ruins: new Map(),
    topics: options.topics ?? GENERIC_TOPIC_GRAPH,
    research: EMPTY_RESEARCH,
    activeFactionId: PLAYER_FACTION_ID,
    nextEntityId: nextId,
  };
}
