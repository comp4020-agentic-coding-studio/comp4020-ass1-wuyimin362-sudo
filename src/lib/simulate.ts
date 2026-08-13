import {
  BALL_RADIUS,
  E_TABLE,
  FIXED_DT,
  MU_TABLE,
  collide,
  step,
  type BallState,
} from "./physics";

export type SpinPreset = "backspin" | "topspin";

export type ReturnOutcome =
  | { outcome: "NET" }
  | { outcome: "OUT" }
  | { outcome: "IN"; landingX: number };

// Swing speed is fixed and not exposed as a control — only bat angle and
// swing direction are. See spec/assignment-1.test.ts for the contract this
// has to satisfy before the sliders can drive it.
//
// 4.5 m/s is a controlled stroke rather than a power loop, and the choice is
// load-bearing. The bat-angle gap the page exists to show goes roughly as
// asin((2/7)·r·ω / ((1+e)·(v_in + swing))): swing speed sits in the
// denominator, so a hard swing buries the incoming spin under the bat's own
// contribution to the slip. At 7 m/s the gap is real but the window of angles
// that land is too narrow to find by dragging a slider.
export const SWING_SPEED_MPS = 4.5;

// ITTF table, in metres. x runs along the table in the direction the *serve*
// travels, so the server's half is [0, NET_X] and the receiver's is
// [NET_X, TABLE_LENGTH]. The return therefore travels towards -x and has to
// land back in [0, NET_X]. y is the height of the ball's centre above the
// playing surface.
export const TABLE_LENGTH = 2.74;
export const TABLE_WIDTH = 1.525;
export const TABLE_TOP_HEIGHT = 0.76;
export const NET_X = TABLE_LENGTH / 2;
export const NET_HEIGHT = 0.1525;

// The receiver takes the ball on a fixed plane just behind their end line.
// Holding the contact point still across both serves is what makes the page
// an experiment: the only thing that changes between presets is the ball
// arriving there, not where the visitor is standing.
export const CONTACT_X = 3.0;

// Inverted rubber over sponge: bouncier than the table and far grippier, which
// is the whole reason a bat can turn incoming backspin into outgoing topspin.
export const E_BAT = 0.85;
export const MU_BAT = 1.0;

// 3 s of flight at FIXED_DT. Nothing in a rally lasts that long; a return
// still airborne at the limit has been lobbed away and counts as OUT.
const MAX_STEPS = 6000;
// Below this the ball has fallen past the table edge and is on its way to the
// floor — there is nothing left to hit.
const FLOOR_Y = -0.5;

export interface ServePreset {
  readonly id: SpinPreset;
  readonly label: string;
  readonly launch: BallState;
}

// Two serves that arrive at the receiver's bat at the same height and within
// 0.7 m/s of each other, spinning hard in opposite directions — found by
// searching launch parameters for that match (notes/tune.ts), not by eyeballing
// a trajectory. Both are legal serves: struck from behind the server's end
// line, one bounce on the server's half, over the net, one bounce on the
// receiver's half.
//
// They cannot be matched exactly, and that is INV-3 rather than sloppy tuning:
// the table bounce couples spin into horizontal velocity, so the bounces slow
// a backspin ball and speed up a topspin one. The residual 0.7 m/s is that
// effect, not a free parameter.
export const SERVES: Record<SpinPreset, ServePreset> = {
  backspin: {
    id: "backspin",
    label: "Backspin serve",
    launch: { x: -0.15, y: 0.16, vx: 6.2, vy: -1.6, omega: 875 },
  },
  topspin: {
    id: "topspin",
    label: "Topspin serve",
    launch: { x: -0.15, y: 0.32, vx: 3.2, vy: 1.4, omega: -950 },
  },
};

function bounceOnTable(state: BallState): BallState {
  return collide(state, {
    normal: { x: 0, y: 1 },
    velocity: { x: 0, y: 0 },
    restitution: E_TABLE,
    friction: MU_TABLE,
  });
}

function touchesTable(state: BallState): boolean {
  return state.y <= BALL_RADIUS && state.x >= 0 && state.x <= TABLE_LENGTH;
}

export interface ServeTrace {
  /** The whole incoming flight, for drawing. */
  path: BallState[];
  /** The ball as the bat meets it, on the x = CONTACT_X plane. */
  contact: BallState;
  /** Where the serve's second bounce landed, for drawing. */
  bounceX: number;
}

// The serve is scenery: identical for every slider position, so it is traced
// once per preset and cached. simulate() is called ~1200 times by the grid
// sweep in spec/assignment-1.test.ts alone.
const serveCache = new Map<SpinPreset, ServeTrace>();

export function traceServe(preset: SpinPreset): ServeTrace {
  const cached = serveCache.get(preset);
  if (cached) return cached;

  const path: BallState[] = [SERVES[preset].launch];
  let current = SERVES[preset].launch;
  let bounceX = Number.NaN;

  for (let i = 0; i < MAX_STEPS; i++) {
    let next = step(current, FIXED_DT);
    if (next.vy < 0 && touchesTable(next)) {
      next = bounceOnTable({ ...next, y: BALL_RADIUS });
      bounceX = next.x;
    }
    path.push(next);
    // The receiver's contact plane, reached on the way towards them.
    if (next.x >= CONTACT_X) {
      const trace: ServeTrace = { path, contact: next, bounceX };
      serveCache.set(preset, trace);
      return trace;
    }
    current = next;
  }

  throw new Error(`the ${preset} serve never reached the contact plane at x = ${CONTACT_X}`);
}

/**
 * The bat as a moving surface.
 *
 * `batAngleDeg` is how far the face is *opened* from vertical: 0° is a
 * vertical face, positive tilts it back and up (against backspin), negative
 * closes it down over the ball (against topspin). `swingDirectionDeg` is the
 * angle of the swing above horizontal: 0° drives flat, positive brushes up,
 * negative chops down. "Forward" for the receiver is -x.
 */
export function batSurface(
  batAngleDeg: number,
  swingDirectionDeg: number,
): { normal: { x: number; y: number }; velocity: { x: number; y: number } } {
  const face = (batAngleDeg * Math.PI) / 180;
  const swing = (swingDirectionDeg * Math.PI) / 180;
  return {
    normal: { x: -Math.cos(face), y: Math.sin(face) },
    velocity: {
      x: -SWING_SPEED_MPS * Math.cos(swing),
      y: SWING_SPEED_MPS * Math.sin(swing),
    },
  };
}

export interface ReturnTrace {
  result: ReturnOutcome;
  /** The outgoing flight, for drawing. */
  path: BallState[];
  /** The ball as it leaves the bat. */
  launch: BallState;
  /** Height of the ball's centre as it crossed the net plane, if it got there. */
  netClearance: number | null;
}

// Everything simulate() knows, including the trajectory the page draws. The
// pinned contract in spec/assignment-1.test.ts only needs the outcome, so
// simulate() stays exactly that shape and this is what the UI reads.
export function simulateReturn(
  servePreset: SpinPreset,
  batAngleDeg: number,
  swingDirectionDeg: number,
): ReturnTrace {
  const incoming = traceServe(servePreset);
  const surface = batSurface(batAngleDeg, swingDirectionDeg);
  const launch = collide(incoming.contact, {
    ...surface,
    restitution: E_BAT,
    friction: MU_BAT,
  });

  const path: BallState[] = [launch];
  let current = launch;
  let netClearance: number | null = null;

  for (let i = 0; i < MAX_STEPS; i++) {
    const next = step(current, FIXED_DT);
    path.push(next);

    // Crossing the net plane, travelling back towards the server.
    if (netClearance === null && current.x > NET_X && next.x <= NET_X) {
      netClearance = next.y;
      if (next.y < NET_HEIGHT + BALL_RADIUS) {
        return { result: { outcome: "NET" }, path, launch, netClearance };
      }
    }

    if (next.vy < 0 && next.y <= BALL_RADIUS) {
      if (netClearance === null) {
        // Buried into the receiver's own half, or dumped off the end behind
        // them: either way it never got over.
        return { result: { outcome: "NET" }, path, launch, netClearance };
      }
      return next.x >= 0
        ? { result: { outcome: "IN", landingX: next.x }, path, launch, netClearance }
        : { result: { outcome: "OUT" }, path, launch, netClearance };
    }

    // Past the far end line and below the table: long, and never coming back.
    if (next.y < FLOOR_Y) {
      return {
        result: netClearance === null ? { outcome: "NET" } : { outcome: "OUT" },
        path,
        launch,
        netClearance,
      };
    }

    current = next;
  }

  // Still in the air after 3 s — lobbed into the rafters.
  return {
    result: netClearance === null ? { outcome: "NET" } : { outcome: "OUT" },
    path,
    launch,
    netClearance,
  };
}

export function simulate(
  servePreset: SpinPreset,
  batAngleDeg: number,
  swingDirectionDeg: number,
): ReturnOutcome {
  return simulateReturn(servePreset, batAngleDeg, swingDirectionDeg).result;
}
