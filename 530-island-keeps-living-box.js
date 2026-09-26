// ============================================================
// THE ISLAND KEEPS LIVING while the box is off: when it opens again,
// it catches up on the days it missed
// ============================================================
var offlineSim = false;
let lastCaught = 0;
function offlineUproar() {
  const iss = pickIssue(); if (!iss) return;
  const pool = W.people.filter((p) => !p.away && p.grow >= 0.6);
  const pr = (iss.principals || []).filter((p) => p && pool.includes(p));
  const members = [...pr, ...pool.filter((p) => !pr.includes(p)).sort(() => rand() - 0.5)].slice(0, 7);
  if (members.length < 4) return;
  const S = { id: uid(), kind: 'uproar', issue: { kind: iss.kind, label: iss.label, about: iss.about, A: iss.A, B: iss.B }, center: [0, 8], members: members.map((p) => ({ id: p.id, name: p.name, side: iss.side(p) })), lines: [], day: W.day, principals: pr.map((p) => p.id), src: iss.src || null };
  if (!S.members.some((m) => m.side === 'A') || !S.members.some((m) => m.side === 'B')) { const mids = S.members.filter((m) => m.side === 'mid'); if (mids.length < 2) return; mids[0].side = 'A'; mids[mids.length - 1].side = 'B'; }
  S.roster = S.members.map((m) => ({ ...m }));
  const sc = scriptedScene(S, 9, false);
  S.lines = sc.lines.map((l) => ({ name: l.name, say: l.say, side: S.members.find((m) => m.id === l.id)?.side || 'mid', action: l.action }));
  diary(`🔥 While you were away, <b>an uproar broke out at the fountain</b> about <b>${esc(S.issue.label)}</b>. ${esc(S.issue.A.name)}: ${S.members.filter((m) => m.side === 'A').map((m) => esc(m.name)).join(', ')}. ${esc(S.issue.B.name)}: ${S.members.filter((m) => m.side === 'B').map((m) => esc(m.name)).join(', ')}.`);
  sceneOutcome(S, sc);
  const D = drama(); D.scenes = D.scenes || [];
  D.scenes.push({ id: S.id, kind: 'uproar', label: S.issue.label, A: S.issue.A.name, B: S.issue.B.name, sides: S.roster.map((m) => ({ name: m.name, side: m.side })), lines: S.lines.slice(0, 16), ending: S.ending || '', winner: S.winner || 'none', creator: null, day: W.day });
  if (D.scenes.length > 10) D.scenes.shift();
}
function offlineGoal(p) {
  const g = p.goal; if (!g) return;
  const t = g.target && person(g.target);
  if (g.type === 'friend' && t) { feel(t, p, 0.7, true); feel(p, t, 0.5, true); remember(t, `${p.name} has been really friendly lately.`, 1, 'gotKind', p.name); return; }
  if (g.type === 'apologize' && t) { if (rand() < 0.5) { feel(t, p, 2, true); remember(p, `I apologized to ${t.name}.`, 3, 'apologized', t.name); remember(t, `${p.name} came and apologized to me.`, 3, 'gotApology', p.name); goalDone(p, `I apologized to ${t.name}. It felt right.`, false); } return; }
  if (g.type === 'confront' && t) { feel(t, p, -1, true); feel(p, t, -0.5, true); remember(p, `I confronted ${t.name}.`, 3, 'fight', t.name); remember(t, `${p.name} confronted me.`, 3, 'fight', p.name); diary(`😤 <b>${esc(p.name)}</b> confronted <b>${esc(t.name)}</b>. It got loud.`); goalDone(p, `I finally told ${t.name} what I think of them.`, false); return; }
  if (g.type === 'party' && g.step === 0 && !(W.event && W.event.day === W.day) && rand() < 0.5) {
    const guests = W.people.filter((q) => q !== p && fscore(q, p) >= 1).slice(0, 6);
    if (guests.length >= 2) { for (const q of guests) { remember(q, `Went to ${p.name}'s party. It was so fun.`, 2, 'event', p.name); addJoy(q, 10); feel(q, p, 0.4, true); } diary(`🎉 <b>${esc(p.name)}</b> threw a party in the park. ${plural(guests.length, 'person')} came.`); goalDone(p, `I threw a party and ${plural(guests.length, 'person')} came!`, false); }
    return;
  }
  if (g.type === 'book') { if (rand() < 0.6) writeDone(p); return; }
  for (let i = 0; i < 3 && p.goal === g; i++) goalPlan(p);
  if (p.task && ['write', 'visit'].includes(p.task.kind)) p.task = null;
}
function offlineDay() {
  W.offDay = W.day;
  const ppl = W.people.filter((p) => !p.away && p.task?.kind !== 'away' && !jailed(p));
  if (!(W.event && W.event.day === W.day) && rand() < 0.35) {
    const ids = Object.keys(EVENTS).filter((k) => !EVENTS[k].special && (!EVENTS[k].season || EVENTS[k].season === seasonOf().id));
    const id = pick(ids);
    if (id) { W.event = { id, day: W.day, host: null, going: ppl.filter(() => rand() < 0.6).map((p) => p.id) }; for (const pid of W.event.going) { const p = person(pid); if (p) { remember(p, `Went to ${EVENTS[id].name}.`, 2, 'event'); addJoy(p, 10); } } diary(`🎈 The town had <b>${esc(EVENTS[id].name)}</b>.`); }
  }
  if (W.project) { for (const p of ppl) if (p.coins >= 9 && !p.saving && rand() < 0.3) { const n = 1 + Math.floor(rand() * 2); p.coins -= n; W.project.raised += n; } checkProject(); }
  for (const p of ppl) {
    const H = p.health;
    if (H?.ill && !H.ill.treated && rand() < 0.7) doctorVisitDone(p);
    else if (H?.injury && !H.injury.set && rand() < 0.7) doctorVisitDone(p);
    if (H && (H.low || (H.flare && CONDITIONS[H.flare.id]?.mind)) && W.day - (H.lastTherapy ?? -9) >= 3 && rand() < 0.5) therapyDone(p);
    if (p.job && p.grow >= 1 && !p.visitor && H?.callIn !== W.day && W.strikeDay !== W.day && !p.workedToday) endWork(p);
    const cost = p.saving ? 1 : 2; if (purse(p) >= cost) spend(p, cost); p.hunger = 0.25;
    if ((p.toRead || []).length) readProgress(p, 0.6); else if (!p.saving && p.coins >= 8 && rand() < 0.25) browseDone(p);
    if (p.saving && !hasLaptop(p) && p.coins >= p.saving.goal) buyLaptopDone(p);
    if (hasLaptop(p) && W.outsideFound && cfg.outside !== false && rand() < 0.5) { const it = pickOutsideFor(p); if (it) seeItem(p, it); }
    offlineGoal(p);
    p.inside = false;
  }
  for (let i = 0; i < Math.min(14, ppl.length * 2); i++) {
    const a = pick(ppl), b = pick(ppl); if (!a || !b || a === b || a.grow < 0.6 || b.grow < 0.6) continue;
    const f = fscore(a, b), d = (f >= 0 ? 0.3 : -0.25) + (rand() - 0.5) * 0.7;
    feel(a, b, d, true); feel(b, a, d * 0.8, true);
    remember(a, d < -0.25 ? `Got into it with ${b.name}. Not a great talk.` : `Spent time with ${b.name}.`, 1, d < -0.25 ? 'gotMean' : 'hangout', b.name);
    if (d > 0.5 && rand() < 0.35) { remember(a, `Hugged ${b.name}.`, 1, 'hug', b.name); remember(b, `${a.name} hugged me.`, 1, 'hug', a.name); }
    if (d < -0.45 && f < -3 && rand() < 0.3) { remember(a, `Got into a fight with ${b.name}.`, 3, 'fight', b.name); remember(b, `${a.name} started a fight with me.`, 3, 'fight', a.name); diary(`💢 <b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> got into a fight.`); if (typeof fightInjury === 'function') fightInjury(a, b); }
  }
  const D = drama(); if (D.uproarAt) { D.uproarAt = null; offlineUproar(); }
  for (const c of W.clubs || []) if (W.day - c.last >= 2) { c.last = W.day; for (const id of c.members) { const p = person(id); if (p) remember(p, `The ${c.name} met today.`, 1, 'club'); } }
  if ((W.suggestions || []).some((s) => !s.done) && rand() < 0.6) fulfillSuggestion();
}
function offlineCatchUp(ms) {
  if (MODE !== 'host' || (ISLE !== 'isle1' && ISLE !== 'isle2')) return 0;
  const pace = cfg.awayPace ?? 1; if (!pace || !(ms > 0)) return 0;
  const total = Math.min(cfg.awayMax ?? 7, (ms / 3600e3) * pace);
  if (total < 0.2) return 0;
  const endAbs = W.day + W.t + total, startDay = W.day;
  offlineSim = true;
  try {
    for (let guard = 0; guard < 40 && W.day + W.t < endAbs - 1e-6; guard++) {
      if (W.meeting) W.meeting = null;
      if (W.t < 0.45 && W.offDay !== W.day && W.day + 0.45 <= endAbs) { W.t = 0.45; offlineDay(); continue; }
      if (W.t < 0.7 && W.day + 0.7 <= endAbs) { W.t = 0.7; if (W.reflectedDay !== W.day) nightfall(); continue; }
      if (W.day + 1 <= endAbs) { W.t = 1; newDay(); W.meetingDay = W.day; continue; }
      W.t = Math.max(W.t, endAbs - W.day); break;
    }
  } catch (e) { console.error(e); }
  offlineSim = false;
  W.scene = null; if (typeof sceneBusy !== 'undefined') sceneBusy = false;
  const night = W.t >= 0.6 || W.t < 0.01;
  for (const p of W.people) {
    if (p.task?.kind === 'away') continue;
    p.task = night ? { kind: 'home', phase: 'do' } : null; p.path = []; p.state = 'free'; p.pose = null; p.busyUntil = night ? Infinity : 0; p.inside = night; p.at = homeKey(p);
    const s = TOWN[homeKey(p)].spot; p.x = s[0] + (rand() - 0.5) * 3; p.z = s[1] + 0.6 + rand();
    p.makeup = p.befriend = p.confessTo = p.proposeTo = p.breakWith = p.confront = null;
  }
  if (W.meetingDay !== W.day && W.t > 0.2) W.meetingDay = W.day;
  lastCaught = W.day - startDay;
  markDirty(); saveNow();
  return total;
}
const CATCHUP_HI = /🔥|💥|💒|💔|💕|born|moved into|💻|🎉|🧩|✍️|😷|🦴|🩺|✊|🤖|📄|🧬|⚗️|🔭|🏗|✳|🌐|💼|🎂|🎈|💢|😤|🤝|🔪|🚨|⚖|🕯|🔎|🔓|🎬/;
function catchUp(ms) {
  const mark = W.log[W.log.length - 1];
  const done = offlineCatchUp(ms);
  if (!done) return null;
  let i = W.log.length - 1; while (i >= 0 && W.log[i] !== mark) i--;
  return { days: lastCaught, hi: W.log.slice(i + 1).filter((e) => CATCHUP_HI.test(e.text)).slice(-12) };
}
function resumeCatchUp() {
  if (MODE !== 'host' || !W || !W.lastReal) return;
  const gap = Date.now() - W.lastReal;
  if (gap < 10 * 60e3) return;
  W.lastReal = Date.now();
  const cu = catchUp(gap);
  if (cu) setTimeout(() => showAway([], cu.hi, cu.days, true), 900);
}

function v23Boot() { W.added = W.added || {}; if (W.added.v23) return; W.added.v23 = true; if (typeof logUpdate === 'function') logUpdate('build', 'Gave everyone hair, eyebrows and faces that change with their mood, and planted grass and flowers everywhere. Residents now set their own goals, show each other their phones, and can leave notes in my new suggestion box. The island also keeps living while the box is off.', 'a cuter island'); }
