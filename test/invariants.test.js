import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import {
  BALL_INERTIA,
  BALL_MASS,
  E_BAT,
  E_TABLE,
  GRAVITY,
  MU_BAT,
  MU_TABLE,
  SPIN,
  SWING_SPEED,
  TABLE_HALF,
  batImpulse,
  batSurface,
  magnusForce,
  omegaSignFor,
  simulateFlight,
  tableBounce,
} from "../src/physics.js";

import {
  BAT_ANGLE,
  SWING_DIRECTION,
  feasibleStats,
  overlapRatio,
  scanGrid,
  simulateReturn,
} from "../src/solver.js";

// The invariant ids are in the test names on purpose: when one goes red,
// PROCESS.md can cite the id and a reader can find the assertion.
// Contract: COMP4020-A1-execution-plan.md section 5.

// ---------------------------------------------------------------- INV-1

describe("INV-1 magnus direction follows the cross product", () => {
  it("omega > 0 with v = (5, 0) pushes up", () => {
    assert.ok(magnusForce({ x: 5, y: 0 }, 180).y > 0);
  });

  it("omega < 0 with v = (5, 0) pushes down", () => {
    assert.ok(magnusForce({ x: 5, y: 0 }, -180).y < 0);
  });

  it("the spin naming maps to whichever sign actually lifts", () => {
    // Section 4.2 keeps this mapping in exactly one place. It is direction
    // dependent — a ball travelling -x carries backspin at omega < 0 — so it
    // has to be derived, never written down.
    for (const vx of [6, -6]) {
      const back = omegaSignFor(SPIN.BACKSPIN, vx) * 200;
      const top = omegaSignFor(SPIN.TOPSPIN, vx) * 200;
      assert.ok(
        magnusForce({ x: vx, y: 0 }, back).y > 0,
        `backspin travelling ${vx > 0 ? "+x" : "-x"} must lift`,
      );
      assert.ok(
        magnusForce({ x: vx, y: 0 }, top).y < 0,
        `topspin travelling ${vx > 0 ? "+x" : "-x"} must dip`,
      );
    }
  });
});

// ---------------------------------------------------------------- INV-2

/** @param {import('../src/physics.js').BallState[]} trajectory */
function landingX(trajectory) {
  for (let i = 1; i < trajectory.length; i++) {
    const a = trajectory[i - 1];
    const b = trajectory[i];
    if (a.y >= 0 && b.y < 0) {
      return a.x + (a.y / (a.y - b.y)) * (b.x - a.x);
    }
  }
  throw new Error("trajectory never came back to y = 0");
}

describe("INV-2 spin orders the range", () => {
  it("range(backspin) > range(nospin) > range(topspin)", () => {
    const launch = { x: 0, y: 0, vx: 6, vy: 3 };
    const back = landingX(simulateFlight({ ...launch, omega: 180 }, 4000));
    const none = landingX(simulateFlight({ ...launch, omega: 0 }, 4000));
    const top = landingX(simulateFlight({ ...launch, omega: -180 }, 4000));
    assert.ok(back > none, `backspin ${back} should exceed nospin ${none}`);
    assert.ok(none > top, `nospin ${none} should exceed topspin ${top}`);
  });
});

// ---------------------------------------------------------------- INV-3

describe("INV-3 the table couples spin into vx", () => {
  it("backspin slows the ball", () => {
    const before = { x: 0, y: 0, vx: 3, vy: -3, omega: 180 };
    assert.ok(Math.abs(tableBounce(before).vx) < Math.abs(before.vx));
  });

  it("topspin speeds it up", () => {
    const before = { x: 0, y: 0, vx: 3, vy: -3, omega: -190 };
    assert.ok(Math.abs(tableBounce(before).vx) > Math.abs(before.vx));
  });

  it("omega = +400 kicks it back the other way", () => {
    const before = { x: 0, y: 0, vx: 2, vy: -6, omega: 400 };
    assert.notEqual(Math.sign(tableBounce(before).vx), Math.sign(before.vx));
  });
});

// ---------------------------------------------------------------- INV-4

/** @param {import('../src/physics.js').BallState} s */
const kinetic = (s) => 0.5 * BALL_MASS * (s.vx ** 2 + s.vy ** 2);
/** @param {import('../src/physics.js').BallState} s */
const mechanical = (s) => kinetic(s) + BALL_MASS * GRAVITY * s.y;
const EPS = 1e-6;

describe("INV-4 energy bookkeeping", () => {
  it("free flight never gains mechanical energy", () => {
    // Sampled every 40 steps (~0.02 s): coarse enough that real drag
    // dissipation dominates per-step integrator noise.
    const path = simulateFlight({ x: 0, y: 1, vx: 6, vy: 2, omega: 180 }, 3000);
    for (let i = 40; i < path.length; i += 40) {
      assert.ok(
        mechanical(path[i]) <= mechanical(path[i - 40]) + EPS,
        `energy rose between samples ${i - 40} and ${i}`,
      );
    }
  });

  it("a table bounce never gains kinetic energy", () => {
    const before = { x: 0, y: 0, vx: 5, vy: -3, omega: 180 };
    assert.ok(kinetic(tableBounce(before)) <= kinetic(before) + EPS);
  });

  it("a bat impulse creates no energy in the bat's own frame", () => {
    // Section 5 phrases this as "kinetic energy after <= kinetic energy before
    // + the bat's kinetic energy". Taken literally that is not a valid bound
    // and this assertion failed against correct physics: a ball rebounding
    // from an approaching surface can leave at up to 2*v_bat + e*v_ball, so
    // 0.5*m*v_bat^2 does not cover it. At theta=-30, phi=-60 the ball leaves
    // with 0.175 J against a literal ceiling of 0.089 J.
    //
    // The rigorous form of the same intent — no energy from nowhere — is that
    // in the bat's rest frame, where the impulses do no net work on the bat,
    // the ball's total energy cannot rise. Rotational energy is included
    // because friction trades spin against translation in both directions.
    /** @param {import('../src/physics.js').BallState} s @param {{x: number, y: number}} bat */
    const energyInBatFrame = (s, bat) =>
      0.5 * BALL_MASS * ((s.vx - bat.x) ** 2 + (s.vy - bat.y) ** 2) +
      0.5 * BALL_INERTIA * s.omega ** 2;

    for (const theta of [-30, -10, 0, 25, 45, 70]) {
      for (const phi of [-60, -20, 0, 40, 80]) {
        for (const omega of [-500, -200, 0, 200, 500]) {
          const before = { x: -1.6, y: 0.25, vx: -4, vy: -1, omega };
          const after = batImpulse(before, theta, phi);
          const bat = batSurface(theta, phi).surfaceVelocity;
          assert.ok(
            energyInBatFrame(after, bat) <= energyInBatFrame(before, bat) + EPS,
            `theta=${theta} phi=${phi} omega=${omega}: ${energyInBatFrame(after, bat)} > ${energyInBatFrame(before, bat)}`,
          );
        }
      }
    }
  });
});

// ---------------------------------------------------------------- INV-5

describe("INV-5 every contact stays inside the Coulomb cone", () => {
  it("the table does", () => {
    const cases = [
      { x: 0, y: 0, vx: 2, vy: -6, omega: 800 },
      { x: 0, y: 0, vx: 5, vy: -3, omega: -400 },
      { x: 0, y: 0, vx: 1, vy: -1, omega: 50 },
    ];
    for (const before of cases) {
      const after = tableBounce(before);
      const jt = (after.vx - before.vx) * BALL_MASS;
      const jn = (1 + E_TABLE) * BALL_MASS * Math.abs(before.vy);
      assert.ok(
        Math.abs(jt) <= MU_TABLE * jn + 1e-9,
        `table: |Jt| ${Math.abs(jt)} exceeded mu*Jn ${MU_TABLE * jn}`,
      );
    }
  });

  it("the bat does", () => {
    for (const theta of [-30, -10, 0, 20, 45, 70]) {
      for (const phi of [-60, -20, 0, 30, 80]) {
        const before = { x: -1.6, y: 0.25, vx: -4, vy: -1, omega: -400 };
        const after = batImpulse(before, theta, phi);
        const rad = (theta * Math.PI) / 180;
        const n = { x: Math.cos(rad), y: Math.sin(rad) };
        const t = { x: -Math.sin(rad), y: Math.cos(rad) };
        const dvx = after.vx - before.vx;
        const dvy = after.vy - before.vy;
        const jn = (dvx * n.x + dvy * n.y) * BALL_MASS;
        const jt = (dvx * t.x + dvy * t.y) * BALL_MASS;
        assert.ok(
          Math.abs(jt) <= MU_BAT * Math.abs(jn) + 1e-9,
          `bat theta=${theta} phi=${phi}: |Jt| ${Math.abs(jt)} > mu*Jn ${MU_BAT * Math.abs(jn)}`,
        );
      }
    }
  });
});

// ---------------------------------------------------------------- INV-6

describe("INV-6 the landing point moves smoothly with bat angle", () => {
  it("no jump over 0.15 m between adjacent half-degree steps", () => {
    // Exempt the steps that cross an outcome boundary: NET -> IN is a real
    // discontinuity in where the ball ends up, not numerical noise.
    let previous = null;
    for (let theta = BAT_ANGLE.min; theta <= BAT_ANGLE.max; theta += 0.5) {
      const result = simulateReturn(SPIN.BACKSPIN, theta, 20).result;
      if (result.outcome === "IN" && previous !== null) {
        assert.ok(
          Math.abs(result.landingX - previous) < 0.15,
          `landing jumped ${Math.abs(result.landingX - previous).toFixed(3)} m at theta=${theta}`,
        );
      }
      previous = result.outcome === "IN" ? result.landingX : null;
    }
  });
});

// ---------------------------------------------------------------- INV-7

describe("INV-7 the intuitive default fails", () => {
  it("bat 0 degrees, swing +5 against backspin goes into the net", () => {
    const { result } = simulateReturn(SPIN.BACKSPIN, 0, 5);
    assert.equal(
      result.outcome,
      "NET",
      `the first screen is designed to fail; got ${result.outcome}`,
    );
  });
});

// -------------------------------------------------------- INV-8, 9, 10

const backGrid = scanGrid(SPIN.BACKSPIN, 2, 2);
const topGrid = scanGrid(SPIN.TOPSPIN, 2, 2);
const backStats = feasibleStats(backGrid);
const topStats = feasibleStats(topGrid);

describe("INV-8 both serves are answerable", () => {
  for (const [name, stats] of /** @type {const} */ ([
    ["backspin", backStats],
    ["topspin", topStats],
  ])) {
    it(`${name} has a feasible region larger than 5% of the grid`, () => {
      assert.ok(stats.count > 0, `${name} has no feasible settings at all`);
      assert.ok(
        stats.areaFraction > 0.05,
        `${name} feasible area ${(stats.areaFraction * 100).toFixed(2)}% is under 5% — solvable, but punishing`,
      );
    });
  }
});

describe("INV-9 the argument, as an assertion", () => {
  it("backspin needs a bat more than 15 degrees more open than topspin", () => {
    const gap = backStats.centroidTheta - topStats.centroidTheta;
    assert.ok(
      gap > 15,
      `backspin centroid ${backStats.centroidTheta.toFixed(1)}deg, topspin ${topStats.centroidTheta.toFixed(1)}deg, gap ${gap.toFixed(1)}deg — the page is lying if this is red`,
    );
  });
});

describe("INV-10 the two answers barely overlap", () => {
  it("intersection over union is under 0.25", () => {
    const iou = overlapRatio(backGrid, topGrid);
    assert.ok(iou < 0.25, `IoU ${iou.toFixed(3)} — one bat angle would cover both serves`);
  });
});

// --------------------------------------------------------------- INV-11

describe("INV-11 the solver is fast enough to be live", () => {
  it("a 40x40 scan finishes inside 3 seconds", () => {
    const started = process.hrtime.bigint();
    scanGrid(
      SPIN.BACKSPIN,
      (BAT_ANGLE.max - BAT_ANGLE.min) / 39,
      (SWING_DIRECTION.max - SWING_DIRECTION.min) / 39,
    );
    const seconds = Number(process.hrtime.bigint() - started) / 1e9;
    assert.ok(seconds < 3, `40x40 scan took ${seconds.toFixed(2)} s`);
  });
});

// --------------------------------------------------------------- INV-13

describe("INV-13 the simulation is deterministic", () => {
  it("the same input gives a bit-identical trajectory", () => {
    const first = simulateReturn(SPIN.BACKSPIN, 12, 20);
    const second = simulateReturn(SPIN.BACKSPIN, 12, 20);
    assert.equal(first.path.length, second.path.length);
    for (let i = 0; i < first.path.length; i++) {
      for (const key of /** @type {const} */ (["x", "y", "vx", "vy", "omega"])) {
        assert.equal(
          first.path[i][key],
          second.path[i][key],
          `divergence at step ${i}, field ${key}`,
        );
      }
    }
    assert.deepEqual(first.result, second.result);
  });
});

// Referenced so an accidental constant rename fails loudly here rather than
// silently changing the physics somewhere downstream.
describe("the contract's constants are the ones in section 4", () => {
  it("holds the calibrated coefficients", () => {
    assert.equal(E_TABLE, 0.8);
    assert.equal(MU_TABLE, 0.25);
    assert.equal(E_BAT, 0.55);
    assert.equal(MU_BAT, 0.9);
    assert.equal(SWING_SPEED, 7.0);
    assert.equal(TABLE_HALF, 1.37);
  });
});
