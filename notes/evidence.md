# Raw evidence

Compiled by the agent. Raw tool output only — no narrative. PROCESS.md and reflections/ are written by hand.

## Baseline red state

Date: 2026-08-13
Commit: `e83b968` (working tree: src/lib/physics.ts + spec/physics.test.ts new, uncommitted at time of run)

### `pnpm test`

```
$ vitest run

 RUN  v4.1.10 /Users/yiminwu/comp4020/comp4020-ass1-wuyimin362-sudo

 ❯ spec/assignment-1.test.ts (4 tests | 4 failed) 5ms
     × is deterministic: the same input yields a bit-identical result 3ms
     × nets the default settings — 0° bat angle, +5° swing, against backspin 1ms
     × reaches IN somewhere in the control range, for both serve presets 1ms
     × needs a more open bat angle against backspin than against topspin, by more than 15° 0ms
 ❯ spec/physics.test.ts (9 tests | 9 failed) 6ms
     × omega > 0 (backspin, ball moving toward +x) produces an upward force 4ms
     × omega < 0 (topspin, ball moving toward +x) produces a downward force 0ms
     × range(backspin) > range(nospin) > range(topspin), same launch speed and angle 0ms
     × backspin (omega=+180) reduces |vx| after bounce 0ms
     × topspin (omega=-190) increases |vx| after bounce 0ms
     × strong enough backspin (omega=+400) reverses the direction of vx 0ms
     × total mechanical energy does not increase during free flight 0ms
     × kinetic energy after a table bounce does not exceed pre-bounce kinetic energy 0ms
     × the implied tangential impulse never exceeds mu_table times the normal impulse 0ms

⎯⎯⎯⎯⎯⎯ Failed Tests 13 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  spec/assignment-1.test.ts > second-ball return simulation > is deterministic: the same input yields a bit-identical result
Error: simulate() is not implemented yet
 ❯ simulate src/lib/simulate.ts:18:9
     16|   _swingDirectionDeg: number,
     17| ): ReturnOutcome {
     18|   throw new Error("simulate() is not implemented yet");
       |         ^
     19| }
     20|
 ❯ spec/assignment-1.test.ts:44:19

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/13]⎯

 FAIL  spec/assignment-1.test.ts > second-ball return simulation > nets the default settings — 0° bat angle, +5° swing, against backspin
Error: simulate() is not implemented yet
 ❯ simulate src/lib/simulate.ts:18:9
     16|   _swingDirectionDeg: number,
     17| ): ReturnOutcome {
     18|   throw new Error("simulate() is not implemented yet");
       |         ^
     19| }
     20|
 ❯ spec/assignment-1.test.ts:54:7

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/13]⎯

 FAIL  spec/assignment-1.test.ts > second-ball return simulation > reaches IN somewhere in the control range, for both serve presets
Error: simulate() is not implemented yet
 ❯ simulate src/lib/simulate.ts:18:9
     16|   _swingDirectionDeg: number,
     17| ): ReturnOutcome {
     18|   throw new Error("simulate() is not implemented yet");
       |         ^
     19| }
     20|
 ❯ inBatAngles spec/assignment-1.test.ts:30:11
 ❯ spec/assignment-1.test.ts:61:7

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/13]⎯

 FAIL  spec/assignment-1.test.ts > second-ball return simulation > needs a more open bat angle against backspin than against topspin, by more than 15°
Error: simulate() is not implemented yet
 ❯ simulate src/lib/simulate.ts:18:9
     16|   _swingDirectionDeg: number,
     17| ): ReturnOutcome {
     18|   throw new Error("simulate() is not implemented yet");
       |         ^
     19| }
     20|
 ❯ inBatAngles spec/assignment-1.test.ts:30:11
 ❯ spec/assignment-1.test.ts:71:35

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/13]⎯

 FAIL  spec/physics.test.ts > INV-1: Magnus force direction follows the cross-product convention > omega > 0 (backspin, ball moving toward +x) produces an upward force
Error: magnusForce() is not implemented yet
 ❯ magnusForce src/lib/physics.ts:27:9
     25| // see spec/physics.test.ts INV-1.
     26| export function magnusForce(_v: Vec2, _omega: number): Vec2 {
     27|   throw new Error("magnusForce() is not implemented yet");
       |         ^
     28| }
     29|
 ❯ spec/physics.test.ts:21:15

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/13]⎯

 FAIL  spec/physics.test.ts > INV-1: Magnus force direction follows the cross-product convention > omega < 0 (topspin, ball moving toward +x) produces a downward force
Error: magnusForce() is not implemented yet
 ❯ magnusForce src/lib/physics.ts:27:9
     25| // see spec/physics.test.ts INV-1.
     26| export function magnusForce(_v: Vec2, _omega: number): Vec2 {
     27|   throw new Error("magnusForce() is not implemented yet");
       |         ^
     28| }
     29|
 ❯ spec/physics.test.ts:26:15

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/13]⎯

 FAIL  spec/physics.test.ts > INV-2: spin changes free-flight range in the expected order > range(backspin) > range(nospin) > range(topspin), same launch speed and angle
Error: simulateFlight() is not implemented yet
 ❯ simulateFlight src/lib/physics.ts:39:9
     37|
     38| export function simulateFlight(_initial: BallState, _steps: number): B…
     39|   throw new Error("simulateFlight() is not implemented yet");
       |         ^
     40| }
     41|
 ❯ spec/physics.test.ts:46:36

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/13]⎯

 FAIL  spec/physics.test.ts > INV-3: table bounce couples spin into horizontal velocity > backspin (omega=+180) reduces |vx| after bounce
Error: tableBounce() is not implemented yet
 ❯ tableBounce src/lib/physics.ts:43:9
     41|
     42| export function tableBounce(_state: BallState): BallState {
     43|   throw new Error("tableBounce() is not implemented yet");
       |         ^
     44| }
     45|
 ❯ spec/physics.test.ts:64:19

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/13]⎯

 FAIL  spec/physics.test.ts > INV-3: table bounce couples spin into horizontal velocity > topspin (omega=-190) increases |vx| after bounce
Error: tableBounce() is not implemented yet
 ❯ tableBounce src/lib/physics.ts:43:9
     41|
     42| export function tableBounce(_state: BallState): BallState {
     43|   throw new Error("tableBounce() is not implemented yet");
       |         ^
     44| }
     45|
 ❯ spec/physics.test.ts:70:19

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/13]⎯

 FAIL  spec/physics.test.ts > INV-3: table bounce couples spin into horizontal velocity > strong enough backspin (omega=+400) reverses the direction of vx
Error: tableBounce() is not implemented yet
 ❯ tableBounce src/lib/physics.ts:43:9
     41|
     42| export function tableBounce(_state: BallState): BallState {
     43|   throw new Error("tableBounce() is not implemented yet");
       |         ^
     44| }
     45|
 ❯ spec/physics.test.ts:76:19

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/13]⎯

 FAIL  spec/physics.test.ts > INV-4: energy bookkeeping > total mechanical energy does not increase during free flight
Error: simulateFlight() is not implemented yet
 ❯ simulateFlight src/lib/physics.ts:39:9
     37|
     38| export function simulateFlight(_initial: BallState, _steps: number): B…
     39|   throw new Error("simulateFlight() is not implemented yet");
       |         ^
     40| }
     41|
 ❯ spec/physics.test.ts:89:24

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/13]⎯

 FAIL  spec/physics.test.ts > INV-4: energy bookkeeping > kinetic energy after a table bounce does not exceed pre-bounce kinetic energy
Error: tableBounce() is not implemented yet
 ❯ tableBounce src/lib/physics.ts:43:9
     41|
     42| export function tableBounce(_state: BallState): BallState {
     43|   throw new Error("tableBounce() is not implemented yet");
       |         ^
     44| }
     45|
 ❯ spec/physics.test.ts:99:19

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/13]⎯

 FAIL  spec/physics.test.ts > INV-5: table bounce respects the Coulomb friction bound > the implied tangential impulse never exceeds mu_table times the normal impulse
Error: tableBounce() is not implemented yet
 ❯ tableBounce src/lib/physics.ts:43:9
     41|
     42| export function tableBounce(_state: BallState): BallState {
     43|   throw new Error("tableBounce() is not implemented yet");
       |         ^
     44| }
     45|
 ❯ spec/physics.test.ts:113:21

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/13]⎯


 Test Files  2 failed | 3 passed (5)
      Tests  13 failed | 16 passed (29)
   Start at  11:49:13
   Duration  665ms (transform 167ms, setup 0ms, import 1.21s, tests 409ms, environment 0ms)

[ELIFECYCLE] Test failed. See above for more details.
```

## INV-1..INV-5 green

Date: 2026-08-13
Working tree: `src/lib/physics.ts` implemented; `src/lib/simulate.ts` still a stub.

### `pnpm exec vitest run spec/physics.test.ts --reporter=verbose`

```
 ✓ INV-1 ... omega > 0 (backspin, ball moving toward +x) produces an upward force
 ✓ INV-1 ... omega < 0 (topspin, ball moving toward +x) produces a downward force
 ✓ INV-2 ... range(backspin) > range(nospin) > range(topspin), same launch speed and angle
 ✓ INV-3 ... backspin (omega=+180) reduces |vx| after bounce
 ✓ INV-3 ... topspin (omega=-190) increases |vx| after bounce
 ✓ INV-3 ... strong enough backspin (omega=+400) reverses the direction of vx
 ✓ INV-4 ... total mechanical energy does not increase during free flight
 ✓ INV-4 ... kinetic energy after a table bounce does not exceed pre-bounce kinetic energy
 ✓ INV-5 ... the implied tangential impulse never exceeds mu_table times the normal impulse

 Test Files  1 passed (1)
      Tests  9 passed (9)
```

## The serve sensor catches what the physics invariants cannot

Date: 2026-08-13

Two bad serves passed every check in the repo: one whose Magnus lift exceeded
the ball's weight (floated the length of the table, never bounced), and one
that arrived 0.11 m below the playing surface. INV-1..INV-5 are all about a
single contact or a single flight, so none of them can see it.

Deliberately reverting `MAGNUS_COEFFICIENT` from 0.12 back to 0.5 and running
both files — `spec/physics.test.ts` stays **fully green**, `spec/serve.test.ts`
goes red and names the bugs:

```
$ pnpm exec vitest run spec/physics.test.ts spec/serve.test.ts

 FAIL  spec/serve.test.ts > the backspin serve is legal > bounces on the server's half first, then the receiver's half
AssertionError: second bounce is past the end of the table: expected 2.907881665534729 to be less than 2.74

 FAIL  spec/serve.test.ts > the topspin serve is legal > bounces exactly twice before reaching the receiver
expected one bounce per half, got 3

 FAIL  spec/serve.test.ts > the topspin serve is legal > clears the net on the way over
AssertionError: expected 0.06647844301218163 to be greater than 0.1725

 FAIL  spec/serve.test.ts > the topspin serve is legal > reaches the bat above the table, not through it
AssertionError: the ball arrives below the playing surface — there is nothing to hit: expected -0.10985149600606177 to be greater than 0.02

 FAIL  spec/serve.test.ts > the two serves are a controlled comparison > presents the ball to the bat at the same height
AssertionError: expected 0.29028649768509673 to be less than 0.03

 Test Files  1 failed | 1 passed (2)
      Tests  6 failed | 16 passed (22)
```

Restored to 0.12: 13 passed (13).

## The measured solution map

`notes/probe.ts`, with the tuned presets. `#` = IN, `.` = NET, `o` = OUT;
rows are bat angle, columns swing direction.

```
backspin contact: y=0.088 vx=3.24 omega=+702   topspin contact: y=0.086 vx=3.92 omega=-652

=== backspin ===                        === topspin ===
 -30 .............................       -30 .............................
   0 .............................       -15 .......................####..
  20 .............................       -10 .................############
  25 ..............#oooooooo####..         0 ooooooooooooooooooooooooooooo
  40 .........##oooooooooooooooooo        25 ###oooooooooooooooooooooooooo
  55 ..........##ooooooooooooooooo        40 .......###ooooooooooooooooooo
  70 ..............##ooooooooooooo        50 ................###########..

backspin centroid 44.1°, topspin centroid 21.5°, gap 22.6° (contract: > 15)
default (backspin, 0, 5) => {"outcome":"NET"} (contract: NET)
```

## Commit map

| commit | what landed |
| --- | --- |
| `e83b968` | `spec/assignment-1.test.ts` — the return contract, red on purpose |
| `6770a80` | `spec/physics.test.ts` — INV-1..INV-5, red on purpose |
| `508d21c` | `src/lib/physics.ts` — INV-1..INV-5 green |
| `b48821f` | `src/lib/simulate.ts` green; `MAGNUS_COEFFICIENT` 0.5 → 0.12; `SWING_SPEED_MPS` 7.0 → 4.5; serve presets searched; `spec/serve.test.ts` added |
| `cccb124` | the page: side view, controls, solution map, `spec/thesis.test.ts` |
| `a2266e9` | contrast fix, screen-reader phrasing, off-frame end markers |
| `07480e1` | `CLAUDE.md` — pipefail, stale-port, and scenario-sensor rules |

Baseline red state (13 failing) is at the top of this file; the run that proves
`spec/serve.test.ts` catches what INV-1..INV-5 cannot is above.

## Measured numbers behind the page's claims

`notes/overlap.ts`, 2° grid over the full control range (3,621 settings each):

```
backspin IN: 134   topspin IN: 254   both: 9
share of backspin solutions that also return topspin: 6.7%
bat-angle centroid: backspin 44.3°, topspin 24.1°, gap 20.2°
```

At the 5° grid `spec/assignment-1.test.ts` uses, the centroid gap is 22.6°
against a contract of > 15°. The page renders the 134/9 figure live from the
same simulation; `spec/thesis.test.ts` fails if the shared fraction ever
exceeds one in ten.

Contact states the two serves deliver to the bat (`notes/probe.ts`):

```
backspin  y=0.088 m  vx=3.24 m/s  omega=+702 rad/s  (112 rev/s)
topspin   y=0.086 m  vx=3.92 m/s  omega=-652 rad/s  (104 rev/s)
```

## Rendered-page verification

Chrome via `agent-browser`, against the built site on `astro preview`.

### axe-core, before

```
$ npx agent-browser a11y
axe-core: 4.12.1  violations: 1  incomplete: 0  passes: 40
[serious] color-contrast: Elements must meet minimum color contrast ratio thresholds (8 nodes)
  - #bat-angle-hint
  - .slider:nth-child(2) > .scale > span:nth-child(1)
  - .slider:nth-child(2) > .scale > span:nth-child(2)
  - #swing-direction-hint
  - .slider:nth-child(3) > .scale > span:nth-child(1)
  - .slider:nth-child(3) > .scale > span:nth-child(2)
  - .axis-label
  - .footer-note
```

### axe-core, after (`--ink-faint` #6b7383 → #7c8497)

```
$ npx agent-browser a11y
axe-core: 4.12.1  violations: 0  incomplete: 0  passes: 40
```

### Keyboard

```
tab order:  A.skip "Skip to the simulation" → nav "Bat angle" → "The shot"
            → "Every shot" → "Why" → INPUT (serve radio) → INPUT#bat-angle
            → INPUT#swing-direction

25 × ArrowRight on #bat-angle:
  "bat=25 outcome=NET live=Against the backspin serve, ..."

ArrowRight on the serve radio group:
  "serve=topspin checked=topspin outcome=OUT"
```

### Resize mid-interaction (bat angle left at 42°)

```
at 390:   bat=42 out=OUT tblCss=332x170  tblBuf=332x170  mapCss=358x236  overflow=false
at 1920:  bat=42 out=OUT tblCss=1058x269 tblBuf=1058x269 mapCss=635x330  overflow=false
at 768:   bat=42 out=OUT tblCss=681x173  tblBuf=681x173  mapCss=707x330  overflow=false
```

### Internal links

```
$ pnpm dlx linkinator ./dist --silent \
    --url-rewrite-search "/comp4020-ass1-wuyimin362-sudo/" --url-rewrite-replace "/"
[404] https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-wuyimin362-sudo
ERROR: Detected 1 broken links. Scanned 5 links in 0.481 seconds.
```

The only failure is the page's own source-repo link, 404 because the repo is
still private. The URL matches `git remote -v` exactly. CI's `check` job is
gated on `!github.event.repository.private`, so it only ever runs once the repo
is public, at which point the link resolves. Re-run after shipping to confirm.

### Stale preview server

```
$ ps aux | grep astro
86287 .../comp4020-crit2-wuyimin362-sudo/.../astro.mjs preview --port 4321
94646 .../comp4020-ass1-wuyimin362-sudo/.../astro.mjs preview --port 4321   (took 4324)

$ curl -s localhost:4321/comp4020-ass1-wuyimin362-sudo/ | grep -o '<title>[^<]*'
<title>COMP4020 prototype          ← last week's repo
$ curl -s localhost:4324/comp4020-ass1-wuyimin362-sudo/ | grep -o '<title>[^<]*'
<title>Spin tells your bat where to point
```

## Phase 1/2 restart against the execution plan — baseline red

Date: 2026-08-13
The execution plan (`COMP4020-A1-execution-plan.md`) surfaced after the first
build. Its sections 2, 4, 5 and 6 are non-negotiable and the first build
violated several. Restarting the simulation layer against the contract.

`test/invariants.test.js` (INV-1..INV-11, INV-13) and `test/purity.test.js`
(INV-12) written first, against a `src/physics.js` and `src/solver.js` that do
not exist yet.

### `node --test test/`

```
Error: Cannot find module '/Users/yiminwu/comp4020/comp4020-ass1-wuyimin362-sudo/test'
  code: 'MODULE_NOT_FOUND'

ℹ tests 1
ℹ pass 0
ℹ fail 1
```

(That message is the runner, not the contract: `node --test test/` resolves the
positional argument as a module rather than a directory on Node 24. The working
invocation is `node --test "test/*.test.js"`, which is what `pnpm test:unit`
runs. Recorded because the first reading of this output was wrong — it looked
like the missing `src/physics.js` and was actually the path.)

Not yet wired into `pnpm check`: the course harness forbids committing a red
board, and the plan wants the red state visible in history. Committing the
tests red but unwired satisfies both; `pnpm check` stays green and the wiring
lands with the implementation.

### What the first build got wrong, measured against section 4

| plan | first build | consequence |
| --- | --- | --- |
| `I = (2/3)mr²` hollow shell | `(2/5)mr²` solid | too little spin survives a bounce |
| rolling impulse `2m\|u\|/5` | `2m\|u\|/7` | same |
| `C_L = min(0.33, 1.5·S)` | `0.24·S`, uncapped | lift exceeded the ball's weight at serve spins |
| `e_bat = 0.55` | `0.85` | returns far too fast |
| `mu_bat = 0.90` | `1.00` | over-grippy |
| swing `7.0 m/s` | `4.5 m/s` | changed to widen the answer band |
| net at `x = 0`, table `[-1.37, 1.37]` | net at `x = 1.37`, table `[0, 2.74]` | — |
| contact at the bounce apex | fixed plane `x = 3.0` | — |

INV-8 also fails under the first build's numbers: the backspin feasible region
was 134/3621 = 3.70%, against a required > 5%.

## Phase 2 — INV-1..INV-13 green against the section 4 contract

Date: 2026-08-13

```
$ pnpm test:unit          # node --test "test/*.test.js"
ℹ tests 24
ℹ pass 24
ℹ fail 0

$ pnpm check
check exit=0
 Test Files  5 passed (5)      # vitest, spec/ only
      Tests  36 passed (36)
```

### Three things the contract did not survive contact with

**1. The return's first table touch was being bounced, not classified.**
`advance()` applies the table bounce, which the serve trace needs. Reusing it
for the return left every landing ball with `vy > 0`, so the landing test never
fired and every shot that should have been IN sailed on to become OUT. The
feasible area was *exactly* 0% for all 108 candidate serves — the giveaway was
that it was zero rather than merely small.

**2. Section 4.8's serve presets are not legal serves under section 4's
physics.** `v = (-6.5, 1.2)` from `y = 0.30` never bounces at all: it crosses
the receiver's end line still 0.27 m in the air. Rejection census over a
2,160-launch sweep (`notes/diagnose.js`):

```
=== backspin: 53 legal ===
    135  no contact point (0 bounce(s) at [])
     35  clipped the net (0.078)
     27  first bounce off server half (-0.15)
```

**3. INV-4's literal wording is not a valid bound.** "kinetic energy after <=
before + the bat's kinetic energy" fails against correct physics at
`theta=-30, phi=-60`: the ball leaves with 0.175 J against a literal ceiling of
0.089 J, because a ball rebounding off an approaching surface can leave at up
to `2*v_bat + e*v_ball`. Replaced with the rigorous form of the same intent —
total energy in the bat's rest frame, rotation included, cannot rise — which is
strictly stronger and holds across 150 (theta, phi, omega) combinations.

### Calibration frontier

Serve presets were searched against the invariants themselves
(`notes/calibrate.js`), not against how a trajectory looks. The binding
constraint is INV-8's 5% feasible-area floor against how much spin still has to
be on the ball for section 2.1's argument to be about spin at all:

```
contact-spin floor   best backspin feasible area   pairs passing INV-7/8/9/10
        0 rad/s               7.1%                        1011
      100 rad/s               6.4%                         451
      150 rad/s               4.6%                           0
      300 rad/s               4.6%                           0
```

Above roughly 150 rad/s of surviving backspin, nothing clears 5%. An early
candidate reached a 36.2 deg gap but arrived at `omega = -43` — the bounces
having scrubbed the spin off — so the gap was being produced by the two serves'
arrival *speeds*, not by spin. That satisfies INV-9 while making the page's
argument false, so contact spin became a search constraint.

A second candidate cleared the net by 0.5 mm (`netCrossY = 0.1530` against a
0.1525 m net). Requiring 1 cm of clearance costs nothing measurable.

### Chosen presets

Both serves are struck with the *same* launch velocity; only the height and the
spin differ.

```
backspin  launch { x: 1.5, y: 0.28, vx: -6.4, vy: -1.6 }  spin 240 rad/s
          bounces 0.61, -1.30   net crossing y=0.167
          contact x=-1.77 y=0.105 vx=-2.95 omega=-104  (17 rev/s)

topspin   launch { x: 1.5, y: 0.36, vx: -6.4, vy: -1.6 }  spin 160 rad/s
          bounces 0.63, -1.20   net crossing y=0.241
          contact x=-1.84 y=0.153 vx=-3.83 omega=+204  (32 rev/s)

INV-7   default (backspin, 0, +5) -> NET
INV-8   backspin area 5.27%   topspin area 6.66%      (floor 5%)
INV-9   centroid 30.8 vs 12.1 deg, gap 18.6 deg       (floor 15)
INV-10  IoU 0.051                                     (ceiling 0.25)
        backspin theta band 4..70, topspin -14..58
```

INV-8 has 0.27 percentage points of headroom, and 5.3% is the most the 2 deg
grid yields anywhere in the searched space. Any change to a coefficient has to
re-check it — this is the invariant that will go red first.

## Phase 3 — rendering

Date: 2026-08-13. Screenshots: `notes/shots/phase3-1440.png`, `phase3-390.png`.

### Resize mid-interaction (section 6.2), sliders left at 8 deg / 25 deg

```
390:   bat=8 swing=25 outcome=in  canvas 332x110  buffer 332x110  overflow=false
1440:  bat=8 swing=25 outcome=in  canvas 998x186  buffer 998x186  overflow=false
320:   bat=8 swing=25 outcome=in  canvas 262x110  buffer 262x110  overflow=false
back:  bat=8 swing=25 outcome=in  canvas 998x186  buffer 998x186  overflow=false
```

Slider values, act state and the computed trajectory survive; only the
metres-to-pixels mapping is recomputed.

### The strobe had to become adaptive

At 8 ms a ball at 5 m/s moves 4 cm, which is 3.7 px on a 332 px phone — under
the 4 px ghost radius, so the trail fused into a smear and stopped being a
strobe at all. The interval now steps up in whole multiples of 8 ms until the
ghosts separate, and the legend prints what was actually drawn:

```
1440 px: "one ball every 8 ms — wide gaps are fast"
 390 px: "one ball every 16 ms — wide gaps are fast"
```

Equal time between balls is the part that encodes speed, so multiplying the
interval keeps the reading intact where shrinking the ghosts would not.

### Two rendering decisions worth recording

The scene-to-pixel mapping is **isotropic**, and with the strobe it has to be:
the ghosts are circles with the spin marker riding the rim, so any vertical
exaggeration would turn them into ellipses and destroy the rotation reading in
exactly the frames that matter. An earlier build of this prototype stretched
heights 1.6x to make the net legible; that option is closed now, and the net is
carried by drawing weight instead.

First pass drew the serve and the return at similar weight and they were
indistinguishable where they crossed. The serve is context: half-size ghosts,
0.16 alpha, no spin marker. The return keeps full weight and the red marker
throughout, and a failed one drains towards `--fail` rather than turning red —
section 7's "失败态不是红色，是褪色".

The default shot buries into the receiver's own half about 30 cm from the bat,
so a fade alone was indistinguishable from nothing happening. A faded tick
marks where it died.

## Act 2 — the contact, drawn from the numbers the simulation used

Date: 2026-08-13. Screenshots: `notes/shots/act2-1440.png`, `act2-390.png`.

`applyImpulse()` is now a one-line wrapper over `contactDetail()`, which
returns the normal, the tangent, the slip, both impulses and whether friction
was sliding or gripping. Act 2 reads that object. The direction of the
dependency is the point: a diagram that re-derives its own vectors is an
illustration, not an explanation, and can drift.

### The diagram caught a bug in its own labelling

The first render printed, for the default shot:

```
leaves as      backspin 10 rev/s at 12.4 m/s
in flight      magnus pushes it down
```

Those contradict — backspin lifts. The Magnus line is derived from the actual
force vector, so it was right and the spin *name* was wrong. The label was
written `omega > 0 ? "topspin" : "backspin"`, which is correct for the incoming
ball and backwards for the outgoing one: the serve travels -x and the return
travels +x, so the same sign of omega means opposite spins. Exactly the
hand-written sign rule 3 exists to forbid.

Fixed with `spinNameFor(omega, vx)`, which asks the cross product which way the
Magnus force points and names the spin from that. Pinned by three new
assertions in `test/invariants.test.js` — 24 tests to 27.

### The vectors track both sliders and the serve toggle (section 2.3)

```
backspin, vertical bat (the default):
  surface sweeping upwards at 1.5 m/s, so friction throws it downwards
  comes in backspin 17 rev/s | slip 1.5 up | gripping 1.6 mN·s
  leaves as topspin 10 rev/s at 12.4 m/s | magnus pushes it down

backspin, open bat + brush up (lands):
  slip drops to 0.4 m/s | gripping 0.5 mN·s
  leaves as topspin 14 rev/s at 12.0 m/s | magnus pushes it down

backspin, closed bat + chop:
  slip 3.8 m/s upwards | gripping 4.1 mN·s
  leaves as backspin 2 rev/s at 11.6 m/s | magnus lifts it

topspin serve, vertical bat:
  surface sweeping downwards at 4.7 m/s, so friction throws it upwards
  comes in topspin 32 rev/s | slip 4.7 down | gripping 5.1 mN·s
  leaves as backspin 10 rev/s at 13.1 m/s | magnus lifts it
```

The last case is the mirror of the first, which is section 2.1's argument
stated in the mechanism rather than in prose.

### Numbers moved out of the canvas

First pass drew the readings as floating canvas labels next to each arrow.
They collided with the ball and with each other at most slider positions. They
are now a `<dl>` beside the diagram: no collisions, and a screen reader gets
them for free.

### axe-core, after the act 2 markup landed

```
violations: 1  [serious] color-contrast, 7 nodes
  .eyebrow, #bat-angle-hint, #swing-direction-hint,
  the four .scale span labels
```

Cause: nested opacity multiplies. A `.hint` at 0.75 inside a label at 0.6 lands
at 0.45, which measures 4.00:1 on `--table-lo` — under AA. `--rubber` as text
is 2.85:1. Replaced opacity-based text tones with measured colour tokens
(`--text-dim` 6.47:1, `--text-faint` 5.54:1, `--rubber-text` 5.01:1); `--rubber`
stays for graphics only.

```
violations: 0  incomplete: 0  passes: 38
```

## Act 3 — the solution space and the flip

Date: 2026-08-13. Screenshots: `notes/shots/act3-1440.png`, `act3-390.png`.

Bat angle horizontal, swing direction vertical, per section 2.3. The lit region
is where the ball lands; `--rubber` is spent only on the cursor, which is the
"current operation" section 7 reserves it for.

### Resolution: P0 exceeded without section 9's Web Worker

Measured scan cost:

```
20x20 =  400 cells:  19 ms
40x40 = 1600 cells:  43 ms
60x60 = 3600 cells:  92 ms
```

Section 9 sets P0 at 20x20 precomputed and P1 at 40x40 in a Web Worker. At
43 ms the worker's job — keeping the main thread free — is done by filling a
slice per animation frame, without a second file or a message protocol. Both
presets are warmed in the background so the flip is instant. INV-11 still pins
the 3 s ceiling.

### The closing claim was false, and the map said so

The first draft read: *"there is no bat angle that covers both serves."* The
readout directly beneath it said **11 of 180**. The two answers overlap at the
edges; they do not miss each other entirely, and the bat-angle bands overlap a
long way (6–70 against −15–57).

Section 2.1 says the copy gives way when the numbers disagree with it. The
sentence is now generated from the same grid the picture is drawn from:

```
11 of the 180 settings that return either serve return both — 6%. that is why
reading the spin is not a refinement you add once your technique is good. it is
the first thing you do, on every ball, before you have decided anything else.
```

### The flip (section 2.3's payoff)

```
backspin:  only bat angles between   6° and 70° return the ball at all
topspin:   only bat angles between -15° and 57° return the ball at all
settings that do both: 11 of 180
```

Toggling swaps the lit region with the ghost of the other serve's answer, which
is what the act exists to show. The ghost is a checkbox so the two can also be
seen at once rather than only by toggling and remembering.

### Section 6.5's 80 KB budget fired, and was fixed without deleting reasoning

```
built dist/ — 84.3 KB uncompressed (budget 80 KB)
✗ over the 80 KB budget by 4.3 KB
```

38% of the source is comments — 26.6 KB — and they are the reasoning, so
deleting them to save bytes would be deleting the evidence. The build now
strips comments on the way into `dist/` and leaves the source alone. Still no
bundler and no transpiler: what ships is the same plain ES modules.

```
built dist/ — 58.7 KB uncompressed (budget 80 KB), 7 modules checked
```

That transformation sits between what is tested and what is deployed, so it has
its own checks: every emitted module is parsed with `node --check` during the
build, and `test/build.test.js` asserts the stripper never touches code (a `//`
inside a string, a trailing comment) and that `dist/src/solver.js` returns
identical results to `src/solver.js` across eight settings. 27 tests to 33.

### Verified in Chrome

```
axe-core: violations 0, passes 38
map drag sets both sliders: bat=0 swing=37 from a pointer at 35%/30%
390 px: no horizontal overflow, map 332x240
```

## Phase 5 — hardening against section 6

Date: 2026-08-13. All measurements against `dist/`, which is what deploys.

### The page was blank without JavaScript

Section 3 keeps every string in `src/copy.js` and `main.js` writes them into the
markup. Measured, that left a no-JS visitor **178 characters** — no headline, no
explanation — and the `<noscript>` block was itself empty, because it was being
filled by the script it exists to substitute for.

The build now writes the copy into the emitted HTML, keeping one source of
truth. Same page, JavaScript disabled: **1836 characters**, plus a real
fallback with an inline SVG showing the two bat angles. Pinned by three
assertions in `test/build.test.js`, including one that fails if the emitted HTML
ever references an external URL.

### Keyboard (section 6.1)

```
skip link → nav ×4 → serve radio → #bat-angle → #swing-direction
→ #show-ghost → (wraps)

focus rings:  #bat-angle        outline 2px solid rgb(237,241,238)
              #swing-direction  outline 2px solid rgb(237,241,238)
              #show-ghost       outline 2px solid rgb(237,241,238)
```

Tab order matches visual order and reaches every control. Nothing on the page
is pointer-only: dragging the solution map sets the same two sliders.

### Resize mid-interaction (section 6.2)

Bat 34°, swing −18°, topspin serve, outcome "out" — held across every width:

```
1440:  table 998x186  contact 569x240  map 544x380  overflow=false
 320:  table 262x110  contact 262x240  map 262x240  overflow=false
 390:  table 332x110  contact 332x240  map 332x240  overflow=false
1920:  table 998x186  contact 569x240  map 544x380  overflow=false
back:  table 998x186  contact 569x240  map 544x380  overflow=false
```

### Announcements (section 6.3)

A 12-step slider drag produced **no** writes to the live region; one landed
after it settled. The 150 ms debounce is doing its job rather than reading out
every pixel.

### Touch (section 6.4)

```
bat-angle:        touch-action none, height 44px
swing-direction:  touch-action none, height 44px
serve radios:     min-height 44px
```

`touch-action: none` is on the sliders only, so dragging one does not scroll
the page and the rest of the page still scrolls normally.

### Reduced motion (section 6.6)

Nothing in `styles.css` transitions or animates, and the trajectory is always
drawn complete — the reduced-motion behaviour is simply how the page works, as
section 6.6 intends. The one remaining motion was the solution map filling in a
slice per frame; under `prefers-reduced-motion: reduce` both maps are now
computed in a single pass instead. Verified with the media feature emulated:
map summary and closing claim both render, no errors.

### Slow 3G (section 6.5) — and where the 3 s target stands

Chrome's own Slow 3G preset driven over CDP (2000 ms latency, 51,200 B/s):

```
before: first text 2163 ms, interactive 9144 ms
```

The cause was a module waterfall — plain ES modules are discovered by parsing,
so the browser fetched `main.js`, read its imports, fetched those, read theirs.
Request-level proof, before the fix:

```
sent   recv   resource
   0   2024   /
2053   4072   styles.css
2054   4599   src/main.js      ← imports discovered only after this arrived
```

`index.html` now declares all seven modules with `modulepreload`, and a test
fails if a module is added to `src/` without being listed. After:

```
sent   recv   resource
   0   2024   /
2053   4072   styles.css
2054   4485   src/contact.js
2054   4599   src/main.js
2054   6562   src/copy.js
2054   6797   src/map.js
2054   6829   src/physics.js
2054   8730   src/render.js
2054   8906   src/solver.js
```

**Every subresource is now requested at 2054 ms.** The waterfall is gone at the
request level, which was the fixable part. The staggered *arrivals* are the
local dev server: HTTP/1.1 with roughly three usable connections, each request
paying the emulated 2000 ms. GitHub Pages serves HTTP/2, where all eight
multiplex on one connection and pay the round trip once — so this local figure
overstates the deployed one and the real number has to be measured against the
live URL.

Section 12 asks for interactive within 3 s on Slow 3G. With a 2000 ms round
trip that needs the whole page in **one** request: the document alone costs
2.0 s, and 62.7 KB at 51,200 B/s is another 1.2 s, so even a fully inlined page
lands near 3.2 s. Two round trips — document, then subresources — is 4 s before
any bytes move. Flagged rather than quietly missed.

### Section 12 mechanical checks

```
external resources in built HTML: 0
dist size:                        62.7 KB  (budget 80 KB)
shipped modules:                  7, all parsed with node --check at build
pnpm check:                       exit 0, 37 tests
```
