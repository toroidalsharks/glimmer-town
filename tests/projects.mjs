// npm test
// Coins and big projects: coins go past 999, the morning allowance grows with the town,
// town goals pay out once, and a big project goes from plans to a crew build to an
// opening, then pays the Creator back every morning.
import { openGame, OUT } from './lib.mjs';
import { join } from 'node:path';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond ? '  ok ' : ' FAIL'}  ${what}`); if (!cond) failed++; };
const shots = process.argv.includes('--shots');

const { browser, page, E, errors } = await openGame(shots ? { gfx: 'pretty' } : {});
try {
  await E(`(() => { W.meeting = null; W.meetingDay = W.day; W.t = 0.3; W.weather = 'clear'; cfg.cutscenes = false; })()`);

  // coins
  ok(await E(`(() => { W.creator.coins = 990; const a = morningAllowance(); newDay(); return W.creator.coins === 990 + a && W.creator.coins > 999 && a >= 60; })()`), 'coins go past 999 every morning');
  ok(await E(`(() => { W.creator.coins = 5000; creatorEarn(1e12); const top = W.creator.coins === COIN_MAX; creatorEarn(-1e12); const bottom = W.creator.coins === 0; W.creator.coins = 0; return top && bottom; })()`), 'coins stay between 0 and the new limit');
  ok(await E(`(() => { const a = morningAllowance(); for (let i = 0; i < 3; i++) { const k = birth(); k.grow = 1; k.job = 'builder'; W.people.push(k); buildKin(k); } return morningAllowance() === a + 18 && /every morning/.test(allowanceText()); })()`), 'the allowance grows with the town');
  ok(await E(`W.added.coinCap === true && (W.updates || []).some((u) => /999/.test(u.text))`), 'the player hears that the limit is gone');

  // goals
  ok(await E(`(() => { W.goals = {}; W.creator.coins = 0; W.shinesFound = 60; goalsCheck(); const got = W.creator.coins; goalsCheck(); return W.goals.stars50 != null && got >= 400 && W.creator.coins === got; })()`), 'a town goal pays out once');
  ok(await E(`/Town goals/.test(goalsHtml()) && /Big projects/.test(tpBuildHtml())`), 'the Build tab shows goals and big projects');

  // a big project, start to finish
  const real = await E(`JSON.stringify(W.people.filter(isRealish).map((p) => [p.id, p.job]))`);
  ok(await E(`(() => { W.creator.coins = 0; return /don't have/.test(applyCmd({ t: 'tproj', a: 'give', id: 'bank', what: 'coins', n: 100 })) && !W.tp?.bank; })()`), 'you cannot pay with coins you do not have');
  ok(await E(`(() => { W.creator.coins = 1000; applyCmd({ t: 'tproj', a: 'give', id: 'bank', what: 'coins', n: 100 }); return tpStage('bank') === 'plans' && W.tp.bank.fund.coins === 100 && W.creator.coins === 900 && W.log.some((e) => /Plans for the <b>Glimmer Bank/.test(e.text)); })()`), 'paying a bit puts the plans up');
  ok(await E(`(() => { const r = applyCmd({ t: 'tproj', a: 'give', id: 'mine', what: 'coins', n: 100 }); return /Glimmer Peak/.test(r) && !W.tp.mine; })()`), 'the gem mine waits for Glimmer Peak');
  ok(await E(`(() => { W.creator.coins = 50000; const M = mats(); for (const k of Object.keys(MATS)) M[k] = 200; for (const k of Object.keys(TP.bank.cost)) applyCmd({ t: 'tproj', a: 'give', id: 'bank', what: k, n: 'all' }); const S = W.tp.bank; return S.stage === 'build' && Number.isFinite(S.x) && !spotProblem(S.x, S.z, 0) === false && !!tpObj.bank; })()`), 'paying it off breaks ground and puts up a site');
  ok(await E(`W.tp.bank.crew.length >= 1 && W.tp.bank.crew.every((id) => !isRealish(person(id)) && person(id).grow >= 1)`), 'the crew is generated grown-ups');
  ok(await E(`JSON.stringify(W.people.filter(isRealish).map((p) => [p.id, p.job]))`) === real, 'real people keep their jobs');
  ok(await E(`(() => { const p = person(W.tp.bank.crew[0]); W.t = 0.2; W.weather = 'clear'; W.event = null; let kind = null; for (let i = 0; i < 20 && kind !== 'tpbuild'; i++) { p.task = null; p.workedToday = false; p.hunger = 0; plan(p); kind = p.task?.kind; } const fine = p.path.every((q) => Number.isFinite(q.x) && Number.isFinite(q.z)); return kind === 'tpbuild' && fine && doing(p) !== 'wandering'; })()`), 'the crew walks to the site');
  ok(await E(`(() => { const p = person(W.tp.bank.crew[0]); p.task.phase = 'do'; const g0 = W.tp.bank.progress; tpClock = W.day + W.t; W.t += 0.04; tpFrame(0.016); return W.tp.bank.progress > g0; })()`), 'crew on site moves the build along');
  ok(await E(`(() => { const p = person(W.tp.bank.crew[0]); const c0 = p.coins + (W.pantry || 0); W.t = 0.55; p.workedToday = false; tpFinish(p, 'tpbuild'); W.t = 0.3; p.task = null; return p.workedToday && p.coins + (W.pantry || 0) > c0; })()`), 'a shift ends with pay');
  ok(await E(`(() => { const g0 = W.tp.bank.progress; applyCmd({ t: 'tproj', a: 'help', id: 'bank' }); return W.tp.bank.progress > g0 + 0.05 && /enough help/.test(applyCmd({ t: 'tproj', a: 'help', id: 'bank' })); })()`), 'the Creator can lend a hand once a day');
  ok(await E(`(() => { const h = /built/.test(tpBuildHtml()); tpAdvance('bank', 1); return h && W.tp.bank.stage === 'open' && W.log.some((e) => /Glimmer Bank<\\/b> is open/.test(e.text)); })()`), 'finishing it holds the opening and opens it');
  ok(await E(`(() => { W.creator.coins = 10000; tpDaily(); return W.creator.coins === 10200; })()`), 'the bank pays interest in the morning');
  ok(await E(`(() => { const p = W.people.find((q) => q.grow >= 1 && !q.visitor); let k = null; for (let i = 0; i < 300 && k !== 'tpvisit'; i++) { p.task = null; if (tpVisitPlan(p)) k = p.task.kind; } if (k !== 'tpvisit') return false; p.task.phase = 'do'; tpStart(p, 'tpvisit'); tpFinish(p, 'tpvisit'); p.task = null; return (W.tpTix.bank || 0) >= 1; })()`), 'residents visit what was built');

  // everything else builds and opens, and pays back
  await E(`(() => { if (!W.placed.some((pl) => pl.type === 'observatory')) { const s = autoSpot(BUILDS.observatory.size); W.placed.push({ id: uid(), type: 'observatory', x: s[0], z: s[1], rot: 0, day: W.day }); buildPlaced(); } W.lobes = [...new Set([...(W.lobes || []), 'peak', 'north', 'starlight', 'east'])]; buildLand(); W.city = Object.assign(W.city || {}, { stage: 'open', open: true, day: W.day }); })()`);
  const left = await E(`(() => { W.creator.coins = 999999; const M = mats(); for (const k of Object.keys(MATS)) M[k] = 999; for (const id of TP_ORDER) if (id !== 'bank') for (const k of Object.keys(TP[id].cost)) applyCmd({ t: 'tproj', a: 'give', id, what: k, n: 'all' }); for (const id of TP_ORDER) tpAdvance(id, 1); return TP_ORDER.filter((id) => !tpIsOpen(id)).join(','); })()`);
  ok(left === '', `all eight big projects open${left ? ` (not: ${left})` : ''}`);
  ok(await E(`(() => { const s = tpSites(); for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (Math.hypot(s[i].x - s[j].x, s[i].z - s[j].z) < s[i].size + s[j].size) return false; return s.length === 8 && Object.keys(tpObj).length === 8; })()`), 'they all fit without overlapping');
  ok(await E(`(() => { const [cx, cz] = lobeCenter('peak'), S = W.tp.mine; return Math.hypot(S.x - cx, S.z - cz) < lobeR('peak'); })()`), 'the gem mine is on Glimmer Peak');
  ok(await E(`(() => { W.creator.coins = 0; const M = mats(), s0 = M.stone; W.tp.rocket.nextLaunch = W.day; tpDaily(); const away = W.tp.rocket.away; const c1 = W.creator.coins; tpDaily(); return c1 >= 80 + 80 + 120 + 150 + 400 && M.stone >= s0 + 5 && away && !W.tp.rocket.away && W.creator.coins >= c1 + 1000; })()`), 'every open project pays out, and the rocket goes up and comes back with treasure');
  ok(await E(`(() => { W.goals = {}; goalsCheck(); return W.goals.proj8 != null && W.goals.proj1 != null; })()`), 'finishing every project hits the big goal');
  ok(await E(`(() => { const it = newItem('decor', Object.keys(DECOR)[0], 'mint', null, 1); W.creator.items.push(it); W.creator.coins = 0; const v = sellValue(it); applyCmd({ t: 'sell', uid: it.uid }); return W.creator.coins === v * 2; })()`), 'the night market doubles what you sell');
  ok(await E(`(() => { W.t = 0.8; tpFrame(0.016); const b = tpObj.lighthouse.beam.visible; W.t = 0.3; tpFrame(0.016); return b && !tpObj.lighthouse.beam.visible; })()`), 'the lighthouse beam only shows at night');

  // a reload keeps them
  await E(`(() => { W.creator.coins = 5000; saveNow(); })()`);
  await page.reload();
  await page.waitForFunction(() => window.__g && window.__g.ev('typeof W !== "undefined" && W.people.length > 0 && typeof camera !== "undefined"'), null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  ok(await E(`tpOpenCount() === 8 && Object.keys(tpObj).length === 8 && W.creator.coins > 999`), 'after a reload the projects and the coins are still there');

  if (shots) {
    for (const [id, r] of [['bank', 40], ['lighthouse', 44], ['market', 38], ['mine', 40], ['aquarium', 40], ['coaster', 44], ['palace', 48], ['rocket', 44]]) {
      await E(`(() => { const S = W.tp['${id}']; W.t = '${id}' === 'market' || '${id}' === 'lighthouse' ? 0.66 : 0.3; camGoal = { x: S.x, z: S.z, r: ${r} }; })()`);
      await page.waitForTimeout(3500);
      await page.screenshot({ path: join(OUT, `project-${id}.png`) });
    }
    await E(`(() => { W.creator.coins = 123456; activeTab = 'build'; openSheet(); })()`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(OUT, 'project-build-tab.png') });
    console.log('  saved tests/out/project-*.png');
  }
  ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' / ') : ''}`);
} catch (e) {
  console.error(e); failed++;
} finally {
  await browser.close();
}
if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nprojects: all ok');
