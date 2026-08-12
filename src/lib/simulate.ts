export type SpinPreset = "backspin" | "topspin";

export type ReturnOutcome =
  | { outcome: "NET" }
  | { outcome: "OUT" }
  | { outcome: "IN"; landingX: number };

// Swing speed is fixed and not exposed as a control — only bat angle and
// swing direction are. See spec/assignment-1.test.ts for the contract this
// has to satisfy before the sliders can drive it.
export const SWING_SPEED_MPS = 7.0;

export function simulate(
  _servePreset: SpinPreset,
  _batAngleDeg: number,
  _swingDirectionDeg: number,
): ReturnOutcome {
  throw new Error("simulate() is not implemented yet");
}
