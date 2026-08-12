import { describe, expect, it } from "vitest";
import { simulate, type SpinPreset } from "../src/lib/simulate";

// The core interaction is a live simulation: two sliders (bat angle, swing
// direction) and a backspin/topspin toggle recompute the return trajectory on
// every input. This file pins the contract simulate() has to satisfy before
// the sliders can drive anything — not the trajectory or the rendering, which
// are downstream of this. It starts red: simulate() is a stub
// (src/lib/simulate.ts) until the physics is built.

// The control ranges from the brief, kept here rather than imported, so a
// change to the UI's slider bounds is a deliberate edit to this file too.
const BAT_ANGLE = { min: -30, max: 70 };
const SWING_DIRECTION = { min: -60, max: 80 };
const STEP = 5; // degrees; grid resolution for the region/centroid checks

function range(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  for (let v = min; v <= max; v += step) values.push(v);
  return values;
}

// Every bat angle that returns the ball IN, for one serve preset, swept
// across the full control grid — the raw data both the region check and the
// centroid comparison read from.
function inBatAngles(preset: SpinPreset): number[] {
  const angles: number[] = [];
  for (const batAngle of range(BAT_ANGLE.min, BAT_ANGLE.max, STEP)) {
    for (const swingDirection of range(SWING_DIRECTION.min, SWING_DIRECTION.max, STEP)) {
      if (simulate(preset, batAngle, swingDirection).outcome === "IN") {
        angles.push(batAngle);
      }
    }
  }
  return angles;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

describe("second-ball return simulation", () => {
  it("is deterministic: the same input yields a bit-identical result", () => {
    const first = simulate("backspin", 12, 20);
    const second = simulate("backspin", 12, 20);
    expect(
      second,
      "same (preset, batAngle, swingDirection) produced a different result",
    ).toEqual(first);
  });

  it("nets the default settings — 0° bat angle, +5° swing, against backspin", () => {
    expect(
      simulate("backspin", 0, 5),
      "the default settings are meant to fail; a visitor who changes nothing should see NET",
    ).toEqual({ outcome: "NET" });
  });

  it("reaches IN somewhere in the control range, for both serve presets", () => {
    expect(
      inBatAngles("backspin").length,
      "no (batAngle, swingDirection) pair in range returns the ball IN against backspin",
    ).toBeGreaterThan(0);
    expect(
      inBatAngles("topspin").length,
      "no (batAngle, swingDirection) pair in range returns the ball IN against topspin",
    ).toBeGreaterThan(0);
  });

  it("needs a more open bat angle against backspin than against topspin, by more than 15°", () => {
    const backspinCentroid = mean(inBatAngles("backspin"));
    const topspinCentroid = mean(inBatAngles("topspin"));
    expect(
      backspinCentroid - topspinCentroid,
      `backspin centroid ${backspinCentroid.toFixed(1)}°, topspin centroid ${topspinCentroid.toFixed(1)}° — the gap is the point of the explainer`,
    ).toBeGreaterThan(15);
  });
});
