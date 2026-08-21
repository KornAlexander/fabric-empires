import {
  ANTAGONIST_FACTION_ID,
  PLAYER_FACTION_ID,
  canAttack,
  canFoundCity,
  centreOn,
  cityAt,
  cityTerritory,
  clampToBounds,
  completeResearch,
  createCamera,
  createGameState,
  endTurn,
  fortifyUnit,
  foundCity,
  hexAtScreen,
  hexKey,
  hexNeighbour,
  hexToScreen,
  moveUnit,
  normaliseSeed,
  panByScreen,
  previewAttack,
  reachable,
  researchCost,
  researchProgress,
  researchable,
  resize,
  resolveAttack,
  selectableUnitAt,
  skipUnit,
  startResearch,
  terrain,
  tileYields,
  topicById,
  unitAt,
  unitType,
  unitsOf,
  worldBounds,
  zoomAt,
  type Camera,
  type GameState,
  type Hex,
  type ReachableTile,
} from '@fabric-empires/engine';
import { Dp600ChallengeProvider, createQuestionPresenter } from '@fabric-empires/learn';
import { drawMap, drawVignette } from './render/mapRenderer.js';
import { drawEntities } from './render/entityRenderer.js';
import { createEffects } from './render/effects.js';
import { createQuestionModal } from './ui/questionModal.js';
import { createBattleBanner, type BattleSide } from './ui/battleBanner.js';

/**
 * The learning layer, injected at the edge of the app.
 *
 * The engine receives only the topic graph and, later, a score. Everything
 * about DP-600 lives on this side of the line (D35).
 */
const modal = createQuestionModal();
const askedThisSession = new Set<string>();
const provider = new Dp600ChallengeProvider({
  presenter: createQuestionPresenter(modal, { asked: askedThisSession }),
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

const canvas = document.querySelector<HTMLCanvasElement>('#map')!;
const ctx = canvas.getContext('2d')!;

const el = {
  turn: document.querySelector<HTMLElement>('#turn-badge')!,
  compute: document.querySelector<HTMLElement>('#res-compute')!,
  cu: document.querySelector<HTMLElement>('#res-cu')!,
  trust: document.querySelector<HTMLElement>('#res-trust')!,
  endTurn: document.querySelector<HTMLButtonElement>('#end-turn')!,
  seedInput: document.querySelector<HTMLInputElement>('#seed-input')!,
  seedGo: document.querySelector<HTMLButtonElement>('#seed-go')!,
  tileName: document.querySelector<HTMLElement>('#tile-name')!,
  tileDetail: document.querySelector<HTMLElement>('#tile-detail')!,
  selTitle: document.querySelector<HTMLElement>('#sel-title')!,
  selDetail: document.querySelector<HTMLElement>('#sel-detail')!,
  actFound: document.querySelector<HTMLButtonElement>('#act-found')!,
  actFortify: document.querySelector<HTMLButtonElement>('#act-fortify')!,
  actSkip: document.querySelector<HTMLButtonElement>('#act-skip')!,
  log: document.querySelector<HTMLElement>('#log')!,
  resTitle: document.querySelector<HTMLElement>('#res-title')!,
  resBar: document.querySelector<HTMLElement>('#res-bar')!,
  resStatus: document.querySelector<HTMLElement>('#res-status')!,
  resOptions: document.querySelector<HTMLElement>('#res-options')!,
};

let state: GameState = createGameState('FABRIC', { topics: provider.topics() });
let camera: Camera = createCamera({ width: 1, height: 1 });
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
  camera = clampToBounds(centreOn(camera, next.hex), worldBounds(state.map.radius));
}

// Actions --------------------------------------------------------------

/**
 * Which topic a battle against this faction asks about.
 *
 * Each antagonist is bound to a cluster of the outline, so who is attacking
 * tells the player what they are about to be tested on. That is the whole
 * design: the opposition is a study planner wearing a helmet.
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
  return pool[Math.floor(Math.random() * pool.length)]!.id;
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

  if (dramatic) {
    camera = clampToBounds(centreOn(camera, target), worldBounds(state.map.radius));
    dirty = true;
    await wait(220);
  }

  // A melee unit throws itself at the target; a ranged one stays put and
  // sends a pulse instead, which is the whole visual difference between the
  // two and costs one branch.
  if (ranged) {
    effects.pulse(attacker.hex, attackerColour, 1.2);
    await wait(dramatic ? 320 : 160);
  } else {
    await effects.lunge(unitId, attacker.hex, target);
  }

  const outcome = resolveAttack(state, unitId, target, { challengeScore });
  if (!outcome.ok) {
    log(outcome.reason, 'bad');
    return;
  }
  state = outcome.result.state;
  const { log: battle } = outcome.result;

  // Impact.
  effects.flash(target, '#ffe6a8', dramatic ? 420 : 260);
  effects.pulse(target, defenderColour, dramatic ? 2.1 : 1.5);
  effects.shake(Math.min(14, 3 + battle.damageToDefender * 0.16) * (dramatic ? 1.5 : 1));
  if (battle.damageToDefender > 0) {
    effects.floatingText(target, `-${battle.damageToDefender}`, '#ffcf7a', dramatic ? 1.4 : 1.1);
  }
  if (battle.damageToAttacker > 0) {
    effects.floatingText(
      attacker.hex,
      `-${battle.damageToAttacker}`,
      '#ff9b91',
      dramatic ? 1.2 : 1,
    );
  }
  if (battle.defenderDestroyed && defenderUnit) effects.dissolve(defenderUnit.id);
  if (battle.attackerDestroyed) effects.dissolve(unitId);
  if (battle.cityCaptured) {
    effects.pulse(target, '#8fd694', 3.2);
    effects.floatingText(target, 'CAPTURED', '#8fd694', 1.5);
    effects.shake(18);
  }

  // The banner is the only place the player can see how much the answer was
  // worth, so it waits for the dust rather than competing with it.
  await wait(dramatic ? DRAMA_MS : PUNCH_MS);

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

function doEndTurn(): void {
  const result = endTurn(state);
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
  if (report.researchReadyTopicId) {
    void resolveResearch(report.researchReadyTopicId);
  }

  refreshSelection();
  refreshResearch();
  refreshCorruption();
  dirty = true;
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
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  camera = clampToBounds(resize(camera, { width, height }), worldBounds(state.map.radius));
  dirty = true;
}

function newGame(rawSeed: string): void {
  const seed = normaliseSeed(rawSeed);
  state = createGameState(seed, { topics: provider.topics() });
  hadFirstBattle = false;
  banner.hide();
  el.seedInput.value = seed;
  el.log.replaceChildren();
  log(`New empire on seed ${seed}.`);

  const first = unitsOf(state, PLAYER_FACTION_ID).find((u) => u.typeId === 'architect');
  camera = clampToBounds(camera, worldBounds(state.map.radius));
  if (first) {
    camera = clampToBounds(centreOn(camera, first.hex), worldBounds(state.map.radius));
    select(first.id);
  } else {
    select(undefined);
  }
  refreshHud();
  refreshResearch();
  refreshCorruption();
  dirty = true;
}

// Input ----------------------------------------------------------------

let dragging = false;
let dragMoved = 0;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  dragMoved = 0;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (dragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    camera = clampToBounds(panByScreen(camera, dx, dy), worldBounds(state.map.radius));
    lastX = e.clientX;
    lastY = e.clientY;
    dirty = true;
  }

  const next = hexAtScreen(camera, { x: e.clientX, y: e.clientY });
  if (!hover || hover.q !== next.q || hover.r !== next.r) {
    hover = next;
    describeTile(hover);
    dirty = true;
  }
});

function endDrag(e: PointerEvent): void {
  if (!dragging) return;
  dragging = false;
  canvas.classList.remove('dragging');
  if (dragMoved < 4) {
    void actOn(hexAtScreen(camera, { x: e.clientX, y: e.clientY }));
  }
}

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    camera = clampToBounds(
      zoomAt(camera, e.deltaY < 0 ? 1 : -1, { x: e.clientX, y: e.clientY }),
      worldBounds(state.map.radius),
    );
    dirty = true;
  },
  { passive: false },
);

window.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement | null;
  if (target?.tagName === 'INPUT') return;
  // While a question is on screen the modal owns the keyboard.
  if (modal.isOpen()) return;

  const pans: Record<string, [number, number]> = {
    ArrowLeft: [80, 0],
    ArrowRight: [-80, 0],
    ArrowUp: [0, 80],
    ArrowDown: [0, -80],
  };
  const pan = pans[e.key];
  if (pan) {
    e.preventDefault();
    camera = clampToBounds(
      panByScreen(camera, pan[0], pan[1]),
      worldBounds(state.map.radius),
    );
    dirty = true;
    return;
  }

  if (e.key === ' ') {
    e.preventDefault();
    doEndTurn();
  } else if (e.key === 'n' || e.key === 'Tab') {
    e.preventDefault();
    selectNextIdle();
  } else if (e.key === 'b') {
    doFound();
  } else if (e.key === 'f') {
    doFortify();
  } else if (e.key === 's') {
    doSkip();
  } else if (e.key === '+' || e.key === '=') {
    camera = clampToBounds(zoomAt(camera, 1), worldBounds(state.map.radius));
    dirty = true;
  } else if (e.key === '-') {
    camera = clampToBounds(zoomAt(camera, -1), worldBounds(state.map.radius));
    dirty = true;
  }
});

window.addEventListener('resize', fitCanvas);
el.endTurn.addEventListener('click', doEndTurn);
el.actFound.addEventListener('click', doFound);
el.actFortify.addEventListener('click', doFortify);
el.actSkip.addEventListener('click', doSkip);
el.seedGo.addEventListener('click', () => newGame(el.seedInput.value));
el.seedInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') newGame(el.seedInput.value);
});

// Render loop ----------------------------------------------------------

let frameMs = 0;
const startedAt = performance.now();

/**
 * How often the map redraws when nothing is happening.
 *
 * The world has slow ambient motion: vents flicker, city beams breathe, the
 * corruption tears. Running that at the display refresh rate would burn a
 * core to animate something nobody is looking at, so idle frames are capped
 * well below 60 and the cap is lifted the moment anything real occurs.
 */
const AMBIENT_INTERVAL_MS = 90;
let lastAmbient = 0;

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
    if (city && city.factionId === ANTAGONIST_FACTION_ID) next.add(key);
  }
  corrupted = next;
}

function frame(now: number): void {
  const time = now - startedAt;
  const animating = effects.update(now);
  const ambient = now - lastAmbient >= AMBIENT_INTERVAL_MS;

  if (dirty || animating || ambient) {
    if (ambient) lastAmbient = now;
    const started = performance.now();
    const shake = effects.shakeOffset();

    ctx.save();
    ctx.translate(shake.x, shake.y);
    drawMap(ctx, state.map, camera, { hover, selected: undefined, corrupted, time });
    drawEntities(ctx, state, camera, {
      selectedUnitId,
      reachable: reach,
      attackTargets,
      hover,
      time,
      offsetOf: (id) => effects.offsetOf(id),
      opacityOf: (id) => effects.opacityOf(id),
    });
    effects.draw(ctx, camera);
    ctx.restore();

    // Outside the shake transform, so the frame edge never moves.
    drawVignette(ctx, camera.viewport.width, camera.viewport.height);

    frameMs = performance.now() - started;
    dirty = false;
    refreshHud();
  }
  requestAnimationFrame(frame);
}

fitCanvas();
newGame('FABRIC');
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
      cityCount: () => number;
      resources: () => Record<string, number>;
      selected: () => string | undefined;
      selectFirstIdle: () => void;
      hexAt: (x: number, y: number) => Hex;
      screenOf: (hex: Hex) => { x: number; y: number };
      reachableCount: () => number;
      reachableHexes: () => { q: number; r: number; cost: number }[];
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
      spawnEnemyAdjacent: (unitId: string) => Hex | undefined;
      clickHex: (hex: Hex) => void;
      endTurn: () => void;
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
  hexAt: (x, y) => hexAtScreen(camera, { x, y }),
  screenOf: (hex) => hexToScreen(camera, hex),
  reachableCount: () => reach?.size ?? 0,
  reachableHexes: () =>
    [...(reach?.values() ?? [])].map((entry) => ({
      q: entry.hex.q,
      r: entry.hex.r,
      cost: entry.cost,
    })),
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
