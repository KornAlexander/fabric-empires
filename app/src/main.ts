import {
  ANTAGONIST_FACTION_ID,
  ANTAGONISTS,
  aggroRadius,
  hexDistance,
  BASE_HEX_SIZE,
  PLAYER_FACTION_ID,
  promoteCities,
  nextRankNeed,
  rankInfo,
  type CityRank,
  type CityRankInfo,
  canAttack,
  canFoundCity,
  dataAtFounding,
  settleSites,
  turnsToFirstCitizen,
  type SettleSite,
  canRaid,
  raidCity,
  ruinAt,
  cityAt,
  recordCheat,
  sightOf,
  DEFAULT_WORLD_CHOICE,
  WORLD_SHAPES,
  WORLD_SIZES,
  paceScale,
  rosterFor,
  worldOptions,
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
  wakeUnit,
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
  type ChallengeOutcome,
  type ChallengeRequest,
  type GameState,
  type Hex,
  type ReachableTile,
  type Unit,
  type UnitTypeId,
} from '@fabric-empires/engine';
import {
  DAY_MS,
  DP600_QUESTIONS,
  Dp600ChallengeProvider,
  SIEGE_LENGTH,
  SIEGE_QUESTION_MS,
  bandStrength,
  buildLibraryModel,
  buildSiege,
  campaignById,
  checkAnswer,
  createMasteryTracker,
  createQuestionPresenter,
  localStorageStore,
  proctorReady,
  revealCorrectAnswer,
  scoreFor,
  scoreSiege,
  summarise,
} from '@fabric-empires/learn';
import { createEffects } from './render/effects.js';
import { createScene3D } from './three/scene3d.js';
import { playDuel } from './three/duel.js';
import { HEX_RADIUS, SEA_LEVEL, hexToWorld } from './three/terrain.js';
import { HIGH_QUALITY, LOW_QUALITY } from './three/world.js';
import { createQuestionModal } from './ui/questionModal.js';
import { createGreatLibrary } from './ui/greatLibrary.js';
import { createDroneHud } from './ui/droneHud.js';
import { Vector3 } from 'three';
import { createEndScreen } from './ui/endScreen.js';
import { createCinematicOverlay } from './ui/cinematicOverlay.js';
import { createChoiceModal } from './ui/choice.js';
import { createSetupScreen, type SetupResult } from './ui/setupScreen.js';
import { createCheatConsole } from './ui/cheatConsole.js';
import { createRaidAlert } from './ui/raidAlert.js';
import { createDuoModal } from './ui/duoModal.js';
import { CHEATS, findCheat } from './cheats.js';
import { approachShot, descendShot, orbitShot } from './three/cinematic.js';
import { introShots } from './intro.js';
import { createAnthem } from './audio.js';
import { createSoundtrack } from './soundtrack.js';
import { createCues } from './cues.js';
import { applyStaticTranslations, lang, onLangChange, plural, t, toggleLang } from './i18n.js';
import { allCampaigns } from './courses.js';
import { probeEdition } from './coach.js';

/**
 * Find a course by id, shipped or imported.
 *
 * ⚠️ Not `campaignById`, which only knows what was compiled in. A player who
 * uploaded a spreadsheet and picked it would otherwise be handed silence: the
 * seat would build with no questions and no error, because a missing campaign
 * looks exactly like a single-player game.
 */
const courseById = (id: string) => allCampaigns().find((c) => c.id === id);
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

const soloPresenter = createQuestionPresenter(modal, { asked: askedThisSession });

/**
 * Player one's presenter, swapped when a second person joins.
 *
 * ⚠️ In co-op BOTH seats must be panes of the duo modal. Leaving player one on
 * the full-screen single-player modal put their question underneath the duo
 * layer, where it was invisible and unanswerable: measured, only the child's
 * pane appeared. The provider is constructed once, so the swap has to happen
 * behind a stable function rather than by rebuilding it.
 */
let seatOnePresenter: ((request: ChallengeRequest) => Promise<ChallengeOutcome>) | undefined;

const provider = new Dp600ChallengeProvider({
  presenter: (request) => (seatOnePresenter ?? soloPresenter)(request),
  mastery,
});

/**
 * The second seat.
 *
 * ⚠️ **Its own presenter, its own bank, and deliberately NO mastery tracker.**
 * The readiness figure and the Great Library describe one person's progress
 * towards DP-600. Feeding a six-year-old's answers about Anlaute into that
 * would corrupt the only number this product really produces, in exactly the
 * way the cheat codes are forbidden from doing (D205).
 *
 * Rebuilt whenever a game starts, because the course can change.
 */
const duo = createDuoModal();
let secondSeat: ((request: ChallengeRequest) => Promise<ChallengeOutcome>) | undefined;
let secondSeatTopics: readonly string[] = [];

function buildSecondSeat(): void {
  secondSeat = undefined;
  secondSeatTopics = [];
  seatOnePresenter = undefined;
  duo.hide();
  if (lastSetup.players !== 2) return;

  const campaign = courseById(lastSetup.courseP2);
  if (!campaign) return;

  const own = courseById(lastSetup.courseP1);
  seatOnePresenter = createQuestionPresenter(
    duo.ui({ seat: 1, who: 'Player 1', course: own?.course ?? 'Fabric Empires' }),
    { asked: askedThisSession },
  );

  secondSeat = createQuestionPresenter(
    duo.ui({ seat: 2, who: 'Player 2', course: campaign.course }),
    { questions: campaign.questions },
  );
  // The topics this seat can be asked about, which are its own, not the
  // world's. A Klasse 1 player is never asked about a lakehouse.
  secondSeatTopics = [...new Set(campaign.questions.map((q) => q.skillId))].map(
    (id) => `${campaign.id}-${id}`,
  );
}

/**
 * Ask a battle question, of everybody who is playing.
 *
 * ⚠️ **Both seats are asked concurrently, and the scores are averaged.** The
 * engine takes one challenge score, so two answers have to become one number,
 * and averaging is the only combination that makes it genuinely co-operative:
 * the child's answer really moves the battle. Taking the better of the two
 * would be kinder and would make them a spectator with a keyboard.
 *
 * `Promise.all` is what puts both questions on screen at once. Each provider
 * calls its own seat's `ask`, the duo modal renders whatever is pending, and
 * neither player waits for the other.
 */
async function askBattle(
  topicId: string,
  tier: 1 | 2 | 3,
  timeLimitMs: number,
): Promise<number> {
  const first = provider.present({ kind: 'battle', topicId, tier, timeLimitMs });

  if (!secondSeat || secondSeatTopics.length === 0) {
    return (await first).score;
  }

  /*
   * The second seat's topic comes from its own bank and its own seeded
   * stream, so two players sharing a seed get the same pair of questions and
   * a replay asks the same things (D39).
   */
  const pick = createRng(state.seed, `seat2:${state.turn}:${topicId}`);
  const theirTopic =
    secondSeatTopics[Math.floor(pick.float(0, 1) * secondSeatTopics.length)]!;

  const [a, b] = await Promise.all([
    first,
    secondSeat({ kind: 'battle', topicId: theirTopic, tier: 1, timeLimitMs }),
  ]);

  const together = (a.score + b.score) / 2;
  if (b.score > 0 && a.score <= 0) {
    log(t('Player 2 held the line where you did not.'), 'good');
  } else if (b.score > 0) {
    log(t('Both of you knew it. The walls hold.'), 'good');
  }
  return together;
}

/**
 * Timers from D50: tight, but every modal can be paused without penalty.
 *
 * ⚠️ **These are THINKING budgets, not clocks.** The presenter adds a reading
 * allowance for each question on top, computed from that question's own length,
 * so a long one about Direct Lake and a four-word sum for a six-year-old do not
 * share a stopwatch. They were total limits until it was measured that only 54
 * percent of the DP-600 bank could be answered at all inside the old flat 20
 * seconds, and only 3 percent could earn the fast bonus.
 *
 * Read them as: once you have finished reading, this is how long you get.
 */
const BATTLE_TIME_MS = 14_000;
const RESEARCH_TIME_MS = 22_000;

/**
 * Every question's time limit, scaled by the chosen pace.
 *
 * ⚠️ A function of `lastSetup` rather than a constant computed once, because
 * the pace can change when a new game is started and a captured constant would
 * keep the first game's timings for the rest of the session.
 *
 * `scoreFor` grades on how much of the limit was spent as well as on whether
 * the answer was right, so this changes both the thinking time and what a fast
 * answer is worth. Floored so a pace can never make a question expire on
 * arrival.
 */
function timeLimit(base: number): number {
  return Math.max(4_000, Math.round(base * paceScale(lastSetup.pace)));
}

/**
 * The animation layer.
 *
 * Held here rather than inside a renderer because effects outlive a single
 * frame and must not be owned by something that is allowed to be lazy.
 */
const effects = createEffects();
const banner = createBattleBanner();
const choice = createChoiceModal();
const raidAlert = createRaidAlert();
const setup = createSetupScreen();

/**
 * What the setup screen last produced.
 *
 * Kept so reopening it shows the previous choices rather than resetting to the
 * defaults, and so the endgame's "play again" starts a comparable world rather
 * than silently dropping the player back onto one continent.
 */
let lastSetup: SetupResult = { ...DEFAULT_WORLD_CHOICE, seed: 'FABRIC' };

/**
 * Run a typed cheat code.
 *
 * ⚠️ Every successful code is written into `state.cheatsUsed`, which is part of
 * the save. The end screen reads it. A player is entirely welcome to use these,
 * and equally entitled to be reminded that they did.
 */
function runCheat(raw: string): void {
  const typed = raw.trim().toLowerCase();

  if (typed === 'help' || typed === '?') {
    cheats.say('Codes:');
    for (const cheat of CHEATS) {
      cheats.say(`  ${cheat.code.padEnd(14)} ${cheat.describe}`);
    }
    cheats.say('  None of them can make you ready. Only answering does that.');
    return;
  }

  const cheat = findCheat(typed);
  if (!cheat) {
    cheats.say(`No such code: ${typed}. Try help.`, 'bad');
    return;
  }

  const outcome = cheat.apply({
    state,
    selectedUnitId,
    faceProctor: () => {
      cheats.hide();
      void faceTheProctor();
    },
  });

  if (!outcome.ok) {
    cheats.say(outcome.message, 'bad');
    return;
  }

  if (outcome.state) state = recordCheat(outcome.state, cheat.code);
  else state = recordCheat(state, cheat.code);

  cheats.say(outcome.message, 'good');
  log(`Cheat: ${outcome.message}`);
  saveGame(slot, state);
  refreshHud();
  refreshResearch();
  refreshSelection();
  refreshThreats();
  dirty = true;
}

const cheats = createCheatConsole({ submit: runCheat });

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
const endScreen = createEndScreen(() => {
  lastSetup = { ...lastSetup, seed: el.seedInput.value };
  void askAndStart();
});

/**
 * The cinematics.
 *
 * ⚠️ **Each fires once per game, and only the first time.** The whole value of
 * an establishing shot is that it marks something as new; the fourth city is
 * not news, and a game that stops to admire every one of them would be
 * unplayable by turn twenty. `seen` is reset when a new empire starts, not
 * carried in the save, because these mark the beats of a *run*.
 */
/**
 * How well a topic is currently held, as a number the engine can use.
 *
 * ⚠️ The whole of the D35 boundary, in one function. The engine asks "how
 * strong is this opaque string" and gets a number; it never learns that the
 * strings are DP-600 skills, that there is such a thing as spaced repetition,
 * or that a certification exists.
 */
const topicStrength = (topicId: string): number => bandStrength(mastery.get(topicId));

/** One line saying what a new rank is actually worth, so it is not just a word. */
function whyItRose(rank: CityRankInfo): string {
  const percent = Math.round((rank.yieldBonus - 1) * 100);
  return percent > 0 ? t('Yields +{percent}%.', { percent }) : t('The first step.');
}

/**
 * A settlement rank in the current language.
 *
 * ⚠️ Reads `labelDe` off the engine's rank table rather than going through the
 * catalogue. The two names of a rank were deliberately put on one row so they
 * could not drift apart (D263), and copying the German into a second place
 * would undo exactly that.
 */
function rankName(id: CityRank): string {
  const info = rankInfo(id);
  return lang() === 'de' ? info.labelDe : info.label;
}

const cinemaOverlay = createCinematicOverlay();
cinemaOverlay.onSkip(() => scene.cinema.skip());

/**
 * Whether the player has asked to be done with the opening.
 *
 * ⚠️ **`cinema.skip()` ends the current SHOT, not the sequence.** The opening
 * plays four of them in a row, so pressing Escape skipped one beat and started
 * the next, and a player who wanted to get on with the game had to press it
 * four times. Nobody reads that as "skip"; they read it as ignored.
 */
let openingSkipped = false;
/**
 * Whether the opening film is on screen right now.
 *
 * ⚠️ Read by the first-click handler that starts the background score. The
 * anthem owns the opening, and two pieces of orchestral music at once is not
 * a richer soundtrack, it is a mess.
 */
let openingRunning = false;
cinemaOverlay.onSkip(() => {
  openingSkipped = true;
});
const seenCinematics = new Set<string>();

/**
 * The optional score for the opening.
 *
 * Silent unless `public/audio/anthem.mp3` is present, which it is not in a
 * fresh clone. See `audio.ts` for why the file is kept out of the repository.
 */
const anthem = createAnthem();

/**
 * The optional score for everything after the opening.
 *
 * Same contract as the anthem: silent and harmless when the files are absent.
 * Started either at the end of the opening film or, for a resumed game that
 * never plays one, on the first click. See `soundtrack.ts`.
 */
const music = createSoundtrack();

/**
 * The sound the cinematics make.
 *
 * ⚠️ Unlike the music, this ships: it is synthesised from oscillators at the
 * moment it plays, so it has no file, no licence and no download, and it
 * works in a fresh clone. See `cues.ts`.
 */
const cues = createCues();

/*
 * Which edition is this?
 *
 * ⚠️ Asked once, in the background, and nothing waits for the answer. The game
 * is fully playable while this is in flight; all it decides is whether the
 * Great Library shows a chat box next to the advice it already computes. A
 * boot that blocked on a network probe would make the capacity edition slower
 * to start than the free one, which is precisely backwards.
 */
void probeEdition();

async function playOnce(shot: ReturnType<typeof orbitShot>): Promise<void> {
  if (seenCinematics.has(shot.id) || finished) return;
  seenCinematics.add(shot.id);
  cinemaOverlay.show(shot.title, shot.subtitle);
  /*
   * Pull the score down and sound the cue.
   *
   * ⚠️ The duck is not decoration. A four second phrase played on top of a
   * background bed at the same level is not a cue, it is a second piece of
   * music, and the two argue. Pulling the bed to a third for the length of
   * the film is the ordinary broadcast answer and the reason the cue reads as
   * belonging to what is on screen.
   */
  music.duck(true);
  cues.play(shot.id);
  try {
    await scene.cinema.play(shot);
  } finally {
    cinemaOverlay.hide();
    music.duck(false);
  }
}

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
/** Set once the Proctor has been announced, so it is said only once. */
let proctorAnnounced = false;
/** Set while the exam is being sat, so it cannot be started twice. */
let siegeRunning = false;
/**
 * True while a turn's result is being watched rather than applied.
 *
 * ⚠️ The raid is choreographed on the world as it was, so for those few
 * seconds `state` is deliberately a turn behind the engine. A click during
 * that window would move a unit in the old world and then have the whole move
 * silently overwritten when the result is adopted.
 */
let resolvingTurn = false;

/**
 * The topic a question's skill belongs to.
 *
 * Questions carry a 1-based skill number from the outline; the engine's topic
 * graph is the same 41 nodes in the same order. Keeping the lookup in one
 * place means the exam feeds the same schedule as everything else rather than
 * inventing topic ids of its own.
 */
function topicIdForSkill(skillId: number): string | undefined {
  return state.topics.nodes[skillId - 1]?.id;
}

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
  actRaid: document.querySelector<HTMLButtonElement>('#act-raid')!,
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
  readiness: document.querySelector<HTMLElement>('#readiness')!,
  faceProctor: document.querySelector<HTMLButtonElement>('#face-proctor')!,
  threatsList: document.querySelector<HTMLElement>('#threats-list')!,
  langToggle: document.querySelector<HTMLButtonElement>('#lang-toggle')!,
  musicToggle: document.querySelector<HTMLButtonElement>('#music-toggle')!,
};

/*
 * The language switch.
 *
 * ⚠️ **The button shows the language it will switch TO, not the current one.**
 * A button labelled with the language you are already reading looks like a
 * status badge, and people do not press status badges. "DE" while playing in
 * English is an offer.
 *
 * Everything downstream redraws from `state`, so a change only has to repaint
 * the static shell and mark the frame dirty; the panels rebuild themselves.
 */
function paintLangToggle(): void {
  el.langToggle.textContent = lang() === 'en' ? 'DE' : 'EN';
  el.langToggle.title = lang() === 'en' ? 'Auf Deutsch spielen' : 'Play in English';
}

el.langToggle.addEventListener('click', () => {
  toggleLang();
});

/*
 * The sound switch.
 *
 * ⚠️ **Hidden until a track has actually been found.** A mute button in a
 * build with no audio files is a control that does nothing, and a control
 * that does nothing is worse than an absent one: the player presses it,
 * hears no change, and now distrusts the rest of the interface. The probe in
 * `soundtrack.ts` decides, and it decides after a round trip, so this repaints
 * on change rather than once at load.
 *
 * ⚠️ **One switch for everything that makes a noise**, which is why it says
 * sound rather than music. It is the only audio control in the game, and
 * somebody who presses it wants quiet; being hit by a gong ten seconds later
 * because the cinematics are technically a different subsystem would read as
 * a bug, and they would be right.
 */
function paintMusicToggle(): void {
  el.musicToggle.hidden = !music.available;
  el.musicToggle.classList.toggle('muted', music.muted);
  el.musicToggle.title = music.muted ? t('Turn the sound on') : t('Turn the sound off');
}

el.musicToggle.addEventListener('click', () => {
  music.toggle();
  cues.setMuted(music.muted);
  paintMusicToggle();
});

music.onChange(paintMusicToggle);
cues.setMuted(music.muted);
paintMusicToggle();

/*
 * The first click of a resumed game is the gesture the browser wants.
 *
 * ⚠️ A resumed empire never plays the opening (see `boot`), so without this
 * the score would only ever exist for players starting a new game. `start()`
 * is idempotent and refuses while the film is running, so the two paths do
 * not fight over the first track.
 */
window.addEventListener(
  'pointerdown',
  () => {
    if (!openingRunning) music.start();
  },
  { once: true },
);

onLangChange(() => {
  applyStaticTranslations();
  paintLangToggle();
  // ⚠️ Not a `data-i18n-title`, because the music button's title depends on
  // whether it is muted as well as on the language. Two owners writing the
  // same attribute is how one of them ends up stale.
  paintMusicToggle();
  // Every panel rebuilds its contents from state, so switching language is
  // just "draw everything again" rather than a hunt for stray strings.
  refreshHud();
  refreshSelection();
  refreshResearch();
  refreshCities();
  refreshThreats();
  refreshReadiness();
  dirty = true;
});

applyStaticTranslations();
paintLangToggle();

let state: GameState = createGameState('FABRIC', { topics: provider.topics() });
/** Where the empire is kept between visits. See `persist.ts`. */
const slot = localSlot();
let selectedUnitId: string | undefined;
let reach: ReadonlyMap<string, ReachableTile> | undefined;
let attackTargets: Set<string> | undefined;
/** Where the selected Architect could build, best first. Empty otherwise. */
let settleSuggestions: readonly SettleSite[] = [];
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
  settleSuggestions = [];

  const unit = selectedUnitId ? state.units.get(selectedUnitId) : undefined;
  if (!unit || unit.factionId !== state.activeFactionId) {
    selectedUnitId = undefined;
    el.selTitle.textContent = t('Nothing selected');
    el.selDetail.textContent = t('Click one of your units.');
    el.actFound.disabled = true;
    el.actRaid.disabled = true;
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

  /*
   * Where this Architect could build, if it is one.
   *
   * ⚠️ Founding is the most consequential and least explained decision in the
   * game: the site is permanent, the difference between a good one and a bad
   * one is enormous, and nothing on screen used to say which was which. A
   * player who did not already know that Data is what makes a city grow
   * settled where they happened to be standing.
   */
  settleSuggestions = settleSites(state, unit);

  // ⚠️ The unit's name is NOT translated: Pipeline Runner and Direct Lake
  // Titan are jokes built on Fabric terminology, and a German Fabric user says
  // them in English. The words around them are ordinary and are translated.
  el.selTitle.textContent = type.label;
  el.selDetail.textContent =
    `${unit.hp}/${type.maxHp} ${t('HP')}  ` +
    `${unit.movesLeft}/${type.movement} ${t('moves')}  ` +
    `${t('strength')} ${type.strength}` +
    (unit.fortified ? `  (${t('fortified')})` : '');

  /*
   * The advice, in the words that matter: how fast will it grow.
   *
   * Data is this game's food. It never leaves the city that made it and it is
   * the only thing that adds citizens, so "six turns to the next citizen" says
   * more about a site than any score could.
   */
  const best = settleSuggestions[0];
  if (best) {
    /*
     * ⚠️ The tile underfoot is measured directly, not looked up in the list.
     *
     * The list is the best five sites, and where the Architect happens to be
     * standing is frequently not one of them, which is precisely when the
     * comparison matters most. Fetching it from the list meant the hint
     * disappeared exactly when the player most needed to know what they would
     * be giving up by building here.
     */
    const hereData = canFoundCity(state, unit) ? dataAtFounding(state, unit.hex) : undefined;
    const grows = (turns: number | undefined): string =>
      turns === undefined
        ? t('will not grow')
        : plural(turns, '{n} turn to grow', '{n} turns to grow');
    const summary = (data: number): string =>
      `${data} Data, ${grows(turnsToFirstCitizen(data))}`;

    el.selDetail.textContent +=
      best.distance === 0
        ? `  ·  ${t('good site')}: ${summary(best.dataAtFounding)}`
        : /*
           * ⚠️ Both stated, neither called better.
           *
           * An earlier version labelled the top-scored site "better site",
           * and was caught on screen recommending 2 Data and nine turns over
           * the 3 Data and six turns underfoot. The score and the growth rate
           * are not the same thing, the player is the one choosing, and a
           * recommendation that argues with its own numbers is worse than
           * numbers on their own.
           */
          `  ·  ${t('best nearby ({n} away)', { n: best.distance })}: ` +
          summary(best.dataAtFounding) +
          (hereData === undefined ? '' : `  ·  ${t('here')}: ${summary(hereData)}`);
  }

  el.actFound.disabled = !canFoundCity(state, unit);
  el.actRaid.disabled = raidTarget(unit.id) === undefined;
  // The one action that reverses itself, so it is labelled by what it will do
  // next rather than by what it is.
  el.actFortify.disabled = type.strength === 0;
  el.actFortify.textContent = unit.fortified ? t('Wake') : t('Fortify');
  el.actFortify.title = unit.fortified
    ? t('Stand down, and move again this turn (h)')
    : t('Dig in for +40% defence, ending this turn (h)');
  el.actSkip.disabled = unit.movesLeft <= 0;
  refreshCouncil();
}

function select(unitId: string | undefined): void {
  selectedUnitId = unitId;
  refreshSelection();
  dirty = true;
}

/**
 * The neighbouring village this unit could rob, if any.
 *
 * Returns the hex rather than a boolean so the button and the keyboard
 * shortcut cannot disagree about which village they meant, which they would
 * if each searched the neighbours separately.
 */
function raidTarget(unitId: string): Hex | undefined {
  const unit = state.units.get(unitId);
  if (!unit) return undefined;
  for (let dir = 0; dir < 6; dir++) {
    const hex = hexNeighbour(unit.hex, dir);
    if (canRaid(state, unitId, hex).ok) return hex;
  }
  return undefined;
}

function doRaid(): void {
  if (!selectedUnitId) return;
  const target = raidTarget(selectedUnitId);
  if (!target) {
    // Say why rather than doing nothing: the cooldown is invisible otherwise.
    const near = hexNeighbour(state.units.get(selectedUnitId)!.hex, 0);
    log(canRaid(state, selectedUnitId, near).reason ?? 'Nothing to raid here.', 'bad');
    return;
  }

  const village = cityAt(state, target);
  const result = raidCity(state, selectedUnitId, target);
  if (!result.ok || !result.state) {
    log(result.reason ?? 'The raid failed.', 'bad');
    return;
  }

  state = result.state;
  const parts = Object.entries(result.loot ?? {})
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([id, amount]) => `${amount} ${id}`);
  log(
    `Raided ${village?.name ?? 'the village'}: ${parts.join(', ') || 'nothing worth taking'}.`,
    'good',
  );
  effects.floatingText(target, 'RAIDED', '#ffcf7a', 1.2);
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
  // The world on screen is a turn behind while a raid plays out.
  if (resolvingTurn) return;

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
      challengeScore = await askBattle(topicId, 2, timeLimit(BATTLE_TIME_MS));
    }

    // The state can only have changed if something else ran while the modal
    // was open, but re-checking is cheap and a stale attack is a real bug.
    if (!canAttack(state, unit.id, target).ok) return;

    const preview = previewAttack(state, unit.id, target, { challengeScore });
    const targetCity = cityAt(state, target);
    const dramatic = !hadFirstBattle || targetCity !== undefined;

    /*
     * Capture or raze, asked only when the blow is expected to finish it.
     *
     * ⚠️ Asked BEFORE the strike, because the engine resolves the whole fight
     * in one call and the outcome has to be part of that call. The trigger is
     * the previewed damage rather than certainty: the roll can still leave the
     * walls standing, in which case the answer simply does not apply and the
     * player is asked again next time. Asking on every blow of a long siege
     * would be worse than occasionally asking a turn early.
     */
    let cityOutcome: 'capture' | 'raze' = 'capture';
    if (
      targetCity &&
      preview &&
      !preview.ranged &&
      preview.expectedDamageToDefender >= targetCity.hp
    ) {
      const holder = state.factions.get(targetCity.factionId);
      cityOutcome = await choice.ask(
        `${targetCity.name} is about to fall`,
        `${holder?.label ?? 'The defenders'} hold this place, and they hold what they know with it. Take it and their ground becomes yours to study. Burn it and you leave with the spoils and nothing else.`,
        [
          {
            id: 'capture' as const,
            label: 'Take the village',
            detail: 'Opens their branch of the exam to you, and adds the settlement to your empire.',
            primary: true,
          },
          {
            id: 'raze' as const,
            label: 'Burn it',
            detail: 'A far larger haul of Data, Compute and Capacity. You learn nothing, and only ruins remain.',
          },
        ],
      );
    }

    if (!hadFirstBattle) {
      // Before the blow, not after it. The shot is the establishing beat and
      // it has nothing to establish once the fight is already resolved.
      const here = scene.groundAt(unit.hex);
      const there = scene.groundAt(target);
      const midpoint = here.clone().add(there).multiplyScalar(0.5);
      await playOnce(
        approachShot({
          id: 'first-blood',
          title: 'First blood',
          subtitle: 'What you know is what you bring to the field',
          focus: midpoint,
          // Come in across the line between them, so both are in frame.
          from: new Vector3(there.z - here.z, 0, here.x - there.x),
          startDistance: 26,
          endDistance: 7,
          startHeight: 14,
          endHeight: 2.6,
        }),
      );
    }
    hadFirstBattle = true;

    await playAttack(unit.id, target, challengeScore, preview, dramatic, cityOutcome);
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
  cityOutcome: 'capture' | 'raze' = 'capture',
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
  const outcome = resolveAttack(state, unitId, target, {
    challengeScore,
    cityOutcome,
  });
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
        if (battle.cityRazed) {
          effects.floatingText(target, 'RAZED', '#ff9b91', 1.5);
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
    log(t('Your answer strengthened the attack.'), 'good');
  } else if (challengeScore < 0) {
    log(t('Your answer weakened the attack.'), 'bad');
  }
  const odds = preview
    ? ` (${Math.round(preview.attacker.effective)} vs ${Math.round(preview.defender.effective)})`
    : '';
  log(
    `Attack${odds}: dealt ${battle.damageToDefender}, took ${battle.damageToAttacker}`,
    battle.damageToDefender >= battle.damageToAttacker ? 'good' : 'bad',
  );
  if (battle.defenderDestroyed) log(t('Enemy unit destroyed.'), 'good');
  if (battle.attackerDestroyed) log(t('Your unit was destroyed.'), 'bad');
  if (battle.cityCaptured) {
    const from = battle.cityFormerFactionId
      ? state.factions.get(battle.cityFormerFactionId)?.label
      : undefined;
    log(`${defenderCity?.name ?? 'The village'} taken${from ? ` from ${from}` : ''}.`, 'good');
    if (battle.clusterOpened) {
      // The point of capturing rather than burning, said out loud.
      const topic = topicById(state.topics, battle.clusterOpened);
      log(
        `Their ground is yours to study: ${topic?.label ?? battle.clusterOpened} is now known.`,
        'good',
      );
    }
    void playCityFallsShot(target);
  }
  if (battle.cityRazed) {
    const from = battle.cityFormerFactionId
      ? state.factions.get(battle.cityFormerFactionId)?.label
      : undefined;
    log(
      `${defenderCity?.name ?? 'The village'} burned${from ? `, ${from} scattered` : ''}.`,
      'good',
    );
    if (battle.loot) {
      const parts = Object.entries(battle.loot)
        .filter(([, amount]) => (amount ?? 0) > 0)
        .map(([id, amount]) => `${amount} ${id}`);
      if (parts.length > 0) log(`Carried off ${parts.join(', ')}.`, 'good');
    }
    log(t('Nothing was learned there.'), 'bad');
    void playCityFallsShot(target);
  }

  refreshCorruption();
  refreshFog();
  refreshCities();
  refreshReadiness();
  refreshThreats();
  refreshSelection();
  dirty = true;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * A city changing hands, in either direction.
 *
 * One shot for both cases on purpose. Whether the walls that just fell were
 * yours or theirs, it is the same event in the world and the same thing worth
 * looking at; the subtitle carries the difference.
 */
function playCityFallsShot(hex: Hex): Promise<void> {
  const city = cityAt(state, hex);
  const mine = city?.factionId === PLAYER_FACTION_ID;
  return playOnce(
    descendShot({
      id: 'city-falls',
      title: 'The walls change hands',
      subtitle: mine
        ? `${city?.name ?? 'A city'} is yours now`
        : `${city?.name ?? 'A city'} has been taken from you`,
      centre: scene.groundAt(hex),
      startHeight: 34,
      endHeight: 6,
      radius: 20,
      sweepRad: 0.8,
      durationMs: 4400,
    }),
  );
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
    void playOnce(
      orbitShot({
        id: 'first-city',
        title: 'The first workspace',
        subtitle: `${city.name} stands where nothing stood`,
        centre: scene.groundAt(city.hex),
        radius: 13,
        fromHeight: 3.4,
        toHeight: 9,
        sweepRad: Math.PI * 0.75,
        startAngleRad: Math.PI * 0.25,
        durationMs: 5000,
      }),
    );
  }
  refreshCorruption();
  refreshFog();
  refreshCities();
  refreshReadiness();
  refreshThreats();
  select(undefined);
}

/**
 * Dig in, or stand down again.
 *
 * ⚠️ **One button, both directions.** It used to fortify and then disable
 * itself, which said "there is no way back" to anybody reading the interface,
 * and for a long time that was accurate: a fortified unit was stranded for the
 * rest of the game. Ordering it to move wakes it too, and that is the first
 * thing a 4X player tries, but an action that has visibly greyed itself out is
 * not an invitation to try anything.
 */
function doFortify(): void {
  if (!selectedUnitId) return;
  const unit = state.units.get(selectedUnitId);
  if (!unit) return;
  const result = unit.fortified
    ? wakeUnit(state, selectedUnitId)
    : fortifyUnit(state, selectedUnitId);
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
  // ⚠️ Rewritten on every state change, so the `data-i18n` tag on the markup
  // is overwritten within a frame of the language switching. Anything set from
  // code has to be translated in code.
  el.actCouncil.textContent =
    available.length > 1
      ? t('Council ({n})', { n: available.length })
      : t('Council');
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
    timeLimitMs: timeLimit(RESEARCH_TIME_MS),
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
  const raids = preview.report.enemyEvents.filter(
    (e) => e.intent.kind === 'raid' && defends(e.intent.target),
  );
  const incoming = raids[0];

  let defenderChallengeScore = 0;
  if (incoming && incoming.intent.kind === 'raid') {
    const who = state.factions.get(incoming.factionId)?.label ?? 'The enemy';
    const topicId = battleTopicFor(incoming.factionId);
    const target = incoming.intent.target;

    /*
     * ⚠️ **Show the attack before asking about it.**
     *
     * This used to open the question immediately, with a line in the log as
     * the only clue. Being asked to defend against an attack you have not been
     * shown is indistinguishable from being quizzed at random, which throws
     * away the whole point of the faction system: who is marching on you is
     * supposed to tell you what you are about to be tested on.
     *
     * So the camera goes to the threatened tile, it is marked in the
     * attacker's colour, and the banner names the faction and the topic. Only
     * then does the modal open, and the banner stays up behind it.
     */
    const colour = state.factions.get(incoming.factionId)?.colour ?? '#b5533f';
    const defender = unitAt(state, target);
    const city = cityAt(state, target);
    const what = city
      ? city.name
      : defender
        ? `your ${unitType(defender.typeId).label}`
        : 'your border';

    log(`${who} is at your gates. Hold them.`, 'bad');
    scene.focus(target);
    effects.flash(target, colour, 900);
    effects.pulse(target, colour, 1.6);
    effects.floatingText(target, 'UNDER ATTACK', colour, 1.3);

    raidAlert.show({
      faction: who,
      colour,
      target: what,
      topic: topicId ? topicById(state.topics, topicId)?.label : undefined,
      alsoComing: raids.length - 1,
    });

    // Long enough to read the banner and see where the camera went. Short
    // enough that it never becomes the thing standing between turns.
    await wait(1500);

    if (topicId) {
      defenderChallengeScore = await askBattle(topicId, 2, timeLimit(BATTLE_TIME_MS));
    }
    raidAlert.hide();
  }

  const result = endTurn(state, { dueTopics, defenderChallengeScore });
  const { report } = result;
  /*
   * ⚠️ **The result is held back until the raid has been watched.**
   *
   * `state` stays the pre-turn world for the next few lines so the first raid
   * can be choreographed like any other fight: both units still exist, still
   * stand where they stood, and the blow lands on screen at the moment the
   * damage is applied. Adopting the result here instead, as this used to,
   * meant the defender was already gone before anything could be drawn, which
   * is why enemy raids only ever got a camera shake and a number.
   *
   * The log lines below are safe on the old state: they read the report, and
   * city names, which are the same in both.
   */
  const nextState = result.state;
  const adoptResult = (): void => {
    state = nextState;
    dirty = true;
  };

  const gains: string[] = [];
  if (report.treasuryGained.compute) gains.push(`+${report.treasuryGained.compute} Compute`);
  if (report.treasuryGained.cu) gains.push(`${report.treasuryGained.cu >= 0 ? '+' : ''}${report.treasuryGained.cu} CU`);
  if (report.treasuryGained.trust) gains.push(`+${report.treasuryGained.trust} Trust`);

  log(t('Turn {n} ended. {gains}', { n: report.turn, gains: gains.join('  ') || t('No income yet.') }));
  for (const cityId of report.grownCities) {
    log(t('{name} grew.', { name: state.cities.get(cityId)?.name ?? t('A city') }), 'good');
  }

  /*
   * Settlements rise here, after the citizens have been counted.
   *
   * ⚠️ Run from the app rather than inside the turn pipeline, because a rank
   * is bought with retained knowledge as well as with people, and the mastery
   * tracker lives on this side of the D35 line. The engine is handed a plain
   * function from an opaque topic id to a number and never learns what the
   * topics are.
   */
  const risen = promoteCities(state, topicStrength);
  if (risen.promoted.length > 0) {
    state = risen.state;
    for (const p of risen.promoted) {
      log(
        t('{name} is now a {rank}. {why}', {
          name: p.cityName,
          rank: rankName(p.to.id),
          why: whyItRose(p.to),
        }),
        'good',
      );
    }
    dirty = true;
  }

  if (report.bankrupt) log(t('Upkeep could not be paid in full.'), 'bad');

  if (report.researchSpent > 0) {
    log(`${report.researchSpent} Compute into research.`);
  }
  /*
   * Say so when the empire chose for itself.
   *
   * ⚠️ Silence here would be the actual problem. Something picking your next
   * subject without telling you is indistinguishable from a bug the first time
   * you notice the tech tree moving on its own, and the whole point of the
   * message is that the player knows they may change it.
   */
  if (report.researchAutoSelected) {
    const node = provider.topics().nodes.find((n) => n.id === report.researchAutoSelected);
    log(
      t('Nothing was being studied, so the council began {topic}. Choose another if you like.', {
        topic: node?.label ?? report.researchAutoSelected,
      }),
    );
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

  /*
   * Watch the raid, then take the consequences.
   *
   * ⚠️ Awaited, unlike the rest of the presentation, because the world on
   * screen is still the old one until this resolves. Letting the player act
   * during it would mean acting on a state the engine has already replaced.
   */
  const presentedEnemyTurn = presentEnemyTurn(
    report.enemyEvents,
    defenderChallengeScore,
    adoptResult,
  );
  resolvingTurn = true;
  try {
    await presentedEnemyTurn;
  } finally {
    // Never leave the game locked, whatever the presentation did.
    resolvingTurn = false;
  }
  // Belt and braces: a turn with nothing to show still has to be adopted.
  adoptResult();

  /*
   * ⚠️ After the result is adopted, never before.
   *
   * `resolveResearch` asks a question and then writes to `state`. Started
   * while the turn's result was still being held back, its work would have
   * been silently overwritten by the adoption a moment later.
   */
  if (report.researchReadyTopicId) {
    void resolveResearch(report.researchReadyTopicId);
  }

  refreshSelection();
  refreshResearch();
  refreshCorruption();
  refreshFog();
  refreshCities();
  refreshReadiness();
  refreshThreats();
  dirty = true;
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
    cheats: state.cheatsUsed,
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
/**
 * Show what the antagonists did.
 *
 * ⚠️ **The first raid against the player is now a real fight.** It used to get
 * a camera shake and a floating number, because the engine had already applied
 * the whole turn by the time this ran and the defender was gone before
 * anything could be drawn. Being asked a question and then simply losing
 * health, with no blow on screen, made the question feel like a toll rather
 * than a defence.
 *
 * So `doEndTurn` now holds the result back and hands it over as `adopt`, which
 * this calls at the exact frame of impact. That is the same contract the
 * player's own attacks have always used.
 *
 * Only the first player-facing raid gets the full duel. Adopting the result
 * applies the WHOLE turn at once, so every later raid is already resolved and
 * cannot be choreographed; those keep the camera, the shake and the number,
 * and the warning banner has already said how many fronts were coming.
 */
async function presentEnemyTurn(
  events: readonly AiEvent[],
  defenceScore = 0,
  adopt?: () => void,
): Promise<void> {
  if (events.length === 0) {
    adopt?.();
    return;
  }

  const raids = events.filter((e) => e.intent.kind === 'raid');
  const movers = new Set(events.filter((e) => e.intent.kind === 'move').map((e) => e.unitId));
  const faction = (id: string) => state.factions.get(id)?.label ?? 'Something';

  /**
   * Where a raider was standing when it struck.
   *
   * ⚠️ Not simply its position in the state: a unit may move up to three times
   * and then attack in the same turn, so the hex it started the turn on is not
   * the hex it swung from. Replaying its own move events gives the real one,
   * and a lunge that starts in the wrong place is worse than no lunge.
   */
  const strikeHexOf = (index: number): Hex | undefined => {
    const raid = events[index];
    if (!raid) return undefined;
    let hex = state.units.get(raid.unitId)?.hex;
    for (let i = 0; i < index; i++) {
      const step = events[i];
      if (step && step.unitId === raid.unitId && step.intent.kind === 'move') {
        hex = step.intent.to;
      }
    }
    return hex;
  };

  // The one the player was asked about, and the only one that can be fought
  // on screen, because adopting the result resolves all of them at once.
  const featuredIndex = events.findIndex(
    (e) => e.intent.kind === 'raid' && defends(e.intent.target),
  );
  const featured = featuredIndex >= 0 ? events[featuredIndex] : undefined;

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

  if (featured && featured.intent.kind === 'raid' && featured.log) {
    const target = featured.intent.target;
    const from = strikeHexOf(featuredIndex);
    const battle = featured.log;
    const defender = unitAt(state, target);
    const city = cityAt(state, target);
    const attackerColour = state.factions.get(featured.factionId)?.colour ?? '#b5533f';
    const defenderColour = state.factions.get(PLAYER_FACTION_ID)?.colour ?? '#4a9fe0';

    if (from) {
      await playDuel(
        scene,
        {
          attackerId: featured.unitId,
          attackerHex: from,
          attackerColour,
          defenderId: defender?.id,
          defenderHex: target,
          defenderColour,
        },
        {
          damageToDefender: battle.damageToDefender,
          damageToAttacker: battle.damageToAttacker,
          defenderDestroyed: battle.defenderDestroyed,
          attackerDestroyed: battle.attackerDestroyed,
          ranged: !isAdjacent(from, target),
          // A raid on a city is a set piece; a raid on a unit is a scuffle.
          dramatic: city !== undefined,
        },
        {
          onImpact: () => {
            adopt?.();
            if (battle.damageToDefender > 0) {
              effects.floatingText(target, `-${battle.damageToDefender}`, '#ff9b91', 1.3);
            }
            if (battle.damageToAttacker > 0 && from) {
              effects.floatingText(from, `-${battle.damageToAttacker}`, '#ffcf7a', 1.1);
            }
          },
          shake: (magnitude) => effects.shake(magnitude),
        },
      );
    }
  }

  // Whatever happened above, the turn's result is now the world.
  adopt?.();

  for (const event of raids) {
    if (event.intent.kind !== 'raid') continue;
    const battle = event.log;
    const target = event.intent.target;
    const who = faction(event.factionId);
    const wasFought = event === featured;

    if (!wasFought) {
      scene.focus(target);
      effects.shake(battle?.defenderDestroyed ? 1.4 : 0.9);
      if (battle && battle.damageToDefender > 0) {
        effects.floatingText(target, `-${battle.damageToDefender}`, '#ff9b91', 1.3);
      }
    }

    if (battle?.cityCaptured) {
      log(`${who} has taken one of your cities.`, 'bad');
      await playCityFallsShot(target);
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
    el.resTitle.textContent = t('Researching nothing');
    el.resBar.style.width = '0%';
    el.resStatus.textContent = t('{known}/{total} known ({percent}%)', {
      known: state.research.known.length,
      total: state.topics.nodes.length,
      percent: Math.round(researchProgress(state) * 100),
    });
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
    timeLimitMs: timeLimit(RESEARCH_TIME_MS),
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
  const ruin = ruinAt(state, h);
  const who = city
    ? ` | ${city.name} (${state.factions.get(city.factionId)?.label ?? '?'})`
    : occupant
      ? ` | ${unitType(occupant.typeId).label} (${state.factions.get(occupant.factionId)?.label ?? '?'})`
      : ruin
        ? ` | ruins of ${ruin.name}`
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
    meta.textContent =
      `${rankName(city.rank)} · ${t('pop {n}', { n: city.population })}` +
      (city.unrest > 0 ? ` · ${t('unrest {n}', { n: city.unrest })}` : '');
    head.append(name, meta);
    row.append(head);

    /*
     * What the next rank is waiting for.
     *
     * ⚠️ Spelled out rather than left to be inferred. A settlement that has
     * quietly stopped growing because a topic lapsed is indistinguishable from
     * one that is merely slow, and a player who cannot tell the difference
     * learns nothing from either. The knowledge case is called out separately
     * because it is the one the player can do something about right now.
     */
    const need = nextRankNeed(city, topicStrength);
    if (need) {
      const wants = document.createElement('div');
      wants.className = need.blockedByKnowledge ? 'city-need knowledge' : 'city-need';
      const parts: string[] = [];
      if (need.citizensShort > 0) {
        parts.push(
          plural(need.citizensShort, '{n} more citizen', '{n} more citizens'),
        );
      }
      if (need.topicsShort > 0) {
        const band = t(need.rank.strengthRequired >= 0.95 ? 'strong' : 'familiar');
        parts.push(
          plural(need.topicsShort, '{n} more topic at {band}', '{n} more topics at {band}', {
            band,
          }),
        );
      }
      wants.textContent =
        parts.length > 0
          ? t('{rank} needs {what}', {
              rank: rankName(need.rank.id),
              what: parts.join(t(' and ')),
            })
          : t('Rising to {rank}', { rank: rankName(need.rank.id) });
      row.append(wants);
    }

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
  refreshReadiness();
  refreshThreats();
        return;
      }
      state = result.state;
      log(chosen ? `${city.name} begins ${unitType(chosen as UnitTypeId).label}.` : `${city.name} downs tools.`);
      refreshCities();
  refreshReadiness();
  refreshThreats();
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

/**
 * The current library model, which is also where exam readiness comes from.
 *
 * Built on demand rather than cached: it reads mastery, research and the bank,
 * all of which move, and a stale readiness number would be worse than a slow
 * one. It is a few hundred array operations.
 */
function libraryModel() {
  const now = Date.now();
  return buildLibraryModel({
    records: new Map(state.topics.nodes.map((n) => [n.id, mastery.get(n.id)])),
    researched: new Set(state.research.known),
    questions: DP600_QUESTIONS,
    due: new Set(provider.dueTopics(now)),
  });
}

/**
 * Exam readiness, and the Proctor's interest in it.
 *
 * ⚠️ Readiness is weighted by the published branch percentages, so it moves
 * much more slowly than a skill count and is meant to. Twenty of forty-one
 * skills is not half the exam.
 */
function refreshReadiness(): void {
  const model = libraryModel();
  const percent = Math.round(model.examRetained * 100);
  el.readiness.textContent = t('{percent}% exam', { percent });

  const ready = proctorReady(model);
  el.faceProctor.hidden = !ready || finished;
  if (ready && !proctorAnnounced) {
    proctorAnnounced = true;
    log(
      `The Proctor has noticed you at ${percent}% readiness. ${SIEGE_LENGTH} questions await.`,
      'good',
    );
    // Straight down onto the capital, because the exam is not coming for a
    // unit or a border: it is coming for the whole empire's account of itself.
    const capital = [...state.cities.values()].find((c) => c.factionId === PLAYER_FACTION_ID);
    if (capital) {
      void playOnce(
        descendShot({
          id: 'proctor',
          title: 'The Proctor',
          subtitle: `${percent} percent of the exam, by weight. It has come to check`,
          centre: scene.groundAt(capital.hex),
          startHeight: 60,
          endHeight: 10,
          radius: 8,
          sweepRad: 1.6,
          durationMs: 5200,
        }),
      );
    }
  }
}

/**
 * Sit the exam.
 *
 * ⚠️ **Every answer still feeds the review schedule.** The siege is the
 * hardest study session in the game and it would be perverse for it to be the
 * one that teaches the spaced repetition system nothing. A player who fails
 * comes back to a schedule that knows exactly which branch let them down.
 *
 * The paper is drawn from the seed, so two players comparing a run sit the
 * same exam.
 */
async function faceTheProctor(): Promise<void> {
  if (finished || siegeRunning) return;
  siegeRunning = true;
  el.faceProctor.disabled = true;

  const paper = buildSiege(DP600_QUESTIONS, state.seed);
  const correctIds = new Set<string>();
  log(`The Proctor sets ${paper.length} questions.`, 'bad');

  try {
    for (const entry of paper) {
      const request = {
        kind: 'boss' as const,
        topicId: `exam-${entry.position}`,
        tier: 3 as const,
        timeLimitMs: timeLimit(SIEGE_QUESTION_MS),
      };
      const given = await modal.ask({ question: entry.question, request });
      const answer = given.answer;
      const correct =
        !given.abandoned &&
        answer !== undefined &&
        (Array.isArray(answer) ? answer.length > 0 : String(answer).length > 0) &&
        (await checkAnswer(entry.question.id, answer, entry.question.answerHash));

      if (correct) correctIds.add(entry.question.id);

      // The schedule learns from the exam too.
      mastery.record(
        topicIdForSkill(entry.question.skillId) ?? entry.question.id,
        scoreFor(correct, given.elapsedMs, request.timeLimitMs, given.abandoned),
        given.abandoned,
      );

      await modal.reveal({
        question: entry.question,
        correct,
        given: answer,
        correctAnswer: await revealCorrectAnswer(entry.question),
        explanation: undefined,
        score: correct ? 1 : -1,
        elapsedMs: given.elapsedMs,
      });
    }
  } finally {
    siegeRunning = false;
    el.faceProctor.disabled = false;
  }

  const result = scoreSiege(paper, correctIds);
  const percent = Math.round(result.share * 100);

  if (!result.passed) {
    log(
      `The Proctor is unconvinced: ${result.correct} of ${result.asked} (${percent}%). Study and try again.`,
      'bad',
    );
    refreshReadiness();
  refreshThreats();
    return;
  }

  finished = true;
  el.endTurn.disabled = true;
  el.faceProctor.hidden = true;
  endScreen.show(
    {
      kind: 'exam',
      summary: `${result.correct} of ${result.asked} correct, ${percent} percent. The Proctor has no further questions.`,
    },
    {
      turn: state.turn,
      skills: `${state.research.known.length}/${state.topics.nodes.length}`,
      cities: [...state.cities.values()].filter((c) => c.factionId === PLAYER_FACTION_ID).length,
      cheats: state.cheatsUsed,
    },
  );
}

/**
 * Who is coming, and what they will ask about.
 *
 * ⚠️ **This panel is what makes the central mechanic legible.** Each faction
 * quizzes one cluster of the outline, so who is marching on you tells you what
 * you are about to be tested on. That has been true in the code for a while
 * and completely invisible on screen: a player could be raided by the Scan
 * Wraiths four times without ever learning that the Scan Wraiths mean B3, or
 * that B3 is the branch they have not revised.
 *
 * It joins the two halves of the game in one row: where a faction is, from the
 * engine, and how ready you are for it, from the learning layer.
 */
function refreshThreats(): void {
  const model = libraryModel();

  // Retention per cluster, which is the number that makes a distance mean
  // something. Six hexes away is fine if you know the material.
  const readiness = new Map<string, { label: string; retained: number; total: number }>();
  for (const branch of model.branches) {
    for (const cluster of branch.clusters) {
      const retained = cluster.skills.filter(
        (s) => s.band === 'familiar' || s.band === 'strong',
      ).length;
      readiness.set(cluster.id, {
        label: cluster.label,
        retained,
        total: cluster.skills.length,
      });
    }
  }

  const mine = [
    ...unitsOf(state, PLAYER_FACTION_ID).map((u) => u.hex),
    ...[...state.cities.values()].filter((c) => c.factionId === PLAYER_FACTION_ID).map((c) => c.hex),
  ];
  const limit = aggroRadius(state.turn);

  // ⚠️ Only the factions this game actually has. A game can be started with
  // three rivals rather than seven, and listing all of them would have shown
  // four enemies that do not exist, permanently "gone" and at infinite range.
  const rows = ANTAGONISTS.filter((a) => state.factions.has(a.id)).map((antagonist) => {
    const units = unitsOf(state, antagonist.id);
    let distance = Number.POSITIVE_INFINITY;
    for (const unit of units) {
      for (const hex of mine) distance = Math.min(distance, hexDistance(unit.hex, hex));
    }
    return { antagonist, alive: units.length > 0, distance };
  }).sort((a, b) => a.distance - b.distance);

  el.threatsList.replaceChildren();

  for (const row of rows) {
    const cluster = readiness.get(row.antagonist.topicCluster);
    const share = cluster && cluster.total > 0 ? cluster.retained / cluster.total : 0;

    const node = document.createElement('div');
    node.className = 'foe';
    if (!row.alive) node.classList.add('gone');
    else if (Number.isFinite(row.distance) && row.distance <= limit) node.classList.add('closing');

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = row.antagonist.colour;

    const middle = document.createElement('div');
    const name = document.createElement('b');
    name.textContent = row.antagonist.label;
    const what = document.createElement('span');
    what.className = 'cluster';
    what.textContent = cluster
      ? `${row.antagonist.topicCluster} ${cluster.label}`
      : row.antagonist.topicCluster;
    middle.append(name, what);

    const right = document.createElement('div');
    right.className = 'range';
    right.textContent = !row.alive
      ? 'broken'
      : !Number.isFinite(row.distance)
        ? '-'
        : row.distance <= limit
          ? `${row.distance} closing`
          : `${row.distance} hexes`;

    if (cluster) {
      const ready = document.createElement('span');
      ready.className = `ready ${share >= 0.6 ? 'solid' : share < 0.3 ? 'weak' : ''}`;
      ready.textContent = t('{known}/{total} known', {
        known: cluster.retained,
        total: cluster.total,
      });
      right.append(ready);
    }

    node.append(swatch, middle, right);
    el.threatsList.append(node);
  }
}

function refreshHud(): void {
  const resources = state.factions.get(PLAYER_FACTION_ID)!.resources;
  el.turn.textContent = t('Turn {n}', { n: state.turn });
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
  const shape = WORLD_SHAPES.find((s) => s.id === lastSetup.shape);
  const size = WORLD_SIZES.find((s) => s.id === lastSetup.size);
  const roster = rosterFor(ANTAGONISTS, lastSetup.focus, lastSetup.rivals);
  adopt(
    createGameState(seed, {
      map: worldOptions(lastSetup),
      topics: provider.topics(),
      antagonistIds: roster,
    }),
    t('New empire on seed {seed}. {shape}, {size}, {rivals} rivals.', {
      seed,
      shape: t(shape?.label ?? ''),
      // ⚠️ Not lower-cased. English happily reads "one great continent,
      // standard", and German capitalises its nouns, so the same call that
      // tidies one language misspells the other.
      size: t(size?.label ?? ''),
      rivals: roster.length,
    }),
  );
  // Write immediately rather than waiting for the first turn to end, so a
  // player who starts a game and closes the tab comes back to that game and
  // not to the one before it.
  saveGame(slot, state);
}

/**
 * Ask what kind of world, then build it.
 *
 * ⚠️ The await is what lets the setup screen double as a loading screen. Map
 * generation and the terrain build together measured 8.1 seconds on the
 * enlarged map (section 22.2), and until now every second of that was a blank
 * page. Now it is spent on a menu, and the world appears when the player has
 * finished choosing rather than before they have started.
 */
async function askAndStart(): Promise<void> {
  lastSetup = await setup.ask(lastSetup);
  buildSecondSeat();
  newGame(lastSetup.seed);
  // Build the shaders before the film starts rather than during it. The world
  // exists by now and the setup screen is still up, which is the last moment
  // nobody is watching the frame rate.
  await scene.world.prewarm();
  await playOpening();
}

/**
 * The opening: four shots over the world that has just been generated.
 *
 * ⚠️ **Runs after `newGame`, and that ordering is the whole feature.** The
 * sequence flies over the map the player just chose the shape and the seed
 * for, so it cannot be recorded once and reused, and it is not the same film
 * twice. It is also why the music may start: clicking Begin is the user
 * gesture browsers require before any audio will play.
 */
async function playOpening(): Promise<void> {
  const home = homeOfPlayer();
  if (!home) return;

  const shots = introShots({
    centre: scene.groundAt({ q: 0, r: 0 }),
    // Hex centres are 2 * cos(30) apart, so this is the map's real reach.
    extent: Math.max(12, (state.map.radius ?? 45) * 1.732 * 0.62),
    home,
  });

  openingSkipped = false;
  openingRunning = true;
  revealingForOpening = true;
  /*
   * ⚠️ Lift the fog BEFORE the music, not between the music and the first cut.
   *
   * Rebuilding the fog for several thousand hexes blocks the main thread for
   * the best part of a second. Doing it after `anthem.start()` handed the
   * anthem a head start over a film that had not begun animating yet.
   */
  refreshFog();

  anthem.start();
  /*
   * ⚠️ And wait for the anthem to be genuinely playing before the first card.
   *
   * `play()` resolves long before audio actually reaches the speakers: the
   * anthem was measured starting about 0.85 s after the film did, so every
   * card sat that far ahead of the line it names. Small next to the passage
   * the sequence used to be out by, and free to remove.
   *
   * Capped, because a build with no anthem file will never start one, and the
   * film must not wait on something that is never coming.
   */
  const startedBy = performance.now() + 900;
  while (anthem.available && anthem.at === 0 && performance.now() < startedBy) {
    await new Promise((resolve) => window.setTimeout(resolve, 30));
  }

  try {
    for (const shot of shots) {
      if (finished || openingSkipped) break;
      // ⚠️ The Latin titles are NOT translated. They are the words of the anthem
      // and the same in every language, which is the whole reason the film uses
      // Latin (D255). Only the English glosses beneath them change.
      cinemaOverlay.show(shot.title, t(shot.subtitle));
      // The fog falls on the last beat, under the title, rather than after the
      // sequence has ended. Letting it happen off screen wastes the one moment
      // the player can see what was taken away from them.
      if (shot.id === 'intro-title' && revealingForOpening) {
        revealingForOpening = false;
        fogSignature = '';
        refreshFog();
      }
      await scene.cinema.play(shot);
    }
  } finally {
    revealingForOpening = false;
    openingRunning = false;
    fogSignature = '';
    refreshFog();
    cinemaOverlay.hide();
    anthem.fade();
    /*
     * The handover.
     *
     * ⚠️ **Delayed past the anthem's fade on purpose.** `fade()` returns
     * immediately and takes 1.6 seconds to finish, so starting the score here
     * would put the first background track underneath the last bar of the
     * anthem. The wait is the fade plus a breath, which also gives the player
     * a moment of the world in silence before the music comes back.
     */
    window.setTimeout(() => music.start(), 2_400);
  }
}

/** Where the player's people are standing, on the ground, or nothing. */
function homeOfPlayer(): Vector3 | undefined {
  const mine = unitsOf(state, PLAYER_FACTION_ID);
  const first = mine[0];
  return first ? scene.groundAt(first.hex) : undefined;
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
  proctorAnnounced = false;
  siegeRunning = false;
  seenCinematics.clear();
  scene.cinema.skip();
  cinemaOverlay.hide();
  raidAlert.hide();
  el.endTurn.disabled = false;
  el.faceProctor.disabled = false;
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
  refreshFog();
  refreshCities();
  refreshReadiness();
  refreshThreats();
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
  // No game to resume, so ask what kind of world this one should be.
  void askAndStart();
  if (loaded.reason === 'unreadable') {
    log(t('A saved game was found but could not be read, so this is a new one.'), 'bad');
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

  /*
   * The cheat console, on the traditional key.
   *
   * Checked before everything else so it can always be closed, and its own
   * input stops propagation so typing a code cannot also play the game.
   */
  if (e.key === '`' || e.key === '~') {
    e.preventDefault();
    cheats.toggle();
    return;
  }
  if (cheats.isOpen() && e.key === 'Escape') {
    cheats.hide();
    return;
  }

  // Unit actions are refused while a raid is being watched, for the same
  // reason clicks are: the world on screen is a turn behind the engine.
  if (resolvingTurn && e.key !== 'l') return;

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
  } else if (e.key === 'p') {
    doRaid();
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
el.faceProctor.addEventListener('click', () => void faceTheProctor());
el.actFound.addEventListener('click', doFound);
el.actRaid.addEventListener('click', doRaid);
el.actFortify.addEventListener('click', doFortify);
el.actSkip.addEventListener('click', doSkip);
el.actCouncil.addEventListener('click', () => void doCouncil());
el.seedGo.addEventListener('click', () => {
  lastSetup = { ...lastSetup, seed: el.seedInput.value };
  void askAndStart();
});
el.seedInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    lastSetup = { ...lastSetup, seed: el.seedInput.value };
    void askAndStart();
  }
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

/**
 * What the player can see this instant.
 *
 * Held here and recomputed only when the world changes, because `sync` runs
 * every frame and walking every unit's sight radius per frame would be a
 * measurable cost for an answer that only moves when something moves.
 */
let currentSight: ReadonlySet<string> = new Set();

/**
 * Rebuild the fog.
 *
 * ⚠️ **Only when the ground actually changed.** Merging six thousand hex
 * patches is the most expensive thing in this file, and the explored set only
 * grows, so the signature is its size plus the current sight. Rebuilding on
 * every sync would have made selecting a unit cost more than ending a turn.
 */
let fogSignature = '';

/**
 * The opening sees the whole world; the game does not.
 *
 * ⚠️ **Measured: the establishing shots were 73 to 82 percent black without
 * this.** The opening runs at turn one, when a player has explored 61 of 6,211
 * hexes, so "here is the world you are about to play" was in fact a small lit
 * patch in a void, and the widest, slowest, most expensive shot in the
 * sequence was the emptiest thing on screen.
 *
 * Lifting it for the film is not a cheat, it is the better reading of the
 * scene. The land rises out of nothing, whole, and then the fog falls on it
 * and you are left knowing only your own corner. That is the same order the
 * words are in.
 */
let revealingForOpening = false;

function refreshFog(): void {
  currentSight = sightOf(state, PLAYER_FACTION_ID);

  if (revealingForOpening) {
    fogSignature = 'opening';
    scene.setFog([], []);
    dirty = true;
    return;
  }

  const signature = `${state.explored.size}:${currentSight.size}:${state.seed}`;
  if (signature === fogSignature) return;
  fogSignature = signature;

  const unseen: Hex[] = [];
  const remembered: Hex[] = [];
  for (const [key, tile] of state.map.tiles) {
    if (currentSight.has(key)) continue;
    if (state.explored.has(key)) remembered.push(tile.hex);
    else unseen.push(tile.hex);
  }

  scene.setFog(unseen, remembered);
  dirty = true;
}

function refreshCorruption(): void {  const next = new Set<string>();
  const hexes: Hex[] = [];

  /*
   * ⚠️ Two sources, and the first one was missing entirely.
   *
   * D56 says the Ungoverned Wastes are corrupted ground in their own right,
   * not only the tiles an antagonist has taken. Without the wastes the effect
   * would not appear at all until a faction founded a city, which none of them
   * currently do, so the whole thing would have stayed invisible on a second
   * count.
   */
  for (const tile of state.map.tiles.values()) {
    if (tile.terrain !== 'ungovernedWastes') continue;
    const key = hexKey(tile.hex);
    if (next.has(key)) continue;
    next.add(key);
    hexes.push(tile.hex);
  }

  const territory = cityTerritory(state);
  for (const [key, cityId] of territory) {
    const city = state.cities.get(cityId);
    // Any antagonist's ground is corrupted, not just the Silo Horde's. This
    // checked one hard-coded faction id and would have silently ignored the
    // other six the moment they took a city.
    if (!city || city.factionId === PLAYER_FACTION_ID) continue;
    if (next.has(key)) continue;
    next.add(key);
    const hex = territoryHex(key);
    if (hex) hexes.push(hex);
  }

  corrupted = next;
  scene.setCorrupted(hexes);
}

/** Recover a hex from a map key, since city territory is keyed rather than typed. */
function territoryHex(key: string): Hex | undefined {
  return state.map.tiles.get(key)?.hex;
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
      settleSites: settleSuggestions.map((s) => s.hex),
      hover,
      unitOffset: unitWorldOffset,
      unitOpacity: (id) => effects.opacityOf(id),
      visibleHexes: currentSight,
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
      playerCityCount: () => number;
      resources: () => Record<string, number>;
      selected: () => string | undefined;
      unitById: (id: string) =>
        | {
            typeId: string;
            hp: number;
            movesLeft: number;
            movement: number;
            fortified: boolean;
          }
        | undefined;
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
      readiness: () => number;
      proctorReady: () => boolean;
      faceProctor: () => Promise<void>;
      studyAll: (times: number) => void;
      answerOpen: (correct?: boolean) => Promise<string | undefined>;
      openQuestion: () => Promise<
        { id: string; isOpen: boolean; options: number; accepted: number[] } | undefined
      >;
      terrainProbe: () => unknown;
      vision: () => {
        total: number;
        explored: number;
        visible: number;
        hidden: number;
      };
      cheatsUsed: () => string[];
      exploredCount: () => number;
      drownedLand: () => { land: number; below: number; share: number };
      /**
       * The live three.js objects.
       *
       * Present so a lighting question can be answered by toggling one thing
       * at a time in a running page instead of by editing, rebuilding and
       * re-photographing for every hypothesis. Diagnosing the terrain by
       * screenshot alone cost several wrong guesses in a row.
       */
      gfx: () => unknown;
      /**
       * Put the camera on a hex at a given distance, immediately.
       *
       * For photographing one village or one unit close up. Judging a model
       * from the map camera is judging a thing four hundred pixels away.
       */
      look: (hex: Hex, distance?: number) => void;
      playOpening: () => Promise<void>;
      anthemReady: () => boolean;
      /** Seconds into the anthem, or 0 when it is not playing. */
      anthemTime: () => number;
      /**
       * What the background score is doing.
       *
       * ⚠️ The player builds detached `Audio` objects, so a check running in
       * the page cannot find them with a DOM query and has no other way to
       * tell music from silence. Reported here rather than inferred.
       */
      music: () => {
        available: boolean;
        muted: boolean;
        playing: string | undefined;
        volume: number;
      };
      /**
       * Render a cinematic's cue without playing it, and measure it.
       *
       * ⚠️ The unit tests can check which note sounds when and can never
       * check that the graph makes a sound, because WebAudio does not exist
       * under test. This renders the real code into an `OfflineAudioContext`
       * and returns the peak and RMS of the samples, which is the difference
       * between "the cue was scheduled" and "the cue is audible".
       */
      renderCue: (id: string) => Promise<{ peak: number; rms: number; seconds: number }>;
      setRank: (
        rank: string,
        population: number,
      ) => { rank: string; population: number; label: string } | undefined;
      showcase: (typeIds: string[], centre: Hex) => string[];
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
  // ⚠️ Every settlement on the map, the player's and all seven villages. It
  // used to be the same number as the player's because nobody else had a city.
  cityCount: () => state.cities.size,
  playerCityCount: () =>
    [...state.cities.values()].filter((c) => c.factionId === PLAYER_FACTION_ID).length,
  resources: () => ({ ...state.factions.get(PLAYER_FACTION_ID)!.resources }),
  selected: () => selectedUnitId,
  /**
   * One unit, flattened.
   *
   * ⚠️ A fortified unit is deliberately skipped by next-idle cycling, so the
   * selection panel cannot be steered back onto it and a browser check has no
   * other way to ask what happened to it across a turn.
   */
  unitById: (id: string) => {
    const unit = state.units.get(id);
    return unit
      ? {
          typeId: unit.typeId,
          hp: unit.hp,
          movesLeft: unit.movesLeft,
          movement: unitType(unit.typeId).movement,
          fortified: unit.fortified,
        }
      : undefined;
  },
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
  readiness: () => libraryModel().examRetained,
  proctorReady: () => proctorReady(libraryModel()),
  faceProctor: () => faceTheProctor(),
  /**
   * Answer every topic correctly, repeatedly.
   *
   * Reaching the Proctor honestly means researching and revising most of the
   * outline, which is many turns. This is the only way an automated check can
   * reach the endgame at all.
   */
  studyAll: (times: number) => {
    for (let i = 0; i < times; i++) {
      for (const node of state.topics.nodes) mastery.record(node.id, 1, false);
    }
    refreshReadiness();
  refreshThreats();
  },
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
  /**
   * What the player can currently see, and what they remember.
   *
   * ⚠️ Fog is the one feature whose whole point is that things are NOT drawn,
   * so "it looks right" is not evidence and a screenshot cannot count. These
   * are the numbers a test can assert on.
   */
  vision: () => ({
    total: state.map.tiles.size,
    explored: state.explored.size,
    visible: currentSight.size,
    hidden: state.map.tiles.size - state.explored.size,
  }),
  cheatsUsed: () => [...state.cheatsUsed],
  exploredCount: () => state.explored.size,
  /*
   * How much of the land is drawn under the sea.
   *
   * ⚠️ The map and the render can disagree, and when they do it is the render
   * that the player believes. The generator can report one compact continent
   * while the screen shows thin ribbons, because a land tile whose surface
   * ends up below the water plane simply is not land any more as far as anyone
   * looking at it is concerned. Nothing measured this before.
   */
  drownedLand: () => {
    let land = 0;
    let below = 0;
    for (const tile of state.map.tiles.values()) {
      if (tile.terrain === 'onelake') continue;
      land += 1;
      if (scene.groundAt(tile.hex).y <= SEA_LEVEL) below += 1;
    }
    return { land, below, share: land === 0 ? 0 : +(below / land).toFixed(3) };
  },

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
  look: (hex: Hex, distance = 8) => scene.focusWorld(scene.groundAt(hex), distance),
  /** Replay the opening. Exists so the trailer can be recorded from the game. */
  playOpening: () => playOpening(),
  anthemReady: () => anthem.available,
  anthemTime: () => anthem.at,
  music: () => ({
    available: music.available,
    muted: music.muted,
    playing: music.nowPlaying,
    volume: music.volume,
  }),
  renderCue: async (id: string) => {
    const seconds = 8;
    const rate = 44_100;
    const offline = new OfflineAudioContext(2, rate * seconds, rate);
    createCues(() => offline).play(id);
    const rendered = await offline.startRendering();
    const data = rendered.getChannelData(0);
    let peak = 0;
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = Math.abs(data[i]!);
      if (v > peak) peak = v;
      sum += data[i]! * data[i]!;
    }
    return { peak, rms: Math.sqrt(sum / data.length), seconds };
  },
  /**
   * Force the player's first settlement to a rank.
   *
   * For photographing all five without playing a whole game to reach the last
   * one. Sets population too, because a rank with the wrong number of people
   * in it would be a picture of a state the rules cannot produce.
   */
  setRank: (rank: string, population: number) => {
    const city = [...state.cities.values()].find((c) => c.factionId === PLAYER_FACTION_ID);
    if (!city) return undefined;
    const cities = new Map(state.cities);
    cities.set(city.id, { ...city, rank: rank as CityRank, population });
    state = { ...state, cities };
    dirty = true;
    return { rank, population, label: rankInfo(rank as CityRank).label };
  },
  quality: (level: 'high' | 'low') => {
    scene.setQuality(level === 'low' ? LOW_QUALITY : HIGH_QUALITY);
    fitCanvas();
  },
  /**
   * Line up one unit of each type on neighbouring hexes.
   *
   * For photographing the roster side by side. Comparing two units by playing
   * until you own both takes a whole game, and "do these read as different
   * things" is a question about a single frame.
   */
  showcase: (typeIds: string[], centre: Hex) => {
    const units = new Map(state.units);
    for (const [id, u] of units) if (u.factionId === PLAYER_FACTION_ID) units.delete(id);

    const placed: string[] = [];
    let next = state.nextEntityId;
    for (const [i, typeId] of typeIds.entries()) {
      const hex = i === 0 ? centre : hexNeighbour(centre, (i - 1) % 6);
      const tile = state.map.tiles.get(hexKey(hex));
      if (!tile || tile.terrain === 'onelake') continue;
      const id = `showcase-${next++}`;
      units.set(id, {
        id,
        typeId: typeId as Unit['typeId'],
        factionId: PLAYER_FACTION_ID,
        hex,
        hp: 100,
        movesLeft: 2,
        fortified: false,
      });
      placed.push(`${typeId}@${hex.q},${hex.r}`);
    }
    state = { ...state, units, nextEntityId: next };
    dirty = true;
    return placed;
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
