// ============================================================
// SLEEP: everyone keeps their own bedtime and wake time, and lives with what that does to them
// ============================================================
// p.sleep = { type: lark|mid|owl, bed, wake (clock hours, bed can pass midnight: 25 = 1 am), need,
// debt (hours short), last (hours slept last night) }. Early birds are up at dawn, night owls stay
// out late and meet each other at the fountain while the town sleeps. Parents put kids to bed.
// Too little sleep shows: yawning, coffee runs, afternoon naps, oversleeping and getting to work
// late, a short temper (it goes into their prompts). Couples on different clocks feel it. Worry
// keeps people up, and the ones lying awake text, scroll and post at 1 am.
const SLEEP_TYPES = { lark: 'early bird', mid: 'regular sleeper', owl: 'night owl' };
const sleepHourT = (h) => (h - 6) / 24; // clock hour (6 to 30) to W.t
const sleepTHour = (t) => 6 + t * 24;
const sleepAbsH = () => W.day * 24 + sleepTHour(W.t);
const sleepQ15 = (h) => Math.round(h * 4) / 4;
function fmtClock(h) { h = ((h % 24) + 24) % 24; const hh = Math.floor(h), mm = Math.round((h - hh) * 60) % 60; return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`; }
function newSleep(p) {
  const st = stageOf(p), r = rand();
  const type = st === 'teen' ? (r < 0.6 ? 'owl' : 'mid') : r < 0.28 ? 'lark' : r < 0.58 ? 'owl' : 'mid';
  const R = { lark: [[20.75, 21.75], [6, 6.5]], mid: [[22, 23.25], [6.75, 7.75]], owl: [[24, 25.5], [8.25, 9.75]] }[type];
  const span = ([a, b]) => sleepQ15(a + rand() * (b - a));
  return { type, bed: span(R[0]), wake: span(R[1]), need: sleepQ15(7 + rand() * 1.75), debt: 0, last: 0 };
}
function sleepOf(p) { if (!p.sleep || !Number.isFinite(p.sleep.bed)) p.sleep = newSleep(p); return p.sleep; }
// parents decide for little ones; teens drift late on their own
function bedHour(p) {
  const S = sleepOf(p), st = stageOf(p);
  const base = st === 'baby' || st === 'toddler' ? 19.5 : st === 'kid' ? 20.25 + (p.room % 3) * 0.25 : st === 'teen' ? Math.min(S.bed, 24.5) : S.bed;
  return base + (S.late || 0);
}
function wakeHour(p) {
  const S = sleepOf(p), st = stageOf(p);
  const base = st === 'baby' || st === 'toddler' ? 6.5 : st === 'kid' ? 7 : st === 'teen' ? Math.max(S.wake, 7.75) : S.wake;
  return base + (S.over || 0);
}
const bedT = (p) => sleepHourT(bedHour(p));
const wakeT = (p) => sleepHourT(wakeHour(p));
// when they head home for the night: most people by 8:30 pm, night owls (and a teen sneaking out) later
function homeByT(p) {
  const S = sleepOf(p), st = stageOf(p);
  const late = (S.type === 'owl' && st === 'adult' && !p.visitor) || (S.sneak === W.day && st === 'teen');
  return Math.min(bedT(p) - 0.02, late ? 0.76 : 0.6);
}
const napping = (p) => !!(p.sleep?.napUntil && W.t < p.sleep.napUntil && p.sleep.napDay === W.day);
const asleepTime = (p) => W.t >= bedT(p) || W.t < wakeT(p) || napping(p);
function isAsleep(p) { return !!p && p.inside && p.task?.kind === 'home' && asleepTime(p); }
const nightOut = (p) => !!p.task?.night && ['stroll', 'visit'].includes(p.task.kind);
const sleepTired = (p) => (p.sleep?.debt || 0);
function sleepPace(p) { const d = sleepTired(p); return d >= 4 ? 0.86 : d >= 2 ? 0.94 : 1; }

// ---- the evening: who stays up, who can't sleep, who sneaks out ----
function sleepEvening(p) {
  const S = sleepOf(p); if (S.planned === W.day) return; S.planned = W.day;
  S.late = 0; S.why = '';
  if (isBaby(p) || p.visitor) return;
  const st = stageOf(p), worst = [...(p.today || [])].filter((m) => m.weight >= 3).slice(-1)[0];
  const low = (p.mood || 0) < -0.4;
  if (st === 'adult' && (worst || low) && rand() < (worst ? 0.45 : 0.3)) {
    S.late = sleepQ15(0.75 + rand() * 1.75); S.why = worst ? `couldn't stop thinking about it: ${fitLine(worst.text, 90)}` : 'lay awake for ages';
  } else if (st === 'adult' && rand() < 0.08) { S.late = sleepQ15(0.5 + rand()); S.why = 'stayed up scrolling'; }
  if (st === 'teen' && S.type === 'owl' && rand() < 0.1 && W.people.some((q) => q !== p && stageOf(q) === 'teen' && !q.away)) { S.sneak = W.day; S.why = 'snuck out'; }
}
// ---- falling asleep and waking up ----
function sleepFell(p) {
  const S = sleepOf(p); S.inBed = true; S.fellAt = sleepAbsH();
  if (!napping(p) && stageOf(p) !== 'baby' && S.debt >= 3 && rand() < 0.5) S.over = sleepQ15(0.5 + rand() * (stageOf(p) === 'adult' ? 1.25 : 0.5));
}
function sleepWoke(p) {
  const S = sleepOf(p); S.inBed = false;
  const slept = S.fellAt ? clamp(sleepAbsH() - S.fellAt, 0, 14) : 0; S.fellAt = 0;
  if (S.napDay === W.day && S.napUntil) { S.napUntil = 0; S.debt = Math.max(0, S.debt - slept * 0.9); if (rand() < 0.5) bubble(p, pick(['Okay. Human again.', 'Best nap of my life.', 'How long was I out?']), 2.2); return; }
  if (!slept) { S.over = 0; return; }
  const st = stageOf(p), need = st === 'adult' ? S.need : st === 'teen' ? 9 : 10;
  let short = need - slept, night = '';
  // little kids wake their parents up
  const little = st === 'adult' && kidsOf(p).find((k) => ['baby', 'toddler'].includes(stageOf(k)));
  if (little && rand() < (isBaby(little) ? 0.7 : 0.35)) { const lost = sleepQ15(0.5 + rand()); short += lost; night = `up in the night with ${little.name}`; remember(p, `Up in the night with ${little.name}. Running on about ${Math.round((slept - lost) * 2) / 2} hours.`, 1, 'sleep', little.name); }
  S.debt = clamp(S.debt + short * (short > 0 ? 1 : 0.6), 0, 10);
  S.last = Math.round((slept - (little && night ? 1 : 0)) * 2) / 2; S.lastWhy = night || S.why || ''; S.lastDay = W.day;
  if (S.over && p.job && !p.workedToday && st === 'adult') { p.lateToday = W.day; bubble(p, pick(['I overslept. I OVERSLEPT.', 'No no no, the alarm…', 'Late. So late.']), 2.6); remember(p, 'Overslept and was late for work.', 2, 'sleep'); }
  else if (S.debt >= 4) { addJoy(p, -6); if (rand() < 0.5) bubble(p, pick(['Ugh. Morning.', 'Who invented mornings.', 'I need coffee before I can speak.', 'Barely slept.']), 2.4); remember(p, `Woke up wrecked after about ${S.last} hours of sleep.`, 1, 'sleep'); }
  else if (S.debt < 0.5 && slept >= need) { addJoy(p, 3); if (rand() < 0.25) bubble(p, pick(['Slept like a rock.', 'What a sleep.', 'Good morning, world.']), 2.2); }
  if (S.why === 'snuck out') sleepCaught(p);
  S.over = 0; S.late = 0; S.why = '';
}
function sleepCaught(p) {
  const par = W.people.find((q) => (p.parents || []).includes(q.name) && !q.away);
  if (!par || rand() < 0.5) { remember(p, 'Snuck out last night and nobody found out.', 2, 'sneak'); return; }
  remember(p, `Snuck out last night and ${par.name} caught me coming back in.`, 2, 'sneak', par.name);
  remember(par, `Caught ${p.name} sneaking back in after midnight.`, 2, 'sneak', p.name);
  feel(par, p, -0.3, true); feel(p, par, -0.3, true);
  diary(`🌙 <b>${esc(p.name)}</b> snuck out last night. <b>${esc(par.name)}</b> was waiting up.`);
}
// ---- the day: coffee and naps when they're short on sleep ----
function sleepPlan(p) {
  const S = sleepOf(p), st = stageOf(p), t = W.t;
  if (st === 'baby' || st === 'toddler' || p.visitor || S.debt < 2) return false;
  if (st === 'adult' && t < 0.2 && S.coffeeDay !== W.day && purse(p) >= 1 && rand() < 0.5) { S.coffeeDay = W.day; bubble(p, pick(['Coffee. Now.', 'Caffeine, please.', "Don't talk to me yet."]), 2.2); setTask(p, 'eat', 'cafe'); return true; }
  const workDue = p.job && !p.workedToday && t < 0.24;
  if (t > 0.3 && t < 0.48 && !workDue && S.napDay !== W.day && rand() < (S.debt >= 4 ? 0.25 : 0.1)) {
    S.napDay = W.day; S.napUntil = t + 0.035 + rand() * 0.03;
    bubble(p, pick(['I need a nap.', "Can't keep my eyes open.", 'Just twenty minutes…']), 2.2);
    setTask(p, 'home', homeKey(p)); return true;
  }
  return false;
}
function sleepLateWork(p, pay) {
  if (p.lateToday !== W.day) return pay;
  p.lateToday = 0;
  if (rand() < 0.5) bubble(p, pick(['Sorry, sorry, I know.', "It won't happen again.", 'Did anyone notice?']), 2.4);
  return Math.max(1, Math.round(pay * 0.75));
}
// ---- after dark: the night owls ----
function nightPlan(p) {
  if (W.t < 0.6 || stageOf(p) === 'baby' || stageOf(p) === 'toddler') return false;
  const out = W.people.filter((q) => q !== p && !q.inside && nightOut(q) && (fscore(p, q) >= 1 || (stageOf(p) === 'teen') === (stageOf(q) === 'teen')));
  const pal = out.find((q) => stageOf(p) === 'teen' ? stageOf(q) === 'teen' : stageOf(q) === 'adult');
  if (pal && rand() < 0.5) { setTask(p, 'visit', pal.path.length ? pal.dest : pal.at, jitter([pal.x, pal.z], 1.6), { who: pal.id, night: true }); return true; }
  const r = rand();
  const [pl, sp] = r < 0.35 ? ['plaza', (() => { const a = rand() * 6.28, rr = FOUNTAIN_R + 1.2 + rand() * 3; return [Math.cos(a) * rr, Math.sin(a) * rr]; })()] : r < 0.6 ? ['pier', [(rand() - 0.5) * 1.6, 31 + rand() * 8]] : r < 0.8 ? ['beach', jitter(BEACH, 6)] : ['park', jitter(TOWN.park.spot, 5)];
  setTask(p, 'stroll', pl, sp, { night: true });
  if (rand() < 0.3) bubble(p, pick(stageOf(p) === 'teen' ? ['If my parents find out…', 'Shh.', 'This is so much better than bed.'] : ['The town is so quiet now.', 'Look at all those stars.', 'Best part of the day.', 'Everyone else is asleep. Perfect.', 'Can’t sleep. Don’t want to.']), 2.4);
  return true;
}
function sleepNightfallLine() {
  const up = W.people.filter((p) => !p.away && !p.visitor && stageOf(p) !== 'baby' && !asleepTime(p) && W.t < bedT(p));
  const owls = up.filter((p) => sleepOf(p).type === 'owl').slice(0, 3);
  return owls.length ? ` ${owls.map((p) => `<b>${esc(p.name)}</b>`).join(owls.length > 2 ? ', ' : ' and ')} ${owls.length > 1 ? 'were' : 'was'} still up.` : '';
}
// ---- the morning: couples on different clocks ----
function sleepMorning() {
  const seen = new Set();
  for (const p of W.people) {
    const q = p.partner && person(p.partner);
    if (!q || seen.has(p.id) || p.away || q.away || stageOf(p) !== 'adult' || stageOf(q) !== 'adult') continue;
    seen.add(p.id); seen.add(q.id);
    const [early, late] = bedHour(p) <= bedHour(q) ? [p, q] : [q, p], gap = bedHour(late) - bedHour(early);
    if (gap < 1.75) continue;
    if (rand() < 0.12) { // they meet in the middle
      for (const x of [early, late]) { const S = sleepOf(x); S.bed = sleepQ15(S.bed + (x === early ? 0.25 : -0.25)); }
      remember(early, `${late.name} and I are trying to go to bed at the same time.`, 1, 'sleep', late.name); remember(late, `${early.name} and I are trying to go to bed at the same time.`, 1, 'sleep', early.name);
    } else if (rand() < 0.2) {
      remember(early, p.married ? `${late.name} came to bed at ${fmtClock(bedHour(late))} again and woke me up.` : `${late.name} texted me at ${fmtClock(bedHour(late))} again. I was asleep.`, 2, 'sleep', late.name);
      remember(late, `${early.name} is always asleep by ${fmtClock(bedHour(early))}. Our nights barely overlap.`, 1, 'sleep', early.name);
      feel(early, late, -0.2, true);
    }
  }
}
// ---- every couple of seconds: who just fell asleep, who woke, kids stalling at bedtime, yawns ----
let nextSleepTick = 0;
function sleepTick() {
  if (MODE === 'remote' || now < nextSleepTick) return; nextSleepTick = now + 1.5;
  for (const p of W.people) {
    if (p.away) continue;
    const S = sleepOf(p);
    if (W.t >= 0.55 && W.t < 0.6 + 0.01) sleepEvening(p);
    const zz = isAsleep(p);
    if (zz && !S.inBed) sleepFell(p); else if (!zz && S.inBed) sleepWoke(p);
    if (p.inside || p.state !== 'free') continue;
    const st = stageOf(p), hb = homeByT(p);
    if ((st === 'kid' || st === 'teen') && W.t >= hb && W.t < hb + 0.015 && S.stall !== W.day && rand() < 0.4) {
      S.stall = W.day; bubble(p, pick(st === 'kid' ? ['Five more minutes!', "I'm not even tired!", 'But everyone else is still up!'] : ['Ugh, fine.', "It's literally so early.", "I'm not a baby."]), 2.4);
      const par = W.people.find((q) => (p.parents || []).includes(q.name) && !q.inside && !q.away && Math.hypot(q.x - p.x, q.z - p.z) < 20);
      if (par) setTimeout(() => bubble(par, pick(['Bed. Now.', 'Teeth, then bed.', 'Nice try.']), 2), 1500);
    }
    if (S.debt >= 2 && W.t < 0.55 && !(p.bubble && p.bubble.until > now) && rand() < 0.004 * S.debt) emote(p, '🥱', 2.4);
  }
}
// ---- for prompts and the resident page ----
function sleepNote(p) {
  if (!p || isBaby(p) || p.isClaude) return '';
  const S = sleepOf(p), st = stageOf(p);
  const who = st === 'adult' ? `You're ${S.type === 'mid' ? 'a regular sleeper' : `a ${SLEEP_TYPES[S.type]}`}: usually in bed around ${fmtClock(bedHour(p) - (S.late || 0))}, up around ${fmtClock(wakeHour(p) - (S.over || 0))}.` : `Your parents make you go to bed at ${fmtClock(bedHour(p))}.`;
  const last = S.lastDay === W.day && S.last ? ` Last night you got about ${S.last} hours of sleep${S.lastWhy ? ` (${S.lastWhy})` : ''}.` : '';
  const tired = S.debt >= 4 ? ' You are exhausted: foggy, slow, short-tempered, easy to tip into tears or snapping.' : S.debt >= 2 ? ' You are tired and a bit irritable.' : S.debt < 0.5 && S.lastDay === W.day ? ' You are well rested.' : '';
  const late = W.t >= 0.6 && !asleepTime(p) ? ` It's ${fmtClock(sleepTHour(W.t))} on the island${W.t > bedT(p) - 0.03 ? ' and you should be asleep' : ''}${S.why === 'snuck out' ? ', and you snuck out' : nightOut(p) ? ', and you are out late' : ''}.` : '';
  return `\nSLEEP: ${who}${last}${tired}${late}`;
}
function sleepDetailHtml(p) {
  if (isBaby(p) || p.isClaude) return '';
  const S = sleepOf(p), st = stageOf(p);
  const kind = st === 'adult' ? cap(SLEEP_TYPES[S.type]) : st === 'teen' ? 'Teen' : 'Kid';
  const state = S.debt >= 4 ? ' Exhausted.' : S.debt >= 2 ? ' Tired.' : '';
  return `<p class="hint">Sleep: ${kind}, bed ${fmtClock(bedHour(p) - (S.late || 0))}, up ${fmtClock(wakeHour(p) - (S.over || 0))}.${S.last && S.lastDay >= W.day - 1 ? ` Last night: ${S.last} h.` : ''}${state}</p>`;
}
function sleepBoot() {
  for (const p of W.people) sleepOf(p);
  W.added = W.added || {}; if (W.added.sleep1) return; W.added.sleep1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'Everyone has their own bedtime and wake time now. Early birds are up at dawn; night owls stay out past midnight and run into each other at the fountain. Parents put the kids to bed. Short nights catch up with people: yawning, coffee runs, naps, oversleeping, a short fuse. Worry keeps some up, and they text and scroll at 1 am.');
}
// one line for the short resident card used by texts, posts and storylines
function sleepCard(p) {
  if (!p || isBaby(p) || p.isClaude) return '';
  const S = sleepOf(p), d = S.debt >= 4 ? ' Running on almost no sleep: foggy and short-fused.' : S.debt >= 2 ? ' Tired today.' : '';
  return ` ${stageOf(p) === 'adult' ? `A ${SLEEP_TYPES[S.type]} (bed ${fmtClock(bedHour(p))}, up ${fmtClock(wakeHour(p))}).` : ''}${d}`.replace(/^ $/, '');
}
