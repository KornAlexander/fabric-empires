/**
 * Save and load.
 *
 * The map is NOT serialised. It is a pure function of the seed and a handful
 * of options, so a save carries those instead of two thousand tiles: a save
 * file stays a few kilobytes, and the golden map test doubles as a guarantee
 * that a loaded game looks exactly like the one that was saved.
 *
 * Everything else is stored verbatim. Maps become arrays because JSON has no
 * Map, and that conversion is the only transformation on the way out.
 */

import { generateMap, type MapOptions } from '../map/index.js';
import type { City, Faction, Unit } from '../entities/index.js';
import type { Difficulty, GameState } from '../state/index.js';

export const SAVE_VERSION = 1;

export interface SaveFile {
  readonly version: number;
  readonly seed: string;
  readonly difficulty: Difficulty;
  readonly turn: number;
  readonly mapOverrides: Partial<MapOptions>;
  readonly factions: readonly Faction[];
  readonly units: readonly Unit[];
  readonly cities: readonly City[];
  readonly activeFactionId: string;
  readonly nextEntityId: number;
}

export function toSaveFile(state: GameState): SaveFile {
  return {
    version: SAVE_VERSION,
    seed: state.seed,
    difficulty: state.difficulty,
    turn: state.turn,
    mapOverrides: state.mapOverrides,
    factions: [...state.factions.values()],
    units: [...state.units.values()],
    cities: [...state.cities.values()],
    activeFactionId: state.activeFactionId,
    nextEntityId: state.nextEntityId,
  };
}

export function serialise(state: GameState): string {
  return JSON.stringify(toSaveFile(state));
}

/**
 * Migrations from older save versions.
 *
 * Each entry takes the previous shape and returns the next one. They are
 * applied in order, so a save from any supported version can reach the
 * current one. Adding a field with a sensible default belongs here, not in a
 * scattering of `?? fallback` reads across the engine.
 */
const MIGRATIONS: Readonly<Record<number, (save: SaveFile) => SaveFile>> =
  Object.freeze({
    // 0 -> 1 is a placeholder for the shape of the thing. There are no
    // published saves older than version 1.
  });

export function migrate(save: SaveFile): SaveFile {
  let current = save;
  while (current.version < SAVE_VERSION) {
    const step = MIGRATIONS[current.version];
    if (!step) {
      throw new Error(
        `No migration from save version ${current.version} to ${current.version + 1}`,
      );
    }
    current = step(current);
  }
  return current;
}

export function fromSaveFile(save: SaveFile): GameState {
  if (typeof save.version !== 'number') {
    throw new Error('Save file has no version');
  }
  if (save.version > SAVE_VERSION) {
    throw new Error(
      `Save version ${save.version} is newer than this build understands (${SAVE_VERSION})`,
    );
  }

  const migrated = migrate(save);
  const map = generateMap(migrated.seed, migrated.mapOverrides ?? {});

  return {
    seed: migrated.seed,
    difficulty: migrated.difficulty,
    turn: migrated.turn,
    map,
    mapOverrides: migrated.mapOverrides ?? {},
    factions: new Map(migrated.factions.map((f) => [f.id, f])),
    units: new Map(migrated.units.map((u) => [u.id, u])),
    cities: new Map(migrated.cities.map((c) => [c.id, c])),
    activeFactionId: migrated.activeFactionId,
    nextEntityId: migrated.nextEntityId,
  };
}

export function deserialise(json: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Save file is not valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Save file is not an object');
  }
  return fromSaveFile(parsed as SaveFile);
}
