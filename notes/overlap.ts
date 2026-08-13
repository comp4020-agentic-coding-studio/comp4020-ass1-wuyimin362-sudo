// How much do the two solution regions actually share? The page makes a claim
// about this in prose, so it needs a number behind it rather than an impression.
import { simulate } from "../src/lib/simulate.ts";

const STEP = 2;
const bat: number[] = [];
for (let v = -30; v <= 70; v += STEP) bat.push(v);
const swing: number[] = [];
for (let v = -60; v <= 80; v += STEP) swing.push(v);

let back = 0, top = 0, both = 0, total = 0;
const backAngles: number[] = [], topAngles: number[] = [];
for (const b of bat) for (const s of swing) {
  const bi = simulate("backspin", b, s).outcome === "IN";
  const ti = simulate("topspin", b, s).outcome === "IN";
  total++;
  if (bi) { back++; backAngles.push(b); }
  if (ti) { top++; topAngles.push(b); }
  if (bi && ti) both++;
}
const mean = (v: number[]) => v.reduce((a, x) => a + x, 0) / v.length;
console.log(`grid ${total} cells (${STEP}° steps)`);
console.log(`backspin IN: ${back}  topspin IN: ${top}  both: ${both}`);
console.log(`share of backspin solutions that also work vs topspin: ${(100*both/back).toFixed(1)}%`);
console.log(`share of topspin solutions that also work vs backspin: ${(100*both/top).toFixed(1)}%`);
console.log(`bat-angle centroid: backspin ${mean(backAngles).toFixed(1)}°, topspin ${mean(topAngles).toFixed(1)}°, gap ${(mean(backAngles)-mean(topAngles)).toFixed(1)}°`);
