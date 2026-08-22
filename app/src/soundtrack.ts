/**
 * The background score.
 *
 * ⚠️ **Every track here is instrumental, and that is a decision about
 * studying rather than about taste.** This game asks the player to read exam
 * questions under a clock. Speech and sung words measurably interfere with
 * reading comprehension even when the listener is ignoring them, so a
 * soundtrack with a Latin chorus over it would make the tool worse at the one
 * job it has. The anthem sings, once, over a title sequence with nothing to
 * read. The score that runs for the next two hours does not.
 *
 * ⚠️ **The files are deliberately not in the repository**, for the same
 * reason as the anthem (see `audio.ts` and NOTICE): they were generated with
 * Suno on a free plan, whose output carries a non-commercial licence that has
 * no business being attached to a public repo. So the contract is the same
 * one: if the files are there the game has a score, and if they are not,
 * every call here is a no-op and the game is silent with nothing broken and
 * nothing logged. A clone gets the quiet version.
 *
 * Each track carries a mood. Nothing reads it yet. It is recorded now because
 * the alternative to writing it down while the track is being made is
 * listening to six files later and guessing, and because state-reactive music
 * (calm while building, tense while besieged) becomes a scheduling change
 * rather than a regeneration if the tags already exist.
 */

/** What a track is for. Recorded at generation time; not yet acted on. */
export type Mood = 'calm' | 'tense';

export interface Track {
  /** Path relative to the site root. */
  readonly file: string;
  /** The title, as generated. Shown nowhere yet; used in logs and tests. */
  readonly title: string;
  readonly mood: Mood;
}

/**
 * The score, in the order it was written.
 *
 * Adding a track is one line here plus the file. Missing files are dropped at
 * load, so this list may name more than a given checkout actually has, and
 * that is the intended state of affairs rather than an oversight.
 */
export const SOUNDTRACK: readonly Track[] = [
  { file: 'audio/terra-nostra.mp3', title: 'Terra Nostra', mood: 'calm' },
  { file: 'audio/ferrum-et-ignis.mp3', title: 'Ferrum et Ignis', mood: 'tense' },
];

/** Where the mute preference lives, so it survives a reload. */
const STORE_KEY = 'fabric-empires:music';

/**
 * Quieter than the anthem's 0.55, because this one plays *under* something.
 * The anthem has the screen to itself; the score competes with a question the
 * player is trying to read.
 */
const VOLUME = 0.28;

/**
 * Silence between tracks.
 *
 * ⚠️ Not zero. An unbroken two hour wall of orchestra is more tiring than the
 * same music with air in it, and the gap is also the only moment a player can
 * tell that the score is a playlist rather than one very long loop.
 */
const GAP_MS = 7_000;

/** Long enough not to punch in over the anthem's tail. */
const FADE_IN_MS = 1_500;

/**
 * Fisher-Yates, with the randomness handed in.
 *
 * Exported because a shuffle is exactly the kind of code that looks obviously
 * correct and quietly is not, and because a test cannot check a shuffle it
 * cannot seed.
 */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * The next pass through the score.
 *
 * ⚠️ **A plain reshuffle can put the track that just ended straight back on**,
 * which with two or three files is not a rare accident but a coin flip, and
 * it reads as a bug rather than as chance. So the first entry is swapped away
 * from `avoid` when there is anything to swap it with.
 */
export function nextRotation<T>(items: readonly T[], random: () => number, avoid?: T): T[] {
  const out = shuffle(items, random);
  if (out.length > 1 && avoid !== undefined && out[0] === avoid) {
    const swap = 1 + Math.floor(random() * (out.length - 1));
    [out[0], out[swap]] = [out[swap]!, out[0]!];
  }
  return out;
}

export interface Soundtrack {
  /**
   * Begin playing, if there is anything to play and the player has not muted.
   *
   * ⚠️ Must be reached from inside a user gesture, like every other sound on
   * the web. Idempotent, so it is safe to call from both the end of the
   * opening film and the first click of a resumed game, which is what happens.
   */
  start(): void;
  /** Silence or restore the score, and remember which for next time. */
  setMuted(muted: boolean): void;
  /** Flip it. Returns the new state. */
  toggle(): boolean;
  readonly muted: boolean;
  /** True once at least one track has been found. */
  readonly available: boolean;
  /** The title currently sounding, or nothing between tracks and when muted. */
  readonly nowPlaying: string | undefined;
  /** Called whenever mute or the current track changes. */
  onChange(listener: () => void): void;
}

function storedMute(): boolean {
  try {
    return window.localStorage.getItem(STORE_KEY) === 'off';
  } catch {
    // Storage refused, which happens in private windows. Default to sound on.
    return false;
  }
}

function storeMute(muted: boolean): void {
  try {
    window.localStorage.setItem(STORE_KEY, muted ? 'off' : 'on');
  } catch {
    // Then the preference lasts for this session only, which is not worth an
    // error message to somebody who cannot change the setting that caused it.
  }
}

export function createSoundtrack(
  tracks: readonly Track[] = SOUNDTRACK,
  random: () => number = Math.random,
): Soundtrack {
  let found: Track[] = [];
  let queue: Track[] = [];
  let element: HTMLAudioElement | undefined;
  let current: Track | undefined;
  let started = false;
  let muted = storedMute();
  let gapTimer: number | undefined;
  let fadeTimer: number | undefined;
  const listeners: (() => void)[] = [];

  const announce = (): void => {
    for (const listener of listeners) listener();
  };

  /*
   * Probing rather than trusting, exactly as the anthem does. An <audio>
   * element pointed at a file that is not there fails asynchronously and
   * says nothing, so `available` would lie right up until the first play.
   */
  void Promise.all(
    tracks.map(async (track) => {
      try {
        const response = await fetch(track.file, { method: 'HEAD' });
        return response.ok ? track : undefined;
      } catch {
        return undefined;
      }
    }),
  ).then((results) => {
    found = results.filter((track): track is Track => track !== undefined);
    if (found.length === 0) return;
    // A start() that arrived before the probe finished is honoured now.
    if (started) play();
    announce();
  });

  const clearTimers = (): void => {
    if (gapTimer !== undefined) window.clearTimeout(gapTimer);
    if (fadeTimer !== undefined) window.clearInterval(fadeTimer);
    gapTimer = undefined;
    fadeTimer = undefined;
  };

  const fadeIn = (audio: HTMLAudioElement): void => {
    audio.volume = 0;
    const step = 50;
    const rise = VOLUME / Math.max(1, FADE_IN_MS / step);
    fadeTimer = window.setInterval(() => {
      audio.volume = Math.min(VOLUME, audio.volume + rise);
      if (audio.volume < VOLUME - 0.001) return;
      window.clearInterval(fadeTimer);
      fadeTimer = undefined;
    }, step);
  };

  function play(): void {
    if (muted || found.length === 0) return;
    clearTimers();
    if (queue.length === 0) queue = nextRotation(found, random, current);
    const track = queue.shift();
    if (!track) return;
    current = track;

    const audio = element ?? new Audio();
    audio.src = track.file;
    audio.preload = 'auto';
    audio.loop = false;
    audio.onended = () => {
      current = undefined;
      announce();
      // Air between tracks, then the next one.
      gapTimer = window.setTimeout(play, GAP_MS);
    };
    audio.onerror = () => {
      // One unreadable file should cost that file, not the whole score.
      // ⚠️ Both lists, not just `found`: the current rotation was built before
      // the failure and may still be holding a copy, which would play it
      // again on the very next gap and make the drop look like it did not
      // happen.
      found = found.filter((other) => other !== track);
      queue = queue.filter((other) => other !== track);
      current = undefined;
      gapTimer = window.setTimeout(play, GAP_MS);
    };
    element = audio;

    fadeIn(audio);
    void audio.play().catch(() => {
      // Refused, almost certainly for want of a gesture. Stay quiet and let
      // the next start() try again rather than looping on a rejection.
      started = false;
      current = undefined;
    });
    announce();
  }

  /*
   * A tab nobody is looking at should not be playing music at them. This is
   * the single most common complaint about background audio on the web, and
   * the fix is four lines.
   */
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!element || muted) return;
      if (document.hidden) element.pause();
      else if (started) void element.play().catch(() => undefined);
    });
  }

  return {
    get available() {
      return found.length > 0;
    },
    get muted() {
      return muted;
    },
    get nowPlaying() {
      return current?.title;
    },

    onChange(listener) {
      listeners.push(listener);
    },

    start() {
      if (started) return;
      started = true;
      play();
    },

    setMuted(next) {
      if (next === muted) return;
      muted = next;
      storeMute(muted);
      if (muted) {
        clearTimers();
        element?.pause();
        current = undefined;
      } else if (started) {
        play();
      }
      announce();
    },

    toggle() {
      this.setMuted(!muted);
      // Unmuting is itself a click, so it is a gesture the browser accepts,
      // which makes the mute button a second way into the first play.
      if (!muted && !started) this.start();
      return muted;
    },
  };
}
