# Assignment 1 — reflection

## The breakthrough

The moment INV-9 went green, and what it took to get there.

INV-9 says the bat-angle centroids of the two feasible regions must differ by
more than 15°. That is not a test of my code — it is the sentence on the front
of the page, written so it can be false. An early search returned a 36° gap that
looked like a triumph, until I checked the incoming spin and found the ball
arriving at ω = −43 rad/s. The bounces had scrubbed the spin off, so the gap was
coming from the two serves arriving at different *speeds*. The test would have
passed and the page would still have been wrong.

That was the shift. Until then I used tests to find out whether code ran. Here I
had an instrument for whether my claim was true. It caught me twice more: the
contact diagram printed "leaves as backspin" beside "magnus pushes it down", and
the closing line said no bat angle covers both serves while the counter beneath
it said 11 of 180 do.

## What it changed

I had treated a green suite as evidence that things were fine. It is only
evidence about what I thought to measure. Every physics invariant passed while I
modelled a table tennis ball as a solid sphere, because each checked a single
contact and none asked whether the whole scenario was physical.

So the habit I want is narrower than "write tests": when I make a claim, write
the thing that would catch me if it were false, and prefer the version that
reads its number off the same computation the claim came from. My strongest
fixes here were not code — a rule in `CLAUDE.md`, and a section on what the
sensors structurally cannot see. I want to spend corrections there.
