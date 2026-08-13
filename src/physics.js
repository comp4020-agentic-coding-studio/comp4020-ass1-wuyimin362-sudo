/**
 * Table tennis flight and contact physics.
 *
 * Contract: COMP4020-A1-execution-plan.md section 4.
 *
 * Pure. No DOM, no timers, no randomness — INV-12 enforces that, so the whole
 * simulation runs and is tested under bare node.
 *
 * Coordinates (section 4.1): x runs along the table, +x is the direction the
 * ball is hit back. y is up, y = 0 is the playing surface. The net is at
 * x = 0 and the table is x in [-TABLE_HALF, TABLE_HALF]. The receiver is on
 * the x < 0 side, so the serve travels -x and the return travels +x.
 *
 * @typedef {{ x: number, y: number }} Vec2
 * @typedef {{ x: number, y: number, vx: number, vy: number, omega: number }} BallState
 */

export const BALL_MASS = 0.0027;
export const BALL_RADIUS = 0.02;
export const BALL_AREA = Math.PI * BALL_RADIUS ** 2;

/**
 * A table tennis ball is a hollow celluloid shell, not a solid sphere:
 * I = (2/3)mr², not (2/5)mr². It matters more than it looks. An impulse J at
 * the contact point moves the ball's surface there by (1 + mr²/I)·J/m, so
 * killing a slip costs 2m|u|/5 for a shell against 2m|u|/7 for a solid — the
 * shell keeps noticeably more spin through a bounce. Every direction test
 * passes either way, which is exactly why this is written down.
 */
export const BALL_INERTIA = (2 / 3) * BALL_MASS * BALL_RADIUS ** 2;

export const GRAVITY = 9.81;
export const AIR_DENSITY = 1.204;
export const DRAG_COEFFICIENT = 0.4;

export const NET_HEIGHT = 0.1525;
export const TABLE_HALF = 1.37;

export const E_TABLE = 0.8;
export const MU_TABLE = 0.25;
export const E_BAT = 0.55;
export const MU_BAT = 0.9;

/** Fixed, and never taken from a render callback's delta time (section 4.4). */
export const FIXED_DT = 0.0005;

/** Swing speed is fixed and deliberately not a control (section 2.2). */
export const SWING_SPEED = 7.0;

/** @type {{ readonly BACKSPIN: 'backspin', readonly TOPSPIN: 'topspin' }} */
export const SPIN = Object.freeze({ BACKSPIN: "backspin", TOPSPIN: "topspin" });

/**
 * cross((0, 0, omega), (vx, vy, 0)), which in 2D is (-omega·vy, omega·vx).
 *
 * Its own function because it is the single most error-prone line in the
 * model, and because everything downstream that needs a spin direction has to
 * come through here rather than write a sign by hand (rule 3).
 *
 * @param {number} omega
 * @param {Vec2} v
 * @returns {Vec2}
 */
export function crossOmegaV(omega, v) {
  return { x: -omega * v.y, y: omega * v.x };
}

/**
 * Which sign of omega produces the named spin for a ball travelling at vx.
 *
 * Backspin is defined by what it does — it lifts — so the sign is read back
 * out of the cross product rather than remembered. It depends on the
 * direction of travel: a ball flying -x carries backspin at omega < 0. This
 * is the one place the naming is mapped (section 4.2).
 *
 * @param {'backspin' | 'topspin'} spin
 * @param {number} vx
 * @returns {number} +1 or -1
 */
export function omegaSignFor(spin, vx) {
  const direction = Math.sign(vx) || 1;
  // cross(omega, v).y = omega·vx, so a positive omega lifts a ball moving +x.
  const liftsWhenPositive = Math.sign(crossOmegaV(1, { x: direction, y: 0 }).y);
  return spin === SPIN.BACKSPIN ? liftsWhenPositive : -liftsWhenPositive;
}

/**
 * Lift coefficient, section 4.3: C_L = min(0.33, 1.5·S) with S = r|omega|/|v|.
 *
 * The cap is load bearing. Without it the linear term keeps growing with spin
 * and a heavy serve generates more lift than the ball weighs, so it floats the
 * length of the table and never bounces. Real sphere lift saturates; this is
 * the piecewise-linear stand-in for that.
 *
 * @param {Vec2} v
 * @param {number} omega
 * @returns {number}
 */
export function liftCoefficient(v, omega) {
  const speed = Math.hypot(v.x, v.y);
  if (speed === 0) return 0;
  const spinRatio = (BALL_RADIUS * Math.abs(omega)) / speed;
  return Math.min(0.33, 1.5 * spinRatio);
}

/**
 * @param {Vec2} v
 * @param {number} omega
 * @returns {Vec2}
 */
export function magnusForce(v, omega) {
  const speed = Math.hypot(v.x, v.y);
  const cross = crossOmegaV(omega, v);
  const crossLength = Math.hypot(cross.x, cross.y);
  if (speed === 0 || crossLength === 0) return { x: 0, y: 0 };
  const magnitude = 0.5 * AIR_DENSITY * liftCoefficient(v, omega) * BALL_AREA * speed ** 2;
  return {
    x: (magnitude * cross.x) / crossLength,
    y: (magnitude * cross.y) / crossLength,
  };
}

/**
 * @param {Vec2} v
 * @returns {Vec2}
 */
export function dragForce(v) {
  const k = 0.5 * AIR_DENSITY * DRAG_COEFFICIENT * BALL_AREA * Math.hypot(v.x, v.y);
  return { x: -k * v.x, y: -k * v.y };
}

/**
 * One semi-implicit Euler step: velocity first, then position from the new
 * velocity. Under gravity alone that loses ½mg²dt² per step rather than
 * gaining it, which is what keeps INV-4 honest on the integrator's own terms
 * instead of relying on drag to outrun the error.
 *
 * @param {BallState} state
 * @param {number} dt
 * @returns {BallState}
 */
export function step(state, dt) {
  const v = { x: state.vx, y: state.vy };
  const drag = dragForce(v);
  const magnus = magnusForce(v, state.omega);
  const vx = state.vx + ((drag.x + magnus.x) / BALL_MASS) * dt;
  const vy = state.vy + ((drag.y + magnus.y) / BALL_MASS - GRAVITY) * dt;
  return {
    x: state.x + vx * dt,
    y: state.y + vy * dt,
    vx,
    vy,
    // Aerodynamic spin decay is slow next to a rally's ~1 s flights, so spin
    // only changes where something touches the ball.
    omega: state.omega,
  };
}

/**
 * @param {BallState} initial
 * @param {number} steps
 * @returns {BallState[]}
 */
export function simulateFlight(initial, steps) {
  const path = [initial];
  let current = initial;
  for (let i = 0; i < steps; i++) {
    current = step(current, FIXED_DT);
    path.push(current);
  }
  return path;
}

/**
 * One impulse routine for every contact in the rally (sections 4.5 and 4.7).
 *
 * The tangent is the normal turned a quarter turn, t = (-n.y, n.x). The
 * contact point sits at -r·n from the centre and moves at cross(omega, -r·n),
 * whose component along t is exactly -r·omega for any unit n — so the spin
 * term in the slip is derived here once and never written by hand.
 *
 * Note this is the opposite sign to the `+ omega·r` printed in section 4.7 of
 * the plan, which contradicts that section's own definition of t. Section
 * 4.5's `u = vx + omega·r` for the table is the same quantity measured along
 * +x rather than along t = (-1, 0), and this routine reproduces it exactly.
 * INV-7 is the arbiter: with the plan's printed sign a vertical bat throws a
 * backspin ball upward and the default would not net.
 *
 * @param {BallState} state
 * @param {{ normal: Vec2, surfaceVelocity: Vec2, restitution: number, friction: number }} surface
 * @returns {BallState}
 */
export function applyImpulse(state, surface) {
  const { normal: n, surfaceVelocity: sv, restitution, friction } = surface;
  const t = { x: -n.y, y: n.x };

  const relX = state.vx - sv.x;
  const relY = state.vy - sv.y;
  const approach = relX * n.x + relY * n.y;
  if (approach >= 0) return state;

  const normalImpulse = -(1 + restitution) * BALL_MASS * approach;

  const slip = relX * t.x + relY * t.y - BALL_RADIUS * state.omega;
  // Killing the slip entirely costs 2m|u|/5 for a hollow shell; Coulomb caps
  // what friction can actually deliver.
  const impulseToRoll = (2 * BALL_MASS * Math.abs(slip)) / 5;
  const tangentImpulse = -Math.sign(slip) * Math.min(impulseToRoll, friction * normalImpulse);

  return {
    x: state.x,
    y: state.y,
    vx: state.vx + (normalImpulse * n.x + tangentImpulse * t.x) / BALL_MASS,
    vy: state.vy + (normalImpulse * n.y + tangentImpulse * t.y) / BALL_MASS,
    omega: state.omega - (BALL_RADIUS * tangentImpulse) / BALL_INERTIA,
  };
}

/**
 * @param {BallState} state
 * @returns {BallState}
 */
export function tableBounce(state) {
  return applyImpulse(state, {
    normal: { x: 0, y: 1 },
    surfaceVelocity: { x: 0, y: 0 },
    restitution: E_TABLE,
    friction: MU_TABLE,
  });
}

/**
 * The bat as a moving surface (section 4.7).
 *
 * `batAngleDeg` is how far the face is opened from vertical: 0 is a face
 * perpendicular to the table, positive tilts it back and up, negative closes
 * it down over the ball. `swingDirectionDeg` is the angle of the swing above
 * horizontal: 0 drives flat, positive brushes up, negative chops down.
 * Forward for the receiver is +x.
 *
 * @param {number} batAngleDeg
 * @param {number} swingDirectionDeg
 * @returns {{ normal: Vec2, surfaceVelocity: Vec2, restitution: number, friction: number }}
 */
export function batSurface(batAngleDeg, swingDirectionDeg) {
  const face = (batAngleDeg * Math.PI) / 180;
  const swing = (swingDirectionDeg * Math.PI) / 180;
  return {
    normal: { x: Math.cos(face), y: Math.sin(face) },
    surfaceVelocity: {
      x: SWING_SPEED * Math.cos(swing),
      y: SWING_SPEED * Math.sin(swing),
    },
    restitution: E_BAT,
    friction: MU_BAT,
  };
}

/**
 * @param {BallState} state
 * @param {number} batAngleDeg
 * @param {number} swingDirectionDeg
 * @returns {BallState}
 */
export function batImpulse(state, batAngleDeg, swingDirectionDeg) {
  return applyImpulse(state, batSurface(batAngleDeg, swingDirectionDeg));
}
