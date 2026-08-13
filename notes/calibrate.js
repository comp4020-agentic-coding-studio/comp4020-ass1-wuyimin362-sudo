// Scratch calibration probe — not part of the build or the checks.
//
// Section 4.8's serve presets do not produce legal serves under section 4's
// physics: v = (-6.5, 1.2) from y = 0.30 flies off the receiver's end line
// still airborne, so it never bounces at all. Section 4.8 explicitly allows
// retuning these numbers, and the only legitimate reason is to satisfy INV-7,
// INV-8, INV-9 and INV-10 — so this searches against exactly those, rather
// than against how a trajectory looks.
//
// Usage: node notes/calibrate.js [coarseStepDegrees]

import {
  NET_HEIGHT,
  SPIN,
  TABLE_HALF,
  omegaSignFor,
} from "../src/physics.js";
import {
  feasibleStats,
  overlapRatio,
  returnFromContact,
  scanContact,
  traceFromLaunch,
} from "../src/solver.js";

const COARSE = Number(process.argv[2] ?? 5);
/** Minimum |omega| at the bat, so spin is genuinely the differing variable. */
const MIN_CONTACT_SPIN = Number(process.argv[3] ?? 300);
/** Max difference in arrival speed between the two serves, m/s. */
const MAX_SPEED_MISMATCH = Number(process.argv[4] ?? 0.9);
/** Required net clearance for the serve itself, metres. */
const NET_MARGIN = Number(process.argv[5] ?? 0.02);
/** Ask for headroom over INV-8's 5%, so the preset is not one tweak from red. */
const AREA_FLOOR = Number(process.argv[6] ?? 0.05);

/** A serve is legal only if it bounces once per half, in the right order. */
function evaluateLaunch(launch, spin) {
  let trace;
  try {
    trace = traceFromLaunch(launch, spin);
  } catch {
    return null;
  }
  if (trace.bounces.length !== 2) return null;
  const [first, second] = trace.bounces;
  if (!(first > 0 && first <= TABLE_HALF)) return null;
  if (!(second >= -TABLE_HALF && second < 0)) return null;
  // Clear the net by a real margin, not by half a millimetre: the first
  // chosen pair passed with netCrossY = 0.1530 against a 0.1525 net, which
  // is a preset one rounding away from an illegal serve.
  if (!(trace.netCrossY > NET_HEIGHT + NET_MARGIN)) return null;
  const c = trace.contact;
  // A contact point you could actually play a stroke at.
  if (!(c.y > 0.05 && c.y < 0.55)) return null;
  if (!(c.x < -TABLE_HALF + 0.05)) return null;
  if (!(c.x > -2.6)) return null;
  // The ball has to still be spinning when it gets there. Without this the
  // search happily returns a "backspin serve" arriving at omega = -43 — the
  // bounces having scrubbed the spin off — and then the centroid gap is being
  // produced by the contact speeds, not by spin. That would satisfy INV-9
  // while making section 2.1's argument false.
  if (Math.abs(c.omega) < MIN_CONTACT_SPIN) return null;
  return trace;
}

function* launches(spin) {
  const sign = (vx) => omegaSignFor(spin, vx);
  // Widened after notes/diagnose.js showed the first grid excluded every legal
  // backspin serve: they need a slower, flatter or downward strike than the
  // range originally swept.
  for (const y0 of [0.16, 0.2, 0.24, 0.28, 0.32, 0.36]) {
    for (const vx0 of [-3.0, -3.4, -3.8, -4.2, -4.6, -5.0, -5.4, -5.8, -6.4, -7.0]) {
      for (const vy0 of [-1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6]) {
        for (const mag of [160, 240, 320, 400, 480, 560, 640, 720, 800]) {
          yield {
            x: 1.5,
            y: y0,
            vx: vx0,
            vy: vy0,
            omega: sign(vx0) * mag,
            spinMagnitude: mag,
          };
        }
      }
    }
  }
}

function collect(spin) {
  const found = [];
  for (const launch of launches(spin)) {
    const { spinMagnitude, ...state } = launch;
    const trace = evaluateLaunch(state, spin);
    if (!trace) continue;
    found.push({ state, spinMagnitude, contact: trace.contact, bounces: trace.bounces });
  }
  return found;
}

const back = collect(SPIN.BACKSPIN);
const top = collect(SPIN.TOPSPIN);
console.log(`legal serves — backspin ${back.length}, topspin ${top.length}`);
if (!back.length || !top.length) process.exit(1);

// Ranking by spin alone was wrong: heavier spin widens the centroid gap
// (INV-9) but shrinks the region that returns at all (INV-8), and taking only
// the spinniest 60 left every candidate under the 5% floor. Score every legal
// candidate once instead, then pair.
function score(list, spin) {
  const scored = [];
  for (const candidate of list) {
    const grid = scanContact(candidate.contact, COARSE, COARSE);
    const stats = feasibleStats(grid);
    const defaultNets =
      spin !== SPIN.BACKSPIN ||
      returnFromContact(candidate.contact, 0, 5).result.outcome === "NET";
    scored.push({ ...candidate, grid, stats, defaultNets });
  }
  return scored;
}

const funnel = {};
const drop = (k) => (funnel[k] = (funnel[k] ?? 0) + 1);
let bestGap = -Infinity;
let bestArea = 0;

const scoredBack = score(back, SPIN.BACKSPIN);
const scoredTop = score(top, SPIN.TOPSPIN);

const viableBack = scoredBack.filter((c) => {
  if (!c.defaultNets) {
    drop("INV-7: backspin default did not net");
    return false;
  }
  bestArea = Math.max(bestArea, c.stats.areaFraction);
  if (c.stats.areaFraction <= AREA_FLOOR) {
    drop("INV-8: backspin feasible area <= floor");
    return false;
  }
  return true;
});
const viableTop = scoredTop.filter((c) => {
  if (c.stats.areaFraction <= AREA_FLOOR) {
    drop("INV-8: topspin feasible area <= floor");
    return false;
  }
  return true;
});
console.log(`viable after INV-7/8 — backspin ${viableBack.length}, topspin ${viableTop.length}`);

const results = [];
for (const b of viableBack) {
  for (const t of viableTop) {
    // Keep the comparison honest: the ball should arrive in a similar place.
    if (Math.abs(b.contact.y - t.contact.y) > 0.06) {
      drop("pairing: contact heights too different");
      continue;
    }
    if (Math.abs(b.contact.x - t.contact.x) > 0.5) {
      drop("pairing: contact depths too different");
      continue;
    }
    if (Math.abs(b.contact.vx - t.contact.vx) > MAX_SPEED_MISMATCH) {
      drop("pairing: arrival speeds too different");
      continue;
    }

    const gap = b.stats.centroidTheta - t.stats.centroidTheta;
    bestGap = Math.max(bestGap, gap);
    if (!(gap > 15)) {
      drop("INV-9: centroid gap <= 15deg");
      continue;
    }
    const iou = overlapRatio(b.grid, t.grid);
    if (!(iou < 0.25)) {
      drop("INV-10: IoU >= 0.25");
      continue;
    }

    results.push({ b, t, bStats: b.stats, tStats: t.stats, gap, iou });
  }
}

console.log("funnel:");
for (const [k, v] of Object.entries(funnel).sort((a, z) => z[1] - a[1])) {
  console.log(`  ${String(v).padStart(6)}  ${k}`);
}
console.log(
  `  best backspin area seen ${(bestArea * 100).toFixed(1)}%, best gap seen ${bestGap.toFixed(1)}deg`,
);

// Rank by how much spin is still on the ball at the bat, among pairs that
// already clear every invariant with margin. INV-9 can be satisfied by two
// serves that differ in speed rather than spin, and that would be a true test
// over a false page — so spin is the tiebreaker, not the gap.
const spinOf = (r) => Math.min(Math.abs(r.b.contact.omega), Math.abs(r.t.contact.omega));
const SORT = process.argv[7] ?? "spin";
results.sort((p, q) => (SORT === "gap" ? q.gap - p.gap : spinOf(q) - spinOf(p)));
console.log(`pairs satisfying INV-7/8/9/10 at ${COARSE}deg: ${results.length}`);

for (const r of results.slice(0, 5)) {
  console.log(
    `\ngap ${r.gap.toFixed(1)}deg  IoU ${r.iou.toFixed(3)}  ` +
      `area back ${(r.bStats.areaFraction * 100).toFixed(1)}% top ${(r.tStats.areaFraction * 100).toFixed(1)}%`,
  );
  for (const [name, c] of [
    ["backspin", r.b],
    ["topspin", r.t],
  ]) {
    console.log(
      `  ${name}: launch { x: ${c.state.x}, y: ${c.state.y}, vx: ${c.state.vx}, vy: ${c.state.vy} } ` +
        `spinMagnitude: ${c.spinMagnitude}\n` +
        `    bounces ${c.bounces.map((x) => x.toFixed(2)).join(", ")}  ` +
        `contact x=${c.contact.x.toFixed(2)} y=${c.contact.y.toFixed(3)} ` +
        `vx=${c.contact.vx.toFixed(2)} omega=${c.contact.omega.toFixed(0)}`,
    );
  }
}
