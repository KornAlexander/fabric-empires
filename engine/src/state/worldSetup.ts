/**
 * The choices offered when a game starts.
 *
 * ⚠️ **Presets, not sliders.** Map options interact: land fraction, island
 * count, blur radius and the minimum island size are not independent, and a
 * player who sets seven islands at 45% land does not get seven islands, they
 * get a continent with bays. Naming a handful of combinations that were each
 * measured is more honest than exposing six numbers and hoping.
 *
 * These live in the engine rather than the UI because they are statements
 * about what the generator can actually produce. The app renders them; it does
 * not get to invent new ones.
 */

import type { MapOptions } from '../map/index.js';

export type WorldShapeId = 'continent' | 'islands' | 'archipelago';
export type RoughnessId = 'gentle' | 'rolling' | 'rugged';

export interface WorldShape {
  readonly id: WorldShapeId;
  readonly label: string;
  readonly detail: string;
  readonly map: Partial<MapOptions>;
}

/**
 * ⚠️ Every shape keeps its factions on the player's landmass, because land
 * units cannot cross water (see `chooseAntagonistCamps`). Islands here change
 * where the fighting happens and how much of the world is unclaimed, not who
 * you can reach.
 */
export const WORLD_SHAPES: readonly WorldShape[] = Object.freeze([
  {
    id: 'continent',
    label: 'One great continent',
    detail: 'A single landmass with a long, worked coastline. Nowhere to hide.',
    map: { islands: 1, landFraction: 0.45, coastSmoothing: 6, minIslandSize: 6 },
  },
  {
    id: 'islands',
    label: 'A few large islands',
    detail: 'A broad home island and three lesser lands across the water.',
    map: { islands: 4, landFraction: 0.15, coastSmoothing: 3, minIslandSize: 30 },
  },
  {
    id: 'archipelago',
    label: 'Many small islands',
    detail: 'A crowded home island ringed by scattered isles and a great deal of sea.',
    map: { islands: 8, landFraction: 0.15, coastSmoothing: 1, minIslandSize: 14 },
  },
]);

export interface Roughness {
  readonly id: RoughnessId;
  readonly label: string;
  readonly detail: string;
  readonly map: Partial<MapOptions>;
}

/**
 * How much of the land is high ground.
 *
 * This changes what the map IS, not how it is drawn: peaks are impassable and
 * highlands are slow, so roughness decides where armies can go, where cities
 * can stand, and therefore where the war happens. A purely visual "taller
 * hills" setting would have been a lie dressed as a choice.
 */
export const ROUGHNESS_LEVELS: readonly Roughness[] = Object.freeze([
  {
    id: 'gentle',
    label: 'Gentle',
    detail: 'Broad plains and few mountains. Armies move freely and fronts are wide.',
    map: { peaksFraction: 0.02, highlandsFraction: 0.12, swampFraction: 0.18 },
  },
  {
    id: 'rolling',
    label: 'Rolling',
    detail: 'Hills, river valleys and a spine of mountains. The balanced world.',
    map: { peaksFraction: 0.05, highlandsFraction: 0.22, swampFraction: 0.14 },
  },
  {
    id: 'rugged',
    label: 'Rugged',
    detail: 'High country everywhere. Passes matter, and a held valley is worth an army.',
    map: { peaksFraction: 0.11, highlandsFraction: 0.34, swampFraction: 0.08 },
  },
]);

export interface WorldChoice {
  readonly shape: WorldShapeId;
  readonly roughness: RoughnessId;
}

export const DEFAULT_WORLD_CHOICE: WorldChoice = Object.freeze({
  shape: 'continent',
  roughness: 'rolling',
});

/**
 * Turn a pair of choices into map overrides.
 *
 * Order matters: roughness is applied second so a shape can set a land
 * fraction without a roughness level silently overwriting it, and neither
 * touches keys the other owns.
 */
export function worldOptions(choice: WorldChoice): Partial<MapOptions> {
  const shape =
    WORLD_SHAPES.find((s) => s.id === choice.shape) ?? WORLD_SHAPES[0]!;
  const rough =
    ROUGHNESS_LEVELS.find((r) => r.id === choice.roughness) ?? ROUGHNESS_LEVELS[1]!;
  return { ...shape.map, ...rough.map };
}
