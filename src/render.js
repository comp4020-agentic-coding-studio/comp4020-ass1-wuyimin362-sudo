/**
 * Canvas drawing. Reads trajectories that solver.js has already computed and
 * never advances the physics itself (execution plan section 4.4).
 *
 * @typedef {import('./physics.js').BallState} BallState
 * @typedef {{ toX: (x: number) => number, toY: (y: number) => number,
 *             scale: number, width: number, height: number }} View
 */

import { BALL_RADIUS, FIXED_DT, NET_HEIGHT, TABLE_HALF } from "./physics.js";

/** Section 7's palette, and the only place these values are written. */
export const INK = Object.freeze({
  table: "#12313D",
  tableLo: "#0B2029",
  line: "#EDF1EE",
  rubber: "#C8102E",
  ghost: "rgba(237, 241, 238, 0.28)",
  ghostStrong: "rgba(237, 241, 238, 0.5)",
  fail: "#5C7A85",
});

/**
 * The world the side view shows, in metres. Tight to what matters: the
 * receiver's contact point on the left, the net, and the whole of the server's
 * half where a good return has to land.
 */
export const SCENE = Object.freeze({ xMin: -2.05, xMax: 1.55, yMin: -0.12, yMax: 0.55 });
const SCENE_W = SCENE.xMax - SCENE.xMin;
const SCENE_H = SCENE.yMax - SCENE.yMin;
export const SCENE_ASPECT = SCENE_W / SCENE_H;

/** The base strobe interval, section 7: one ball every 8 ms. */
export const STROBE_MS = 8;
const STROBE_STEPS = Math.round((STROBE_MS / 1000) / FIXED_DT);

/**
 * Ghosts are drawn no smaller than this many pixels regardless of scale.
 *
 * The trail's *positions* are always true to the physics; only the glyph has a
 * floor. At phone width a 40 mm ball is under two pixels across, and a ghost
 * you cannot see carries neither the spacing nor the spin marker that are the
 * whole point of drawing it this way.
 */
const MIN_GHOST_PX = 4;

/**
 * Pick a strobe interval that still reads as separate balls at this scale.
 *
 * At 8 ms a ball travelling 5 m/s moves 4 cm, which is 3.7 px on a 332 px
 * phone — less than the 4 px ghost radius, so the trail fuses into a smear and
 * stops being a strobe at all. Stepping up in whole multiples of 8 ms keeps
 * the "equal time between balls" reading intact, which is the part that
 * encodes speed; the interval is printed in the legend so the number is never
 * assumed.
 *
 * @param {BallState[]} path
 * @param {number} scale pixels per metre
 * @param {number} radius ghost radius in pixels
 * @returns {number} multiple of STROBE_STEPS
 */
function strobeStride(path, scale, radius) {
  if (path.length < 2) return STROBE_STEPS;
  let fastest = 0;
  for (let i = 0; i < path.length; i += STROBE_STEPS) {
    fastest = Math.max(fastest, Math.hypot(path[i].vx, path[i].vy));
  }
  // Distance covered in one base interval, in pixels.
  const step = fastest * (STROBE_MS / 1000) * scale;
  if (step <= 0) return STROBE_STEPS;
  return STROBE_STEPS * Math.max(1, Math.ceil((radius * 2.3) / step));
}

/**
 * Build a scene-to-pixel transform and size the canvas for the device.
 *
 * The mapping is isotropic — one scale for both axes — and that is not
 * negotiable here: the ghosts are circles and the spin marker rides on their
 * rim, so any vertical exaggeration would turn them into ellipses and make the
 * rotation unreadable in exactly the frames where it matters most.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {{ ctx: CanvasRenderingContext2D, view: View } | null}
 */
export function fitScene(canvas) {
  const width = canvas.clientWidth;
  if (width < 1) return null;

  const height = Math.round(Math.min(Math.max(width / SCENE_ASPECT, 110), 320));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const scale = Math.min(width / SCENE_W, height / SCENE_H);
  const offsetX = (width - SCENE_W * scale) / 2;
  // Anchor to the bottom: any spare height becomes sky above the table,
  // which is where a lobbed return goes, rather than a gap under it.
  const offsetY = 0;

  return {
    ctx,
    view: {
      toX: (x) => offsetX + (x - SCENE.xMin) * scale,
      toY: (y) => height - offsetY - (y - SCENE.yMin) * scale,
      scale,
      width,
      height,
    },
  };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {View} view
 */
export function drawTable(ctx, view) {
  const surface = view.toY(0);
  const left = view.toX(-TABLE_HALF);
  const right = view.toX(TABLE_HALF);

  // Playing surface: a slab with a lit edge, sitting on its own shadow.
  const slab = Math.max(3, 0.02 * view.scale);
  ctx.fillStyle = INK.tableLo;
  ctx.fillRect(left, surface + slab, right - left, view.height);
  ctx.fillStyle = INK.table;
  ctx.fillRect(left, surface, right - left, slab);
  ctx.fillStyle = INK.line;
  ctx.fillRect(left, surface - 1.5, right - left, 1.5);

  // The half a return has to land in: a band lying on the surface rather than
  // a full-height wash, which read as a panel behind the play.
  const bandTop = view.toY(0.045);
  ctx.fillStyle = "rgba(237, 241, 238, 0.07)";
  ctx.fillRect(view.toX(0), bandTop, right - view.toX(0), surface - bandTop);

  // End lines, so the table reads as a table and "past the end line" has
  // something to be past.
  ctx.fillStyle = INK.line;
  for (const edge of [left, right]) {
    ctx.fillRect(edge - 1, surface - 7, 2, 7);
  }

  // Net.
  const netTop = view.toY(NET_HEIGHT);
  const netX = view.toX(0);
  ctx.strokeStyle = INK.line;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const y = netTop + ((surface - netTop) * i) / 5;
    ctx.beginPath();
    ctx.moveTo(netX - 4, y);
    ctx.lineTo(netX + 4, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = INK.line;
  ctx.fillRect(netX - 5, netTop - 2, 10, 2);
  ctx.fillRect(netX - 1, netTop, 2, surface - netTop);
}

/**
 * The signature: a trajectory drawn as one ball every 8 ms rather than as a
 * curve.
 *
 * Two things fall out of it for free. The gap between ghosts is the speed, so
 * a ball that is slowing is visibly bunching up. And each ghost carries a mark
 * on the same material point of the ball, carried round by the integrated
 * spin, so the direction and rate of rotation are legible directly off the
 * trail — which is the thing the page is actually about.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {View} view
 * @param {BallState[]} path
 * @param {{ colour?: string, mark?: string, faded?: boolean, startAngle?: number,
 *           sizeScale?: number, stride?: number }} [options]
 * @returns {number} the spin angle reached at the end of the path
 */
export function drawStrobe(ctx, view, path, options = {}) {
  const {
    colour = INK.ghost,
    mark = INK.rubber,
    faded = false,
    startAngle = 0,
    sizeScale = 1,
    stride,
  } = options;
  const radius = Math.max(MIN_GHOST_PX, BALL_RADIUS * view.scale) * sizeScale;
  const step = stride ?? strobeStride(path, view.scale, radius);

  let angle = startAngle;
  for (let i = 0; i < path.length; i++) {
    // Integrate the spin on every step, not just the drawn ones, or the marker
    // lags wherever the spin changed between ghosts.
    if (i > 0) angle += path[i].omega * FIXED_DT;
    if (i % step !== 0) continue;

    const ball = path[i];
    const cx = view.toX(ball.x);
    const cy = view.toY(ball.y);
    if (cx < -radius || cx > view.width + radius) continue;
    if (cy < -radius || cy > view.height + radius) continue;

    // Later ghosts fade slightly, so the direction of travel reads without an
    // arrowhead; a failed shot fades the whole way to section 7's --fail.
    const progress = i / Math.max(1, path.length - 1);
    ctx.globalAlpha = faded ? 1 - 0.6 * progress : 1;

    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // The marker rides the rim. Because the transform is isotropic, using it
    // for the offset makes the sense of rotation on screen match the sign of
    // omega without a special case.
    ctx.fillStyle = mark;
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(angle) * radius * 0.62,
      cy - Math.sin(angle) * radius * 0.62,
      Math.max(1.4, radius * 0.3),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return angle;
}

/**
 * How a shot finishes: section 7 asks for a fade into the net, a rush off the
 * frame when it is long, and an impact ring when it lands.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {View} view
 * @param {'NET' | 'OUT' | 'IN'} outcome
 * @param {BallState} end
 * @param {number} [landingX]
 */
export function drawEnding(ctx, view, outcome, end, landingX) {
  if (outcome === "IN" && landingX !== undefined) {
    const cx = view.toX(landingX);
    const cy = view.toY(0);
    ctx.strokeStyle = INK.line;
    for (const [r, alpha] of [
      [6, 0.9],
      [12, 0.45],
      [18, 0.2],
    ]) {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return;
  }

  if (outcome === "OUT") {
    // Leaving the picture is the point, so the mark sits on the frame edge in
    // the direction the ball went.
    const cx = Math.min(Math.max(view.toX(end.x), 8), view.width - 8);
    const cy = Math.min(Math.max(view.toY(end.y), 8), view.height - 8);
    ctx.strokeStyle = INK.line;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 2;
    const angle = Math.atan2(-end.vy, end.vx);
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(angle) * 14, cy - Math.sin(angle) * 14);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - Math.cos(angle - 0.5) * 9, cy - Math.sin(angle - 0.5) * 9);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - Math.cos(angle + 0.5) * 9, cy - Math.sin(angle + 0.5) * 9);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }

  // NET: a faded tick where it died, and nothing louder. Section 7 wants a
  // failure to read as running out of energy rather than as an alarm — but the
  // default shot buries into the receiver's own half about 30 cm from the bat,
  // and a fade that short is indistinguishable from nothing happening at all.
  ctx.strokeStyle = INK.fail;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(view.toX(end.x), view.toY(Math.max(end.y, 0)) - 9);
  ctx.lineTo(view.toX(end.x), view.toY(Math.max(end.y, 0)) + 3);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * The bat, drawn at the contact point.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {View} view
 * @param {BallState} contact
 * @param {number} batAngleDeg
 * @param {number} swingDirectionDeg
 */
export function drawBat(ctx, view, contact, batAngleDeg, swingDirectionDeg) {
  const face = (batAngleDeg * Math.PI) / 180;
  const swing = (swingDirectionDeg * Math.PI) / 180;
  const cx = view.toX(contact.x);
  const cy = view.toY(contact.y);

  // The blade lies along the face, perpendicular to the normal (cos, sin).
  const half = Math.max(18, 0.075 * view.scale);
  const dx = -Math.sin(face) * half;
  const dy = -Math.cos(face) * half;

  ctx.lineCap = "round";
  // Handle, pointing away from the ball.
  ctx.strokeStyle = INK.fail;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy - dy);
  ctx.lineTo(cx - dx * 1.9, cy - dy * 1.9);
  ctx.stroke();

  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy - dy);
  ctx.lineTo(cx + dx, cy + dy);
  ctx.stroke();

  // Rubber on the hitting face. Offset along the normal, with y negated for
  // canvas — get that sign wrong and the rubber sits on the back of the blade.
  const outX = Math.cos(face) * 3.5;
  const outY = -Math.sin(face) * 3.5;
  ctx.strokeStyle = INK.rubber;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - dx + outX, cy - dy + outY);
  ctx.lineTo(cx + dx + outX, cy + dy + outY);
  ctx.stroke();

  // Swing direction.
  const len = Math.max(40, 0.3 * view.scale);
  const ax = cx + Math.cos(swing) * len;
  const ay = cy - Math.sin(swing) * len;
  ctx.strokeStyle = INK.line;
  ctx.globalAlpha = 0.55;
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
  ctx.globalAlpha = 1;
}

/**
 * Draw one complete frame.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {View} view
 * @param {{ serve: BallState[], contact: BallState, ret: BallState[],
 *           outcome: 'NET' | 'OUT' | 'IN', landingX?: number,
 *           batAngle: number, swingDirection: number }} frame
 * @returns {{ strobeMs: number }}
 */
export function drawFrame(ctx, view, frame) {
  drawTable(ctx, view);

  // The serve is context, so it is drawn small, dim and without a spin marker.
  // At equal weight the two trails cross and neither is readable — which is
  // what the first render of this scene actually looked like.
  const radius = Math.max(MIN_GHOST_PX, BALL_RADIUS * view.scale);
  const serveStride = strobeStride(frame.serve, view.scale, radius);
  const endAngle = drawStrobe(ctx, view, frame.serve, {
    colour: "rgba(237, 241, 238, 0.16)",
    mark: "rgba(237, 241, 238, 0)",
    sizeScale: 0.5,
    stride: serveStride,
  });

  const failed = frame.outcome === "NET";
  const returnStride = strobeStride(frame.ret, view.scale, radius);
  // Section 7: a failure is not red, it is faded. The return always starts at
  // full strength and a failed one drains towards --fail, so the shot reads as
  // running out of energy rather than as an alarm. The red spin marker stays
  // on throughout — it is the thing the page is about.
  drawStrobe(ctx, view, frame.ret, {
    colour: failed ? INK.fail : INK.line,
    mark: INK.rubber,
    faded: failed,
    startAngle: endAngle,
    stride: returnStride,
  });

  drawEnding(ctx, view, frame.outcome, frame.ret[frame.ret.length - 1], frame.landingX);
  drawBat(ctx, view, frame.contact, frame.batAngle, frame.swingDirection);

  // Reported so the legend can state the interval it is actually drawing.
  return { strobeMs: (returnStride / STROBE_STEPS) * STROBE_MS };
}
