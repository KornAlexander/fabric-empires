import {
  BASE_HEX_SIZE,
  cityKind,
  cityTerritory,
  edgeCornerIndices,
  hexKey,
  hexNeighbour,
  hexToScreen,
  unitType,
  type Camera,
  type GameState,
  type Hex,
  type ReachableTile,
} from '@fabric-empires/engine';

export interface GameView {
  readonly selectedUnitId?: string | undefined;
  readonly reachable?: ReadonlyMap<string, ReachableTile> | undefined;
  readonly attackTargets?: ReadonlySet<string> | undefined;
  readonly hover?: Hex | undefined;
}

const MOVE_FILL = 'rgba(130, 205, 255, 0.30)';
const MOVE_STOP_FILL = 'rgba(255, 190, 90, 0.38)';
const ATTACK_RING = '#ff5f56';
const SELECT_RING = '#ffd166';

function corners(camera: Camera, h: Hex, inflate = 1): [number, number][] {
  const centre = hexToScreen(camera, h);
  const size = BASE_HEX_SIZE * camera.zoom * inflate;
  const out: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 90);
    out.push([centre.x + size * Math.cos(angle), centre.y + size * Math.sin(angle)]);
  }
  return out;
}

function trace(ctx: CanvasRenderingContext2D, pts: [number, number][]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
}

/** Two-letter tag standing in for unit art until the real assets exist. */
function unitCode(label: string): string {
  const words = label.split(' ').filter(Boolean);
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}

function factionColour(state: GameState, factionId: string): string {
  return state.factions.get(factionId)?.colour ?? '#888888';
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  fraction: number,
): void {
  const h = Math.max(2, width * 0.14);
  const x = cx - width / 2;
  const y = cy + width * 0.62;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  roundedRect(ctx, x, y, width, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fraction > 0.5 ? '#5ac46a' : fraction > 0.25 ? '#e0b04a' : '#e05a4a';
  roundedRect(ctx, x, y, Math.max(1, width * fraction), h, h / 2);
  ctx.fill();
}

/**
 * Entities and overlays, drawn on top of the terrain.
 *
 * Split from the terrain renderer because the two change for different
 * reasons: terrain only when the map changes, entities on every action.
 */
export function drawEntities(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  view: GameView = {},
): void {
  const zoom = camera.zoom;
  const size = BASE_HEX_SIZE * zoom;

  // Pass 1: territory borders, drawn only on edges where ownership changes.
  const territory = cityTerritory(state);
  if (territory.size > 0) {
    ctx.lineWidth = Math.max(1.5, 2.4 * zoom);
    ctx.lineCap = 'round';
    for (const [key, cityId] of territory) {
      const tile = state.map.tiles.get(key);
      const city = state.cities.get(cityId);
      if (!tile || !city) continue;
      ctx.strokeStyle = factionColour(state, city.factionId);
      const pts = corners(camera, tile.hex);
      for (let d = 0; d < 6; d++) {
        const neighbourKey = hexKey(hexNeighbour(tile.hex, d));
        const neighbourOwner = territory.get(neighbourKey);
        if (neighbourOwner !== undefined) {
          const neighbourCity = state.cities.get(neighbourOwner);
          if (neighbourCity && neighbourCity.factionId === city.factionId) continue;
        }
        const [i, j] = edgeCornerIndices(d);
        ctx.beginPath();
        ctx.moveTo(pts[i]![0], pts[i]![1]);
        ctx.lineTo(pts[j]![0], pts[j]![1]);
        ctx.stroke();
      }
    }
  }

  // Pass 2: where the selected unit can go.
  if (view.reachable) {
    for (const entry of view.reachable.values()) {
      if (entry.cost === 0) continue;
      ctx.fillStyle = entry.stops ? MOVE_STOP_FILL : MOVE_FILL;
      trace(ctx, corners(camera, entry.hex, 0.94));
      ctx.fill();
    }
  }

  // Pass 3: what it can attack.
  if (view.attackTargets) {
    ctx.strokeStyle = ATTACK_RING;
    ctx.lineWidth = Math.max(2, 3 * zoom);
    for (const key of view.attackTargets) {
      const tile = state.map.tiles.get(key);
      if (!tile) continue;
      trace(ctx, corners(camera, tile.hex, 0.92));
      ctx.stroke();
    }
  }

  // Pass 4: cities.
  for (const city of state.cities.values()) {
    const centre = hexToScreen(camera, city.hex);
    const w = size * 1.1;
    const h = size * 0.78;
    ctx.fillStyle = 'rgba(10, 14, 20, 0.75)';
    roundedRect(ctx, centre.x - w / 2, centre.y - h / 2, w, h, size * 0.18);
    ctx.fill();
    ctx.strokeStyle = factionColour(state, city.factionId);
    ctx.lineWidth = Math.max(2, 2.6 * zoom);
    ctx.stroke();

    if (size > 22) {
      ctx.fillStyle = '#f2f4f8';
      ctx.font = `600 ${Math.round(size * 0.34)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(city.population), centre.x, centre.y);
    }

    if (size > 30) {
      ctx.fillStyle = 'rgba(232, 234, 240, 0.9)';
      ctx.font = `500 ${Math.round(size * 0.24)}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillText(cityKind(city.kind).label, centre.x, centre.y - h * 0.85);
    }

    const maxHp = cityKind(city.kind).baseHp;
    if (city.hp < maxHp) drawHealthBar(ctx, centre.x, centre.y, w * 0.9, city.hp / maxHp);
  }

  // Pass 5: units.
  for (const unit of state.units.values()) {
    const type = unitType(unit.typeId);
    const centre = hexToScreen(camera, unit.hex);
    const radius = size * 0.4;

    ctx.beginPath();
    ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 14, 20, 0.82)';
    ctx.fill();
    ctx.strokeStyle = factionColour(state, unit.factionId);
    ctx.lineWidth = Math.max(2, 2.6 * zoom);
    ctx.stroke();

    if (size > 20) {
      ctx.fillStyle = '#f2f4f8';
      ctx.font = `600 ${Math.round(radius * 0.9)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(unitCode(type.label), centre.x, centre.y);
    }

    if (unit.hp < type.maxHp) {
      drawHealthBar(ctx, centre.x, centre.y, radius * 1.9, unit.hp / type.maxHp);
    }

    // A spent unit is dimmed so the player can see at a glance who is left.
    if (unit.factionId === state.activeFactionId && unit.movesLeft <= 0) {
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8, 10, 14, 0.45)';
      ctx.fill();
    }

    if (unit.fortified && size > 18) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = Math.max(1, 1.4 * zoom);
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, radius * 1.28, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Pass 6: the selection ring, drawn last so nothing covers it.
  if (view.selectedUnitId) {
    const unit = state.units.get(view.selectedUnitId);
    if (unit) {
      const centre = hexToScreen(camera, unit.hex);
      ctx.strokeStyle = SELECT_RING;
      ctx.lineWidth = Math.max(2, 3 * zoom);
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, size * 0.52, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
