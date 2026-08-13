import { describe, expect, it } from "vitest";
import { BALL_RADIUS, type BallState } from "../src/lib/physics";
import {
  CONTACT_X,
  NET_HEIGHT,
  NET_X,
  SERVES,
  TABLE_LENGTH,
  traceServe,
  type SpinPreset,
} from "../src/lib/simulate";

// INV-1..INV-5 pin the physics and spec/assignment-1.test.ts pins the return,
// and between them they missed two serves that were nonsense.
//
// The first pass had a backspin serve whose Magnus lift exceeded the ball's
// own weight: it floated the full length of the table and never bounced at
// all. The second had the ball arriving at the receiver 9 cm *below* the
// playing surface. Both passed every check in the repo, because every check
// in the repo was about a single contact or the outcome of a return — nothing
// asserted that the thing being returned was a legal serve in the first place.
//
// This is that missing sensor. It is the contract the page's whole claim
// rests on: two *legal* serves, matched at the bat, differing in spin.

const PRESETS: SpinPreset[] = ["backspin", "topspin"];

function bouncesOf(path: BallState[]): number[] {
  // A bounce is where the table sends the ball back up.
  return path.filter((s, i) => i > 0 && s.vy > 0 && path[i - 1].vy <= 0).map((s) => s.x);
}

describe.each(PRESETS)("the %s serve is legal", (preset) => {
  const trace = traceServe(preset);
  const bounces = bouncesOf(trace.path);

  it("bounces exactly twice before reaching the receiver", () => {
    expect(bounces.map((x) => x.toFixed(2)).join(", ")).toSatisfy(
      () => bounces.length === 2,
      `expected one bounce per half, got ${bounces.length}`,
    );
  });

  it("bounces on the server's half first, then the receiver's half", () => {
    const [first, second] = bounces;
    expect(first, "first bounce is not on the server's half").toBeGreaterThan(0);
    expect(first, "first bounce is not on the server's half").toBeLessThan(NET_X);
    expect(second, "second bounce is not on the receiver's half").toBeGreaterThan(NET_X);
    expect(second, "second bounce is past the end of the table").toBeLessThan(TABLE_LENGTH);
  });

  it("clears the net on the way over", () => {
    const crossing = trace.path.find((s) => s.x >= NET_X);
    expect(crossing, "the serve never reached the net").toBeDefined();
    expect(crossing?.y ?? 0).toBeGreaterThan(NET_HEIGHT + BALL_RADIUS);
  });

  it("reaches the bat above the table, not through it", () => {
    expect(trace.contact.x).toBeGreaterThanOrEqual(CONTACT_X);
    expect(
      trace.contact.y,
      "the ball arrives below the playing surface — there is nothing to hit",
    ).toBeGreaterThan(BALL_RADIUS);
  });

  it("still carries heavy spin when it arrives", () => {
    // The page's claim is that spin decides the bat angle. If the table
    // bounces scrubbed the spin off, there would be nothing to explain.
    expect(Math.abs(trace.contact.omega)).toBeGreaterThan(400);
    // ...and it must not have flipped sign on the way.
    expect(Math.sign(trace.contact.omega)).toBe(Math.sign(SERVES[preset].launch.omega));
  });
});

describe("the two serves are a controlled comparison", () => {
  const backspin = traceServe("backspin").contact;
  const topspin = traceServe("topspin").contact;

  it("presents the ball to the bat at the same height", () => {
    expect(Math.abs(backspin.y - topspin.y)).toBeLessThan(0.03);
  });

  it("presents it at close to the same speed", () => {
    // Not identical, and it cannot be: INV-3 says the table bounce slows a
    // backspin ball and speeds up a topspin one, so two serves that arrive
    // spinning oppositely arrive at different speeds by construction.
    expect(Math.abs(backspin.vx - topspin.vx)).toBeLessThan(0.8);
  });

  it("spins the two balls in opposite directions", () => {
    expect(Math.sign(backspin.omega)).toBe(1);
    expect(Math.sign(topspin.omega)).toBe(-1);
  });
});
