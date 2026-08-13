import { BALL_RADIUS, type BallState } from "../lib/physics";
import {
  CONTACT_X,
  NET_HEIGHT,
  NET_X,
  TABLE_LENGTH,
  simulateReturn,
  traceServe,
  type ReturnOutcome,
  type ReturnTrace,
  type SpinPreset,
} from "../lib/simulate";

// Control ranges. These are the page's, and spec/assignment-1.test.ts keeps
// its own copy on purpose — changing the sliders is meant to be a deliberate
// edit to the test too.
const BAT_ANGLE = { min: -30, max: 70 };
const SWING_DIRECTION = { min: -60, max: 80 };

// The scene the side view draws, in metres: the whole table, the receiver's
// contact point, and enough run-off past the far end that a ball going long is
// visibly going long.
const SCENE = { xMin: -0.35, xMax: 3.3, yMin: -0.18, yMax: 0.4 };
const SCENE_ASPECT = (SCENE.xMax - SCENE.xMin) / (SCENE.yMax - SCENE.yMin);

/**
 * How much taller than true aspect the side view is allowed to be.
 *
 * A table is 2.74 m long and the net is 15 cm high. Drawn honestly across any
 * screen, "clipped the net" and "cleared it by two centimetres" are the same
 * couple of pixels — and that distinction is the entire page. Heights are
 * stretched and the factor is printed on the canvas, the way a ballistics
 * diagram does it. The bat and the swing arrow are exempt: those are drawn at
 * their true angles, because the bat angle is the thing being explained and a
 * 45° face has to look like 45°.
 *
 * A phone gets more of it than a desktop, because it needs more: at 390 px the
 * whole table is 334 px wide and the true-aspect picture is 53 px tall.
 */
const HEIGHT_EXAGGERATION = 1.6;
const MAX_EXAGGERATION = 3;
const MIN_SCENE_HEIGHT = 170;
const MAX_SCENE_HEIGHT = 340;

/** Sampling resolution of the solution map, in degrees. */
const MAP_STEP = 2;

const OUTCOMES = {
  IN: { colour: "#4ade80", label: "IN", verdict: "lands on the table" },
  NET: { colour: "#fb7185", label: "NET", verdict: "into the net" },
  OUT: { colour: "#fbbf24", label: "OUT", verdict: "long, past the end line" },
} as const;

const INK = {
  table: "#1d4ed8",
  tableEdge: "#dbeafe",
  tableBody: "#0b0d12",
  target: "rgba(74, 222, 128, 0.14)",
  net: "#e5e7eb",
  serve: "#60a5fa",
  bat: "#f4f4f5",
  rubber: "#ef4444",
  handle: "#a1a1aa",
  swing: "#c4b5fd",
  guide: "rgba(232, 234, 240, 0.28)",
  label: "rgba(232, 234, 240, 0.66)",
} as const;

const state = {
  preset: "backspin" as SpinPreset,
  batAngle: 0,
  swingDirection: 5,
};

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
}

// ------------------------------------------------------------------ the scene

interface View {
  x: (x: number) => number;
  y: (y: number) => number;
  /** Horizontal pixels per metre. */
  scale: number;
  /** Vertical pixels per metre; equals `scale` unless heights are stretched. */
  vScale: number;
  width: number;
  height: number;
}

/**
 * Sizes the canvas for its CSS width and the device pixel ratio, and returns a
 * scene-to-pixel transform.
 *
 * Heights take any vertical room the box has spare. A table tennis table is a
 * genuinely long, flat thing: at true aspect on a 390 px phone the net is
 * about fifteen pixels tall, and clipping it looks identical to clearing it.
 * Where the box is taller than true aspect needs, the height axis stretches to
 * fill it and the factor is drawn on the canvas. At desktop width there is no
 * spare room, the factor is 1, and the picture is true to life.
 */
function fitScene(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; view: View } | null {
  const width = canvas.clientWidth;
  if (width < 1) return null;
  const height = Math.round(
    Math.min(
      Math.max((width / SCENE_ASPECT) * HEIGHT_EXAGGERATION, MIN_SCENE_HEIGHT),
      MAX_SCENE_HEIGHT,
    ),
  );
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const sceneW = SCENE.xMax - SCENE.xMin;
  const sceneH = SCENE.yMax - SCENE.yMin;
  const scale = width / sceneW;
  const vScale = Math.min(height / sceneH, scale * MAX_EXAGGERATION);
  const oy = (height - sceneH * vScale) / 2;

  return {
    ctx,
    view: {
      x: (x) => (x - SCENE.xMin) * scale,
      y: (y) => height - oy - (y - SCENE.yMin) * vScale,
      scale,
      vScale,
      width,
      height,
    },
  };
}

function drawTable(ctx: CanvasRenderingContext2D, view: View): void {
  const surfaceY = view.y(0);

  // The half a return has to land in, marked as a band sitting on the surface
  // rather than a full-height block — it is a landing zone, not a wall.
  ctx.fillStyle = INK.target;
  ctx.fillRect(view.x(0), view.y(0.14), view.x(NET_X) - view.x(0), surfaceY - view.y(0.14));
  ctx.strokeStyle = "rgb(74 222 128 / 55%)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(view.x(0), surfaceY);
  ctx.lineTo(view.x(NET_X), surfaceY);
  ctx.stroke();

  const slab = Math.max(4, 0.022 * view.vScale);
  ctx.fillStyle = INK.table;
  ctx.fillRect(view.x(0), surfaceY, view.x(TABLE_LENGTH) - view.x(0), slab);
  ctx.fillStyle = INK.tableEdge;
  ctx.fillRect(view.x(0), surfaceY - 1.5, view.x(TABLE_LENGTH) - view.x(0), 1.5);

  ctx.fillStyle = INK.tableBody;
  for (const legX of [0.14, TABLE_LENGTH - 0.14]) {
    ctx.fillRect(view.x(legX), surfaceY + slab, Math.max(3, 0.05 * view.scale), view.height);
  }

  // The net. Everything on this page turns on whether the ball got over it, so
  // it is drawn to be unmissable rather than to scale in thickness.
  const netTop = view.y(NET_HEIGHT);
  const netX = view.x(NET_X);
  ctx.fillStyle = "rgb(229 231 235 / 22%)";
  ctx.fillRect(netX - 4, netTop, 8, surfaceY - netTop);
  ctx.strokeStyle = INK.net;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.75;
  for (let i = 1; i < 5; i++) {
    const y = netTop + ((surfaceY - netTop) * i) / 5;
    ctx.beginPath();
    ctx.moveTo(netX - 4, y);
    ctx.lineTo(netX + 4, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = INK.net;
  ctx.fillRect(netX - 6, netTop - 2.5, 12, 2.5);
  ctx.fillRect(netX - 1, netTop, 2, surfaceY - netTop);

  // The plane the receiver takes the ball on.
  ctx.strokeStyle = INK.guide;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(view.x(CONTACT_X), view.y(SCENE.yMax));
  ctx.lineTo(view.x(CONTACT_X), view.y(SCENE.yMin));
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  view: View,
  path: BallState[],
  colour: string,
  { dashed = false, width = 2 } = {},
): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash(dashed ? [5, 5] : []);
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < path.length; i += 8) {
    const p = path[i];
    if (p.y < SCENE.yMin - 0.2) break;
    const px = view.x(p.x);
    const py = view.y(p.y);
    if (started) ctx.lineTo(px, py);
    else {
      ctx.moveTo(px, py);
      started = true;
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBat(ctx: CanvasRenderingContext2D, view: View, contact: BallState): void {
  const face = (state.batAngle * Math.PI) / 180;
  const swing = (state.swingDirection * Math.PI) / 180;
  const cx = view.x(contact.x);
  const cy = view.y(contact.y);

  // The blade lies along the face, perpendicular to the normal (-cos, sin).
  // Drawn isotropically so the angle on screen is the angle in the readout —
  // scaling it with the stretched height axis would make a 45° face look like
  // 60°, which is precisely the number the page is asking people to read.
  const iso = Math.sqrt(view.scale * view.vScale);
  const half = 0.08;
  const dx = Math.sin(face) * half * iso;
  const dy = Math.cos(face) * half * iso;

  ctx.lineCap = "round";
  ctx.strokeStyle = INK.handle;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy + dy);
  ctx.lineTo(cx - dx * 2, cy + dy * 2);
  ctx.stroke();

  ctx.strokeStyle = INK.bat;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy + dy);
  ctx.lineTo(cx + dx, cy - dy);
  ctx.stroke();

  // Rubber on the hitting face, so "open" and "closed" read at a glance. The
  // offset follows the face normal (-cos, sin), negated on y because canvas y
  // grows downward — get that sign wrong and the rubber sits on the back of
  // the blade, facing away from the ball it is supposed to be gripping.
  const outX = -Math.cos(face) * 3.5;
  const outY = -Math.sin(face) * 3.5;
  ctx.strokeStyle = INK.rubber;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - dx + outX, cy + dy + outY);
  ctx.lineTo(cx + dx + outX, cy - dy + outY);
  ctx.stroke();

  // Swing direction, isotropic for the same reason as the blade.
  const len = 0.3;
  const ax = cx - Math.cos(swing) * len * iso;
  const ay = cy - Math.sin(swing) * len * iso;
  ctx.strokeStyle = INK.swing;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ax, ay);
  ctx.stroke();
  const head = Math.atan2(ay - cy, ax - cx);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - Math.cos(head - 0.45) * 8, ay - Math.sin(head - 0.45) * 8);
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - Math.cos(head + 0.45) * 8, ay - Math.sin(head + 0.45) * 8);
  ctx.stroke();
}

/**
 * Marks where the return finished.
 *
 * A failed return can be very short — a vertical bat against heavy backspin
 * buries the ball in your own half about 27 cm from the bat — and without a
 * marker that reads as "nothing happened" rather than as the emphatic failure
 * it is.
 */
function markEnding(ctx: CanvasRenderingContext2D, view: View, result: ReturnTrace): void {
  const end = result.path[result.path.length - 1];
  const colour = OUTCOMES[result.result.outcome].colour;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2.5;

  if (result.result.outcome === "IN") {
    ctx.beginPath();
    ctx.arc(view.x(result.result.landingX), view.y(0), 7, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  const cx = view.x(end.x);
  const cy = view.y(end.y);
  const r = 6;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r);
  ctx.lineTo(cx + r, cy + r);
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx - r, cy + r);
  ctx.stroke();
}

function drawLabels(ctx: CanvasRenderingContext2D, view: View): void {
  ctx.fillStyle = INK.label;
  ctx.font = "500 11px system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.fillText("land it in here", view.x(NET_X / 2), view.y(0) + 9);
  ctx.textAlign = "right";
  ctx.fillText("your bat", view.x(CONTACT_X) - 8, view.y(SCENE.yMax) + 3);
  if (view.vScale > view.scale * 1.02) {
    ctx.textAlign = "left";
    ctx.fillText(
      `heights ×${(view.vScale / view.scale).toFixed(1)} — lengths true`,
      4,
      view.y(SCENE.yMax) + 3,
    );
  }
}

// ----------------------------------------------------------- the solution map

const NET_CELL = 0;
const OUT_CELL = 1;
const IN_CELL = 2;

interface SolutionMap {
  cells: Uint8Array;
  cols: number;
  rows: number;
  /** The span of bat angles that return the ball at all. */
  band: { min: number; max: number } | null;
  done: boolean;
  cursor: number;
}

const maps = new Map<SpinPreset, SolutionMap>();

function mapFor(preset: SpinPreset): SolutionMap {
  const existing = maps.get(preset);
  if (existing) return existing;
  const cols = Math.floor((SWING_DIRECTION.max - SWING_DIRECTION.min) / MAP_STEP) + 1;
  const rows = Math.floor((BAT_ANGLE.max - BAT_ANGLE.min) / MAP_STEP) + 1;
  const fresh: SolutionMap = {
    cells: new Uint8Array(cols * rows),
    cols,
    rows,
    band: null,
    done: false,
    cursor: 0,
  };
  maps.set(preset, fresh);
  return fresh;
}

/**
 * Fills in part of a map within a time budget; returns true when it is done.
 *
 * The full grid is ~3600 simulations, around 200 ms in one go — enough to drop
 * frames and stall the sliders while it runs. A slice per frame keeps the
 * controls live, and the map visibly develops rather than appearing at once.
 */
function advanceMap(preset: SpinPreset, budgetMs: number): boolean {
  const map = mapFor(preset);
  if (map.done) return true;
  const deadline = performance.now() + budgetMs;
  while (map.cursor < map.cells.length) {
    const bat = BAT_ANGLE.min + Math.floor(map.cursor / map.cols) * MAP_STEP;
    const swing = SWING_DIRECTION.min + (map.cursor % map.cols) * MAP_STEP;
    const outcome = simulateReturn(preset, bat, swing).result.outcome;
    map.cells[map.cursor] =
      outcome === "IN" ? IN_CELL : outcome === "OUT" ? OUT_CELL : NET_CELL;
    map.cursor++;
    if ((map.cursor & 63) === 0 && performance.now() > deadline) return false;
  }
  map.done = true;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < map.cells.length; i++) {
    if (map.cells[i] !== IN_CELL) continue;
    const bat = BAT_ANGLE.min + Math.floor(i / map.cols) * MAP_STEP;
    min = Math.min(min, bat);
    max = Math.max(max, bat);
  }
  map.band = Number.isFinite(min) ? { min, max } : null;
  return true;
}

interface Plot {
  left: number;
  top: number;
  w: number;
  h: number;
}

let plot: Plot | null = null;

function drawMap(canvas: HTMLCanvasElement, preset: SpinPreset): void {
  const map = mapFor(preset);
  const width = canvas.clientWidth;
  if (width < 1) return;
  const height = Math.round(Math.min(Math.max(width * 0.66, 200), 330));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pad = { left: 42, right: 18, top: 6, bottom: 30 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  plot = { left: pad.left, top: pad.top, w: plotW, h: plotH };

  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0, 0, width, height);

  const cw = plotW / map.cols;
  const ch = plotH / map.rows;
  // Cell edges are rounded to whole pixels and shared between neighbours.
  // Painting each cell at its fractional size plus a pixel of slop instead
  // leaves a visible hatch over the whole map, which reads as a texture the
  // data does not have.
  const cellRect = (index: number): [number, number, number, number] => {
    const col = index % map.cols;
    const row = Math.floor(index / map.cols);
    const x0 = Math.round(pad.left + col * cw);
    const x1 = Math.round(pad.left + (col + 1) * cw);
    // Bat angle increases upward.
    const y0 = Math.round(pad.top + plotH - (row + 1) * ch);
    const y1 = Math.round(pad.top + plotH - row * ch);
    return [x0, y0, x1 - x0, y1 - y0];
  };

  for (let i = 0; i < map.cursor; i++) {
    const cell = map.cells[i];
    ctx.fillStyle =
      cell === IN_CELL
        ? OUTCOMES.IN.colour
        : cell === OUT_CELL
          ? "rgb(251 191 36 / 32%)"
          : "rgb(251 113 133 / 20%)";
    const [x, y, w, h] = cellRect(i);
    ctx.fillRect(x, y, w, h);
  }

  // A ghost of the other serve's answer, so the shift is visible in one
  // picture rather than only by flipping the toggle and remembering.
  const ghost = maps.get(preset === "backspin" ? "topspin" : "backspin");
  if (ghost?.done) {
    ctx.fillStyle = "rgb(255 255 255 / 17%)";
    for (let i = 0; i < ghost.cells.length; i++) {
      if (ghost.cells[i] !== IN_CELL) continue;
      const [x, y, w, h] = cellRect(i);
      ctx.fillRect(x, y, w, h);
    }
  }

  ctx.strokeStyle = "rgba(232, 234, 240, 0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad.left + 0.5, pad.top + 0.5, plotW, plotH);

  ctx.fillStyle = INK.label;
  ctx.font = "500 10px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const angle of [-30, 0, 35, 70]) {
    const y = pad.top + plotH - ((angle - BAT_ANGLE.min) / (BAT_ANGLE.max - BAT_ANGLE.min)) * plotH;
    ctx.fillText(`${angle}°`, pad.left - 6, y);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const angle of [-60, -10, 35, 80]) {
    const x =
      pad.left +
      ((angle - SWING_DIRECTION.min) / (SWING_DIRECTION.max - SWING_DIRECTION.min)) * plotW;
    ctx.fillText(`${angle}°`, x, pad.top + plotH + 6);
  }
  ctx.fillText("swing direction", pad.left + plotW / 2, pad.top + plotH + 18);

  // Where the visitor is now.
  const mx =
    pad.left +
    ((state.swingDirection - SWING_DIRECTION.min) /
      (SWING_DIRECTION.max - SWING_DIRECTION.min)) *
      plotW;
  const my =
    pad.top + plotH - ((state.batAngle - BAT_ANGLE.min) / (BAT_ANGLE.max - BAT_ANGLE.min)) * plotH;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#0b0d12";
  ctx.beginPath();
  ctx.arc(mx, my, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(mx, my, 6, 0, Math.PI * 2);
  ctx.stroke();
}

// -------------------------------------------------------------- the loop

let tableCanvas: HTMLCanvasElement;
let mapCanvas: HTMLCanvasElement;
let trace: ReturnTrace | null = null;
let animation = 0;
let controlsDirty = true;
let mapDirty = true;
let lastAnnounce = 0;
let reducedMotion = false;

function describe(outcome: ReturnOutcome): string {
  const bat =
    state.batAngle > 0
      ? `open ${state.batAngle}°`
      : state.batAngle < 0
        ? `closed ${Math.abs(state.batAngle)}°`
        : "vertical";
  const swing = `swung at ${state.swingDirection}°`;
  if (outcome.outcome === "IN") {
    return `Against the ${state.preset} serve, a ${bat} bat ${swing} returns the ball, landing ${outcome.landingX.toFixed(2)} m from the far end line.`;
  }
  return `Against the ${state.preset} serve, a ${bat} bat ${swing} sends the ball ${OUTCOMES[outcome.outcome].verdict}.`;
}

function updateReadouts(outcome: ReturnOutcome): void {
  const style = OUTCOMES[outcome.outcome];
  const label = el("outcome-label");
  label.textContent = style.label;
  label.style.color = style.colour;
  el("outcome-detail").textContent =
    outcome.outcome === "IN"
      ? `Lands ${outcome.landingX.toFixed(2)} m from the far end line.`
      : outcome.outcome === "NET"
        ? "It never gets over."
        : "It clears the net and keeps going.";
  tableCanvas.setAttribute("aria-label", describe(outcome));
}

function frame(now: number): void {
  // Both the current map filling in and the *other* one finishing change what
  // is on screen — the other one is the ghost band and the second half of the
  // summary sentence — so both have to mark the map dirty.
  const current = mapFor(state.preset);
  const otherName: SpinPreset = state.preset === "backspin" ? "topspin" : "backspin";
  const cursorBefore = current.cursor;
  const otherDoneBefore = maps.get(otherName)?.done ?? false;
  if (advanceMap(state.preset, 6)) {
    // Current preset is settled; warm the other so the toggle is instant.
    advanceMap(otherName, 3);
  }
  if (current.cursor !== cursorBefore || (maps.get(otherName)?.done ?? false) !== otherDoneBefore) {
    mapDirty = true;
    updateBandSummary();
  }

  if (controlsDirty || !trace) {
    trace = simulateReturn(state.preset, state.batAngle, state.swingDirection);
    updateReadouts(trace.result);
    controlsDirty = false;
    mapDirty = true;
  }

  const fitted = fitScene(tableCanvas);
  if (fitted) {
    const { ctx, view } = fitted;
    const serve = traceServe(state.preset);
    drawTable(ctx, view);
    drawPath(ctx, view, serve.path, INK.serve, { dashed: true, width: 1.5 });
    drawPath(ctx, view, trace.path, OUTCOMES[trace.result.outcome].colour, { width: 3 });
    drawLabels(ctx, view);
    drawBat(ctx, view, serve.contact);
    markEnding(ctx, view, trace);

    // A ball running the return, so the direction of travel is never in doubt.
    const frames = trace.path.length;
    const at = reducedMotion
      ? trace.path[frames - 1]
      : (trace.path[Math.floor(((now / 1500) % 1) * frames)] ?? trace.path[frames - 1]);
    ctx.fillStyle = "#fff7ed";
    ctx.beginPath();
    ctx.arc(view.x(at.x), view.y(at.y), Math.max(3, BALL_RADIUS * view.scale), 0, Math.PI * 2);
    ctx.fill();
  }

  if (mapDirty) {
    drawMap(mapCanvas, state.preset);
    mapDirty = false;
  }

  // Screen readers hear the outcome once the visitor stops moving, not on
  // every pixel of slider travel.
  if (now - lastAnnounce > 600) {
    lastAnnounce = now;
    const live = el("outcome-live");
    const text = describe(trace.result);
    if (live.textContent !== text) live.textContent = text;
  }

  animation = requestAnimationFrame(frame);
}

function updateBandSummary(): void {
  const map = mapFor(state.preset);
  const otherName: SpinPreset = state.preset === "backspin" ? "topspin" : "backspin";
  const other = maps.get(otherName);
  const summary = el("map-summary");
  if (!map.done) {
    summary.textContent = "Working out every shot in range…";
    return;
  }
  if (!map.band) {
    summary.textContent = "No bat angle in this range returns the serve.";
    return;
  }
  let text = `Against ${state.preset}, only bat angles between ${map.band.min}° and ${map.band.max}° return the ball at all.`;
  if (other?.done && other.band) {
    text += ` Against ${otherName} the window runs ${other.band.min}° to ${other.band.max}°.`;
  }
  summary.textContent = text;

  // The page claims in prose that the two regions barely overlap. Counting it
  // here means the claim is read off the same simulation the visitor is
  // driving, rather than being a sentence that could quietly go stale.
  const overlapNode = el("map-overlap");
  if (other?.done) {
    let mine = 0;
    let shared = 0;
    for (let i = 0; i < map.cells.length; i++) {
      if (map.cells[i] !== IN_CELL) continue;
      mine++;
      if (other.cells[i] === IN_CELL) shared++;
    }
    overlapNode.textContent =
      mine === 0
        ? ""
        : `Of the ${mine} settings that return this serve, ${shared} also return the other one.`;
  } else {
    overlapNode.textContent = "";
  }
  mapCanvas.setAttribute(
    "aria-label",
    `${text} Swing direction runs left to right, bat angle bottom to top; green marks the settings that land the ball.`,
  );
}

// ------------------------------------------------------------------- controls

function syncInputs(): void {
  el<HTMLInputElement>("bat-angle").value = String(state.batAngle);
  el<HTMLInputElement>("swing-direction").value = String(state.swingDirection);
  el("bat-angle-value").textContent = `${state.batAngle}°`;
  el("swing-direction-value").textContent = `${state.swingDirection}°`;
  el("bat-angle-hint").textContent =
    state.batAngle > 0 ? "open" : state.batAngle < 0 ? "closed" : "vertical";
  el("swing-direction-hint").textContent =
    state.swingDirection > 0 ? "brushing up" : state.swingDirection < 0 ? "chopping down" : "flat";
  controlsDirty = true;
}

function nearestLanding(): { bat: number; swing: number } | null {
  const map = mapFor(state.preset);
  if (!map.done) return null;
  let best: { bat: number; swing: number; d: number } | null = null;
  for (let i = 0; i < map.cells.length; i++) {
    if (map.cells[i] !== IN_CELL) continue;
    const bat = BAT_ANGLE.min + Math.floor(i / map.cols) * MAP_STEP;
    const swing = SWING_DIRECTION.min + (i % map.cols) * MAP_STEP;
    const d = (bat - state.batAngle) ** 2 + (swing - state.swingDirection) ** 2;
    if (!best || d < best.d) best = { bat, swing, d };
  }
  return best;
}

function pointerToControls(event: PointerEvent): void {
  if (!plot) return;
  const rect = mapCanvas.getBoundingClientRect();
  const fx = (event.clientX - rect.left - plot.left) / plot.w;
  const fy = (event.clientY - rect.top - plot.top) / plot.h;
  const clamp = (v: number): number => Math.min(Math.max(v, 0), 1);
  state.swingDirection = Math.round(
    SWING_DIRECTION.min + clamp(fx) * (SWING_DIRECTION.max - SWING_DIRECTION.min),
  );
  state.batAngle = Math.round(
    BAT_ANGLE.min + (1 - clamp(fy)) * (BAT_ANGLE.max - BAT_ANGLE.min),
  );
  syncInputs();
}

export function boot(): void {
  tableCanvas = el<HTMLCanvasElement>("table-view");
  mapCanvas = el<HTMLCanvasElement>("solution-map");

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion = motionQuery.matches;
  motionQuery.addEventListener("change", (event) => {
    reducedMotion = event.matches;
  });

  el("bat-angle").addEventListener("input", (event) => {
    state.batAngle = Number((event.target as HTMLInputElement).value);
    syncInputs();
  });
  el("swing-direction").addEventListener("input", (event) => {
    state.swingDirection = Number((event.target as HTMLInputElement).value);
    syncInputs();
  });

  for (const input of document.querySelectorAll<HTMLInputElement>('input[name="serve"]')) {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.preset = input.value as SpinPreset;
      document.body.dataset.serve = state.preset;
      controlsDirty = true;
      mapDirty = true;
      updateBandSummary();
    });
  }

  el("find-shot").addEventListener("click", () => {
    const shot = nearestLanding();
    if (!shot) return;
    state.batAngle = shot.bat;
    state.swingDirection = shot.swing;
    syncInputs();
    el("outcome-live").textContent =
      `Moved to a ${shot.bat}° bat angle and a ${shot.swing}° swing, the nearest setting that lands.`;
  });

  // Dragging the map is a shortcut, never the only way in: everything it does,
  // the two sliders also do, and those are keyboard-operable by default.
  let dragging = false;
  mapCanvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    mapCanvas.setPointerCapture(event.pointerId);
    pointerToControls(event);
    event.preventDefault();
  });
  mapCanvas.addEventListener("pointermove", (event) => {
    if (dragging) pointerToControls(event);
  });
  for (const type of ["pointerup", "pointercancel"] as const) {
    mapCanvas.addEventListener(type, (event) => {
      dragging = false;
      if (mapCanvas.hasPointerCapture(event.pointerId)) {
        mapCanvas.releasePointerCapture(event.pointerId);
      }
    });
  }

  // A resize mid-interaction has to land: both canvases are re-fitted from
  // their new CSS width on the next frame.
  const refit = (): void => {
    mapDirty = true;
  };
  window.addEventListener("resize", refit);
  window.addEventListener("orientationchange", refit);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animation);
      animation = 0;
    } else if (!animation) {
      animation = requestAnimationFrame(frame);
    }
  });

  document.body.dataset.serve = state.preset;
  document.body.dataset.ready = "true";
  syncInputs();
  animation = requestAnimationFrame(frame);
}
