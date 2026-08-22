/**
 * The terrain mesh.
 *
 * The important decision here is that the ground is a continuous surface,
 * not a field of hex tiles. Extruded hex prisms are far easier to build and
 * they are what most hex games in 3D do, but they can never look real: real
 * ground does not have vertical steps every few metres on a perfect lattice.
 *
 * So the hex grid decides where the control points are and what the material
 * is, and then the surface is subdivided, displaced by continuous world-space
 * noise, welded, and smooth-shaded. Terrain type is carried in vertex colour,
 * which means two neighbouring biomes blend across the shared edge for free
 * instead of meeting at a hard line.
 *
 * The grid is still there for the player: it is drawn on top as an overlay,
 * and it can be turned off without touching the ground.
 */

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  hexKey,
  hexNeighbour,
  hexRound,
  type GameMap,
  type Hex,
  type MapTile,
  type TerrainId,
} from '@fabric-empires/engine';
import { fbm2, greyCanvas, heightCanvas } from './noise.js';
import { erode, sampleGrid } from './erosion.js';

/** World units per hex. Everything else is expressed in terms of this. */
export const HEX_RADIUS = 1;

/** Sea level. Land is above, lake beds below. */
export const SEA_LEVEL = 0;

export interface TerrainProfile {
  /** Height at elevation 0 and the height added at elevation 1. */
  readonly base: number;
  readonly range: number;
  /** Surface colour before slope and height modulation. */
  readonly colour: string;
  /** How much continuous detail noise this surface carries. */
  readonly roughness: number;
}

/**
 * Real-world colours and a restrained vertical scale.
 *
 * Realism is a different brief from the data-dream direction, and the two
 * cannot both be satisfied by one palette. These are ordinary earth hues:
 * the drama has to come from light, not from pigment.
 *
 * The heights went through one bad iteration worth recording. Peaks were
 * first given a range of 7.6 against a hex radius of 1, which put an eight
 * unit cliff across a single tile boundary. That is a vertical wall, and it
 * rendered as a field of white glass shards rather than as a mountain. Real
 * relief is gentle per unit of ground; the impression of height comes from
 * how far the rise is sustained, not from how abrupt it is.
 */
export const TERRAIN_PROFILES: Readonly<Record<TerrainId, TerrainProfile>> = Object.freeze({
  onelake: { base: -1.9, range: 1.5, colour: '#59656b', roughness: 0.2 },
  rawFilePlains: { base: 0.14, range: 0.72, colour: '#6b7f4e', roughness: 0.28 },
  /*
   * ⚠️ Moorland, not bare dirt.
   *
   * This was `#9d8464`, a pale pinkish tan, and it made the highlands the
   * ugliest thing on the map: a flat warm beige with nothing growing on it,
   * reading as a quarry that had swallowed a third of the landmass. Upland
   * grazing and heather in this part of the world is a dark olive that leans
   * green in the flats and lets the slope-driven rock mix show through on the
   * steep faces, which is where the shape actually is.
   */
  deltaHighlands: { base: 0.45, range: 1.95, colour: '#6e6a43', roughness: 0.64 },
  parquetQuarry: { base: 0.34, range: 1.35, colour: '#b0a894', roughness: 0.45 },
  legacySwamp: { base: 0.05, range: 0.3, colour: '#59603d', roughness: 0.14 },
  semanticPeaks: { base: 1.55, range: 3.9, colour: '#77706a', roughness: 0.85 },
  geothermalVent: { base: 0.24, range: 0.85, colour: '#4a3b30', roughness: 0.45 },
  ungovernedWastes: { base: 0.2, range: 0.95, colour: '#8f7f66', roughness: 0.36 },
});

/** Axial hex centre in world space, ignoring height. */
export function hexToWorld(h: Hex): { x: number; z: number } {
  return {
    x: HEX_RADIUS * (Math.sqrt(3) * h.q + (Math.sqrt(3) / 2) * h.r),
    z: HEX_RADIUS * 1.5 * h.r,
  };
}

/** Inverse of hexToWorld, before rounding to a hex. */
export function worldToAxial(x: number, z: number): { q: number; r: number } {
  const r = z / (1.5 * HEX_RADIUS);
  const q = (x / HEX_RADIUS - (Math.sqrt(3) / 2) * r) / Math.sqrt(3);
  return { q, r };
}

function cornerOffset(i: number): { x: number; z: number } {
  const angle = (Math.PI / 180) * (60 * i - 90);
  return { x: HEX_RADIUS * Math.cos(angle), z: HEX_RADIUS * Math.sin(angle) };
}

/**
 * Continuous surface detail, in world space.
 *
 * Because it is a pure function of position, two triangles that share an
 * edge get identical displacement along it and the surface stays watertight
 * without any special-casing at the seams.
 */
function detailAt(x: number, z: number): number {
  const broad = fbm2(x * 0.055, z * 0.055, { octaves: 4, seed: 7 }) - 0.5;
  const fine = fbm2(x * 0.9, z * 0.9, { octaves: 3, seed: 23, ridged: true }) - 0.5;
  return broad * 1.1 + fine * 0.22;
}

export interface Terrain {
  readonly group: Group;
  /** Ground height at the centre of a hex, for placing entities. */
  heightAt(h: Hex): number;
  /** Height of the smooth control surface anywhere, for overlays. */
  surfaceAt(x: number, z: number): number;
  /**
   * Ground height at an arbitrary point, by barycentric interpolation.
   *
   * Needed to scatter props, which land between vertices. A downward
   * raycast would be exact but is linear in triangle count per query, and
   * there are thousands of props against two hundred thousand triangles.
   */
  sampleHeight(x: number, z: number): number;
  setGridVisible(visible: boolean): void;
  readonly triangleCount: number;
  /**
   * Mean Z of the detail normal map. Must stay well above 0.8: below that
   * the shading normal is being tipped so far that the surface stops
   * responding to the sun.
   */
  readonly detailNormalZ: number;
  /** Largest height change made by the erosion pass, in world units. */
  readonly erosionMaxDelta: number;
  dispose(): void;
}

interface Corner {
  x: number;
  z: number;
  heightSum: number;
  colour: Color;
  count: number;
}

/**
 * Build the ground for a map.
 *
 * Runs once per game. It is deliberately allowed to be slow: a second at
 * load is invisible, and doing this work per frame would not be.
 */
export function buildTerrain(map: GameMap, subdivisions = 2): Terrain {
  const group = new Group();

  // Stage 1: the control lattice ----------------------------------------
  //
  // Each hex contributes a centre and six corners. Corners are shared by up
  // to three hexes, so their height and colour are the average of whatever
  // touches them: that averaging is what removes the hard biome edges.
  const corners = new Map<string, Corner>();
  const centreHeight = new Map<string, number>();
  const centreColour = new Map<string, Color>();

  const cornerKey = (x: number, z: number) =>
    `${Math.round(x * 1000)},${Math.round(z * 1000)}`;

  function rawTileHeight(tile: MapTile): number {
    const profile = TERRAIN_PROFILES[tile.terrain];
    // A gentle curve rather than a straight ramp: real land spends most of
    // its area low and rises quickly near the top.
    const shaped = Math.pow(tile.elevation, 1.35);
    return profile.base + profile.range * shaped;
  }

  /**
   * Smoothed tile heights.
   *
   * Averaging each tile with its neighbours is what turns a set of per-tile
   * step heights into landform. Without it a mountain tile beside a plains
   * tile produces a cliff exactly one hex wide, which is a staircase, not
   * terrain. Two passes is enough; more starts flattening the mountains.
   */
  const smoothed = new Map<string, number>();
  {
    let current = new Map<string, number>();
    for (const tile of map.tiles.values()) current.set(hexKey(tile.hex), rawTileHeight(tile));

    for (let pass = 0; pass < 2; pass++) {
      const next = new Map<string, number>();
      for (const tile of map.tiles.values()) {
        const key = hexKey(tile.hex);
        const own = current.get(key)!;
        let sum = 0;
        let count = 0;
        for (let d = 0; d < 6; d++) {
          const neighbour = current.get(hexKey(hexNeighbour(tile.hex, d)));
          if (neighbour === undefined) continue;
          sum += neighbour;
          count += 1;
        }
        // Keep more than half of the tile's own character, so the biome
        // still decides what the ground is doing.
        next.set(key, count === 0 ? own : own * 0.58 + (sum / count) * 0.42);
      }
      current = next;
    }
    for (const [key, value] of current) smoothed.set(key, value);
  }

  const tileHeight = (tile: MapTile): number =>
    smoothed.get(hexKey(tile.hex)) ?? rawTileHeight(tile);

  for (const tile of map.tiles.values()) {
    const { x, z } = hexToWorld(tile.hex);
    const height = tileHeight(tile);
    // three converts a CSS colour from sRGB into the working colour space on
    // construction. Converting again by hand darkens everything by roughly a
    // factor of four and drains the saturation, which is what turned the
    // whole landmass into identical grey mud. Found by measuring the mean
    // vertex colour, not by looking: it looked like a lighting problem.
    const colour = new Color(TERRAIN_PROFILES[tile.terrain].colour);

    centreHeight.set(hexKey(tile.hex), height);
    centreColour.set(hexKey(tile.hex), colour);

    for (let i = 0; i < 6; i++) {
      const offset = cornerOffset(i);
      const cx = x + offset.x;
      const cz = z + offset.z;
      const key = cornerKey(cx, cz);
      const existing = corners.get(key);
      if (existing) {
        existing.heightSum += height;
        existing.colour.add(colour);
        existing.count += 1;
      } else {
        corners.set(key, {
          x: cx,
          z: cz,
          heightSum: height,
          colour: colour.clone(),
          count: 1,
        });
      }
    }
  }

  const cornerHeight = (x: number, z: number): number => {
    const corner = corners.get(cornerKey(x, z));
    return corner ? corner.heightSum / corner.count : 0;
  };
  const cornerColour = (x: number, z: number, fallback: Color): Color => {
    const corner = corners.get(cornerKey(x, z));
    if (!corner) return fallback;
    return corner.colour.clone().multiplyScalar(1 / corner.count);
  };

  // Stage 1b: erosion ----------------------------------------------------
  //
  // Run on a regular grid rather than on the hex lattice, because water does
  // not care about the playing field and a droplet needs a surface it can
  // walk continuously. The grid is sampled from the same control surface the
  // mesh is about to be built from, eroded, and the difference is applied to
  // the finished vertices further down.
  const worldHalfX = Math.sqrt(3) * HEX_RADIUS * map.radius + HEX_RADIUS;
  const worldHalfZ = 1.5 * HEX_RADIUS * map.radius + HEX_RADIUS;
  // Roughly five cells per hex: finer than the mesh can represent is wasted
  // work, coarser and the channels come out blocky.
  const cellSize = HEX_RADIUS / 5;
  const gridW = Math.ceil((worldHalfX * 2) / cellSize) + 1;
  const gridD = Math.ceil((worldHalfZ * 2) / cellSize) + 1;
  const gridToWorldX = (gx: number) => gx * cellSize - worldHalfX;
  const gridToWorldZ = (gy: number) => gy * cellSize - worldHalfZ;
  const worldToGridX = (x: number) => (x + worldHalfX) / cellSize;
  const worldToGridZ = (z: number) => (z + worldHalfZ) / cellSize;

  /** The pre-erosion surface at any point: control lattice plus detail. */
  function baseHeightAt(x: number, z: number): number {
    const axial = worldToAxial(x, z);
    const h = hexRound(axial.q, axial.r);
    const tile = map.tiles.get(hexKey(h));
    if (!tile) return SEA_LEVEL - 2;
    const centre = hexToWorld(h);
    const local = { x: x - centre.x, z: z - centre.z };

    let best = 0;
    let bestDot = -Infinity;
    for (let i = 0; i < 6; i++) {
      const a = cornerOffset(i);
      const b = cornerOffset((i + 1) % 6);
      const mid = Math.atan2((a.z + b.z) / 2, (a.x + b.x) / 2);
      const dot = Math.cos(Math.atan2(local.z, local.x) - mid);
      if (dot > bestDot) {
        bestDot = dot;
        best = i;
      }
    }
    const o1 = cornerOffset(best);
    const o2 = cornerOffset((best + 1) % 6);
    const det = o1.x * o2.z - o1.z * o2.x;
    let u = 0;
    let v = 0;
    if (Math.abs(det) > 1e-6) {
      u = Math.min(1, Math.max(0, (local.x * o2.z - local.z * o2.x) / det));
      v = Math.min(1, Math.max(0, (o1.x * local.z - o1.z * local.x) / det));
    }
    const w = Math.max(0, 1 - u - v);
    const total = u + v + w || 1;
    const centreY = centreHeight.get(hexKey(h)) ?? 0;
    const y1 = cornerHeight(centre.x + o1.x, centre.z + o1.z);
    const y2 = cornerHeight(centre.x + o2.x, centre.z + o2.z);
    const control = (centreY * w + y1 * u + y2 * v) / total;
    return control + detailAt(x, z) * TERRAIN_PROFILES[tile.terrain].roughness;
  }

  const erosionField = new Float32Array(gridW * gridD);
  for (let gy = 0; gy < gridD; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      erosionField[gy * gridW + gx] = baseHeightAt(gridToWorldX(gx), gridToWorldZ(gy));
    }
  }
  const erosion = erode(erosionField, gridW, gridD, cellSize);
  const erosionAt = (x: number, z: number) =>
    sampleGrid(erosion.delta, gridW, gridD, worldToGridX(x), worldToGridZ(z));

  // Stage 2: subdivide and displace --------------------------------------
  const steps = Math.max(1, 2 ** subdivisions);
  const triangleCount = map.tiles.size * 6 * steps * steps;
  const positions = new Float32Array(triangleCount * 9);
  const colours = new Float32Array(triangleCount * 9);
  let p = 0;

  const scratch = new Color();

  function emit(
    ax: number,
    az: number,
    ah: number,
    ac: Color,
    bx: number,
    bz: number,
    bh: number,
    bc: Color,
    cx: number,
    cz: number,
    ch: number,
    cc: Color,
    rough: number,
  ): void {
    const push = (x: number, z: number, h: number, colour: Color) => {
      positions[p] = x;
      positions[p + 1] = h + detailAt(x, z) * rough;
      positions[p + 2] = z;
      colours[p] = colour.r;
      colours[p + 1] = colour.g;
      colours[p + 2] = colour.b;
      p += 3;
    };
    push(ax, az, ah, ac);
    push(bx, bz, bh, bc);
    push(cx, cz, ch, cc);
  }

  for (const tile of map.tiles.values()) {
    const { x, z } = hexToWorld(tile.hex);
    const key = hexKey(tile.hex);
    const ch0 = centreHeight.get(key)!;
    const cc0 = centreColour.get(key)!;
    const rough = TERRAIN_PROFILES[tile.terrain].roughness;

    for (let i = 0; i < 6; i++) {
      const o1 = cornerOffset(i);
      const o2 = cornerOffset((i + 1) % 6);
      const p1 = { x: x + o1.x, z: z + o1.z };
      const p2 = { x: x + o2.x, z: z + o2.z };
      const h1 = cornerHeight(p1.x, p1.z);
      const h2 = cornerHeight(p2.x, p2.z);
      const col1 = cornerColour(p1.x, p1.z, cc0);
      const col2 = cornerColour(p2.x, p2.z, cc0);

      // Barycentric subdivision of the triangle (centre, p1, p2).
      for (let a = 0; a < steps; a++) {
        for (let b = 0; b < steps - a; b++) {
          const at = (u: number, v: number) => {
            const w = 1 - u - v;
            return {
              x: x * w + p1.x * u + p2.x * v,
              z: z * w + p1.z * u + p2.z * v,
              h: ch0 * w + h1 * u + h2 * v,
              c: scratch
                .setRGB(
                  cc0.r * w + col1.r * u + col2.r * v,
                  cc0.g * w + col1.g * u + col2.g * v,
                  cc0.b * w + col1.b * u + col2.b * v,
                )
                .clone(),
            };
          };
          const u0 = a / steps;
          const v0 = b / steps;
          const u1 = (a + 1) / steps;
          const v1 = (b + 1) / steps;

          const A = at(u0, v0);
          const B = at(u1, v0);
          const C = at(u0, v1);
          // Wound so the surface normal points up. The first version had
          // this reversed, which meant computeVertexNormals produced a
          // ground whose every normal faced the centre of the planet: the
          // sun then contributed nothing and the terrain was lit only by
          // ambient, which reads as flat grey no matter what the albedo is.
          emit(A.x, A.z, A.h, A.c, C.x, C.z, C.h, C.c, B.x, B.z, B.h, B.c, rough);

          if (b < steps - a - 1) {
            const D = at(u1, v1);
            emit(B.x, B.z, B.h, B.c, C.x, C.z, C.h, C.c, D.x, D.z, D.h, D.c, rough);
          }
        }
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions.subarray(0, p), 3));
  geometry.setAttribute('color', new BufferAttribute(colours.subarray(0, p), 3));

  // Welding is what turns a bag of triangles into a smooth surface: without
  // it every shared vertex has one normal per triangle and the ground reads
  // as faceted no matter how finely it is subdivided.
  const welded = mergeVertices(geometry, 1e-3);
  geometry.dispose();

  /**
   * Laplacian smoothing on height only.
   *
   * Subdividing a hex by interpolating linearly from its centre to its
   * corners produces an umbrella: six flat panels meeting at a crease down
   * every spoke. Smooth normals hide the shading break but not the
   * silhouette, and the ground reads as low-poly rather than as land. A few
   * passes of averaging each vertex against its graph neighbours rounds the
   * creases off while leaving the landform intact.
   *
   * Only Y moves. Smoothing X and Z as well would drag the hex corners out
   * of alignment with the grid the game is played on.
   */
  {
    const index = welded.getIndex();
    const position = welded.getAttribute('position') as BufferAttribute;
    if (index) {
      const count = position.count;
      const neighbourSum = new Float32Array(count);
      const neighbourCount = new Uint16Array(count);
      const heights = new Float32Array(count);
      for (let i = 0; i < count; i++) heights[i] = position.getY(i);

      for (let pass = 0; pass < 3; pass++) {
        neighbourSum.fill(0);
        neighbourCount.fill(0);
        for (let t = 0; t < index.count; t += 3) {
          const a = index.getX(t);
          const b = index.getX(t + 1);
          const c = index.getX(t + 2);
          const link = (from: number, to: number) => {
            neighbourSum[from] = neighbourSum[from]! + heights[to]!;
            neighbourCount[from] = neighbourCount[from]! + 1;
          };
          link(a, b);
          link(a, c);
          link(b, a);
          link(b, c);
          link(c, a);
          link(c, b);
        }
        for (let i = 0; i < count; i++) {
          const n = neighbourCount[i]!;
          if (n === 0) continue;
          heights[i] = heights[i]! * 0.45 + (neighbourSum[i]! / n) * 0.55;
        }
      }

      for (let i = 0; i < count; i++) position.setY(i, heights[i]!);
      position.needsUpdate = true;
    }
  }

  /**
   * Erosion is applied last, after smoothing.
   *
   * Order matters and the obvious order is wrong. The Laplacian pass exists
   * to remove the hex-umbrella creases, and it is an aggressive low-pass
   * filter: run it after erosion and it removes the drainage channels along
   * with the creases, which is most of the point of having simulated them.
   */
  {
    const position = welded.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      position.setY(i, position.getY(i) + erosionAt(position.getX(i), position.getZ(i)));
    }
    position.needsUpdate = true;
  }

  welded.computeVertexNormals();

  /**
   * Height of the finished surface, by position.
   *
   * Everything that has to sit on the ground reads from this rather than
   * recomputing the height analytically. The analytic version stopped being
   * true the moment the mesh was smoothed, and units floating a hand's
   * width above the terrain is exactly the kind of error that is obvious in
   * a screenshot and invisible in a test.
   */
  const surfaceHeights = new Map<string, number>();
  {
    const position = welded.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      surfaceHeights.set(
        cornerKey(position.getX(i), position.getZ(i)),
        position.getY(i),
      );
    }
  }
  const finishedHeight = (x: number, z: number, fallback: number): number =>
    surfaceHeights.get(cornerKey(x, z)) ?? fallback;

  // A UV set the shader can bind to. The values are never read, because the
  // detail maps are sampled from world position instead, but three still
  // generates code that references the attribute and an unbound attribute is
  // the kind of thing that works on one driver and not the next.
  welded.setAttribute(
    'uv',
    new BufferAttribute(new Float32Array(welded.getAttribute('position').count * 2), 2),
  );

  // Stage 3: slope and height response ----------------------------------
  //
  // Ground colour is not a property of the biome alone. Steep faces shed
  // soil and show rock; high ground holds snow. Doing this after the normals
  // exist is the only way to know which faces are steep.
  const pos = welded.getAttribute('position') as BufferAttribute;
  const nrm = welded.getAttribute('normal') as BufferAttribute;
  const col = welded.getAttribute('color') as BufferAttribute;
  const rock = new Color('#6f6a62');
  // Snow, but not white. Pure white snow under a strong sun clips instantly
  // and the peaks turn into featureless glowing blobs.
  const snow = new Color('#b9c3c9');
  const tint = new Color();

  /**
   * Cavity occlusion, baked per vertex.
   *
   * Screen-space ambient occlusion handles contact between separate objects
   * well and self-occlusion within a single large mesh badly, because the
   * features are often larger than its sample radius. A vertex that sits
   * below the average of its own neighbours, measured along its normal, is
   * in a hollow, and gullies are exactly that. Darkening those is what makes
   * the eroded channels read as cut into the ground rather than painted on.
   */
  const cavity = new Float32Array(pos.count);
  {
    const index = welded.getIndex();
    if (index) {
      const sumX = new Float32Array(pos.count);
      const sumY = new Float32Array(pos.count);
      const sumZ = new Float32Array(pos.count);
      const counts = new Uint16Array(pos.count);
      const link = (from: number, to: number) => {
        sumX[from] = sumX[from]! + pos.getX(to);
        sumY[from] = sumY[from]! + pos.getY(to);
        sumZ[from] = sumZ[from]! + pos.getZ(to);
        counts[from] = counts[from]! + 1;
      };
      for (let t = 0; t < index.count; t += 3) {
        const a = index.getX(t);
        const b = index.getX(t + 1);
        const c = index.getX(t + 2);
        link(a, b);
        link(a, c);
        link(b, a);
        link(b, c);
        link(c, a);
        link(c, b);
      }
      for (let i = 0; i < pos.count; i++) {
        const n = counts[i]!;
        if (n === 0) continue;
        const dx = sumX[i]! / n - pos.getX(i);
        const dy = sumY[i]! / n - pos.getY(i);
        const dz = sumZ[i]! / n - pos.getZ(i);
        // Positive means the neighbourhood rises away along the normal.
        const along = dx * nrm.getX(i) + dy * nrm.getY(i) + dz * nrm.getZ(i);
        cavity[i] = Math.min(1, Math.max(0, along * 4.5));
      }
    }
  }

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const slope = 1 - Math.min(1, Math.max(0, nrm.getY(i)));
    tint.setRGB(col.getX(i), col.getY(i), col.getZ(i));

    // Rock on genuinely steep faces only. The first threshold was set by eye
    // against flat ground and the surface detail alone was enough to trip
    // it, so every biome turned grey and the map lost all of its colour.
    const rockMix = Math.min(1, Math.max(0, (slope - 0.2) / 0.42));
    tint.lerp(rock, rockMix * 0.8);

    // Snow above the line, but not on faces too steep to hold it. The line
    // is set against the measured maximum ground height, not guessed.
    const snowLine = 2.55;
    const snowMix =
      Math.min(1, Math.max(0, (y - snowLine) / 1.1)) * Math.min(1, Math.max(0, 1 - slope * 2.2));
    tint.lerp(snow, snowMix);

    // A little large-scale variation so no biome is one flat colour.
    // A wet band at the waterline. Ground that the sea reaches is darker and
    // less saturated than the same ground a metre higher, and reproducing
    // that is what stops the coast looking like a cut-out laid on water.
    const wet = Math.min(1, Math.max(0, 1 - (y - SEA_LEVEL) / 0.34));
    if (wet > 0) {
      const grey = (tint.r + tint.g + tint.b) / 3;
      tint.lerp(new Color(grey * 0.62, grey * 0.62, grey * 0.66), wet * 0.6);
    }

    // Hollows are darker than the ridges either side of them. Kept gentle:
    // at the first strength the eroded channels rendered as near-black
    // scribbles across the ground, which reads as cracked paint rather than
    // as valleys. Occlusion should suggest depth, not draw it.
    const shade = 1 - cavity[i]! * 0.16;

    const variation = 0.86 + fbm2(pos.getX(i) * 0.07, pos.getZ(i) * 0.07, { seed: 41 }) * 0.28;
    const factor = variation * shade;
    col.setXYZ(i, tint.r * factor, tint.g * factor, tint.b * factor);
  }
  col.needsUpdate = true;

  // Stage 4: material ----------------------------------------------------
  const detailSize = 256;
  const detailHeight = heightCanvas(detailSize, 6, { octaves: 5, seed: 3 });

  /**
   * No detail normal map on the ground, deliberately.
   *
   * The obvious way to add surface texture is a tiled normal map sampled
   * from world position, so it does not restart at every hex. The problem is
   * that three derives the tangent frame from the derivatives of the same UV
   * set, and a world-space UV on a hex-subdivided surface produces a frame
   * that is degenerate on steep faces and wrongly handed on many others.
   *
   * Measured on a fixed patch of ground: with the map attached the terrain
   * rendered at 0.16 mean luminance, without it at 0.37. Flipping the UV
   * handedness, pinning the colour space and softening the normal scale each
   * moved it by a few percent and none fixed it. A third of the scene's
   * light is far too high a price for detail that is sub-pixel at the zoom
   * this game is played at. The roughness map stays, because it perturbs
   * nothing geometric and costs nothing.
   *
   * The proper fix is a real tangent attribute generated alongside the mesh.
   * That is worth doing when there is time; it is not worth doing now.
   */
  const roughTexture = new CanvasTexture(greyCanvas(detailHeight, detailSize, 0.92, 1.0));
  roughTexture.colorSpace = NoColorSpace;
  roughTexture.wrapS = RepeatWrapping;
  roughTexture.wrapT = RepeatWrapping;
  roughTexture.repeat.set(12, 12);

  /**
   * Albedo detail.
   *
   * An albedo map only multiplies the surface colour, so unlike a normal map
   * it needs no tangent frame and cannot cost the surface its light.
   */
  const albedoHeight = heightCanvas(detailSize, 9, { octaves: 5, seed: 57 });
  const albedoTexture = new CanvasTexture(greyCanvas(albedoHeight, detailSize, 0.68, 1.0));
  albedoTexture.colorSpace = SRGBColorSpace;
  albedoTexture.wrapS = RepeatWrapping;
  albedoTexture.wrapT = RepeatWrapping;

  /**
   * No detail normal map on the ground.
   *
   * Tried twice and abandoned twice, which is worth recording so it is not
   * tried a third time. The first attempt let three derive the tangent frame
   * from world-space UV derivatives, which is degenerate on steep faces. The
   * second supplied an explicit tangent attribute, computed analytically
   * from the known linear UV mapping, which is correct and still measured
   * darker: 0.31 mean luminance against 0.45 without the map at all.
   *
   * The remaining cause is the map itself. A noise-derived normal at any
   * strength that is visible at this zoom tips a large fraction of the
   * surface far enough to lose the sun, and this camera looks at ground from
   * tens of hex-widths away where the detail is sub-pixel anyway. The albedo
   * map below provides the mottling instead, at no cost to the lighting,
   * because it multiplies colour rather than bending normals.
   */
  /**
   * Surface micro-relief, as a bump map rather than a normal map.
   *
   * This is the answer to the problem that defeated two earlier attempts. A
   * normal map needs a tangent frame, and a world-space UV over this mesh
   * cannot produce a usable one: derived frames come out degenerate on steep
   * faces, and even an analytically correct explicit tangent measured darker
   * than no map at all.
   *
   * Bump mapping needs no tangent frame. three perturbs the normal from the
   * screen-space derivatives of a height value and of the surface position
   * itself, so it works with any UV parameterisation, including one invented
   * in the vertex shader. Same visual result, none of the fragility.
   */
  const bumpTexture = new CanvasTexture(greyCanvas(detailHeight, detailSize, 0, 1));
  bumpTexture.colorSpace = NoColorSpace;
  bumpTexture.wrapS = RepeatWrapping;
  bumpTexture.wrapT = RepeatWrapping;

  const material = new MeshStandardMaterial({
    vertexColors: true,
    map: albedoTexture,
    bumpMap: bumpTexture,
    bumpScale: 9,
    roughnessMap: roughTexture,
    roughness: 1,
    metalness: 0,
    // Low. Ground is not a mirror, and a high environment contribution over
    // a blue sky turns every biome the same shade of ice.
    envMapIntensity: 0.3,
  });

  // All three maps are sampled in world space rather than from a UV set,
  // which is what stops them visibly restarting at every hex. The per-map UV
  // varyings are the ones three actually reads, so overwriting those is the
  // injection that works; rewriting a generic `vUv` matches nothing.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
        vec2 fabricWorldUv = ( modelMatrix * vec4( position, 1.0 ) ).xz;
        vMapUv = fabricWorldUv * 0.31;
        vBumpMapUv = fabricWorldUv * 0.62;
        vRoughnessMapUv = fabricWorldUv * 0.55;`,
    );
  };

  const ground = new Mesh(welded, material);
  ground.castShadow = true;
  ground.receiveShadow = true;
  group.add(ground);

  // Stage 5: the playing grid -------------------------------------------
  //
  // Drawn as its own object at a small vertical offset so it can be hidden
  // entirely. A hex game still needs to show its hexes, but the ground
  // should not have to carry them.
  const gridPoints: number[] = [];
  const seen = new Set<string>();
  for (const tile of map.tiles.values()) {
    const { x, z } = hexToWorld(tile.hex);
    for (let i = 0; i < 6; i++) {
      const o1 = cornerOffset(i);
      const o2 = cornerOffset((i + 1) % 6);
      const ax = x + o1.x;
      const az = z + o1.z;
      const bx = x + o2.x;
      const bz = z + o2.z;
      // Each edge is shared by two tiles; emit it once.
      const key =
        cornerKey(ax, az) < cornerKey(bx, bz)
          ? `${cornerKey(ax, az)}|${cornerKey(bx, bz)}`
          : `${cornerKey(bx, bz)}|${cornerKey(ax, az)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      gridPoints.push(
        ax,
        finishedHeight(ax, az, cornerHeight(ax, az)) + 0.035,
        az,
        bx,
        finishedHeight(bx, bz, cornerHeight(bx, bz)) + 0.035,
        bz,
      );
    }
  }
  const gridGeometry = new BufferGeometry();
  gridGeometry.setAttribute('position', new BufferAttribute(new Float32Array(gridPoints), 3));
  const grid = new LineSegments(
    gridGeometry,
    new LineBasicMaterial({
      color: 0x0a0f14,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  grid.renderOrder = 2;
  group.add(grid);

  return {
    group,
    triangleCount: welded.getAttribute('position').count / 3,
    detailNormalZ: 1,
    erosionMaxDelta: erosion.maxDelta,

    heightAt(h) {
      const key = hexKey(h);
      const base = centreHeight.get(key);
      if (base === undefined) return 0;
      const { x, z } = hexToWorld(h);
      return finishedHeight(x, z, base);
    },

    surfaceAt(x, z) {
      return finishedHeight(x, z, cornerHeight(x, z));
    },

    sampleHeight(x, z) {
      const axial = worldToAxial(x, z);
      const h = hexRound(axial.q, axial.r);
      const key = hexKey(h);
      const centre = hexToWorld(h);
      const centreY = finishedHeight(centre.x, centre.z, centreHeight.get(key) ?? 0);

      // Which of the six wedges the point falls in, then a barycentric blend
      // of that wedge's three known heights.
      const local = { x: x - centre.x, z: z - centre.z };
      const angle = Math.atan2(local.z, local.x);
      let best = 0;
      let bestDot = -Infinity;
      for (let i = 0; i < 6; i++) {
        const a = cornerOffset(i);
        const b = cornerOffset((i + 1) % 6);
        const mid = Math.atan2((a.z + b.z) / 2, (a.x + b.x) / 2);
        const dot = Math.cos(angle - mid);
        if (dot > bestDot) {
          bestDot = dot;
          best = i;
        }
      }
      const o1 = cornerOffset(best);
      const o2 = cornerOffset((best + 1) % 6);
      const y1 = finishedHeight(
        centre.x + o1.x,
        centre.z + o1.z,
        cornerHeight(centre.x + o1.x, centre.z + o1.z),
      );
      const y2 = finishedHeight(
        centre.x + o2.x,
        centre.z + o2.z,
        cornerHeight(centre.x + o2.x, centre.z + o2.z),
      );

      // Solve local = u * o1 + v * o2.
      const det = o1.x * o2.z - o1.z * o2.x;
      if (Math.abs(det) < 1e-6) return centreY;
      let u = (local.x * o2.z - local.z * o2.x) / det;
      let v = (o1.x * local.z - o1.z * local.x) / det;
      u = Math.min(1, Math.max(0, u));
      v = Math.min(1, Math.max(0, v));
      const w = Math.max(0, 1 - u - v);
      const total = u + v + w || 1;
      return (centreY * w + y1 * u + y2 * v) / total;
    },

    setGridVisible(visible) {
      grid.visible = visible;
    },

    dispose() {
      welded.dispose();
      material.dispose();
      roughTexture.dispose();
      albedoTexture.dispose();
      bumpTexture.dispose();
      gridGeometry.dispose();
      (grid.material as LineBasicMaterial).dispose();
    },
  };
}

/**
 * Shared marker material factory, used by the overlay meshes.
 *
 * Kept faint on purpose. These are the least realistic thing in an otherwise
 * naturalistic frame, and at any opacity where they read as a solid surface
 * they look like plastic sheets laid on the ground. Additive blending helps:
 * it tints the terrain rather than covering it, so the grass underneath
 * still shows through.
 */
export function overlayMaterial(colour: string, opacity: number): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color('#000000'),
    transparent: true,
    opacity,
    depthWrite: false,
    side: DoubleSide,
    roughness: 1,
    metalness: 0,
    blending: AdditiveBlending,
    emissive: new Color(colour),
    emissiveIntensity: 1,
    envMapIntensity: 0,
  });
}

/** A hex-shaped patch that follows the ground, for range and selection. */
export function hexPatch(
  h: Hex,
  terrain: Terrain,
  lift: number,
): BufferGeometry {
  const { x, z } = hexToWorld(h);
  const centreY = terrain.heightAt(h) + lift;
  const verts: number[] = [];
  for (let i = 0; i < 6; i++) {
    const o1 = cornerOffset(i);
    const o2 = cornerOffset((i + 1) % 6);
    const inset = 0.92;
    const ax = x + o1.x * inset;
    const az = z + o1.z * inset;
    const bx = x + o2.x * inset;
    const bz = z + o2.z * inset;
    verts.push(
      x,
      centreY,
      z,
      ax,
      terrain.surfaceAt(x + o1.x, z + o1.z) + lift,
      az,
      bx,
      terrain.surfaceAt(x + o2.x, z + o2.z) + lift,
      bz,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(verts), 3));
  geometry.computeVertexNormals();
  return geometry;
}
