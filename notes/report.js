// Report the invariant metrics for the record.
import { SPIN } from "../src/physics.js";
import { SERVES, cachedServe, feasibleStats, overlapRatio, scanGrid, simulateReturn } from "../src/solver.js";

for (const spin of [SPIN.BACKSPIN, SPIN.TOPSPIN]) {
  const t = cachedServe(spin);
  const c = t.contact;
  console.log(`${spin}: launch ${JSON.stringify(SERVES[spin].launch)} spin ${SERVES[spin].spinMagnitude}`);
  console.log(`  bounces ${t.bounces.map(b=>b.toFixed(2)).join(", ")}  net crossing y=${t.netCrossY.toFixed(3)}`);
  console.log(`  contact x=${c.x.toFixed(2)} y=${c.y.toFixed(3)} vx=${c.vx.toFixed(2)} vy=${c.vy.toFixed(2)} omega=${c.omega.toFixed(0)} (${(Math.abs(c.omega)/(2*Math.PI)).toFixed(0)} rev/s)`);
}
const b = scanGrid(SPIN.BACKSPIN, 2, 2), t = scanGrid(SPIN.TOPSPIN, 2, 2);
const bs = feasibleStats(b), ts = feasibleStats(t);
console.log(`\nINV-7  default (backspin, 0, +5) -> ${simulateReturn(SPIN.BACKSPIN,0,5).result.outcome}  (needs NET)`);
console.log(`INV-8  backspin area ${(bs.areaFraction*100).toFixed(2)}%  topspin area ${(ts.areaFraction*100).toFixed(2)}%  (needs > 5%)`);
console.log(`INV-9  centroid backspin ${bs.centroidTheta.toFixed(1)}deg topspin ${ts.centroidTheta.toFixed(1)}deg  gap ${(bs.centroidTheta-ts.centroidTheta).toFixed(1)}deg  (needs > 15)`);
console.log(`INV-10 IoU ${overlapRatio(b,t).toFixed(3)}  (needs < 0.25)`);
console.log(`       backspin theta band ${bs.minTheta}..${bs.maxTheta}, topspin ${ts.minTheta}..${ts.maxTheta}`);
