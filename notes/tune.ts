// Scratch tuner — not part of the build or the checks.
//
// The first pass matched the two serves on contact kinematics and got a
// centroid gap of -3.4°, against a contract of > +15°. The reason is in the
// bat impulse: with rolling contact the incoming spin moves the ball by
// (2/7)·r·ω along the face, while the normal impulse moves it by
// (1+e)·(vx + S). The gap the page is about is roughly
//
//     2 · asin( (2/7)·r·ω / ((1+e)·(vx + S)) )
//
// so it grows with spin at contact and shrinks with swing speed. This searches
// both: serves that arrive with heavy spin, and the swing speed that leaves
// the effect visible.
import {
  BALL_RADIUS,
  E_TABLE,
  FIXED_DT,
  MU_TABLE,
  collide,
  step,
  type BallState,
} from "../src/lib/physics.ts";

const TABLE_LENGTH = 2.74;
const NET_X = TABLE_LENGTH / 2;
const NET_HEIGHT = 0.1525;
const CONTACT_X = 3.0;
const MAX_STEPS = 6000;
const E_BAT = 0.85;
const MU_BAT = 1.0;
const FLOOR_Y = -0.5;

const BAT_ANGLE = { min: -30, max: 70 };
const SWING_DIRECTION = { min: -60, max: 80 };
const STEP = 5;

function range(min: number, max: number, s: number): number[] {
  const out: number[] = [];
  for (let v = min; v <= max; v += s) out.push(v);
  return out;
}

const TABLE_SURFACE = {
  normal: { x: 0, y: 1 },
  velocity: { x: 0, y: 0 },
  restitution: E_TABLE,
  friction: MU_TABLE,
};

interface Trace {
  contact: BallState | null;
  bounces: number[];
  netY: number;
}

function traceServe(launch: BallState): Trace {
  let s = launch;
  const bounces: number[] = [];
  let netY = Number.NaN;
  for (let i = 0; i < MAX_STEPS; i++) {
    const prevX = s.x;
    let next = step(s, FIXED_DT);
    if (next.vy < 0 && next.y <= BALL_RADIUS && next.x >= 0 && next.x <= TABLE_LENGTH) {
      next = collide({ ...next, y: BALL_RADIUS }, TABLE_SURFACE);
      bounces.push(next.x);
    }
    if (prevX < NET_X && next.x >= NET_X) netY = next.y;
    if (next.x >= CONTACT_X) return { contact: next, bounces, netY };
    if (next.y < FLOOR_Y) return { contact: null, bounces, netY };
    s = next;
  }
  return { contact: null, bounces, netY };
}

type Outcome = "NET" | "OUT" | "IN";

function outcomeOf(contact: BallState, batDeg: number, swingDeg: number, speed: number): Outcome {
  const face = (batDeg * Math.PI) / 180;
  const swing = (swingDeg * Math.PI) / 180;
  let s = collide(contact, {
    normal: { x: -Math.cos(face), y: Math.sin(face) },
    velocity: { x: -speed * Math.cos(swing), y: speed * Math.sin(swing) },
    restitution: E_BAT,
    friction: MU_BAT,
  });
  let crossed = false;
  for (let i = 0; i < MAX_STEPS; i++) {
    const next = step(s, FIXED_DT);
    if (!crossed && s.x > NET_X && next.x <= NET_X) {
      if (next.y < NET_HEIGHT + BALL_RADIUS) return "NET";
      crossed = true;
    }
    if (next.vy < 0 && next.y <= BALL_RADIUS) {
      if (!crossed) return "NET";
      return next.x >= 0 ? "IN" : "OUT";
    }
    if (next.y < FLOOR_Y) return crossed ? "OUT" : "NET";
    s = next;
  }
  return crossed ? "OUT" : "NET";
}

function inAngles(contact: BallState, speed: number): number[] {
  const angles: number[] = [];
  for (const bat of range(BAT_ANGLE.min, BAT_ANGLE.max, STEP)) {
    for (const swing of range(SWING_DIRECTION.min, SWING_DIRECTION.max, STEP)) {
      if (outcomeOf(contact, bat, swing, speed) === "IN") angles.push(bat);
    }
  }
  return angles;
}

const mean = (v: number[]): number => v.reduce((a, b) => a + b, 0) / v.length;

interface Candidate {
  launch: BallState;
  contact: BallState;
  bounces: number[];
  netY: number;
}

function legalServes(spinSign: 1 | -1, minContactSpin: number): Candidate[] {
  const found: Candidate[] = [];
  for (let y0 = 0.16; y0 <= 0.32; y0 += 0.02) {
    for (let vx0 = 3.2; vx0 <= 6.6; vx0 += 0.2) {
      for (let vy0 = -1.6; vy0 <= 1.4; vy0 += 0.2) {
        for (let mag = 450; mag <= 1000; mag += 25) {
          const launch: BallState = {
            x: -0.15,
            y: Number(y0.toFixed(2)),
            vx: Number(vx0.toFixed(1)),
            vy: Number(vy0.toFixed(1)),
            omega: spinSign * mag,
          };
          const t = traceServe(launch);
          if (!t.contact) continue;
          if (t.bounces.length !== 2) continue;
          const [b1, b2] = t.bounces;
          if (!(b1 > 0.15 && b1 < NET_X && b2 > NET_X && b2 < TABLE_LENGTH)) continue;
          if (!(t.netY > NET_HEIGHT + BALL_RADIUS)) continue;
          // A long serve genuinely arrives around net height by the time it is
          // past the end line — notes/reach.ts says nothing legal gets above
          // ~0.14 m at the contact plane, so this is the real band, not a
          // compromise.
          if (!(t.contact.y > 0.085 && t.contact.y < 0.16)) continue;
          if (!(t.contact.vx > 1.8 && t.contact.vx < 5.2)) continue;
          if (Math.abs(t.contact.omega) < minContactSpin) continue;
          found.push({ launch, contact: t.contact, bounces: t.bounces, netY: t.netY });
        }
      }
    }
  }
  return found;
}

const MIN_SPIN = Number(process.argv[2] ?? 380);
const back = legalServes(1, MIN_SPIN);
const top = legalServes(-1, MIN_SPIN);
console.log(
  `legal serves with |contact spin| >= ${MIN_SPIN}: backspin ${back.length}, topspin ${top.length}`,
);
if (back.length === 0 || top.length === 0) process.exit(1);

const spinnisest = (cs: Candidate[]): Candidate[] =>
  cs.toSorted((a, b) => Math.abs(b.contact.omega) - Math.abs(a.contact.omega)).slice(0, 200);

// Best-matched pairs on contact kinematics, so the comparison isn't confounded
// by the ball simply arriving somewhere else.
const pairs: { b: Candidate; t: Candidate; cost: number }[] = [];
for (const b of spinnisest(back)) {
  for (const t of spinnisest(top)) {
    // INV-3 means these two can never match exactly: the table bounce slows a
    // backspin ball and speeds up a topspin one, so identical launches arrive
    // at different speeds by construction. Keep the residual small enough that
    // spin is plainly the dominant difference.
    if (Math.abs(b.contact.vx - t.contact.vx) > 0.8) continue;
    if (Math.abs(b.contact.y - t.contact.y) > 0.03) continue;
    const cost =
      60 * Math.abs(b.contact.y - t.contact.y) +
      40 * Math.abs(b.contact.vx - t.contact.vx) +
      20 * Math.abs(b.contact.vy - t.contact.vy) +
      0.03 * Math.abs(b.contact.omega + t.contact.omega);
    pairs.push({ b, t, cost });
  }
}
pairs.sort((p, q) => p.cost - q.cost);

for (const speed of [4.0, 4.5, 5.0, 5.5, 6.0, 7.0]) {
  for (const pair of pairs.slice(0, 3)) {
    const bIn = inAngles(pair.b.contact, speed);
    const tIn = inAngles(pair.t.contact, speed);
    if (bIn.length === 0 || tIn.length === 0) continue;
    const gap = mean(bIn) - mean(tIn);
    const defaultOutcome = outcomeOf(pair.b.contact, 0, 5, speed);
    console.log(
      `S=${speed.toFixed(1)} cost=${pair.cost.toFixed(2)} gap=${gap.toFixed(1)}° ` +
        `IN(back)=${bIn.length} IN(top)=${tIn.length} default=${defaultOutcome} | ` +
        `back ω=${pair.b.contact.omega.toFixed(0)} y=${pair.b.contact.y.toFixed(2)} vx=${pair.b.contact.vx.toFixed(2)} | ` +
        `top ω=${pair.t.contact.omega.toFixed(0)} y=${pair.t.contact.y.toFixed(2)} vx=${pair.t.contact.vx.toFixed(2)}`,
    );
    console.log(
      `    back launch ${JSON.stringify(pair.b.launch)}\n    top  launch ${JSON.stringify(pair.t.launch)}`,
    );
  }
}
