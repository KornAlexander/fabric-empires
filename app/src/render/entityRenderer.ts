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
import { glowSprite, rgba, tileNoise } from './palette.js';

export interface ViewPoint {
  x: number;
  y: number;
}

export interface GameView {
  readonly selectedUnitId?: string | undefined;
  readonly reachable?: ReadonlyMap<string, ReachableTile> | undefined;
  readonly attackTargets?: ReadonlySet<string> | undefined;
  readonly hover?: Hex | undefined;
  /** Milliseconds since load, for idle animation. */
  readonly time?: number | undefined;
  /** Screen offset for a unit that is currently moving or lunging. */
  readonly offsetOf?: ((unitId: string) => ViewPoint | undefined) | undefined;
  /** Opacity for a unit that is dissolving. */
  readonly opacityOf?: ((unitId: string) => number) | undefined;
}

const MOVE_FILL = 'rgba(110, 200, 255, 0.20)';
const MOVE_EDGE = 'rgba(150, 225, 255, 0.55)';
const MOVE_STOP_FILL = 'rgba(255, 190, 90, 0.24)';
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

function traceHex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 90);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
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

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  fraction: number,
): void {
  const h = Math.max(2, width * 0.13);
  const x = cx - width / 2;
  const y = cy + width * 0.62;
  ctx.fillStyle = 'rgba(2, 4, 8, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, width, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fraction > 0.5 ? '#6fe08a' : fraction > 0.25 ? '#f0c05a' : '#ff6b5a';
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(1, width * fraction), h, h / 2);
  ctx.fill();
}

/**
 * The shadow a floating thing casts on the ground below it.
 *
 * Cities and units both hover in this art direction, so the shadow is what
 * tells the eye they are above the terrain rather than painted onto it. It
 * is a flat ellipse on purpose: a soft blurred one costs a filter and reads
 * no better at this size.
 */
function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  lift: number,
): void {
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(cx, cy + lift, radius * 0.85, radius * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  span: number,
  colour: string,
  alpha: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.drawImage(glowSprite(colour), cx - span / 2, cy - span / 2, span, span);
  ctx.restore();
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
  const time = view.time ?? 0;
  const offsetOf = view.offsetOf;
  const opacityOf = view.opacityOf;

  // Pass 1: territory borders, drawn only on edges where ownership changes.
  // Stroked twice, once wide and dim and once tight and bright, so a border
  // reads as a field boundary rather than as a pen line.
  const territory = cityTerritory(state);
  if (territory.size > 0) {
    ctx.lineCap = 'round';
    for (const pass of [0, 1] as const) {
      ctx.lineWidth = pass === 0 ? Math.max(3, 7 * zoom) : Math.max(1.2, 1.8 * zoom);
      ctx.globalAlpha = pass === 0 ? 0.22 : 0.95;
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
    ctx.globalAlpha = 1;
  }

  // Pass 2: where the selected unit can go. Filled and outlined, because a
  // fill alone at this opacity vanishes over the bright terrains.
  if (view.reachable) {
    for (const entry of view.reachable.values()) {
      if (entry.cost === 0) continue;
      const pts = corners(camera, entry.hex, 0.9);
      ctx.fillStyle = entry.stops ? MOVE_STOP_FILL : MOVE_FILL;
      trace(ctx, pts);
      ctx.fill();
      ctx.strokeStyle = MOVE_EDGE;
      ctx.lineWidth = Math.max(0.8, 1.1 * zoom);
      ctx.stroke();
    }
  }

  // Pass 3: what it can attack. The ring pulses, so a target reads as urgent
  // rather than as another overlay colour.
  if (view.attackTargets) {
    const pulse = 0.72 + 0.28 * Math.sin(time / 260);
    ctx.strokeStyle = ATTACK_RING;
    ctx.lineWidth = Math.max(2, 3 * zoom);
    for (const key of view.attackTargets) {
      const tile = state.map.tiles.get(key);
      if (!tile) continue;
      ctx.globalAlpha = pulse;
      trace(ctx, corners(camera, tile.hex, 0.88));
      ctx.stroke();
      const centre = hexToScreen(camera, tile.hex);
      drawGlow(ctx, centre.x, centre.y, size * 2.4, ATTACK_RING, 0.18 * pulse);
    }
    ctx.globalAlpha = 1;
  }

  // Pass 4: cities, drawn as structures held above the ground.
  for (const city of state.cities.values()) {
    const ground = hexToScreen(camera, city.hex);
    const colour = factionColour(state, city.factionId);
    const bob = Math.sin(time / 1400 + tileNoise(city.hex.q, city.hex.r) * 6.28) * size * 0.02;
    const lift = size * 0.16 + bob;
    const cx = ground.x;
    const cy = ground.y - lift;
    const radius = size * 0.56;

    drawGroundShadow(ctx, cx, ground.y + size * 0.1, radius, 0);

    // A column of light standing over the city. This is the one piece of
    // pure spectacle on the map, and it is what makes a capital findable at
    // a glance from any zoom.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const beam = ctx.createLinearGradient(cx, cy - size * 4, cx, cy);
    beam.addColorStop(0, rgba(colour, 0));
    beam.addColorStop(1, rgba(colour, 0.5));
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.85, cy);
    ctx.lineTo(cx + radius * 0.85, cy);
    ctx.lineTo(cx + radius * 0.2, cy - size * 4);
    ctx.lineTo(cx - radius * 0.2, cy - size * 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawGlow(ctx, cx, cy, size * 3.4, colour, 0.5);

    // The body: a hex, echoing the world it sits in.
    traceHex(ctx, cx, cy, radius);
    ctx.fillStyle = 'rgba(6, 10, 18, 0.9)';
    ctx.fill();
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(2, 3.2 * zoom);
    ctx.stroke();

    traceHex(ctx, cx, cy, radius * 0.72);
    ctx.strokeStyle = rgba(colour, 0.45);
    ctx.lineWidth = Math.max(1, 1.2 * zoom);
    ctx.stroke();

    if (size > 22) {
      ctx.fillStyle = '#f2f6ff';
      ctx.font = `700 ${Math.round(size * 0.4)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(city.population), cx, cy);
    }

    if (size > 30) {
      ctx.fillStyle = 'rgba(226, 234, 250, 0.85)';
      ctx.font = `500 ${Math.round(size * 0.22)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(cityKind(city.kind).label, cx, cy + radius * 1.6);
    }

    const maxHp = cityKind(city.kind).baseHp;
    if (city.hp < maxHp) drawHealthBar(ctx, cx, cy, radius * 2, city.hp / maxHp);
  }

  // Pass 5: units.
  for (const unit of state.units.values()) {
    const opacity = opacityOf ? opacityOf(unit.id) : 1;
    if (opacity <= 0) continue;

    const type = unitType(unit.typeId);
    const base = hexToScreen(camera, unit.hex);
    const offset = offsetOf?.(unit.id);
    const spent = unit.factionId === state.activeFactionId && unit.movesLeft <= 0;
    // Idle bob, so a unit awaiting orders is visibly alive and a spent one
    // is visibly not. This is cheaper to read than any badge.
    const bob = spent
      ? 0
      : Math.sin(time / 620 + tileNoise(unit.hex.q, unit.hex.r, 5) * 6.28) * size * 0.035;

    const cx = base.x + (offset?.x ?? 0) * zoom;
    const cy = base.y + (offset?.y ?? 0) * zoom - size * 0.1 - bob;
    const radius = size * 0.44;
    const colour = factionColour(state, unit.factionId);

    ctx.save();
    ctx.globalAlpha = opacity;

    drawGroundShadow(ctx, base.x + (offset?.x ?? 0) * zoom, base.y + size * 0.16, radius, 0);
    drawGlow(ctx, cx, cy, size * 2.6, colour, 0.45 * opacity);

    const body = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
    body.addColorStop(0, 'rgba(28, 36, 52, 0.96)');
    body.addColorStop(1, 'rgba(6, 9, 16, 0.96)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(2, 3.2 * zoom);
    ctx.stroke();

    if (size > 20) {
      ctx.fillStyle = spent ? 'rgba(226, 232, 244, 0.5)' : '#f2f6ff';
      ctx.font = `700 ${Math.round(radius * 0.85)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(unitCode(type.label), cx, cy);
    }

    if (unit.hp < type.maxHp) {
      drawHealthBar(ctx, cx, cy, radius * 1.9, unit.hp / type.maxHp);
    }

    // A spent unit is dimmed so the player can see at a glance who is left.
    if (spent) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(4, 6, 12, 0.5)';
      ctx.fill();
    }

    if (unit.fortified && size > 18) {
      ctx.strokeStyle = 'rgba(190, 225, 255, 0.6)';
      ctx.lineWidth = Math.max(1, 1.4 * zoom);
      traceHex(ctx, cx, cy, radius * 1.42);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Pass 6: the selection ring, drawn last so nothing covers it. It rotates,
  // which costs nothing and makes the current unit impossible to lose.
  if (view.selectedUnitId) {
    const unit = state.units.get(view.selectedUnitId);
    if (unit) {
      const base = hexToScreen(camera, unit.hex);
      const offset = offsetOf?.(unit.id);
      const cx = base.x + (offset?.x ?? 0) * zoom;
      const cy = base.y + (offset?.y ?? 0) * zoom - size * 0.1;
      const radius = size * 0.6;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((time / 2600) % (Math.PI * 2));
      ctx.strokeStyle = SELECT_RING;
      ctx.lineWidth = Math.max(2, 2.6 * zoom);
      ctx.setLineDash([radius * 0.55, radius * 0.42]);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}
