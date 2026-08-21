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
  HOVER_COLOUR,
  RIVER_COLOUR,
  SELECT_COLOUR,
  shadeFor,
} from './palette.js';

export interface RenderOptions {
  readonly hover?: Hex | undefined;
  readonly selected?: Hex | undefined;
}

export interface RenderStats {
  readonly drawn: number;
}

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

export function drawMap(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  camera: Camera,
  options: RenderOptions = {},
): RenderStats {
  const { width, height } = camera.viewport;

  ctx.fillStyle = '#070a10';
  ctx.fillRect(0, 0, width, height);

  const has = (h: Hex) => map.tiles.has(hexKey(h));
  const visible = visibleHexes(camera, has);

  const tiles: MapTile[] = [];
  for (const h of visible) {
    const tile = map.tiles.get(hexKey(h));
    if (tile) tiles.push(tile);
  }

  // Pass 1: terrain. Inflated very slightly so adjacent fills overlap by a
  // sub-pixel and the grid does not show hairline seams at fractional zooms.
  for (const tile of tiles) {
    ctx.fillStyle = shadeFor(tile.terrain, tile.elevation);
    tracePath(ctx, corners(camera, tile.hex, 1.02));
    ctx.fill();
  }

  // Pass 2: coastline. Only the edges that actually face water are stroked.
  // Outlining whole hexes instead reads as a grid laid over the map rather
  // than as a shoreline, which is what the first version looked like.
  ctx.strokeStyle = COAST_COLOUR;
  ctx.lineWidth = Math.max(1, 1.6 * camera.zoom);
  ctx.lineCap = 'round';
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

  // Pass 3: rivers. One segment per tile, following the stored downstream
  // link. Drawing between all adjacent river tiles instead produces closed
  // triangles wherever three of them touch, because adjacency is symmetric
  // and flow is not.
  ctx.strokeStyle = RIVER_COLOUR;
  ctx.lineWidth = Math.max(1.2, 3.2 * camera.zoom);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
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

  // Pass 4: cursor feedback.
  if (options.hover && map.tiles.has(hexKey(options.hover))) {
    ctx.fillStyle = HOVER_COLOUR;
    tracePath(ctx, corners(camera, options.hover, 1));
    ctx.fill();
  }

  if (options.selected && map.tiles.has(hexKey(options.selected))) {
    ctx.strokeStyle = SELECT_COLOUR;
    ctx.lineWidth = Math.max(2, 3 * camera.zoom);
    tracePath(ctx, corners(camera, options.selected, 1));
    ctx.stroke();
  }

  return { drawn: tiles.length };
}
