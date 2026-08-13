// Scratch diagnostic — what does a *legal* serve actually deliver to the
// receiver? Reports the reachable envelope of contact states rather than
// guessing at bounds that turn out to be empty.
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
const MAX_STEPS = 6000;

const TABLE_SURFACE = {
  normal: { x: 0, y: 1 },
  velocity: { x: 0, y: 0 },
  restitution: E_TABLE,
  friction: MU_TABLE,
};

function traceServe(
  launch: BallState,
  contactX: number,
): { contact: BallState | null; bounces: number[]; netY: number } {
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
    if (next.x >= contactX) return { contact: next, bounces, netY };
    if (next.y < -0.5) return { contact: null, bounces, netY };
    s = next;
  }
  return { contact: null, bounces, netY };
}

for (const contactX of [3.0, 3.2, 3.4, 3.6, 3.8]) {
  for (const sign of [1, -1] as const) {
    let best: { c: BallState; l: BallState } | null = null;
    let maxY = -Infinity;
    let count = 0;
    for (let y0 = 0.16; y0 <= 0.36; y0 += 0.02) {
      for (let vx0 = 3.0; vx0 <= 7.0; vx0 += 0.2) {
        for (let vy0 = -1.6; vy0 <= 1.4; vy0 += 0.2) {
          for (let mag = 100; mag <= 1000; mag += 25) {
            const launch: BallState = {
              x: -0.15,
              y: Number(y0.toFixed(2)),
              vx: Number(vx0.toFixed(1)),
              vy: Number(vy0.toFixed(1)),
              omega: sign * mag,
            };
            const t = traceServe(launch, contactX);
            if (!t.contact || t.bounces.length !== 2) continue;
            const [b1, b2] = t.bounces;
            if (!(b1 > 0.15 && b1 < NET_X && b2 > NET_X && b2 < TABLE_LENGTH)) continue;
            if (!(t.netY > NET_HEIGHT + BALL_RADIUS)) continue;
            if (!(t.contact.y > BALL_RADIUS)) continue;
            if (!(t.contact.vx > 1.5)) continue;
            count++;
            if (Math.abs(t.contact.omega) > (best ? Math.abs(best.c.omega) : 0)) {
              best = { c: t.contact, l: launch };
            }
            maxY = Math.max(maxY, t.contact.y);
          }
        }
      }
    }
    console.log(
      `contactX=${contactX} ${sign > 0 ? "backspin" : "topspin"}: ${count} legal, ` +
        `max contact |ω|=${best ? Math.abs(best.c.omega).toFixed(0) : "-"} ` +
        `(at y=${best?.c.y.toFixed(3)} vx=${best?.c.vx.toFixed(2)} vy=${best?.c.vy.toFixed(2)}, ` +
        `launch ${JSON.stringify(best?.l)}), max contact y=${maxY.toFixed(3)}`,
    );
  }
}
