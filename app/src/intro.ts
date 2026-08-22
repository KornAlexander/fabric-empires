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
 * The four beats are the four Latin lines of the anthem, in order, which is
 * what makes the film and the song the same text rather than a picture with
 * music laid over it. The last card is the only English in the sequence, and
 * it is the only thing the sequence is actually for:
 *
 *   Learn Fabric. Learn as a family.
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
    durationMs: 7200,
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
    durationMs: 6400,
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
    durationMs: 6000,
  });

  /*
   * Beat four. The title, on a slow close orbit.
   *
   * Held long. A title card that leaves before it has been read is a wasted
   * card, and this is the line the whole project is arguing for.
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

  return [dawn, rivers, hands, title];
}

/** How long the whole sequence runs, before anyone skips it. */
export function introDurationMs(shots: readonly CinematicShot[]): number {
  return shots.reduce((total, shot) => total + shot.durationMs, 0);
}
