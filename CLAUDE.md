# COMP4020 prototype

This is your starter repo for a COMP4020 prototype: a static site written in
HTML/CSS/TypeScript that builds to plain HTML/CSS/JS and deploys to GitHub
Pages. The **deployed site is what gets marked** --- not this repo, and not "it
works on my machine". It's marked live in Chrome against the deployed URL at two
viewports --- 1920×1080 (desktop) and 390×844 (phone) --- and both count in
full, so make that artefact good at both and use the checks below to know
whether it is.

What you're building this week — the spec — is published on the course website,
and this repo's name tells you which deliverable it is. Run the course plugin's
**start** skill at the start of each week: it pulls the right spec from the
course API, carries your harness forward from last week, and helps you turn the
spec's checkable lines into tests of your own. Read the spec before you build,
and see `spec/README.md` for how the checks in this repo relate to it.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Before you push, run `pnpm check`. It runs most of what CI runs --- build,
  lint, and the spec --- so you catch those in seconds instead of waiting for
  the pipeline. The links check, the evidence check, the secrets scan, and the
  deploy itself only run in CI; run `pnpm dlx linkinator ./dist --silent`
  locally against a fresh `pnpm build` for the links check without waiting for
  CI.
- To see what the page actually looks like rather than what you assume it looks
  like, open it in a browser (the `agent-browser` CLI, documented on
  [the course site](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/backpressure/#agent-browser-the-rendered-page-as-ground-truth),
  works well for this). The rendered page is the truth; your mental model of it
  isn't.
- When a check fails, read its output before changing anything. Each check below
  names what it measures, and the failure message is the instruction: it tells
  you the file, the line, or the contract. Treat a red check as authoritative
  --- the page is wrong until the check is green, not until you decide it should
  be.
- Commit when the checks pass. Never commit a red state.

## The checks (your sensors)

CI runs these on every push once your repo is public. GitHub's checks UI shows
two jobs, `check` and `deploy` --- not one status per sensor below --- and
within `check` the steps run in sequence (`pnpm check` chains typecheck, build,
lint, and the spec with `&&`), so an early failure like a broken build stops the
later sensors from running for that push; fix it and push again to see the rest.
While the repo is private (all week, until you ship) the CI jobs stay skipped
--- `pnpm check` is the same roster on your machine, and it's the faster loop
anyway. They aren't hoops. Each is a different way of finding out something true
about the site that you can't reliably see by looking at it.

They also carry a mark at a crit: the sweep runs fifteen minutes after your
cutoff, and green checks there are worth half that week's shipped mark. Still
running counts as not green, so ship with time for CI to finish.

- **typecheck** --- `tsc --noEmit` runs first in `pnpm check`, so a type error
  stops the roster before the build even starts. The types are extra
  backpressure: a red here is the compiler telling you a claim in the code is
  false.
- **build** --- the site must build (`pnpm build`). A build failure means the
  deployed site is broken or stale, so nothing else matters until this is green.
- **deploy / online** --- the live GitHub Pages URL must load and return the
  page you expect. An asset that 404s on the deployed URL counts as broken even
  if it loads locally.
- **spec** --- `spec/invariants.test.ts` asserts what's true of any good
  website, whatever the week's brief asks; the tests you write for the week's
  own spec run alongside it (any `spec/*.test.ts`). A failure names the contract
  you haven't met yet.
- **lint** --- `stylelint` for CSS, `oxlint` for TypeScript. Flags code that's
  wrong, fragile, or non-idiomatic. Read the rule it names.
- **tests** --- any other tests you write, wherever you put them (co-located
  with your source is fine, not just `spec/`), must pass. Vitest picks up both
  this and the spec suite in one `vitest run`, the last step of `pnpm check`. A
  failing test is a claim about the site that's no longer true.
- **evidence** (`pnpm check:evidence`) --- checks your process evidence:
  `PROCESS.md`'s citations resolve to real commits, the current deliverable's
  exact reflection is in `reflections/` (worked out from this repo's name
  against the public course API), and your `CLAUDE.md` is present. Evidence
  gates the deploy --- `deploy` needs `check` to pass, so failing evidence
  blocks the deploy alongside everything else. See
  [Your process is part of the mark](#your-process-is-part-of-the-mark) below,
  and the course website's
  [assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
  for what counts as evidence.
- **links** --- internal links must resolve. A broken link is a dead end you
  didn't mean to ship.
- **secrets** --- the repo is scanned for committed credentials. Never put a
  key, token, or password in a tracked file. If one leaks, rotate it. A local
  pre-commit hook (`.githooks/pre-commit`, installed by `pnpm install`) also
  blocks any commit containing something shaped like an API key --- by the time
  CI sees a key it's already pushed, so the hook is the sensor that matters.

Nothing here measures **accessibility** or **performance** --- wiring those
sensors (`axe-core`, Lighthouse, or whatever you choose) is your work, and later
in the course the spec will ask you to show how you tested both. When you do,
read a green performance result honestly: it's a lab estimate from one run on a
CI machine, not proof the site is fast for real users.

## The stack is swappable

Out of the box this is plain HTML/CSS/TypeScript on Vite, and every `.html` file
in the repo is a page: add pages, link them, and the build picks them up with no
config. That's a default, not a rule (unless the week's spec says otherwise).
You can swap in Astro or any other static generator, because nothing in CI names
a tool --- the whole contract is:

- `pnpm build` emits the complete site into `dist/`
- the `package.json` scripts (`check`, `check:evidence`, `build`) keep working
- whatever lands in `dist/` still passes the invariants in `spec/`

Two things bite in a swap. The deployed site lives under a path
(`…github.io/<repo>/`), so configure your generator's base path --- this
template's Vite config uses relative asset URLs to sidestep that, but most
generators (Astro included) need `base` set explicitly, and getting it wrong
looks fine locally while every asset 404s on the live URL. And commit the
updated `pnpm-lock.yaml`: CI installs with `--frozen-lockfile`.

## Astro-specific traps

Learned the hard way while building last week's prototype — worth checking for
before they cost time again, in this stack or the next one that uses Astro:

- **`aspect-ratio` plus `max-height` on the same element can silently collapse
  its width.** If the element's width isn't otherwise constrained, the browser
  can size it from the height down through the ratio rather than the width up,
  leaving it far narrower than its container — a media box that looks squashed
  into part of its row is usually this, not a layout bug elsewhere. Give it an
  explicit `width: 100%` rather than relying on `aspect-ratio` alone to fill
  its container.
- **Whitespace right before a tag on the next line gets trimmed.** Text ending
  a line immediately before an opening tag on the following line (`word\n<a
  href="...">`) loses the space between them in the rendered HTML. Keep inline
  text and the tag that follows it on the same source line whenever the space
  between them matters.
- **`astro preview` and `astro dev` can end up on adjacent ports, and only one
  of them hot-reloads.** `astro preview` serves the already-built `dist/`
  folder as a static server with no watch/rebuild. If a port you're pointing a
  browser or screenshot tool at isn't reflecting a source edit, check which
  command actually owns it (`ps aux | grep astro`) before assuming the edit is
  wrong — it's more likely you need an explicit `pnpm build` first.
  **The port that answers may belong to a different repo entirely.** Asking for
  `--port 4321` when it's taken makes Astro silently take the next free port and
  print it; a stale preview of *last week's* prototype was still sitting on 4321
  and answering 200. Trust the port Astro prints, and confirm the process's own
  working directory (`ps aux | grep astro` shows the full path) rather than
  assuming a live server on the expected port is yours. Cheapest possible check
  before screenshotting anything: `curl -s <url> | grep -o '<title>[^<]*'`.
- **A `base` without a trailing slash breaks every link built by concatenation,
  and `astro dev`/`astro preview` can't show you this.** `import.meta.env.BASE_URL`
  is exactly the string you set in `astro.config.mjs`'s `base`, with no
  normalization — `base: "/repo"` plus a helper that does `` `${BASE}${path}` ``
  produces `/repomenu/`, not `/repo/menu/`. Set `base` with both a leading and
  trailing slash (`"/repo/"`), or make the join itself slash-safe, and check the
  actual `href` attributes in built output (`grep href dist/**/*.html`), not
  just that the pages load. It also breaks the CI links check a different way:
  `dist/` on disk has no subfolder matching `base`, so `linkinator ./dist`
  404s on every base-prefixed link whether or not it's well-formed — that step
  needs `--url-rewrite-search "/repo/" --url-rewrite-replace "/"` (unanchored;
  linkinator matches against the full crawled URL, host included, so a `^`
  anchor never fires) to map local paths back to what's actually on disk before
  checking them. This didn't surface until the ship-time CI run, because
  neither `pnpm check` nor a local dev server exercises the deployed base path
  or the links check.

## Running the checks

- **Never pipe a check into `tail`, `head`, or `grep` in a command whose exit
  code you then act on.** A pipeline's status is the *last* command's, so
  `pnpm check | tail -6 && git commit` commits whatever `tail` felt about
  life — which is always success. This put a red state into the history once
  already. Either redirect and inspect (`pnpm check > /tmp/check.log 2>&1; echo
  $?`) or `set -o pipefail` first.
- **The shell's working directory persists between tool calls.** A `cd /tmp` to
  run a screenshot tool leaves the *next* `pnpm build` looking for a
  `package.json` in `/tmp`. Prefer absolute paths over `cd`.

## Sensors: what the existing ones can't see

The roster in this repo checks a great deal and is silent about the rest.
Assume a green board means "nothing I have wired is broken", not "the thing is
right". Two gaps have bitten already:

- **Unit invariants over a single contact say nothing about whether the whole
  scenario is physical.** Every one of INV-1..INV-5 passed against a serve
  whose Magnus lift exceeded the ball's own weight — it floated the length of
  the table without ever bouncing — and against another that reached the
  receiver 11 cm *below* the playing surface. Each individual bounce and flight
  obeyed its contract; nothing asserted the composition was a legal serve. When
  the prototype composes verified pieces into a scenario, write the sensor that
  checks the scenario, and prove it fails by reverting the bug
  (`spec/serve.test.ts`, and `notes/evidence.md` for the red run).
- **Nothing sees inside a `<canvas>`.** `axe-core` audits the DOM, so a canvas
  is one node with whatever accessible name you gave it. Its `aria-label` has
  to be written and kept current by hand, and any state the drawing carries
  needs a text equivalent elsewhere in the DOM.

Accessibility and performance are still unwired as automated checks. `npx
agent-browser a11y` runs axe-core against the live page and found a real
contrast failure here that no other check could; it needs a running browser, so
it's a local step, not part of `pnpm check`. Note the CLI spells viewport
changes `agent-browser set viewport <w> <h>` — `open --viewport` is silently
ignored, and screenshots then lie about which breakpoint you're looking at.

## Your process is part of the mark

The deployed page is only half of it. How you got there is marked too: your
commit history, your agent files, and the decisions visible across them. The
checks above can't see any of that, so a person reads it directly --- which
means building legibly is part of building well.

- **Commit as you go.** Small, frequent commits are the record of how the work
  came together, and that record is read, not just the final state. A trail that
  grew alongside the code is the strongest evidence of your process; a single
  dump the night before is the weakest.
- **Keep a process overview** (`PROCESS.md`). A short reading-guide, not an
  essay: what you built, the moments that mattered --- each pointing at a
  commit, a `CLAUDE.md` change, or a prompt and the commit it produced --- and
  where to look in the history. It points a marker at the evidence; it doesn't
  stand in for it, and claims the history doesn't back don't count. The
  `PROCESS.md` in this repo is a template showing the shape and the citation
  format (link text the commit hash or range, target the commit or compare URL);
  `pnpm check:evidence` verifies your citations resolve to real commits before
  you ship. Markers follow those citations and don't trawl the repo for evidence
  you didn't cite.
- **Write your reflection in `reflections/`** --- a short markdown file in this
  repo, named for the deliverable it answers, so the number in the filename is
  the number in this repo's name (`crit-1.md` in `comp4020-crit1-<you>`,
  `assignment-1.md` in `comp4020-ass1-<you>`); `reflections/README.md` has the
  full rule. `pnpm check:evidence` checks the exact current name against the
  course API, not merely the presence of any well-named file. It answers the two
  standing prompts: the breakthrough that moved the work forward, and what this
  work changed about the developer you want to be. It stays out of the deployed
  site. It's due at the cutoff, and if it isn't in the repo by then the week
  doesn't count as shipped, however good the prototype is.
- **This file is process evidence.** The harness you build to direct the agent,
  this `CLAUDE.md` and any `AGENTS.md`, is itself read as part of how you
  worked. Keep it honest and current (see below).

You don't need a name, a student number, or any identity file in the repo: we
know whose repo it is. Spend the effort on the work.

## This file is yours

This CLAUDE.md is a starting point, not a fixed rulebook. As you learn what your
prototype needs --- a convention to hold the agent to, a sensor that keeps
catching you out, a fact about the stack the agent keeps getting wrong --- write
it down here. Growing this file is the work of harness engineering, and the gap
between this boilerplate and your own version is part of what your prototype
says about the developer you're becoming.
