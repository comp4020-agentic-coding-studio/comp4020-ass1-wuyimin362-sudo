import { defineConfig } from "astro/config";

// The deployed site lives at comp4020-agentic-coding-studio.github.io/<repo>/
// (a project page, not a user/org page), so every internal link and built
// asset URL needs this prefix or it 404s on the live URL while looking fine
// in `astro dev`. Keep the trailing slash — see the Astro-specific traps
// section in CLAUDE.md for what breaks without it.
export default defineConfig({
  base: "/comp4020-ass1-wuyimin362-sudo/",
});
