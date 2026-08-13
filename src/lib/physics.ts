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

// Direction must come from cross(omegaVec, v), never a hand-written sign —
// see spec/physics.test.ts INV-1.
export function magnusForce(_v: Vec2, _omega: number): Vec2 {
  throw new Error("magnusForce() is not implemented yet");
}

export function dragForce(_v: Vec2): Vec2 {
  throw new Error("dragForce() is not implemented yet");
}

export function step(_state: BallState, _dt: number): BallState {
  throw new Error("step() is not implemented yet");
}

export function simulateFlight(_initial: BallState, _steps: number): BallState[] {
  throw new Error("simulateFlight() is not implemented yet");
}

export function tableBounce(_state: BallState): BallState {
  throw new Error("tableBounce() is not implemented yet");
}
