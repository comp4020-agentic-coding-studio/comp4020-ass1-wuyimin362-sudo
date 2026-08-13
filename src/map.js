/**
 * Act 3: the solution space, and the flip.
 *
 * Every bat angle against every swing direction, played out and coloured by
 * where the ball ended up. Section 2.3 puts bat angle on the horizontal axis
 * and swing direction on the vertical.
 *
 * @typedef {import('./solver.js').Grid} Grid
 * @typedef {import('./render.js').View} View
 */

import { SPIN } from "./physics.js";
import { INK } from "./render.js";
import {
  BAT_ANGLE,
  IN_CELL,
  NET_CELL,
  SWING_DIRECTION,
  feasibleStats,
  overlapRatio,
  returnFromContact,
  cachedServe,
} from "./solver.js";

/**
 * Section 9 sets P0 at 20x20 precomputed and P1 at 40x40 refined in a Web
 * Worker. Measured, a 40x40 scan is 43 ms — the worker's job was to keep the
 * main thread free, and a slice per animation frame does that without a second
 * file or a message protocol. INV-11 already pins the 3 s budget.
 */
export const MAP_N = 40;
const BAT_STEP = (BAT_ANGLE.max - BAT_ANGLE.min) / (MAP_N - 1);
const SWING_STEP = (SWING_DIRECTION.max - SWING_DIRECTION.min) / (MAP_N - 1);

/**
 * @typedef {{ cells: Uint8Array, cursor: number, done: boolean,
 *             stats: ReturnType<typeof feasibleStats> | null }} MapState
 */

/** @type {Map<string, MapState>} */
const maps = new Map();

/**
 * @param {'backspin' | 'topspin'} spin
 * @returns {MapState}
 */
export function mapFor(spin) {
  const existing = maps.get(spin);
  if (existing) return existing;
  /** @type {MapState} */
  const fresh = {
    cells: new Uint8Array(MAP_N * MAP_N),
    cursor: 0,
    done: false,
    stats: null,
  };
  maps.set(spin, fresh);
  return fresh;
}

/** Row/column to the angles they stand for. */
export const batAt = (/** @type {number} */ col) => BAT_ANGLE.min + col * BAT_STEP;
export const swingAt = (/** @type {number} */ row) => SWING_DIRECTION.min + row * SWING_STEP;

/**
 * Fill in part of a map within a time budget. Returns true when finished.
 *
 * @param {'backspin' | 'topspin'} spin
 * @param {number} budgetMs
 * @returns {boolean}
 */
export function advanceMap(spin, budgetMs) {
  const map = mapFor(spin);
  if (map.done) return true;
  const contact = cachedServe(spin).contact;
  const deadline = performance.now() + budgetMs;

  while (map.cursor < map.cells.length) {
    const col = map.cursor % MAP_N;
    const row = Math.floor(map.cursor / MAP_N);
    const { outcome } = returnFromContact(contact, batAt(col), swingAt(row)).result;
    map.cells[map.cursor] = outcome === "IN" ? IN_CELL : outcome === "OUT" ? 1 : NET_CELL;
    map.cursor++;
    if ((map.cursor & 31) === 0 && performance.now() > deadline) return false;
  }

  map.done = true;
  map.stats = feasibleStats({
    cells: map.cells,
    thetas: Array.from({ length: MAP_N }, (_, r) => swingAt(r)),
    phis: Array.from({ length: MAP_N }, (_, c) => batAt(c)),
    cols: MAP_N,
    rows: MAP_N,
  });
  return true;
}

/**
 * The bat-angle span that returns the ball at all, read off the map's own
 * cells so the sentence and the picture cannot disagree.
 *
 * @param {'backspin' | 'topspin'} spin
 * @returns {{ min: number, max: number, count: number } | null}
 */
export function batBand(spin) {
  const map = mapFor(spin);
  if (!map.done) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let count = 0;
  for (let i = 0; i < map.cells.length; i++) {
    if (map.cells[i] !== IN_CELL) continue;
    const bat = batAt(i % MAP_N);
    min = Math.min(min, bat);
    max = Math.max(max, bat);
    count++;
  }
  return count ? { min, max, count } : null;
}

/**
 * How much of the two answers is shared, counted off the maps themselves.
 *
 * @returns {{ shared: number, backspin: number, topspin: number, iou: number } | null}
 */
export function sharedGround() {
  const back = mapFor(SPIN.BACKSPIN);
  const top = mapFor(SPIN.TOPSPIN);
  if (!back.done || !top.done) return null;
  const grid = (/** @type {MapState} */ m) => ({
    cells: m.cells,
    thetas: [],
    phis: [],
    cols: MAP_N,
    rows: MAP_N,
  });
  let shared = 0;
  let b = 0;
  let t = 0;
  for (let i = 0; i < back.cells.length; i++) {
    const inB = back.cells[i] === IN_CELL;
    const inT = top.cells[i] === IN_CELL;
    if (inB) b++;
    if (inT) t++;
    if (inB && inT) shared++;
  }
  return { shared, backspin: b, topspin: t, iou: overlapRatio(grid(back), grid(top)) };
}

const PAD = { left: 46, right: 14, top: 12, bottom: 34 };

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{ ctx: CanvasRenderingContext2D, width: number, height: number,
 *             plot: { left: number, top: number, w: number, h: number } } | null}
 */
export function fitMap(canvas) {
  const width = canvas.clientWidth;
  if (width < 1) return null;
  const height = Math.round(Math.min(Math.max(width * 0.72, 240), 380));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return {
    ctx,
    width,
    height,
    plot: {
      left: PAD.left,
      top: PAD.top,
      w: width - PAD.left - PAD.right,
      h: height - PAD.top - PAD.bottom,
    },
  };
}

/**
 * Draw the map.
 *
 * The lit region is where the ball lands. Red is reserved for the cursor —
 * section 7 keeps `--rubber` for the thing you are currently doing — so the
 * answer region is drawn in `--line` and the failures recede into the table.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ left: number, top: number, w: number, h: number }} plot
 * @param {number} width @param {number} height
 * @param {'backspin' | 'topspin'} spin
 * @param {{ batAngle: number, swingDirection: number }} cursor
 * @param {boolean} showGhost
 */
export function drawMap(ctx, plot, width, height, spin, cursor, showGhost) {
  const map = mapFor(spin);
  const other = mapFor(spin === SPIN.BACKSPIN ? SPIN.TOPSPIN : SPIN.BACKSPIN);

  ctx.fillStyle = INK.tableLo;
  ctx.fillRect(0, 0, width, height);

  const cw = plot.w / MAP_N;
  const ch = plot.h / MAP_N;
  /** @param {number} i @returns {[number, number, number, number]} */
  const rect = (i) => {
    const col = i % MAP_N;
    const row = Math.floor(i / MAP_N);
    const x0 = Math.round(plot.left + col * cw);
    const x1 = Math.round(plot.left + (col + 1) * cw);
    // Swing direction increases upward.
    const y0 = Math.round(plot.top + plot.h - (row + 1) * ch);
    const y1 = Math.round(plot.top + plot.h - row * ch);
    return [x0, y0, x1 - x0, y1 - y0];
  };

  for (let i = 0; i < map.cursor; i++) {
    const cell = map.cells[i];
    ctx.fillStyle =
      cell === IN_CELL ? INK.line : cell === NET_CELL ? "rgba(92, 122, 133, 0.16)" : "rgba(92, 122, 133, 0.42)";
    const [x, y, w, h] = rect(i);
    ctx.fillRect(x, y, w, h);
  }

  // The other serve's answer, so the flip is visible in one picture as well as
  // by toggling and remembering.
  if (showGhost && other.done) {
    ctx.fillStyle = "rgba(237, 241, 238, 0.22)";
    for (let i = 0; i < other.cells.length; i++) {
      if (other.cells[i] !== IN_CELL) continue;
      const [x, y, w, h] = rect(i);
      ctx.fillRect(x, y, w, h);
    }
  }

  ctx.strokeStyle = "rgba(237, 241, 238, 0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(plot.left + 0.5, plot.top + 0.5, plot.w, plot.h);

  // Axes.
  ctx.font = '600 10px ui-monospace, "SF Mono", Menlo, monospace';
  ctx.fillStyle = "#8b9793";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const angle of [-30, 0, 35, 70]) {
    const x = plot.left + ((angle - BAT_ANGLE.min) / (BAT_ANGLE.max - BAT_ANGLE.min)) * plot.w;
    ctx.fillText(`${angle}°`, x, plot.top + plot.h + 6);
  }
  ctx.fillText("bat angle →", plot.left + plot.w / 2, plot.top + plot.h + 20);

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const angle of [-60, 0, 40, 80]) {
    const y =
      plot.top +
      plot.h -
      ((angle - SWING_DIRECTION.min) / (SWING_DIRECTION.max - SWING_DIRECTION.min)) * plot.h;
    ctx.fillText(`${angle}°`, plot.left - 6, y);
  }
  ctx.save();
  ctx.translate(12, plot.top + plot.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("swing direction →", 0, 0);
  ctx.restore();

  // The cursor: the one thing --rubber is spent on.
  const cx =
    plot.left + ((cursor.batAngle - BAT_ANGLE.min) / (BAT_ANGLE.max - BAT_ANGLE.min)) * plot.w;
  const cy =
    plot.top +
    plot.h -
    ((cursor.swingDirection - SWING_DIRECTION.min) /
      (SWING_DIRECTION.max - SWING_DIRECTION.min)) *
      plot.h;
  ctx.strokeStyle = INK.tableLo;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = INK.rubber;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Map a pointer position onto the two controls.
 *
 * @param {PointerEvent} event
 * @param {HTMLCanvasElement} canvas
 * @param {{ left: number, top: number, w: number, h: number }} plot
 * @returns {{ batAngle: number, swingDirection: number }}
 */
export function pointerToControls(event, canvas, plot) {
  const box = canvas.getBoundingClientRect();
  const clamp = (/** @type {number} */ v) => Math.min(Math.max(v, 0), 1);
  const fx = clamp((event.clientX - box.left - plot.left) / plot.w);
  const fy = clamp((event.clientY - box.top - plot.top) / plot.h);
  return {
    batAngle: Math.round(BAT_ANGLE.min + fx * (BAT_ANGLE.max - BAT_ANGLE.min)),
    swingDirection: Math.round(
      SWING_DIRECTION.min + (1 - fy) * (SWING_DIRECTION.max - SWING_DIRECTION.min),
    ),
  };
}
