import { ftToCm } from '../app/lib/ftToCm.js';

const cases = [ ['4.5', 137], ['0', 0], ['', null], ['abc', null], ['7.02', 214], ['10.01', 305] ];
let failed = 0;
for (const [inVal, expectVal] of cases) {
  const out = ftToCm(inVal);
  const ok = (out === expectVal);
  console.log(inVal, '=>', out, ok ? 'OK' : `FAIL (expected ${expectVal})`);
  if (!ok) failed++;
}
if (failed) process.exit(2); else process.exit(0);
