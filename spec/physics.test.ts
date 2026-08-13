import { describe, expect, it } from "vitest";
import {
  BALL_MASS,
  E_TABLE,
  GRAVITY,
  MU_TABLE,
  magnusForce,
  simulateFlight,
  tableBounce,
  type BallState,
} from "../src/lib/physics";

// These pin the unit-level physics contract (src/lib/physics.ts) before any
// real implementation exists — every test here is expected to fail right now
// because the stub functions throw. That's the point of writing them first:
// the API and the numbers it has to satisfy are fixed before the
// implementation is, not the other way round.

describe("INV-1: Magnus force direction follows the cross-product convention", () => {
  it("omega > 0 (backspin, ball moving toward +x) produces an upward force", () => {
    const F = magnusForce({ x: 5, y: 0 }, 180);
    expect(F.y).toBeGreaterThan(0);
  });

  it("omega < 0 (topspin, ball moving toward +x) produces a downward force", () => {
    const F = magnusForce({ x: 5, y: 0 }, -180);
    expect(F.y).toBeLessThan(0);
  });
});

describe("INV-2: spin changes free-flight range in the expected order", () => {
  function landingX(trajectory: BallState[]): number {
    for (let i = 1; i < trajectory.length; i++) {
      const a = trajectory[i - 1];
      const b = trajectory[i];
      if (a.y >= 0 && b.y < 0) {
        const f = a.y / (a.y - b.y);
        return a.x + f * (b.x - a.x);
      }
    }
    throw new Error("trajectory never returned to y=0 within the simulated window");
  }

  it("range(backspin) > range(nospin) > range(topspin), same launch speed and angle", () => {
    const launch = { x: 0, y: 0, vx: 6, vy: 3 };
    const backspinRange = landingX(simulateFlight({ ...launch, omega: 180 }, 4000));
    const nospinRange = landingX(simulateFlight({ ...launch, omega: 0 }, 4000));
    const topspinRange = landingX(simulateFlight({ ...launch, omega: -180 }, 4000));

    expect(
      backspinRange,
      `backspin range ${backspinRange} should exceed nospin range ${nospinRange}`,
    ).toBeGreaterThan(nospinRange);
    expect(
      nospinRange,
      `nospin range ${nospinRange} should exceed topspin range ${topspinRange}`,
    ).toBeGreaterThan(topspinRange);
  });
});

describe("INV-3: table bounce couples spin into horizontal velocity", () => {
  it("backspin (omega=+180) reduces |vx| after bounce", () => {
    const before: BallState = { x: 0, y: 0, vx: 3, vy: -3, omega: 180 };
    const after = tableBounce(before);
    expect(Math.abs(after.vx)).toBeLessThan(Math.abs(before.vx));
  });

  it("topspin (omega=-190) increases |vx| after bounce", () => {
    const before: BallState = { x: 0, y: 0, vx: 3, vy: -3, omega: -190 };
    const after = tableBounce(before);
    expect(Math.abs(after.vx)).toBeGreaterThan(Math.abs(before.vx));
  });

  it("strong enough backspin (omega=+400) reverses the direction of vx", () => {
    const before: BallState = { x: 0, y: 0, vx: 2, vy: -6, omega: 400 };
    const after = tableBounce(before);
    expect(Math.sign(after.vx)).not.toBe(Math.sign(before.vx));
  });
});

describe("INV-4: energy bookkeeping", () => {
  const mechanicalEnergy = (s: BallState) =>
    0.5 * BALL_MASS * (s.vx ** 2 + s.vy ** 2) + BALL_MASS * GRAVITY * s.y;
  const ENERGY_EPSILON = 1e-6;
  const SAMPLE_STRIDE = 40; // ~0.02s between samples at FIXED_DT — coarse enough
  // that real drag dissipation dominates any per-step integrator noise.

  it("total mechanical energy does not increase during free flight", () => {
    const trajectory = simulateFlight({ x: 0, y: 1, vx: 6, vy: 2, omega: 180 }, 3000);
    for (let i = SAMPLE_STRIDE; i < trajectory.length; i += SAMPLE_STRIDE) {
      expect(mechanicalEnergy(trajectory[i])).toBeLessThanOrEqual(
        mechanicalEnergy(trajectory[i - SAMPLE_STRIDE]) + ENERGY_EPSILON,
      );
    }
  });

  it("kinetic energy after a table bounce does not exceed pre-bounce kinetic energy", () => {
    const before: BallState = { x: 0, y: 0, vx: 5, vy: -3, omega: 180 };
    const after = tableBounce(before);
    const kineticEnergy = (s: BallState) => 0.5 * BALL_MASS * (s.vx ** 2 + s.vy ** 2);
    expect(kineticEnergy(after)).toBeLessThanOrEqual(kineticEnergy(before) + ENERGY_EPSILON);
  });
});

describe("INV-5: table bounce respects the Coulomb friction bound", () => {
  it("the implied tangential impulse never exceeds mu_table times the normal impulse", () => {
    const cases: BallState[] = [
      { x: 0, y: 0, vx: 2, vy: -6, omega: 800 },
      { x: 0, y: 0, vx: 5, vy: -3, omega: -400 },
      { x: 0, y: 0, vx: 1, vy: -1, omega: 50 },
    ];
    for (const before of cases) {
      const after = tableBounce(before);
      const Jt = (after.vx - before.vx) * BALL_MASS;
      const Jn = (1 + E_TABLE) * BALL_MASS * Math.abs(before.vy);
      expect(Math.abs(Jt), `case ${JSON.stringify(before)}`).toBeLessThanOrEqual(
        MU_TABLE * Jn + 1e-9,
      );
    }
  });
});
