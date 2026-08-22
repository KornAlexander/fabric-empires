/**
 * Entity shapes.
 *
 * Everything is plain readonly data with no methods, so the whole game state
 * serialises to JSON without a custom encoder and a save file is exactly what
 * the engine holds in memory.
 */

import type { Hex } from '../hex/index.js';
import type { ResourceId } from '../map/index.js';
import type { UnitTypeId } from './units.js';
import type { CityRank } from './rank.js';

export type CityKind =
  | 'workspace'
  | 'lakehouse'
  | 'warehouse'
  | 'eventhouse'
  | 'semanticModel';

export interface CityKindInfo {
  readonly id: CityKind;
  readonly label: string;
  readonly baseHp: number;
  /** Multiplies the tile yields the city collects. */
  readonly yieldBias: Readonly<Partial<Record<ResourceId, number>>>;
}

export const CITY_KINDS: Readonly<Record<CityKind, CityKindInfo>> = Object.freeze({
  workspace: {
    id: 'workspace',
    label: 'Workspace',
    baseHp: 200,
    yieldBias: { data: 1.2, compute: 1.2, cu: 1.2, trust: 1.2 },
  },
  lakehouse: {
    id: 'lakehouse',
    label: 'Lakehouse',
    baseHp: 140,
    yieldBias: { data: 1.5 },
  },
  warehouse: {
    id: 'warehouse',
    label: 'Warehouse',
    baseHp: 180,
    yieldBias: { compute: 1.4, trust: 1.2 },
  },
  eventhouse: {
    id: 'eventhouse',
    label: 'Eventhouse',
    baseHp: 120,
    yieldBias: { data: 1.3, compute: 1.2 },
  },
  semanticModel: {
    id: 'semanticModel',
    label: 'Semantic Model',
    baseHp: 130,
    yieldBias: { trust: 1.6 },
  },
});

export type Resources = Readonly<Record<ResourceId, number>>;

export interface Faction {
  readonly id: string;
  readonly label: string;
  readonly isPlayer: boolean;
  /** Hex colour used for banners and borders. */
  readonly colour: string;
  readonly resources: Resources;
  /** Opaque topic cluster this faction quizzes on. Empty for the player. */
  readonly topicCluster: string;
}

export interface Unit {
  readonly id: string;
  readonly typeId: UnitTypeId;
  readonly factionId: string;
  readonly hex: Hex;
  readonly hp: number;
  readonly movesLeft: number;
  readonly fortified: boolean;
}

export interface City {
  readonly id: string;
  readonly factionId: string;
  readonly hex: Hex;
  readonly name: string;
  readonly kind: CityKind;
  readonly hp: number;
  readonly population: number;
  /**
   * How far the settlement has come: Siedlung through Großstadt.
   *
   * ⚠️ Stored rather than derived, and that is deliberate. Rank is a pure
   * function of population and retained knowledge, so deriving it would need
   * no save field at all, but a derived rank also FALLS the moment a topic
   * lapses. Keeping it means a settlement stalls instead of collapsing, which
   * is the promise made in `rank.ts`, and it means the high-water mark
   * survives a reload.
   */
  readonly rank: CityRank;
  /** Data accumulated towards the next citizen. */
  readonly growthStore: number;
  /**
   * Opaque topic ids whose buildings stand here. Drives the review system.
   *
   * Strings rather than numbers, because a topic id is whatever the challenge
   * provider says it is and the engine must not assume it can be counted.
   */
  readonly boundSkills: readonly string[];
  /** Grumbling from ignored reviews. Capped, and only ever dampens yields. */
  readonly unrest: number;
  /** Consecutive reviews this city was offered and the player skipped. */
  readonly ignoredReviews: number;
  /** Turn until which a good review is still paying a yield bonus. */
  readonly reviewBonusUntilTurn: number;
  /** Last turn a council was held here, so it is one per city per turn. */
  readonly lastReviewTurn: number;
  /**
   * What this city is building, if anything.
   *
   * Optional rather than a null, because `exactOptionalPropertyTypes` makes
   * the difference between "not building" and "building undefined" a real one.
   */
  readonly producing?: UnitTypeId;
  /** Compute already sunk into the current build. Kept when orders change. */
  readonly productionProgress: number;
  /**
   * Turn this city was last raided, so a raid is not a repeatable free tap.
   *
   * -1 means never. Raiding is meant to be a decision with a cooldown, not a
   * resource faucet a player can stand next to and drain.
   */
  readonly lastRaidedTurn: number;
}

/**
 * What is left where a city was razed.
 *
 * Kept as its own record rather than a flag on the tile, because the tile is
 * map data that never changes after generation, and a ruin is a thing that
 * happened during a game. Ruins are inert: they do not yield, defend or
 * produce. They exist so a razed village leaves a mark, and so the late map
 * does not quietly become empty ground with no memory of the war.
 */
export interface Ruin {
  readonly id: string;
  readonly hex: Hex;
  /** The name the city had, so the log can say what was lost. */
  readonly name: string;
  /** Who owned it when it fell. */
  readonly formerFactionId: string;
  readonly razedOnTurn: number;
}

export function cityKind(kind: CityKind): CityKindInfo {
  return CITY_KINDS[kind];
}

export function emptyResources(): Resources {
  return Object.freeze({ data: 0, compute: 0, cu: 0, trust: 0 });
}

export * from './units.js';
export * from './rank.js';
