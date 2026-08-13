// Scratch probe — not part of the build or the checks. Prints what the serve
// presets actually do and where the IN region lands, so the presets get tuned
// against numbers rather than against a hunch.
import {
  CONTACT_X,
  NET_X,
  SERVES,
  simulate,
  traceServe,
  type SpinPreset,
} from "../src/lib/simulate.ts";

const BAT_ANGLE = { min: -30, max: 70 };
const SWING_DIRECTION = { min: -60, max: 80 };
const STEP = 5;

function range(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  for (let v = min; v <= max; v += step) values.push(v);
  return values;
}

for (const preset of ["backspin", "topspin"] as SpinPreset[]) {
  const trace = traceServe(preset);
  const c = trace.contact;
  const bounces = trace.path.filter(
    (s, i) => i > 0 && s.vy > 0 && trace.path[i - 1].vy <= 0,
  );
  console.log(
    `${preset}: launch omega=${SERVES[preset].launch.omega}` +
      ` | bounces=${bounces.length} at x=${bounces.map((b) => b.x.toFixed(2)).join(",")}` +
      ` | net-cross clearance unknown` +
      `\n  contact @x=${CONTACT_X}: y=${c.y.toFixed(3)} vx=${c.vx.toFixed(2)}` +
      ` vy=${c.vy.toFixed(2)} omega=${c.omega.toFixed(0)}`,
  );
}

// Did the serve clear the net?
for (const preset of ["backspin", "topspin"] as SpinPreset[]) {
  const trace = traceServe(preset);
  const crossing = trace.path.find((s) => s.x >= NET_X);
  console.log(`${preset}: serve crossed net at y=${crossing?.y.toFixed(3)}`);
}

const inAngles: Record<string, number[]> = {};
for (const preset of ["backspin", "topspin"] as SpinPreset[]) {
  const angles: number[] = [];
  const rows: string[] = [];
  for (const bat of range(BAT_ANGLE.min, BAT_ANGLE.max, STEP)) {
    let row = String(bat).padStart(4) + " ";
    for (const swing of range(SWING_DIRECTION.min, SWING_DIRECTION.max, STEP)) {
      const r = simulate(preset, bat, swing);
      row += r.outcome === "IN" ? "#" : r.outcome === "NET" ? "." : "o";
      if (r.outcome === "IN") angles.push(bat);
    }
    rows.push(row);
  }
  inAngles[preset] = angles;
  console.log(`\n=== ${preset} ===  (# = IN, . = NET, o = OUT)`);
  console.log("     " + range(SWING_DIRECTION.min, SWING_DIRECTION.max, STEP).map(() => " ").join(""));
  console.log(rows.join("\n"));
  console.log(`IN cells: ${angles.length}`);
}

const mean = (v: number[]): number => v.reduce((s, x) => s + x, 0) / v.length;
const back = mean(inAngles.backspin);
const top = mean(inAngles.topspin);
console.log(
  `\nbackspin centroid ${back.toFixed(1)}°, topspin centroid ${top.toFixed(1)}°, gap ${(back - top).toFixed(1)}° (need > 15)`,
);
console.log(`default (backspin, 0, 5) => ${JSON.stringify(simulate("backspin", 0, 5))} (need NET)`);
