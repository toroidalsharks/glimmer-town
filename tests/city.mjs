// npm test
// Starline, the city quarter: it stays shut in a small new town, opens at its
// milestone, gets built, gives out its jobs, and never lets the town pass 25 people.
import { openGame, OUT } from './lib.mjs';
import { join } from 'node:path';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond ? '  ok ' : ' FAIL'}  ${what}`); if (!cond) failed++; };
const shots = process.argv.includes('--shots');

const { browser, page, E, errors } = await openGame();
try {
  await E(`(() => { W.meeting = null; W.meetingDay = W.day; W.t = 0.3; })()`);
  ok(await E(`!cityOpen() && !cityGroup && roomCount() === MAX_POP`), 'a brand new town has no Starline yet');
  ok(await E(`/opens when 15 people live here or on day 40/.test(cityBuildHtml()) && !SHOPS.trucks`), 'the Build tab says when Starline opens');
  ok(await E(`!Object.keys(JOBS).filter((k) => JOBS[k].city).some(jobOpen) && Array.from({ length: 200 }, randomJob).every((k) => !JOBS[k].city)`), 'nobody gets a city job before it opens');

  // grown-ups with ordinary jobs, so the opening has people to hire
  await E(`(() => { for (let i = 0; i < 6; i++) { const k = birth(); k.grow = 1; k.job = pick(['mart', 'cafe', 'garden']); W.people.push(k); buildKin(k); } })()`);
  const real = await E(`JSON.stringify(W.people.filter(isRealish).map((p) => [p.id, p.job]))`);
  await E(`(() => { W.day = Math.max(W.day, 40); cityDaily(); })()`);
  ok(await E(`cityOpen() && !!cityGroup && !!SHOPS.trucks && FOODS.some((f) => f.shop === 'trucks')`), 'Starline opens on day 40 and gets built');
  ok(await E(`W.people.filter((p) => JOBS[p.job]?.city).length >= 1`), 'someone takes a job in Starline');
  ok(await E(`JSON.stringify(W.people.filter(isRealish).map((p) => [p.id, p.job]))`) === real, 'real people keep their jobs');
  ok(await E(`W.log.some((e) => /Starline<\\/b> opened/.test(e.text)) && (W.updates || []).some((u) => /Starline/.test(u.text))`), 'the diary and the update log announce it');
  ok(await E(`windowMats.length === POP_CAP && camSpots().some((s) => s[0] === 'starline') && (!gfxOn() || WATER_ISLES.some((w) => w[0] === SL.x))`), 'the tower windows, camera spot and shoreline are set up');
  await E(`cityBoot()`);
  ok(await E(`scene.children.filter((o) => o === cityGroup).length === 1`), 'booting again does not build it twice');

  // walking there and back never loses anyone
  ok(await E(`(() => { const p = W.people.find((q) => q.grow >= 1 && !isRealish(q)); const keep = JSON.stringify([p.x, p.z, p.at, p.task, p.path, p.dest]); const fine = () => p.path.length && p.path.every((q) => Number.isFinite(q.x) && Number.isFinite(q.z)); const legs = [['plaza', 'cinema'], ['cinema', 'station'], ['station', 'bakery'], ['bakery', 'trucks'], ['trucks', 'home'], ['tower', 'studio'], ['radio', 'downtown'], ['downtown', 'city']]; let good = true; for (const [a, b] of legs) { p.at = a; [p.x, p.z] = TOWN[a].spot; setTask(p, 'stroll', b); if (!fine()) good = false; const end = p.path[p.path.length - 1]; if (Math.hypot(end.x - TOWN[b].spot[0], end.z - TOWN[b].spot[1]) > 0.01) good = false; } const [x, z, at, task, path, dest] = JSON.parse(keep); Object.assign(p, { x, z, at, task, path, dest }); return good; })()`), 'routes to and from Starline are clean');
  ok(await E(`(() => { const p = W.people.find((q) => q.grow >= 1 && !isRealish(q)); p.at = 'bakery'; [p.x, p.z] = TOWN.bakery.spot; setTask(p, 'stroll', 'cinema'); const back = p.path.some((q) => Math.hypot(q.x - DT_GATE[0][0], q.z - DT_GATE[0][1]) < 0.01); p.task = null; p.path = []; return !back; })()`), 'going from downtown to Starline takes the bridge, not a detour');

  // the city's own activities
  ok(await E(`(() => { const pr = W.people.find((q) => q.grow >= 1 && !isRealish(q)); const job = pr.job; pr.job = 'projection'; pr.task = { kind: 'work', phase: 'do' }; pr.away = null; const p = W.people.find((q) => q !== pr && q.grow >= 1 && !q.visitor); const t = W.t; W.t = 0.5; p.coins = 20; p.saving = false; let got = null; for (let i = 0; i < 400 && !got; i++) { p.task = null; if (cityPlan(p) && p.task.kind === 'movie') got = p.task; } const c0 = p.coins; p.task.phase = 'do'; cityStart(p, 'movie'); const hidden = p.inside; cityFinish(p, 'movie'); const r = got && hidden && !p.inside && p.coins === c0 - 2 && p.past.concat(p.today).some((m) => /Starlight Cinema/.test(m.text)); pr.job = job; pr.task = null; p.task = null; W.t = t; return r; })()`), 'residents go to the movies when a projectionist is on');
  ok(await E(`(() => { const ck = W.people.find((q) => q.grow >= 1 && !isRealish(q)); const job = ck.job; ck.job = 'trucks'; ck.task = { kind: 'work', phase: 'do' }; const p = W.people.find((q) => q !== ck && q.grow >= 1 && !q.visitor); p.coins = 20; p.hunger = 0.8; p.task = { kind: 'streetfood', phase: 'do' }; cityStart(p, 'streetfood'); cityFinish(p, 'streetfood'); const r = p.hunger < 0.8 && Object.keys(p.tastes).some((k) => foodById(k)?.shop === 'trucks'); ck.job = job; ck.task = null; p.task = null; return r; })()`), 'the food trucks feed people');
  ok(await E(`(() => { const h = W.people.find((q) => q.grow >= 1 && !isRealish(q)); const job = h.job; h.job = 'radio'; const n = W.log.length; radioShow(); h.job = job; return W.log.slice(n).some((e) => /Glimmer FM/.test(e.text)); })()`), 'Glimmer FM does a morning show');
  ok(await E(`['movie', 'streetfood', 'dance'].every((k) => { const p = W.people[0]; const t = p.task; p.task = { kind: k }; const d = doing(p); p.task = t; return d !== 'wandering'; })`), 'the resident card says where they are');
  ok(await E(`(() => { cityTap('cinema'); cityTap('tower'); cityTap('station'); cityTap('radio'); cityTap('studio'); return /Starline Tower|Glimmer|Beat Box|Starline Station|Starlight/.test(document.querySelector('#toast').textContent); })()`), 'tapping a Starline building tells you about it');

  // 25 people at most, whichever way they arrive
  ok(await E(`(() => { for (let i = 0; i < 40; i++) { if (freeRoom() < 0) break; const k = birth(); W.people.push(k); buildKin(k); } return residentCount() === POP_CAP && freeRoom() === -1; })()`), 'the town fills up to exactly 25');
  ok(await E(`W.people.filter((p) => p.room >= MAX_POP).every((p) => homeKey(p) === 'tower' && p.room < POP_CAP) && new Set(W.people.map((p) => p.room)).size === W.people.length`), 'the last four live in Starline Tower, one per room');
  ok(await E(`(() => { const n = W.people.length; W.babies = [[W.people[0].id, W.people[1].id]]; const t = W.t; W.t = 0.99; newDay(); W.t = t; return W.people.length === n && residentCount() === POP_CAP; })()`), 'a baby due in a full town is not born');
  ok(await E(`(() => { const n = W.people.length; const r = arriveVisitor({ kind: 'visit', from: OTHER, homeId: 'x', person: stripPerson(W.people[0]) }); return r === true && W.people.length === n; })()`), 'a ferry visitor turns back when the town is full');
  ok(await E(`inviteResident('Testy', 'likes tests', 'mint').then((r) => /full/.test(r))`), 'an invite waits when the town is full');

  // let it run with the full town out and about in Starline
  await E(`(() => { W.t = 0.46; W.city.market = true; W.people.forEach((p) => { p.inside = false; p.task = null; p.state = 'free'; p.at = 'city'; [p.x, p.z] = jitter(TOWN.city.spot, 6); }); const c = W.people.find((q) => q.job === 'conductor') || W.people.find((q) => !isRealish(q) && q.grow >= 1); c.job = 'conductor'; c.task = { kind: 'work', phase: 'do' }; })()`);
  for (let i = 0; i < 6; i++) { await E(`(() => { for (let k = 0; k < 150; k++) step(0.1); cityFrame(0.1); })()`); }
  ok(await E(`W.people.every((p) => Number.isFinite(p.x) && Number.isFinite(p.z))`), 'a busy evening in Starline leaves nobody lost');
  ok(await E(`(() => { const [ax] = slTrackA(), [bx] = slTrackB(); const x = slTrain.position.x; return Number.isFinite(x) && x >= Math.min(ax, bx) - 0.01 && x <= Math.max(ax, bx) + 0.01 && slCars.every((c) => Number.isFinite(c.position.x)); })()`), 'the monorail and the traffic stay on their tracks');

  // draw calls with the whole city in view
  const calls = await E(`(() => { closeInterior && interior && closeInterior(); controls.target.set(SL.x, 2, SL.z); camera.position.set(SL.x + 30, 60, SL.z + 70); controls.update(); renderer.info.autoReset = false; renderer.info.reset(); renderView(scene, camera); const n = renderer.info.render.calls; renderer.info.autoReset = true; return n; })()`);
  console.log(`   (${calls} draw calls with Starline in view, lite graphics)`);
  ok(calls > 0, 'the city renders');
  if (shots) { await E(`W.t = 0.35`); await page.waitForTimeout(2500); await page.screenshot({ path: join(OUT, 'starline-day.png') }); await E(`W.t = 0.62`); await page.waitForTimeout(2500); await page.screenshot({ path: join(OUT, 'starline-night.png') }); console.log('  saved tests/out/starline-*.png'); }

  // a save and a reload keep it open
  await E(`saveNow()`);
  await page.reload();
  await page.waitForFunction(() => window.__g && window.__g.ev('typeof W !== "undefined" && W.people.length > 0 && typeof camera !== "undefined"'), null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  ok(await E(`cityOpen() && !!cityGroup && residentCount() <= POP_CAP && !!SHOPS.trucks`), 'after a reload Starline is still there');
} catch (e) {
  console.log(' FAIL ', e.message); failed++;
}
ok(!errors.length, 'no page errors' + (errors.length ? ':\n    ' + errors.join('\n    ') : ''));
await browser.close();
process.exit(failed ? 1 : 0);
