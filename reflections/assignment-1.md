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

Almost none of this was typed by me, which made it very clear where my actual
work was. Re-prompting fixed lines; it never fixed the same mistake twice. The
corrections that held were the ones that changed what the work had to satisfy —
the hollow-shell rule in `CLAUDE.md`, the invariant that made my argument
falsifiable, the sensor for whether the serve was even legal.

So the skill I want is not writing more code faster. It is being able to see,
when something breaks, whether the fix belongs in the output or in the standard
the output is judged against.
