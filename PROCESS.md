# Process overview

## What I built

*The bat lied to you* — an interactive explainer of one claim: against a
backspin serve the bat has to be open, against topspin it has to be closed, and
the two answers barely overlap. Two sliders and a serve toggle drive a
deterministic simulation of the return in three acts: take the shot, see the
instant of contact, then see all 1,600 shots at once and watch the answer move
when the serve changes.

## The moments that mattered

**1. Writing the claim as a test that could fail.** The obvious order is to
build the simulation, then write the copy, then adjust numbers until the
animation agrees. I wrote the invariants first and left them red
([`69cd34f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-wuyimin362-sudo/commit/69cd34f)),
including INV-9: the bat-angle centroids of the two feasible regions must differ
by more than 15°. That is the page's argument in a form that can be false. It
went green at
[`f5bcbae`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-wuyimin362-sudo/commit/f5bcbae)
at 18.6°, and only because I changed serve parameters — never a threshold. The
frontier is tight and recorded: above ~150 rad/s of surviving backspin, nothing
clears INV-8's 5% floor, and the chosen preset sits at 5.27%.

**2. Every physics test passed while the physics was wrong — twice.** First, a
serve generated more Magnus lift than the ball weighed and floated the length of
the table without ever bouncing, while INV-1 to INV-5 stayed green: each checks
one contact, and none asks whether the whole scenario is physical. That became a
`CLAUDE.md` section on what the sensors structurally cannot see
([`07480e1`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-wuyimin362-sudo/commit/07480e1)).
Second, I had the ball as a solid sphere when it is a hollow shell —
`I = (2/3)mr²` — which shows up only in how much spin survives a bounce; that
became rule 4 ([`f630f54`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-wuyimin362-sudo/commit/f630f54)).
Re-prompting would have fixed either line. Then I deleted the whole first
prototype rather than patch around it
([`2b9484b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-wuyimin362-sudo/commit/2b9484b)) —
a `remove:` commit of its own, so the discard is visible rather than buried in a
feature diff.

**3. The page caught itself lying, twice.** Act 2 printed "leaves as backspin"
next to "magnus pushes it down", which contradict. The Magnus line is derived
from the force vector, so the *label* was wrong: I had written
`omega > 0 ? topspin : backspin`, correct for the incoming ball and backwards
for the outgoing one. It is now derived from the cross product and pinned
([`f51864e`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-wuyimin362-sudo/commit/f51864e)).
Act 3's closing line then claimed "no bat angle covers both serves" while the
readout underneath it counted 11 of 180 that do. The plan says the copy gives
way when the numbers disagree, so the sentence is now generated from the same
grid the picture is drawn from
([`78a0172`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-wuyimin362-sudo/commit/78a0172)).

**4. Measuring instead of reading.** I assumed the page degraded gracefully. It
did not: with JavaScript off it rendered 178 characters, and the `<noscript>`
block was itself empty because a script was filling it. Chrome's Slow 3G showed
9.1 s to first interaction from a module waterfall. Both fixed and pinned
([`1b8443b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-wuyimin362-sudo/commit/1b8443b)).

## Where to look

`notes/evidence.md` carries the raw output behind every number here — the red
runs, the calibration frontier, the request waterfalls, the axe-core reports.
