import {
  ANTAGONIST_FACTION_ID,
  BASE_HEX_SIZE,
  PLAYER_FACTION_ID,
  canAttack,
  canFoundCity,
  cityAt,
  cityTerritory,
  completeResearch,
  createGameState,
  createRng,
  buildableUnits,
  cancelProduction,
  setProduction,
  unitCost,
  PRODUCTION_CAP_PER_TURN,
  endTurn,
  fortifyUnit,
  foundCity,
  hexKey,
  hexNeighbour,
  moveUnit,
  normaliseSeed,
  previewAttack,
  reachable,
  researchCost,
  researchProgress,
  researchable,
  resolveAttack,
  resolveReview,
  reviewOpportunities,
  selectableUnitAt,
  skipUnit,
  startResearch,
  terrain,
  tileYields,
  topicById,
  unitAt,
  unitType,
  unitsOf,
  type AiEvent,
  type GameState,
  type Hex,
  type ReachableTile,
  type UnitTypeId,
} from '@fabric-empires/engine';
import {
  DAY_MS,
  DP600_QUESTIONS,
  Dp600ChallengeProvider,
  buildLibraryModel,
  checkAnswer,
  createMasteryTracker,
  createQuestionPresenter,
  localStorageStore,
  summarise,
} from '@fabric-empires/learn';
import { createEffects } from './render/effects.js';
import { createScene3D } from './three/scene3d.js';
import { playDuel } from './three/duel.js';
import { HEX_RADIUS, hexToWorld } from './three/terrain.js';
import { HIGH_QUALITY, LOW_QUALITY } from './three/world.js';
import { createQuestionModal } from './ui/questionModal.js';
import { createGreatLibrary } from './ui/greatLibrary.js';
import { createDroneHud } from './ui/droneHud.js';
import { createEndScreen } from './ui/endScreen.js';
import { loadGame, localSlot, saveGame } from './persist.js';
import { createBattleBanner, type BattleSide } from './ui/battleBanner.js';

/**
 * The learning layer, injected at the edge of the app.
 *
 * The engine receives only the topic graph and, later, a score. Everything
 * about DP-600 lives on this side of the line (D35).
 */
const modal = createQuestionModal();
const askedThisSession = new Set<string>();

/**
 * Spaced repetition, persisted across sessions.
 *
 * The session start is handed over so the compressed in-session clock runs:
 * real SM-2 intervals are measured in days, which would mean the review loop
 * never fires during the hour somebody actually plays.
 */
const mastery = createMasteryTracker({
  store: localStorageStore(),
  sessionStart: Date.now(),
});

const provider = new Dp600ChallengeProvider({
  presenter: createQuestionPresenter(modal, { asked: askedThisSession }),
  mastery,
});

/** Timers from D50: tight, but every modal can be paused without penalty. */
const BATTLE_TIME_MS = 20_000;
const RESEARCH_TIME_MS = 30_000;

/**
 * The animation layer.
 *
 * Held here rather than inside a renderer because effects outlive a single
 * frame and must not be owned by something that is allowed to be lazy.
 */
const effects = createEffects();
const banner = createBattleBanner();

/**
 * The Great Library.
 *
 * Reads fresh on every open rather than being kept in sync, because it is a
 * reference screen consulted occasionally, and a snapshot taken at the moment
 * of opening cannot drift from the game the way a cached one would.
 */
const library = createGreatLibrary(() => {
  const now = Date.now();
  const model = buildLibraryModel({
    records: new Map(state.topics.nodes.map((n) => [n.id, mastery.get(n.id)])),
    researched: new Set(state.research.known),
    questions: DP600_QUESTIONS,
    due: new Set(provider.dueTopics(now)),
  });
  return { model, summary: summarise(model), now };
});

/** The free camera's instrument panel. Hidden until the drone has the camera. */
const droneHud = createDroneHud();

/**
 * The end of a game.
 *
 * Starts the next one on the seed in the box, so a player who lost to a
 * particular map can immediately try it again knowing what is coming.
 */
const endScreen = createEndScreen(() => newGame(el.seedInput.value));

/*
 * Keep the drone on the ground while an overlay is up.
 *
 * `flyControls` binds keydown on `window` and only declines to fly when the
 * event came from an input, which is the right rule for a twin whose whole
 * page is the map. Here a question modal or the library can be covering the
 * screen, and W A S D behind them would quietly take off: the camera would be
 * somewhere else by the time the player closed the overlay.
 *
 * Capture phase on `window` runs before the module's own bubble-phase listener,
 * so stopping the event here means the latch never sees it. Only the eight
 * movement keys are swallowed, deliberately: Escape still has to reach the
 * library to close it, and the arrows only look, which needs an engaged drone
 * that these keys are now preventing.
 */
const DRONE_KEYS = new Set(['w', 'a', 's', 'd', 'q', 'e', 'r', 'f']);
window.addEventListener(
  'keydown',
  (e) => {
    if (!modal.isOpen() && !library.isOpen()) return;
    if (DRONE_KEYS.has(e.key.toLowerCase())) e.stopImmediatePropagation();
  },
  { capture: true },
);

/**
 * Battles are choreographed at two lengths.
 *
 * Every fight is preceded by a question, so a long set piece on every single
 * clash would be exhausting by the tenth one. The full treatment is reserved
 * for the moments that deserve it: the player's first battle of a game, and
 * any assault on a city. Everything else gets the short, punchy version.
 */
const DRAMA_MS = 900;
const PUNCH_MS = 260;
let hadFirstBattle = false;
/** Set while the antagonists are marching, so the log says so only once. */
let hordeAdvancing = false;
/** Set when the game has an outcome, so no further turns can be played. */
let finished = false;

const canvas = document.querySelector<HTMLCanvasElement>('#map')!;
const fxCanvas = document.querySelector<HTMLCanvasElement>('#fx')!;
const ctx = fxCanvas.getContext('2d')!;

/**
 * Quality is chosen once, from what the GPU reports.
 *
 * Ambient occlusion and a 4k shadow map are the two passes that turn a
 * smooth game into a slideshow on integrated graphics, and a player on a
 * laptop should get a game that runs rather than a game that is correct.
 */
function detectQuality(): typeof HIGH_QUALITY {
  const probe = document.createElement('canvas').getContext('webgl2');
  const debugInfo = probe?.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? String(probe?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '')
    : '';
  const weak = /(Intel|Iris|UHD|HD Graphics|SwiftShader|llvmpipe|Software)/i.test(renderer);
  return weak ? LOW_QUALITY : HIGH_QUALITY;
}

const scene = createScene3D(canvas, detectQuality());

const el = {
  turn: document.querySelector<HTMLElement>('#turn-badge')!,
  compute: document.querySelector<HTMLElement>('#res-compute')!,
  cu: document.querySelector<HTMLElement>('#res-cu')!,
  trust: document.querySelector<HTMLElement>('#res-trust')!,
  endTurn: document.querySelector<HTMLButtonElement>('#end-turn')!,
  openLibrary: document.querySelector<HTMLButtonElement>('#open-library')!,
  seedInput: document.querySelector<HTMLInputElement>('#seed-input')!,
  seedGo: document.querySelector<HTMLButtonElement>('#seed-go')!,
  tileName: document.querySelector<HTMLElement>('#tile-name')!,
  tileDetail: document.querySelector<HTMLElement>('#tile-detail')!,
  selTitle: document.querySelector<HTMLElement>('#sel-title')!,
  selDetail: document.querySelector<HTMLElement>('#sel-detail')!,
  actFound: document.querySelector<HTMLButtonElement>('#act-found')!,
  actFortify: document.querySelector<HTMLButtonElement>('#act-fortify')!,
  actSkip: document.querySelector<HTMLButtonElement>('#act-skip')!,
  actCouncil: document.querySelector<HTMLButtonElement>('#act-council')!,
  log: document.querySelector<HTMLElement>('#log')!,
  resTitle: document.querySelector<HTMLElement>('#res-title')!,
  resBar: document.querySelector<HTMLElement>('#res-bar')!,
  resStatus: document.querySelector<HTMLElement>('#res-status')!,
  resOptions: document.querySelector<HTMLElement>('#res-options')!,
  cities: document.querySelector<HTMLElement>('#cities')!,
  citiesList: document.querySelector<HTMLElement>('#cities-list')!,
};

let state: GameState = createGameState('FABRIC', { topics: provider.topics() });
/** Where the empire is kept between visits. See `persist.ts`. */
const slot = localSlot();
let selectedUnitId: string | undefined;
let reach: ReadonlyMap<string, ReachableTile> | undefined;
let attackTargets: Set<string> | undefined;
let hover: Hex | undefined;
let dirty = true;

function log(message: string, tone: 'good' | 'bad' | 'plain' = 'plain'): void {
  const entry = document.createElement('div');
  entry.className = `entry${tone === 'plain' ? ' muted' : ` ${tone}`}`;
  entry.textContent = message;
  el.log.append(entry);
  while (el.log.childElementCount > 40) el.log.firstElementChild?.remove();
  el.log.scrollTop = el.log.scrollHeight;
}

// Selection ------------------------------------------------------------

/**
 * Recompute what the selected unit can do.
 *
 * Both overlays come straight from the engine rules, so what is painted is
 * exactly what the engine will permit. A UI that computes its own idea of
 * "reachable" eventually disagrees with the rules, and the player is the one
 * who finds out.
 */
function refreshSelection(): void {
  reach = undefined;
  attackTargets = undefined;

  const unit = selectedUnitId ? state.units.get(selectedUnitId) : undefined;
  if (!unit || unit.factionId !== state.activeFactionId) {
    selectedUnitId = undefined;
    el.selTitle.textContent = 'Nothing selected';
    el.selDetail.textContent = 'Click one of your units.';
    el.actFound.disabled = true;
    el.actFortify.disabled = true;
    el.actSkip.disabled = true;
    refreshCouncil();
    return;
  }

  const type = unitType(unit.typeId);
  reach = reachable(state, unit);

  const targets = new Set<string>();
  for (const tile of state.map.tiles.values()) {
    if (canAttack(state, unit.id, tile.hex).ok) targets.add(hexKey(tile.hex));
  }
  attackTargets = targets;

  el.selTitle.textContent = type.label;
  el.selDetail.textContent =
    `${unit.hp}/${type.maxHp} HP  ` +
    `${unit.movesLeft}/${type.movement} moves  ` +
    `strength ${type.strength}` +
    (unit.fortified ? '  (fortified)' : '');

  el.actFound.disabled = !canFoundCity(state, unit);
  el.actFortify.disabled = type.strength === 0 || unit.fortified;
  el.actSkip.disabled = unit.movesLeft <= 0;
  refreshCouncil();
}

function select(unitId: string | undefined): void {
  selectedUnitId = unitId;
  refreshSelection();
  dirty = true;
}

/** Jump to the next unit still awaiting orders, the way a 4X should. */
function selectNextIdle(): void {
  const idle = unitsOf(state, PLAYER_FACTION_ID).filter(
    (u) => u.movesLeft > 0 && !u.fortified,
  );
  if (idle.length === 0) {
    select(undefined);
    return;
  }
  const currentIndex = idle.findIndex((u) => u.id === selectedUnitId);
  const next = idle[(currentIndex + 1) % idle.length]!;
  select(next.id);
  scene.focus(next.hex);
}

// Actions --------------------------------------------------------------

/**
 * Whether the player is what is standing on this tile.
 *
 * Used to decide if an incoming raid is the player's problem. With one
 * antagonist every raid is, but the moment a second faction exists they will
 * fight each other too, and the player should not be asked to defend a
 * skirmish they are not in.
 */
function defends(hex: Hex): boolean {
  const unit = unitAt(state, hex);
  if (unit) return unit.factionId === PLAYER_FACTION_ID;
  return cityAt(state, hex)?.factionId === PLAYER_FACTION_ID;
}

/**
 * Which topic a battle against this faction asks about.
 *
 * Each antagonist is bound to a cluster of the outline, so who is attacking
 * tells the player what they are about to be tested on. That is the whole
 * design: the opposition is a study planner wearing a helmet.
 *
 * ⚠️ **Drawn from the seed, not from `Math.random`.** It used to be random,
 * which meant two players sharing a seed (D39) fought identical battles and
 * were asked different questions, and replaying your own game asked different
 * questions too. Keying the stream on the turn and the faction keeps a given
 * battle's question fixed while still varying it from fight to fight.
 */
function battleTopicFor(defenderFactionId: string): string | undefined {
  const cluster = state.factions.get(defenderFactionId)?.topicCluster;
  if (!cluster) return undefined;
  const inCluster = state.topics.nodes.filter((n) => n.cluster === cluster);
  if (inCluster.length === 0) return undefined;
  // Prefer something already researched, so a battle revises rather than
  // testing material the player has not reached yet.
  const known = inCluster.filter((n) => state.research.known.includes(n.id));
  const pool = known.length > 0 ? known : inCluster;
  const rng = createRng(state.seed, `battle:${state.turn}:${defenderFactionId}`);
  return pool[rng.int(0, pool.length - 1)]!.id;
}

async function actOn(target: Hex): Promise<void> {
  if (modal.isOpen()) return;

  const own = selectableUnitAt(state, target);
  if (own) {
    select(own.id);
    return;
  }

  if (!selectedUnitId) return;
  const unit = state.units.get(selectedUnitId);
  if (!unit) return;

  // Attack takes priority: clicking an enemy means fighting it, not walking
  // into the tile it occupies.
  if (canAttack(state, unit.id, target).ok) {
    const defender = unitAt(state, target) ?? cityAt(state, target);
    const topicId = defender ? battleTopicFor(defender.factionId) : undefined;

    let challengeScore = 0;
    if (topicId) {
      const outcome = await provider.present({
        kind: 'battle',
        topicId,
        tier: 2,
        timeLimitMs: BATTLE_TIME_MS,
      });
      challengeScore = outcome.score;
    }

    // The state can only have changed if something else ran while the modal
    // was open, but re-checking is cheap and a stale attack is a real bug.
    if (!canAttack(state, unit.id, target).ok) return;

    const preview = previewAttack(state, unit.id, target, { challengeScore });
    const targetCity = cityAt(state, target);
    const dramatic = !hadFirstBattle || targetCity !== undefined;
    hadFirstBattle = true;

    await playAttack(unit.id, target, challengeScore, preview, dramatic);
    return;
  }

  const from = unit.hex;
  const moved = moveUnit(state, unit.id, target);
  if (!moved.ok) {
    log(moved.reason, 'bad');
    return;
  }
  state = moved.state;
  const landed = state.units.get(unit.id);
  if (landed && (landed.hex.q !== from.q || landed.hex.r !== from.r)) {
    void effects.travel(unit.id, from, landed.hex);
  }
  refreshSelection();
  dirty = true;
}

/**
 * Run a battle as an animation rather than as a state change.
 *
 * The engine resolves the fight instantly; the point of this function is that
 * the player sees the strike, the damage and the consequence in that order.
 * Damage is applied at the moment of impact, not before, because a health bar
 * that empties while the attacker is still winding up reads as a bug.
 */
async function playAttack(
  unitId: string,
  target: Hex,
  challengeScore: number,
  preview: ReturnType<typeof previewAttack>,
  dramatic: boolean,
): Promise<void> {
  const attacker = state.units.get(unitId);
  if (!attacker) return;

  const ranged = preview?.ranged ?? !isAdjacent(attacker.hex, target);
  const defenderUnit = unitAt(state, target);
  const defenderCity = cityAt(state, target);
  const defenderColour =
    state.factions.get((defenderUnit ?? defenderCity)?.factionId ?? '')?.colour ?? '#b5533f';
  const attackerColour = state.factions.get(attacker.factionId)?.colour ?? '#4a9fe0';

  const hpBefore = {
    attacker: attacker.hp,
    defender: defenderUnit?.hp ?? defenderCity?.hp ?? 0,
  };

  // The engine has already decided the result; resolving it here and handing
  // the numbers to the choreography means the animation can be as long or as
  // short as it likes without the rules caring. The state change is held back
  // until the moment of impact so a health bar never empties during a wind-up.
  const outcome = resolveAttack(state, unitId, target, { challengeScore });
  if (!outcome.ok) {
    log(outcome.reason, 'bad');
    return;
  }
  const nextState = outcome.result.state;
  const { log: battle } = outcome.result;

  await playDuel(
    scene,
    {
      attackerId: unitId,
      attackerHex: attacker.hex,
      attackerColour,
      defenderId: defenderUnit?.id,
      defenderHex: target,
      defenderColour,
    },
    {
      damageToDefender: battle.damageToDefender,
      damageToAttacker: battle.damageToAttacker,
      defenderDestroyed: battle.defenderDestroyed,
      attackerDestroyed: battle.attackerDestroyed,
      ranged,
      dramatic,
    },
    {
      onImpact: () => {
        state = nextState;
        dirty = true;

        // Damage numbers stay on the 2D layer: text is crisper drawn flat
        // than projected, and it needs to stay legible at every distance.
        if (battle.damageToDefender > 0) {
          effects.floatingText(
            target,
            `-${battle.damageToDefender}`,
            '#ffcf7a',
            dramatic ? 1.4 : 1.1,
          );
        }
        if (battle.damageToAttacker > 0) {
          effects.floatingText(
            attacker.hex,
            `-${battle.damageToAttacker}`,
            '#ff9b91',
            dramatic ? 1.2 : 1,
          );
        }
        if (battle.cityCaptured) {
          effects.floatingText(target, 'CAPTURED', '#8fd694', 1.5);
        }
      },
      shake: (magnitude) => effects.shake(magnitude),
    },
  );

  // Belt and braces: if the impact hook somehow did not run, the result must
  // still be applied. A silently skipped state change would be a real bug.
  if (state !== nextState) {
    state = nextState;
    dirty = true;
  }

  if (preview) {
    // The engine reports the answer's contribution separately, which is the
    // whole reason the banner can show it as its own bar segment instead of
    // quietly folding it into a total the player has to take on trust.
    const attackerType = unitType(attacker.typeId);
    const attackerSide: BattleSide = {
      label: attackerType.label,
      colour: attackerColour,
      base: preview.attacker.effective - preview.attacker.challengeModifier,
      modifier: preview.attacker.challengeModifier,
      effective: preview.attacker.effective,
      hpBefore: hpBefore.attacker,
      hpAfter: state.units.get(unitId)?.hp ?? 0,
      maxHp: attackerType.maxHp,
    };
    const defenderLabel = defenderCity
      ? defenderCity.name
      : defenderUnit
        ? unitType(defenderUnit.typeId).label
        : 'Defender';
    const defenderSide: BattleSide = {
      label: defenderLabel,
      colour: defenderColour,
      base: preview.defender.effective - preview.defender.challengeModifier,
      modifier: preview.defender.challengeModifier,
      effective: preview.defender.effective,
      hpBefore: hpBefore.defender,
      hpAfter: Math.max(0, hpBefore.defender - battle.damageToDefender),
      maxHp: Math.max(1, hpBefore.defender),
    };
    banner.show({
      attacker: attackerSide,
      defender: defenderSide,
      damageToDefender: battle.damageToDefender,
      damageToAttacker: battle.damageToAttacker,
      defenderDestroyed: battle.defenderDestroyed,
      attackerDestroyed: battle.attackerDestroyed,
      cityCaptured: battle.cityCaptured,
      ranged,
    });
  }

  if (challengeScore > 0) {
    log('Your answer strengthened the attack.', 'good');
  } else if (challengeScore < 0) {
    log('Your answer weakened the attack.', 'bad');
  }
  const odds = preview
    ? ` (${Math.round(preview.attacker.effective)} vs ${Math.round(preview.defender.effective)})`
    : '';
  log(
    `Attack${odds}: dealt ${battle.damageToDefender}, took ${battle.damageToAttacker}`,
    battle.damageToDefender >= battle.damageToAttacker ? 'good' : 'bad',
  );
  if (battle.defenderDestroyed) log('Enemy unit destroyed.', 'good');
  if (battle.attackerDestroyed) log('Your unit was destroyed.', 'bad');
  if (battle.cityCaptured) log('City captured.', 'good');

  refreshCorruption();
  refreshCities();
  refreshSelection();
  dirty = true;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isAdjacent(a: Hex, b: Hex): boolean {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2 === 1;
}

function doFound(): void {
  if (!selectedUnitId) return;
  const result = foundCity(state, selectedUnitId);
  if (!result.ok) {
    log(result.reason, 'bad');
    return;
  }
  state = result.state;
  const city = [...state.cities.values()].at(-1);
  log(`Founded ${city?.name ?? 'a city'}.`, 'good');
  if (city) {
    effects.pulse(city.hex, '#8fd694', 3);
    effects.floatingText(city.hex, city.name, '#cfe6ff', 1.2);
  }
  refreshCorruption();
  refreshCities();
  select(undefined);
}

function doFortify(): void {
  if (!selectedUnitId) return;
  const result = fortifyUnit(state, selectedUnitId);
  if (!result.ok) {
    log(result.reason, 'bad');
    return;
  }
  state = result.state;
  refreshSelection();
  dirty = true;
}

function doSkip(): void {
  if (!selectedUnitId) return;
  const result = skipUnit(state, selectedUnitId);
  if (!result.ok) return;
  state = result.state;
  selectNextIdle();
}

/**
 * Refresh the council button.
 *
 * Cheap enough to call on every state change: the due list is a filter over a
 * handful of records and the opportunity list a filter over the cities.
 */
function pendingReviews(): ReturnType<typeof reviewOpportunities> {
  return reviewOpportunities(state, provider.dueTopics(Date.now()));
}

function refreshCouncil(): void {
  const available = pendingReviews();
  el.actCouncil.disabled = available.length === 0;
  el.actCouncil.textContent =
    available.length > 1 ? `Council (${available.length})` : 'Council';
}

/**
 * Hold a council review.
 *
 * The whole learning loop in one action: a topic the player learned a while
 * ago has fallen due, the city that holds it asks about it again, and getting
 * it right pays. Retrieval practice with a reason to want it.
 */
async function doCouncil(): Promise<void> {
  if (modal.isOpen()) return;
  const available = pendingReviews();
  const next = available[0];
  if (!next) return;

  const city = state.cities.get(next.cityId);
  if (city) scene.focus(city.hex);

  const outcome = await provider.present({
    kind: 'unrest',
    topicId: next.topicId,
    tier: 2,
    timeLimitMs: RESEARCH_TIME_MS,
  });

  const result = resolveReview(state, next.cityId, next.topicId, outcome.score);
  if (!result.ok) {
    log(result.reason, 'bad');
    return;
  }
  state = result.state;

  const node = topicById(state.topics, next.topicId);
  const label = node?.label ?? next.topicId;
  if (outcome.score >= 0) {
    log(`${next.cityName} recalled ${label}. +${result.trustGained} Trust.`, 'good');
  } else {
    log(`${next.cityName} could not recall ${label}. It will come round again.`, 'bad');
  }

  refreshSelection();
  refreshHud();
  dirty = true;
}

/**
 * End the turn, defending yourself if anyone is coming.
 *
 * ⚠️ **The turn is played twice, and that is the design, not an accident.**
 * `endTurn` is a pure function, so running it once on a throwaway copy costs
 * nothing but the work and answers the one question that has to be answered
 * *before* the fight: is anybody about to raid me, and who. Only then can the
 * player be asked the question that decides how well they hold.
 *
 * The alternative was to make the engine's AI loop async so it could stop and
 * ask mid-turn. That would have put a promise, and therefore the app, inside
 * the rules (D35), to buy a look-ahead that a pure function already gives away
 * for free.
 *
 * The two runs agree on whether a raid happens, because nothing about the
 * decision to attack depends on the defender's answer. They disagree on the
 * damage, which is exactly the point.
 */
async function doEndTurn(): Promise<void> {
  // A finished game has nothing left to resolve. The button is disabled too,
  // but the keyboard and the debug hook both reach this directly.
  if (finished) return;
  const dueTopics = provider.dueTopics(Date.now());

  const preview = endTurn(state, { dueTopics });
  const incoming = preview.report.enemyEvents.find(
    (e) => e.intent.kind === 'raid' && defends(e.intent.target),
  );

  let defenderChallengeScore = 0;
  if (incoming) {
    const who = state.factions.get(incoming.factionId)?.label ?? 'The enemy';
    const topicId = battleTopicFor(incoming.factionId);
    if (topicId) {
      log(`${who} is at your gates. Hold them.`, 'bad');
      const outcome = await provider.present({
        kind: 'battle',
        topicId,
        tier: 2,
        timeLimitMs: BATTLE_TIME_MS,
      });
      defenderChallengeScore = outcome.score;
    }
  }

  const result = endTurn(state, { dueTopics, defenderChallengeScore });
  state = result.state;
  const { report } = result;
  const gains: string[] = [];
  if (report.treasuryGained.compute) gains.push(`+${report.treasuryGained.compute} Compute`);
  if (report.treasuryGained.cu) gains.push(`${report.treasuryGained.cu >= 0 ? '+' : ''}${report.treasuryGained.cu} CU`);
  if (report.treasuryGained.trust) gains.push(`+${report.treasuryGained.trust} Trust`);

  log(`Turn ${report.turn} ended. ${gains.join('  ') || 'No income yet.'}`);
  for (const cityId of report.grownCities) {
    log(`${state.cities.get(cityId)?.name ?? 'A city'} grew.`, 'good');
  }
  if (report.bankrupt) log('Upkeep could not be paid in full.', 'bad');

  if (report.researchSpent > 0) {
    log(`${report.researchSpent} Compute into research.`);
  }
  for (const made of report.unitsBuilt) {
    const label = unitType(made.typeId).label;
    log(
      `${state.cities.get(made.cityId)?.name ?? 'A city'} mustered ${article(label)} ${label}.`,
      'good',
    );
  }
  for (const cityId of report.citiesBlocked) {
    log(
      `${state.cities.get(cityId)?.name ?? 'A city'} finished a unit but has nowhere to put it.`,
      'bad',
    );
  }
  if (report.researchReadyTopicId) {
    void resolveResearch(report.researchReadyTopicId);
  }

  // Reviews are reported as an opportunity, never as a demand (D49). Ignoring
  // them costs the bonus and, eventually, a little yield; nothing is lost and
  // nothing accrues while the player is away.
  for (const cityId of report.citiesUnsettled) {
    log(`${state.cities.get(cityId)?.name ?? 'A city'} is restless without its council.`, 'bad');
  }
  if (report.reviewsAvailable.length > 0) {
    const first = report.reviewsAvailable[0]!;
    const extra = report.reviewsAvailable.length - 1;
    log(
      `${first.cityName} can hold a council${extra > 0 ? ` (and ${extra} more)` : ''}.`,
      'good',
    );
  }

  refreshSelection();
  refreshResearch();
  refreshCorruption();
  refreshCities();
  dirty = true;

  const presentedEnemyTurn = presentEnemyTurn(report.enemyEvents, defenderChallengeScore);
  void presentedEnemyTurn;
  /*
   * The autosave point.
   *
   * End of turn rather than after every action, for two reasons. It is the
   * only moment the game state is unambiguously between things, with no unit
   * half-moved and no question waiting for an answer. And it is the natural
   * unit of loss: the worst a crash can cost is the turn being played, which
   * is what a player would expect to redo anyway.
   */
  saveGame(slot, state);

  /*
   * The ending, if this turn was one.
   *
   * The raids above are presented unawaited so an ordinary turn hands control
   * straight back. A finishing turn is different: the overlay must not cover
   * the blow that caused it, so here we wait for the presentation to run out
   * before putting anything on top of the map.
   */
  if (!report.outcome) return;
  finished = true;
  el.endTurn.disabled = true;
  await presentedEnemyTurn;
  endScreen.show(report.outcome, {
    turn: report.turn,
    skills: `${state.research.known.length}/${state.topics.nodes.length}`,
    cities: [...state.cities.values()].filter((c) => c.factionId === PLAYER_FACTION_ID).length,
  });
}

/**
 * Show what the antagonists did.
 *
 * ⚠️ The engine has already applied all of this, which is why raids get the
 * camera, a shake and floating damage rather than the full duel the player's
 * own attacks get: choreographing a fight needs the result held back until the
 * moment of impact, and by the time this runs the loser is already gone from
 * the state. Pretending otherwise would mean animating a unit that no longer
 * exists.
 *
 * What matters is that the player is never quietly attacked. Something has to
 * move the camera to the place they just lost health, or the first they will
 * know of it is a missing unit.
 */
async function presentEnemyTurn(
  events: readonly AiEvent[],
  defenceScore = 0,
): Promise<void> {
  if (events.length === 0) return;

  const raids = events.filter((e) => e.intent.kind === 'raid');
  const movers = new Set(events.filter((e) => e.intent.kind === 'move').map((e) => e.unitId));
  const faction = (id: string) => state.factions.get(id)?.label ?? 'Something';

  if (movers.size > 0 && raids.length === 0) {
    /*
     * Once per advance, not once per turn.
     *
     * The horde takes several turns to cross the map, and saying so on every
     * one of them filled the log with four identical lines before anything
     * happened. Repetition is how a log teaches the player to stop reading it.
     */
    if (!hordeAdvancing) {
      hordeAdvancing = true;
      log(`${faction(events[0]!.factionId)} is on the move.`);
    }
  } else if (raids.length > 0) {
    // They have arrived, so the next quiet spell is a new advance.
    hordeAdvancing = false;
  }

  for (const event of raids) {
    if (event.intent.kind !== 'raid') continue;
    const battle = event.log;
    const target = event.intent.target;
    const who = faction(event.factionId);

    scene.focus(target);
    effects.shake(battle?.defenderDestroyed ? 1.4 : 0.9);
    if (battle && battle.damageToDefender > 0) {
      effects.floatingText(target, `-${battle.damageToDefender}`, '#ff9b91', 1.3);
    }

    if (battle?.cityCaptured) {
      log(`${who} has taken one of your cities.`, 'bad');
    } else if (battle?.defenderDestroyed) {
      log(`${who} destroyed one of your units.`, 'bad');
    } else if (battle?.attackerDestroyed) {
      log(`You held. A raider from ${who} was destroyed.`, 'good');
    } else {
      log(`${who} raided you for ${battle?.damageToDefender ?? 0}.`, 'bad');
    }

    // Say what the answer bought, once, on the first raid of the turn. The
    // player should be able to connect knowing the material to taking less
    // damage, and that connection is invisible if it is never stated.
    if (event === raids[0] && defenceScore !== 0) {
      log(
        defenceScore > 0
          ? 'Your defenders knew the ground. The blow was softened.'
          : 'Your defenders were unsure, and it cost you.',
        defenceScore > 0 ? 'good' : 'bad',
      );
    }

    dirty = true;
    // A beat between raids, so three of them in one turn read as three
    // events rather than one flicker.
    await new Promise((resolve) => window.setTimeout(resolve, 650));
  }
}
// Presentation ---------------------------------------------------------

function refreshResearch(): void {
  const current = state.research.current;
  const node = current ? topicById(state.topics, current) : undefined;

  if (node) {
    const cost = researchCost(node);
    const pct = Math.min(100, Math.round((state.research.progress / cost) * 100));
    el.resTitle.textContent = node.label;
    el.resBar.style.width = `${pct}%`;
    el.resStatus.textContent = `${node.cluster}  ${state.research.progress}/${cost} Compute`;
  } else {
    el.resTitle.textContent = 'Researching nothing';
    el.resBar.style.width = '0%';
    el.resStatus.textContent = `${state.research.known.length}/${state.topics.nodes.length} known  (${Math.round(researchProgress(state) * 100)}%)`;
  }

  el.resOptions.replaceChildren();
  for (const option of researchable(state)) {
    if (option.id === current) continue;
    const button = document.createElement('button');
    button.innerHTML =
      `<span class="cluster">${option.cluster} &middot; ${researchCost(option)} Compute</span><br>${option.label}`;
    button.addEventListener('click', () => {
      const result = startResearch(state, option.id);
      if (!result.ok) {
        log(result.reason, 'bad');
        return;
      }
      state = result.state;
      log(`Researching: ${option.label}`);
      refreshResearch();
    });
    el.resOptions.append(button);
  }
}

/**
 * Resolve a funded topic.
 *
 * The engine reports a topic as ready and stops; presenting the challenge is
 * the app's job, and the score is all that goes back across the boundary.
 */
async function resolveResearch(topicId: string): Promise<void> {
  const node = topicById(state.topics, topicId);
  const outcome = await provider.present({
    kind: 'research',
    topicId,
    tier: 1,
    timeLimitMs: RESEARCH_TIME_MS,
  });

  const done = completeResearch(state, outcome.score);
  if (!done.ok) return;
  state = done.state;

  if (outcome.score >= 0) {
    log(`Learned: ${node?.label ?? topicId}`, 'good');
  } else {
    log(`${node?.label ?? topicId} not yet mastered. Try again next turn.`, 'bad');
  }
  refreshResearch();
  dirty = true;
}

function describeTile(h: Hex | undefined): void {
  if (!h) {
    el.tileName.textContent = 'Hover a tile';
    el.tileDetail.innerHTML = '&nbsp;';
    return;
  }
  const tile = state.map.tiles.get(hexKey(h));
  if (!tile) {
    el.tileName.textContent = 'Beyond the map';
    el.tileDetail.innerHTML = '&nbsp;';
    return;
  }

  const info = terrain(tile.terrain);
  const y = tileYields(tile.terrain, tile.river);
  const parts: string[] = [];
  if (y.data) parts.push(`Data ${y.data}`);
  if (y.compute) parts.push(`Compute ${y.compute}`);
  if (y.cu) parts.push(`CU ${y.cu}`);
  if (y.trust) parts.push(`Trust ${y.trust}`);

  const occupant = unitAt(state, h);
  const city = cityAt(state, h);
  const who = city
    ? ` | ${city.name} (${state.factions.get(city.factionId)?.label ?? '?'})`
    : occupant
      ? ` | ${unitType(occupant.typeId).label} (${state.factions.get(occupant.factionId)?.label ?? '?'})`
      : '';

  el.tileName.textContent = info.label + (tile.river ? ' (river)' : '') + who;
  el.tileDetail.textContent = parts.length > 0 ? parts.join('  ') : 'No yield';
}

/**
 * The cities panel: what each city is, and what it is building.
 *
 * Rebuilt wholesale on every refresh. There are rarely more than a handful of
 * cities and each row is a few nodes, so the simplest correct thing is also
 * fast enough, and a diffing scheme here would be an invitation to leave a
 * stale progress bar on screen.
 */
function refreshCities(): void {
  const mine = [...state.cities.values()].filter((c) => c.factionId === PLAYER_FACTION_ID);
  el.cities.hidden = mine.length === 0;
  if (mine.length === 0) return;

  const buildable = buildableUnits(state);
  el.citiesList.replaceChildren();

  for (const city of mine) {
    const row = document.createElement('div');
    row.className = 'city';

    const head = document.createElement('div');
    head.className = 'city-head';
    const name = document.createElement('b');
    name.textContent = city.name;
    const meta = document.createElement('span');
    meta.textContent = `pop ${city.population}${city.unrest > 0 ? ` · unrest ${city.unrest}` : ''}`;
    head.append(name, meta);
    row.append(head);

    if (city.producing) {
      const type = unitType(city.producing);
      const cost = unitCost(type);
      const bar = document.createElement('div');
      bar.className = 'bar';
      const fill = document.createElement('div');
      fill.style.width = `${Math.min(100, (city.productionProgress / cost) * 100)}%`;
      bar.append(fill);

      const status = document.createElement('div');
      status.className = 'status';
      const left = Math.max(0, cost - city.productionProgress);
      const turns = Math.ceil(left / PRODUCTION_CAP_PER_TURN);
      status.textContent = `${type.label}: ${city.productionProgress}/${cost} Compute${
        left > 0 ? ` · ${turns} turn${turns === 1 ? '' : 's'}` : ' · ready'
      }`;
      row.append(bar, status);
    }

    const build = document.createElement('div');
    build.className = 'build';

    const picker = document.createElement('select');
    const none = document.createElement('option');
    none.value = '';
    none.textContent = city.producing ? 'Stop building' : 'Build nothing';
    picker.append(none);
    for (const id of buildable) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${unitType(id).label} (${unitCost(unitType(id))})`;
      option.selected = city.producing === id;
      picker.append(option);
    }
    picker.addEventListener('change', () => {
      const chosen = picker.value;
      const result = chosen
        ? setProduction(state, city.id, chosen as UnitTypeId)
        : cancelProduction(state, city.id);
      if (!result.ok) {
        log(result.reason, 'bad');
        refreshCities();
        return;
      }
      state = result.state;
      log(chosen ? `${city.name} begins ${unitType(chosen as UnitTypeId).label}.` : `${city.name} downs tools.`);
      refreshCities();
      dirty = true;
    });

    build.append(picker);
    row.append(build);
    el.citiesList.append(row);
  }
}

/**
 * "a Profiler", but "an Engineer" and "an RLS Sentinel".
 *
 * The vowel test alone gets Architect and Engineer right and RLS Sentinel
 * wrong, because the article follows how a name is *said* and an initialism
 * starting with R is said "ar". There is exactly one of those in the unit
 * table, so the rule is a vowel check plus the letters whose names begin with
 * a vowel sound.
 */
function article(label: string): string {
  const first = label[0] ?? '';
  const initialism = /^[A-Z]{2,}\b/.test(label);
  const spoken = initialism ? 'AEFHILMNORSX' : 'AEIOU';
  return spoken.includes(first) ? 'an' : 'a';
}

function refreshHud(): void {
  const resources = state.factions.get(PLAYER_FACTION_ID)!.resources;
  el.turn.textContent = `Turn ${state.turn}`;
  el.compute.textContent = String(resources.compute);
  el.cu.textContent = String(resources.cu);
  el.trust.textContent = String(resources.trust);
}

function viewportSize(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

function fitCanvas(): void {
  const { width, height } = viewportSize();
  const dpr = window.devicePixelRatio || 1;
  fxCanvas.width = Math.round(width * dpr);
  fxCanvas.height = Math.round(height * dpr);
  fxCanvas.style.width = `${width}px`;
  fxCanvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scene.setSize(width, height);
  dirty = true;
}

function newGame(rawSeed: string): void {
  const seed = normaliseSeed(rawSeed);
  adopt(createGameState(seed, { topics: provider.topics() }), `New empire on seed ${seed}.`);
  // Write immediately rather than waiting for the first turn to end, so a
  // player who starts a game and closes the tab comes back to that game and
  // not to the one before it.
  saveGame(slot, state);
}

/**
 * Take a game state, from wherever, and make it the one on screen.
 *
 * Shared by starting a new empire and by resuming a saved one, because the
 * only difference between the two is where the state came from and what the
 * log says about it. Keeping them apart is how one of the two ends up missing
 * a step, and the missing step is always the one that leaves a stale unit
 * pose or a stale overlay behind.
 */
function adopt(next: GameState, message: string): void {
  state = next;
  // A resumed game gets one dramatic battle too. The flag marks the first
  // fight of a *session*, and there is no way to know from a save whether the
  // player already had theirs.
  hadFirstBattle = false;
  hordeAdvancing = false;
  finished = false;
  el.endTurn.disabled = false;
  endScreen.hide();
  banner.hide();
  // A duel interrupted by a new game would otherwise leave its pose behind,
  // and a pose keeps a wreck alive on screen for as long as it exists.
  scene.fx.clearAllPoses();
  el.seedInput.value = state.seed;
  el.log.replaceChildren();
  log(message);

  const first = unitsOf(state, PLAYER_FACTION_ID).find((u) => u.typeId === 'architect');
  scene.loadMap(state.map);
  if (first) {
    scene.focus(first.hex, true);
    select(first.id);
  } else {
    select(undefined);
  }
  refreshHud();
  refreshResearch();
  refreshCorruption();
  refreshCities();
  dirty = true;
}

/**
 * Resume the stored empire, or start a fresh one.
 *
 * An unreadable save says so in the log instead of failing silently. The
 * player cannot do anything about it, but "could not be read" and "you never
 * had a game" are different facts and only one of them is alarming.
 */
function boot(): void {
  const loaded = loadGame(slot, provider.topics());
  if (loaded.ok) {
    adopt(loaded.state, `Resumed on seed ${loaded.state.seed}, turn ${loaded.state.turn}.`);
    return;
  }
  newGame('FABRIC');
  if (loaded.reason === 'unreadable') {
    log('A saved game was found but could not be read, so this is a new one.', 'bad');
  }
}

// Input ----------------------------------------------------------------
//
// Orbiting, panning and zooming all belong to the camera controller. What is
// left here is deciding whether a left-button gesture was a click on a hex or
// a drag of the world, which the controller cannot know.

let pressed = false;
let dragMoved = 0;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  pressed = true;
  dragMoved = 0;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.classList.add('dragging');
});

canvas.addEventListener('pointermove', (e) => {
  if (pressed) {
    dragMoved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
  }

  const next = scene.hexAt(e.clientX, e.clientY);
  const changed =
    (next === undefined) !== (hover === undefined) ||
    (next && hover && (next.q !== hover.q || next.r !== hover.r));
  if (changed) {
    hover = next;
    describeTile(hover);
    dirty = true;
  }
});

function endDrag(e: PointerEvent): void {
  if (!pressed) return;
  pressed = false;
  canvas.classList.remove('dragging');
  // A few pixels of slack: a mouse always moves a little during a click.
  if (dragMoved < 5) {
    const target = scene.hexAt(e.clientX, e.clientY);
    if (target) void actOn(target);
  }
}

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement | null;
  if (target?.tagName === 'INPUT') return;
  // While a question is on screen the modal owns the keyboard.
  if (modal.isOpen()) return;

  // The library is a reference screen, so it may be opened at any time, but
  // while it is up the map must not act on stray keys behind it.
  if (e.key === 'l') {
    e.preventDefault();
    library.toggle();
    return;
  }
  if (library.isOpen()) return;

  if (e.key === ' ') {
    e.preventDefault();
    void doEndTurn();
  } else if (e.key === 'n' || e.key === 'Tab') {
    e.preventDefault();
    selectNextIdle();
  } else if (e.key === 'b') {
    doFound();
  } else if (e.key === 'h') {
    doFortify();
  } else if (e.key === 'x') {
    doSkip();
  } else if (e.key === 'c') {
    void doCouncil();
  } else if (e.key === 'g') {
    gridVisible = !gridVisible;
    scene.setGridVisible(gridVisible);
    log(gridVisible ? 'Hex grid shown.' : 'Hex grid hidden.');
  }
});

window.addEventListener('resize', fitCanvas);
el.endTurn.addEventListener('click', doEndTurn);
el.openLibrary.addEventListener('click', () => library.toggle());
el.actFound.addEventListener('click', doFound);
el.actFortify.addEventListener('click', doFortify);
el.actSkip.addEventListener('click', doSkip);
el.actCouncil.addEventListener('click', () => void doCouncil());
el.seedGo.addEventListener('click', () => newGame(el.seedInput.value));
el.seedInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') newGame(el.seedInput.value);
});

// Render loop ----------------------------------------------------------

let frameMs = 0;
let gridVisible = true;
let lastFrameAt = performance.now();

/**
 * Tiles the Silo Horde holds.
 *
 * Recomputed only when the state changes, not per frame: territory is a
 * derived map over every city and its work radius, and it is stable between
 * turns.
 */
let corrupted: ReadonlySet<string> = new Set();

function refreshCorruption(): void {
  const next = new Set<string>();
  const territory = cityTerritory(state);
  for (const [key, cityId] of territory) {
    const city = state.cities.get(cityId);
    // Any antagonist's ground is corrupted, not just the Silo Horde's. This
    // checked one hard-coded faction id and would have silently ignored the
    // other six the moment they took a city.
    if (city && city.factionId !== PLAYER_FACTION_ID) next.add(key);
  }
  corrupted = next;
}

/**
 * How the 2D effects layer finds a hex on screen.
 *
 * The scale is measured rather than assumed: it is the on-screen distance
 * between a hex centre and a point one hex radius away, which is the only
 * honest answer under perspective, where two hexes at different depths are
 * different sizes.
 */
const projection = {
  project(hex: Hex) {
    const point = scene.groundAt(hex);
    return scene.project(point);
  },
  scaleAt(hex: Hex) {
    const centre = scene.groundAt(hex);
    const edge = centre.clone();
    edge.x += HEX_RADIUS;
    const a = scene.project(centre);
    const b = scene.project(edge);
    return Math.max(6, Math.hypot(b.x - a.x, b.y - a.y) * (BASE_HEX_SIZE / 48));
  },
};

/**
 * World-space offset for a unit that is mid-animation.
 *
 * The effects system works in the 2D layout the old renderer used, so the
 * offset comes back in those pixels and is converted here. Keeping the
 * conversion in one place means the animation code never has to know which
 * renderer is attached.
 */
function unitWorldOffset(unitId: string): { x: number; z: number } | undefined {
  const offset = effects.offsetOf(unitId);
  if (!offset) return undefined;
  return {
    x: (offset.x / BASE_HEX_SIZE) * HEX_RADIUS,
    z: (offset.y / BASE_HEX_SIZE) * HEX_RADIUS,
  };
}

function frame(now: number): void {
  const delta = Math.min(0.1, (now - lastFrameAt) / 1000);
  lastFrameAt = now;

  const animating = effects.update(now);
  const started = performance.now();

  // A duel drives the units through pose overrides, which only take effect
  // when the scene is reconciled. Reconciling only on `dirty` would freeze
  // the fight on its first frame.
  const fighting = scene.fx.active();

  if (dirty || animating || fighting) {
    scene.sync(state, {
      selectedUnitId,
      reachable: reach,
      attackTargets,
      hover,
      unitOffset: unitWorldOffset,
      unitOpacity: (id) => effects.opacityOf(id),
    });
    dirty = false;
    refreshHud();
  }

  scene.render(delta, effects.shakeOffset());
  droneHud.update(scene.drone.telemetry());

  ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  if (animating) effects.draw(ctx, projection);

  frameMs = performance.now() - started;
  requestAnimationFrame(frame);
}

fitCanvas();
boot();

/*
 * Save when the page goes away.
 *
 * `visibilitychange` rather than `beforeunload`: a phone or a tab that is
 * closed by the operating system often never fires `beforeunload` at all,
 * and `hidden` is the last moment guaranteed to arrive. Writing a few
 * kilobytes here is cheap enough that doing it on every tab switch does not
 * matter.
 */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveGame(slot, state);
});
requestAnimationFrame(frame);
// Exposed for automated checks, so a test can assert the game actually plays
// rather than assuming a screenshot means success.
declare global {
  interface Window {
    __fabricEmpires?: {
      seed: () => string;
      turn: () => number;
      lastFrameMs: () => number;
      unitCount: (factionId: string) => number;
      factionUnits: (
        factionId: string,
      ) => { id: string; typeId: string; q: number; r: number; hp: number }[];
      cityCount: () => number;
      resources: () => Record<string, number>;
      selected: () => string | undefined;
      selectFirstIdle: () => void;
      hexAt: (x: number, y: number) => Hex;
      screenOf: (hex: Hex) => { x: number; y: number };
      reachableCount: () => number;
      reachableHexes: () => { q: number; r: number; cost: number }[];
      drone: () => {
        engaged: boolean;
        camera: { x: number; y: number; z: number };
        target: { x: number; y: number; z: number };
        speedMs: number;
        altitudeM: number;
        aglM: number | null;
        headingDeg: number;
        cruiseMs: number;
      };
      faceNorth: () => void;
      saveNow: () => boolean;
      savedBytes: () => number;
      wipeSave: () => void;
      unitHex: (unitId: string) => Hex | undefined;
      research: () => {
        known: number;
        total: number;
        current: string | undefined;
        currentLabel: string | undefined;
        progress: number;
        options: { id: string; label: string; cluster: string; cost: number }[];
      };
      startResearch: (topicId: string) => boolean;
      grantCompute: (amount: number) => void;
      cityBindings: () => Record<string, readonly string[]>;
      expireReviews: () => number;
      masterySummary: () => Record<string, number>;
      answerOpen: (correct?: boolean) => Promise<string | undefined>;
      openQuestion: () => Promise<
        { id: string; isOpen: boolean; options: number; accepted: number[] } | undefined
      >;
      terrainProbe: () => unknown;
      /**
       * The live three.js objects.
       *
       * Present so a lighting question can be answered by toggling one thing
       * at a time in a running page instead of by editing, rebuilding and
       * re-photographing for every hypothesis. Diagnosing the terrain by
       * screenshot alone cost several wrong guesses in a row.
       */
      gfx: () => unknown;
      quality: (level: 'high' | 'low') => void;
      spawnEnemyAdjacent: (unitId: string) => Hex | undefined;
      clickHex: (hex: Hex) => void;
      endTurn: () => Promise<void>;
    };
  }
}

window.__fabricEmpires = {
  seed: () => state.seed,
  turn: () => state.turn,
  lastFrameMs: () => frameMs,
  unitCount: (factionId: string) => unitsOf(state, factionId).length,
  cityCount: () => state.cities.size,
  resources: () => ({ ...state.factions.get(PLAYER_FACTION_ID)!.resources }),
  selected: () => selectedUnitId,
  selectFirstIdle: () => selectNextIdle(),
  hexAt: (x, y) => scene.hexAt(x, y) ?? { q: 0, r: 0 },
  screenOf: (hex) => scene.project(scene.groundAt(hex)),
  reachableCount: () => reach?.size ?? 0,
  reachableHexes: () =>
    [...(reach?.values() ?? [])].map((entry) => ({
      q: entry.hex.q,
      r: entry.hex.r,
      cost: entry.cost,
    })),
  drone: () => {
    const t = scene.drone.telemetry();
    const cam = scene.world.camera.position;
    const target = scene.drone.orbitTarget();
    return {
      engaged: t.engaged,
      camera: { x: cam.x, y: cam.y, z: cam.z },
      target: { x: target.x, y: target.y, z: target.z },
      speedMs: t.speedMs,
      altitudeM: t.altitudeM,
      aglM: t.aglM,
      headingDeg: t.headingDeg,
      cruiseMs: t.cruiseMs,
    };
  },
  faceNorth: () => scene.drone.faceNorth(),
  factionUnits: (factionId: string) =>
    unitsOf(state, factionId).map((u) => ({
      id: u.id,
      typeId: u.typeId,
      q: u.hex.q,
      r: u.hex.r,
      hp: u.hp,
    })),
  saveNow: () => saveGame(slot, state),
  savedBytes: () => slot.read()?.length ?? 0,
  wipeSave: () => slot.clear(),
  unitHex: (unitId: string) => state.units.get(unitId)?.hex,
  research: () => {
    const current = state.research.current;
    const node = current ? topicById(state.topics, current) : undefined;
    return {
      known: state.research.known.length,
      total: state.topics.nodes.length,
      current,
      currentLabel: node?.label,
      progress: state.research.progress,
      options: researchable(state).map((o) => ({
        id: o.id,
        label: o.label,
        cluster: o.cluster,
        cost: researchCost(o),
      })),
    };
  },
  startResearch: (topicId: string) => {
    const result = startResearch(state, topicId);
    if (!result.ok) return false;
    state = result.state;
    refreshResearch();
    return true;
  },
  grantCompute: (amount: number) => {
    // Test affordance: skip the twenty turns of economy it would otherwise
    // take to fund a topic.
    const factions = new Map(state.factions);
    const player = factions.get(PLAYER_FACTION_ID)!;
    factions.set(PLAYER_FACTION_ID, {
      ...player,
      resources: { ...player.resources, compute: player.resources.compute + amount },
    });
    state = { ...state, factions };
    refreshHud();
  },
  terrainProbe: () => ({ ...scene.probe(), ...scene.stats() }),

  cityBindings: () => {
    const out: Record<string, readonly string[]> = {};
    for (const city of state.cities.values()) out[city.name] = city.boundSkills;
    return out;
  },

  /**
   * Test affordance: make every bound topic fall due immediately.
   *
   * Built from the tracker's public API by recording a review far enough in
   * the past that any interval has elapsed. Waiting out a real interval in a
   * test would mean either a slow test or a fake clock, and a fake clock
   * would stop the test proving that the real wiring works.
   */
  expireReviews: () => {
    const longAgo = Date.now() - 400 * DAY_MS;
    let touched = 0;
    for (const city of state.cities.values()) {
      for (const topicId of city.boundSkills) {
        mastery.record(topicId, 1, false, longAgo);
        touched += 1;
      }
    }
    refreshSelection();
    return touched;
  },

  masterySummary: () => mastery.summary(state.topics.nodes.map((n) => n.id)),

  /**
   * Answer whatever question is on screen, correctly or deliberately wrongly.
   *
   * Needed because an automated run otherwise cannot get past research at
   * all: the right answer is only revealed after submitting, and the retry
   * next turn is a different question, so blind clicking never converges. The
   * option is found the same way the player's click is judged, by hashing it,
   * so this proves the real path rather than bypassing it.
   *
   * Returns the option that was chosen, or undefined if nothing is open.
   */
  answerOpen: async (correct = true) => {
    const question = modal.current();
    if (!question || !modal.isOpen()) return undefined;
    const options = question.options ?? [];

    /*
     * ⚠️ Selecting an option is not answering it.
     *
     * This used to click one option and stop, which sets `aria-pressed` and
     * nothing else: the modal stayed open, the promise never resolved, and
     * the research it was waiting on sat at 12/12 Compute forever. Every
     * assertion downstream then read a game that had quietly stopped, and
     * the only visible symptom was a counter that would not move.
     *
     * A multi-answer question needs every correct option before Submit even
     * enables, so the loop collects them all rather than breaking at the
     * first.
     */
    const multi = question.type === 'multi';
    const needed = multi ? (question.selectCount ?? 2) : 1;
    const wanted: string[] = [];
    for (const option of options) {
      const isRight = await checkAnswer(question.id, option, question.answerHash);
      if (isRight === correct) {
        wanted.push(option);
        if (wanted.length === needed) break;
      }
    }
    if (wanted.length === 0) return undefined;

    const nodes = [...document.querySelectorAll<HTMLElement>('.fe-option')];
    for (const choice of wanted) {
      nodes[options.indexOf(choice)]?.click();
    }

    const submit = [...document.querySelectorAll<HTMLButtonElement>('.fe-modal button.act')].find(
      (b) => b.textContent === 'Submit',
    );
    if (!submit || submit.disabled) return undefined;
    submit.click();

    /*
     * Submitting is still not the end of it. The modal then shows why the
     * answer was what it was, and waits on Continue: that explanation is the
     * point of the whole game, so it is not skippable and nothing downstream
     * resumes until it is dismissed. A test that stopped at Submit left the
     * research permanently at 12/12 Compute.
     */
    for (let i = 0; i < 40; i++) {
      const cont = [...document.querySelectorAll<HTMLButtonElement>('.fe-modal button.act')].find(
        (b) => b.textContent === 'Continue',
      );
      if (cont) {
        cont.click();
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    return wanted.join(' | ');
  },

  /**
   * What the answer check makes of the question currently on screen.
   *
   * `answerOpen` returning undefined has two very different causes: no modal,
   * or a modal whose options all fail the hash check. The second would mean
   * the shipped question bank and the shipped hashes disagree, which is a
   * content bug that no screenshot could ever show.
   */
  openQuestion: async () => {
    const question = modal.current();
    if (!question) return undefined;
    const options = question.options ?? [];
    const accepted: number[] = [];
    for (let i = 0; i < options.length; i++) {
      if (await checkAnswer(question.id, options[i]!, question.answerHash)) accepted.push(i);
    }
    return { id: question.id, isOpen: modal.isOpen(), options: options.length, accepted };
  },

  gfx: () => scene.world,
  quality: (level: 'high' | 'low') => {
    scene.setQuality(level === 'low' ? LOW_QUALITY : HIGH_QUALITY);
    fitCanvas();
  },
  spawnEnemyAdjacent: (unitId: string) => {
    // Test affordance: put a hostile next door so the combat choreography
    // can be exercised without marching across the continent first.
    const unit = state.units.get(unitId);
    if (!unit) return undefined;
    for (let d = 0; d < 6; d++) {
      const hex = hexNeighbour(unit.hex, d);
      const tile = state.map.tiles.get(hexKey(hex));
      if (!tile || tile.terrain === 'onelake' || tile.terrain === 'semanticPeaks') continue;
      if (unitAt(state, hex) || cityAt(state, hex)) continue;
      const id = `test-foe-${state.nextEntityId}`;
      const units = new Map(state.units);
      units.set(id, {
        id,
        typeId: 'pipelineRunner',
        factionId: ANTAGONIST_FACTION_ID,
        hex,
        hp: 100,
        movesLeft: 0,
        fortified: false,
      });
      state = { ...state, units, nextEntityId: state.nextEntityId + 1 };
      refreshSelection();
      dirty = true;
      return hex;
    }
    return undefined;
  },
  clickHex: (hex) => void actOn(hex),
  endTurn: () => doEndTurn(),
};
