// npm test
// Starline, the city quarter: the plans go up at a milestone, the Creator pays for it,
// the town argues, a crew of residents builds it, a ribbon cutting opens it, it gives
// out its jobs, and it never lets the town pass 25 people.
import { openGame, OUT } from './lib.mjs';
import { join } from 'node:path';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond ? '  ok ' : ' FAIL'}  ${what}`); if (!cond) failed++; };
const shots = process.argv.includes('--shots');

const { browser, page, E, errors } = await openGame();
try {
  await E(`(() => { W.meeting = null; W.meetingDay = W.day; W.t = 0.3; W.weather = 'clear'; cfg.cutscenes = false; })()`);
  ok(await E(`cityStage() === 'none' && !cityOpen() && !cityGroup && roomCount() === MAX_POP`), 'a brand new town has no Starline yet');
  ok(await E(`/plans go up when 15 people live here or on day 40/.test(cityBuildHtml()) && !SHOPS.trucks`), 'the Build tab says when the plans go up');
  ok(await E(`!Object.keys(JOBS).filter((k) => JOBS[k].city).some(jobOpen) && Array.from({ length: 200 }, randomJob).every((k) => !JOBS[k].city)`), 'nobody gets a city job before it opens');

  // a town saved when Starline still opened by itself
  ok(await E(`(() => { W.city = { open: true, day: W.day, film: 1, market: false }; W.added.starlineBuild = false; cityMigrate(); const r = cityStage() === 'plans' && !cityOpen() && (W.updates || []).some((u) => /building project/.test(u.text)); W.city = undefined; return r; })()`), 'an old save with an empty Starline goes back to plans');
  ok(await E(`(() => { const p = W.people.find((q) => !isRealish(q)); const job = p.job; p.job = 'radio'; W.city = { open: true, day: W.day, film: 1, market: false }; W.added.starlineBuild = false; cityMigrate(); const r = cityStage() === 'open' && cityOpen(); p.job = job; W.city = undefined; return r; })()`), 'an old save where someone works in Starline keeps it open');

  // grown-ups with ordinary jobs, so there are people to argue, build and get hired
  await E(`(() => { for (let i = 0; i < 6; i++) { const k = birth(); k.grow = 1; k.job = pick(['mart', 'cafe', 'garden', 'builder']); W.people.push(k); buildKin(k); } })()`);
  const real = await E(`JSON.stringify(W.people.filter(isRealish).map((p) => [p.id, p.job]))`);
  await E(`(() => { W.day = Math.max(W.day, 40); cityDaily(); })()`);
  ok(await E(`cityStage() === 'plans' && !cityOpen() && !cityGroup && !!slBoard && !SHOPS.trucks && W.log.some((e) => /Plans for <b>Starline<\\/b>/.test(e.text))`), 'on day 40 the plans go up, but nothing is built');
  ok(await E(`W.people.filter((p) => !p.visitor && p.grow >= 0.6).every((p) => typeof p.slView === 'number' && (p.slView >= 0 ? SL_PRO : SL_CON)[p.slWhy])`), 'everyone has an opinion and a reason');
  ok(await E(`(() => { W.creator.coins = 0; mats().wood = 0; return /don't have/.test(applyCmd({ t: 'city', a: 'give', what: 'wood', n: 'all' })) && !W.city.fund.wood; })()`), 'you cannot give supplies you do not have');
  ok(await E(`(() => { W.creator.coins = 500; applyCmd({ t: 'city', a: 'give', what: 'coins', n: 100 }); return W.city.fund.coins === 100 && W.creator.coins === 400 && cityStage() === 'plans' && /100 of 3000/.test(cityBuildHtml()); })()`), 'coins go in a bit at a time');

  // a week of arguing about it
  await E(`(() => { const npc = W.people.filter((p) => slNpc(p) && p.grow >= 1); npc.slice(0, 3).forEach((p) => { p.slView = -0.8; p.slWhy = 'noise'; }); npc.slice(3, 6).forEach((p) => { p.slView = 0.8; p.slWhy = 'jobs'; }); for (let i = 0; i < 12; i++) { W.day++; cityProjectDaily(); } })()`);
  ok(await E(`W.log.filter((e) => /Starline/.test(e.text)).length >= 5`), 'the town argues about it in the diary');
  ok(await E(`(() => { const L = person(W.city.lead); return (!L || slNpc(L)) && W.city.petition.every((id) => !isRealish(person(id))); })()`), 'petitions are only ever led and signed by generated residents');

  // paying it off, the hearing and the first shovel
  await E(`(() => { cfg.cutscenes = true; W.meeting = { hold: true }; W.creator.coins = 5000; const M = mats(); for (const k of Object.keys(MATS)) M[k] = 100; for (const k of Object.keys(SL_COST)) applyCmd({ t: 'city', a: 'give', what: k, n: 'all' }); })()`);
  ok(await E(`cityStage() === 'build' && !W.city.broke && CUT.queue.some((S) => S.title === 'The Starline Hearing')`), 'paying it off calls a hearing at the fountain');
  ok(await E(`(() => { const S = CUT.queue.find((x) => x.title === 'The Starline Hearing'); CUT.queue.splice(CUT.queue.indexOf(S), 1); const L = S.lines.find((l) => l.choice); const more = L.choice.pick('quiet', S); more.forEach((l) => l.run && l.run(S)); S.onEnd(S, false); W.meeting = null; return W.city.promise === 'quiet' && W.city.broke && more.some((l) => /first shovel/.test(l.text || '')); })()`), 'the Creator makes a promise and the ground breaks');
  ok(await E(`cityLand() && !cityOpen() && !!cityGroup && !!slSite && !slBoard && W.city.progress >= 0.06 && roomCount() === MAX_POP && !SHOPS.trucks`), 'land rises and the site goes up, but Starline is not open');
  ok(await E(`W.city.crew.length >= 1 && W.city.crew.every((id) => !isRealish(person(id)))`), 'a crew of generated residents signs up');
  ok(await E(`JSON.stringify(W.people.filter(isRealish).map((p) => [p.id, p.job]))`) === real, 'real people keep their jobs');

  // the crew at work
  ok(await E(`(() => { const p = person(W.city.crew[0]); W.t = 0.3; W.weather = 'clear'; W.city.pause = null; W.event = null; let kind = null; for (let i = 0; i < 20 && kind !== 'build'; i++) { p.task = null; p.workedToday = false; p.hunger = 0; plan(p); kind = p.task?.kind; } const fine = p.path.every((q) => Number.isFinite(q.x) && Number.isFinite(q.z)); const g0 = W.city.progress; for (let i = 0; i < 10; i++) { cityStart(p, 'build'); cityFinish(p, 'build'); } const r = kind === 'build' && fine && W.city.progress > g0 + 0.03 && doing(p) !== 'wandering'; p.task = null; return r; })()`), 'the crew goes to the site and builds');
  ok(await E(`(() => { const p = person(W.city.crew[0]); const c0 = p.coins + (W.pantry || 0); W.t = 0.55; p.workedToday = false; cityFinish(p, 'build'); W.t = 0.3; return p.workedToday && p.coins + (W.pantry || 0) > c0; })()`), 'a shift ends with pay');
  ok(await E(`(() => { W.city.progress = 0.3; slShown = 0.3; slApplyParts(); const t = slParts.find((P) => P.win === 'tower'), s = slParts.find((P) => P.win === 'studio'); return t.o.visible && t.o.scale.y > 0.3 && t.o.scale.y < 1 && !s.o.visible && slCars.every((c) => !c.visible) && !slTrain.visible; })()`), 'buildings rise one after another');
  ok(await E(`(() => { const ids = W.people.filter((p) => slNpc(p) && p.grow >= 1 && !W.city.crew.includes(p.id)).slice(0, 3).map((p) => p.id); W.city.petition = ids; W.city.rally = W.day; W.t = 0.1; const p = person(ids[0]); p.task = null; p.rallied = null; p.hunger = 0; plan(p); const r = p.task?.kind === 'rally' && p.path.every((q) => Number.isFinite(q.x) && Number.isFinite(q.z)); p.task = null; W.t = 0.3; return r; })()`), 'petition signers rally at the bridge');
  ok(await E(`(() => { const M = mats(); M.wood = 10; M.stone = 10; const g0 = W.city.progress; applyCmd({ t: 'city', a: 'help' }); const again = applyCmd({ t: 'city', a: 'help' }); return W.city.progress > g0 + 0.04 && /enough help/.test(again) && M.wood === 7; })()`), 'the Creator can lend a hand once a day');
  ok(await E(`(() => { const g0 = W.city.progress; W.city.pause = null; W.weather = 'clear'; cityOfflineDay(); return W.city.progress > g0; })()`), 'the crew keeps building while the box is off');

  // halfway, a reload keeps the site
  await E(`saveNow()`);
  await page.reload();
  await page.waitForFunction(() => window.__g && window.__g.ev('typeof W !== "undefined" && W.people.length > 0 && typeof camera !== "undefined"'), null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  ok(await E(`cityStage() === 'build' && W.city.broke && !!cityGroup && !!slSite && W.city.progress > 0.3 && !cityOpen()`), 'after a reload the building site is still there');
  if (shots) { await E(`(() => { W.t = 0.32; W.city.progress = 0.55; closeInterior && interior && closeInterior(); camGoal = { x: SL.x, z: SL.z + 4, r: 62 }; })()`); await page.waitForTimeout(4000); await page.screenshot({ path: join(OUT, 'starline-building.png') }); console.log('  saved tests/out/starline-building.png'); }

  // finished, the ribbon cutting, and it opens
  await E(`(() => { cfg.cutscenes = true; W.meeting = { hold: true }; W.city.pause = null; slAdvance(1); })()`);
  ok(await E(`cityStage() === 'ready' && W.log.some((e) => /topped out/.test(e.text)) && CUT.queue.some((S) => S.title === 'Starline Opens')`), 'when it is finished the ribbon cutting is next');
  ok(await E(`(() => { const S = CUT.queue.find((x) => x.title === 'Starline Opens'); CUT.queue.splice(CUT.queue.indexOf(S), 1); S.lines.forEach((l) => l.run && l.run(S)); S.onEnd(S, false); W.meeting = null; return cityOpen() && !!SHOPS.trucks && FOODS.some((f) => f.shop === 'trucks'); })()`), 'the ribbon is cut and Starline opens');
  ok(await E(`W.people.filter((p) => JOBS[p.job]?.city).length >= 1`), 'someone takes a job in Starline');
  ok(await E(`JSON.stringify(W.people.filter(isRealish).map((p) => [p.id, p.job]))`) === real, 'real people still keep their jobs');
  ok(await E(`W.log.some((e) => /Starline<\\/b> is open/.test(e.text)) && (W.updates || []).some((u) => /Starline opened/.test(u.text))`), 'the diary and the update log announce it');
  await page.waitForFunction(() => window.__g.ev('!slSite'), null, { timeout: 40000 }).catch(() => {});
  ok(await E(`!slSite && slParts.length === 0 && !!slTrain.visible`), 'the scaffolding and cranes come down');
  ok(await E(`windowMats.length === POP_CAP && camSpots().some((s) => s[0] === 'starline') && (!gfxOn() || WATER_ISLES.some((w) => w[0] === SL.x))`), 'the tower windows, camera spot and shoreline are set up');
  await E(`(() => { cfg.cutscenes = false; cityBoot(); })()`);
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
