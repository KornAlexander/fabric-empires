import type { TerrainId } from '@fabric-empires/engine';

/**
 * Placeholder palette.
 *
 * The shipped game uses generated art (D21), but that art does not exist yet
 * and the map needs to be legible now. These are flat colours chosen to read
 * clearly at every zoom and to keep the terrain bands distinguishable for
 * anyone with common colour vision differences: the separation is carried by
 * lightness as much as by hue.
 */

export interface TerrainStyle {
  readonly fill: string;
  readonly label: string;
}

export const TERRAIN_COLOURS: Readonly<Record<TerrainId, string>> = Object.freeze({
  onelake: '#1b3a5c',
  rawFilePlains: '#6f9a4e',
  deltaHighlands: '#7d6b46',
  parquetQuarry: '#a99a86',
  legacySwamp: '#4a5b39',
  semanticPeaks: '#d5d8de',
  geothermalVent: '#c8712f',
  ungovernedWastes: '#5a4759',
});

export const RIVER_COLOUR = '#4aa8d8';
export const COAST_COLOUR = '#0d1b2a';
export const HOVER_COLOUR = 'rgba(255, 255, 255, 0.28)';
export const SELECT_COLOUR = '#ffd166';

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
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
): string {
  const [r, g, b] = hexToRgb(TERRAIN_COLOURS[terrainId]);

  // Water darkens with depth; land brightens with height.
  const isWater = terrainId === 'onelake';
  const t = Math.min(Math.max(elevation, 0), 1);
  const quantised = Math.round(t * steps) / steps;
  const factor = isWater ? 0.55 + quantised * 0.75 : 0.82 + quantised * 0.45;

  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return `rgb(${clamp(r * factor)}, ${clamp(g * factor)}, ${clamp(b * factor)})`;
}
