// ============================================================
// GROWING UP: babies, toddlers, kids and teens
// ============================================================
// Born residents go baby → toddler → kid → teen → adult by age in game days (a game day is 5 real minutes).
// `grow` stays the number older systems check (adult at 1), so jobs, romance, crime and court keep kids out on their own.
const LIFE_STAGES = {
  baby: { from: 0, grow: 0.2, scale: 0.5, head: 1.22, sy: 0.7, name: 'baby', icon: '👶' },
  toddler: { from: 4, grow: 0.3, scale: 0.58, head: 1.14, sy: 0.78, name: 'toddler', icon: '🧸' },
  kid: { from: 8, grow: 0.45, scale: 0.68, head: 1.06, sy: 0.87, name: 'kid', icon: '🪁' },
  teen: { from: 15, grow: 0.75, scale: 0.84, head: 1, sy: 0.96, name: 'teenager', icon: '🎧' },
  adult: { from: 22, grow: 1, scale: 1, head: 1, sy: 1, name: 'adult', icon: '' },
};
const STAGE_ORDER = ['baby', 'toddler', 'kid', 'teen', 'adult'];
const carrying = new Map(); // parent id -> last time they had a baby in their arms (visual only)
let kidChirpAt = 0;
const stageOf = (p) => (p && LIFE_STAGES[p.stage] ? p.stage : p && p.grow < 1 ? 'kid' : 'adult');
const ageDays = (p) => Math.max(0, W.day - (p.bornDay || 0));
const isBaby = (p) => stageOf(p) === 'baby';
const growScale = (p) => LIFE_STAGES[stageOf(p)].scale;
const kidsOf = (p) => W.people.filter((k) => (k.parents || []).includes(p.name) && stageOf(k) !== 'adult' && !k.visitor && !k.away);
function stageForAge(d) { let s = 'baby'; for (const k of STAGE_ORDER) if (d >= LIFE_STAGES[k].from) s = k; return s; }
function stageLabel(p) {
  if (!p.stage) return '';
  const st = stageOf(p), L = LIFE_STAGES[st], age = ageDays(p);
  if (st === 'adult') return '';
  const next = STAGE_ORDER[STAGE_ORDER.indexOf(st) + 1], left = LIFE_STAGES[next].from - age;
  return `${L.icon} ${L.name}, ${plural(age, 'day')} old${left > 0 ? `, ${next === 'adult' ? 'grows up' : `becomes a ${LIFE_STAGES[next].name}`} in ${plural(left, 'day')}` : ''}`;
}
// younger bodies: shorter and squatter, with a bigger head (the head keeps its round shape)
function kidShape(p, fig, head, s = 1) {
  const L = LIFE_STAGES[stageOf(p)];
  fig.scale.set(s, s * L.sy, s);
  head.scale.set(L.head, L.head / L.sy, L.head);
  return s * (1.55 * L.sy + 0.62 * L.head + 0.38);
}
function setStage(p, st, news) {
  const was = stageOf(p);
  p.stage = st; p.grow = LIFE_STAGES[st].grow;
  if (p.body) p.body.voice = null;
  if (st !== 'baby' && p.task?.kind === 'carried') { p.task = null; p.path = []; }
  scaleMesh(p);
  if (!news || was === st) return;
  const par = W.people.filter((q) => p.parents.includes(q.name)), pn = par.map((q) => q.name).join(' and ') || 'Everyone';
  const nm = `<b>${esc(p.name)}</b>`;
  if (st === 'toddler') {
    const word = pick(['Mama', 'Dada', 'ball', 'fish', 'no', 'up', ...par.map((q) => q.name.split(' ')[0])]);
    diary(`👣 ${nm} took their first steps this morning and said their first word: "${esc(word)}". ${esc(pn)} cheered.`);
    remember(p, `I can walk! I said "${word}".`, 3, 'grewup');
    for (const q of par) remember(q, `${p.name} took their first steps today and said "${word}"!`, 3, 'kidFirst', p.name);
    p.selfNote = 'I can walk now! Everything is big and I want to touch all of it.';
  } else if (st === 'kid') {
    diary(`🎒 ${nm} isn't a toddler anymore. They're a big kid now, running everywhere and full of questions.`);
    for (const q of par) remember(q, `${p.name} is a big kid now. They asked me why the sea is salty and didn't like my answer.`, 2, 'kidFirst', p.name);
    p.selfNote = "I'm a big kid now. I like playing outside and I have a lot of questions.";
  } else if (st === 'teen') {
    diary(`🎧 ${nm} is a teenager now, and would like some space, please.`);
    for (const q of par) remember(q, `${p.name} is a teenager now. They rolled their eyes at me for the first time.`, 2, 'kidFirst', p.name);
    p.selfNote = "I'm a teenager. I want my own space, and nobody here gets me.";
  } else if (st === 'adult') {
    if (!p.job) { p.job = randomJob(); p.jobDays = 0; p.jobMood = 0; }
    dressMesh(p);
    diary(`🎓 ${nm} grew up and started work as a ${JOBS[p.job].short}.`);
    remember(p, `I'm grown up now. I start work as a ${JOBS[p.job].short}.`, 3, 'grewup');
    for (const q of par) remember(q, `${p.name} is all grown up and working as a ${JOBS[p.job].short}. Where did the time go?`, 3, 'kidFirst', p.name);
  }
}
function growUp(p) {
  if (!p.stage || p.stage === 'adult' || p.visitor) return;
  const next = stageForAge(ageDays(p));
  if (STAGE_ORDER.indexOf(next) > STAGE_ORDER.indexOf(p.stage)) setStage(p, next, true);
}
// pocket money from the parents every morning
function growMorning() {
  for (const k of W.people) {
    const st = stageOf(k); if (st !== 'kid' && st !== 'teen') continue;
    const par = W.people.find((q) => k.parents.includes(q.name) && q.coins >= 4 && stageOf(q) === 'adult');
    if (par) { const n = st === 'teen' ? 2 : 1; par.coins -= n; k.coins += n; }
  }
}

// ---- babies: napping at home, or riding around in a parent's arms ----
function babyNap(p, secs) {
  const hk = homeKey(p), s = TOWN[hk].spot;
  p.path = []; p.inside = true; p.at = hk; p.state = 'free'; p.x = s[0] + (rand() - 0.5) * 2; p.z = s[1] + 0.3;
  p.hunger = Math.min(p.hunger, 0.3);
  if (W.t >= 0.6 || W.t < 0.008) { p.task = { kind: 'home', phase: 'do' }; p.busyUntil = Infinity; }
  else { p.task = { kind: 'nap', phase: 'do' }; p.busyUntil = now + (secs || 10) * ts(); }
}
// babies can't walk anywhere: whatever a system asks of one, they stay in a parent's arms or in the crib
function babyHold(p, kind) {
  if (!p || kind === 'carried' || !isBaby(p)) return false;
  if (p.task?.kind !== 'carried') babyNap(p);
  return true;
}
function carryStep(p, dt) {
  const par = person(p.task.who);
  if (!par || par.visitor || par.away || par.task?.kind === 'away' || stageOf(par) !== 'adult' || (typeof jailed === 'function' && jailed(par))) { babyNap(p); return; }
  p.x = par.x; p.z = par.z; p.face = par.face; p.at = par.at; p.moving = false;
  if (par.inside) { if (par.task?.kind === 'home') { babyNap(p); return; } p.inside = true; return; }
  p.inside = false; carrying.set(par.id, now);
  if (p.hunger > 0.55 && rand() < dt * 0.4) {
    p.hunger = 0.08; feel(p, par, 0.2, true); feel(par, p, 0.15, true); emote(p, '♥', 2);
    if (par.state === 'free') bubble(par, pick(['Bottle time!', 'Here comes the spoon!', 'Hungry again? Okay, okay.', 'Little bites, little bites.']), 2.6);
    return;
  }
  if (par.state !== 'free') return;
  if (rand() < dt * 0.012) {
    bubble(p, 'Waaah!', 2); emote(p, '💧', 2.4);
    setTimeout(() => { if (p.task?.kind === 'carried' && par.state === 'free') { bubble(par, pick(['Shh, shh. I have you.', "There, there. It's okay.", 'Who needs a cuddle?']), 2.6); par.face += 0.4; } }, 1400);
  } else if (rand() < dt * 0.03) bubble(p, pick(['Ba!', 'Goo.', 'Ah-bah!', 'Mmm.', 'Hee!', 'Bababa.']), 1.6);
  if (!par.today.some((m) => m.tag === 'parent')) remember(par, `Carried ${p.name} around town today.`, 1, 'parent', p.name);
}

// ---- parents: pick the baby up, drop them off before work, walk the toddler, watch the kids play ----
function kidSpot(little) {
  const r = rand();
  if (r < 0.45) return ['park', jitter(TOWN.park.spot, little ? 3 : 5)];
  if (r < 0.7 || little) { const a = rand() * 6.28, rr = FOUNTAIN_R + 1.4 + rand() * 4; return ['plaza', [Math.cos(a) * rr, Math.sin(a) * rr]]; }
  if (r < 0.88) { const a = rand() * 6.28, rr = rand() * 5; return ['beach', [BEACH[0] + Math.cos(a) * rr, BEACH[1] + Math.sin(a) * rr]]; }
  return ['garden', jitter(TOWN.garden.spot, 4)];
}
function parentPlan(p) {
  if (p.visitor || p.away || stageOf(p) !== 'adult') return false;
  const kids = kidsOf(p); if (!kids.length) return false;
  const held = kids.find((k) => k.task?.kind === 'carried' && k.task.who === p.id);
  const workDue = !!(p.job && !p.workedToday && W.t < 0.24);
  if (held) {
    if (workDue || W.t > 0.54 || rand() < 0.06) { const hk = homeKey(held); setTask(p, 'dropkid', hk, jitter(TOWN[hk].spot, 0.8), { kid: held.id }); return true; }
    return false;
  }
  if (workDue || W.t > 0.5) return false;
  const nap = kids.find((k) => isBaby(k) && k.inside && k.task?.kind !== 'carried');
  if (nap && rand() < 0.5) { const hk = homeKey(nap); setTask(p, 'fetchkid', hk, jitter(TOWN[hk].spot, 0.8), { kid: nap.id }); return true; }
  const tod = kids.find((k) => stageOf(k) === 'toddler' && !k.inside && k.state === 'free' && k.task?.kind !== 'walkwith' && Math.hypot(k.x - p.x, k.z - p.z) < 16);
  if (tod && rand() < 0.3) {
    const [pl, sp] = kidSpot(true); setTask(p, 'stroll', pl, sp);
    if (p.path.length) {
      tod.task = { kind: 'walkwith', phase: 'go', lead: p.id, hands: true, until: now + 45, idle: 0, side: rand() < 0.5 ? 1 : -1 }; tod.path = [];
      bubble(p, pick([`Come on, ${tod.name}. Hold my hand.`, 'Little steps. There you go.', "Let's go see the ducks."]), 2.4);
      setTimeout(() => bubble(tod, pick(['Go!', 'Hand!', 'Ducks!', 'Up! Up!']), 1.8), 1200);
      remember(p, `Took ${tod.name} for a walk, holding their little hand.`, 1, 'parent', tod.name);
    }
    return true;
  }
  const kid = kids.find((k) => !k.inside && k.state === 'free' && k.task?.kind === 'play');
  if (kid && rand() < 0.15) { setTask(p, 'visit', kid.at, jitter([kid.x, kid.z], 1.8), { who: kid.id }); return true; }
  return false;
}

// ---- what toddlers, kids and teens do with their day ----
function kidPlan(p) {
  const st = stageOf(p); if (st === 'adult' || st === 'baby' || p.visitor) return false;
  const par = W.people.filter((q) => p.parents.includes(q.name) && stageOf(q) === 'adult' && !q.inside && !q.away && q.task?.kind !== 'away' && q.task?.kind !== 'date');
  const snack = () => { const hk = homeKey(p); setTask(p, 'nap', hk, jitter(TOWN[hk].spot, 0.6), { snack: true }); return true; };
  const pal = W.people.find((q) => q !== p && ['toddler', 'kid', 'teen'].includes(stageOf(q)) && !q.inside && q.task?.kind === 'play' && q.task.phase === 'do');
  if (st === 'toddler') {
    if (p.hunger > 0.55 || rand() < 0.12) return snack();
    const pp = pick(par);
    if (pp && rand() < 0.55) { setTask(p, 'visit', pp.path.length ? pp.dest : pp.at, jitter([pp.x, pp.z], 1.4), { who: pp.id }); return true; }
    const [pl, sp] = pal && rand() < 0.5 ? [pal.at, jitter([pal.x, pal.z], 1.4)] : kidSpot(true);
    setTask(p, 'play', pl, sp); return true;
  }
  if (st === 'kid') {
    if (p.hunger > 0.6) { if (purse(p) >= 1 && rand() < 0.55) { setTask(p, 'eat', rand() < 0.6 ? 'icecream' : 'bakery'); return true; } return snack(); }
    const r = rand();
    if (r < 0.45) { const [pl, sp] = pal && rand() < 0.6 ? [pal.at, jitter([pal.x, pal.z], 1.6)] : kidSpot(false); setTask(p, 'play', pl, sp); return true; }
    if (r < 0.6) { const pp = pick(par); if (pp) { setTask(p, 'visit', pp.path.length ? pp.dest : pp.at, jitter([pp.x, pp.z], 1.8), { who: pp.id }); return true; } }
    return false;
  }
  const r = rand();
  if (r < 0.14 && purse(p) >= 1 && W.t < 0.58) { setTask(p, 'arcade', 'arcade'); return true; }
  if (r < 0.26) { const mate = W.people.find((q) => q !== p && stageOf(q) === 'teen' && !q.inside && q.state === 'free'); if (mate) { setTask(p, 'visit', mate.path.length ? mate.dest : mate.at, jitter([mate.x, mate.z], 1.6), { who: mate.id }); return true; } }
  return false;
}
function growStart(p, k) {
  if (k === 'fetchkid') {
    const b = person(p.task.kid);
    if (b && isBaby(b) && b.task?.kind !== 'carried' && W.t < 0.6) {
      b.task = { kind: 'carried', phase: 'do', who: p.id }; b.path = []; b.inside = p.inside;
      bubble(p, pick(['Up you come!', 'There you are, sleepyhead.', 'Who wants to go outside?', 'Hello, my little bean.']), 2.4); emote(b, '♥', 2.4);
      feel(b, p, 0.3, true); feel(p, b, 0.2, true);
    }
    p.busyUntil = now + 1.2; return true;
  }
  if (k === 'dropkid') {
    const b = person(p.task.kid);
    if (b && b.task?.kind === 'carried' && b.task.who === p.id) { babyNap(b, 14); bubble(p, pick(['Nap time, little one.', "Be good. I'll be back soon.", 'Sleep tight, bean.']), 2.4); }
    p.busyUntil = now + 1.2; return true;
  }
  if (k === 'nap') { p.inside = true; p.hunger = Math.min(p.hunger, 0.12); p.busyUntil = now + (p.task.snack ? 5 : 10) * ts(); return true; }
  if (k === 'play') {
    p.busyUntil = now + (4 + rand() * 5) * ts();
    const st = stageOf(p);
    bubble(p, pick(st === 'toddler' ? ['Wheee!', 'Look!', 'Birdie!', 'Again!'] : st === 'teen' ? ['Fine, one game.', "I'm only doing this ironically."] : ['Tag, you\'re it!', 'Race you!', 'Look what I found!', "I'm the fastest!", 'Can we play pirates?']), 2.2);
    return true;
  }
  return false;
}

// ---- little voices around town ----
const TODDLER_WORDS = ['Hi!', 'Mine!', 'Why?', 'Uh-oh.', 'Birdie!', 'Again!', 'No nap!', 'Up!', 'Look!', 'Ball!', 'Fishy!', 'Nooo.'];
function kidTick() {
  if (now < kidChirpAt) return;
  kidChirpAt = now + 4 + rand() * 5;
  const p = pick(W.people.filter((q) => stageOf(q) !== 'adult' && !q.inside && q.state === 'free' && !(q.bubble && q.bubble.until > now)));
  if (!p || isBaby(p)) return;
  const st = stageOf(p);
  if (st === 'toddler') bubble(p, pick(TODDLER_WORDS), 1.8);
  else if (st === 'kid') bubble(p, pick(['Race you!', 'I found a snail!', "I'm not tired!", 'Can I have ice cream?', `When I grow up I'm gonna be a ${JOBS[pick(Object.keys(JOBS))].short}!`, 'Do fish sleep?', 'Watch this!']), 2.2);
  else if (rand() < 0.6) bubble(p, pick(['Ugh.', 'This town is so boring.', 'Whatever.', "I'm not a kid anymore.", 'Nobody gets me.', 'Can I get my own room?', 'So cringe.']), 2.2);
}
// a toddler conversation is a word and a smile, never a model call
async function toddlerChat(a, b) {
  const t = stageOf(a) === 'toddler' ? a : b, o = t === a ? b : a, ost = stageOf(o), mine = t.parents.includes(o.name);
  a.state = b.state = 'talk';
  try {
    const word = pick(TODDLER_WORDS);
    bubble(t, word, 2); await sleep(1500);
    const rep = ost === 'toddler' ? pick(TODDLER_WORDS) : ost === 'kid' ? pick(['Wanna play?', 'Hehe, you talk funny.', 'Come on, follow me!']) : ost === 'teen' ? pick(['Hey, little dude.', 'Okay, that was cute.', 'Where are your parents?'])
      : mine ? pick(['Yes, sweetie?', "That's my kiddo.", 'Who is the best? You are!', 'Careful, bean.']) : pick(["You're getting so big!", 'Hi, little one!', 'Is that right?', `Where's your ${pick(['mom', 'dad', 'grown-up'])}?`]);
    bubble(o, rep, 2.6); await sleep(2100);
    feel(t, o, 0.3, true); feel(o, t, 0.2, true);
    remember(o, `${t.name} said "${word}" to me.`, 1, 'talk', t.name);
  } finally {
    for (const p of [a, b]) if (p.state === 'talk') p.state = 'free';
    W.pairCool[[a.id, b.id].sort().join('|')] = now + 25 * ts();
  }
  afterChat(a, b);
}
// kid-sized openers for chats without a model
function kidOpening(a, b) {
  const sa = stageOf(a), sb = stageOf(b);
  if (sa === 'adult' && sb === 'adult') return null;
  if (rand() < 0.3) return null;
  const grown = (p) => stageOf(p) === 'adult';
  let say, rep;
  if (sa === 'kid') { say = pick(['Wanna play tag?', 'Guess what! I found a shiny rock.', 'Do fish sleep?', 'Why is the sky that color?', "I'm growing like a weed!"]); rep = grown(b) ? pick(['Ha! Maybe later, kiddo.', 'You ask the best questions.', 'Is that right?']) : pick(["Yeah! You're it!", 'Let me see!', "I dunno. Let's find out!"]); }
  else if (sa === 'teen') { say = pick(['Hey.', "I'm so bored.", "Don't tell my parents, okay?", 'Did you see that? So cringe.']); rep = grown(b) ? pick(['Being a teenager is hard, huh?', 'Hang in there.', 'Your secret is safe.']) : pick(['Same.', 'Ugh, totally.', 'Wait, what happened?']); }
  else if (sb === 'kid' || sb === 'teen') { say = pick(sb === 'kid' ? ['Hey there, kiddo!', "Look how tall you're getting!", 'Staying out of trouble?'] : ['Hey. How is school going?', "You've gotten so tall.", 'Want some advice? No? Okay.']); rep = sb === 'kid' ? pick(['I am! Mostly.', "I'm the tallest in my family soon!", 'Hehe. Hi!']) : pick(['Fine.', 'I guess.', "It's whatever."]); }
  else return null;
  return { say, action: 'chat', feeling: 0.2, reply: { say: rep, action: 'chat', feeling: 0.2 } };
}
// what the models are told about age
function ageNote(p, you = true) {
  const st = stageOf(p); if (st === 'adult') return '';
  const n = p.name, T = {
    baby: [' You are a newborn baby. You cannot talk yet: only baby sounds (ba, goo, giggles, crying), never real words.', ` ${n} is a baby who can't talk yet. Coo at them the way a kind grown-up would.`],
    toddler: [' You are a toddler, about two. You only say one to four simple words at a time.', ` ${n} is a toddler who only knows a few words. Talk to them the way a kind grown-up talks to a little kid.`],
    kid: [" You are a little kid, about seven. Talk like one: simple words, big feelings, lots of questions. You play; you don't work. Nothing romantic, ever.", ` ${n} is a young kid, not a grown-up. Keep it kind and kid-friendly: no flirting, no romance, no adult topics.`],
    teen: [" You are a teenager, about fifteen. Talk like one. You don't have a job yet, and you are too young for dating or romance.", ` ${n} is a teenager, not an adult. Nothing romantic or flirty, and no adult topics.`],
  };
  return T[st][you ? 0 : 1];
}

// ---- per frame: babies in arms, toddler waddle, kids hopping around ----
function growFrame(p, m) {
  if (!p.inside && now - (carrying.get(p.id) ?? -99) < 0.4) { m.arms[1].rotation.x = -0.95; m.arms[1].rotation.z = 0.25; }
  const st = stageOf(p); if (st === 'adult') return;
  m.hat.visible = st !== 'baby';
  m.tagNm.hidden = p.task?.kind === 'carried';
  if (m.shadow) m.shadow.visible = true;
  if (p.task?.kind === 'carried') {
    const pm = meshes.get(p.task.who); if (!pm) return;
    const r = pm.root.rotation.y, s = pm.root.scale.x, ox = 0.52 * s, oz = 0.3 * s;
    m.root.position.set(pm.root.position.x + ox * Math.cos(r) + oz * Math.sin(r), pm.root.position.y + pm.fig.position.y + 0.5 * s, pm.root.position.z - ox * Math.sin(r) + oz * Math.cos(r));
    m.root.rotation.y = r - 0.6;
    m.fig.position.y = 0; m.fig.rotation.z = 0;
    m.legs.forEach((l) => (l.rotation.x = -1.35)); m.arms.forEach((a) => (a.rotation.x = -0.7));
    if (m.shadow) m.shadow.visible = false;
    return;
  }
  if (p.task?.kind === 'play' && p.task.phase === 'do' && !p.pose) {
    const k = now * 7 + p.x;
    m.fig.position.y = Math.abs(Math.sin(k)) * (st === 'teen' ? 0.08 : 0.28);
    if (st !== 'teen') m.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (1.5 + 0.5 * Math.sin(k + i)); });
    return;
  }
  if (st === 'toddler' && p.moving) m.fig.rotation.z = Math.sin(now * 11) * 0.13;
}
function growUpBoot() {
  W.added = W.added || {}; if (W.added.lifeStages) return; W.added.lifeStages = true;
  const young = [];
  for (const p of W.people) {
    if (!(p.parents || []).length || p.visitor || p.npc) continue;
    let st = stageForAge(ageDays(p));
    // anyone who already has a partner or children stays grown up
    if (st !== 'adult' && (p.partner || p.married || W.people.some((k) => (k.parents || []).includes(p.name)))) st = 'adult';
    if (st !== 'adult') {
      if (p.job && W.keeper && W.keeper[p.job] === p.id) delete W.keeper[p.job];
      p.job = null; p.jobDays = 0; p.confessTo = p.proposeTo = p.breakWith = null;
      if (p.task?.kind === 'work') { p.task = null; p.inside = false; }
      young.push(p);
    }
    setStage(p, st, false);
    if (st !== 'adult') dressMesh(p);
  }
  if (typeof logUpdate === 'function') logUpdate('build', `Babies are babies now. A newborn naps at home or rides around town in a parent's arms, and the parents come back to pick them up, feed them and rock them when they cry. After 4 days they toddle along holding a parent's hand, at 8 they run around playing as kids, at 15 they turn into teenagers who want their own space, and at 22 days (a bit under two hours of real time) they grow up and get a job. Kids and teens stay out of dating, jobs and crime until then.${young.length ? ` ${young.map((p) => p.name).join(', ')} ${young.length > 1 ? 'were' : 'was'} born only days ago, so they went back to the age they really are.` : ''}`, 'babies grow up in stages');
}
