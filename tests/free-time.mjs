// npm test
// Work is a shift, people get days off, and they wander off somewhere with their free time.
import { openGame } from './lib.mjs';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond === true ? '  ok ' : ' FAIL'}  ${what}${cond === true || cond === false ? '' : ` (${cond})`}`); if (cond !== true) failed++; };

const { browser, E, errors } = await openGame();
try {
  await E(`(() => { W.meeting = null; W.meetingDay = W.day; cfg.cutscenes = false; W.event = null; brainCfg.key = ''; })()`);
  ok(await E(`(() => { const p = W.people.find((q) => q.job && !SHIFT_KEEP.includes(q.job) && stageOf(q) === 'adult'); const was = p.job; p.job = LAB_JOBS[0]; W.t = 0.04; p.task = { kind: 'work', phase: 'do' }; const end = workShiftEnd(p); p.job = was; p.task = null; return (end > 0.18 && end < 0.24) || end; })()`), 'a lab shift that starts at 7 am ends around lunch, not at 4 pm');
  ok(await E(`(() => { const p = W.people.find((q) => q.job && stageOf(q) === 'adult'); const was = p.job; p.job = 'doctor'; W.t = 0.04; p.task = { kind: 'work', phase: 'do' }; const end = workShiftEnd(p); p.job = was; p.task = null; return end === workUntil('doctor'); })()`), 'the clinic keeps its hours');
  ok(await E(`(() => { const p = W.people.find((q) => q.job && !SHIFT_KEEP.includes(q.job) && stageOf(q) === 'adult' && q.room >= 0); const d = W.day; W.day = 5 - (p.room % 5); p.workedToday = false; p.inside = false; p.task = null; p.path = []; W.t = 0.1; plan(p); const r = p.offDay === W.day && p.task?.kind !== 'work'; W.day = d; p.workedToday = false; return r; })()`), 'on their day off they skip work and do something else');
  ok(await E(`(() => { const p = W.people.find((q) => stageOf(q) === 'adult' && !q.visitor); W.t = 0.35; p.inside = false; p.task = null; p.path = []; p.been = { plaza: W.day, pier: W.day, park: W.day, garden: W.day, downtown: W.day }; let far = 0; for (let i = 0; i < 20; i++) { p.task = null; explorePlan(p); if (!['plaza', 'pier', 'park', 'garden', 'downtown'].includes(p.dest)) far++; } return far >= 12 || far; })()`), 'exploring favors places they have not been to lately');
  ok(await E(`(() => { const p = W.people.find((q) => stageOf(q) === 'adult' && !q.visitor); p.task = { kind: 'stroll', phase: 'go', explore: true }; p.at = 'beach'; p.path = []; startDo(p); return p.been.beach === W.day && p.busyUntil > now; })()`), 'they stay a while where they wander to, and remember going');
} finally {
  if (errors.length) { console.log(' FAIL  page errors:\n   ' + errors.join('\n   ')); failed++; }
  await browser.close();
}
if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\nfree time: all good');
