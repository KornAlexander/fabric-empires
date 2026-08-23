/**
 * Combat.
 *
 * Strength and hit points decide fights; the challenge outcome applies a large
 * modifier on top. The intended feel: early on, when base strengths are small,
 * knowing the answer is close to decisive. Later, a well-built army survives a
 * wrong answer. The engine itself never learns what the question was.
 */

import { hexDistance, hexKey, type Hex } from '../hex/index.js';
import { terrain } from '../map/index.js';
import { createRng, type Rng } from '../rng/index.js';
import { isCivilian, cityKind, unitType, type City, type Unit } from '../entities/index.js';
import { cityAt, tileAt, unitAt, type GameState } from '../state/index.js';
import { absorbWithWalls, wallDefenceBonus } from './walls.js';
import { tacticProfile, tacticStrength, type AssaultTactic } from './assault.js';
import { grantFoothold, razeCityAt } from './sack.js';
import type { ResourceId } from '../map/index.js';

/**
 * Strength swing between a perfect answer and a wrong one.
 *
 * At +/-18 against base strengths of 8 to 60, the total swing of 36 is
 * decisive for a Profiler and merely important for a Direct Lake Titan.
 */
export const CHALLENGE_STRENGTH_SWING = 18;

/** Fortifying trades movement for staying power. */
export const FORTIFY_DEFENCE_BONUS = 0.4;

/**
 * Siege units are built to break cities and little else.
 *
 * Held at 0.75 rather than a full doubling: at 1.0 a Notebook Cannon was
 * already hitting the damage cap against an untouched city, which meant a
 * siege could not get easier as the walls came down, and the cap hid the
 * difference between a good assault and a terrible one.
 */
export const SIEGE_CITY_BONUS = 0.75;

export const MIN_DAMAGE = 10;
export const MAX_DAMAGE = 100;

export type CombatTargetKind = 'unit' | 'city';

export interface CombatSide {
  readonly baseStrength: number;
  readonly hpFactor: number;
  readonly terrainBonus: number;
  readonly fortifyBonus: number;
  readonly techBonus: number;
  readonly challengeModifier: number;
  readonly effective: number;
}

export interface CombatPreview {
  readonly attacker: CombatSide;
  readonly defender: CombatSide;
  readonly targetKind: CombatTargetKind;
  /** Damage before the random roll, so the UI can show honest odds. */
  readonly expectedDamageToDefender: number;
  readonly expectedDamageToAttacker: number;
  readonly ranged: boolean;
}

export interface CombatLog {
  readonly attackerId: string;
  readonly defenderId: string;
  readonly targetKind: CombatTargetKind;
  readonly damageToDefender: number;
  readonly damageToAttacker: number;
  readonly defenderDestroyed: boolean;
  readonly attackerDestroyed: boolean;
  readonly cityCaptured: boolean;
  /** The walls came down and the attacker chose to burn it instead. */
  readonly cityRazed: boolean;
  /** Who held the city, so the log can name what was taken from whom. */
  readonly cityFormerFactionId?: string;
  /** Plunder carried off by a razing. */
  readonly loot?: Partial<Record<ResourceId, number>>;
  /**
   * Topic opened by capturing a city from a faction that quizzes on it.
   *
   * ⚠️ This is the reason to capture rather than raze, and the only one that
   * matters: loot is spent, a cluster is learned.
   */
  readonly clusterOpened?: string;
  readonly challengeScore: number;
}

export type AttackCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

/**
 * Convert a challenge score in -1..+1 into a strength modifier.
 * Linear on purpose: a player should be able to feel the relationship.
 */
export function challengeModifier(score: number): number {
  const clamped = Math.min(1, Math.max(-1, score));
  return clamped * CHALLENGE_STRENGTH_SWING;
}

function hpFactor(hp: number, maxHp: number): number {
  // A wounded unit hits softer, but never falls below half strength, so a
  // damaged unit is still worth committing rather than being written off.
  return 0.5 + 0.5 * (Math.max(0, hp) / maxHp);
}

export interface SideOptions {
  readonly challengeScore?: number;
  readonly techBonus?: number;
  readonly attacking?: boolean;
}

export function unitCombatSide(
  state: GameState,
  unit: Unit,
  options: SideOptions = {},
): CombatSide {
  const type = unitType(unit.typeId);
  const tile = tileAt(state, unit.hex);
  // Terrain and fortification protect a defender; they do not help an attack.
  const defending = options.attacking !== true;
  const terrainBonus = defending && tile ? terrain(tile.terrain).defenceBonus : 0;
  const fortifyBonus = defending && unit.fortified ? FORTIFY_DEFENCE_BONUS : 0;
  const techBonus = options.techBonus ?? 0;
  const modifier = challengeModifier(options.challengeScore ?? 0);

  const factor = hpFactor(unit.hp, type.maxHp);
  const effective =
    type.strength * factor * (1 + terrainBonus) * (1 + fortifyBonus) * (1 + techBonus) +
    modifier;

  return {
    baseStrength: type.strength,
    hpFactor: factor,
    terrainBonus,
    fortifyBonus,
    techBonus,
    challengeModifier: modifier,
    // A negative effective strength is meaningless and would invert the
    // damage curve, so the floor is 1 rather than 0.
    effective: Math.max(1, effective),
  };
}

export function cityCombatSide(
  state: GameState,
  city: City,
  options: SideOptions = {},
): CombatSide {
  const tile = tileAt(state, city.hex);
  const terrainBonus = tile ? terrain(tile.terrain).defenceBonus : 0;
  // A city defends with its walls and its size rather than a unit's strength.
  // Pitched so that a lone melee unit cannot realistically take a capital and
  // a siege unit still needs several turns: at the first tuning a size-one
  // city defended at strength 16 against a siege unit at 50.
  const baseStrength = 20 + city.population * 6;
  // Measured against the kind's full hit points, not its current ones. An
  // earlier version compared the city to itself, so hpFactor was always 1 and
  // a city on its last hit point defended as well as an untouched one, which
  // made a siege pointless right up until the moment it succeeded.
  const factor = hpFactor(city.hp, cityKind(city.kind).baseHp);
  const modifier = challengeModifier(options.challengeScore ?? 0);
  // Walls sit in `fortifyBonus` because that is what they are: a defensive
  // work rather than a property of the ground. Scaled by how much of the wall
  // is still standing, so battering it down actually helps the besieger.
  const wallBonus = wallDefenceBonus(city);

  return {
    baseStrength,
    hpFactor: factor,
    terrainBonus,
    fortifyBonus: wallBonus,
    techBonus: 0,
    challengeModifier: modifier,
    effective: Math.max(
      1,
      baseStrength * factor * (1 + terrainBonus + wallBonus) + modifier,
    ),
  };
}

/**
 * Damage curve.
 *
 * A power curve on the strength ratio, so a small advantage matters and a
 * large one is decisive without ever being an instant kill: clamped to
 * 10..100, every fight costs the winner something.
 *
 * ⚠️ **`floorScale` exists because the floor was erasing the tactic system.**
 *
 * `MIN_DAMAGE` guarantees a fight makes progress. Flattening every weak blow to
 * the same 10 also flattened away *how* it was struck: a Profiler sapping a
 * wall and a Profiler battering it both clamped to 10, so the assault prompt
 * asked the player a question whose answer could not matter until they fielded
 * a much heavier unit. Measured four separate times before it was believed.
 *
 * The floor is a floor on **effort**, and a technique changes what that effort
 * achieves, so the technique scales the floor too. Passing 1 leaves every
 * existing caller exactly where it was.
 */
export function damageFrom(
  attackerEffective: number,
  defenderEffective: number,
  roll = 1,
  floorScale = 1,
): number {
  const ratio = attackerEffective / defenderEffective;
  const raw = 30 * Math.pow(ratio, 1.5) * roll;
  const floor = MIN_DAMAGE * Math.max(0, floorScale);
  return Math.round(Math.min(MAX_DAMAGE, Math.max(floor, raw)));
}

/** Whether the attacker may strike the given hex at all. */
export function canAttack(
  state: GameState,
  attackerId: string,
  target: Hex,
): AttackCheck {
  const attacker = state.units.get(attackerId);
  if (!attacker) return { ok: false, reason: 'No such unit' };
  if (attacker.factionId !== state.activeFactionId) {
    return { ok: false, reason: 'Not your unit' };
  }
  if (isCivilian(attacker.typeId)) {
    return { ok: false, reason: 'Civilians cannot attack' };
  }
  if (attacker.movesLeft <= 0) {
    return { ok: false, reason: 'This unit has already acted' };
  }
  if (!state.map.tiles.has(hexKey(target))) {
    return { ok: false, reason: 'Off the map' };
  }

  const defendingUnit = unitAt(state, target);
  const defendingCity = cityAt(state, target);
  if (!defendingUnit && !defendingCity) {
    return { ok: false, reason: 'Nothing to attack there' };
  }
  if (defendingUnit && defendingUnit.factionId === attacker.factionId) {
    return { ok: false, reason: 'That is your own unit' };
  }
  if (!defendingUnit && defendingCity?.factionId === attacker.factionId) {
    return { ok: false, reason: 'That is your own city' };
  }

  const type = unitType(attacker.typeId);
  const distance = hexDistance(attacker.hex, target);
  const reach = Math.max(1, type.range);
  if (distance > reach) {
    return { ok: false, reason: 'Out of reach' };
  }

  return { ok: true };
}

export interface AttackOptions {
  /** Challenge result in -1..+1 for the attacker. Zero means none was asked. */
  readonly challengeScore?: number;
  /**
   * Challenge result for the defender.
   *
   * When an antagonist raids the player, it is the player who is defending and
   * therefore the player who answers. Without this the API could only ever
   * express a battle where the aggressor is the one being tested.
   */
  readonly defenderChallengeScore?: number;
  readonly techBonus?: number;
  readonly rng?: Rng;
  /**
   * What to do with the city if this blow brings it down.
   *
   * Defaults to capture, which is what the game did before there was a choice,
   * so every existing caller and save keeps its old behaviour.
   */
  readonly cityOutcome?: 'capture' | 'raze';
  /**
   * How the attacker goes at a walled city.
   *
   * Ignored against units and against an unwalled city, because there is no
   * wall to go over, under or through. Defaults to `batter`, which is exactly
   * what an attack did before tactics existed.
   */
  readonly tactic?: AssaultTactic;
}

/**
 * The numbers a player should see before committing, with no randomness.
 * Preview and resolution share every calculation, so the odds shown are the
 * odds fought.
 */
export function previewAttack(
  state: GameState,
  attackerId: string,
  target: Hex,
  options: AttackOptions = {},
): CombatPreview | undefined {
  const attacker = state.units.get(attackerId);
  if (!attacker) return undefined;
  const check = canAttack(state, attackerId, target);
  if (!check.ok) return undefined;

  const type = unitType(attacker.typeId);
  const ranged = type.range > 0;
  const defendingUnit = unitAt(state, target);
  const targetKind: CombatTargetKind = defendingUnit ? 'unit' : 'city';

  const attackerSide = unitCombatSide(state, attacker, {
    ...options,
    attacking: true,
  });

  let defenderSide: CombatSide;
  if (defendingUnit) {
    defenderSide = unitCombatSide(state, defendingUnit, {
      techBonus: 0,
      attacking: false,
      challengeScore: options.defenderChallengeScore ?? 0,
    });
  } else {
    defenderSide = cityCombatSide(state, cityAt(state, target)!, {
      challengeScore: options.defenderChallengeScore ?? 0,
    });
  }

  const siegeMultiplier =
    targetKind === 'city' && type.role === 'siege' ? 1 + SIEGE_CITY_BONUS : 1;
  // Tactics only exist against a city. Against a unit there is no wall to go
  // over, under or through, so the profile is never consulted.
  const tactic = targetKind === 'city' ? tacticProfile(options.tactic) : tacticProfile('batter');
  // Sap is a bonus against masonry, not against people. Once the breach is
  // open it is the worst way in, which is what its own description promises.
  const wallStanding = targetKind === 'city' && (cityAt(state, target)?.wallHp ?? 0) > 0;
  const tacticStrengthNow = tacticStrength(tactic, wallStanding);

  return {
    attacker: attackerSide,
    defender: defenderSide,
    targetKind,
    ranged,
    expectedDamageToDefender: damageFrom(
      attackerSide.effective * siegeMultiplier * tacticStrengthNow,
      defenderSide.effective,
      1,
      tacticStrengthNow,
    ),
    // A ranged attacker takes nothing back, which is the entire reason to
    // build one. A city does not counterattack a melee strike either, unless
    // the tactic is the one that puts men on the parapet.
    expectedDamageToAttacker:
      ranged
        ? 0
        : targetKind === 'city'
          ? Math.round(
              damageFrom(defenderSide.effective, attackerSide.effective) * tactic.cityCounter,
            )
          : damageFrom(defenderSide.effective, attackerSide.effective),
  };
}

export interface AttackResult {
  readonly state: GameState;
  readonly log: CombatLog;
}

export type AttackOutcome =
  | { readonly ok: true; readonly result: AttackResult }
  | { readonly ok: false; readonly reason: string };

/**
 * Resolve an attack.
 *
 * The random roll is drawn from a stream keyed by the seed, turn, attacker and
 * target, so a replayed game fights identical battles without the caller
 * having to thread an RNG through the UI.
 */
export function resolveAttack(
  state: GameState,
  attackerId: string,
  target: Hex,
  options: AttackOptions = {},
): AttackOutcome {
  const check = canAttack(state, attackerId, target);
  if (!check.ok) return { ok: false, reason: check.reason };

  const preview = previewAttack(state, attackerId, target, options);
  if (!preview) return { ok: false, reason: 'Attack could not be resolved' };

  const attacker = state.units.get(attackerId)!;
  const rng =
    options.rng ??
    createRng(state.seed, `combat:${state.turn}:${attackerId}:${hexKey(target)}`);

  const attackRoll = rng.float(0.9, 1.1);
  const defenceRoll = rng.float(0.9, 1.1);
  const type = unitType(attacker.typeId);
  const siegeMultiplier =
    preview.targetKind === 'city' && type.role === 'siege' ? 1 + SIEGE_CITY_BONUS : 1;
  /*
   * ⚠️ **The tactic has to be applied here as well as in the preview.**
   *
   * This function recomputes the damage rather than reading it off the
   * preview, so a factor added to one and not the other silently splits them.
   * Measured when tactics were first wired: `sap` previewed 33 damage and
   * resolved for 17, and `escalade` showed the player a hundred points of
   * counterattack and then charged nothing at all. The comment on
   * `previewAttack` promises "the odds shown are the odds fought", and it was
   * true only because nothing had ever differed between them before.
   */
  const tactic = tacticProfile(preview.targetKind === 'city' ? options.tactic : 'batter');
  const wallStanding =
    preview.targetKind === 'city' && (cityAt(state, target)?.wallHp ?? 0) > 0;

  const damageToDefender = damageFrom(
    preview.attacker.effective * siegeMultiplier * tacticStrength(tactic, wallStanding),
    preview.defender.effective,
    attackRoll,
    tacticStrength(tactic, wallStanding),
  );
  const damageToAttacker = preview.ranged
    ? 0
    : preview.targetKind === 'city'
      ? Math.round(
          damageFrom(preview.defender.effective, preview.attacker.effective, defenceRoll) *
            tactic.cityCounter,
        )
      : damageFrom(preview.defender.effective, preview.attacker.effective, defenceRoll);

  const units = new Map(state.units);
  const cities = new Map(state.cities);

  const attackerHp = attacker.hp - damageToAttacker;
  const attackerDestroyed = attackerHp <= 0;

  let defenderId: string;
  let defenderDestroyed = false;
  let cityCaptured = false;
  let cityRazed = false;
  let razedCityId: string | undefined;
  let cityFormerFactionId: string | undefined;

  if (preview.targetKind === 'unit') {
    const defender = unitAt(state, target)!;
    defenderId = defender.id;
    const defenderHp = defender.hp - damageToDefender;
    defenderDestroyed = defenderHp <= 0;
    if (defenderDestroyed) {
      units.delete(defender.id);
    } else {
      units.set(defender.id, { ...defender, hp: defenderHp });
    }
  } else {
    const city = cityAt(state, target)!;
    defenderId = city.id;
    /*
     * ⚠️ **The walls take it first, and this is what makes a siege a siege.**
     *
     * Until this was wired, nothing in the game ever reduced `wallHp`. Walls
     * changed the odds and then stood forever at full integrity, so
     * `wallDefenceBonus` never decayed and the rule that battering them down
     * helps was unreachable code with passing tests behind it. A tested helper
     * nobody calls is not a feature.
     */
    const { wallHp, toCity } = absorbWithWalls(
      city,
      damageToDefender,
      tacticProfile(options.tactic).wallShare,
    );
    const cityHp = city.hp - toCity;
    if (cityHp <= 0 && !preview.ranged) {
      // Only a melee unit can walk in and take the city. Bombardment alone
      // never captures anything, which is what keeps siege units support
      // rather than a win button.
      cityFormerFactionId = city.factionId;
      if (options.cityOutcome === 'raze') {
        cityRazed = true;
        razedCityId = city.id;
      } else {
        cityCaptured = true;
        cities.set(city.id, {
          ...city,
          factionId: attacker.factionId,
          hp: Math.round(city.hp * 0.25),
          population: Math.max(1, city.population - 1),
          // The walls were breached to get in. The level stands, so the new
          // owner inherits the earthworks and can mend them, which is what
          // `wallWork`'s repair branch exists for.
          wallHp: 0,
        });
      }
    } else {
      cities.set(city.id, { ...city, hp: Math.max(1, cityHp), wallHp });
    }
  }

  if (attackerDestroyed) {
    units.delete(attacker.id);
  } else {
    const movesLeft = 0; // attacking always ends the unit's turn
    // A razed hex is walked into as well: there is nothing left holding it.
    const nextHex =
      cityCaptured || cityRazed || (defenderDestroyed && !preview.ranged)
        ? target
        : attacker.hex;
    units.set(attacker.id, {
      ...attacker,
      hp: attackerHp,
      movesLeft,
      fortified: false,
      hex: nextHex,
    });
  }

  let next: GameState = { ...state, units, cities };
  let loot: Record<ResourceId, number> | undefined;
  let clusterOpened: string | undefined;

  if (cityRazed && razedCityId) {
    const burned = razeCityAt(next, razedCityId, attacker.factionId);
    next = burned.state;
    loot = burned.loot;
  }

  /*
   * Spoils of capture: the loser's syllabus.
   *
   * ⚠️ Only for the player, because `state.research` is the player's and
   * nobody else's. An antagonist taking a city must not quietly hand the
   * player a topic, which is what a faction-blind version of this did.
   */
  if (cityCaptured && cityFormerFactionId) {
    const captor = state.factions.get(attacker.factionId);
    const loser = state.factions.get(cityFormerFactionId);
    if (captor?.isPlayer && loser) {
      const granted = grantFoothold(next, loser.topicCluster);
      next = granted.state;
      if (granted.topicId !== undefined) clusterOpened = granted.topicId;
    }
  }

  return {
    ok: true,
    result: {
      state: next,
      log: {
        attackerId,
        defenderId,
        targetKind: preview.targetKind,
        damageToDefender,
        damageToAttacker,
        defenderDestroyed,
        attackerDestroyed,
        cityCaptured,
        cityRazed,
        ...(cityFormerFactionId !== undefined ? { cityFormerFactionId } : {}),
        ...(loot !== undefined ? { loot } : {}),
        ...(clusterOpened !== undefined ? { clusterOpened } : {}),
        challengeScore: options.challengeScore ?? 0,
      },
    },
  };
}
