import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

// INV-12. The architectural constraint from the execution plan's section 3:
// physics.js and solver.js must run under bare node, so the whole simulation
// can be tested without a browser and can never quietly start depending on
// one. Machine-checkable, which is the point — "we were careful" is not a
// constraint.

const PURE_MODULES = ["src/physics.js", "src/solver.js"];

// Non-determinism is banned alongside the DOM: without it INV-13 is a lottery
// and every other invariant here is measuring noise.
const FORBIDDEN = [
  "document",
  "window",
  "canvas",
  "localStorage",
  "requestAnimationFrame",
  "Math.random",
  "Date.now",
];

describe("INV-12 the simulation modules are pure", () => {
  for (const path of PURE_MODULES) {
    it(`${path} touches no browser or non-deterministic API`, () => {
      const source = readFileSync(path, "utf8");
      for (const banned of FORBIDDEN) {
        // Comments are stripped first so prose about the DOM is allowed to
        // mention it; only real code counts.
        const code = source
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        assert.ok(
          !code.includes(banned),
          `${path} references ${banned}; it must run under bare node`,
        );
      }
    });
  }

  it("both modules import cleanly with no globals present", async () => {
    // A bare import is the real test of the constraint: if either module
    // touched the DOM at module scope, this would throw under node.
    const physics = await import("../src/physics.js");
    const solver = await import("../src/solver.js");
    assert.ok(typeof physics.magnusForce === "function");
    assert.ok(typeof solver.simulateReturn === "function");
  });
});
