// Why does no backspin launch produce a legal serve? Count rejection reasons.
import { NET_HEIGHT, SPIN, TABLE_HALF, omegaSignFor } from "../src/physics.js";
import { traceFromLaunch } from "../src/solver.js";

const reasons = {};
const bump = (k) => (reasons[k] = (reasons[k] ?? 0) + 1);
let best = null;

for (const spin of [SPIN.BACKSPIN, SPIN.TOPSPIN]) {
  Object.keys(reasons).forEach((k) => delete reasons[k]);
  best = null;
  let legal = 0;
  for (const y0 of [0.18, 0.24, 0.30, 0.36])
  for (const vx0 of [-3.4, -4.0, -4.6, -5.2, -5.8, -6.4, -7.0])
  for (const vy0 of [-1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6])
  for (const mag of [120, 200, 280, 360, 440, 520, 600, 680, 760]) {
    const launch = { x: 1.5, y: y0, vx: vx0, vy: vy0, omega: omegaSignFor(spin, vx0) * mag };
    let tr;
    try { tr = traceFromLaunch(launch, spin); } catch (e) { bump("no contact point (" + String(e.message).split(":")[1].trim() + ")"); continue; }
    if (tr.bounces.length !== 2) { bump(`bounces=${tr.bounces.length}`); continue; }
    const [b1, b2] = tr.bounces;
    if (!(b1 > 0 && b1 <= TABLE_HALF)) { bump(`first bounce off server half (${b1.toFixed(2)})`); continue; }
    if (!(b2 >= -TABLE_HALF && b2 < 0)) { bump(`second bounce off receiver half (${b2.toFixed(2)})`); continue; }
    if (!(tr.netCrossY > NET_HEIGHT)) { bump(`clipped the net (${tr.netCrossY.toFixed(3)})`); continue; }
    const c = tr.contact;
    if (!(c.y > 0.05 && c.y < 0.55)) { bump(`contact height ${c.y.toFixed(3)}`); continue; }
    if (!(c.x < -TABLE_HALF + 0.05)) { bump(`contact too far forward x=${c.x.toFixed(2)}`); continue; }
    if (!(c.x > -2.6)) { bump(`contact too deep x=${c.x.toFixed(2)}`); continue; }
    legal++;
    if (!best || Math.abs(c.omega) > Math.abs(best.contact.omega)) best = tr;
  }
  console.log(`\n=== ${spin}: ${legal} legal ===`);
  const top = Object.entries(reasons).sort((a,b)=>b[1]-a[1]).slice(0,8);
  for (const [k,v] of top) console.log(`  ${String(v).padStart(5)}  ${k}`);
  if (best) console.log(`  best contact: x=${best.contact.x.toFixed(2)} y=${best.contact.y.toFixed(3)} omega=${best.contact.omega.toFixed(0)}`);
}
