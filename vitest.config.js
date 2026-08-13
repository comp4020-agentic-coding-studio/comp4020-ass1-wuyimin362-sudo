import { defineConfig } from "vitest/config";

// Two runners, deliberately, each scoped to its own directory.
//
// `spec/` is the course starter's own suite: it runs against the built `dist/`
// with jsdom, and the brief says to keep it. `test/` is this build's
// invariants (INV-1..INV-13), which the execution plan's section 3 requires to
// run under bare `node --test` with zero dependencies — that constraint is the
// point, since it is what stops the simulation quietly growing a dependency on
// a browser or on a test framework.
//
// Without this exclusion vitest also collects `test/`, finds `node:test`
// suites it cannot execute, and fails with "No test suite found" on files that
// are green under their own runner. `pnpm check` runs both.
export default defineConfig({
  test: {
    include: ["spec/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["test/**", "node_modules/**", "dist/**", "notes/**"],
  },
});
