import {
  PLAYER_FACTION_ID,
  canAttack,
  canFoundCity,
  centreOn,
  cityAt,
  clampToBounds,
  completeResearch,
  createCamera,
  createGameState,
  endTurn,
  fortifyUnit,
  foundCity,
  hexAtScreen,
  hexKey,
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
import { drawMap } from './render/mapRenderer.js';
import { drawEntities } from './render/entityRenderer.js';
import { createQuestionModal } from './ui/questionModal.js';

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
    const outcome = resolveAttack(state, unit.id, target, { challengeScore });
    if (!outcome.ok) {
      log(outcome.reason, 'bad');
      return;
    }
    state = outcome.result.state;
    const { log: battle } = outcome.result;
    const odds = preview
      ? ` (${Math.round(preview.attacker.effective)} vs ${Math.round(preview.defender.effective)})`
      : '';
    if (challengeScore > 0) {
      log(`Your answer strengthened the attack.`, 'good');
    } else if (challengeScore < 0) {
      log(`Your answer weakened the attack.`, 'bad');
    }
    log(
      `Attack${odds}: dealt ${battle.damageToDefender}, took ${battle.damageToAttacker}`,
      battle.damageToDefender >= battle.damageToAttacker ? 'good' : 'bad',
    );
    if (battle.defenderDestroyed) log('Enemy unit destroyed.', 'good');
    if (battle.attackerDestroyed) log('Your unit was destroyed.', 'bad');
    if (battle.cityCaptured) log('City captured.', 'good');
    refreshSelection();
    dirty = true;
    return;
  }

  const moved = moveUnit(state, unit.id, target);
  if (!moved.ok) {
    log(moved.reason, 'bad');
    return;
  }
  state = moved.state;
  refreshSelection();
  dirty = true;
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

function frame(): void {
  if (dirty) {
    const started = performance.now();
    drawMap(ctx, state.map, camera, { hover, selected: undefined });
    drawEntities(ctx, state, camera, {
      selectedUnitId,
      reachable: reach,
      attackTargets,
      hover,
    });
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
  clickHex: (hex) => void actOn(hex),
  endTurn: () => doEndTurn(),
};
