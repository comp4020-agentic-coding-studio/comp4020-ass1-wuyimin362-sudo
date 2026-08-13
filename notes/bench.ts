import { simulate } from "../src/lib/simulate.ts";
// warm the serve cache
simulate("backspin", 0, 0);
for (const [label, n] of [["single", 1000]] as const) {
  const t0 = performance.now();
  for (let i = 0; i < n; i++) simulate("backspin", -30 + (i % 100), -60 + (i % 140));
  const dt = performance.now() - t0;
  console.log(`${label}: ${n} sims in ${dt.toFixed(0)} ms => ${(dt / n).toFixed(3)} ms each`);
}
// a full map at 2 deg x 2 deg
const t1 = performance.now();
let cells = 0;
for (let b = -30; b <= 70; b += 2) for (let s = -60; s <= 80; s += 2) { simulate("topspin", b, s); cells++; }
console.log(`map ${cells} cells in ${(performance.now() - t1).toFixed(0)} ms`);
