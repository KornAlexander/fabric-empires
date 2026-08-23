/**
 * The opening.
 *
 * ⚠️ **This is a title sequence, not a video file.** Everything here obeys the
 * rule the cinematic module opens with (D59): the camera moves through the
 * real, seed-generated world, so the establishing shot of a coastline is a
 * shot of *that* coastline, on the seed the player just typed, lit at the hour
 * the game is currently lit for. Two players who compare their openings are
 * looking at two different films.
 *
 * The five beats are the five sung passages of the anthem, in order, which is
 * what makes the film and the song the same text rather than a picture with
 * music laid over it. The last card is the only English in the sequence, and
 * it is the only thing the sequence is actually for:
 *
 *   Learn Fabric. Learn as a family.
 *
 * ⚠️ **The timings are measured against the recording, not chosen.** The
 * anthem opens with an unaccompanied boy soprano before Verse 1 begins, and
 * the film used to ignore that: it put "Ex nihilo" on screen at t=0, so by the
 * time *Ex nihilo terra surgit* was actually sung the sequence had already cut
 * to the next card. Every card was one passage early.
 *
 * The lines were located by decoding the track and looking for the breath gaps
 * between them, in the band the voices occupy. They begin at:
 *
 * | t | passage |
 * | --- | --- |
 * | 0.00 s | *Fabrica... fabrica... Texamus una.* solo, unaccompanied |
 * | 5.35 s | *Ex nihilo terra surgit* (low strings enter at 4.6 s) |
 * | 12.44 s | *Flumina viam inveniunt* |
 * | 18.29 s | *Manus parvae, manus magnae* |
 * | 24.79 s | *Simul aedificant* |
 * | 30.54 s | the chorus, full choir |
 *
 * Each beat runs from one of those to the next. ⚠️ The old durations were
 * already almost exactly right, which is the tell: the sequence was not
 * mistimed, it was **started too early**.
 */

import { Vector3 } from 'three';
import {
  approachShot,
  descendShot,
  orbitShot,
  type CinematicShot,
} from './three/cinematic.js';

export interface IntroWorld {
  /** The middle of the map, on the ground. */
  readonly centre: Vector3;
  /** Roughly how far the land reaches from that centre, in world units. */
  readonly extent: number;
  /** Where the player's people are standing at turn one. */
  readonly home: Vector3;
}

/**
 * The sequence, as data.
 *
 * A list rather than a routine so the whole thing stays a pure function of the
 * world: it can be counted, measured and asserted on without a renderer, and
 * the recorder can ask how long it runs before it starts rolling.
 */
export function introShots(world: IntroWorld): readonly CinematicShot[] {
  const { centre, extent, home } = world;

  /*
   * Beat zero. One voice, and almost nothing to look at.
   *
   * ⚠️ **This beat exists to hold the anthem's unaccompanied opening**, which
   * the film used to play underneath the wrong card. It is deliberately the
   * tightest shot in the sequence: a slow turn a few metres above the player's
   * own people, on ground they can already see.
   *
   * ⚠️ **It therefore shows no more of the map than the sequence already
   * did.** The opening lifts the fog while it runs, so a longer film could
   * easily mean giving away more of a map the player is about to have hidden
   * from them again. A close shot on the one tile they have already explored
   * adds five seconds and reveals nothing.
   *
   * It also earns the next cut. The wide reveal now lands on *out of nothing,
   * the land rises* instead of being spent on an intro nobody is singing yet.
   */
  const forge = orbitShot({
    id: 'intro-forge',
    title: 'Fabrica',
    subtitle: 'The workshop. Let us weave together',
    centre: home,
    radius: 5.5,
    fromHeight: 2.0,
    toHeight: 3.4,
    sweepRad: 0.34,
    startAngleRad: -1.2,
    durationMs: 5350,
  });

  /*
   * Beat one. The whole map, from high up, turning slowly.
   *
   * Deliberately too far away to play from. The point of an opening shot is
   * to say how big the thing is, and the only way to say that is to show more
   * of it than the game will ever let you use at once.
   */
  const dawn = orbitShot({
    id: 'intro-dawn',
    title: 'Ex nihilo',
    subtitle: 'Out of nothing, the land rises',
    centre,
    radius: extent * 1.15,
    fromHeight: extent * 0.95,
    toHeight: extent * 0.62,
    sweepRad: 0.72,
    startAngleRad: -0.5,
    // 5.35s to 12.44s: the length of its own line, which it always was.
    durationMs: 7090,
  });

  /*
   * Beat two. Down to the water, coming in across it.
   *
   * The coast is the most expensive thing in the scene, since it is the only
   * place the erosion, the shoreline smoothing and the refractive water are
   * all visible in one frame, so the film spends a beat there.
   */
  const rivers = approachShot({
    id: 'intro-rivers',
    title: 'Flumina viam inveniunt',
    subtitle: 'The rivers find their way',
    focus: home.clone().lerp(centre, 0.45),
    from: new Vector3(-0.8, 0, 0.6),
    startDistance: extent * 0.62,
    endDistance: extent * 0.2,
    startHeight: extent * 0.3,
    endHeight: extent * 0.075,
    // 12.44s to 18.29s.
    durationMs: 5850,
  });

  /*
   * Beat three. Onto the people.
   *
   * A fall rather than a pan, because this is the beat where the film stops
   * being about the landscape. The stands are small on purpose (D243) and the
   * camera has to come and find them, which is the honest way round.
   */
  const hands = descendShot({
    id: 'intro-hands',
    title: 'Manus parvae, manus magnae',
    subtitle: 'Small hands, great hands',
    centre: home,
    startHeight: extent * 0.34,
    endHeight: 2.6,
    radius: extent * 0.22,
    sweepRad: 0.85,
    // 18.29s to 24.79s.
    durationMs: 6500,
  });

  /*
   * Beat four. The title, on a slow close orbit.
   *
   * Held long. A title card that leaves before it has been read is a wasted
   * card, and this is the line the whole project is arguing for.
   *
   * ⚠️ It comes up on *Simul aedificant*, "together they build", and is still
   * on screen when the full choir enters at 30.54 s. That is the loudest
   * moment in the piece and the title card should be sitting on it.
   */
  const title = orbitShot({
    id: 'intro-title',
    title: 'FABRIC EMPIRES',
    subtitle: 'Learn Fabric. Learn as a family.',
    centre: home,
    radius: 7.5,
    fromHeight: 3.2,
    toHeight: 5.4,
    sweepRad: 0.62,
    startAngleRad: 0.85,
    durationMs: 7600,
  });

  return [forge, dawn, rivers, hands, title];
}

/** How long the whole sequence runs, before anyone skips it. */
export function introDurationMs(shots: readonly CinematicShot[]): number {
  return shots.reduce((total, shot) => total + shot.durationMs, 0);
}
