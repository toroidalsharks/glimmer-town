// ============================================================
// LOVE: confessions, dates, proposals, weddings, breakups
// ============================================================
const related = (a, b) => a.parents.includes(b.name) || b.parents.includes(a.name) || (a.parents.length > 0 && a.parents.some((n) => b.parents.includes(n)));
const fscore = (a, b) => a.feelings[b.id]?.score ?? 0;
function relStatus(p) {
  const q = p.partner && person(p.partner);
  if (!q) return (p.exes || []).length ? `Single (used to date ${p.exes.slice(-1)[0]})` : 'Single';
  return p.married ? `Married to ${q.name}` : `Dating ${q.name} since day ${p.datingSince}`;
}
let lastRomance = 0;
const guarded = (x) => !!x.lovesMili || isMili(x);
const isRedMili = (a, b) => (a.lovesMili && isMili(b)) || (b.lovesMili && isMili(a));
function romanceTick() {
  if (now - lastRomance < 6 || W.meeting || isNight()) return;
  lastRomance = now;
  const adults = W.people.filter((p) => p.grow >= 1 && !p.visitor && !p.away);
  for (const a of adults) {
    if (a.confessTo || a.proposeTo || a.breakWith || a.makeup || a.befriend || a.noRomance) continue;
    const q = a.partner && person(a.partner);
    if (a.partner && !q) { a.partner = null; a.married = false; continue; }
    if (q) {
      if (a.separated) continue;
      if (fscore(a, q) < 0 && rand() < 0.25 && !guarded(a) && !guarded(q)) { a.breakWith = q.id; return; }
      if (!a.married && !q.proposeTo && W.day - (a.datingSince ?? W.day) >= 3 && fscore(a, q) >= 8 && fscore(q, a) >= 6 && !W.wedding && rand() < 0.08) { a.proposeTo = q.id; return; }
      continue;
    }
    if (a.heartbreakDay !== undefined && W.day - a.heartbreakDay < 2) continue;
    for (const b of adults) {
      if (b === a || b.partner || related(a, b)) continue;
      if (b.noRomance) continue;
      if ((guarded(a) || guarded(b)) && !isRedMili(a, b)) continue;
      if (isRedMili(a, b)) { const m = isMili(a) ? a : b; if (Math.min(fscore(a, b), fscore(b, a)) < 6 || W.day - (m.bornDay || 0) < 2) continue; }
      if (fscore(a, b) >= 6.5 && fscore(b, a) >= 2 && rand() < 0.06) { a.confessTo = b.id; return; }
    }
  }
}
async function romLine(me, them, situation, fallback) {
  if (aiReady()) { const l = await aiLine(me, them, [], situation); if (l && l.say) return l.say; }
  return fallback;
}
function spawnBurst(cx, cy, cz, colors, n = 60, speed = 4, size = 0.45) {
  const pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { pos[i * 3] = cx; pos[i * 3 + 1] = cy; pos[i * 3 + 2] = cz; const th = rand() * 6.28, ph = Math.acos(rand() * 2 - 1), sp = speed * (0.5 + rand() * 0.6); vel.push([Math.sin(ph) * Math.cos(th) * sp, Math.abs(Math.cos(ph)) * sp, Math.sin(ph) * Math.sin(th) * sp]); }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3));
  const pts = new T3.Points(g, softPoints({ color: pick(colors), size, transparent: true, opacity: 1, depthWrite: false }));
  scene.add(pts); bursts.push({ pts, vel, age: 0 });
}
async function romanceScene(a, b, intent) {
  a.confessTo = a.proposeTo = a.breakWith = null;
  a.state = b.state = 'talk';
  a.face = Math.atan2(b.x - a.x, b.z - a.z); b.face = Math.atan2(a.x - b.x, a.z - b.z);
  const say = async (p, text) => { bubble(p, text, 3.2 + text.length / 14); await sleep((2.8 + text.length / 15) * 1000); };
  const fb = fscore(b, a);
  try {
    if (intent === 'confess') {
      const yes = isRedMili(a, b) || (fb >= 5 ? rand() < 0.85 : fb >= 3 ? rand() < 0.3 : false);
      bubble(a, '…', 20); emote(a, '💗', 4);
      const l1 = await romLine(a, b, `You've had feelings for ${b.name} for a while. Right now, heart pounding, you tell them you like them and ask them out.`, pick(['Um… can I tell you something? I really like you.', 'I like you. Like, LIKE you like you.', `${b.name}… will you go out with me?`]));
      await say(a, l1);
      bubble(b, '…', 20);
      const l2 = await romLine(b, a, `${a.name} just told you they like you: "${l1}". You are going to say ${yes ? 'YES, you want to date them' : 'NO, you do not want to date them'}. Answer in your own way.`, yes ? pick(['…Yes! I like you too!', "I was hoping you'd say that.", 'Okay. Yes. Hehe.']) : pick(["I'm sorry… I don't feel that way.", 'Oh… I think of you as a friend.', "I'm flattered, but no."]));
      await say(b, l2);
      if (yes) {
        a.partner = b.id; b.partner = a.id; a.datingSince = b.datingSince = W.day; a.married = b.married = false;
        emote(a, '💕', 5); emote(b, '💕', 5); Sound.levelup(); spawnBurst((a.x + b.x) / 2, 3, (a.z + b.z) / 2, ['#ff8fb6', '#ffb3c7', '#ffffff'], 40, 2.5, 0.35);
        feel(a, b, 1, true); feel(b, a, 1, true); addJoy(a, 40); addJoy(b, 30);
        remember(a, `I confessed to ${b.name} and they said yes. We're dating now.`, 3, 'couple', b.name);
        remember(b, `${a.name} confessed to me and I said yes. We're dating now.`, 3, 'couple', a.name);
        for (const q of W.people) if (q !== a && q !== b && rand() < 0.6) remember(q, `I heard ${a.name} and ${b.name} are dating now.`, 1, 'gossipLove', a.name);
        diary(`💕 <b>${esc(a.name)}</b> confessed to <b>${esc(b.name)}</b>, and they said yes! They're dating now.`); townRecord('dating', [a.id, b.id], `${a.name} asked ${b.name} out and they said yes. They started dating.`);
        queueLetter(a, 'dating', { who: b.name });
      } else {
        emote(a, '💔', 5); feel(a, b, -1, true); a.heartbreakDay = W.day; Sound.paper();
        remember(a, `I confessed to ${b.name} and they turned me down.`, 3, 'heartbreak', b.name);
        remember(b, `${a.name} confessed to me. I said no.`, 2, 'confessedTo', a.name);
        diary(`💔 <b>${esc(a.name)}</b> confessed to <b>${esc(b.name)}</b>, but ${esc(b.name)} said no.`);
        queueLetter(a, 'heartbreak', { who: b.name });
      }
    } else if (intent === 'propose') {
      const yes = isRedMili(a, b) || (fb >= 7 ? rand() < 0.9 : fb >= 5 ? rand() < 0.4 : false);
      bubble(a, '…', 20); emote(a, '💍', 5);
      const l1 = await romLine(a, b, `You've been dating ${b.name} and you're sure about them. Right now, you're asking ${b.name} to marry you.`, pick([`${b.name}… will you marry me?`, "I don't want to do life without you. Marry me?"]));
      await say(a, l1);
      bubble(b, '…', 20);
      const l2 = await romLine(b, a, `${a.name}, who you're dating, just asked you to marry them: "${l1}". You are going to say ${yes ? 'YES' : 'NOT YET'}. Answer in your own way.`, yes ? pick(['Yes! Yes yes yes!', 'Of course I will.']) : pick(["I… I'm not ready yet.", 'Can we wait a little longer?']));
      await say(b, l2);
      if (yes) {
        W.wedding = { a: a.id, b: b.id, day: W.day + 1 }; setTimeout(() => fileCase('license', a, b), 3000);
        emote(a, '💕', 5); emote(b, '💕', 5); Sound.levelup(); spawnBurst((a.x + b.x) / 2, 3, (a.z + b.z) / 2, ['#ffd36b', '#ffffff', '#ff8fb6'], 50, 3, 0.4);
        addJoy(a, 40); addJoy(b, 40);
        remember(a, `I asked ${b.name} to marry me. They said yes! The wedding is tomorrow.`, 3, 'engaged', b.name);
        remember(b, `${a.name} asked me to marry them and I said yes. The wedding is tomorrow.`, 3, 'engaged', a.name);
        diary(`💍 <b>${esc(a.name)}</b> proposed to <b>${esc(b.name)}</b>. They said yes! The wedding is tomorrow at the fountain.`); townRecord('engaged', [a.id, b.id], `${a.name} proposed to ${b.name} and they said yes. They got engaged.`); engageCut(a, b, l1, l2);
        queueLetter(b, 'engaged', { who: a.name });
      } else {
        feel(a, b, -0.5, true);
        remember(a, `I proposed to ${b.name}. They said they're not ready.`, 3, 'notYet', b.name);
        diary(`💍 <b>${esc(a.name)}</b> proposed to <b>${esc(b.name)}</b>, who said they're not ready yet.`);
      }
    } else if (intent === 'breakup') {
      const l1 = await romLine(a, b, `You and ${b.name} have been ${a.married ? 'married' : 'dating'}, but it isn't working anymore. Right now, you're breaking up with them.`, pick(["I think… we should break up.", "This isn't working. I'm sorry.", "I don't feel the same anymore."]));
      await say(a, l1);
      const l2 = await romLine(b, a, `${a.name} just broke up with you: "${l1}". React honestly.`, fb >= 4 ? pick(['…Oh. Okay.', "Wait, what? Why?", "I didn't see that coming."]) : pick(['Honestly? Fine.', 'Yeah. I felt it too.']));
      await say(b, l2);
      if (a.married) { emote(a, '💔', 5); emote(b, '💔', 5); a.separated = b.separated = true; remember(a, `I told ${b.name} I want a divorce.`, 3, 'breakup', b.name); remember(b, `${a.name} wants a divorce.`, 3, 'heartbreak', a.name); diary(`💔 <b>${esc(a.name)}</b> told <b>${esc(b.name)}</b> they want a divorce. It's going to Glimmer Hall.`); townRecord('separated', [a.id, b.id], `${a.name} told ${b.name} they want a divorce. It went to Glimmer Hall.`); divorceAskCut(a, b, l1, l2); fileCase('divorce', a, b); return; }
      emote(a, '💔', 5); emote(b, '💔', 5);
      a.partner = b.partner = null; const wasMarried = a.married; a.married = b.married = false;
      a.exes = [...(a.exes || []), b.name].slice(-5); b.exes = [...(b.exes || []), a.name].slice(-5);
      feel(b, a, fb >= 4 ? -3 : -1, true); b.heartbreakDay = W.day;
      remember(a, `I broke up with ${b.name}.`, 3, 'breakup', b.name);
      remember(b, `${a.name} broke up with me.`, 3, 'heartbreak', a.name);
      diary(`💔 <b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> ${wasMarried ? 'split up' : 'broke up'}.`); townRecord('breakup', [a.id, b.id], `${a.name} broke up with ${b.name}.`);
      for (const q of W.people) if (q !== a && q !== b && rand() < 0.6) remember(q, `I heard ${a.name} and ${b.name} broke up.`, 1, 'gossipLove', a.name);
    }
  } finally {
    for (const p of [a, b]) if (p.state === 'talk' && !p.heldByDlg) p.state = 'free';
    W.pairCool[[a.id, b.id].sort().join('|')] = now + 40 * ts();
    markDirty();
  }
}
function planDate(p) {
  if (!p.partner || p.visitor || rand() > 0.07) return false;
  const q = person(p.partner);
  if (!q || q.inside || q.state !== 'free' || q.visitor || q.away || (q.task && !['stroll', 'visit'].includes(q.task.kind))) return false;
  const spots = [['cafe', CAFE_SEATS[0], CAFE_SEATS[1]], ['pier', [-0.5, 37.5], [0.6, 37.5]], ['downtown', [DT.x + 5, DT.z + 4], [DT.x + 6.1, DT.z + 4]], ['garden', TOWN.garden.spot, [TOWN.garden.spot[0] + 1.1, TOWN.garden.spot[1]]], ['park', TOWN.park.spot, [TOWN.park.spot[0] + 1.1, TOWN.park.spot[1]]]];
  const [pl, s1, s2] = pick(spots);
  setTask(p, 'date', pl, s1, { with: q.id }); setTask(q, 'date', pl, s2, { with: p.id });
  return true;
}
function weddingFrame(dt) {
  const ev = W.event;
  if (!ev || ev.id !== 'wedding' || ev.day !== W.day || !ev.couple) return;
  const E = EVENTS.wedding;
  if (W.t >= E.t0 + 0.02 && !ev.done) {
    ev.done = true;
    const a = person(ev.couple[0]), b = person(ev.couple[1]);
    if (a && b) {
      a.married = b.married = true; a.partner = b.id; b.partner = a.id;
      Sound.bell();
      addJoy(a, 50); addJoy(b, 50);
      for (const q of W.people) { if (q === a || q === b) continue; remember(q, `I went to ${a.name} and ${b.name}'s wedding.`, 2, 'wedding'); if (!q.inside) { addJoy(q, 8); emote(q, '💕', 3); } }
      remember(a, `I married ${b.name} today at the fountain.`, 3, 'married', b.name);
      remember(b, `I married ${a.name} today at the fountain.`, 3, 'married', a.name);
      bubble(a, pick(['I do!', 'I do. Forever.']), 3.5); setTimeout(() => bubble(b, pick(['I do too!', 'I do.']), 3.5), 1800);
      diary(`💒 <b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> got married at the fountain! Everyone threw petals.`); townRecord('married', [a.id, b.id], `${a.name} and ${b.name} got married at the fountain.`); weddingCut(a, b);
      markDirty();
    }
  }
  if (ev.done && W.t < E.t1 && rand() < dt * 2.2 && !interior) spawnBurst((rand() - 0.5) * 6, 4 + rand() * 2, 5 + (rand() - 0.5) * 3, ['#ff8fb6', '#ffffff', '#ffd36b', '#c9b3ff'], 40, 2.2, 0.35);
}
function startWeddingDay() {
  if (!W.wedding || W.wedding.day !== W.day) return;
  const a = person(W.wedding.a), b = person(W.wedding.b);
  if (a && b) { W.event = { id: 'wedding', day: W.day, host: a.id, going: W.people.map((p) => p.id), couple: [a.id, b.id] }; diary(`Today is <b>${esc(a.name)} and ${esc(b.name)}'s wedding</b>, at the fountain at ${EVENTS.wedding.at}.`); }
  W.wedding = null;
}

