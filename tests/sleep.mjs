// npm test
// Bedtimes and wake times, what short nights do, and residents never freezing on a model that won't answer.
import { openGame } from './lib.mjs';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond === true ? '  ok ' : ' FAIL'}  ${what}${cond === true || cond === false ? '' : ` (${cond})`}`); if (cond !== true) failed++; };

const { browser, page, E, errors } = await openGame();
try {
  await E(`(() => {
    W.meeting = null; W.meetingDay = W.day; W.t = 0.3; cfg.cutscenes = false; W.event = null;
    brainCfg.key = 'test-key'; aiDown = ''; window.__calls = [];
    llm = async (input, opts = {}) => { const text = typeof input === 'string' ? input : input.map((m) => m.content).join('\\n'); window.__calls.push(text); return { say: 'Hey.', thought: '', action: 'chat' }; };
    const ad = W.people.filter((p) => stageOf(p) === 'adult' && !p.visitor && !p.isClaude);
    ad[0].sleep = { type: 'lark', bed: 21, wake: 6.25, need: 8, debt: 0, last: 0 };
    ad[1].sleep = { type: 'owl', bed: 25, wake: 9.5, need: 8, debt: 0, last: 0 };
    window.__lark = ad[0].id; window.__owl = ad[1].id;
  })()`);

  ok(await E(`W.people.every((p) => p.sleep && Number.isFinite(p.sleep.bed) && Number.isFinite(p.sleep.wake)) && W.added.sleep1 === true`), 'everyone has a bedtime and a wake time, old towns included');
  ok(await E(`(() => { const s = W.people.slice(0, 20).map((p) => newSleep({ ...p, stage: 'adult', grow: 1 })); return new Set(s.map((x) => x.bed)).size > 3 && s.every((x) => x.bed >= 20.5 && x.bed <= 25.5 && x.wake >= 6 && x.wake <= 10); })()`), 'bedtimes and wake times differ from person to person');
  ok(await E(`(() => { const p = person(window.__lark), k = { ...p, stage: 'kid', room: 1 }; return bedHour(k) < 21 && bedHour({ ...p, stage: 'toddler' }) < bedHour(k); })()`), 'parents put kids to bed early, toddlers earliest');

  // 9:50 pm: the early bird is asleep, the night owl isn't
  ok(await E(`(() => {
    W.t = 0.66; const L = person(window.__lark), O = person(window.__owl);
    for (const p of [L, O]) { p.inside = true; p.task = { kind: 'home', phase: 'do' }; p.state = 'free'; }
    return isAsleep(L) && !isAsleep(O) && doing(O) === 'up late at home';
  })()`), 'at 9:50 pm the early bird is asleep and the night owl is up');
  ok(await E(`(() => { W.t = 0.64; const O = person(window.__owl), L = person(window.__lark); for (const p of [O, L]) { p.inside = false; p.task = null; p.path = []; plan(p); } return O.task?.kind !== 'home' && O.task?.night === true && L.task?.kind === 'home'; })()`), 'after dark the night owl goes out while the early bird heads home');
  ok(await E(`(() => { const O = person(window.__owl); O.task.phase = 'do'; O.state = 'free'; return canChat(O) && !canChat(person(window.__lark)); })()`), 'night owls out late can run into each other');

  // the morning: the early bird is up first
  ok(await E(`(() => {
    W.t = 0.04; const L = person(window.__lark), O = person(window.__owl);
    for (const p of [L, O]) { p.inside = true; p.task = { kind: 'home', phase: 'do' }; p.state = 'free'; p.path = []; }
    for (let i = 0; i < 3; i++) { now += 0.05; step(0.001); }
    return !L.inside && O.inside && isAsleep(O);
  })()`), 'at 7 am the early bird is out and the night owl is still asleep');

  // a short night catches up with them
  ok(await E(`(() => {
    const O = person(window.__owl); O.inside = true; O.task = { kind: 'home', phase: 'do' };
    O.sleep.inBed = true; O.sleep.fellAt = sleepAbsH() - 4; O.sleep.debt = 1; O.sleep.over = 0;
    sleepWoke(O);
    return O.sleep.debt >= 4 && O.sleep.last === 4 && /exhausted/.test(sleepNote(O)) && /Exhausted/.test(sleepDetailHtml(O));
  })()`), 'four hours of sleep leaves them exhausted, and it shows on their page');
  ok(await E(`(async () => { const O = person(window.__owl), L = person(window.__lark); await aiLine(O, L, [], 'Hi.'); const c = window.__calls.slice(-1)[0]; return c.includes('SLEEP:') && c.includes('night owl') && c.includes('exhausted'); })()`), 'how they slept goes into what they say');
  ok(await E(`(() => { const O = person(window.__owl); O.job = O.job || Object.keys(JOBS)[0]; O.lateToday = W.day; return sleepLateWork(O, 20) === 15 && O.lateToday === 0; })()`), 'oversleeping costs them part of a day’s pay');
  ok(await E(`(() => { const O = person(window.__owl); O.sleep.napDay = W.day; O.sleep.napUntil = 0.5; W.t = 0.4; O.inside = true; O.task = { kind: 'home', phase: 'do' }; const a = isAsleep(O) && doing(O) === 'napping'; W.t = 0.51; const b = !isAsleep(O); O.sleep.napUntil = 0; return a && b; })()`), 'tired residents nap in the afternoon and wake up after');

  // a model that never answers doesn't freeze anyone
  await E(`(() => { W.t = 0.3; llm = () => new Promise(() => {}); })()`);
  const pair = await E(`(() => { const [a, b] = W.people.filter((p) => stageOf(p) === 'adult' && !p.visitor && !p.isClaude && !p.away).slice(2, 4); for (const p of [a, b]) { p.inside = false; p.task = null; p.state = 'free'; } encounter(a, b).catch(() => {}); return [a.id, b.id]; })()`);
  await page.waitForTimeout(1500);
  const talking = await E(`${JSON.stringify(pair)}.some((id) => person(id).state === 'talk')`);
  await page.waitForFunction((ids) => window.__g.ev(`${JSON.stringify(ids)}.every((id) => person(id).state !== 'talk')`), pair, { timeout: 60000 }).catch(() => {});
  ok(await E(`${JSON.stringify(pair)}.every((id) => person(id).state !== 'talk')`) && talking === true, 'when the model never answers, the two talking get free again');
} finally {
  if (errors.length) { console.log(' FAIL  page errors:\n   ' + errors.join('\n   ')); failed++; }
  await browser.close();
}
if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\nsleep: all good');
