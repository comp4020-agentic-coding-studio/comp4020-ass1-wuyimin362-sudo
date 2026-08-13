export interface Vec2 {
  x: number;
  y: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  omega: number;
}

export const BALL_MASS = 0.0027;
export const BALL_RADIUS = 0.02;
export const BALL_AREA = Math.PI * BALL_RADIUS ** 2;
export const GRAVITY = 9.81;
export const AIR_DENSITY = 1.204;
export const DRAG_COEFFICIENT = 0.4;
export const E_TABLE = 0.8;
export const MU_TABLE = 0.25;
export const FIXED_DT = 0.0005;

// Lift per unit spin ratio. The usual sphere formula F = ½ρA·C_L·|v|² with
// C_L = 2·MAGNUS_COEFFICIENT·(rω/|v|) collapses to
// F = MAGNUS_COEFFICIENT·ρ·A·r·(ω × v) — linear in both ω and v, with no
// special case at |v| = 0.
//
// The value is anchored on the heaviest shot in the game rather than picked to
// make a trajectory look right: a full topspin loop, ~100 rev/s at 20 m/s,
// pulls down at roughly 1.75 × the ball's weight, which puts the coefficient
// at 0.12. That is C_L ≈ 0.25 × spin ratio, matching sphere lift measurements
// over the spin ratios a rally actually reaches (0 to ~2).
//
// Set 4× larger this stays inside the physics tests' tolerances — they only
// pin the direction and the range ordering — but a backspin serve then
// generates more lift than the ball weighs and floats the length of the table
// without ever bouncing. INV-1..INV-5 cannot see that; the serve trace can.
export const MAGNUS_COEFFICIENT = 0.12;

// A solid sphere has I = ⅖mr², so a tangential impulse J at the contact point
// moves the ball's surface there by (1 + 5/2)·J/m. Killing a slip of s
// therefore costs J = -(2/7)·m·s, and spins the ball by -5J/(2mr).
const ROLLING_IMPULSE_FRACTION = 2 / 7;
const SPIN_PER_TANGENTIAL_IMPULSE = 5 / (2 * BALL_MASS * BALL_RADIUS);

// Direction must come from cross(omegaVec, v), never a hand-written sign —
// see spec/physics.test.ts INV-1.
export function magnusForce(v: Vec2, omega: number): Vec2 {
  // Spin is out of the plane, ω = (0, 0, omega), so
  // cross(ω, v) = (-omega·v.y, omega·v.x, 0).
  const k = MAGNUS_COEFFICIENT * AIR_DENSITY * BALL_AREA * BALL_RADIUS;
  return { x: -k * omega * v.y, y: k * omega * v.x };
}

export function dragForce(v: Vec2): Vec2 {
  // Quadratic drag: ½ρA·C_D·|v|² opposing v, written as a coefficient on v so
  // the direction falls out instead of being re-derived.
  const k = 0.5 * AIR_DENSITY * BALL_AREA * DRAG_COEFFICIENT * Math.hypot(v.x, v.y);
  return { x: -k * v.x, y: -k * v.y };
}

// Semi-implicit (symplectic) Euler: velocity first, then position from the
// *new* velocity. Under gravity alone that loses exactly ½mg²dt² per step
// rather than gaining it, which is what keeps INV-4 honest — an explicit Euler
// here would add energy every step and only pass because drag outruns it.
export function step(state: BallState, dt: number): BallState {
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
    // Aerodynamic spin decay is slow next to a table tennis rally's ~1 s
    // flights, so spin is carried unchanged through free flight and only
    // changes where something touches the ball.
    omega: state.omega,
  };
}

export function simulateFlight(initial: BallState, steps: number): BallState[] {
  const trajectory: BallState[] = [initial];
  let current = initial;
  for (let i = 0; i < steps; i++) {
    current = step(current, FIXED_DT);
    trajectory.push(current);
  }
  return trajectory;
}

export interface Surface {
  /** Unit vector pointing out of the surface, towards the ball. */
  normal: Vec2;
  /** Velocity of the surface at the contact point. */
  velocity: Vec2;
  restitution: number;
  friction: number;
}

// One impulse routine for every contact in the rally: the table is a still
// surface with a soft normal and a slippery face, the bat is a moving surface
// with a grippy one. Writing the bat as a second Surface rather than a second
// function is what stops the two from drifting apart — and it is why the spin
// the bat imparts is a consequence of the same Coulomb cone INV-5 pins on the
// table, not a separate rule invented for the bat.
export function collide(state: BallState, surface: Surface): BallState {
  const { normal: n, velocity: sv, restitution, friction } = surface;
  // Tangent is the normal rotated a quarter turn, so (n, t) is right-handed.
  const t: Vec2 = { x: -n.y, y: n.x };

  const ux = state.vx - sv.x;
  const uy = state.vy - sv.y;
  const approach = ux * n.x + uy * n.y;
  // Already separating: no contact, so no impulse to apply.
  if (approach >= 0) return state;

  const normalImpulse = -(1 + restitution) * BALL_MASS * approach;

  // Slip of the ball's surface against the other surface. The contact point
  // sits at -r·n from the centre, and cross(ω, -r·n) · t is exactly -r·ω for
  // any unit n, so the spin term needs no per-surface algebra.
  const slip = ux * t.x + uy * t.y - BALL_RADIUS * state.omega;
  const impulseToRoll = -ROLLING_IMPULSE_FRACTION * BALL_MASS * slip;
  // Coulomb cone: friction can at most stop the slip, and never exceeds
  // μ times the normal impulse (INV-5).
  const tangentImpulse =
    Math.sign(impulseToRoll) * Math.min(Math.abs(impulseToRoll), friction * normalImpulse);

  return {
    x: state.x,
    y: state.y,
    vx: state.vx + (normalImpulse * n.x + tangentImpulse * t.x) / BALL_MASS,
    vy: state.vy + (normalImpulse * n.y + tangentImpulse * t.y) / BALL_MASS,
    omega: state.omega - tangentImpulse * SPIN_PER_TANGENTIAL_IMPULSE,
  };
}

export function tableBounce(state: BallState): BallState {
  return collide(state, {
    normal: { x: 0, y: 1 },
    velocity: { x: 0, y: 0 },
    restitution: E_TABLE,
    friction: MU_TABLE,
  });
}
