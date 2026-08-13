import { describe, expect, it } from "vitest";
import { simulate, type SpinPreset } from "../src/lib/simulate";

// The page makes one claim in prose, on the strength of which everything else
// is written: that reading the spin is not a refinement, because the settings
// that return one serve almost never return the other. The page counts this
// live from the same simulation the visitor drives, so the sentence cannot go
// stale — but nothing stops the *model* drifting until the claim is no longer
// true and the page quietly says so in smaller numbers.
//
// This is that guard. It fails if the two solution regions ever start to
// meaningfully overlap, which would mean the page's headline is wrong however
// honestly it is rendered.

const BAT_ANGLE = { min: -30, max: 70 };
const SWING_DIRECTION = { min: -60, max: 80 };
const STEP = 2;

function grid(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  for (let v = min; v <= max; v += step) values.push(v);
  return values;
}

const BAT_ANGLES = grid(BAT_ANGLE.min, BAT_ANGLE.max, STEP);
const SWINGS = grid(SWING_DIRECTION.min, SWING_DIRECTION.max, STEP);

function lands(preset: SpinPreset, bat: number, swing: number): boolean {
  return simulate(preset, bat, swing).outcome === "IN";
}

const counts = { backspin: 0, topspin: 0, both: 0 };
for (const bat of BAT_ANGLES) {
  for (const swing of SWINGS) {
    const back = lands("backspin", bat, swing);
    const top = lands("topspin", bat, swing);
    if (back) counts.backspin++;
    if (top) counts.topspin++;
    if (back && top) counts.both++;
  }
}

describe("the page's headline claim", () => {
  it("finds a workable region for each serve", () => {
    expect(counts.backspin).toBeGreaterThan(20);
    expect(counts.topspin).toBeGreaterThan(20);
  });

  it("shares almost none of them between the two serves", () => {
    const shared = counts.both / counts.backspin;
    expect(
      shared,
      `${counts.both} of ${counts.backspin} backspin solutions also return topspin ` +
        `(${(shared * 100).toFixed(1)}%) — the page says there is "very nearly no setting that ` +
        `covers both serves", and above about one in ten that stops being a fair thing to say`,
    ).toBeLessThan(0.1);
  });
});
