import {
  BASE_HEX_SIZE,
  edgeCornerIndices,
  hexKey,
  hexNeighbour,
  hexToScreen,
  visibleHexes,
  type Camera,
  type GameMap,
  type Hex,
  type MapTile,
} from '@fabric-empires/engine';
import {
  COAST_COLOUR,
  GLITCH_A,
  GLITCH_B,
  HOVER_COLOUR,
  RIDGE_TERRAINS,
  RIVER_COLOUR,
  RIVER_CORE_COLOUR,
  SELECT_COLOUR,
  STRATA_TERRAINS,
  SURF_COLOUR,
  TERRAIN_GLOW,
  VOID_BOTTOM,
  VOID_TOP,
  glowSprite,
  shadeFor,
  tileNoise,
} from './palette.js';

export interface RenderOptions {
  readonly hover?: Hex | undefined;
  readonly selected?: Hex | undefined;
  /** Tiles held by a corrupting faction, keyed by hexKey. */
  readonly corrupted?: ReadonlySet<string> | undefined;
  /** Milliseconds since load, for the slow ambient animation. */
  readonly time?: number | undefined;
}

export interface RenderStats {
  readonly drawn: number;
}

/**
 * Below this zoom the per-tile detail passes are skipped.
 *
 * At the minimum zoom close to two thousand tiles are on screen and the
 * detail is sub-pixel anyway, so drawing it costs frames and buys nothing.
 */
const DETAIL_ZOOM = 0.42;
const GLOW_ZOOM = 0.26;

/** Screen-space corners of a hex, pointy-top. */
function corners(camera: Camera, h: Hex, inflate: number): [number, number][] {
  const centre = hexToScreen(camera, h);
  const size = BASE_HEX_SIZE * camera.zoom * inflate;
  const out: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 90);
    out.push([centre.x + size * Math.cos(angle), centre.y + size * Math.sin(angle)]);
  }
  return out;
}

function tracePath(ctx: CanvasRenderingContext2D, pts: [number, number][]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
}

/** The void behind the world, cached because a gradient per frame is waste. */
let voidGradient: CanvasGradient | undefined;
let voidHeight = -1;

function drawVoid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  if (!voidGradient || voidHeight !== height) {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, VOID_TOP);
    g.addColorStop(1, VOID_BOTTOM);
    voidGradient = g;
    voidHeight = height;
  }
  ctx.fillStyle = voidGradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Corruption: torn scanlines in two clashing hues, clipped to the hex.
 *
 * Used for the Ungoverned Wastes and for any tile the Silo Horde holds, so
 * the enemy's advance is visible on the ground rather than only in a border
 * colour. Deterministic per tile, with one slow global drift, because a
 * fully animated field of this is unreadable and expensive.
 */
function drawCorruption(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  h: Hex,
  time: number,
): void {
  const centre = hexToScreen(camera, h);
  const size = BASE_HEX_SIZE * camera.zoom;
  const slivers = 3;

  ctx.save();
  tracePath(ctx, corners(camera, h, 1));
  ctx.clip();

  for (let i = 0; i < slivers; i++) {
    const n = tileNoise(h.q, h.r, i + 1);
    const y = centre.y + (n - 0.5) * size * 1.7;
    const thickness = Math.max(1, size * (0.05 + n * 0.07));
    // The drift is quantised so the tear jumps between a few positions
    // rather than sliding, which is what a torn signal actually looks like.
    const phase = Math.floor(time / 380 + n * 7) % 3;
    const shift = (phase - 1) * size * 0.18 * (0.4 + n);

    ctx.fillStyle = i % 2 === 0 ? GLITCH_A : GLITCH_B;
    ctx.fillRect(centre.x - size + shift, y, size * 2, thickness);
  }

  ctx.restore();
}

/**
 * Horizontal banding for the layered terrains.
 *
 * Delta Highlands and the Parquet Quarry are the two terrains that are
 * explicitly about columnar, versioned storage, so they are the two that get
 * drawn as strata. It is the cheapest possible way to say "this ground has
 * a file format".
 */
function drawStrata(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  tile: MapTile,
): void {
  const centre = hexToScreen(camera, tile.hex);
  const size = BASE_HEX_SIZE * camera.zoom;

  ctx.save();
  tracePath(ctx, corners(camera, tile.hex, 1));
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = Math.max(0.6, size * 0.035);
  const bands = 4;
  const offset = tileNoise(tile.hex.q, tile.hex.r, 9) * size * 0.3;
  for (let i = 1; i < bands; i++) {
    const y = centre.y - size + offset + (i * size * 2) / bands;
    ctx.beginPath();
    ctx.moveTo(centre.x - size, y);
    ctx.lineTo(centre.x + size, y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * A ridge line for the impassable peaks.
 *
 * Without it a run of peaks is one continuous bright shape with no internal
 * structure, which is what the first pass of this palette produced: the
 * player could see that the ground was different but not that it was
 * mountainous.
 *
 * The second failure is worth recording too. Drawing one identical triangle
 * per hex fixed the silhouette and immediately looked like wallpaper, a
 * regular grid of matching pyramids. So the number of summits, their height
 * and their spacing are all driven off the tile hash, which costs nothing
 * and breaks the repetition.
 */
function drawRidge(ctx: CanvasRenderingContext2D, camera: Camera, tile: MapTile): void {
  const centre = hexToScreen(camera, tile.hex);
  const size = BASE_HEX_SIZE * camera.zoom;
  const left = centre.x - size * 0.95;
  const right = centre.x + size * 0.95;
  const foot = centre.y + size * 0.55;

  const summits = 2 + Math.floor(tileNoise(tile.hex.q, tile.hex.r, 11) * 2);
  const span = right - left;

  ctx.save();
  tracePath(ctx, corners(camera, tile.hex, 1));
  ctx.clip();

  const points: [number, number][] = [[left, foot]];
  for (let i = 0; i < summits; i++) {
    const n = tileNoise(tile.hex.q, tile.hex.r, 20 + i);
    const m = tileNoise(tile.hex.q, tile.hex.r, 40 + i);
    // Summits are spread across the tile with a jittered slot each, so two
    // neighbouring tiles never line their peaks up.
    const x = left + (span * (i + 0.5)) / summits + (n - 0.5) * (span / summits) * 0.7;
    const height = size * (0.5 + tile.elevation * 0.45) * (0.55 + m * 0.65);
    points.push([x, centre.y + size * 0.2 - height]);
    if (i < summits - 1) {
      const saddle = left + (span * (i + 1)) / summits;
      points.push([saddle, centre.y + size * 0.2 - height * (0.3 + n * 0.25)]);
    }
  }
  points.push([right, foot]);

  const body = ctx.createLinearGradient(0, centre.y - size, 0, foot);
  body.addColorStop(0, 'rgba(232, 244, 255, 0.55)');
  body.addColorStop(1, 'rgba(24, 40, 66, 0.55)');
  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.strokeStyle = 'rgba(240, 250, 255, 0.7)';
  ctx.lineWidth = Math.max(0.7, size * 0.035);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

export function drawMap(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  camera: Camera,
  options: RenderOptions = {},
): RenderStats {
  const { width, height } = camera.viewport;
  const zoom = camera.zoom;
  const time = options.time ?? 0;
  const detail = zoom >= DETAIL_ZOOM;

  drawVoid(ctx, width, height);

  const has = (h: Hex) => map.tiles.has(hexKey(h));
  const visible = visibleHexes(camera, has);

  const tiles: MapTile[] = [];
  for (const h of visible) {
    const tile = map.tiles.get(hexKey(h));
    if (tile) tiles.push(tile);
  }

  // Pass 1: terrain. Inflated very slightly so adjacent fills overlap by a
  // sub-pixel and the grid does not show hairline seams at fractional zooms.
  // The jitter is what stops several hundred identical fills reading as a
  // spreadsheet; two percent is enough and any more looks like noise.
  for (const tile of tiles) {
    const jitter = (tileNoise(tile.hex.q, tile.hex.r) - 0.5) * 0.06;
    ctx.fillStyle = shadeFor(tile.terrain, tile.elevation, 6, jitter);
    tracePath(ctx, corners(camera, tile.hex, 1.02));
    ctx.fill();
  }

  // Pass 2: emissive. The land is lit from within, which is the whole art
  // direction, so this pass is what makes the map look like a running system
  // rather than a relief map at night. Additive blits of a cached sprite;
  // building a gradient per tile here was unusably slow.
  if (zoom >= GLOW_ZOOM) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const span = BASE_HEX_SIZE * zoom * 3.1;
    for (const tile of tiles) {
      const glow = TERRAIN_GLOW[tile.terrain];
      if (glow.strength <= 0) continue;
      const centre = hexToScreen(camera, tile.hex);
      // Elevation modulates the glow so a ridge of peaks does not read as
      // one flat sheet of white.
      const lift = 0.75 + tile.elevation * 0.5;
      const flicker =
        tile.terrain === 'geothermalVent'
          ? 0.85 + 0.15 * Math.sin(time / 420 + tileNoise(tile.hex.q, tile.hex.r, 3) * 6.28)
          : 1;
      ctx.globalAlpha = Math.min(1, glow.strength * lift * flicker) * 0.55;
      ctx.drawImage(glowSprite(glow.colour), centre.x - span / 2, centre.y - span / 2, span, span);
    }
    ctx.restore();
  }

  // Pass 3: strata banding on the layered terrains, ridges on the peaks.
  if (detail) {
    for (const tile of tiles) {
      if (STRATA_TERRAINS.has(tile.terrain)) drawStrata(ctx, camera, tile);
      else if (RIDGE_TERRAINS.has(tile.terrain)) drawRidge(ctx, camera, tile);
    }
  }

  // Pass 4: corruption. The wastes are corrupt by nature; anything the Horde
  // takes becomes corrupt by conquest.
  if (detail) {
    for (const tile of tiles) {
      const isWastes = tile.terrain === 'ungovernedWastes';
      const held = options.corrupted?.has(hexKey(tile.hex)) ?? false;
      if (!isWastes && !held) continue;
      drawCorruption(ctx, camera, tile.hex, time);
    }
  }

  // Pass 5: coastline. Only the edges that actually face water are stroked.
  // Outlining whole hexes instead reads as a grid laid over the map rather
  // than as a shoreline, which is what the first version looked like. The
  // surf is a wide soft stroke under a tight dark one, so the shore glows.
  ctx.lineCap = 'round';
  for (const pass of [0, 1] as const) {
    if (pass === 0 && !detail) continue;
    ctx.strokeStyle = pass === 0 ? SURF_COLOUR : COAST_COLOUR;
    ctx.lineWidth =
      pass === 0 ? Math.max(2, 6 * zoom) : Math.max(1, 1.6 * zoom);
    for (const tile of tiles) {
      if (tile.terrain === 'onelake') continue;
      const pts = corners(camera, tile.hex, 1);
      for (let d = 0; d < 6; d++) {
        const neighbour = map.tiles.get(hexKey(hexNeighbour(tile.hex, d)));
        if (neighbour && neighbour.terrain !== 'onelake') continue;
        const [i, j] = edgeCornerIndices(d);
        ctx.beginPath();
        ctx.moveTo(pts[i]![0], pts[i]![1]);
        ctx.lineTo(pts[j]![0], pts[j]![1]);
        ctx.stroke();
      }
    }
  }

  // Pass 6: rivers. One segment per tile, following the stored downstream
  // link. Drawing between all adjacent river tiles instead produces closed
  // triangles wherever three of them touch, because adjacency is symmetric
  // and flow is not.
  //
  // Two strokes: a wide dim body and a narrow bright core, which is what
  // turns a blue line into something that looks like it is carrying light.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const pass of [0, 1] as const) {
    ctx.strokeStyle = pass === 0 ? RIVER_COLOUR : RIVER_CORE_COLOUR;
    ctx.lineWidth = pass === 0 ? Math.max(1.4, 4.6 * zoom) : Math.max(0.6, 1.6 * zoom);
    ctx.globalAlpha = pass === 0 ? 1 : 0.85;
    for (const tile of tiles) {
      if (!tile.river || !tile.flowTo) continue;
      const downstream = map.tiles.get(hexKey(tile.flowTo));
      if (!downstream) continue;

      const from = hexToScreen(camera, tile.hex);
      const to = hexToScreen(camera, downstream.hex);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      if (downstream.terrain === 'onelake') {
        // Stop at the shoreline instead of striking out across open water.
        ctx.lineTo((from.x + to.x) / 2, (from.y + to.y) / 2);
      } else {
        ctx.lineTo(to.x, to.y);
      }
      ctx.stroke();
    }
    if (pass === 1) ctx.globalAlpha = 1;
  }

  // Pass 7: cursor feedback.
  if (options.hover && map.tiles.has(hexKey(options.hover))) {
    ctx.fillStyle = HOVER_COLOUR;
    tracePath(ctx, corners(camera, options.hover, 1));
    ctx.fill();
  }

  if (options.selected && map.tiles.has(hexKey(options.selected))) {
    ctx.strokeStyle = SELECT_COLOUR;
    ctx.lineWidth = Math.max(2, 3 * zoom);
    tracePath(ctx, corners(camera, options.selected, 1));
    ctx.stroke();
  }

  return { drawn: tiles.length };
}

/**
 * A vignette over everything.
 *
 * Drawn after the entities rather than with the terrain, so it darkens the
 * whole frame and pushes attention to the middle. Cached for the same reason
 * as the void gradient.
 */
let vignette: CanvasGradient | undefined;
let vignetteKey = '';

export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const key = `${width}x${height}`;
  if (!vignette || vignetteKey !== key) {
    const radius = Math.hypot(width, height) / 2;
    const g = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radius * 0.42,
      width / 2,
      height / 2,
      radius,
    );
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    vignette = g;
    vignetteKey = key;
  }
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
