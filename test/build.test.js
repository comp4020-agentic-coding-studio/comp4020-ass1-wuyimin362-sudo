import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import { stripComments } from "../scripts/build.js";
import { COPY } from "../src/copy.js";
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

// Section 6.5 and 6.7: the deployed page has to say something without
// JavaScript, and has to paint before the modules arrive on a slow link.
// Every string is authored in src/copy.js and written into the markup at build
// time, so this checks the emitted HTML rather than the source.
describe("the built page reads without JavaScript", () => {
  const indexPath = "dist/index.html";

  /** @param {string} html */
  const visibleText = (html) =>
    html
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  it("carries its prose in the markup", async (t) => {
    if (!existsSync(indexPath)) {
      t.skip("dist/ not built — run pnpm build first");
      return;
    }
    const html = await readFile(indexPath, "utf8");
    const text = visibleText(html);

    // Before the copy was inlined this was 178 characters: no headline, no
    // explanation, and an empty <noscript>.
    assert.ok(
      text.length > 1200,
      `only ${text.length} characters survive without JavaScript`,
    );
    for (const required of [COPY.headline, COPY.standfirst, COPY.actOne.lede, COPY.noscript]) {
      assert.ok(text.includes(required), `missing from the built HTML: "${required.slice(0, 48)}…"`);
    }
  });

  it("gives the noscript block a diagram that needs no request", async (t) => {
    if (!existsSync(indexPath)) {
      t.skip("dist/ not built — run pnpm build first");
      return;
    }
    const html = await readFile(indexPath, "utf8");
    const noscript = html.slice(html.indexOf("<noscript>"), html.indexOf("</noscript>"));
    assert.match(noscript, /<svg/, "no inline diagram in the noscript fallback");
    assert.doesNotMatch(noscript, /<img|src=/, "the fallback must not fetch anything");
  });

  it("fetches nothing from the network", async (t) => {
    if (!existsSync(indexPath)) {
      t.skip("dist/ not built — run pnpm build first");
      return;
    }
    const html = await readFile(indexPath, "utf8");
    const external = [...html.matchAll(/(?:src|href)="(https?:)?\/\/[^"]*"/g)];
    assert.equal(external.length, 0, `external references: ${external.map((m) => m[0]).join(", ")}`);
  });
});

// A plain ES module graph is discovered by parsing, one round trip per layer.
// On a 2 s RTT link that waterfall took 9.1 s to reach first interaction, so
// index.html declares every module up front with modulepreload. That list is
// hand-maintained, which means it can silently fall behind src/.
describe("every module is preloaded", () => {
  it("index.html lists all of src/*.js", async () => {
    const html = await readFile("index.html", "utf8");
    const preloaded = new Set(
      [...html.matchAll(/rel="modulepreload"\s+href="\.\/src\/([\w.-]+\.js)"/g)].map((m) => m[1]),
    );
    const { readdirSync } = await import("node:fs");
    const modules = readdirSync("src").filter((f) => f.endsWith(".js"));
    for (const module of modules) {
      assert.ok(
        preloaded.has(module),
        `src/${module} is not in index.html's modulepreload list, so it costs an extra round trip`,
      );
    }
    assert.equal(preloaded.size, modules.length, "modulepreload lists a module that no longer exists");
  });
});
