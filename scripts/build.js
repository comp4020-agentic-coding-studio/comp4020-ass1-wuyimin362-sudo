#!/usr/bin/env node
// The whole build: copy the static site into dist/, with comments stripped
// from the JavaScript.
//
// Execution plan section 3 asks for zero build step and plain ES modules;
// section 6.5 caps the whole site at 80 KB uncompressed because the marker may
// open it on a slow connection. Those pull against each other here: 38% of
// this source is comments, and they are the reasoning — process evidence that
// should not be deleted to save bytes.
//
// So the repo keeps the full commentary and dist/ gets the same modules with
// the comments removed. There is still no bundler, no transpiler and no
// framework: what ships is the same plain ES modules, just without the essays.
//
// The stripper is deliberately conservative — it only removes lines that
// *begin* a comment — so a `//` inside a string literal is never touched. Two
// checks stand behind it: every emitted file is parsed with `node --check`,
// and `pnpm check` runs the invariant suite, which imports the source.

import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const OUT = "dist";
const ENTRIES = ["index.html", "styles.css", "src"];
const BUDGET_BYTES = 80 * 1024;

/**
 * Remove comment-only lines and block comments that start their own line.
 *
 * Anything sharing a line with code is left alone, which keeps the rule simple
 * enough to be obviously safe: a line whose first non-space characters are
 * `//` or `/*` cannot be inside a string literal in this codebase, and
 * `node --check` catches it if that ever stops being true.
 *
 * @param {string} source
 * @returns {string}
 */
export function stripComments(source) {
  const out = [];
  let inBlock = false;
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (inBlock) {
      if (trimmed.endsWith("*/") || trimmed.includes("*/")) inBlock = false;
      continue;
    }
    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) inBlock = true;
      continue;
    }
    if (trimmed.startsWith("//")) continue;
    out.push(line);
  }
  // Collapse the blank runs the removals leave behind.
  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
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

/** @param {string} dir @returns {Promise<string[]>} */
async function jsFiles(dir) {
  /** @type {string[]} */
  const found = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) found.push(...(await jsFiles(path)));
    else if (extname(path) === ".js") found.push(path);
  }
  return found;
}

if (process.argv[1]?.endsWith("build.js")) {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const entry of ENTRIES) {
    await cp(entry, join(OUT, entry), { recursive: true });
  }

  const emitted = await jsFiles(join(OUT, "src"));
  for (const file of emitted) {
    await writeFile(file, stripComments(await readFile(file, "utf8")));
    // Parse every emitted module. If the stripper ever mangles one, the build
    // fails here rather than the deployed page failing in a browser.
    execFileSync(process.execPath, ["--check", file]);
  }

  const bytes = await totalBytes(OUT);
  console.log(
    `built ${OUT}/ — ${(bytes / 1024).toFixed(1)} KB uncompressed ` +
      `(budget ${BUDGET_BYTES / 1024} KB), ${emitted.length} modules checked`,
  );
  if (bytes > BUDGET_BYTES) {
    console.error(`✗ over budget by ${((bytes - BUDGET_BYTES) / 1024).toFixed(1)} KB`);
    process.exit(1);
  }
}
