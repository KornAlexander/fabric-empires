/**
 * Walls.
 *
 * Section 19.2: a city can spend production on fortification, which finally
 * gives production a purpose beyond units and makes a siege something other
 * than an attack on a health bar.
 *
 * Two numbers rather than one. `wallLevel` is what was built and is only ever
 * raised by production; `wallHp` is what is still standing and is knocked down
 * by attackers. Keeping them apart is what lets a siege *progress*: the walls
 * come down over several assaults while the level, and therefore the cost
 * already sunk into it, stays. A single number would either forget the
 * investment or make damage permanent.
 *
 * ⚠️ Walls scale defence, they do not add to it. A flat bonus would make a
 * size-one outpost with three wall levels as hard to take as a capital, and
 * the whole point of the rank system is that big cities are the hard ones.
 */

import type { City } from '../entities/index.js';

/** Three levels, so a wall is a campaign rather than a checkbox. */
export const MAX_WALL_LEVEL = 3;

/** Hit points each level contributes. */
export const WALL_HP_PER_LEVEL = 40;

/**
 * Cost of the *next* level, which rises with each one.
 *
 * Priced against `unitCost`, where a Pipeline Runner is 54 and the heaviest
 * unit is 114, and against `PRODUCTION_CAP_PER_TURN` of 15. So a first wall is
 * about as much work as a cheap unit and a third is more than the heaviest,
 * which is the trade the plan wants: arming and fortifying compete.
 */
export const WALL_COST_STEP = 36;

/**
 * How much each intact level scales the city's defence.
 *
 * At three levels this roughly doubles it. A siege unit carries
 * `SIEGE_CITY_BONUS`, so a fortress is a serious problem for a line unit and a
 * manageable one for the thing built to break it, which is the point of having
 * siege units at all.
 */
export const WALL_DEFENCE_PER_LEVEL = 0.35;

/** What the next level costs, or undefined when there is nothing left to build. */
export function nextWallCost(level: number): number | undefined {
  if (level >= MAX_WALL_LEVEL) return undefined;
  return WALL_COST_STEP * (level + 1);
}

/** Hit points a wall of this level has when undamaged. */
export function maxWallHp(level: number): number {
  return level * WALL_HP_PER_LEVEL;
}

/**
 * How much of the wall is still standing, 0 to 1.
 *
 * A city with no wall reads as 0 rather than 1, so callers cannot accidentally
 * treat "no walls" as "perfect walls" by dividing by zero.
 */
export function wallIntegrity(city: City): number {
  const max = maxWallHp(city.wallLevel);
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, city.wallHp / max));
}

/**
 * The defence multiplier the walls are currently worth.
 *
 * ⚠️ Scaled by integrity, so battering the walls down actually helps. Without
 * this a siege would face the same defence on its last assault as its first,
 * which is exactly the flaw `hpFactor` was introduced to fix for the city
 * itself.
 */
export function wallDefenceBonus(city: City): number {
  return city.wallLevel * WALL_DEFENCE_PER_LEVEL * wallIntegrity(city);
}

/**
 * Take damage on the walls first, and report what got through.
 *
 * Walls absorb rather than deflect: while any are standing they soak the blow,
 * and only the remainder reaches the city. That is what makes the first
 * assaults of a siege feel different from the last one.
 */
export function absorbWithWalls(
  city: City,
  damage: number,
): { readonly wallHp: number; readonly toCity: number } {
  if (city.wallLevel <= 0 || city.wallHp <= 0) {
    return { wallHp: 0, toCity: damage };
  }
  const absorbed = Math.min(city.wallHp, damage);
  return { wallHp: city.wallHp - absorbed, toCity: damage - absorbed };
}
