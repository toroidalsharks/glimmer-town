// npm test
// Boots the built game headless and plays through the big systems:
// a burglary, a murder from discovery to verdict, a civil case, a wedding,
// the case board, then a save and reload. Fails on any page error.
import { openGame } from './lib.mjs';

const verbose = process.argv.includes('-v');
const log = (...a) => verbose && console.log('   ', ...a);
let failed = 0;
const ok = (cond, what) => { console.log(`${cond ? '  ok ' : ' FAIL'}  ${what}`); if (!cond) failed++; };

const t0 = Date.now();
const { browser, page, E, errors, cutStep } = await openGame();
try {
  ok(await E('W.people.length') >= 5, 'the town boots with residents');

  // more grown-ups, all outside, so crimes have enough suspects
  await E(`(() => { W.meeting = null; W.meetingDay = W.day; W.t = 0.3; for (let i = 0; i < 6; i++) { const k = birth(); k.grow = 1; W.people.push(k); buildKin(k); } W.people.forEach((p) => { p.inside = false; p.task = null; p.state = 'free'; p.x = (rand() - 0.5) * 20; p.z = 8 + rand() * 10; }); })()`);

  // 1. a property crime is discovered in a cutscene
  const petty = await E(`__g.crime('burglary') || __g.crime('pickpocket') || __g.crime('hack')`);
  ok(!!petty, 'a property crime happens');
  await page.waitForTimeout(800);
  ok(['end', 'none'].includes(await cutStep(40, log)), 'its discovery scene plays to the end');

  // 2. a murder: discovery, search, question, accuse, arrest, trial, verdict
  const real = await E(`W.people.filter(isRealish).map((p) => p.id)`);
  const cid = await E('__g.murder()');
  ok(!!cid, 'a murder happens');
  await page.waitForTimeout(800);
  await cutStep(40, log);
  const C = (k) => E(`crimeById('${cid}').${k}`);
  const culprit = await C('culprit');
  ok(!real.includes(culprit) && !real.includes(await C('victim')), 'no real person is the killer or the victim');
  ok((await E(`crimeBoardHtml()`)).includes('Investigations'), 'the case board renders');
  log(await E(`crimeCmd({ a: 'search', cid: '${cid}' })`));
  log(await E(`crimeCmd({ a: 'question', cid: '${cid}', pid: '${culprit}' })`));
  // make sure there are two clues to accuse with
  await E(`(() => { const X = crimeById('${cid}'); while (X.clues.filter((c) => c.found).length < 2 && X.clues.some((c) => !c.found)) revealClue(X, null); })()`);
  log(await E(`crimeCmd({ a: 'accuse', cid: '${cid}', pid: '${culprit}' })`));
  ok(['charged', 'trial'].includes(await C('status')), 'accusing charges the suspect');
  await page.waitForTimeout(800);
  await cutStep(30, log); // the arrest
  // pressing "Hold the trial now" (twice, impatiently) must not stack up extra trials
  log(await E(`crimeCmd({ a: 'trialnow', cid: '${cid}' })`), await E(`crimeCmd({ a: 'trialnow', cid: '${cid}' })`));
  let st = 'none';
  for (let i = 0; i < 20 && st !== 'wait'; i++) { await page.waitForTimeout(700); st = await cutStep(80, log); }
  ok(st === 'wait', 'the trial reaches the verdict choice');
  ok((await E(`CUT.live.lines.filter((L) => L.fx === 'objection').length`)) > 0, 'somebody objects');
  await E(`cutPick('guilty')`);
  await cutStep(20, log);
  ok(await C('verdict') === 'guilty', 'the verdict is recorded');
  ok(await E(`jailed(person('${culprit}'))`), 'the convicted resident goes to the cell');
  await page.waitForTimeout(1000);
  ok(await E(`!CUT.queue.some((q) => q.crimeId === '${cid}') && !(CUT.live && CUT.live.crimeId === '${cid}')`), 'the case gets exactly one trial');

  // 3. a civil case
  await E(`(() => { const [a, b] = W.people.filter((p) => !jailed(p) && p.grow >= 1); startCivilTrial(fileCase('fight', a, b)); })()`);
  st = 'none';
  for (let i = 0; i < 10 && st !== 'wait'; i++) { await page.waitForTimeout(700); st = await cutStep(60, log); }
  ok(st === 'wait', 'a civil case reaches a ruling');
  await E(`cutPick('fine')`); await cutStep(20, log);

  // 4. a wedding scene
  await E(`(() => { const [a, b] = W.people.filter((p) => !jailed(p) && p.grow >= 1 && !isRealish(p)).slice(2); weddingCut(a, b); })()`);
  await page.waitForTimeout(800);
  ok(['end', 'none'].includes(await cutStep(40, log)), 'a wedding scene plays');

  // 5. the court tab, the replay archive
  await E(`(() => { activeTab = 'court'; openSheet(); refreshPanel(true); })()`);
  await page.waitForTimeout(500);
  ok(await E(`W.cutscenes.length`) >= 4, 'scenes are saved for replay');

  // 6. save, reload, and the world is still there
  const before = await E(`JSON.stringify([W.day, W.people.length, jailedPeople().map((p) => p.id)])`);
  await E(`saveNow()`);
  await page.reload();
  await page.waitForFunction(() => window.__g && window.__g.ev('typeof W !== "undefined" && W.people.length > 0'), null, { timeout: 60000 });
  const after = await E(`JSON.stringify([W.day, W.people.length, jailedPeople().map((p) => p.id)])`);
  ok(before === after, 'the town survives a reload');
} catch (e) {
  console.log(' FAIL  the test itself crashed: ' + e.message); failed++;
}
ok(errors.length === 0, 'no errors on the page' + (errors.length ? ':\n        ' + errors.slice(0, 5).join('\n        ') : ''));
await browser.close();
console.log(failed ? `\n${failed} problem${failed > 1 ? 's' : ''} (${((Date.now() - t0) / 1000).toFixed(0)} s)` : `\nall good (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
process.exit(failed ? 1 : 0);
