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
