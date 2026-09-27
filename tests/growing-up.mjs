// npm test
// Growing up: a newborn is a baby that naps or rides in a parent's arms, then a toddler
// holding hands, a kid who plays, a teenager, and at last a grown-up with a job.
// Kids stay out of jobs, romance and crime, and old saves move born residents to their real age.
import { openGame } from './lib.mjs';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond === true ? '  ok ' : ' FAIL'}  ${what}${cond === true || cond === false ? '' : ` (${cond})`}`); if (cond !== true) failed++; };

const { browser, page, E, errors } = await openGame();
try {
  await E(`(() => { W.meeting = null; W.meetingDay = W.day; W.t = 0.3; W.weather = 'clear'; cfg.cutscenes = false; W.event = null; })()`);
  // two married grown-ups with jobs, and their baby
  await E(`(() => {
    const a = birth(), b = birth(); for (const p of [a, b]) { p.grow = 1; p.job = 'mart'; p.hunger = 0; W.people.push(p); buildKin(p); }
    a.partner = b.id; b.partner = a.id; a.married = b.married = true;
    const k = birth(a, b); W.people.push(k); buildKin(k);
    window.__fam = { a: a.id, b: b.id, k: k.id };
  })()`);
  const K = `person(window.__fam.k)`, A = `person(window.__fam.a)`, B = `person(window.__fam.b)`;
  ok(await E(`${K}.stage === 'baby' && ${K}.grow < 0.3 && stageLabel(${K}).startsWith('👶 baby')`), 'a newborn is a baby');
  ok(await E(`(() => { const k = ${K}; k.task = null; k.inside = false; plan(k); return k.task.kind === 'nap' && k.inside && !canChat(k); })()`), 'a baby naps at home and does not chat');
  ok(await E(`(() => { const k = ${K}; setTask(k, 'stroll', 'plaza', [5, 5]); return k.task.kind === 'nap' && k.inside && !k.path.length; })()`), 'nobody can send a baby walking across town');
  ok(await E(`meshes.get(${K}.id).root.scale.x < meshes.get(${A}.id).root.scale.x * 0.6 && meshes.get(${K}.id).head.scale.x > 1.2`), 'a baby is small with a big head');

  // a parent comes home to pick the baby up
  ok(await E(`(() => { const a = ${A}, k = ${K}; a.workedToday = true; a.inside = false; a.state = 'free'; let kind; for (let i = 0; i < 40 && kind !== 'fetchkid'; i++) { a.task = null; a.hunger = 0; plan(a); kind = a.task?.kind; } if (kind !== 'fetchkid') return false; a.path = []; startDo(a); return k.task.kind === 'carried' && k.task.who === a.id && !k.inside && doing(k) === 'in ' + a.name + "'s arms"; })()`), 'a parent picks the baby up from home');
  ok(await E(`(() => { const a = ${A}, k = ${K}; a.task = null; setTask(a, 'stroll', 'park', TOWN.park.spot); for (let i = 0; i < 60; i++) step(0.1); return k.task.kind === 'carried' && Math.hypot(k.x - a.x, k.z - a.z) < 0.01 && !k.inside && Number.isFinite(k.x); })()`), 'the baby rides along in their arms');
  ok(await E(`(() => { const a = ${A}, k = ${K}; k.hunger = 0.9; for (let i = 0; i < 400 && k.hunger > 0.5; i++) carryStep(k, 0.1); return k.hunger < 0.2; })()`), 'the parent feeds the baby when it gets hungry');
  ok(await E(`(() => { const a = ${A}, k = ${K}; a.task = null; a.workedToday = false; W.t = 0.1; a.hunger = 0; plan(a); const r = a.task.kind === 'dropkid'; a.path = []; startDo(a); W.t = 0.3; return r && k.task.kind === 'nap' && k.inside; })()`), 'before work the parent puts the baby down for a nap');
  ok(await E(`(() => { const a = ${A}, k = ${K}; a.task = { kind: 'fetchkid', phase: 'do', kid: k.id }; a.inside = false; growStart(a, 'fetchkid'); const held = k.task.kind === 'carried'; W.t = 0.62; a.task = null; setTask(a, 'home', homeKey(a)); a.path = []; startDo(a); step(0.1); const r = held && k.task.kind === 'home' && k.inside; W.t = 0.3; return r; })()`), 'at bedtime the baby goes to bed with the parent');

  // growing up, one stage at a time
  const grow = (d) => E(`(() => { const k = ${K}; W.day = k.bornDay + ${d}; growUp(k); return k.stage; })()`);
  ok(await grow(3) === 'baby', 'still a baby on day 3');
  ok(await grow(4) === 'toddler' && await E(`W.log.some((e) => /took their first steps/.test(e.text)) && ${A}.past.concat(${A}.today).some((m) => /first steps/.test(m.text))`), 'on day 4 the baby takes their first steps and the parents remember it');
  ok(await E(`(() => { const k = ${K}; k.inside = false; k.state = 'free'; const kinds = new Set(); for (let i = 0; i < 40; i++) { k.task = null; k.hunger = 0.1; W.t = 0.3; plan(k); kinds.add(k.task?.kind); } return [...kinds].every((x) => ['visit', 'play', 'nap'].includes(x)) && kinds.has('play') || [...kinds].join(); })()`), 'a toddler plays, naps and follows a parent around');
  ok(await E(`(() => { const a = ${A}, k = ${K}; a.inside = false; a.task = null; a.state = 'free'; k.inside = false; k.task = null; k.state = 'free'; k.x = a.x + 1; k.z = a.z; let got = false; for (let i = 0; i < 80 && !got; i++) { a.task = null; plan(a); got = k.task?.kind === 'walkwith' && k.task.lead === a.id && k.task.hands; } return got; })()`), 'a parent takes the toddler for a walk, holding hands');
  ok(await E(`(() => { const k = ${K}; bubble(k, '', 0); const a = ${A}; return typeof toddlerChat === 'function' && (async () => { k.state = a.state = 'free'; await toddlerChat(k, a); return a.today.some((m) => m.tag === 'talk' && m.who === k.name && /said "/.test(m.text)); })(); })()`), 'toddlers chat with a word and a smile, no model needed');
  ok(await grow(8) === 'kid', 'on day 8 they are a kid');
  ok(await E(`(() => { const k = ${K}; k.inside = false; k.state = 'free'; let play = 0, work = 0; for (let i = 0; i < 60; i++) { k.task = null; k.hunger = 0.1; W.t = 0.1; plan(k); if (k.task?.kind === 'play') play++; if (k.task?.kind === 'work') work++; } return play > 10 && !work && !k.job; })()`), 'a kid plays and never goes to work');
  ok(await grow(15) === 'teen', 'on day 15 they are a teenager');
  ok(await E(`(() => { const k = ${K}; return !crimeAble(k) && !victimAble(k, false) && !flingAble(k) && k.grow < 0.8 && ageNote(k).includes('too young for dating') && ageNote(k, false).includes('Nothing romantic'); })()`), 'teens stay out of crime, flings and romance, and the models are told');
  ok(await E(`(() => { const k = ${K}; for (let i = 0; i < 20; i++) { const c = courtCrowd([], 30, 30); if (c.jury.includes(k.id) || c.gallery.includes(k.id)) return false; } return true; })()`), 'teens are never picked for a jury or the court gallery');
  ok(await grow(22) === 'adult' && await E(`${K}.grow === 1 && !!${K}.job && W.log.some((e) => /grew up and started work/.test(e.text)) && Math.abs(meshes.get(${K}.id).head.scale.x - 1) < 1e-6`), 'on day 22 they grow up, get a job and an adult body');

  // saves from before this update
  ok(await E(`(() => {
    const a = ${A}, b = ${B};
    const y = birth(a, b); y.grow = 1; delete y.stage; y.job = 'cafe'; y.bornDay = W.day - 6; W.people.push(y); buildKin(y);
    const m = birth(a, b); m.grow = 1; delete m.stage; m.job = 'garden'; m.bornDay = W.day - 9; W.people.push(m); buildKin(m);
    const q = W.people.find((p) => !p.partner && !p.parents.length && p !== a && p !== b && !isRealish(p)); m.partner = q.id; q.partner = m.id;
    W.added.lifeStages = false; growUpBoot();
    const r = y.stage === 'toddler' && !y.job && y.grow < 1 && m.stage === 'adult' && m.job === 'garden' && (W.updates || []).some((u) => /Babies are babies now/.test(u.text));
    window.__young = y.id; m.partner = q.partner = null; return r;
  })()`), 'an old save moves a 6-day-old back to toddler, but someone already dating stays grown up');

  // a full day with little ones around, then a reload
  ok(await E(`(() => { const baby = birth(${A}, ${B}); W.people.push(baby); buildKin(baby); window.__baby = baby.id; W.t = 0.25; for (let i = 0; i < 1500; i++) step(0.2); return W.people.every((p) => Number.isFinite(p.x) && Number.isFinite(p.z)) && person(window.__baby).stage === 'baby'; })()`), 'a busy stretch of day with a baby and a toddler runs clean');
  await E(`saveNow()`);
  await page.reload();
  await page.waitForFunction(() => window.__g && window.__g.ev('typeof W !== "undefined" && W.people.length > 0 && typeof camera !== "undefined"'), null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  ok(await E(`W.people.some((p) => p.stage === 'baby') && W.people.some((p) => p.stage === 'toddler') && W.added.lifeStages`), 'after a reload the little ones are still little');

} finally {
  if (errors.length) { console.log(' FAIL  page errors:\n   ' + errors.join('\n   ')); failed++; }
  await browser.close();
}
if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\ngrowing up: all good');
