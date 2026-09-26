// npm run shots
// Screenshots of the town at a few moments, saved to tests/out/.
// Uses the "pretty" graphics level, so it's slow on a machine without a GPU.
import { openGame, OUT } from './lib.mjs';
import { join } from 'node:path';

const gfx = process.argv[2] || 'pretty';
const settle = gfx === 'pretty' ? 5000 : 1500;
const { browser, page, E, errors, cutStep } = await openGame({ gfx, width: 900, height: 600 });
const shot = async (name) => { await page.waitForTimeout(settle); await page.screenshot({ path: join(OUT, `${name}.png`) }); console.log('  saved tests/out/' + name + '.png'); };

await E(`(() => { W.meeting = null; W.meetingDay = W.day; W.t = 0.35; })()`);
await shot('1-town-day');

await E(`__g.go('fountain')`);
await shot('2-fountain');

await E(`(() => { W.t = 0.9; })()`);
await shot('3-night');

await E(`(() => { W.t = 0.35; resetView(); openInterior({ kind: 'hall' }); })()`);
await shot('4-glimmer-hall');
await E(`closeInterior()`);

// a debate in court, stopped on an objection
await E(`(() => { const [a, b] = W.people.filter((p) => p.grow >= 1); startCivilTrial(fileCase('debate', a, b, { topic: 'Is a hot dog a sandwich?' })); })()`);
await page.waitForTimeout(2000);
for (let i = 0; i < 40; i++) {
  const st = await cutStep(1);
  if (st.startsWith('objection') || st === 'wait' || st === 'end' || st === 'none') break;
}
await shot('5-objection');

if (errors.length) console.log('page errors:\n  ' + errors.join('\n  '));
await browser.close();
