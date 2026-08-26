/**
 * Cheat codes.
 *
 * ⚠️ **Every TYPED code here leaves `mastery` alone. The O+K chord does not.**
 *
 * This is a study tool wearing a strategy game. Its only real output is the
 * readiness figure and the Great Library behind it, and those are built from
 * spaced-repetition data about questions actually answered. A code that wrote
 * to mastery would hand somebody a green 82% and a false belief that they can
 * sit DP-600, which is a worse outcome than any amount of losing.
 *
 * So the codes in this file move Compute, armies, walls and turns. Not one of
 * them touches `mastery`, and the two that come near the exam are careful:
 *
 *   - `sitthepaper` opens the Proctor early. It does not answer the paper.
 *     You still take forty questions and you still have to pass them.
 *   - `iknowthis` completes the research you are funding, because that is a
 *     GAME gate (it unlocks units). It marks the topic known to the tech tree
 *     and leaves the Great Library untouched, so the topic still shows as
 *     unlearned in the place that matters.
 *
 * ⚠️ **`okay` is the exception, and it is deliberate.** Holding O and K while
 * a question is open picks the right answer and submits it, and that answer
 * counts exactly as if it had been known: it feeds the schedule, the Library
 * and the readiness figure. Alexander asked for it on those terms.
 *
 * This file used to promise the opposite, in this docblock and in the console's
 * help text. Both were rewritten rather than left standing, because a promise
 * the code no longer keeps is worse than no promise: the next reader has no
 * reason to doubt it.
 *
 * What is left is disclosure. Every use is appended to `state.cheatsUsed`,
 * which lives in the save, so an empire built with help says so on the victory
 * screen and keeps saying so after a reload.
 */

import {
  PLAYER_FACTION_ID,
  unitType,
  unitsOf,
  type GameState,
  type Hex,
  type UnitTypeId,
} from '@fabric-empires/engine';

export type CheatCategory = 'treasury' | 'army' | 'war' | 'exam';

/**
 * The chord that answers a question for you.
 *
 * ⚠️ Not in `CHEATS`, because it is not typed into the console: it is held on
 * the keyboard while a question is on screen. The code string lives here so
 * the thing that records it and the thing that lists it cannot disagree about
 * its name, which is the only reason a UI concern is declared in this file.
 */
export const OKAY_CHEAT = 'okay';

export interface CheatContext {
  readonly state: GameState;
  /** The unit the player has selected, if any. */
  readonly selectedUnitId: string | undefined;
  /** Open the Proctor's paper. Resolves when it is over. */
  readonly faceProctor: () => void;
}

export interface CheatOutcome {
  /**
   * The new state, or undefined if the code changed nothing.
   *
   * ⚠️ Explicitly `| undefined` because `exactOptionalPropertyTypes` treats an
   * absent key and a key set to undefined as different things, and these are
   * written as plain returns rather than conditional spreads.
   */
  readonly state?: GameState | undefined;
  /** What to tell the player. */
  readonly message: string;
  readonly ok: boolean;
}

export interface Cheat {
  readonly code: string;
  readonly category: CheatCategory;
  /** Shown by the `help` code, so it has to read like a menu item. */
  readonly describe: string;
  readonly apply: (ctx: CheatContext) => CheatOutcome;
}

// Helpers -----------------------------------------------------------------

function grant(
  state: GameState,
  amounts: { data?: number; compute?: number; cu?: number; trust?: number },
): GameState {
  const factions = new Map(state.factions);
  const player = factions.get(PLAYER_FACTION_ID);
  if (!player) return state;
  factions.set(PLAYER_FACTION_ID, {
    ...player,
    resources: {
      data: player.resources.data + (amounts.data ?? 0),
      compute: player.resources.compute + (amounts.compute ?? 0),
      cu: player.resources.cu + (amounts.cu ?? 0),
      trust: player.resources.trust + (amounts.trust ?? 0),
    },
  });
  return { ...state, factions };
}

/** A free hex on or beside a hex, for putting a conjured unit down. */
function freeSpotNear(state: GameState, origin: Hex): Hex | undefined {
  const taken = new Set(
    [...state.units.values()].map((u) => `${u.hex.q},${u.hex.r}`),
  );
  const candidates: Hex[] = [
    origin,
    { q: origin.q + 1, r: origin.r },
    { q: origin.q - 1, r: origin.r },
    { q: origin.q, r: origin.r + 1 },
    { q: origin.q, r: origin.r - 1 },
    { q: origin.q + 1, r: origin.r - 1 },
    { q: origin.q - 1, r: origin.r + 1 },
  ];
  return candidates.find((h) => {
    const key = `${h.q},${h.r}`;
    if (taken.has(key)) return false;
    const tile = state.map.tiles.get(key);
    return tile !== undefined && tile.terrain !== 'onelake';
  });
}

/** Where the player's forces are, for spawning things near them. */
function playerAnchor(state: GameState): Hex | undefined {
  const capital = [...state.cities.values()].find(
    (c) => c.factionId === PLAYER_FACTION_ID,
  );
  if (capital) return capital.hex;
  return unitsOf(state, PLAYER_FACTION_ID)[0]?.hex;
}

function conjure(
  state: GameState,
  typeId: UnitTypeId,
  at: Hex,
): GameState | undefined {
  const spot = freeSpotNear(state, at);
  if (!spot) return undefined;
  const id = `unit-${state.nextEntityId}`;
  const type = unitType(typeId);
  const units = new Map(state.units);
  units.set(id, {
    id,
    typeId,
    factionId: PLAYER_FACTION_ID,
    hex: spot,
    hp: type.maxHp,
    movesLeft: type.movement,
    fortified: false,
  });
  return { ...state, units, nextEntityId: state.nextEntityId + 1 };
}

// The codes ---------------------------------------------------------------

export const CHEATS: readonly Cheat[] = Object.freeze([
  {
    code: 'onelake',
    category: 'treasury',
    describe: 'One lake to hold it all: 500 of every resource.',
    apply: ({ state }) => ({
      ok: true,
      state: grant(state, { data: 500, compute: 500, cu: 500, trust: 500 }),
      message: 'The lake fills. 500 of everything.',
    }),
  },
  {
    code: 'f64',
    category: 'treasury',
    describe: 'Provision a larger capacity: 2000 Compute.',
    apply: ({ state }) => ({
      ok: true,
      state: grant(state, { compute: 2000 }),
      message: 'Capacity scaled up. 2000 Compute.',
    }),
  },
  {
    code: 'refreshnow',
    category: 'army',
    describe: 'Every unit you own is healed and has its moves back.',
    apply: ({ state }) => {
      const units = new Map(state.units);
      let touched = 0;
      for (const [id, unit] of units) {
        if (unit.factionId !== PLAYER_FACTION_ID) continue;
        units.set(id, {
          ...unit,
          hp: unitType(unit.typeId).maxHp,
          movesLeft: unitType(unit.typeId).movement,
        });
        touched += 1;
      }
      return {
        ok: touched > 0,
        state: touched > 0 ? { ...state, units } : undefined,
        message:
          touched > 0
            ? `Refreshed ${touched} unit${touched === 1 ? '' : 's'}.`
            : 'You have nothing left to refresh.',
      };
    },
  },
  {
    code: 'directlake',
    category: 'army',
    describe: 'A Direct Lake Titan reports for duty.',
    apply: ({ state }) => {
      const anchor = playerAnchor(state);
      if (!anchor) return { ok: false, message: 'You have nowhere to muster.' };
      const next = conjure(state, 'directLakeTitan', anchor);
      return next
        ? { ok: true, state: next, message: 'A Direct Lake Titan takes the field.' }
        : { ok: false, message: 'No room beside your capital.' };
    },
  },
  {
    code: 'mirrored',
    category: 'army',
    describe: 'Duplicate the selected unit.',
    apply: ({ state, selectedUnitId }) => {
      const unit = selectedUnitId ? state.units.get(selectedUnitId) : undefined;
      if (!unit || unit.factionId !== PLAYER_FACTION_ID) {
        return { ok: false, message: 'Select one of your own units first.' };
      }
      const next = conjure(state, unit.typeId, unit.hex);
      return next
        ? {
            ok: true,
            state: next,
            message: `Mirrored: a second ${unitType(unit.typeId).label}.`,
          }
        : { ok: false, message: 'No room beside that unit.' };
    },
  },
  {
    code: 'dropthetable',
    category: 'war',
    describe: 'Every rival unit is destroyed. Their villages still stand.',
    apply: ({ state }) => {
      const units = new Map(state.units);
      let removed = 0;
      for (const [id, unit] of units) {
        if (unit.factionId === PLAYER_FACTION_ID) continue;
        units.delete(id);
        removed += 1;
      }
      return {
        ok: removed > 0,
        state: removed > 0 ? { ...state, units } : undefined,
        // Villages are deliberately spared: Conquest still has to be earned
        // by walking in and taking them, which is where the questions are.
        message:
          removed > 0
            ? `${removed} rival unit${removed === 1 ? '' : 's'} dropped. The villages remain.`
            : 'Nothing left to drop.',
      };
    },
  },
  {
    code: 'iknowthis',
    category: 'exam',
    describe:
      'Finish the topic you are funding without answering. The Library is not fooled.',
    apply: ({ state }) => {
      const current = state.research.current;
      if (!current) return { ok: false, message: 'You are not researching anything.' };
      /*
       * ⚠️ Writes to the tech tree, never to mastery.
       *
       * `research.known` is a GAME gate: it unlocks units and buildings. The
       * Great Library and the readiness figure are built from `mastery`, which
       * only records questions genuinely answered. So this buys the unlock and
       * leaves the topic showing as unlearned in the one place that decides
       * whether you are told you are ready.
       */
      return {
        ok: true,
        state: {
          ...state,
          research: {
            known: [...state.research.known, current],
            current: undefined,
            progress: 0,
          },
        },
        message: 'Learned, as far as the empire is concerned. The Library disagrees.',
      };
    },
  },
  {
    code: 'sitthepaper',
    category: 'exam',
    describe: 'Summon the Proctor now. You still have to pass.',
    apply: ({ faceProctor }) => {
      faceProctor();
      return { ok: true, message: 'The Proctor is called early. Forty questions.' };
    },
  },
]);

export function findCheat(input: string): Cheat | undefined {
  const code = input.trim().toLowerCase().replace(/\s+/g, '');
  return CHEATS.find((c) => c.code === code);
}
