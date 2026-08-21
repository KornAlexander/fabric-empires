import type { TerrainId } from '@fabric-empires/engine';

/**
 * The data-dream palette.
 *
 * Art direction: the world is a data lake seen at night. Land is near-black
 * and lit from within rather than from above, so the map reads as something
 * running rather than something grown. The three loudest terrains, the
 * Semantic Peaks, the Delta Highlands and the geothermal vents, are the ones
 * that actually glow; everything else is dark so that the glow means
 * something. A map where everything shines is a map where nothing does.
 *
 * Legibility is still carried by lightness, not hue, so the bands stay
 * separable for common colour vision differences. The check is easy to
 * repeat: convert the fills to greyscale and they must still form a ladder.
 */

export interface TerrainStyle {
  readonly fill: string;
  readonly label: string;
}

export const TERRAIN_COLOURS: Readonly<Record<TerrainId, string>> = Object.freeze({
  /** Deep water: almost black, with just enough blue to not be a hole. */
  onelake: '#0a1830',
  /** Raw files: dark teal, the resting state of the land. */
  rawFilePlains: '#1d4442',
  /** Delta: layered violet strata, the most obviously artificial terrain. */
  deltaHighlands: '#312551',
  /** Parquet: pale crystalline cyan, columnar and cold. */
  parquetQuarry: '#3f6b7a',
  /** Legacy swamp: sour olive, the one colour in the game that is unpleasant. */
  legacySwamp: '#2b3a1c',
  /**
   * Semantic Peaks: impassable, and the brightest thing on the map.
   *
   * Deliberately not white. At the old value the elevation shading pushed
   * it past 255 on every channel and a range of peaks turned into one flat
   * silhouette with no readable shape at all.
   */
  semanticPeaks: '#5d7fa6',
  /** Geothermal vent: raw compute, burning. */
  geothermalVent: '#c4531f',
  /** Ungoverned wastes: dead magenta-grey. Corrupted, not merely empty. */
  ungovernedWastes: '#4a2f45',
});

/**
 * Per-terrain emissive colour and strength.
 *
 * Strength is a multiplier on an additive sprite, so 0 costs nothing: the
 * renderer skips those tiles entirely rather than compositing a transparent
 * quad hundreds of times.
 */
export const TERRAIN_GLOW: Readonly<
  Record<TerrainId, { readonly colour: string; readonly strength: number }>
> = Object.freeze({
  onelake: { colour: '#1e6fa8', strength: 0 },
  rawFilePlains: { colour: '#2fd6a8', strength: 0.1 },
  deltaHighlands: { colour: '#9a6bff', strength: 0.2 },
  parquetQuarry: { colour: '#8fe4ff', strength: 0.16 },
  legacySwamp: { colour: '#6f8f2a', strength: 0.06 },
  semanticPeaks: { colour: '#bfe4ff', strength: 0.2 },
  geothermalVent: { colour: '#ff8a2b', strength: 0.6 },
  ungovernedWastes: { colour: '#c23bb0', strength: 0.16 },
});

/** Terrains that get horizontal strata banding drawn inside the hex. */
export const STRATA_TERRAINS: ReadonlySet<TerrainId> = new Set<TerrainId>([
  'deltaHighlands',
  'parquetQuarry',
]);

/** Terrains drawn with a bright ridge line, to suggest relief. */
export const RIDGE_TERRAINS: ReadonlySet<TerrainId> = new Set<TerrainId>(['semanticPeaks']);

export const RIVER_COLOUR = '#1b6f9e';
export const RIVER_CORE_COLOUR = '#7fe9ff';
export const SURF_COLOUR = 'rgba(120, 224, 255, 0.30)';
export const COAST_COLOUR = 'rgba(4, 10, 20, 0.85)';
export const HOVER_COLOUR = 'rgba(190, 240, 255, 0.18)';
export const SELECT_COLOUR = '#ffd166';

/** The void the continent sits in, top to bottom. */
export const VOID_TOP = '#03060f';
export const VOID_BOTTOM = '#080312';

/** Corruption, used for the wastes and for anything the Horde holds. */
export const GLITCH_A = 'rgba(255, 60, 200, 0.50)';
export const GLITCH_B = 'rgba(60, 255, 235, 0.42)';

/**
 * A stable pseudo-random value per hex, in 0..1.
 *
 * Used to jitter tile brightness and to place glitch slivers. Flat fills
 * across hundreds of identical tiles read as a spreadsheet rather than
 * terrain; a few percent of variation suggests texture without looking like
 * noise. Stable, so nothing crawls when the camera moves.
 */
export function tileNoise(q: number, r: number, salt = 0): number {
  let n =
    (Math.imul(q, 374761393) + Math.imul(r, 668265263) + Math.imul(salt, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Shade a terrain colour by elevation so the land reads as three-dimensional
 * without any art. Quantised to a small number of steps, which keeps the
 * output batchable later and stops the map looking like a noise field.
 */
export function shadeFor(
  terrainId: TerrainId,
  elevation: number,
  steps = 6,
  jitter = 0,
): string {
  const [r, g, b] = hexToRgb(TERRAIN_COLOURS[terrainId]);

  // Water darkens with depth; land brightens with height. Both ranges stay
  // below 1.0, so no terrain can be pushed to clipping: the bright terrains
  // otherwise saturate to flat white and lose all of their internal shape,
  // which is exactly what happened to the Semantic Peaks.
  const isWater = terrainId === 'onelake';
  const t = Math.min(Math.max(elevation, 0), 1);
  const quantised = Math.round(t * steps) / steps;
  const base = isWater ? 0.55 + quantised * 0.4 : 0.62 + quantised * 0.36;
  const factor = base * (1 + jitter);

  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return `rgb(${clamp(r * factor)}, ${clamp(g * factor)}, ${clamp(b * factor)})`;
}

/**
 * A pre-rendered radial glow sprite.
 *
 * Building a CanvasGradient per tile per frame is the obvious implementation
 * and it is far too slow: at minimum zoom close to two thousand tiles are
 * visible. One sprite per colour, blitted with `lighter`, turns the emissive
 * pass into plain image draws.
 */
const glowSprites = new Map<string, HTMLCanvasElement>();

export function glowSprite(colour: string): HTMLCanvasElement {
  const cached = glowSprites.get(colour);
  if (cached) return cached;

  const size = 128;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const g = sprite.getContext('2d')!;
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, rgba(colour, 1));
  gradient.addColorStop(0.45, rgba(colour, 0.35));
  gradient.addColorStop(1, rgba(colour, 0));
  g.fillStyle = gradient;
  g.fillRect(0, 0, size, size);

  glowSprites.set(colour, sprite);
  return sprite;
}
