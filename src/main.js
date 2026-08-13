/**
 * Wiring: controls in, trajectory out, canvas redrawn.
 *
 * Phase 3 scope — one scene and the two sliders. The three-act structure and
 * the solution map come in phase 4.
 */

import { drawContact, fitDiagram, readContact } from "./contact.js";
import { COPY } from "./copy.js";
import {
  advanceMap,
  batBand,
  drawMap,
  fitMap,
  mapFor,
  pointerToControls,
  sharedGround,
} from "./map.js";
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
}

/** @type {{ spin: 'backspin' | 'topspin', batAngle: number, swingDirection: number }} */
const state = { spin: SPIN.BACKSPIN, batAngle: 0, swingDirection: 5 };

/** @type {HTMLCanvasElement} */
let canvas;
/** @type {HTMLCanvasElement} */
let contactCanvas;
/** @type {HTMLCanvasElement} */
let mapCanvas;
/** @type {{ left: number, top: number, w: number, h: number } | null} */
let mapPlot = null;
let showGhost = true;
let mapFrame = 0;
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
  renderMap();
}

/**
 * Act 3. The map is 1,600 simulations per serve, so it is filled a slice per
 * animation frame and cached; the sliders stay live while it develops.
 */
function renderMap() {
  const fitted = fitMap(mapCanvas);
  if (!fitted) return;
  mapPlot = fitted.plot;
  drawMap(fitted.ctx, fitted.plot, fitted.width, fitted.height, state.spin, state, showGhost);
  updateMapReadout();
}

function updateMapReadout() {
  const band = batBand(state.spin);
  const other = state.spin === SPIN.BACKSPIN ? SPIN.TOPSPIN : SPIN.BACKSPIN;
  const otherBand = batBand(other);
  const summary = el("map-summary");

  if (!band) {
    summary.textContent = mapFor(state.spin).done
      ? "no bat angle in range returns this serve."
      : "playing out every shot in range…";
    el("map-readout").replaceChildren();
    return;
  }

  summary.textContent =
    `against ${state.spin}, only bat angles between ${Math.round(band.min)}° and ` +
    `${Math.round(band.max)}° return the ball at all.`;

  /** @type {[string, string][]} */
  const rows = [[`${state.spin} works from`, `${Math.round(band.min)}° to ${Math.round(band.max)}°`]];
  if (otherBand) {
    rows.push([`${other} works from`, `${Math.round(otherBand.min)}° to ${Math.round(otherBand.max)}°`]);
  }
  const overlap = sharedGround();
  if (overlap) {
    const union = overlap.backspin + overlap.topspin - overlap.shared;
    rows.push(["settings that do both", `${overlap.shared} of ${union}`]);
    el("closing-claim").textContent = COPY.actThree.closing({ shared: overlap.shared, union });
  }

  el("map-readout").replaceChildren(
    ...rows.flatMap(([term, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = term;
      const dd = document.createElement("dd");
      dd.textContent = value;
      return [dt, dd];
    }),
  );

  mapCanvas.setAttribute(
    "aria-label",
    `${summary.textContent} bat angle runs left to right, swing direction bottom to top; ` +
      `the lit region is where the ball lands.`,
  );
}

/**
 * Section 6.6. The trajectory is never animated — it is always drawn complete,
 * which is what the reduced-motion path asks for, so that is simply how the
 * page behaves for everyone.
 *
 * The one thing left that moves is the solution map filling in. That is
 * progress feedback rather than decoration, but it is still motion nobody
 * asked for, so under reduced motion both maps are computed in one pass
 * instead. The whole scan is 43 ms per serve; nobody waits for it either way.
 */
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Keep filling both maps in the background. The current serve goes first so
 * the visitor sees theirs develop; the other is warmed so the flip is instant,
 * which is the whole point of act 3.
 */
function pumpMaps() {
  if (prefersReducedMotion()) {
    advanceMap(state.spin, Number.POSITIVE_INFINITY);
    advanceMap(state.spin === SPIN.BACKSPIN ? SPIN.TOPSPIN : SPIN.BACKSPIN, Number.POSITIVE_INFINITY);
    renderMap();
    mapFrame = 0;
    return;
  }
  const other = state.spin === SPIN.BACKSPIN ? SPIN.TOPSPIN : SPIN.BACKSPIN;
  const before = mapFor(state.spin).cursor;
  const otherDone = mapFor(other).done;
  if (advanceMap(state.spin, 6)) advanceMap(other, 4);
  const changed = mapFor(state.spin).cursor !== before || mapFor(other).done !== otherDone;
  if (changed) renderMap();
  if (!mapFor(state.spin).done || !mapFor(other).done) {
    mapFrame = requestAnimationFrame(pumpMaps);
  } else {
    mapFrame = 0;
  }
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
  mapCanvas = /** @type {HTMLCanvasElement} */ (el("solution-map"));

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
      if (!mapFrame) mapFrame = requestAnimationFrame(pumpMaps);
    });
  }

  el("show-ghost").addEventListener("change", (event) => {
    showGhost = /** @type {HTMLInputElement} */ (event.target).checked;
    renderMap();
  });

  // Dragging the map is a shortcut, never the only way in: it sets the same
  // two sliders, and those are keyboard-operable by default.
  let dragging = false;
  mapCanvas.addEventListener("pointerdown", (event) => {
    if (!mapPlot) return;
    dragging = true;
    mapCanvas.setPointerCapture(event.pointerId);
    Object.assign(state, pointerToControls(event, mapCanvas, mapPlot));
    syncInputs();
    render();
    event.preventDefault();
  });
  mapCanvas.addEventListener("pointermove", (event) => {
    if (!dragging || !mapPlot) return;
    Object.assign(state, pointerToControls(event, mapCanvas, mapPlot));
    syncInputs();
    render();
  });
  for (const type of /** @type {const} */ (["pointerup", "pointercancel"])) {
    mapCanvas.addEventListener(type, (event) => {
      dragging = false;
      if (mapCanvas.hasPointerCapture(event.pointerId)) {
        mapCanvas.releasePointerCapture(event.pointerId);
      }
    });
  }

  // Section 6.2: a resize recomputes only the metres-to-pixels mapping. The
  // slider values and the computed trajectory are untouched.
  window.addEventListener("resize", render);
  window.addEventListener("orientationchange", render);

  syncInputs();
  render();
  mapFrame = requestAnimationFrame(pumpMaps);
}

boot();
