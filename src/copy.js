/**
 * Every string the page shows, in one place so the wording can be reviewed as
 * writing rather than hunted through markup (execution plan section 3).
 *
 * House style, section 7: sentences start lowercase, verbs are plain, buttons
 * say what pressing them does, and a failure gives a direction rather than an
 * emotion.
 */

export const COPY = Object.freeze({
  title: "the bat lied to you",
  tagline: "table tennis, from the receiving end",

  headline: "the right answer feels wrong",

  standfirst:
    "a backspin serve is diving toward the table. every instinct says close the bat and " +
    "push it flat. do that and it goes into the net — and the harder you push, the harder " +
    "it goes in. the angle that works is the one that looks like it should send the ball " +
    "over the ceiling.",

  actOne: {
    heading: "return the serve",
    lede:
      "the serve has bounced on your half and is at the top of its bounce. you set two " +
      "things: how far the face is tilted back, and which way you swing. how hard you " +
      "swing is fixed.",
  },

  actTwo: {
    heading: "why the angle has to move",
    lede:
      "the same two sliders, at the moment of contact. the ball's surface is already " +
      "moving before it touches the rubber, because it is spinning — and the rubber grips " +
      "that surface and pushes back the other way.",
    caption:
      "every arrow here is read out of the same impulse the trajectory above was built " +
      "from, not drawn to illustrate it.",
  },

  actThree: {
    heading: "every shot at once",
    lede:
      "every bat angle against every swing direction, played out and coloured by where the " +
      "ball ended up. the lit region is where it lands. now change the serve and watch the " +
      "lit region move.",
    ghostToggle: "show the other serve's answer",
    /**
     * Written from the map's own count rather than asserted.
     *
     * The first draft of this line read "there is no bat angle that covers
     * both serves". The map underneath it said 11 of 180 settings do — the
     * two answers overlap at the edges, they do not miss each other entirely.
     * Section 2.1 says the copy gives way when the numbers disagree with it,
     * so the number is now read out of the same grid the picture is drawn
     * from and the sentence cannot drift again.
     *
     * @param {{ shared: number, union: number }} counts
     */
    closing: ({ shared, union }) =>
      `${shared} of the ${union} settings that return either serve return both — ` +
      `${Math.round((100 * shared) / union)}%. that is why reading the spin is not a ` +
      `refinement you add once your technique is good. it is the first thing you do, on ` +
      `every ball, before you have decided anything else.`,
  },

  controls: {
    serve: "the serve coming at you",
    backspin: "backspin",
    topspin: "topspin",
    batAngle: "bat angle",
    batAngleLow: "closed, over the ball",
    batAngleHigh: "open, face tilted back",
    swing: "swing direction",
    swingLow: "down, chopping",
    swingHigh: "up, brushing",
    findShot: "move me to a shot that lands",
  },

  hints: Object.freeze({
    open: "open",
    closed: "closed",
    vertical: "vertical",
    brushing: "brushing up",
    chopping: "chopping down",
    flat: "flat",
  }),

  outcomes: Object.freeze({
    NET: { label: "net", detail: "it never gets over. the ball is still turning backwards." },
    OUT: { label: "out", detail: "over the net, past the end line, still climbing." },
    IN: { label: "in", detail: "on the table." },
  }),

  legend: Object.freeze({
    serve: "the serve",
    ret: "your return",
    /** @param {number} ms */
    ghost: (ms) => `one ball every ${ms} ms — wide gaps are fast`,
    mark: "the red dot is the same point on the ball",
  }),

  noscript:
    "this page is a physics simulation you drive with two sliders, so it needs javascript " +
    "to do anything at all. the claim it demonstrates, in one line: against a backspin " +
    "serve the bat has to be open by about 31 degrees, and against topspin about 12 — " +
    "roughly 19 degrees apart, with almost no setting that returns both.",
});
