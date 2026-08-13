/**
 * Act 2: the instant of contact, drawn from the numbers the simulation used.
 *
 * Every vector here comes out of `contactDetail()` — the same object
 * `applyImpulse()` returns its `after` field from — so nothing on this diagram
 * can disagree with the trajectory in act 1.
 *
 * @typedef {import('./physics.js').BallState} BallState
 * @typedef {import('./physics.js').ContactDetail} ContactDetail
 * @typedef {import('./render.js').View} View
 */

import { BALL_RADIUS, magnusForce, spinNameFor } from "./physics.js";
import { INK } from "./render.js";

const LABEL_FONT = '600 11px ui-monospace, "SF Mono", Menlo, monospace';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1
 * @param {{ colour: string, width?: number, dashed?: boolean, head?: number }} style
 */
function arrow(ctx, x0, y0, x1, y1, style) {
  const { colour, width = 2, dashed = false, head = 7 } = style;
  const angle = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.setLineDash(dashed ? [4, 3] : []);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);
  if (Math.hypot(x1 - x0, y1 - y0) < 3) return;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - Math.cos(angle - 0.42) * head, y1 - Math.sin(angle - 0.42) * head);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - Math.cos(angle + 0.42) * head, y1 - Math.sin(angle + 0.42) * head);
  ctx.stroke();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text @param {number} x @param {number} y
 * @param {{ colour?: string, align?: CanvasTextAlign, baseline?: CanvasTextBaseline }} [style]
 */
function label(ctx, text, x, y, style = {}) {
  const { colour = INK.line, align = "left", baseline = "middle" } = style;
  ctx.font = LABEL_FONT;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
}

/**
 * A curved arrow around the ball showing which way it is turning.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx @param {number} cy @param {number} r
 * @param {number} omega
 * @param {string} colour
 */
function spinArc(ctx, cx, cy, r, omega, colour) {
  if (omega === 0) return;
  // Canvas y grows downward, so a positive (counter-clockwise) omega is drawn
  // with the anticlockwise flag set.
  const counter = omega > 0;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, -0.35 * Math.PI, 0.85 * Math.PI, counter);
  ctx.stroke();

  const endAngle = counter ? -0.35 * Math.PI : 0.85 * Math.PI;
  const ex = cx + Math.cos(endAngle) * r;
  const ey = cy + Math.sin(endAngle) * r;
  // Tangent direction at the arc's end, in the sense of travel.
  const tangent = endAngle + (counter ? -Math.PI / 2 : Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - Math.cos(tangent - 0.4) * 8, ey - Math.sin(tangent - 0.4) * 8);
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - Math.cos(tangent + 0.4) * 8, ey - Math.sin(tangent + 0.4) * 8);
  ctx.stroke();
}

/**
 * Size the act 2 canvas. Unlike the act 1 scene this is a diagram, not a map
 * of the table, so it has its own aspect and its own zoom.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {{ ctx: CanvasRenderingContext2D, width: number, height: number } | null}
 */
export function fitDiagram(canvas) {
  const width = canvas.clientWidth;
  if (width < 1) return null;
  const height = Math.round(Math.min(Math.max(width * 0.42, 240), 340));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
}

/**
 * Draw the contact instant and the flight that follows.
 *
 * Left: the ball meeting the rubber — incoming spin, the slip of the ball's
 * surface across the face, the friction impulse that opposes it, and the
 * normal impulse. Right: the ball just after, with its new spin and the
 * Magnus force that spin generates in flight.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width @param {number} height
 * @param {ContactDetail} detail
 */
export function drawContact(ctx, width, height, detail) {
  const narrow = width < 620;
  const ballR = narrow ? 34 : 46;
  const contactCx = narrow ? width * 0.29 : width * 0.27;
  const contactCy = height * (narrow ? 0.48 : 0.5);
  const flightCx = narrow ? width * 0.72 : width * 0.74;
  const flightCy = contactCy;

  const { normal: n, tangent: t, before, after } = detail;
  // World to canvas: y is negated, nothing else. The diagram is isotropic.
  const nx = n.x;
  const ny = -n.y;
  const tx = t.x;
  const ty = -t.y;

  // ---------------------------------------------------------- the contact

  // The bat face is the line through the contact point perpendicular to n.
  const px = contactCx - nx * ballR;
  const py = contactCy - ny * ballR;
  const faceHalf = ballR * 1.9;

  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(px - tx * faceHalf, py - ty * faceHalf);
  ctx.lineTo(px + tx * faceHalf, py + ty * faceHalf);
  ctx.stroke();

  // Rubber, on the side the ball is on.
  ctx.strokeStyle = INK.rubber;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px - tx * faceHalf + nx * 4, py - ty * faceHalf + ny * 4);
  ctx.lineTo(px + tx * faceHalf + nx * 4, py + ty * faceHalf + ny * 4);
  ctx.stroke();

  // The ball.
  ctx.fillStyle = "rgba(237, 241, 238, 0.10)";
  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(contactCx, contactCy, ballR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  spinArc(ctx, contactCx, contactCy, ballR * 0.62, before.omega, INK.rubber);

  // Slip: how the ball's surface is moving across the rubber, and the friction
  // impulse that opposes it. These are the two vectors the whole page is
  // about, so they get the strongest treatment on the diagram.
  const slipPixels = Math.min(78, Math.max(30, Math.abs(detail.slip) * 9));
  const slipDir = Math.sign(detail.slip) || 1;
  arrow(ctx, px, py, px + tx * slipPixels * slipDir, py + ty * slipPixels * slipDir, {
    colour: INK.line,
    width: 2.5,
  });

  const gripPixels = Math.min(72, Math.max(26, Math.abs(detail.tangentImpulse) * 1600));
  const gripDir = -slipDir;
  arrow(ctx, px, py, px + tx * gripPixels * gripDir, py + ty * gripPixels * gripDir, {
    colour: INK.rubber,
    width: 3,
  });

  // Normal impulse: the bounce off the face.
  const normalPixels = Math.min(84, Math.max(30, detail.normalImpulse * 900));
  arrow(ctx, px, py, px + nx * normalPixels, py + ny * normalPixels, {
    colour: INK.fail,
    width: 2.5,
    dashed: true,
  });


  // ------------------------------------------------------------ in flight

  ctx.fillStyle = "rgba(237, 241, 238, 0.10)";
  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(flightCx, flightCy, ballR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  spinArc(ctx, flightCx, flightCy, ballR * 0.62, after.omega, INK.rubber);

  // Outgoing velocity.
  const speed = Math.hypot(after.vx, after.vy);
  // Capped against the canvas, not just an absolute: at 332 px the arrow ran
  // off the right edge and lost its head.
  const reach = Math.min(96, width - flightCx - 26);
  const velPixels = Math.min(reach, Math.max(20, speed * 7));
  const ux = after.vx / (speed || 1);
  const uy = -after.vy / (speed || 1);
  arrow(ctx, flightCx, flightCy, flightCx + ux * velPixels, flightCy + uy * velPixels, {
    colour: INK.line,
    width: 2.5,
  });

  // The Magnus force that spin produces during the flight.
  const magnus = magnusForce({ x: after.vx, y: after.vy }, after.omega);
  const magnusMag = Math.hypot(magnus.x, magnus.y);
  if (magnusMag > 0) {
    const mPixels = Math.min(reach * 0.8, Math.max(16, magnusMag * 1600));
    const mx = magnus.x / magnusMag;
    const my = -magnus.y / magnusMag;
    arrow(ctx, flightCx, flightCy, flightCx + mx * mPixels, flightCy + my * mPixels, {
      colour: INK.rubber,
      width: 2.5,
      dashed: true,
    });
  }

  label(ctx, "at the bat", contactCx, height - 12, { align: "center", colour: INK.fail });
  label(ctx, "just after", flightCx, height - 12, { align: "center", colour: INK.fail });
}

/** Ball radius in metres, re-exported so the diagram's scale is traceable. */
export const DIAGRAM_BALL_RADIUS = BALL_RADIUS;

/**
 * The same contact, in a sentence and a short list of numbers.
 *
 * Derived from the vectors rather than written per case: which way the ball's
 * surface sweeps is the y component of the tangent in the direction of the
 * slip, and friction is the opposite. Nothing here restates the physics in
 * words that could fall out of step with it.
 *
 * @param {ContactDetail} detail
 * @returns {{ sentence: string, rows: [string, string][] }}
 */
export function readContact(detail) {
  const { tangent: t, before, after } = detail;
  const slipDir = Math.sign(detail.slip) || 1;
  const surfaceY = t.y * slipDir;
  const sweeping = surfaceY > 0 ? "upwards" : "downwards";
  const thrown = surfaceY > 0 ? "downwards" : "upwards";
  /** @param {number} w */
  const revs = (w) => `${Math.abs(w / (2 * Math.PI)).toFixed(0)} rev/s`;
  const magnus = magnusForce({ x: after.vx, y: after.vy }, after.omega);

  return {
    sentence:
      `the ball's surface is sweeping ${sweeping} across the face at ` +
      `${Math.abs(detail.slip).toFixed(1)} m/s, so friction throws it ${thrown}.`,
    rows: [
      ["comes in", `${spinNameFor(before.omega, before.vx)} ${revs(before.omega)}`],
      ["surface slip", `${Math.abs(detail.slip).toFixed(1)} m/s ${sweeping}`],
      [
        "rubber",
        detail.sliding
          ? `slipping at the friction limit · ${Math.abs(detail.tangentImpulse * 1000).toFixed(1)} mN·s`
          : `gripping · ${Math.abs(detail.tangentImpulse * 1000).toFixed(1)} mN·s`,
      ],
      [
        "leaves as",
        `${spinNameFor(after.omega, after.vx)} ${revs(after.omega)} at ${Math.hypot(after.vx, after.vy).toFixed(1)} m/s`,
      ],
      ["in flight", `magnus ${magnus.y > 0 ? "lifts it" : "pushes it down"}`],
    ],
  };
}
