#!/usr/bin/env node
// The whole build: copy the static site into dist/.
//
// Execution plan section 3 asks for zero build step and plain ES modules; the
// course harness requires `pnpm build` to emit a complete site into dist/ for
// the Pages deploy. Both are satisfied by a copy — what ships is byte for byte
// what is in the repo, so there is no compiled artefact that can disagree with
// the source.
//
// Every asset path in index.html is relative, so the site works unchanged at a
// project-page base like /comp4020-ass1-wuyimin362-sudo/ without a base
// setting to get wrong.

import { cp, mkdir, rm, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const OUT = "dist";
const ENTRIES = ["index.html", "styles.css", "src"];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const entry of ENTRIES) {
  await cp(entry, join(OUT, entry), { recursive: true });
}

/** @param {string} dir @returns {Promise<number>} */
async function totalBytes(dir) {
  let total = 0;
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    total += item.isDirectory() ? await totalBytes(path) : (await stat(path)).size;
  }
  return total;
}

const bytes = await totalBytes(OUT);
// Section 6.5 sets an 80 KB uncompressed budget for the whole site, because
// the marker may open this on a slow connection. Printed on every build so it
// cannot drift unnoticed.
console.log(`built ${OUT}/ — ${(bytes / 1024).toFixed(1)} KB uncompressed (budget 80 KB)`);
if (bytes > 80 * 1024) {
  console.error(`✗ over the 80 KB budget by ${((bytes - 80 * 1024) / 1024).toFixed(1)} KB`);
  process.exit(1);
}
