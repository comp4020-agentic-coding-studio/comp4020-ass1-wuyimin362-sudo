/**
 * Serve presets, the return simulation, and the solution-space scan.
 *
 * Contract: COMP4020-A1-execution-plan.md sections 4.6, 4.8, 4.9 and 5.
 *
 * Pure, like physics.js — INV-12 enforces it. The browser layer reads
 * trajectories out of here; nothing in here knows a browser exists.
 *
 * @typedef {import('./physics.js').BallState} BallState
 * @typedef {{ outcome: 'NET' } | { outcome: 'OUT' } | { outcome: 'IN', landingX: number }} Outcome
 */

import {
  BALL_RADIUS,
  FIXED_DT,
  NET_HEIGHT,
  SPIN,
  TABLE_HALF,
  batImpulse,
  omegaSignFor,
  step,
  tableBounce,
} from "./physics.js";

/** Control ranges, section 2.2. */
export const BAT_ANGLE = Object.freeze({ min: -30, max: 70 });
export const SWING_DIRECTION = Object.freeze({ min: -60, max: 80 });

/** Half-width of the net in x, section 4.9. */
const NET_BAND = 0.02;
/** Above this the ball has been lobbed out of play, section 4.9. */
const CEILING = 2.0;

const MAX_STEPS = 12000;

export const NET_CELL = 0;
export const OUT_CELL = 1;
export const IN_CELL = 2;

/**
 * Section 4.8. Spin magnitudes are stored unsigned and the sign is derived, so
 * "backspin" always means the spin that lifts, whichever way the ball is
 * travelling. These numbers are explicitly calibratable: the only legitimate
 * reason to change them is to satisfy INV-7, INV-9 or INV-10, and each change
 * is its own commit naming the invariant that was red.
 */
export const SERVES = Object.freeze({
  [SPIN.BACKSPIN]: Object.freeze({
    launch: Object.freeze({ x: 1.5, y: 0.28, vx: -6.4, vy: -1.6 }),
    spinMagnitude: 240,
  }),
  [SPIN.TOPSPIN]: Object.freeze({
    launch: Object.freeze({ x: 1.5, y: 0.36, vx: -6.4, vy: -1.6 }),
    spinMagnitude: 160,
  }),
});

/**
 * @param {'backspin' | 'topspin'} spin
 * @returns {BallState}
 */
export function serveLaunch(spin) {
  const preset = SERVES[spin];
  return {
    ...preset.launch,
    omega: omegaSignFor(spin, preset.launch.vx) * preset.spinMagnitude,
  };
}

/** @param {BallState} s */
const onTable = (s) => s.x >= -TABLE_HALF && s.x <= TABLE_HALF;

/**
 * Advance one step, bouncing off the table if this step would carry the ball
 * through the surface inside the table's footprint.
 *
 * @param {BallState} state
 * @returns {{ next: BallState, bounced: boolean }}
 */
function advance(state) {
  const next = step(state, FIXED_DT);
  if (next.vy < 0 && next.y <= 0 && onTable(next)) {
    return { next: tableBounce({ ...next, y: 0 }), bounced: true };
  }
  return { next, bounced: false };
}

/**
 * @typedef {{ path: BallState[], bounces: number[], contact: BallState,
 *             contactIndex: number, netCrossY: number }} ServeTrace
 */

/**
 * Trace a serve up to the moment the receiver meets it.
 *
 * Section 4.6: the contact point is the first local maximum of y after the
 * ball has bounced on the receiver's half — "take it at the top of the
 * bounce". Deterministic, and no timing judgement for the visitor to make.
 *
 * @param {'backspin' | 'topspin'} spin
 * @returns {ServeTrace}
 */
export function traceServe(spin) {
  return traceFromLaunch(serveLaunch(spin), spin);
}

/**
 * @param {BallState} launch
 * @param {string} [label] for the error message when no contact point exists
 * @returns {ServeTrace}
 */
export function traceFromLaunch(launch, label = "serve") {
  const path = [launch];
  /** @type {number[]} */
  const bounces = [];
  let netCrossY = Number.NaN;
  let current = launch;

  for (let i = 0; i < MAX_STEPS; i++) {
    const previous = current;
    const { next, bounced } = advance(current);
    path.push(next);
    if (bounced) bounces.push(next.x);
    if (previous.x > 0 && next.x <= 0) netCrossY = next.y;

    // Apex after the second bounce, which is the one on the receiver's half.
    if (bounces.length >= 2 && previous.vy > 0 && next.vy <= 0) {
      return { path, bounces, contact: next, contactIndex: path.length - 1, netCrossY };
    }
    if (next.y < -0.6) break;
    current = next;
  }

  throw new Error(
    `the ${label} never reached a contact point: ${bounces.length} bounce(s) at [${bounces
      .map((b) => b.toFixed(2))
      .join(", ")}]`,
  );
}

// One trace per preset, reused across the whole grid scan.
/** @type {Map<string, ServeTrace>} */
const serveCache = new Map();

/**
 * @param {'backspin' | 'topspin'} spin
 * @returns {ServeTrace}
 */
export function cachedServe(spin) {
  const hit = serveCache.get(spin);
  if (hit) return hit;
  const trace = traceServe(spin);
  serveCache.set(spin, trace);
  return trace;
}

/** Drop memoised serves, so a calibration probe sees fresh presets. */
export function clearServeCache() {
  serveCache.clear();
}

/**
 * Play a return out from an explicit contact state and classify it (4.9).
 *
 * Split out from simulateReturn so the calibration probe can drive candidate
 * serves without touching the module-level presets or the memo.
 *
 * @param {BallState} contact
 * @param {number} batAngleDeg
 * @param {number} swingDirectionDeg
 * @returns {{ result: Outcome, path: BallState[], launch: BallState }}
 */
export function returnFromContact(contact, batAngleDeg, swingDirectionDeg) {
  const launch = batImpulse(contact, batAngleDeg, swingDirectionDeg);
  const path = [launch];
  let current = launch;
  let crossedNet = false;

  for (let i = 0; i < MAX_STEPS; i++) {
    // Plain step(), never advance(): for the return the first touch on the
    // table IS the result. Bouncing it first — as the serve trace has to —
    // leaves the ball with vy > 0 so the landing test never fires, and every
    // shot that should have been IN sails on to become OUT.
    const next = step(current, FIXED_DT);
    path.push(next);

    // Into the net itself.
    if (!crossedNet && Math.abs(next.x) <= NET_BAND && next.y < NET_HEIGHT) {
      return { result: { outcome: "NET" }, path, launch };
    }
    if (!crossedNet && current.x < 0 && next.x >= 0) crossedNet = true;

    // Lobbed out of play.
    if (next.y > CEILING) return { result: { outcome: "OUT" }, path, launch };

    // Past the far end line while still airborne.
    if (next.x > TABLE_HALF && next.y > 0) {
      return { result: { outcome: "OUT" }, path, launch };
    }

    if (next.vy < 0 && next.y <= 0) {
      if (next.x > 0 && next.x <= TABLE_HALF) {
        return { result: { outcome: "IN", landingX: next.x }, path, launch };
      }
      // Landed without getting over: buried into the receiver's own half, or
      // dumped behind them.
      return { result: { outcome: crossedNet ? "OUT" : "NET" }, path, launch };
    }

    if (next.y < -0.6) {
      return { result: { outcome: crossedNet ? "OUT" : "NET" }, path, launch };
    }
    current = next;
  }

  return { result: { outcome: crossedNet ? "OUT" : "NET" }, path, launch };
}

/**
 * @param {'backspin' | 'topspin'} spin
 * @param {number} batAngleDeg
 * @param {number} swingDirectionDeg
 * @returns {{ result: Outcome, path: BallState[], launch: BallState }}
 */
export function simulateReturn(spin, batAngleDeg, swingDirectionDeg) {
  return returnFromContact(cachedServe(spin).contact, batAngleDeg, swingDirectionDeg);
}

/**
 * @typedef {{ cells: Uint8Array, thetas: number[], phis: number[],
 *             cols: number, rows: number }} Grid
 */

/**
 * Sweep the whole control space from an explicit contact state.
 *
 * @param {BallState} contact
 * @param {number} thetaStep degrees
 * @param {number} phiStep degrees
 * @returns {Grid}
 */
export function scanContact(contact, thetaStep, phiStep) {
  /** @type {number[]} */
  const thetas = [];
  for (let t = BAT_ANGLE.min; t <= BAT_ANGLE.max + 1e-9; t += thetaStep) thetas.push(t);
  /** @type {number[]} */
  const phis = [];
  for (let p = SWING_DIRECTION.min; p <= SWING_DIRECTION.max + 1e-9; p += phiStep) phis.push(p);

  const cells = new Uint8Array(thetas.length * phis.length);
  for (let r = 0; r < thetas.length; r++) {
    for (let c = 0; c < phis.length; c++) {
      const { outcome } = returnFromContact(contact, thetas[r], phis[c]).result;
      cells[r * phis.length + c] =
        outcome === "IN" ? IN_CELL : outcome === "OUT" ? OUT_CELL : NET_CELL;
    }
  }
  return { cells, thetas, phis, cols: phis.length, rows: thetas.length };
}

/**
 * Sweep the whole control space for one serve.
 *
 * @param {'backspin' | 'topspin'} spin
 * @param {number} thetaStep degrees
 * @param {number} phiStep degrees
 * @returns {Grid}
 */
export function scanGrid(spin, thetaStep, phiStep) {
  return scanContact(cachedServe(spin).contact, thetaStep, phiStep);
}

/**
 * @param {Grid} grid
 * @returns {{ count: number, total: number, areaFraction: number,
 *             centroidTheta: number, minTheta: number, maxTheta: number }}
 */
export function feasibleStats(grid) {
  let count = 0;
  let thetaSum = 0;
  let minTheta = Number.POSITIVE_INFINITY;
  let maxTheta = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < grid.cells.length; i++) {
    if (grid.cells[i] !== IN_CELL) continue;
    const theta = grid.thetas[Math.floor(i / grid.cols)];
    count++;
    thetaSum += theta;
    minTheta = Math.min(minTheta, theta);
    maxTheta = Math.max(maxTheta, theta);
  }
  return {
    count,
    total: grid.cells.length,
    areaFraction: count / grid.cells.length,
    centroidTheta: count ? thetaSum / count : Number.NaN,
    minTheta: count ? minTheta : Number.NaN,
    maxTheta: count ? maxTheta : Number.NaN,
  };
}

/**
 * Intersection over union of two feasible regions (INV-10).
 *
 * @param {Grid} a
 * @param {Grid} b
 * @returns {number}
 */
export function overlapRatio(a, b) {
  if (a.cells.length !== b.cells.length) {
    throw new Error("grids must be the same shape to compare");
  }
  let intersection = 0;
  let union = 0;
  for (let i = 0; i < a.cells.length; i++) {
    const inA = a.cells[i] === IN_CELL;
    const inB = b.cells[i] === IN_CELL;
    if (inA && inB) intersection++;
    if (inA || inB) union++;
  }
  return union === 0 ? 0 : intersection / union;
}

export { BALL_RADIUS };
