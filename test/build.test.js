import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";

import { stripComments } from "../scripts/build.js";
import { SPIN } from "../src/physics.js";
import { simulateReturn } from "../src/solver.js";

// The build strips comments on the way into dist/ so the 80 KB budget in
// section 6.5 can be met without deleting the reasoning out of the source.
// That is a transformation between what is tested and what is deployed, and
// anything in that gap needs its own check — every other test in this repo
// runs against src/, so none of them would notice dist/ being wrong.

describe("the comment stripper leaves code alone", () => {
  it("keeps a // that is inside a string", () => {
    const source = 'const url = "https://example.com/a";\n';
    assert.equal(stripComments(source), source);
  });

  it("keeps a trailing comment's line, because the code is on it", () => {
    assert.match(stripComments("const x = 1; // keep the code\n"), /const x = 1;/);
  });

  it("removes a comment-only line", () => {
    assert.equal(stripComments("// gone\nconst x = 1;\n"), "const x = 1;\n");
  });

  it("removes a block that starts its own line", () => {
    assert.equal(stripComments("/**\n * gone\n */\nconst x = 1;\n"), "const x = 1;\n");
  });

  it("removes a single-line block comment", () => {
    assert.equal(stripComments("/* gone */\nconst x = 1;\n"), "const x = 1;\n");
  });
});

describe("the built modules behave like the source", () => {
  const built = "dist/src/solver.js";

  it("returns identical trajectories from dist/ and src/", async (t) => {
    if (!existsSync(built)) {
      t.skip("dist/ not built — run pnpm build first");
      return;
    }
    const fromDist = await import(`../${built}`);

    for (const spin of [SPIN.BACKSPIN, SPIN.TOPSPIN]) {
      for (const [bat, swing] of [
        [0, 5],
        [8, 25],
        [-25, -50],
        [55, 70],
      ]) {
        const a = simulateReturn(spin, bat, swing);
        const b = fromDist.simulateReturn(spin, bat, swing);
        assert.deepEqual(
          b.result,
          a.result,
          `${spin} at bat ${bat}, swing ${swing} differs between src and dist`,
        );
        assert.equal(b.path.length, a.path.length);
      }
    }
  });
});
