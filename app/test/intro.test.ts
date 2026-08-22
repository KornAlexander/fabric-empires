/**
 * The opening.
 *
 * A cinematic shot is a pure function of normalised time, which is the whole
 * reason these can be tested at all: no renderer, no canvas, no WebGL, just
 * arithmetic. So the things worth asserting are the ones a screenshot would
 * never catch, and the ones that broke while it was being built.
 */

import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { introDurationMs, introShots, type IntroWorld } from '../src/intro.js';

const world: IntroWorld = {
  centre: new Vector3(0, 0, 0),
  extent: 48,
  home: new Vector3(22, 1.4, -17),
};

const shots = introShots(world);

describe('the opening sequence', () => {
  it('is four beats, in a fixed order', () => {
    expect(shots.map((s) => s.id)).toEqual([
      'intro-dawn',
      'intro-rivers',
      'intro-hands',
      'intro-title',
    ]);
  });

  it('ends on the title and the thing the game is for', () => {
    const last = shots.at(-1)!;
    expect(last.title).toBe('FABRIC EMPIRES');
    expect(last.subtitle).toBe('Learn Fabric. Learn as a family.');
  });

  it('⚠️ names the beats with the words of the anthem', () => {
    /*
     * Not decoration. The film and the song are the same text in the same
     * order, and if somebody rewrites a card without touching the lyrics the
     * two drift apart silently.
     */
    expect(shots[0]!.title).toBe('Ex nihilo');
    expect(shots[1]!.title).toBe('Flumina viam inveniunt');
    expect(shots[2]!.title).toBe('Manus parvae, manus magnae');
  });

  it('gives every beat long enough to be read', () => {
    for (const shot of shots) {
      // A card that leaves before it has been read is a wasted card.
      expect(shot.durationMs, shot.id).toBeGreaterThanOrEqual(5000);
      expect(shot.subtitle.length, shot.id).toBeGreaterThan(0);
    }
  });

  it('runs well under a minute, so it can be sat through', () => {
    const total = introDurationMs(shots);
    expect(total).toBeGreaterThan(20_000);
    expect(total).toBeLessThan(45_000);
  });
});

describe('⚠️ the camera stays above the ground', () => {
  /*
   * The failure this catches: a shot whose height is derived from the map
   * extent looks fine on a large map and puts the camera underground on a
   * small one, where the whole beat renders as the inside of a hill. Small
   * maps have radius 30 against 56 for large, so the difference is real.
   */
  it('on every world size, at every moment of every beat', () => {
    for (const extent of [12, 20, 33, 48, 60]) {
      const sized = introShots({ ...world, extent });
      for (const shot of sized) {
        for (let i = 0; i <= 20; i++) {
          const frame = shot.frame(i / 20);
          expect(
            frame.position.y,
            `${shot.id} at extent ${extent}, t=${i / 20}`,
          ).toBeGreaterThan(1.5);
        }
      }
    }
  });

  it('always looks at something, not at nothing', () => {
    for (const shot of shots) {
      for (let i = 0; i <= 10; i++) {
        const { position, target } = shot.frame(i / 10);
        expect(Number.isFinite(position.x + position.y + position.z)).toBe(true);
        expect(Number.isFinite(target.x + target.y + target.z)).toBe(true);
        // A camera sitting exactly on its own target has no orientation.
        expect(position.distanceTo(target)).toBeGreaterThan(1);
      }
    }
  });
});

describe('the shape of the flight', () => {
  it('starts far away and finishes close', () => {
    /*
     * The narrative in one assertion: the first beat is too far away to play
     * from, because saying how big the world is means showing more of it than
     * the game will ever let you use, and the last beat is close enough to see
     * the people.
     */
    const first = shots[0]!.frame(0);
    const last = shots.at(-1)!.frame(1);
    const firstReach = first.position.distanceTo(first.target);
    const lastReach = last.position.distanceTo(last.target);
    expect(firstReach).toBeGreaterThan(lastReach * 4);
  });

  it('moves continuously inside each beat rather than jumping', () => {
    for (const shot of shots) {
      let previous = shot.frame(0).position;
      let longest = 0;
      for (let i = 1; i <= 60; i++) {
        const next = shot.frame(i / 60);
        longest = Math.max(longest, previous.distanceTo(next.position));
        previous = next.position;
      }
      // A sixtieth of an eased move should never be a large fraction of it.
      const span = shot.frame(0).position.distanceTo(shot.frame(1).position);
      expect(longest, shot.id).toBeLessThan(Math.max(2, span * 0.2));
    }
  });
});
