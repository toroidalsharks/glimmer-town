// ============================================================
// HEALTH: colds and flu, bumps and breaks, things people live with,
// mental health, and Glimmer Clinic
// ============================================================
const CONDITIONS = {
  ocd: { name: 'OCD', long: 'obsessive-compulsive disorder (OCD)', mind: true, icon: '🔁', base: 0.2,
    inner: "Your mind sometimes snags on an unwanted thought and won't let go until something feels \"right\": checking, counting, redoing, or asking for reassurance. The ritual quiets the anxiety for a moment, then the loop can come back. It has nothing to do with being tidy, and your intrusive thoughts are not who you are.",
    today: "The OCD is loud today: checking things, counting, needing things to feel just right before you can move on. It's tiring, and you'd rather people didn't make a big deal of it.",
    about: 'Unwanted thoughts that keep coming back (obsessions), and things done to quiet the anxiety (compulsions), like checking, counting or redoing. It is not about being neat. Therapy, especially ERP, helps many people.',
    memo: 'A loud OCD day. Lots of checking.',
    lines: ['…one more check. Okay. Okay.', "Did I lock it? I locked it. I'll check once more.", '…seven, eight, nine, ten. Okay.', "That didn't feel right. Again.", "It's fine. It's fine. Moving on."] },
  schizotypal: { name: 'schizotypal', long: 'schizotypal personality disorder', mind: true, icon: '🌙', base: 0.16,
    inner: "You experience the world a little differently from most people: small things can feel charged with hidden meaning, you sometimes sense a presence or feel watched, and your thoughts drift in strange, dreamy directions. New people make you anxious, and that doesn't fade just because you've met them a few times. With the few people you really trust, you can open all the way up.",
    today: "The world feels thin and a little too meaningful today: coincidences feel like signs and you keep feeling watched. You're sticking to quiet places and people you trust, and letting the feeling pass.",
    about: 'A way of experiencing the world that can include unusual perceptions, ideas that feel magical or meaningful, feeling watched, and social anxiety that stays even with familiar people. Patience, routine, therapy and never being mocked help.',
    memo: 'Everything felt a little too meaningful today. Kept to quiet places.',
    lines: ['Everything feels a little too meaningful today.', 'I keep feeling watched. …Deep breath.', 'Not today, crowds.', 'The light looks strange today. Or I do.', "I'll just sit somewhere quiet for a bit."] },
  anxiety: { name: 'anxiety', long: 'an anxiety disorder', mind: true, icon: '💭', base: 0.18,
    inner: "You worry a lot, often about things that probably won't happen, and your body feels it: a tight chest, a racing heart. Crowds and new situations take extra energy.",
    today: "Your anxiety is high today. Your heart keeps racing for no clear reason and crowds feel like a lot.",
    about: 'Worry that is hard to switch off, often with a racing heart or tight chest. Very common, and very treatable with therapy, practice and support.',
    memo: 'Anxious all day. Heart would not slow down.',
    lines: ['Too many people…', 'Did I say something weird earlier?', 'Breathe in. Breathe out.', "My heart won't slow down."] },
  depression: { name: 'depression', long: 'depression', mind: true, icon: '🌧', base: 0.14,
    inner: "Some stretches your mood sinks and stays low: things you usually love feel flat, and everything takes more energy. It comes and goes, and it isn't a choice.",
    today: "It's a heavy day. Getting out of bed took everything, things feel flat, and you have less to say than usual.",
    about: 'Low mood that sticks around, where even good things can feel flat and everything takes more energy. Not a choice or a weakness. Therapy, connection and care help.',
    memo: 'A heavy day. Hard to get going.',
    lines: ['Just tired. The heavy kind.', 'Everything feels flat today.', "I'll be okay. Just not today."] },
  adhd: { name: 'ADHD', long: 'ADHD', mind: true, icon: '⚡', base: 0.25,
    inner: 'Your attention goes where it wants: you lose track of time and plans, jump between ideas, and can hyperfocus for hours on something you love.',
    today: 'Your brain is extra scattered today. You keep starting things and wandering off mid-thought.',
    about: 'Attention that is hard to steer: trouble with boring tasks, losing track of plans, and deep hyperfocus on interesting things.',
    memo: 'Scattered day. Started ten things.',
    lines: ['Wait, what was I doing?', "Ooh, what's that?", 'I had a plan. Where did it go?'] },
  insomnia: { name: 'insomnia', long: 'insomnia', icon: '🌒', base: 0.22,
    inner: "You often can't fall asleep or stay asleep, so you're tired a lot.",
    today: 'You barely slept last night. Everything is a bit foggy.',
    about: 'Trouble falling or staying asleep. Routines, less screen time at night, and a doctor can help.',
    memo: 'Barely slept.',
    lines: ['*yaaawn*', 'I slept maybe two hours.', 'Coffee. Please. Anyone.'] },
  asthma: { name: 'asthma', long: 'asthma', icon: '💨', base: 0.1,
    inner: 'Your lungs get tight sometimes, especially in cold air, storms, or when you rush. You keep an inhaler handy.',
    today: "Your chest feels tight today. You're taking it slow and using your inhaler.",
    about: 'Airways that tighten up, especially with cold air, exercise or storms. An inhaler and check-ups keep it manageable.',
    memo: 'Chest was tight today. Used my inhaler.',
    lines: ['*wheeze* One sec. Inhaler.', 'The cold air gets me.', 'Just need to slow down a little.'] },
  allergies: { name: 'allergies', long: 'seasonal allergies', icon: '🤧', base: 0.1,
    inner: 'Pollen and dust make you sneeze and your eyes itch, worst in spring.',
    today: 'Your allergies are awful today: sneezing, itchy eyes, stuffy nose.',
    about: 'Sneezing and itchy eyes from pollen and dust, worst in spring. Allergy medicine from the doctor helps.',
    memo: 'Allergies were terrible.',
    lines: ['Achoo!', 'Pollen. Why.', '*sniffle* My eyes are so itchy.'] },
  migraines: { name: 'migraines', long: 'migraines', icon: '🌀', base: 0.09,
    inner: 'You get migraines sometimes: pounding headaches where light and noise hurt.',
    today: 'You have a migraine today. Light hurts, noise hurts. You want a dark, quiet room.',
    about: 'Pounding headaches, often with light and noise hurting. Rest in a dark room and medicine from the doctor help.',
    memo: 'Migraine. Stayed in the dark.',
    lines: ['Too bright. Everything is too bright.', 'I need a dark room.', "Please don't talk so loud today."] },
  jointpain: { name: 'joint pain', long: 'chronic joint pain', icon: '🦵', base: 0.12, body: true,
    inner: 'Your joints ache a lot, worse on cold mornings.', today: 'Your joints are really bad today.',
    about: 'Aching joints that come and go, often worse in the cold. Check-ups, gentle movement and warmth help.',
    memo: 'Joints were really bad today.', lines: ['My joints. Man.', 'Cold mornings are rough.'] },
  nausea: { name: 'morning nausea', long: 'morning nausea', icon: '🌫', base: 0, body: true,
    inner: 'You feel sick to your stomach most mornings.', today: '', about: 'Feeling sick most mornings. It usually passes by midday.', memo: '', lines: ['Mornings are the worst.'] },
};
const ILLS = {
  cold: { name: 'a cold', icon: '🤧', days: [2, 3], sev: 1, catchy: 1, look: 'sniffly, with a red nose', feel: 'Your nose is stuffed up and you keep sneezing.', lines: ['*sniff*', 'Achoo!', 'My nose is a faucet.', "Just a cold. I'm fine. *sniff*"] },
  flu: { name: 'the flu', icon: '🤒', days: [3, 5], sev: 2, catchy: 0.8, look: 'pale and shivery', feel: 'You ache all over and you are freezing and too hot at once.', lines: ['Everything hurts.', 'I need a blanket. And another blanket.', 'So… cold…'] },
  stomach: { name: 'a stomach bug', icon: '🤢', days: [1, 2], sev: 2, catchy: 0.35, look: 'queasy', feel: 'Your stomach is doing flips. Food sounds terrible.', lines: ['Never eating again.', 'Ugh, my stomach.', "Don't say the word \"soup\"."] },
  sunburn: { name: 'a sunburn', icon: '🥵', days: [1, 2], sev: 1, catchy: 0, look: 'pink and toasty', feel: 'Your skin stings.', lines: ["Ow. Don't pat my back.", 'I forgot sunscreen. Again.'] },
  pneumonia: { name: 'pneumonia', icon: '😷', days: [4, 6], sev: 3, catchy: 0, look: 'really unwell', feel: 'Breathing hurts and you are exhausted. You are really sick.', lines: ['*cough cough*', "Can't… breathe right."] },
};
const INJURIES = {
  scrape: { name: 'a scraped knee', icon: '🩹', rank: 1, days: [1, 2], lines: ['Ow, my knee.', "It's just a scrape. It stings though."] },
  bump: { name: 'a bump on the head', icon: '🤕', rank: 1, days: [1, 2], lines: ["Ow. There's a lump.", 'My head is ringing a little.'] },
  burn: { name: 'a burned hand', icon: '🔥', rank: 2, days: [1, 3], lines: ['Hot pan. Bad idea.', 'Ice. I need ice.'] },
  sprain: { name: 'a sprained ankle', icon: '🦶', rank: 3, days: [2, 4], slow: 0.6, lines: ['Hop, hop, ow.', 'Taking it slow today.'] },
  broken: { name: 'a broken arm', icon: '🦴', rank: 4, days: [5, 8], slow: 0.92, needsDoc: true, lines: ['Sign my cast?', "It itches under here and I can't scratch it."] },
};
const LOW_LINES = ["I'm okay. Mostly.", 'Just a rough few days.', "I don't really feel like talking.", '…'];
const NPC = {
  doc: { id: 'npc-doc', name: 'Dr. Juniper', npc: true, body: { hue: 28, sat: 45, light: 78, size: 1.05, ears: 'round', eyeGap: 0.3 }, outfit: { shirt: 'cream', hat: null }, grow: 1, level: 30, room: 5, feelings: {} },
  sol: { id: 'npc-sol', name: 'Sol', npc: true, body: { hue: 250, sat: 35, light: 82, size: 1.0, ears: 'none', eyeGap: 0.34 }, outfit: { shirt: 'lilac', hat: null }, grow: 1, level: 30, room: 7, feelings: {} },
};
const STRESS_TAGS = { fight: 1.2, gotMean: 1, stoodUp: 1, breakup: 2, heartbreak: 2, lostCase: 1.2, suedBy: 1, meetingShamed: 1.5, refusedMine: 0.6, wishLost: 0.8, jealous: 0.6, jealousLove: 0.8, laughedAt: 1, textMean: 0.8, subtweeted: 0.7, laptopEnvy: 0.3, uproar: 0.8, hungry: 0.6, stuck: 0.5, strike: 0.5, unfair: 0.6, sick: 0.5, hurt: 0.7 };
const COMFORT_TAGS = { hug: 0.6, cuddle: 0.8, gotKind: 0.5, date: 0.6, wasDefended: 0.8, creatorGift: 0.5, won: 0.6, wonCase: 0.8, married: 1.5, engaged: 1, love: 0.8, newFriend: 0.8, gotApology: 0.8, gotBday: 0.8, wishGranted: 1, hired: 1, research: 1, handhold: 0.6, therapy: 1, careKind: 1, laptopGot: 1.5 };
const KIND_RE = /love|proud|here for you|okay|ok\b|care|glad|rest|take (your )?time|no rush|not alone|you matter|brave|strong|gentle|hug|safe|believe|valid|sorry|better|with you|listen|breathe|kind|thank/i;

function andList(a) { return a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
function rollCondition() { const L = [['anxiety', 3], ['allergies', 3], ['adhd', 2], ['asthma', 2], ['migraines', 2], ['depression', 2], ['insomnia', 2], ['ocd', 1]]; let t = rand() * L.reduce((s, x) => s + x[1], 0); for (const [k, w] of L) { t -= w; if (t <= 0) return k; } return 'anxiety'; }
function conditionsFromText(s) {
  const out = [], T = String(s || '');
  const M = [[/joint|knee|arthrit/i, 'jointpain'], [/sick most|nause|morning sick|sick.*morning/i, 'nausea'], [/asthma|wheez/i, 'asthma'], [/allerg|hay ?fever|pollen/i, 'allergies'], [/migraine|headache/i, 'migraines'], [/anxi|panic/i, 'anxiety'], [/depress/i, 'depression'], [/adhd|add\b/i, 'adhd'], [/insomnia|can'?t sleep/i, 'insomnia'], [/\bocd\b|obsessive/i, 'ocd'], [/schizotyp/i, 'schizotypal']];
  for (const [re, k] of M) if (re.test(T) && !out.includes(k)) out.push(k);
  return out;
}
function ensureHealth(p) {
  if (p.health) return p.health;
  const H = p.health = { cond: [], managed: {}, ill: null, injury: null, flare: null, low: null, stress: 0, visits: 0, sessions: 0, docDay: -1, therapyDay: -1, lastTherapy: -9, soupDay: -1, chat: [] };
  if (typeof isMili === 'function' && isMili(p)) H.cond = ['ocd', 'schizotypal'];
  else if (p.body?.ailments?.length || p.custom || p.style || p.lovesMili) H.cond = conditionsFromText((p.body?.ailments || []).join('. '));
  else if (p.parents?.length) { const par = W.people.filter((q) => p.parents.includes(q.name) && q.health?.cond.length); if (par.length && rand() < 0.3) H.cond = [pick(pick(par).health.cond)]; else if (rand() < 0.2) H.cond = [rollCondition()]; }
  else if (!p.visitor && rand() < 0.3) H.cond = [rollCondition()];
  return H;
}
const hasHospital = () => (W.placed || []).some((pl) => pl.type === 'clinic');
const clinicOpen = () => W.t > 0.03 && W.t < 0.52;
function clinicOnDuty(job) { return W.people.filter((q) => q.job === job && q.inside && q.task?.kind === 'work' && q.task.phase === 'do' && q.at === 'clinic'); }
function clinicSpot() { return jitter(TOWN.clinic.spot, 0.8); }
function flareChance(p, c, H) {
  const C = CONDITIONS[c], s = seasonOf().id, w = W.weather, st = H.stress || 0;
  let ch = C.base ?? 0.15;
  if (c === 'asthma') ch *= w === 'storm' ? 3 : s === 'winter' || w === 'snow' ? 2 : w === 'rain' ? 1.3 : 1;
  if (c === 'allergies') ch *= s === 'spring' ? 4 : s === 'summer' ? 1.5 : s === 'winter' ? 0.15 : 0.7;
  if (c === 'migraines') ch *= (w === 'storm' ? 2 : 1) * (1 + 0.25 * st);
  if (c === 'jointpain') ch *= (s === 'winter' ? 1.7 : 1) * (w === 'rain' || w === 'storm' ? 1.5 : 1);
  if (c === 'insomnia') ch *= 1 + 0.2 * st;
  if (C.mind) ch *= 1 + 0.3 * st;
  if (c === 'depression') ch *= (s === 'winter' ? 1.4 : 1) * (H.low ? 2 : 1);
  return Math.min(0.85, ch * Math.max(0.35, 1 - 0.09 * (H.managed[c] || 0)));
}
function catchIll(p, id, how = 'caught') {
  const H = ensureHealth(p), I = ILLS[id]; if (!I || H.ill || (H.immune || -9) > W.day - 4 && id !== 'pneumonia') return false;
  H.ill = { id, days: I.days[0] + Math.floor(rand() * (I.days[1] - I.days[0] + 1)), since: W.day, treated: false };
  remember(p, `${how === 'caught' ? 'Caught' : cap(how)} ${I.name}.`, 2, 'sick');
  diary(`${I.icon} <b>${esc(p.name)}</b> ${how} ${I.name}.`);
  emote(p, I.icon, 4); if (!p.inside) bubble(p, pick(I.lines), 2.6);
  if (typeof postChirp === 'function' && id !== 'sunburn' && rand() < 0.3) postChirp(p, pick([`home sick with ${I.name}. send soup`, `${I.name} update: still alive. barely`, `if you see me sneeze, no you didn't`]));
  return true;
}
function injure(p, id, how) {
  const H = ensureHealth(p), J = INJURIES[id]; if (!J) return false;
  if (H.injury && INJURIES[H.injury.id].rank >= J.rank) return false;
  H.injury = { id, days: J.days[0] + Math.floor(rand() * (J.days[1] - J.days[0] + 1)), since: W.day, set: false, how };
  remember(p, `Got ${J.name} ${how}.`, 2, 'hurt');
  diary(`${J.icon} <b>${esc(p.name)}</b> got ${J.name} ${how}.`);
  emote(p, J.icon, 4); bubble(p, pick(J.lines), 2.6);
  if (J.rank >= 3) H.docNext = true;
  if (typeof postChirp === 'function' && J.rank >= 3 && rand() < 0.5) postChirp(p, J.rank >= 4 ? 'broke my arm. come sign my cast' : 'sprained my ankle. i am a crutch person now');
  return true;
}
function fightInjury(a, b) {
  const r = rand();
  if (r < 0.04) injure(b, 'broken', `in a scuffle with ${a.name}`);
  else if (r < 0.12) injure(b, 'sprain', `in a scuffle with ${a.name}`);
  else if (r < 0.34) injure(b, rand() < 0.5 ? 'bump' : 'scrape', `in a scuffle with ${a.name}`);
  if (rand() < 0.1) injure(a, 'scrape', `in a scuffle with ${b.name}`);
}
function workInjury(p) {
  const j = p.job, r = rand();
  if (j === 'builder') { if (r < 0.006) injure(p, 'broken', 'falling off a ladder at the construction site'); else if (r < 0.02) injure(p, 'sprain', 'at the construction site'); else if (r < 0.04) injure(p, 'bump', 'at the construction site'); }
  else if (j === 'bakery' || j === 'cafe' || j === 'mart') { if (r < 0.012) injure(p, 'burn', 'on a hot tray at work'); }
  else if (j === 'chem') { if (r < 0.015) injure(p, 'burn', 'when an experiment fizzed over'); }
  else if (j === 'robo') { if (r < 0.01) injure(p, 'bump', 'when a robot arm swung the wrong way'); }
  else if (j === 'pier' || j === 'garden' || j === 'janitor') { if (r < 0.01) injure(p, 'scrape', 'at work'); }
  if (p.job && p.health?.flare && !CONDITIONS[p.health.flare.id].mind && rand() < 0.3) remember(p, `Worked through ${CONDITIONS[p.health.flare.id].name}. Hard day.`, 1, 'work');
}
function healthWorkBonus(p) {
  const H = p.health; if (!H) return 0;
  let b = 0;
  if (H.flare?.id === 'adhd' && rand() < 0.5) b += 5;
  if (H.flare?.id === 'ocd') b += 2;
  if (H.flare?.id === 'depression' || H.low) b -= 3;
  if (H.flare?.id === 'insomnia' || H.flare?.id === 'migraines') b -= 3;
  if (H.ill) b -= 2;
  return b;
}
function healthSpeed(p) {
  const H = p.health; if (!H) return 1;
  let s = 1;
  if (H.ill) s *= ILLS[H.ill.id].sev >= 2 ? 0.7 : 0.9;
  if (H.injury) s *= INJURIES[H.injury.id].slow || 1;
  if (H.flare && !H.eased) s *= { jointpain: 0.75, migraines: 0.85, depression: 0.8, insomnia: 0.85, asthma: 0.85 }[H.flare.id] || 1;
  if (H.low) s *= 0.88;
  return s;
}
function wantsQuiet(a, b) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const H = x.health; if (!H) continue; const f = fscore(x, y);
    if (H.flare && !H.eased && ['schizotypal', 'anxiety'].includes(H.flare.id) && f < 4) return true;
    if ((H.low || H.flare?.id === 'depression' || H.flare?.id === 'migraines') && f < 5) return true;
    if (H.ill && ILLS[H.ill.id].sev >= 2 && f < 6) return true;
  }
  return false;
}
function quietSpot() { const r = rand(); if (r < 0.35) return ['garden', jitter(TOWN.garden.spot, 5)]; if (r < 0.65) { const a = rand() * 6.28, rr = rand() * 6; return ['beach', [BEACH[0] + Math.cos(a) * rr, BEACH[1] + Math.sin(a) * rr]]; } return ['park', jitter(TOWN.park.spot, 6)]; }

// the day's rhythm
function healthNight() {
  for (const p of W.people) {
    if (p.task?.kind === 'away') continue;
    const H = ensureHealth(p); let st = 0, worst = null, wv = 0;
    for (const m of p.today) { const v = STRESS_TAGS[m.tag] || 0; st += v - (COMFORT_TAGS[m.tag] || 0); if (v > wv) { wv = v; worst = m.text; } }
    H.stress = clamp((H.stress || 0) * 0.55 + st, 0, 8);
    H.rituals = 0;
    if (!H.low && H.stress >= 2.5 && rand() < 0.22 + (H.cond.includes('depression') ? 0.2 : 0)) {
      H.low = { days: 2 + Math.floor(rand() * 3), why: worst ? String(worst).replace(/\.$/, '').slice(0, 90) : 'a hard week', since: W.day };
      remember(p, 'I have been feeling really low lately.', 2, 'low');
    }
  }
}
function healthMorning() {
  const hosp = hasHospital();
  for (const p of W.people) {
    if (p.task?.kind === 'away') continue;
    const H = ensureHealth(p);
    H.flare = null; H.eased = false; H.callIn = null;
    if (H.ill) {
      const I = ILLS[H.ill.id];
      H.ill.days -= 1 + (H.ill.treated ? 0.5 : 0) + (hosp && H.ill.treated ? 0.5 : 0) + (H.soupDay === W.day - 1 ? 0.5 : 0);
      if (H.ill.id === 'pneumonia' && !H.ill.treated) H.ill.days += 0.6;
      if (H.ill.days <= 0) { remember(p, `I'm finally over ${I.name}.`, 2, 'recovered'); diary(`🌤 <b>${esc(p.name)}</b> is over ${I.name}.`); H.ill = null; H.immune = W.day; addJoy(p, 10); }
      else if (H.ill.id === 'flu' && !H.ill.treated && W.day - H.ill.since >= 2 && rand() < 0.3) { H.ill = { id: 'pneumonia', days: 5, since: W.day, treated: false }; remember(p, 'My flu got worse. It turned into pneumonia.', 3, 'sick'); diary(`😷 <b>${esc(p.name)}</b>'s flu turned into pneumonia. They're really sick and stuck in bed.`); }
    }
    if (H.injury) {
      const J = INJURIES[H.injury.id];
      if (!J.needsDoc || H.injury.set) H.injury.days -= 1 + (hosp ? 0.5 : 0);
      if (H.injury.days <= 0) { remember(p, `${cap(J.name.replace(/^an? /, 'My '))} healed.`, 2, 'healed'); diary(`${J.icon} <b>${esc(p.name)}</b>'s ${J.name.replace(/^an? /, '')} healed.`); H.injury = null; addJoy(p, 8); }
    }
    if (H.low) { H.low.days -= 1; if (H.low.days <= 0) { H.low = null; remember(p, 'The heavy feeling finally lifted a little.', 2, 'lifted'); } }
    if (!H.ill && !p.visitor) {
      const s = seasonOf().id, risk = (s === 'winter' ? 0.045 : s === 'autumn' ? 0.03 : 0.016) * (W.weather === 'storm' || W.weather === 'snow' ? 1.4 : 1) * (p.grow < 1 ? 1.3 : 1);
      if (rand() < risk) catchIll(p, rand() < 0.22 ? 'flu' : rand() < 0.3 ? 'stomach' : 'cold', 'woke up with');
    }
    const fl = H.cond.filter((c) => (CONDITIONS[c].base ?? 0.15) > 0).sort(() => rand() - 0.5);
    for (const c of fl) if (rand() < flareChance(p, c, H)) { H.flare = { id: c, day: W.day }; break; }
    if (H.flare && CONDITIONS[H.flare.id].memo) remember(p, CONDITIONS[H.flare.id].memo, 1, 'flare');
    const I = H.ill && ILLS[H.ill.id];
    if (p.job && ((I && I.sev >= 2) || (H.injury?.id === 'broken' && collarOf(p) !== 'white') || H.flare?.id === 'migraines' || (H.flare?.id === 'depression' && rand() < 0.4) || (H.low && rand() < 0.2))) H.callIn = W.day;
  }
  for (const p of W.people) { const H = p.health; if (H?.ill && ILLS[H.ill.id].sev >= 3 && !H.ill.treated) houseCall(p); }
  const sick = W.people.filter((p) => p.health?.ill && ILLS[p.health.ill.id].sev >= 2).length;
  if (sick >= 3) diary(`🤒 Something is going around. ${sick} people are sick today. The clinic is busy.`);
}
function houseCall(p) {
  const H = p.health, doc = W.people.find((q) => q.job === 'doctor' && q !== p && !q.health?.ill);
  H.ill.treated = true;
  diary(`🩺 ${doc ? `<b>${esc(doc.name)}</b>` : 'Dr. Juniper'} made a house call to <b>${esc(p.name)}</b>${hasHospital() ? ' and moved them to the hospital wing' : ''}.`);
  remember(p, `${doc ? doc.name : 'Dr. Juniper'} came to my room because I was too sick to get up.`, 2, 'doctor', doc?.name || null);
  if (doc) { remember(doc, 'Made a house call to a patient who was too sick to come in.', 2, 'houseCall'); addJoy(doc, 6); }
}
function healthPlan(p) {
  if (p.visitor || p.task?.kind === 'away') return false;
  const H = ensureHealth(p), t = W.t, I = H.ill && ILLS[H.ill.id], J = H.injury && INJURIES[H.injury.id];
  const ev = W.event && W.event.day === W.day ? W.event : null;
  if (H.callIn === W.day && p.job && !p.workedToday && t < 0.24) {
    p.workedToday = true; H.called = W.day;
    remember(p, `Stayed home from work today (${I ? I.name : J ? J.name : H.low ? 'a rough patch' : CONDITIONS[H.flare?.id]?.name || 'not feeling well'}).`, 1, 'callin');
    if (!p.inside) bubble(p, pick(["I'm not going in today.", "Calling in sick.", 'Work can wait. I can\'t today.']), 2.4);
  }
  const bedridden = (I && I.sev >= 3) || (I && I.sev >= 2 && t < 0.3) || (H.flare?.id === 'migraines' && !H.eased && t < 0.34) || (H.flare?.id === 'depression' && !H.eased && t < 0.2) || (H.low && t < 0.1);
  if (ev && ev.going.includes(p.id) && !ev.couple?.includes(p.id) && (bedridden || (H.flare && !H.eased && ['anxiety', 'schizotypal', 'depression'].includes(H.flare.id) && rand() < 0.5)) && H.skipped !== W.day) {
    H.skipped = W.day; ev.going = ev.going.filter((id) => id !== p.id);
    remember(p, `Skipped ${EVENTS[ev.id]?.name || 'the event'}. It was too much today.`, 1, 'skipped');
  }
  if (bedridden && p.hunger < 0.7) { setTask(p, 'rest', homeKey(p)); return true; }
  if (p.job && !p.workedToday && t < 0.24 && p.grow >= 1) return false;
  const evNow = ev && ev.going.includes(p.id) && t >= EVENTS[ev.id].t0 - 0.03 && t < EVENTS[ev.id].t1;
  if (clinicOpen() && H.docDay !== W.day && (H.docNext || (I && !H.ill.treated && (I.sev >= 2 || rand() < 0.25)) || (J && !H.injury.set && (J.needsDoc || J.rank >= 3 || rand() < 0.15)))) { H.docNext = false; setTask(p, 'doctor', 'clinic', clinicSpot()); return true; }
  const mind = H.cond.some((c) => CONDITIONS[c].mind);
  if (clinicOpen() && H.therapyDay !== W.day && (H.therapyNext || ((mind || H.low) && W.day - (H.lastTherapy ?? -9) >= 4 && ((H.flare && CONDITIONS[H.flare.id].mind) || H.low || rand() < 0.06)))) { H.therapyNext = false; setTask(p, 'therapy', 'clinic', clinicSpot()); return true; }
  if (evNow) return false;
  if (H.flare?.id === 'ocd' && !H.eased && (H.rituals || 0) < 2 && rand() < 0.12 && p.at !== homeKey(p) && t < 0.55) { H.rituals = (H.rituals || 0) + 1; setTask(p, 'ritual', homeKey(p)); return true; }
  if (H.flare && !H.eased && ['schizotypal', 'anxiety'].includes(H.flare.id) && rand() < 0.35) { const [pl, sp] = quietSpot(); setTask(p, 'stroll', pl, sp); return true; }
  if (H.low && rand() < 0.3) { const [pl, sp] = quietSpot(); setTask(p, 'stroll', pl, sp); return true; }
  return false;
}
function healthStart(p, k) {
  const H = ensureHealth(p);
  if (k === 'rest') { p.inside = true; p.busyUntil = now + 16 * ts(); if (interior?.kind === 'room' && interior.id === p.id) interior.dirty = true; return true; }
  if (k === 'doctor' || k === 'therapy') { p.inside = true; p.busyUntil = now + (k === 'doctor' ? 6 : 7) * ts(); if (interior?.kind === 'clinic') interior.dirty = true; return true; }
  if (k === 'ritual') { p.busyUntil = now + 3 * ts(); const s = TOWN[homeKey(p)].spot; p.face = Math.atan2(s[0] - p.x, s[1] - p.z) + Math.PI; emote(p, '🔁', 3); bubble(p, pick(['Did I lock it? …Yes. Okay.', 'Checking once more. Okay. Once more.', "…Okay. It's locked. It was locked.", 'One, two, three, four. Okay.']), 2.8); return true; }
  return false;
}
function healthFinish(p, k) {
  if (k === 'rest') {
    if (W.t >= 0.58) { p.task = { kind: 'home', phase: 'do' }; p.busyUntil = Infinity; return false; }
    p.inside = false; if (!p.today.some((m) => m.tag === 'rested')) remember(p, 'Stayed in bed most of the day.', 1, 'rested');
    if (interior?.kind === 'room' && interior.id === p.id) interior.dirty = true; return true;
  }
  if (k === 'doctor') { p.inside = false; doctorVisitDone(p); if (interior?.kind === 'clinic') interior.dirty = true; return true; }
  if (k === 'therapy') { p.inside = false; therapyDone(p); if (interior?.kind === 'clinic') interior.dirty = true; return true; }
  if (k === 'ritual') { bubble(p, pick(['Okay. Okay. It\'s fine.', 'Right. Moving on.', '…Better.']), 2.2); return true; }
  return true;
}
function doctorVisitDone(p) {
  const H = ensureHealth(p), doc = clinicOnDuty('doctor').find((q) => q !== p), good = doc ? 1 + (readCount(doc, ['health']) >= 2 ? 0.5 : 0) : 0.6;
  H.docDay = W.day; H.visits = (H.visits || 0) + 1;
  const bits = [], was = [];
  if (p.coins >= 6) { p.coins -= 2; if (doc) earn(doc, 1); }
  if (H.ill) { const I = ILLS[H.ill.id]; was.push(I.name); H.ill.treated = true; H.ill.days = Math.max(0.5, H.ill.days - good); bits.push(pick(['The doctor said rest and fluids.', 'Got some medicine.', 'The doctor said I will be fine in a few days.'])); }
  if (H.injury) { const J = INJURIES[H.injury.id]; was.push(J.name); H.injury.set = true; if (J.needsDoc) bits.push('The doctor put my arm in a cast.'); else { H.injury.days = Math.max(0.5, H.injury.days - good * 0.8); bits.push(J.rank >= 3 ? 'The doctor wrapped it up and gave me a crutch.' : 'The doctor patched me up.'); } }
  for (const c of H.cond) if (!CONDITIONS[c].mind) H.managed[c] = Math.min(6, (H.managed[c] || 0) + 1);
  if (!was.length) bits.push('Just a check-up. All good.');
  remember(p, `Went to the doctor${doc ? `, ${doc.name}` : ''}. ${bits.join(' ')}`, was.length ? 2 : 1, 'doctor', doc?.name || null);
  bubble(p, pick(was.length ? ['The doctor was so nice.', 'Okay. I have a plan now.', 'Feeling a little better already.'] : ['Clean bill of health!', 'Check-up done.']), 2.6);
  if (was.length) diary(`🩺 <b>${esc(p.name)}</b> saw ${doc ? `<b>${esc(doc.name)}</b>` : 'Dr. Juniper'} at Glimmer Clinic about ${andList(was)}.`);
  if (doc) { remember(doc, 'Saw a patient today. That is all I can say.', 1, 'patient'); addJoy(doc, 4); doc.health && (doc.health.patients = (doc.health.patients || 0) + 1); }
}
function therapyDone(p) {
  const H = ensureHealth(p), th = clinicOnDuty('therapist').find((q) => q !== p);
  H.therapyDay = W.day; H.lastTherapy = W.day; H.sessions = (H.sessions || 0) + 1;
  for (const c of H.cond) if (CONDITIONS[c].mind) H.managed[c] = Math.min(6, (H.managed[c] || 0) + 1);
  if (H.low) { H.low.days -= 1.5; if (H.low.days <= 0) { H.low = null; remember(p, 'Therapy helped me climb out of a low patch.', 2, 'therapy'); } }
  if (H.flare && CONDITIONS[H.flare.id].mind) H.eased = true;
  H.stress = Math.max(0, (H.stress || 0) - 1.5);
  addJoy(p, 8);
  remember(p, `Went to therapy${th ? ` with ${th.name}` : ' with Sol'}. ${pick(['It helped a little.', 'We practiced some tools for the hard days.', 'Talked it through. I feel lighter.', 'Hard session. Good, though.'])}`, 1, 'therapy');
  bubble(p, pick(['That helped.', 'Okay. I can do today.', 'Deep breaths. Got it.', '…I feel a little lighter.']), 2.4);
  if (th) { remember(th, 'Had a session with a client today. It stays in the room.', 1, 'client'); addJoy(th, 4); }
}
let healthT = 0;
function healthTick(dt) {
  healthT -= dt; if (healthT > 0) return; healthT = 3;
  const out = W.people.filter((p) => !p.inside && p.health && p.task?.kind !== 'away');
  for (const p of out) {
    const I = p.health.ill && ILLS[p.health.ill.id]; if (!I || !I.catchy) continue;
    for (const q of out) if (q !== p && !q.health.ill && Math.hypot(q.x - p.x, q.z - p.z) < 1.8 && rand() < 0.02 * I.catchy) catchIll(q, p.health.ill.id, 'caught');
  }
  for (const p of out) {
    const H = p.health; if (p.state !== 'free' || (p.bubble && p.bubble.until > now)) continue;
    if (H.ill && rand() < 0.05) { const I = ILLS[H.ill.id]; bubble(p, pick(I.lines), 2.2); emote(p, I.icon, 2.5); continue; }
    if (H.injury && rand() < 0.025) { const J = INJURIES[H.injury.id]; bubble(p, pick(J.lines), 2.2); continue; }
    if (H.flare && !H.eased && rand() < 0.035) { const C = CONDITIONS[H.flare.id]; bubble(p, pick(C.lines), 2.4); continue; }
    if (H.low && rand() < 0.02) { bubble(p, pick(LOW_LINES), 2.2); emote(p, '🌧', 2.5); continue; }
    if (H.flare?.id === 'adhd' && !H.eased && p.path.length > 1 && ['stroll', 'visit', 'shop', 'eat'].includes(p.task?.kind) && rand() < 0.03) { p.task = null; p.path = []; bubble(p, pick(['Wait, what was I doing?', "Ooh, what's over there?", 'I forgot where I was going.']), 2.4); }
  }
  if (rand() < 0.003) { const p = pick(out.filter((q) => q.path.length && q.state === 'free')); if (p) { const icy = seasonOf().id === 'winter' || W.weather === 'rain' || W.weather === 'snow'; injure(p, icy && rand() < 0.3 ? 'sprain' : 'scrape', icy ? 'slipping on the wet path' : 'tripping over nothing'); } }
  if (seasonOf().id === 'summer' && W.weather === 'clear' && rand() < 0.01) { const p = pick(out.filter((q) => q.at === 'beach' && !q.health.ill)); if (p) catchIll(p, 'sunburn', 'got'); }
  // friends notice and help
  if (rand() < 0.08) {
    const sad = out.filter((p) => (p.health.low || p.health.ill) && p.state === 'free');
    for (const p of sad) { const f = out.find((q) => q !== p && q.state === 'free' && fscore(q, p) >= 5 && Math.hypot(q.x - p.x, q.z - p.z) < 6); if (!f) continue;
      if (typeof physicalScene === 'function' && p.health.low && rand() < 0.6) { physicalScene(f, p, 'hug'); setTimeout(() => bubble(f, pick(["I'm here, okay?", 'You don\'t have to talk. I\'ll just stay.', 'Rough week, huh. C\'mere.']), 2.6), 400); if (p.health.low) { p.health.low.days -= 0.5; if (p.health.low.days <= 0) p.health.low = null; } remember(p, `${f.name} noticed I was down and gave me a hug.`, 2, 'hug', f.name); remember(f, `${p.name} seemed down, so I checked on them.`, 1, 'gaveKind', p.name); }
      else if (p.health.ill) { bubble(f, pick(['Feel better soon!', 'Want me to bring you tea?', 'Go rest! Shoo!']), 2.4); feel(p, f, 0.3, true); }
      break; }
  }
}

// what they know and say
function healthContext(me, them) {
  const H = me.health; if (!H) return '';
  const L = [];
  const conds = H.cond.filter((c) => !(CONDITIONS[c].body && me.body.ailments?.length));
  if (conds.length) L.push(`You live with ${andList(conds.map((c) => CONDITIONS[c].long))}. What that's like for you: ${conds.map((c) => CONDITIONS[c].inner).join(' ')}${H.sessions ? ` You go to therapy sometimes and it helps (${plural(H.sessions, 'session')} so far).` : ''} It is part of you, not all of you: it shapes some moments, and most of the time you're just living your life. Don't announce it or explain it unless it truly fits, and only open up about it with people you trust.`);
  if (H.flare && CONDITIONS[H.flare.id].today) L.push(`TODAY: ${CONDITIONS[H.flare.id].today}${H.eased ? ' Therapy earlier helped take the edge off.' : ''}`);
  if (H.ill) L.push(`You're sick with ${ILLS[H.ill.id].name} right now. ${ILLS[H.ill.id].feel}`);
  if (H.injury) L.push(`You have ${INJURIES[H.injury.id].name}${H.injury.id === 'broken' && H.injury.set ? ' (in a cast)' : ''}, from ${H.injury.how || 'an accident'}. It's sore.`);
  if (H.low) L.push(`You've been in a rough patch for a few days (it started with: ${H.low.why}). You feel heavier and quieter than usual.`);
  if (me.job === 'doctor' || me.job === 'therapist') L.push(`As a ${JOBS[me.job].short}, you never, ever talk about your ${me.job === 'doctor' ? 'patients' : 'clients'} or who comes to the clinic.`);
  if (them && them !== me && them.health) {
    const T = them.health, f = fscore(me, them), seen = [];
    if (T.ill) seen.push(`${them.name} is obviously sick (${ILLS[T.ill.id].look})`);
    if (T.injury) seen.push(`${them.name} has ${INJURIES[T.injury.id].name}`);
    const tc = T.cond.filter((c) => CONDITIONS[c].mind);
    if (tc.length && f >= 6) seen.push(`${them.name} has trusted you with something personal: living with ${andList(tc.map((c) => CONDITIONS[c].long))}`);
    if (T.low && f >= 4) seen.push(`${them.name} has seemed down lately`);
    if (seen.length) L.push(seen.join('. ') + '.');
  }
  if (!L.length) return '';
  return `\nHEALTH: ${L.join(' ')} Nobody on this island mocks anyone's health or mental health; even rivals don't cross that line.`;
}
function healthProblem(p) { const H = p.health; if (!H) return null; if (H.ill) return { kind: 'sick' }; if (H.injury) return { kind: 'hurt' }; if (H.low) return { kind: 'low' }; return null; }
function healthGreet(p, pr) {
  const H = p.health;
  if (pr.kind === 'sick') { const I = ILLS[H.ill.id]; return I.sev >= 3 ? "*cough* I'm really sick… I can barely get up." : pick([`*sniff* I've got ${I.name}. Everything feels heavy.`, `I'm sick. ${cap(I.name)}. Don't get too close!`]); }
  if (pr.kind === 'hurt') { const J = INJURIES[H.injury.id]; return pick([`I got ${J.name}. ${H.injury.how ? `It happened ${H.injury.how}.` : ''}`, `Ow. ${cap(J.name)}. I'll be okay.`]); }
  return pick(["I've been having a rough few days.", "Hi… sorry, I'm not much company lately.", "I'm okay. Mostly. It's been a heavy week."]);
}
function healthChip(p) { const H = p.health; if (H.ill) return `${ILLS[H.ill.id].icon} ${esc(p.name)}: ${esc(ILLS[H.ill.id].name.replace(/^an? |^the /, ''))}`; if (H.injury) return `${INJURIES[H.injury.id].icon} ${esc(p.name)}: ${esc(INJURIES[H.injury.id].name.replace(/^an? /, ''))}`; return `🌧 ${esc(p.name)}: rough patch`; }
function healthSummary(p) {
  const H = ensureHealth(p), L = [];
  if (H.ill) L.push(`${ILLS[H.ill.id].icon} Has ${ILLS[H.ill.id].name}${H.ill.treated ? ' (seen a doctor)' : ''}`);
  if (H.injury) L.push(`${INJURIES[H.injury.id].icon} Has ${INJURIES[H.injury.id].name}`);
  if (H.low) L.push('🌧 Going through a rough patch');
  if (H.cond.length) L.push(`Lives with ${andList(H.cond.map((c) => CONDITIONS[c].name))}`);
  return L.length ? L.join(' · ') : '💚 Healthy';
}
function healthDetailHtml(p) {
  const H = ensureHealth(p), now_ = H.ill || H.injury || H.low;
  return `<p class="label">Health</p><p class="hint">${healthSummary(p)}. <button class="btn" type="button" data-care="${p.id}">${now_ ? 'Take care of them' : 'Check on them'}</button></p>`;
}
function healthHtml() {
  const docs = W.people.filter((p) => p.job === 'doctor'), ths = W.people.filter((p) => p.job === 'therapist');
  const sick = W.people.filter((p) => p.health && (p.health.ill || p.health.injury || p.health.low));
  return `<p class="label">🩺 Glimmer Clinic</p><div class="btns"><button class="btn" type="button" data-clinicview>${MODE === 'host' ? 'Go inside' : 'Show inside in the box'}</button></div>
    <p class="hint">${docs.length ? `Doctor${docs.length > 1 ? 's' : ''}: ${docs.map((p) => esc(p.name)).join(', ')}.` : 'No doctor lives here yet, so Dr. Juniper comes over on the morning ferry. (Residents who read about health and science can train up.)'} ${ths.length ? `Therapist${ths.length > 1 ? 's' : ''}: ${ths.map((p) => esc(p.name)).join(', ')}.` : 'Sol, a counselor from the mainland, holds sessions until someone here trains up (psychology and philosophy books).'}${hasHospital() ? ' The hospital wing helps everyone heal faster.' : ''}</p>
    ${sick.length ? `<div class="chips">${sick.map((p) => `<button class="btn" type="button" data-care="${p.id}" style="padding:4px 10px;font-size:12px">${healthChip(p)}</button>`).join('')}</div>` : '<p class="hint">Everyone is healthy today. 💚</p>'}`;
}

// looks: casts, bandages, crutches, red noses
function healthLook(p, m) {
  const H = p.health, inj = H?.injury?.id, ill = H?.ill;
  const want = (key, on, make) => { if (on && !m[key]) m[key] = make(); if (m[key]) m[key].visible = !!on; };
  const white = toon('#ffffff');
  want('hCast', inj === 'broken', () => { const c = mesh(new T3.CapsuleGeometry(0.135, 0.2, 4, 8), white, 0, -0.06, 0, false); m.arms[0].add(c); return c; });
  want('hBand', inj === 'bump', () => { const b = mesh(new T3.TorusGeometry(0.585, 0.055, 6, 22), white, 0, 0.22, 0, false); b.rotation.x = Math.PI / 2; b.rotation.y = 0.15; m.head.add(b); return b; });
  want('hKnee', inj === 'scrape', () => { const k = mesh(box(0.27, 0.09, 0.27), white, 0, 0.02, 0, false); m.legs[0].add(k); return k; });
  want('hMitt', inj === 'burn', () => { const k = mesh(sph(0.13, 8, 6), white, 0, -0.2, 0, false); m.arms[1].add(k); return k; });
  want('hCrutch', inj === 'sprain', () => { const g = new T3.Group(); g.add(mesh(cyl(0.035, 0.035, 1.1, 6), toon('#c9ccd6'), 0, 0.55, 0, false)); g.add(mesh(box(0.22, 0.06, 0.1), toon('#5a5470'), 0, 1.1, 0, false)); g.position.set(0.62, 0, 0.05); g.rotation.z = -0.12; m.fig.add(g); return g; });
  want('hNose', ill && ILLS[ill.id].sev <= 2 && ill.id !== 'sunburn', () => { const n = mesh(sph(0.075, 8, 6), toon('#ff8f8f'), 0, -0.03, 0.61, false); m.head.add(n); return n; });
  want('hMask', ill && ILLS[ill.id].sev >= 3, () => { const k = mesh(box(0.5, 0.26, 0.1), toon('#bfe8ff'), 0, -0.15, 0.56, false); m.head.add(k); return k; });
}

// Glimmer Clinic, downtown
function buildClinic() {
  const g = new T3.Group(), white = toon('#fbfdfc'), mint = toon('#6fb8a8'), glass = toon('#bfe8ff'), red = toon('#ff6f5e');
  g.add(mesh(box(7.4, 5, 7), white, 0, 2.5, 0));
  g.add(mesh(box(7.8, 0.45, 7.4), mint, 0, 5.2, 0));
  g.add(mesh(box(7.6, 0.35, 7.2), mint, 0, 0.17, 0));
  g.add(mesh(box(2.2, 2.8, 0.12), glass, 0, 1.4, 3.52)); g.add(mesh(box(0.08, 2.8, 0.16), mint, 0, 1.4, 3.56));
  for (const s of [-1, 1]) { g.add(mesh(box(1.7, 1.4, 0.1), glass, s * 2.55, 2.5, 3.52)); g.add(mesh(box(1.9, 0.12, 0.3), mint, s * 2.55, 1.74, 3.6)); }
  g.add(mesh(box(3.2, 0.14, 1.5), mint, 0, 3.15, 4.2)); for (const s of [-1.45, 1.45]) g.add(mesh(cyl(0.06, 0.06, 3.1, 6), mint, s, 1.55, 4.85));
  const sg = sign('Glimmer Clinic', '#fbfdfc', '#3d8a78', 5); sg.position.set(0, 4.1, 3.57); g.add(sg);
  g.add(mesh(box(2.1, 2.1, 0.2), white, 0, 6.5, 1.2)); for (const zz of [1.35, 1.05]) { g.add(mesh(box(1.5, 0.48, 0.1), red, 0, 6.5, zz, false)); g.add(mesh(box(0.48, 1.5, 0.1), red, 0, 6.5, zz, false)); }
  for (const s of [-1, 1]) { const pot = new T3.Group(); pot.add(mesh(cyl(0.35, 0.28, 0.6, 10), toon('#e8d8c8'), 0, 0.3, 0)); pot.add(mesh(sph(0.45, 10, 8), toon('#8fd48a'), 0, 0.9, 0)); pot.position.set(s * 2.3, 0, 4.4); g.add(pot); }
  const bench = new T3.Group(); bench.add(mesh(box(1.8, 0.14, 0.6), toon('#c49a6c'), 0, 0.5, 0)); for (const s of [-0.75, 0.75]) bench.add(mesh(box(0.1, 0.5, 0.5), toon('#5a5470'), s, 0.25, 0)); bench.position.set(3.3, 0, 4.9); g.add(bench);
  g.traverse((o) => { if (o.isMesh) { o.userData.tap = { kind: 'clinic' }; tappables.push(o); } });
  placeDT(g, 'clinic');
}
function clinicKey() { return ['c', clinicOpen(), W.people.filter((p) => p.inside && p.at === 'clinic').map((p) => `${p.id}:${p.task?.kind}`).join(','), cfg.boxMode].join('|'); }
function buildClinicRoom() {
  const S = roomScene, open = clinicOpen();
  shell(S, '#eaf6f2', '#c8d6d2', { pattern: 'dots', wainscot: '#6fb8a8' });
  const white = toon('#ffffff'), mint = toon('#6fb8a8');
  const bed = new T3.Group(); bed.add(mesh(box(1.2, 0.72, 2.5), toon('#9fd3c4'), 0, 0.36, 0)); bed.add(mesh(box(1.22, 0.1, 2.52), white, 0, 0.77, 0)); bed.add(mesh(box(0.85, 0.16, 0.5), white, 0, 0.9, -0.95)); bed.add(mesh(box(0.5, 0.02, 2.3), toon('#f4efe6'), 0, 0.83, 0.05)); bed.position.set(-3.2, 0, -2.2); S.add(bed);
  const rail = mesh(box(0.05, 0.05, 2.8), toon('#c9ccd6'), -2.35, 2.9, -2.2, false); S.add(rail); const cur = mesh(box(0.04, 2.1, 1.2), toon('#bfe8d8'), -2.35, 1.85, -3.05); S.add(cur);
  const cab = new T3.Group(); cab.add(mesh(box(1.1, 1.2, 0.35), white, 0, 0, 0)); cab.add(mesh(box(0.5, 0.14, 0.02), toon('#ff6f5e'), 0, 0.1, 0.18, false)); cab.add(mesh(box(0.14, 0.5, 0.02), toon('#ff6f5e'), 0, 0.1, 0.18, false)); cab.position.set(-1.2, 2.5, -3.8); S.add(cab);
  const eye = canvasPlane(256, 384, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 384); g.fillStyle = '#2a2733'; const rows = ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P']; rows.forEach((r, i) => { g.font = `bold ${90 - i * 14}px sans-serif`; g.textAlign = 'center'; g.fillText(r, 128, 90 + i * 52); }); }, 0.9, 1.35);
  eye.position.set(0.1, 2.5, -3.97); S.add(eye);
  const rug = mesh(cyl(1.5, 1.5, 0.03, 24), toon('#d8c8f0'), 2.6, 0.02, -2.2, false); S.add(rug);
  const arm = new T3.Group(); arm.add(mesh(box(1, 0.5, 1), toon('#9a8ab8'), 0, 0.25, 0)); arm.add(mesh(box(1, 0.9, 0.25), toon('#9a8ab8'), 0, 0.7, -0.4)); for (const s of [-0.45, 0.45]) arm.add(mesh(box(0.15, 0.4, 1), toon('#9a8ab8'), s, 0.6, 0)); arm.position.set(3.6, 0, -3.1); arm.rotation.y = -0.7; S.add(arm);
  const couch = new T3.Group(); couch.add(mesh(box(1.8, 0.5, 0.9), toon('#ffb3c7'), 0, 0.25, 0)); couch.add(mesh(box(1.8, 0.8, 0.25), toon('#ffb3c7'), 0, 0.65, -0.35)); couch.add(mesh(sph(0.22, 8, 6), toon('#fff4dc'), -0.6, 0.62, -0.1)); couch.position.set(1.5, 0, -1.3); couch.rotation.y = 2.4; S.add(couch);
  const lamp = new T3.Group(); lamp.add(mesh(cyl(0.03, 0.03, 1.6, 6), toon('#5a5470'), 0, 0.8, 0)); lamp.add(mesh(cyl(0.2, 0.3, 0.3, 10), toon('#fff4c4', { emissive: new T3.Color('#6a5a20') }), 0, 1.7, 0)); lamp.position.set(4.2, 0, -0.5); S.add(lamp);
  const pl = new T3.Group(); pl.add(mesh(cyl(0.3, 0.24, 0.5, 10), toon('#e8d8c8'), 0, 0.25, 0)); pl.add(mesh(sph(0.5, 10, 8), toon('#8fd48a'), 0, 0.9, 0)); pl.position.set(4, 0, -3.5); S.add(pl);
  const poster = canvasPlane(384, 256, (g) => { g.fillStyle = '#fff8f2'; g.fillRect(0, 0, 384, 256); g.fillStyle = '#ff9fbf'; g.beginPath(); g.arc(160, 110, 40, 0, 7); g.arc(224, 110, 40, 0, 7); g.fill(); g.beginPath(); g.moveTo(122, 124); g.lineTo(192, 200); g.lineTo(262, 124); g.fill(); g.fillStyle = '#6d6488'; g.font = '24px "Mochiy Pop One", sans-serif'; g.textAlign = 'center'; g.fillText('Be gentle with your mind', 192, 240); }, 1.8, 1.2);
  poster.position.set(2.6, 2.9, -3.98); S.add(poster);
  const tank = new T3.Group(); tank.add(mesh(box(1.2, 0.8, 0.6), toon('#c49a6c'), 0, 0.4, 0)); tank.add(mesh(box(1.2, 0.7, 0.6), toon('#8fd8ff', { transparent: true, opacity: 0.55, emissive: new T3.Color('#1a4a66') }), 0, 1.15, 0, false)); tank.add(mesh(sph(0.08, 8, 6), toon('#ffb347'), 0.2, 1.2, 0)); tank.add(mesh(sph(0.07, 8, 6), toon('#ff9fbf'), -0.3, 1.05, 0.1)); tank.position.set(3.7, 0, 2.8); S.add(tank);
  const chairs = [[-3.9, 0.3], [-3.9, 1.3], [-3.9, 2.3], [-3.9, 3.3]];
  for (const [x, z] of chairs) { const c = new T3.Group(); c.add(mesh(box(0.8, 0.12, 0.7), mint, 0, 0.5, 0)); c.add(mesh(box(0.8, 0.7, 0.1), mint, 0, 0.85, 0.32)); for (const s of [-0.32, 0.32]) c.add(mesh(box(0.08, 0.5, 0.6), toon('#c9ccd6'), s, 0.25, 0)); c.position.set(x, 0, z); c.rotation.y = -Math.PI / 2; S.add(c); }
  const desk = new T3.Group(); desk.add(mesh(box(1.8, 1.0, 0.7), white, 0, 0.5, 0)); desk.add(mesh(box(1.9, 0.06, 0.8), mint, 0, 1.02, 0)); desk.add(mesh(sph(0.12, 8, 6), toon('#ffd36b'), 0.5, 1.1, 0)); desk.add(mesh(cyl(0.08, 0.06, 0.2, 8), toon('#ffffff'), -0.5, 1.15, 0)); desk.add(mesh(sph(0.12, 8, 6), toon('#ff9fbf'), -0.5, 1.3, 0)); desk.position.set(1.2, 0, 2.4); S.add(desk);
  const sg = sign('🩺 Glimmer Clinic', '#fbfdfc', '#3d8a78', 2.6); sg.position.set(-2.4, 3.9, -3.97); S.add(sg);
  const inside = W.people.filter((p) => p.inside && p.at === 'clinic');
  const patients = inside.filter((p) => p.task?.kind === 'doctor'), clients = inside.filter((p) => p.task?.kind === 'therapy');
  const doc = inside.find((p) => p.job === 'doctor' && p.task?.kind === 'work') || (open ? NPC.doc : null);
  const th = inside.find((p) => p.job === 'therapist' && p.task?.kind === 'work') || (open && clients.length ? NPC.sol : null);
  if (doc) addPerson(S, doc, -2.0, -2.3, 0.35, {});
  if (th) addPerson(S, th, 3.6, -3.05, -0.7, { y: 0.28 });
  if (patients[0]) addPerson(S, patients[0], -3.2, -1.0, 0, { lying: true, y: 0.9 });
  if (clients[0]) addPerson(S, clients[0], 1.5, -1.3, 2.4, { y: 0.28 });
  [...patients.slice(1), ...clients.slice(1)].slice(0, 4).forEach((p, i) => addPerson(S, p, chairs[i][0] + 0.05, chairs[i][1], Math.PI / 2, { y: 0.28 }));
  const extra = inside.filter((p) => p.task?.kind === 'work' && p !== doc && p !== th);
  extra.slice(0, 2).forEach((p, i) => addPerson(S, p, 0.3 + i, 1.5, Math.PI, {}));
  $('#rcTitle').textContent = 'Glimmer Clinic';
  const waiting = Math.max(0, patients.length - 1) + Math.max(0, clients.length - 1);
  $('#rcSub').textContent = !open ? 'Closed for the night. Anyone really sick gets a house call.' : `${doc ? `${doc.name} is seeing patients` : 'The clinic is open'}${patients[0] ? `; ${patients[0].name} is on the exam table` : ''}${clients[0] ? `; ${clients[0].name} is in a session` : ''}.${waiting ? ` ${waiting} waiting.` : ''} Tap someone to check on them.`;
}
function clinicTap(pid) {
  if (pid === 'npc-doc') { toast('Dr. Juniper: "I come over on the morning ferry until the island trains a doctor of its own. Rest and fluids, everyone!"'); return; }
  if (pid === 'npc-sol') { toast('Sol: "I hold sessions here until someone on the island becomes a therapist. What\'s said in this corner stays here."'); return; }
  openCare(pid);
}

// the care panel
let careOpen = null;
function careChat(p, who, text) { const H = ensureHealth(p); H.chat = H.chat || []; H.chat.push({ who, text: String(text).slice(0, 400), day: W.day }); if (H.chat.length > 12) H.chat.shift(); }
function openCare(pid) { if (String(pid).startsWith('npc-')) { clinicTap(pid); return; } careOpen = pid; renderCare(); $('#careBox').hidden = false; if (MODE === 'host') sheet.hidden = true; }
function renderCare() {
  const p = careOpen && person(careOpen); if (!p) { $('#careBox').hidden = true; return; }
  const H = ensureHealth(p), I = H.ill && ILLS[H.ill.id], J = H.injury && INJURIES[H.injury.id];
  const rows = [];
  if (I) rows.push(`${I.icon} <b>${esc(cap(I.name))}</b> · about ${plural(Math.max(1, Math.ceil(H.ill.days)), 'day')} to go${H.ill.treated ? ', seen by a doctor' : ', not seen by a doctor yet'}`);
  if (J) rows.push(`${J.icon} <b>${esc(cap(J.name))}</b>${J.needsDoc && !H.injury.set ? ' · needs a doctor to set it' : ` · about ${plural(Math.max(1, Math.ceil(H.injury.days)), 'day')} to heal`}`);
  if (H.low) rows.push(`🌧 <b>A rough patch</b> · it started with: ${esc(H.low.why)}`);
  if (H.flare) rows.push(`${CONDITIONS[H.flare.id].icon} <b>A hard ${esc(CONDITIONS[H.flare.id].name)} day</b>${H.eased ? ' · a bit easier after therapy' : ''}`);
  const mind = H.cond.some((c) => CONDITIONS[c].mind);
  const C = W.creator;
  const acts = `<div class="btns" style="margin-top:6px"><button class="btn gold" type="button" data-careask>How are you feeling?</button><button class="btn" type="button" data-caresoup ${H.soupDay === W.day || C.coins < 3 ? 'disabled' : ''}>Bring soup 🍲 3 ✦</button>${I || J ? `<button class="btn" type="button" data-caredoc ${H.docNext || H.docDay === W.day ? 'disabled' : ''}>Send to the doctor</button>` : ''}${mind || H.low ? `<button class="btn" type="button" data-caretherapy ${H.therapyNext || H.therapyDay === W.day ? 'disabled' : ''}>Suggest therapy</button>` : ''}</div>`;
  $('#careBody').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font:16px var(--display)">🩺 ${esc(p.name)}</b><span class="hint">${esc(doing(p))} <button class="btn" type="button" data-careclose style="padding:2px 10px;font-size:12px">✕</button></span></div>
    <p class="label">Right now</p>${rows.length ? rows.map((r) => `<p class="note">${r}</p>`).join('') : '<p class="hint">💚 Feeling okay today.</p>'}
    ${acts}
    <div class="chat" style="margin-top:8px">${(H.chat || []).slice(-6).map((m) => `<div class="msg ${m.who === 'you' ? 'r' : 'l'}"><span class="msg-n">${m.who === 'you' ? 'You' : esc(p.name)}</span><span class="msg-t">${esc(m.text)}</span></div>`).join('')}</div>
    <form data-careform style="margin-top:8px"><textarea id="careText" rows="2" maxlength="400" placeholder="Say something kind…" style="width:100%;font:14px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></textarea>
    <div class="btns"><button class="btn gold" type="submit">Say it</button><button class="btn" type="button" data-careclose>Close</button></div></form>
    <p class="label">Lives with</p>${H.cond.length ? H.cond.map((c) => { const K = CONDITIONS[c], m = H.managed[c] || 0; return `<p class="note"><b>${K.icon} ${esc(cap(K.long))}</b>${m ? ` <span class="chip good">${m >= 4 ? 'managing well' : 'getting support'}</span>` : ''}<br><span class="hint" style="font-size:12px">${esc(K.about)}</span></p>`; }).join('') : '<p class="hint">Nothing ongoing.</p>'}
    ${H.sessions || H.visits ? `<p class="hint">${H.visits ? `${plural(H.visits, 'doctor visit')}` : ''}${H.visits && H.sessions ? ' · ' : ''}${H.sessions ? `${plural(H.sessions, 'therapy session')}` : ''}</p>` : ''}
    <details ${careDetailsOpen ? 'open' : ''}><summary class="hint" style="cursor:pointer">Edit what ${esc(p.name)} lives with</summary><div class="chips" style="margin-top:6px">${Object.entries(CONDITIONS).map(([k, K]) => `<button class="btn" type="button" data-carecond="${k}" aria-pressed="${H.cond.includes(k)}" style="padding:3px 10px;font-size:12px">${K.icon} ${esc(K.name)}</button>`).join('')}</div></details>`;
  const ch = $('#careBody .chat'); if (ch) ch.scrollTop = 1e6;
}
let careDetailsOpen = false;
async function careAct(pid, act, text, cond) {
  const p = person(pid); if (!p) return '';
  const H = ensureHealth(p);
  if (act === 'cond') { if (!CONDITIONS[cond]) return ''; H.cond = H.cond.includes(cond) ? H.cond.filter((c) => c !== cond) : [...H.cond, cond]; markDirty(); return ''; }
  if (act === 'soup') {
    if (H.soupDay === W.day) return `${p.name} already had soup today.`;
    if (W.creator.coins < 3) return 'Soup costs 3 coins.';
    W.creator.coins -= 3; H.soupDay = W.day; p.hunger = clamp(p.hunger - 0.35, 0, 1); addJoy(p, 10); creatorShift(p, 0.25);
    const line = H.ill ? pick(["Soup… for me? *sniff* You're the best.", 'Warm. So warm. Thank you.', 'I can taste it! Mostly!']) : H.low ? pick(['…You brought me soup? That actually helps.', 'Thank you. Really.']) : pick(["Soup? I'm not even sick! …I'll eat it though.", 'Oh! Thank you!']);
    careChat(p, 'them', line); remember(p, 'The Creator brought me a bowl of soup.', 2, 'creatorGift', null, { what: 'a bowl of soup' });
    markDirty(); return `🍲 ${p.name}: "${line}"`;
  }
  if (act === 'doc' || act === 'therapy') {
    if (act === 'doc') H.docNext = true; else H.therapyNext = true;
    if (p.state === 'free' && !p.inside && ['stroll', 'visit', 'cafe', 'pray', 'surf', 'read'].includes(p.task?.kind)) { p.task = null; p.path = []; }
    const line = act === 'doc' ? pick(["Okay… I'll go get checked.", "You're right. I'll go see the doctor.", 'Fine, fine. Doctor. Going.']) : H.cond.some((c) => CONDITIONS[c].mind) ? pick(["Yeah. I think I'm due for a session.", "…Okay. That's probably a good idea.", 'Thanks for noticing.']) : pick(["Therapy? …Maybe. Okay. I'll try it.", "I didn't think anyone noticed. Okay."]);
    careChat(p, 'them', line); creatorShift(p, 0.15); remember(p, act === 'doc' ? 'The Creator told me to see a doctor.' : 'The Creator gently suggested I talk to someone at the clinic.', 1, 'advice'); markDirty();
    return `${p.name}: "${line}"`;
  }
  const said = String(text || '').trim().slice(0, 400);
  if (act === 'kind' && !said) return '';
  if (said) careChat(p, 'you', said);
  const fallback = () => {
    if (act === 'ask') { if (H.ill) return pick([`Honestly? Not great. ${cap(ILLS[H.ill.id].name)}. ${ILLS[H.ill.id].feel}`, `*sniff* I'll live. Probably.`]); if (H.injury) return `It still hurts a bit. ${cap(INJURIES[H.injury.id].name)}. I'll be okay.`; if (H.low) return "…Not my best week. I'm getting through it."; if (H.flare) return CONDITIONS[H.flare.id].mind ? "It's a harder day in my head. I'm handling it." : `My ${CONDITIONS[H.flare.id].name} is acting up. I'll be alright.`; return pick(["I'm good! Thanks for asking.", 'Pretty good, actually.', 'Fine! Why, do I look sick?']); }
    return KIND_RE.test(said) ? pick(['…Thank you. I needed that.', 'That means a lot. Really.', 'Okay. Okay, yeah. Thank you.']) : pick(['Oh. Um. Okay.', "I'm not sure what you mean, but thanks.", 'Hm.']);
  };
  let reply = null, comfort = act === 'kind' ? (KIND_RE.test(said) ? 2 : 1) : 0;
  if (aiReady() && aiBusy < 2) {
    try {
      const r = await llm(`You are ${p.name}, who lives on ${ISL.name}, a tiny island town. In your own words: ${p.selfNote}
${p.style ? `HOW YOU TALK: ${styleOf(p)}\n` : ''}BODY: ${bodyFacts(p)}${healthContext(p, null)}
You ${attitude(p)[1].replace(/^is /, 'are ').replace(/^adores/, 'adore').replace(/^likes/, 'like').replace(/^resents/, 'resent').replace(/^wants/, 'want')} (the Creator is a mysterious being who made the island).
Recent chat with the Creator, who came to check on you:
${(H.chat || []).slice(-6).map((m) => `${m.who === 'you' ? 'Creator' : p.name}: ${m.text}`).join('\n')}
${act === 'ask' ? 'The Creator asked how you are feeling. Answer honestly, in your own voice, the way you would with someone you trust about as much as you trust the Creator. Share only what feels right to share. Talk like a person, not a pamphlet.' : `The Creator just said: "${said}". Respond in your own voice. If it was kind and it lands, let it; if it's hard to hear, say so; if it was dismissive or hurtful, say that honestly.`}
Reply with only JSON: {"reply": "1-3 sentences", "comfort": 0-3 (how much this actually helped you feel better; 0 if it hurt or missed)}`, { model: modelOf(p), max: 260, fallbackKey: 'reply' });
      if (r && r.reply) { reply = String(r.reply).slice(0, 500); if (act === 'kind') comfort = clamp(Math.round(Number(r.comfort) || 0), 0, 3); }
    } catch (e) {}
  }
  if (!reply) reply = fallback();
  careChat(p, 'them', reply);
  if (act === 'ask') { creatorShift(p, 0.1); addJoy(p, 3); }
  if (act === 'kind') {
    remember(p, `The Creator said to me: "${said.slice(0, 100)}"`, 2, 'creatorTalk');
    if (comfort >= 2) {
      addJoy(p, 10); creatorShift(p, 0.3); H.stress = Math.max(0, (H.stress || 0) - 1); remember(p, 'The Creator\'s words helped.', 1, 'careKind');
      if (H.low) { H.low.days -= 1; if (H.low.days <= 0) { H.low = null; diary(`🌤 The <span class="cr">Creator</span>'s words helped <b>${esc(p.name)}</b> out of a rough patch.`); } }
      if (H.flare && CONDITIONS[H.flare.id].mind) H.eased = true;
    } else if (comfort === 0) creatorShift(p, -0.2);
  }
  markDirty();
  return '';
}

// setting everyone up the first time
function healthMigration() {
  W.added = W.added || {};
  for (const p of W.people) ensureHealth(p);
  if (W.added.health1) return;
  W.added.health1 = true;
  const red = W.people.find((q) => q.lovesMili); if (red) { red.health.cond = conditionsFromText((red.body.ailments || []).join('. ')); }
  const m = typeof findMili === 'function' && findMili(); if (m) m.health.cond = ['ocd', 'schizotypal'];
  if (ISLE === 'isle1' || ISLE === 'isle2') {
    const taken = new Set(), count = (job) => W.people.filter((q) => q.job === job).length;
    const cand = () => W.people.filter((p) => p.grow >= 1 && !p.visitor && p !== m && !p.lovesMili && !p.style && !p.custom && collarOf(p) !== 'white' && !taken.has(p.id) && (!SHOPS[p.job] || count(p.job) >= 2)).sort((a, b) => count(b.job) - count(a.job) || rand() - 0.5)[0];
    const hire = (job, books, line) => { const p = cand(); if (!p) return false; taken.add(p.id); p.job = job; p.jobDays = 0; p.jobMood = 0; p.read = [...(p.read || []), ...books.filter((id) => BOOKS[id] && !(p.read || []).some((r) => r.id === id)).map((id) => ({ id, day: W.day, learned: BOOKS[id].facts.slice(0, 2), rating: 4, take: line }))]; dressMesh(p); remember(p, `I started a new job as a ${JOBS[job].short}.`, 3, 'hired'); diary(`💼 <b>${esc(p.name)}</b> started work as a <b>${JOBS[job].short}</b>.`); return true; };
    hire(pick(['bio', 'chem', 'phys']), ['tinyworlds', 'everyday', 'forces', 'tidepool', 'numbers'], 'This is the stuff that got me into science.');
    hire(pick(['robo', 'civil']), ['bridges', 'robots', 'numbers'], 'I read this three times.');
    hire('doctor', ['body', 'firstaid', 'tinyworlds'], 'This is why I wanted to be a doctor.');
    if (W.people.length >= 11) hire('therapist', ['feel', 'friends', 'minds'], 'Everyone deserves someone who listens.');
    const readers = W.people.filter((p) => p.grow >= 1 && collarOf(p) !== 'white' && !taken.has(p.id) && p !== m && !p.lovesMili).sort(() => rand() - 0.5);
    const paths = [['firstaid', 'body'], ['feel', 'minds'], ['tinyworlds', 'everyday'], ['bridges', 'robots']];
    readers.slice(0, 3).forEach((p, i) => { p.toRead = [...paths[i % paths.length], ...(p.toRead || [])].slice(0, 4); });
  }
  const [cx, cz] = polarDT(DT_BLD.clinic.a, DT_BLD.clinic.r);
  const moved = (W.placed || []).filter((pl) => Math.hypot(pl.x - cx, pl.z - cz) < 7.5);
  if (moved.length) { for (const pl of moved) W.creator.coins = Math.min(9999, W.creator.coins + (BUILDS[pl.type]?.price || 5)); W.placed = W.placed.filter((pl) => !moved.includes(pl)); buildPlaced(); }
  if (typeof logUpdate === 'function') logUpdate('build', 'Built Glimmer Clinic downtown and opened two new floors at Glimmer Labs (Science and Engineering). Residents can catch colds and get hurt now, and some live with ongoing conditions, including mental health ones.', 'Clinic + new lab floors');
  diary(`🩺 <b>Glimmer Clinic</b> opened downtown, with a doctor's office and a quiet corner for therapy. Glimmer Labs opened two new floors: 🧪 Science and ⚙️ Engineering.${moved.length ? ' A few things you built were in the way, so they were refunded.' : ''}`);
}

