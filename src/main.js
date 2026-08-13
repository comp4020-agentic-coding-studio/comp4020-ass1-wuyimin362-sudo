/**
 * Wiring: controls in, trajectory out, canvas redrawn.
 *
 * Phase 3 scope — one scene and the two sliders. The three-act structure and
 * the solution map come in phase 4.
 */

import { drawContact, fitDiagram, readContact } from "./contact.js";
import { COPY } from "./copy.js";
import { SPIN, batContact } from "./physics.js";
import { drawFrame, fitScene } from "./render.js";
import { cachedServe, simulateReturn } from "./solver.js";

/** @param {string} path @returns {unknown} */
function copyAt(path) {
  return path.split(".").reduce((node, key) => node?.[key], /** @type {any} */ (COPY)) ?? "";
}

function fillCopy() {
  document.title = COPY.title;
  for (const node of document.querySelectorAll("[data-copy]")) {
    const value = copyAt(node.getAttribute("data-copy") ?? "");
    if (typeof value === "string") node.textContent = value;
  }
  for (const node of document.querySelectorAll("[data-static-noscript]")) {
    node.textContent = COPY.noscript;
  }
}

/** @type {{ spin: 'backspin' | 'topspin', batAngle: number, swingDirection: number }} */
const state = { spin: SPIN.BACKSPIN, batAngle: 0, swingDirection: 5 };

/** @type {HTMLCanvasElement} */
let canvas;
/** @type {HTMLCanvasElement} */
let contactCanvas;
/** @type {ReturnType<typeof simulateReturn> | null} */
let trace = null;
let dirty = true;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let announceTimer;

/** @param {string} id */
const el = (id) => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node;
};

function describe() {
  const { batAngle, swingDirection, spin } = state;
  const face =
    batAngle > 0
      ? `${COPY.hints.open} ${batAngle}°`
      : batAngle < 0
        ? `${COPY.hints.closed} ${Math.abs(batAngle)}°`
        : COPY.hints.vertical;
  const outcome = trace?.result.outcome ?? "NET";
  const detail =
    trace?.result.outcome === "IN"
      ? `it lands ${trace.result.landingX.toFixed(2)} m past the net`
      : COPY.outcomes[outcome].detail;
  return `against the ${spin} serve, with the bat ${face} and the swing at ${swingDirection}°: ${COPY.outcomes[outcome].label}. ${detail}`;
}

function syncInputs() {
  /** @type {HTMLInputElement} */ (el("bat-angle")).value = String(state.batAngle);
  /** @type {HTMLInputElement} */ (el("swing-direction")).value = String(state.swingDirection);
  el("bat-angle-value").textContent = `${state.batAngle}°`;
  el("swing-direction-value").textContent = `${state.swingDirection}°`;
  el("bat-angle-hint").textContent =
    state.batAngle > 0 ? COPY.hints.open : state.batAngle < 0 ? COPY.hints.closed : COPY.hints.vertical;
  el("swing-direction-hint").textContent =
    state.swingDirection > 0
      ? COPY.hints.brushing
      : state.swingDirection < 0
        ? COPY.hints.chopping
        : COPY.hints.flat;
  dirty = true;

  // Section 6.3: announce once the visitor stops moving, not on every pixel of
  // slider travel.
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    el("outcome-live").textContent = describe();
  }, 150);
}

function render() {
  if (dirty || !trace) {
    trace = simulateReturn(state.spin, state.batAngle, state.swingDirection);
    const outcome = trace.result.outcome;
    const label = el("outcome-label");
    label.textContent = COPY.outcomes[outcome].label;
    label.dataset.outcome = outcome;
    el("outcome-detail").textContent =
      outcome === "IN"
        ? `${COPY.outcomes.IN.detail} ${trace.result.landingX.toFixed(2)} m past the net.`
        : COPY.outcomes[outcome].detail;
    canvas.setAttribute("aria-label", describe());
    dirty = false;
  }

  const fitted = fitScene(canvas);
  if (!fitted) return;
  const serve = cachedServe(state.spin);
  const drawn = drawFrame(fitted.ctx, fitted.view, {
    serve: serve.path,
    contact: serve.contact,
    ret: trace.path,
    outcome: trace.result.outcome,
    landingX: trace.result.outcome === "IN" ? trace.result.landingX : undefined,
    batAngle: state.batAngle,
    swingDirection: state.swingDirection,
  });

  // The strobe interval widens on narrow screens so the ghosts stay separate,
  // so the legend states what was drawn rather than a constant.
  const ghostKey = document.querySelector(".key-ghost");
  if (ghostKey) ghostKey.textContent = COPY.legend.ghost(drawn.strobeMs);

  renderContact(serve.contact);
}

/**
 * Act 2. Driven by the same two sliders, from the same contact object the
 * trajectory came out of.
 *
 * @param {import('./physics.js').BallState} contact
 */
function renderContact(contact) {
  const fitted = fitDiagram(contactCanvas);
  if (!fitted) return;
  const detail = batContact(contact, state.batAngle, state.swingDirection);
  drawContact(fitted.ctx, fitted.width, fitted.height, detail);

  // The numbers live in the DOM rather than as floating canvas labels: they
  // collided with the ball and with each other at every second slider
  // position, and in the DOM a screen reader gets them for free.
  const reading = readContact(detail);
  el("contact-sentence").textContent = reading.sentence;
  const list = el("contact-readout");
  list.replaceChildren(
    ...reading.rows.flatMap(([term, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = term;
      const dd = document.createElement("dd");
      dd.textContent = value;
      return [dt, dd];
    }),
  );
  contactCanvas.setAttribute("aria-label", reading.sentence);
}

function boot() {
  fillCopy();
  canvas = /** @type {HTMLCanvasElement} */ (el("table-view"));
  contactCanvas = /** @type {HTMLCanvasElement} */ (el("contact-view"));

  el("bat-angle").addEventListener("input", (event) => {
    state.batAngle = Number(/** @type {HTMLInputElement} */ (event.target).value);
    syncInputs();
    render();
  });
  el("swing-direction").addEventListener("input", (event) => {
    state.swingDirection = Number(/** @type {HTMLInputElement} */ (event.target).value);
    syncInputs();
    render();
  });
  for (const input of document.querySelectorAll('input[name="serve"]')) {
    input.addEventListener("change", () => {
      const radio = /** @type {HTMLInputElement} */ (input);
      if (!radio.checked) return;
      state.spin = /** @type {'backspin' | 'topspin'} */ (radio.value);
      syncInputs();
      render();
    });
  }

  // Section 6.2: a resize recomputes only the metres-to-pixels mapping. The
  // slider values and the computed trajectory are untouched.
  window.addEventListener("resize", render);
  window.addEventListener("orientationchange", render);

  syncInputs();
  render();
}

boot();
