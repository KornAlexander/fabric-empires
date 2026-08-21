import {
  clampToBounds,
  createCamera,
  generateMap,
  hexAtScreen,
  hexKey,
  normaliseSeed,
  panByScreen,
  resize,
  terrain,
  tileYields,
  worldBounds,
  zoomAt,
  ZOOM_LEVELS,
  zoomIndexOf,
  type Camera,
  type GameMap,
  type Hex,
} from '@fabric-empires/engine';
import { drawMap } from './render/mapRenderer.js';

const canvas = document.querySelector<HTMLCanvasElement>('#map')!;
const ctx = canvas.getContext('2d')!;

const el = {
  seed: document.querySelector<HTMLElement>('#hud-seed')!,
  land: document.querySelector<HTMLElement>('#hud-land')!,
  zoom: document.querySelector<HTMLElement>('#hud-zoom')!,
  drawn: document.querySelector<HTMLElement>('#hud-drawn')!,
  frame: document.querySelector<HTMLElement>('#hud-frame')!,
  tileName: document.querySelector<HTMLElement>('#tile-name')!,
  tileYields: document.querySelector<HTMLElement>('#tile-yields')!,
  tileCoords: document.querySelector<HTMLElement>('#tile-coords')!,
  seedInput: document.querySelector<HTMLInputElement>('#seed-input')!,
  seedGo: document.querySelector<HTMLButtonElement>('#seed-go')!,
};

let map: GameMap = generateMap('FABRIC');
let camera: Camera = createCamera({ width: 1, height: 1 });
let hover: Hex | undefined;
let selected: Hex | undefined;
let dirty = true;

function viewportSize(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Size the backing store to the device pixel ratio, then scale the context
 * once. Everything downstream can then work in CSS pixels and still be sharp
 * on a high-DPI display.
 */
function fitCanvas(): void {
  const { width, height } = viewportSize();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  camera = clampToBounds(resize(camera, { width, height }), worldBounds(map.radius));
  dirty = true;
}

function landShare(m: GameMap): string {
  let land = 0;
  for (const tile of m.tiles.values()) if (tile.terrain !== 'onelake') land++;
  return `${((land / m.tiles.size) * 100).toFixed(1)}%`;
}

function loadSeed(raw: string): void {
  const seed = normaliseSeed(raw);
  map = generateMap(seed);
  selected = undefined;
  hover = undefined;
  el.seedInput.value = seed;
  camera = clampToBounds(camera, worldBounds(map.radius));
  dirty = true;
}

function describeTile(h: Hex | undefined): void {
  if (!h) {
    el.tileName.textContent = 'Hover a tile';
    el.tileYields.innerHTML = '&nbsp;';
    el.tileCoords.innerHTML = '&nbsp;';
    return;
  }
  const tile = map.tiles.get(hexKey(h));
  if (!tile) {
    el.tileName.textContent = 'Beyond the map';
    el.tileYields.innerHTML = '&nbsp;';
    el.tileCoords.textContent = `${h.q}, ${h.r}`;
    return;
  }

  const info = terrain(tile.terrain);
  const y = tileYields(tile.terrain, tile.river);
  const parts: string[] = [];
  if (y.data) parts.push(`Data ${y.data}`);
  if (y.compute) parts.push(`Compute ${y.compute}`);
  if (y.cu) parts.push(`CU ${y.cu}`);
  if (y.trust) parts.push(`Trust ${y.trust}`);

  el.tileName.textContent = info.label + (tile.river ? ' (river)' : '');
  el.tileYields.textContent = parts.length > 0 ? parts.join('  ') : 'No yield';
  el.tileCoords.textContent =
    `${h.q}, ${h.r}  ` +
    `elev ${tile.elevation.toFixed(2)}  ` +
    (Number.isFinite(info.moveCost) ? `move ${info.moveCost}` : 'impassable');
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
    camera = clampToBounds(panByScreen(camera, dx, dy), worldBounds(map.radius));
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
  // A drag that barely moved is a click, so selection still works even if the
  // hand wobbles on the way down.
  if (dragMoved < 4) {
    const picked = hexAtScreen(camera, { x: e.clientX, y: e.clientY });
    selected = map.tiles.has(hexKey(picked)) ? picked : undefined;
    dirty = true;
  }
}

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const steps = e.deltaY < 0 ? 1 : -1;
    camera = clampToBounds(
      zoomAt(camera, steps, { x: e.clientX, y: e.clientY }),
      worldBounds(map.radius),
    );
    dirty = true;
  },
  { passive: false },
);

window.addEventListener('keydown', (e) => {
  const step = 80;
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [step, 0],
    ArrowRight: [-step, 0],
    ArrowUp: [0, step],
    ArrowDown: [0, -step],
  };
  const move = moves[e.key];
  if (move) {
    e.preventDefault();
    camera = clampToBounds(
      panByScreen(camera, move[0], move[1]),
      worldBounds(map.radius),
    );
    dirty = true;
  }
  if (e.key === '+' || e.key === '=') {
    camera = clampToBounds(zoomAt(camera, 1), worldBounds(map.radius));
    dirty = true;
  }
  if (e.key === '-' || e.key === '_') {
    camera = clampToBounds(zoomAt(camera, -1), worldBounds(map.radius));
    dirty = true;
  }
});

window.addEventListener('resize', fitCanvas);
el.seedGo.addEventListener('click', () => loadSeed(el.seedInput.value));
el.seedInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadSeed(el.seedInput.value);
});

// Render loop ----------------------------------------------------------

let frameMs = 0;

function frame(): void {
  if (dirty) {
    const started = performance.now();
    const stats = drawMap(ctx, map, camera, { hover, selected });
    frameMs = performance.now() - started;
    dirty = false;

    el.seed.textContent = map.seed;
    el.land.textContent = landShare(map);
    el.zoom.textContent = `${ZOOM_LEVELS[zoomIndexOf(camera)]!.toFixed(2)}x`;
    el.drawn.textContent = `${stats.drawn} / ${map.tiles.size}`;
    el.frame.textContent = `${frameMs.toFixed(1)} ms`;
  }
  requestAnimationFrame(frame);
}

fitCanvas();
loadSeed('FABRIC');
requestAnimationFrame(frame);

// Exposed for automated checks: lets a test assert the map actually rendered
// rather than assuming a screenshot means success.
declare global {
  interface Window {
    __fabricEmpires?: {
      seed: () => string;
      tileCount: () => number;
      lastFrameMs: () => number;
      hexAt: (x: number, y: number) => Hex;
    };
  }
}

window.__fabricEmpires = {
  seed: () => map.seed,
  tileCount: () => map.tiles.size,
  lastFrameMs: () => frameMs,
  hexAt: (x, y) => hexAtScreen(camera, { x, y }),
};
