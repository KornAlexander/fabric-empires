/**
 * The anthem.
 *
 * ⚠️ **The file this loads is deliberately not in the repository.**
 *
 * Two rules collide here. The first is D59: this project ships no assets at
 * all, because the terrain, the water and every surface are generated at
 * runtime, and that is a claim worth keeping true. The second is that a choral
 * anthem cannot be generated at runtime by any honest means, so the title
 * sequence wants one real file.
 *
 * The resolution is that the music is **optional at load time**. If
 * `public/audio/anthem.mp3` exists the opening has a score; if it does not,
 * every call here is a no-op and the sequence plays in silence with nothing
 * broken and nothing logged as an error. A clone of this repository gets the
 * silent version, which is also the version with no licence attached to it.
 *
 * The track is `Familia Nostra`, generated with Suno on a free plan, whose
 * output is licensed for non-commercial use. That is a poor fit for a public
 * repository, so it lives beside the video instead of inside the source. See
 * NOTICE.
 */

/** Where the optional score is looked for, relative to the site root. */
const ANTHEM_URL = 'audio/anthem.mp3';

export interface Anthem {
  /**
   * Start playing from the top.
   *
   * ⚠️ Must be called from inside a user gesture or the browser will refuse.
   * The opening runs immediately after the player clicks Begin, which is one,
   * so this is safe where it is actually used. A rejected play is swallowed
   * rather than thrown: no music is a worse film, not a broken game.
   */
  start(): void;
  /** Fade out over a moment and stop. */
  fade(ms?: number): void;
  /**
   * How far into the anthem playback has reached, in seconds.
   *
   * ⚠️ The only honest clock for checking that the title cards land on the
   * lines they name. Timing the film against itself cannot detect the case
   * that matters, which is the film and the music drifting apart, and the main
   * thread blocks for around a second while the fog is rebuilt at the start of
   * the sequence, so a wall clock started from the outside is late by exactly
   * the amount nobody wants to be wrong about. Zero when silent.
   */
  readonly at: number;
  /** True once the file has been found and decoded. */
  readonly available: boolean;
}

export function createAnthem(volume = 0.55): Anthem {
  let element: HTMLAudioElement | undefined;
  let ready = false;
  let fading: number | undefined;

  /*
   * Probing rather than trusting. An <audio> element pointed at a missing file
   * fails asynchronously and quietly, so `available` would lie until the first
   * play. A HEAD request settles it before anything asks.
   */
  void fetch(ANTHEM_URL, { method: 'HEAD' })
    .then((response) => {
      if (!response.ok) return;
      const audio = new Audio(ANTHEM_URL);
      audio.preload = 'auto';
      audio.loop = false;
      audio.volume = volume;
      element = audio;
      ready = true;
    })
    .catch(() => {
      // No file, no score, no complaint.
    });

  const stopFade = (): void => {
    if (fading === undefined) return;
    window.clearInterval(fading);
    fading = undefined;
  };

  return {
    get available() {
      return ready;
    },

    get at() {
      return element && !element.paused ? element.currentTime : 0;
    },

    start() {
      if (!element) return;
      stopFade();
      element.currentTime = 0;
      element.volume = volume;
      void element.play().catch(() => {
        // Autoplay refused. The film still plays.
      });
    },

    fade(ms = 1600) {
      const audio = element;
      if (!audio || audio.paused) return;
      stopFade();
      const step = 40;
      const drop = audio.volume / Math.max(1, ms / step);
      fading = window.setInterval(() => {
        audio.volume = Math.max(0, audio.volume - drop);
        if (audio.volume > 0.001) return;
        audio.pause();
        stopFade();
      }, step);
    },
  };
}
