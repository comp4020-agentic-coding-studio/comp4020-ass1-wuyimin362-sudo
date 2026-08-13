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
