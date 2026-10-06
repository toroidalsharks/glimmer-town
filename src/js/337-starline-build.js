// ============================================================
// STARLINE PROJECT: paying for the city, the crew who build it, what the town thinks, the ribbon cutting
// ============================================================
// W.city.stage goes 'plans' -> 'build' -> 'ready' -> 'open'.
// plans: the plans are up at the fountain once the town is big enough. The
//   Creator pays SL_COST in coins and supplies, a bit at a time, from the Build tab.
// build: a hearing at the fountain (the Creator makes the town one promise), then
//   the ground breaks and a crew of residents builds it, a little each shift.
// ready: finished; the ribbon cutting opens it (cityUnlock).
// Opinions follow the U-shaped curve seen around real big projects: curiosity
// when the plans go up, the most grumbling while the site is loud, and most
// people come round once they can use the place. Petitions, rallies and
// arguments are only ever about the project, and only generated residents
// lead them; real people keep their opinions to themselves and their diary.
const SL_COST = { coins: 3000, wood: 40, stone: 30, parts: 15, flowers: 12 };
const SL_HELP = { wood: 3, stone: 3 };
const SL_CREW_MAX = 4, SL_CHUNK = 0.0045;
// when each piece goes up, as a share of the whole build
const SL_WIN = {
  land: [0, 0.06, 'sea'], bridge: [0, 0.04, 'sea'], pave: [0.06, 0.16, 'grow'],
  tower: [0.14, 0.5], cinema: [0.24, 0.52], station: [0.3, 0.6], radio: [0.36, 0.64], studio: [0.42, 0.7], sky: [0.46, 0.82],
  monorail: [0.6, 0.85], spire: [0.7, 0.8], lights: [0.78, 0.9], props: [0.8, 0.95], trucks: [0.84, 0.94],
};
// where the crew stands while each piece goes up (a TOWN place)
const SL_WORKAT = { tower: 'tower', cinema: 'cinema', station: 'station', radio: 'radio', studio: 'studio', trucks: 'trucks' };
// scaffolding boxes in Starline's local coordinates: [x, z, w, d, h]
const SL_SCAF = { tower: [[-13, -13, 9, 8, 22]], cinema: [[12, -13.5, 12, 8, 9]], station: [[20.5, 0, 6, 12, 9.5]], radio: [[10, 14, 7, 7, 6.5]], studio: [[0, -21.5, 10, 6, 6.5]] };
const SL_MILESTONES = [
  [0.25, () => '🧱 The foundations for <b>Starline</b> are in, and Starline Tower is starting to go up.'],
  [0.5, () => '🌲 Starline Tower topped out. The crew tied a little tree to the roof for luck, the way builders do.'],
  [0.75, () => '🚝 The monorail track across to <b>Starline</b> is up. The cinema and the station are getting their signs.'],
];
// why people are for it or against it. say: things they blurt out; hear: what they say at the
// hearing; why: finishes "because..."; promise: the promise that would win them over
const SL_PRO = {
  cinema: { say: ['A cinema! A real one!', 'I want to see a movie on a big screen.'], hear: "There's going to be a cinema. With popcorn. I don't see what there is to argue about.", why: 'it will have a cinema' },
  build: { say: ['Finally, some real building work.', "I've wanted to build a tower my whole life."], hear: 'I build things for a living. Let me build something that lasts.', why: 'there will be real building work' },
  city: { say: ['Lights, people, noise. I love it.', "It'll feel like a real city."], hear: "Some of us want a bit of bustle. A place that's still awake after dark.", why: 'the town could use some bustle' },
  train: { say: ['A monorail! Over the water!', "I'm going to ride that train every day."], hear: "A monorail over the sea. Tell me that isn't the best thing you've ever heard.", why: 'there will be a monorail' },
  jobs: { say: ['Five new jobs. That is five paychecks.', 'I could use a better job, honestly.'], hear: 'Five new jobs. Some of us need those more than we need a quiet view.', why: 'it brings new jobs' },
  rooms: { say: ['More rooms means more neighbors.', 'Where else would new people live?'], hear: 'The apartments are full. Starline Tower has four more rooms. Where else would anyone live?', why: 'the town needs more rooms' },
  fun: { say: ['Food trucks and a dance studio? Yes please.', 'Something new to do at night!'], hear: 'Food trucks, dancing, a radio show. This island could use a little more going on.', why: 'there will be more to do' },
};
const SL_CON = {
  shop: { say: ['Food trucks across the bridge. Great. Who needs my shop?', 'We barely get by as it is.'], hear: 'Food trucks right across the bridge. The shops on this island barely get by as it is.', why: 'it could take customers from the shops here', promise: 'jobs' },
  nature: { say: ['I like the sea east of downtown the way it is.', 'Where are the herons supposed to fish?'], hear: "That shore is where the herons fish. Once it's paved, it's paved.", why: 'it paves over a quiet shore', promise: 'park' },
  sunset: { say: ["That tower is going to block the sky.", 'I watch the sunset every night. Every night!'], hear: 'A tower that tall throws a long shadow. Some of us like seeing the sky.', why: 'the tower might block the sky', promise: 'park' },
  noise: { say: ['Weeks of hammering. I can hear it already.', 'I just want to sleep.'], hear: 'Hammers at dawn, trucks all day, and then traffic forever. Who asked for that?', why: 'the noise will be awful', promise: 'quiet' },
  change: { say: ['This town is fine the way it is.', 'Everything moves too fast lately.'], hear: "I love this town because it's small. Nobody asked us if we wanted it big.", why: 'it changes the town too fast', promise: 'park' },
  traffic: { say: ['Cars? On our island?', 'Somebody is going to get run over.'], hear: 'Cars. On this island. Where kids play in the street.', why: 'the traffic worries me', promise: 'quiet' },
  rent: { say: ['Fancy tower, fancy prices. Watch.', 'New buildings always make everything cost more.'], hear: "New towers always make everything cost more. Ask anyone who's lived through it.", why: 'prices might go up', promise: 'jobs' },
};
const SL_PROMISES = {
  park: { label: 'Keep green space', creator: 'Starline keeps its trees. There will be a park by the water, for everyone.', diary: 'a green park by the water' },
  jobs: { label: 'Local jobs first', creator: 'Every job in Starline goes to someone who already lives here. The crew gets first pick.', diary: 'local jobs first' },
  quiet: { label: 'Quiet nights', creator: 'No building after dark, and the cars stay in Starline.', diary: 'no building after dark' },
};
// rumors always get checked and ruled out a day or two later
const SL_RUMORS = [
  ['the tower will block the sunset from the pier', "the tower's shadow stops at the bridge, nowhere near the pier."],
  ['Starline will get its own mayor and its own rules', 'Starline is part of the town. Same meeting, same Creator, same rules.'],
  ['the monorail will be loud enough to scare the fish', 'the monorail runs on rubber wheels and hums quieter than the ferry.'],
  ['rents in the apartments will double', 'the rooms stay free, same as always, and Starline Tower rooms are free too.'],
];
const SL_FINDS = ['message in a bottle from the first settlers', "rusty old ship's bell", 'jar of sea glass marbles', 'stone tile with stars carved into it'];
const SL_CREW_LINES = ['Hand me that wrench!', 'Measure twice, cut once.', 'A bit higher… perfect!', 'Is it lunch yet?', 'Watch your head!', 'Look how tall it is already!', 'Careful with that beam!'];
let slParts = [], slShown = 0, slSite = null, slBoard = null, slRevealAt = 0, slHearQ = false, slRibbonQ = false, slNextDust = 0;

// ---------- state ----------
function cityStage() { const C = W && W.city; return !C ? 'none' : C.stage || (C.open ? 'open' : 'none'); }
// the land is out of the sea from the moment the ground breaks
function cityLand() { const st = cityStage(); return st === 'open' || st === 'ready' || (st === 'build' && !!W.city.broke); }
const slCostName = (k) => (k === 'coins' ? '✦ coins' : MATS[k]);
const slCostText = () => Object.entries(SL_COST).map(([k, v]) => `${v} ${slCostName(k).split(' ').slice(1).join(' ')}`).join(', ');
const slHelpText = () => Object.entries(SL_HELP).map(([k, v]) => `${v} ${MATS[k].split(' ').slice(1).join(' ')}`).join(' and ');
function slNeed(k) { return Math.max(0, SL_COST[k] - ((W.city.fund || {})[k] || 0)); }
function slFunded() { return Object.keys(SL_COST).every((k) => slNeed(k) <= 0); }
function slFundShare() { let a = 0, b = 0; for (const k of Object.keys(SL_COST)) { const w = k === 'coins' ? 0.02 : 1; a += Math.min(SL_COST[k], W.city.fund[k] || 0) * w; b += SL_COST[k] * w; } return a / b; }
// generated residents only: real people are never the face of a fight
const slNpc = (p) => slFree(p) && !isRealish(p) && !p.style && !p.lovesMili && !p.custom;
const slReason = (k) => SL_PRO[k] || SL_CON[k] || SL_PRO.fun;
function slSeed(p) {
  if (p.slView !== undefined && (SL_PRO[p.slWhy] || SL_CON[p.slWhy])) return;
  let v = (rand() - 0.5) * 0.9 + (p.body?.openness || 0) * 0.35, lean = null;
  if (p.grow < 1) { v += 0.7; lean = 'cinema'; }
  else if (['cafe', 'bakery', 'mart', 'icecream'].includes(p.job)) { v -= 0.5; lean = 'shop'; }
  else if (['garden', 'pier'].includes(p.job)) { v -= 0.45; lean = pick(['nature', 'sunset']); }
  else if (['builder', 'civil'].includes(p.job)) { v += 0.6; lean = 'build'; }
  else if (p.job === 'janitor' || purse(p) < 6) { v += 0.3; lean = 'jobs'; }
  else if (p.job && collarOf(p) === 'white') { v += 0.15; lean = pick(['city', 'train']); }
  p.slView = clamp(v, -1, 1);
  const list = p.slView >= 0 ? SL_PRO : SL_CON;
  p.slWhy = lean && list[lean] ? lean : pick(Object.keys(list));
}
function slShift(p, d) {
  slSeed(p); p.slView = clamp(p.slView + d, -1, 1);
  if (!!SL_PRO[p.slWhy] !== p.slView >= 0) p.slWhy = pick(Object.keys(p.slView >= 0 ? SL_PRO : SL_CON));
}
function slViews() {
  const V = { pro: [], con: [], mid: [] };
  for (const p of W.people) { if (p.visitor || p.grow < 0.6) continue; slSeed(p); (p.slView > 0.2 ? V.pro : p.slView < -0.2 ? V.con : V.mid).push(p); }
  return V;
}
// the promise that would win over the most people who are against it
function slBestPromise() {
  const n = { park: 0, jobs: 0, quiet: 0 };
  for (const p of slViews().con) { const k = SL_CON[p.slWhy]?.promise; if (k) n[k]++; }
  return Object.keys(n).sort((a, b) => n[b] - n[a])[0];
}
const slShiftEnd = () => (W.city?.promise === 'quiet' ? 0.46 : 0.52);
const slCrew = () => (W.city?.crew || []).map(person).filter(slFree);
function slStageName() {
  const g = W.city.progress;
  return g < 0.14 ? 'Breaking ground' : g < 0.3 ? 'Pouring the foundations' : g < 0.5 ? 'Raising Starline Tower' : g < 0.75 ? 'Building the cinema, the station and the studios' : g < 0.95 ? 'Signs, lights and trees' : 'Finishing touches';
}

// ---------- the plans go up ----------
function cityOffer() {
  if (cityStage() !== 'none') return;
  W.city = { stage: 'plans', offered: W.day, fund: {}, progress: 0, crew: [], petition: [] };
  diary(`📐 Plans for <b>Starline</b>, a busy city quarter across a new bridge east of downtown, went up at the fountain. It needs ${slCostText()} before anyone can start building. The town has opinions.`);
  for (const p of W.people) {
    if (p.visitor || p.grow < 0.6) continue;
    slSeed(p); const R = slReason(p.slWhy);
    remember(p, `Plans for a city quarter called Starline went up at the fountain. ${p.slView > 0.2 ? `I'm for it, because ${R.why}.` : p.slView < -0.2 ? `I'm against it, because ${R.why}.` : "I can't decide how I feel about it."}`, 2, 'starline');
    if (!p.inside && rand() < 0.5) bubble(p, pick(R.say), 3);
  }
  if (MODE === 'host') { toast('📐 Plans for Starline went up. Pay for it from the Build tab.'); slBuildBillboard(); }
  markDirty();
}
// towns that opened Starline before it had to be paid for
function cityMigrate() {
  W.added = W.added || {};
  if (W.added.starlineBuild) return;
  W.added.starlineBuild = true;
  const C = W.city; if (!C || !C.open || C.stage) return;
  if (W.people.some((p) => p.room >= MAX_POP || JOBS[p.job]?.city)) {
    C.stage = 'open';
    logUpdate('build', 'Starline is now something you pay for and build, in coins and supplies. Your Starline already has people living or working in it, so it stays open.', 'Starline');
    return;
  }
  W.city = { stage: 'plans', offered: W.day, fund: {}, progress: 0, crew: [], petition: [] };
  diary('📐 <b>Starline</b> closed up again: nobody had signed off on it. The plans are back up at the fountain, and this time the town gets a say.');
  logUpdate('build', `Starline is a building project now. Pay for it from the Build tab (${slCostText()}). Then a crew of residents builds it over a few days while the town argues about it, and it opens with a ribbon cutting. Nobody lived or worked there yet, so it went back to plans.`, 'Starline');
}

// ---------- paying for it, and lending a hand ----------
function cityCmd(c) {
  const st = cityStage(), CR = W.creator;
  if (c.a === 'give') {
    const k = c.what; if (st !== 'plans' || !(k in SL_COST)) return '';
    const have = k === 'coins' ? CR.coins : mats()[k] || 0;
    const want = c.n === 'all' ? slNeed(k) : Math.min(slNeed(k), Math.max(0, Math.floor(Number(c.n) || 0)));
    const n = Math.min(have, want);
    if (n <= 0) return slNeed(k) <= 0 ? `Starline has all the ${slCostName(k)} it needs.` : `You don't have any ${slCostName(k)} to give.`;
    if (k === 'coins') CR.coins -= n; else mats()[k] -= n;
    W.city.fund[k] = (W.city.fund[k] || 0) + n;
    Sound.coin?.(); markDirty();
    if (slFunded()) { slFundedNow(); return 'Starline is paid for! The town is gathering at the fountain.'; }
    return `Put ${n} ${slCostName(k)} toward Starline. It's ${Math.round(slFundShare() * 100)}% paid for.`;
  }
  if (c.a === 'help') {
    if (st !== 'build' || !W.city.broke) return '';
    if (W.city.helped === W.day) return "The crew says thanks, but that's enough help for today.";
    const M = mats(); if (Object.entries(SL_HELP).some(([k, v]) => (M[k] || 0) < v)) return `Lending a hand takes ${slHelpText()}.`;
    for (const [k, v] of Object.entries(SL_HELP)) M[k] -= v;
    W.city.helped = W.day; slAdvance(0.05);
    diary('🔨 <span class="cr">Creator</span> brought the Starline crew extra wood and stone and lent a hand.');
    for (const p of slCrew()) { creatorShift(p, 0.2); remember(p, 'The Creator came by the Starline site and helped the crew.', 1, 'starline'); if (!p.inside) emote(p, '✨', 3); }
    Sound.sparkle(); markDirty();
    return 'The crew cheered. Starline is a little closer.';
  }
  return '';
}
function slFundedNow() {
  const C = W.city; C.stage = 'build'; C.funded = W.day; C.broke = false; C.progress = 0; C.crew = slPickCrew();
  diary('💰 <b>Starline</b> is paid for. The town will have its say at the fountain before the first shovel goes in.');
  slHearing();
}
// the crew: builders first, then people whose shop has someone else to mind it. Real people keep their jobs.
function slPickCrew() {
  const count = (j) => W.people.filter((q) => q.job === j).length;
  const ok = (p) => slNpc(p) && p.job && !JOBS[p.job].city && (p.job === 'builder' || p.job === 'civil' || (collarOf(p) !== 'white' && count(p.job) >= 2));
  const score = (p) => (p.job === 'builder' ? 4 : p.job === 'civil' ? 3 : 0) + (p.slView || 0) * 2 + rand();
  return W.people.filter(ok).sort((a, b) => score(b) - score(a)).slice(0, SL_CREW_MAX).map((p) => p.id);
}

// ---------- the hearing, and the ground breaking ----------
const slShot = (S, L, sp) => (L.city ? cutCam(SL.x - 4, 2, SL.z + 2, SL.x - 46, 30, SL.z + 44) : cutShotDefault(S, L, sp));
function slHearing() {
  if (slHearQ) return; slHearQ = true;
  const C = W.city, V = slViews();
  const fan = V.pro.filter(slNpc).sort((a, b) => b.slView - a.slView)[0];
  const lead = person(C.lead) && slNpc(person(C.lead)) ? person(C.lead) : V.con.filter(slNpc).sort((a, b) => a.slView - b.slView)[0];
  const torn = V.mid.filter(slNpc)[0];
  const cast = castFrom([fan?.id, lead?.id, torn?.id, ...onlookers([fan?.id, lead?.id, torn?.id], 7)].filter(Boolean), 9);
  const L = [nline('Starline was paid for. Before the first shovel went in, the town met at the fountain to have its say.')];
  if (fan) L.push(pline(fan.id, slReason(fan.slWhy).hear, null, { emote: '✨' }));
  if (lead) { L.push(pline(lead.id, slReason(lead.slWhy).hear, 'holdit', { emote: '💢' })); if ((C.petition || []).length >= 2) L.push(pline(lead.id, `And ${C.petition.length} of us signed a petition that says slow down.`)); }
  if (torn) L.push(pline(torn.id, pick(["Can't it be both? Busy over there, quiet over here?", 'I just want to know what changes for me.', 'Honestly, I came for the free cookies.'])));
  L.push({ who: 'crowd', text: pick(['*murmuring*', 'Hear, hear!', '*everyone talking at once*']), fx: 'gasp' });
  L.push({ who: 'narrator', text: 'Everyone turned to the Creator. What would they promise the town?', choice: { prompt: 'Make the town one promise.', auto: 'the town picks', options: Object.entries(SL_PROMISES).map(([k, v]) => [k, v.label]), fallback: slBestPromise(), timeout: 30, pick: (k) => slPromise(k, lead) } });
  queueCut({ kind: 'starline', icon: '📐', title: 'The Starline Hearing', sub: `${V.pro.length} for, ${V.con.length} against, ${V.mid.length} unsure`, lines: L, shot: slShot,
    stage: (S) => townStage(S, [0, 6.5], cast, { r: 2.6 }),
    onEnd: () => { slHearQ = false; if (!W.city.promise) slPromise(slBestPromise(), null); slBreakGround(); } });
}
function slPromise(k, lead) {
  const C = W.city; if (C.promise) return [];
  C.promise = SL_PROMISES[k] ? k : 'jobs'; const P = SL_PROMISES[C.promise];
  for (const p of W.people) if (p.slView !== undefined && SL_CON[p.slWhy]?.promise === C.promise) slShift(p, 0.35);
  diary(`🤝 At the Starline hearing, the <span class="cr">Creator</span> promised ${P.diary}.`);
  const out = [{ who: 'creator', text: P.creator }];
  if (lead) { const won = SL_CON[lead.slWhy]?.promise === C.promise; out.push(pline(lead.id, won ? pick(['…Okay. That helps. A lot, actually.', "Fine. I'll hold you to that."]) : pick(["That's nice, but it's not what I asked for.", "Hmm. We'll see."]), null, { emote: won ? '💡' : '💢' })); }
  out.push({ who: 'narrator', text: 'The first shovel went in. The ground rumbled, and new land rose out of the sea east of downtown.', fx: 'shock', city: true, hold: 4.5, run: () => slBreakGround() });
  out.push({ who: 'crowd', text: pick(['Whoa!', 'Did you feel that?!', 'Here we go!']), city: true, hold: 2.5 });
  return out;
}
function slBreakGround() {
  const C = W.city; if (!C || C.stage !== 'build' || C.broke) return;
  C.broke = true; C.started = W.day; C.progress = Math.max(C.progress || 0, 0.06); C.promise = C.promise || slBestPromise();
  C.crew = (C.crew || []).filter((id) => slNpc(person(id)));
  if (!C.crew.length) C.crew = slPickCrew();
  const crew = slCrew();
  for (const p of crew) remember(p, "I signed up for the Starline building crew. I'll be on the site every day until it's done.", 3, 'starline');
  for (const p of W.people) if (!p.visitor && !p.inside && rand() < 0.5) bubble(p, pick(['Did you feel that?', 'The ground is shaking!', 'Here we go…', 'Look, new land!']), 3);
  diary(`⛏ Ground broke on <b>Starline</b>, and new land rose out of the sea east of downtown. ${crew.length ? `${andList(crew.map((p) => `<b>${esc(p.name)}</b>`))} signed up for the building crew.` : 'Nobody here could be spared, so a crew came over from the mainland.'}`);
  if (MODE === 'host' && typeof scene !== 'undefined' && scene) { slDropBoard(); buildCity(); slShown = 0; }
  markDirty();
}

// ---------- building it ----------
function slAdvance(d) {
  const C = W.city; if (!C || C.stage !== 'build' || !C.broke || d <= 0) return;
  const before = C.progress; C.progress = Math.min(1, before + d);
  for (const [at, text] of SL_MILESTONES) if (before < at && C.progress >= at) diary(text());
  if (C.progress >= 1) slFinished();
  markDirty();
}
function slFinished() {
  const C = W.city; C.stage = 'ready'; C.done = W.day;
  diary(`🏗 <b>Starline</b> is finished, ${plural(Math.max(1, W.day - (C.started ?? W.day) + 1), 'day')} after the ground broke. The scaffolding is coming down, and the ribbon cutting is next.`);
  for (const p of slCrew()) { remember(p, 'We finished building Starline. I helped build a whole city.', 3, 'starline'); addJoy(p, 15); }
  slQueueRibbon();
}
// which piece is going up right now, for the crew to stand next to
function slBuilding() {
  const g = W.city.progress, now2 = Object.entries(SL_WIN).filter(([k, [a, b]]) => SL_WORKAT[k] && g >= a - 0.02 && g < b);
  return now2.length ? pick(now2)[0] : null;
}
function cityCrewPlan(p) {
  const C = W.city; if (!C || C.stage !== 'build' || !C.broke || p.visitor || p.grow < 1) return false;
  // rally mornings: people who signed the petition wave signs at the bridge
  if (C.rally === W.day && W.t > 0.04 && W.t < 0.36 && p.rallied !== W.day && (C.petition || []).includes(p.id) && slNpc(p)) {
    p.rallied = W.day;
    const [x0, z0] = SL_WALK[0], [x1, z1] = SL_WALK[1], k = 0.62 + rand() * 0.3, len = Math.hypot(x1 - x0, z1 - z0), s = (rand() - 0.5) * 1.6;
    setTask(p, 'rally', 'bridgehead', [x0 + (x1 - x0) * k + (-(z1 - z0) / len) * s, z0 + (z1 - z0) * k + ((x1 - x0) / len) * s]); return true;
  }
  if (!C.crew.includes(p.id) || p.workedToday || W.t >= slShiftEnd() || W.t < 0.02 || !slFree(p) || C.pause === W.day || W.weather === 'storm') return false;
  const k = slBuilding(), place = k ? SL_WORKAT[k] : 'city';
  setTask(p, 'build', place, jitter(place === 'city' ? slw(-3 + rand() * 6, -2 + rand() * 6) : TOWN[place].spot, 3.2)); return true;
}
function slCrewStart(p, k) {
  if (k === 'rally') {
    p.busyUntil = now + 8 * ts(); p.face = Math.atan2(SL.x - p.x, SL.z - p.z); emote(p, '✊', 8);
    bubble(p, pick(['Slow down, Starline!', 'Ask us first!', 'Small town, big heart!', 'Save our sky!', 'What do we want? A say!']), 3); return;
  }
  p.busyUntil = now + 4 * ts(); p.face = Math.atan2(SL.x - p.x, SL.z - p.z) + (rand() - 0.5) * 2;
  emote(p, pick(['🔨', '🔧', '🧱', '📐']), 4);
  if (rand() < 0.22) bubble(p, W.city.rally === W.day && rand() < 0.5 ? pick(["They're allowed to disagree. We keep building.", 'I can hear the chanting from here.']) : pick(SL_CREW_LINES), 2.6);
}
function slCrewFinish(p, k) {
  if (k === 'rally') { remember(p, 'Held a sign at the rally against Starline, by the bridge.', 2, 'starline'); bubble(p, pick(['At least they heard us.', 'Same time next week?', 'My arms are tired from the sign.']), 2.4); return; }
  const C = W.city; if (!C || C.stage !== 'build') return;
  const wx = W.weather === 'rain' || W.weather === 'snow' ? 0.5 : W.weather === 'storm' ? 0 : 1;
  if (C.pause !== W.day) slAdvance(SL_CHUNK * wx);
  if (W.t >= slShiftEnd() || C.stage !== 'build') {
    p.workedToday = true; earn(p, 4); addJoy(p, 4);
    remember(p, pick(['Worked a shift on the Starline site. My arms are sore, but it is going up.', 'Another day on the Starline crew. You can see it from the pier now.', 'Built a bit more of Starline today.']), 1, 'starline');
    bubble(p, pick(['Good shift, everyone.', 'My arms are jelly.', 'See you tomorrow, Starline.', '+4 coins!']), 2.4);
  }
}
// days the box was off: the crew kept working
function cityOfflineDay() {
  const C = W.city; if (!C || C.stage !== 'build') return;
  if (!C.broke) { slPromise(C.promise || slBestPromise(), null); slBreakGround(); return; }
  const wx = W.weather === 'storm' ? 0 : W.weather === 'rain' || W.weather === 'snow' ? 0.5 : 1, n = slCrew().length;
  if (C.pause !== W.day) slAdvance((n ? n * 0.045 : 0.08) * wx);
}

// ---------- every morning while the plans are up or it's being built ----------
function cityProjectDaily() {
  const C = W.city, st = C.stage;
  C.fund = C.fund || {}; C.petition = C.petition || []; C.crew = C.crew || [];
  if (st === 'ready') { slQueueRibbon(); return; }
  if (st === 'build' && !C.broke) { slHearing(); return; }
  if (st === 'build') {
    // nobody free to build: the mainland crew keeps it moving, slowly
    if (!slCrew().length && C.pause !== W.day && W.weather !== 'storm') slAdvance(0.08);
    // the U-curve: people who were against it soften as it takes shape
    for (const p of W.people) if (p.slView !== undefined && p.slView < 0) slShift(p, 0.03 + C.progress * 0.03);
  }
  if (rand() < 0.8) slDrama(st);
}
function slDrama(st) {
  const C = W.city, V = slViews(), pro = V.pro.filter(slNpc), con = V.con.filter(slNpc), opts = [];
  if (pro.length && con.length) opts.push('argue', 'argue');
  if (st === 'plans') {
    if (!C.lead && con.length >= 2) opts.push('petition', 'petition');
    if (C.lead && con.some((p) => !C.petition.includes(p.id))) opts.push('sign');
    if (pro.some((p) => purse(p) >= 8) && slNeed('coins') > 0) opts.push('chip');
  } else if (C.broke) {
    if (con.length) opts.push('noise');
    if (C.petition.length >= 3 && W.day - (C.rally ?? -9) >= 3 && C.progress < 0.9) opts.push('rally', 'rally');
    if (pro.length && slCrew().length) opts.push('snacks');
    if (!C.found && C.progress > 0.12 && C.progress < 0.5) opts.push('find');
    if (['rain', 'storm', 'snow'].includes(W.weather)) opts.push('rain', 'rain', 'rain');
  }
  if (C.rumor === undefined && (con.length || V.mid.length)) opts.push('rumor');
  else if (C.rumor !== undefined && !C.debunked && W.day > C.rumorDay) opts.push('debunk', 'debunk', 'debunk');
  if (V.mid.length) opts.push('torn');
  const k = pick(opts); if (!k) return;
  const b = (p) => `<b>${esc(p.name)}</b>`;
  switch (k) {
    case 'argue': {
      const a = pick(pro), c = pick(con), sa = voiceLine(a, pick(slReason(a.slWhy).say), 'say'), sc = voiceLine(c, pick(slReason(c.slWhy).say), 'say'), calm = rand() < 0.3;
      diary(`💬 ${b(a)} and ${b(c)} argued about Starline. ${esc(a.name)}: "${esc(sa)}" ${esc(c.name)}: "${esc(sc)}"${calm ? ' They agreed to disagree over ice cream.' : ''}`);
      feel(a, c, calm ? 0.1 : -0.25, true); feel(c, a, calm ? 0.1 : -0.25, true);
      remember(a, `Argued with ${c.name} about Starline. ${calm ? 'We agreed to disagree.' : "They just don't get it."}`, 2, 'starline', c.name);
      remember(c, `Argued with ${a.name} about Starline. ${calm ? 'We agreed to disagree.' : 'They only see the shiny parts.'}`, 2, 'starline', a.name);
      if (!a.inside) bubbleRaw(a, sa, 3); if (!c.inside) bubbleRaw(c, sc, 3);
      break;
    }
    case 'petition': {
      const L = con.sort((x, y) => x.slView - y.slView)[0]; C.lead = L.id; C.petition = [L.id];
      diary(`📝 ${b(L)} started a petition called "Slow Down, Starline". "${esc(pick(slReason(L.slWhy).say))}"`);
      remember(L, 'I started a petition against Starline. Somebody has to ask the questions.', 3, 'starline'); emote(L, '📝', 3);
      break;
    }
    case 'sign': {
      const L = person(C.lead), signed = con.filter((p) => !C.petition.includes(p.id) && rand() < 0.6);
      if (!L || !signed.length) break;
      for (const p of signed) { C.petition.push(p.id); feel(p, L, 0.2, true); remember(p, `Signed ${L.name}'s petition against Starline.`, 1, 'starline', L.name); }
      diary(`📝 ${andList(signed.map(b))} signed ${b(L)}'s petition. That makes ${plural(C.petition.length, 'signature')}.`);
      break;
    }
    case 'chip': {
      const p = pick(pro.filter((q) => purse(q) >= 8)), n = Math.min(slNeed('coins'), 2 + Math.floor(rand() * 3));
      spend(p, n); C.fund.coins = (C.fund.coins || 0) + n;
      diary(`🪙 ${b(p)} dropped ${plural(n, 'coin')} in the Starline jar at the fountain. "${esc(pick(slReason(p.slWhy).say))}"`);
      remember(p, `Put ${plural(n, 'coin')} toward Starline.`, 1, 'starline');
      if (slFunded()) slFundedNow();
      break;
    }
    case 'rumor': {
      C.rumor = Math.floor(rand() * SL_RUMORS.length); C.rumorDay = W.day;
      diary(`🗣 A rumor went around town: ${esc(SL_RUMORS[C.rumor][0])}. Nobody knows who started it.`);
      for (const p of [...V.con, ...V.mid]) { slShift(p, -0.08); if (rand() < 0.4) remember(p, `Heard that ${SL_RUMORS[C.rumor][0]}.`, 1, 'rumor'); }
      break;
    }
    case 'debunk': {
      C.debunked = true;
      const who = W.people.find((p) => p.job === 'civil' && slNpc(p)) || pick(W.people.filter((p) => slNpc(p) && p.grow >= 1));
      diary(`🔎 ${who ? `${b(who)} checked the plans` : 'Someone checked the plans'}: ${esc(SL_RUMORS[C.rumor][1])} The rumor was wrong.`);
      for (const p of [...V.con, ...V.mid]) slShift(p, 0.1);
      break;
    }
    case 'noise': {
      const c = pick(con);
      if (C.promise === 'quiet') { diary(`🌙 The Starline crew kept the promise and stopped at sunset. Even ${b(c)} admitted the nights are quiet.`); slShift(c, 0.15); remember(c, 'The Starline crew stops at sunset, like they promised. Fair enough.', 1, 'starline'); }
      else { diary(`💢 ${b(c)} says the pile driver on the Starline site woke them up at dawn.`); slShift(c, -0.05); remember(c, 'The Starline site woke me up at dawn again.', 2, 'starline'); if (!c.inside) bubble(c, pick(['I just want to sleep!', 'BANG. BANG. BANG. Every morning.']), 3); }
      break;
    }
    case 'rally': {
      C.rally = W.day; const L = person(C.lead);
      diary(`✊ ${L ? `${b(L)} and the petition signers are` : 'The petition signers are'} holding a rally at the Starline bridge this morning. The crew is building anyway.`);
      break;
    }
    case 'snacks': {
      const a = pick(pro.filter((p) => !C.crew.includes(p.id))) || pick(pro), treat = pick(['a box of pastries', 'a thermos of cocoa', 'a bag of warm buns', 'popsicles for everyone']);
      diary(`🍩 ${b(a)} brought the Starline crew ${treat}.`);
      for (const q of slCrew()) if (q !== a) { feel(q, a, 0.3, true); remember(q, `${a.name} brought the crew ${treat}.`, 1, 'starline', a.name); }
      remember(a, `Brought the Starline crew ${treat}.`, 1, 'starline');
      break;
    }
    case 'find': {
      C.found = pick(SL_FINDS); C.pause = W.day;
      diary(`🏺 The Starline crew dug up ${a_an(esc(C.found))}! Work stopped for the day so everyone could come and look.`);
      for (const p of W.people) if (!p.visitor && rand() < 0.6) remember(p, `The Starline crew dug up ${a_an(C.found)}.`, 2, 'starline');
      for (const p of V.mid) slShift(p, 0.06);
      break;
    }
    case 'rain': diary(W.weather === 'storm' ? '⛈ The storm shut the Starline site for the day.' : '🌧 Wet weather slowed the Starline crew down.'); break;
    case 'torn': {
      const p = pick(V.mid);
      diary(`🤔 ${b(p)} still can't decide about Starline. "${esc(pick(["It'll be nice to have a cinema. But I'll miss the quiet.", 'Ask me tomorrow.', 'I like it on Mondays and hate it on Tuesdays.', 'Both sides make sense, and that is the problem.']))}"`);
      remember(p, "I keep changing my mind about Starline.", 1, 'starline');
      break;
    }
  }
}

// ---------- the ribbon cutting ----------
function slQueueRibbon() {
  if (slRibbonQ || cityStage() !== 'ready') return; slRibbonQ = true;
  const C = W.city, crew = slCrew(), V = slViews();
  const fan = V.pro.filter((p) => slNpc(p) && !crew.includes(p)).sort((a, b) => b.slView - a.slView)[0];
  const lead = person(C.lead) && slNpc(person(C.lead)) ? person(C.lead) : null;
  const cast = castFrom([...crew.map((p) => p.id), fan?.id, lead?.id, ...onlookers([...crew.map((p) => p.id), fan?.id, lead?.id], 6)].filter(Boolean), 11);
  const days = Math.max(1, (C.done ?? W.day) - (C.started ?? W.day) + 1);
  const L = [{ who: 'narrator', text: 'Starline was finished. The whole town walked across the bridge for the ribbon cutting.', city: true, hold: 4 }];
  if (crew[0]) L.push(pline(crew[0].id, pick([`${plural(days, 'day')} of work, a hundred cups of cocoa, and only one dropped hammer. Thank you, everyone.`, `We built this. With our hands. ${crew.length > 1 ? 'The whole crew did.' : ''}`.trim(), `I'd like to thank the crew, the Creator, and whoever kept bringing snacks.`]), null, { emote: '🔨' }));
  else L.push(nline('The crew from the mainland waved from the ferry on their way home.'));
  if (fan) L.push(pline(fan.id, pick(["I've been counting down the days!", pick(slReason(fan.slWhy).say), 'I am going to live over there. Well. Visit a lot.']), null, { emote: '✨' }));
  if (C.found) L.push(nline(`The ${C.found} the crew dug up went on show in Starline Station.`));
  if (lead) {
    const soft = lead.slView > -0.35 || SL_CON[lead.slWhy]?.promise === C.promise;
    L.push(pline(lead.id, soft ? pick(["Fine. It's pretty. I still signed the petition.", "…Okay. The dumplings smell amazing. Doesn't mean I was wrong.", "I'll give it a chance. One chance."]) : pick(["I still think it's too big. But congratulations to the crew.", "I'll be at the pier where it's quiet. Congratulations, though."]), null, { emote: soft ? '😌' : '😤' }));
  }
  L.push({ who: 'narrator', text: 'The Creator cut the ribbon.', fx: 'confetti', run: () => slCutRibbon() });
  L.push({ who: 'crowd', text: pick(['Wooo!', 'Starline! Starline!', 'Hooray!']), fx: 'flash', city: true, hold: 4, run: () => slFireworks(7) });
  queueCut({ kind: 'starline', icon: '🎀', title: 'Starline Opens', sub: 'The ribbon cutting', lines: L, shot: slShot,
    stage: (S) => townStage(S, slw(-12, 0), cast, { r: 3.4, arc: 2.4, dir: -0.8 }),
    onEnd: () => { slRibbonQ = false; cityUnlock(); } });
}

// ---------- what the Build tab and a tap say ----------
function cityBuildHtml() {
  const st = cityStage(), n = residentCount(), C = W.city, head = '<p class="label">Starline</p>';
  if (st === 'open') return `${head}<p class="hint">🌃 Open since day ${C.day}. Starline Tower adds rooms ${MAX_POP + 1} to ${POP_CAP}, so the town holds ${POP_CAP} residents at most (${n} now). Tap a building there to see who works in it.</p>`;
  if (st === 'none') return `${head}<p class="hint">🌃 Someday: a busy city quarter across a bridge east of downtown, with more rooms, a cinema, a radio station, food trucks, a dance studio and a monorail. The plans go up when ${STARLINE_OPEN.people} people live here or on day ${STARLINE_OPEN.day}, whichever comes first. Right now: ${plural(n, 'resident')}, day ${W.day}.</p>`;
  const V = slViews(), L = person(C.lead);
  const mood = `<div class="chips"><span class="chip good">👍 ${V.pro.length} for</span><span class="chip bad">👎 ${V.con.length} against</span><span class="chip">🤔 ${V.mid.length} unsure</span>${L ? `<span class="chip">📝 ${esc(L.name)}'s petition: ${C.petition.length}</span>` : ''}</div>`;
  if (st === 'plans') {
    const rows = Object.keys(SL_COST).map((k) => {
      const got = Math.min(SL_COST[k], C.fund[k] || 0), have = k === 'coins' ? W.creator.coins : mats()[k] || 0, need = slNeed(k);
      return `<div class="item"><div class="item-top"><span class="item-name">${esc(slCostName(k))}</span>${need ? '' : ' <span class="chip good">Done</span>'}</div><div class="meter"><i style="width:${(got / SL_COST[k]) * 100}%;background:var(--gold)"></i></div><span class="item-by">${got} of ${SL_COST[k]} · you have ${have}</span>${need ? `<div class="btns">${k === 'coins' ? [100, 1000].filter((v) => v < need).map((v) => `<button class="btn" type="button" data-cityfund="coins" data-n="${v}" ${have < 1 ? 'disabled' : ''}>Give ${coinText(v)}</button>`).join('') : ''}<button class="btn gold" type="button" data-cityfund="${k}" data-n="all" ${have < 1 ? 'disabled' : ''}>Give ${Math.min(have, need) || ''}</button></div>` : ''}</div>`;
    }).join('');
    return `${head}<p class="hint">📐 The plans are up at the fountain: a city quarter across a new bridge east of downtown, with Starline Tower (rooms ${MAX_POP + 1} to ${POP_CAP}), a cinema, a radio station, food trucks, a dance studio and a monorail. Pay for it a bit at a time. Once it's all in, the town holds a hearing and a crew of residents starts building. ${Math.round(slFundShare() * 100)}% paid for.</p>${mood}<div class="items">${rows}</div>`;
  }
  if (st === 'build' && !C.broke) return `${head}<p class="hint">💰 Paid for! The town is meeting at the fountain before the first shovel goes in.</p>${mood}`;
  if (st === 'build') {
    const pct = Math.floor(C.progress * 100), crew = slCrew(), M = mats(), can = Object.entries(SL_HELP).every(([k, v]) => (M[k] || 0) >= v);
    return `${head}<p class="hint">🏗 ${slStageName()}: ${pct}% built. Crew: ${crew.length ? andList(crew.map((p) => esc(p.name))) : 'a crew from the mainland'}. The Creator promised ${SL_PROMISES[C.promise]?.diary || 'to listen'}.${W.weather === 'storm' ? ' The storm has shut the site today.' : C.pause === W.day ? ' Work stopped today for the find.' : ''}</p><div class="meter"><i style="width:${pct}%;background:var(--gold)"></i></div>${mood}<div class="btns"><button class="btn gold" type="button" data-cityhelp ${C.helped === W.day || !can ? 'disabled' : ''}>Lend a hand (${slHelpText()})</button></div>`;
  }
  return `${head}<p class="hint">🎀 Starline is finished. The ribbon cutting is next.</p>${mood}`;
}
function slSiteTap() {
  const st = cityStage(), C = W.city;
  let t = '';
  if (st === 'none') t = 'Starline: someday.';
  else if (st === 'plans') t = `📐 Starline: ${Math.round(slFundShare() * 100)}% paid for. Give coins and supplies from the Build tab.`;
  else if (st === 'build' && C.broke) { const crew = slCrew(); t = `🏗 Starline: ${slStageName().toLowerCase()}, ${Math.floor(C.progress * 100)}% built. ${crew.length ? `Crew: ${andList(crew.map((p) => p.name))}.` : 'The mainland crew is on it.'}`; }
  else t = st === 'ready' ? '🎀 Starline is finished. The ribbon cutting is next.' : '💰 Starline is paid for. The hearing is next.';
  toast(t); Sound.ui();
}

// ---------- 3D: pieces rising, scaffolding, cranes, the fence and the ribbon ----------
function slPart(o, win) {
  const W2 = SL_WIN[win]; if (!W2) return;
  slParts.push({ o, a: W2[0], b: W2[1], how: W2[2] || 'rise', s0: o.scale.clone(), y0: o.position.y, win });
}
const slEase = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
function slApplyParts() {
  const open = cityOpen(), g = open ? 1 : slShown;
  for (const P of slParts) {
    const k = slEase((g - P.a) / (P.b - P.a || 1)), o = P.o;
    o.visible = open || g > P.a || (P.how === 'sea' && g > 0);
    if (P.how === 'sea') o.position.y = P.y0 - (1 - k) * 4;
    else if (P.how === 'grow') o.scale.set(P.s0.x * Math.max(0.02, k), P.s0.y, P.s0.z * Math.max(0.02, k));
    else o.scale.set(P.s0.x, P.s0.y * Math.max(0.01, k), P.s0.z);
  }
  if (slTrain) slTrain.visible = open;
  if (!open) for (const c of slCars) c.visible = false;
}
function slScaffold(list) {
  const bits = [];
  for (const [x, z, w, d, h] of list) {
    const hw = w / 2 + 0.7, hd = d / 2 + 0.7;
    const posts = []; for (const sx of [-1, 1]) for (let i = -1; i <= 1; i++) { posts.push([x + sx * hw, z + i * hd], [x + i * hw, z + sx * hd]); }
    for (const [px, pz] of posts) bits.push({ geo: new T3.CylinderGeometry(0.08, 0.08, h + 1.2, 5), x: px, y: (h + 1.2) / 2, z: pz, color: '#d9a441' });
    for (let y = 2.2; y <= h + 1; y += 2.2) {
      const plank = Math.round(y / 2.2) % 2 === 0;
      for (const s of [-1, 1]) {
        bits.push({ geo: new T3.BoxGeometry(hw * 2, 0.08, 0.08), x, y, z: z + s * hd, color: '#c98a3a' }, { geo: new T3.BoxGeometry(0.08, 0.08, hd * 2), x: x + s * hw, y, z, color: '#c98a3a' });
        if (plank) bits.push({ geo: new T3.BoxGeometry(hw * 2, 0.08, 0.6), x, y: y - 0.08, z: z + s * (hd - 0.3), color: '#b98a5e' }, { geo: new T3.BoxGeometry(0.6, 0.08, hd * 2), x: x + s * (hw - 0.3), y: y - 0.08, z, color: '#b98a5e' });
      }
    }
  }
  return slMerged(bits, 'slScaf');
}
function slCrane(x, z, h, ry) {
  const g = new T3.Group(); g.position.set(x, 0, z);
  const mast = [];
  for (const sx of [-0.45, 0.45]) for (const sz of [-0.45, 0.45]) mast.push({ geo: new T3.BoxGeometry(0.14, h, 0.14), x: sx, y: h / 2, z: sz, color: '#ffc233' });
  for (let y = 1.2; y < h; y += 1.5) for (const [w, d, dx, dz] of [[0.9, 0.08, 0, -0.45], [0.9, 0.08, 0, 0.45], [0.08, 0.9, -0.45, 0], [0.08, 0.9, 0.45, 0]]) mast.push({ geo: new T3.BoxGeometry(w, 0.1, d), x: dx, y, z: dz, color: '#ffc233' });
  mast.push({ geo: new T3.BoxGeometry(2.2, 0.6, 2.2), y: 0.3, color: '#8a84a8' });
  g.add(slMerged(mast, 'slCraneMast', true));
  const jib = new T3.Group(); jib.position.y = h; jib.rotation.y = ry; g.add(jib);
  jib.add(slMerged([
    { geo: new T3.BoxGeometry(18, 0.55, 0.6), x: 5, y: 0.4, color: '#ffc233' }, { geo: new T3.BoxGeometry(1.4, 1.2, 1.3), x: 0.2, y: -0.2, z: 0.9, color: '#fbf8f4' },
    { geo: new T3.BoxGeometry(0.16, 0.16, 0.16), x: 0.2, y: -0.1, z: 1.56, color: '#6fc3d8' }, { geo: new T3.BoxGeometry(1.8, 1.2, 1.2), x: -3.2, y: -0.2, color: '#8a84a8' },
    { geo: new T3.CylinderGeometry(0.12, 0.2, 3, 6), y: 2, color: '#ffc233' }, { geo: new T3.CylinderGeometry(0.03, 0.03, 12.3, 4), x: 6, y: 1.35, rz: Math.PI / 2 - 0.2, color: '#5a5470' },
    { geo: new T3.CylinderGeometry(0.03, 0.03, 4.3, 4), x: -2, y: 1.35, rz: -Math.PI / 2 + 0.66, color: '#5a5470' },
  ], 'slCraneJib', true));
  const trolley = new T3.Group(); trolley.position.set(9, 0.1, 0); jib.add(trolley);
  const cable = mesh(new T3.CylinderGeometry(0.03, 0.03, 1, 4).translate(0, -0.5, 0), toon('#3a3f66'), 0, 0, 0, false); trolley.add(cable);
  const load = slMerged([{ geo: new T3.BoxGeometry(0.4, 0.3, 0.4), y: 0.15, color: '#5a5470' }, { geo: new T3.BoxGeometry(1.6, 0.14, 1.2), y: -0.9, color: '#b98a5e' }, { geo: new T3.BoxGeometry(1.4, 0.6, 1), y: -0.5, color: '#d9826b' }, { geo: new T3.CylinderGeometry(0.02, 0.02, 0.9, 3), y: -0.3, x: 0.6, rz: 0.5, color: '#3a3f66' }, { geo: new T3.CylinderGeometry(0.02, 0.02, 0.9, 3), y: -0.3, x: -0.6, rz: -0.5, color: '#3a3f66' }], 'slCraneLoad');
  trolley.add(load);
  g.userData = { jib, trolley, cable, load, h, ry, ph: rand() * 6 };
  return g;
}
function slBuildSite(G, L) {
  if (slSite) return;
  const S = slSite = { g: new T3.Group(), scaf: [], cranes: [] };
  L.add(S.g);
  // hoarding around the site, with a gap where the bridge comes in
  const fence = [], R = 28.8;
  for (let i = 0; i < 84; i++) {
    const a = (i / 84) * Math.PI * 2; if (Math.abs(((a - Math.PI + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.1) continue;
    fence.push({ geo: new T3.BoxGeometry(2.1, 2, 0.12), x: Math.cos(a) * R, y: 1, z: Math.sin(a) * R, ry: Math.PI / 2 - a, color: i % 2 ? '#fbf1e2' : '#ffc4d6' });
    fence.push({ geo: new T3.BoxGeometry(0.14, 2.2, 0.2), x: Math.cos(a + 0.037) * R, y: 1.1, z: Math.sin(a + 0.037) * R, ry: Math.PI / 2 - a, color: '#8a84a8' });
  }
  S.g.add(slMerged(fence, 'slFence'));
  for (const a of [Math.PI - 0.3, Math.PI + 0.3]) { const sg = sign('STARLINE · coming soon', '#3d4f86', '#ffe98a', 6); sg.position.set(Math.cos(a) * (R + 0.08), 1.2, Math.sin(a) * (R + 0.08)); sg.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); S.g.add(sg); }
  // foundation slabs under everything
  const pads = [];
  for (const list of Object.values(SL_SCAF)) for (const [x, z, w, d] of list) pads.push({ geo: new T3.BoxGeometry(w + 1.2, 0.1, d + 1.2), x, y: 0.1, z, color: '#bdb3a4' });
  for (const [x, z, w] of SL_BLOCKS) pads.push({ geo: new T3.BoxGeometry(w + 1.2, 0.1, w + 1.2), x, y: 0.1, z, color: '#bdb3a4' });
  for (let i = 0; i < 7; i++) { const a = rand() * 6.28, r = 6 + rand() * 16; pads.push({ geo: new T3.DodecahedronGeometry(0.9 + rand() * 0.6, 0), x: Math.cos(a) * r, y: 0.2, z: Math.sin(a) * r, color: '#a8876a' }); }
  for (let i = 0; i < 4; i++) pads.push({ geo: new T3.BoxGeometry(1.6, 0.5, 1.1), x: -22 + i * 1.8, y: 0.25, z: -4.5, color: i % 2 ? '#d9826b' : '#b98a5e' });
  S.pads = slMerged(pads, 'slPads'); S.g.add(S.pads);
  // scaffolding goes up and comes down with each building
  for (const [k, list] of Object.entries({ ...SL_SCAF, sky: SL_BLOCKS.map(([x, z, w, h]) => [x, z, w, w, h]) })) { const m = slScaffold(list); m.userData.win = k; S.g.add(m); S.scaf.push(m); }
  for (const [x, z, h, ry] of [[-4, -12, 26, 0.4], [16, -5, 20, 2.4]]) { const c = slCrane(x, z, h, ry); S.g.add(c); S.cranes.push(c); }
  // the ribbon across the avenue, and the topping-out tree on the tower
  S.ribbon = slMerged([{ geo: new T3.CylinderGeometry(0.1, 0.12, 1.5, 8), x: -12, y: 0.75, z: -1.9, color: '#fbf8f4' }, { geo: new T3.CylinderGeometry(0.1, 0.12, 1.5, 8), x: -12, y: 0.75, z: 1.9, color: '#fbf8f4' }, { geo: new T3.BoxGeometry(0.05, 0.28, 3.8), x: -12, y: 1.25, color: '#e8394a' }, { geo: new T3.SphereGeometry(0.2, 8, 6), x: -12, y: 1.25, color: '#ff5a6e' }, { geo: new T3.ConeGeometry(0.18, 0.5, 6), x: -12, y: 1.25, z: 0.35, rx: -Math.PI / 2, color: '#e8394a' }, { geo: new T3.ConeGeometry(0.18, 0.5, 6), x: -12, y: 1.25, z: -0.35, rx: Math.PI / 2, color: '#e8394a' }], 'slRibbon');
  S.g.add(S.ribbon);
  S.tree = slMerged([{ geo: new T3.CylinderGeometry(0.08, 0.1, 0.6, 5), x: -15.5, y: 23.3, z: -13, color: '#8a6a4e' }, { geo: new T3.ConeGeometry(0.7, 1.6, 7), x: -15.5, y: 24.2, z: -13, color: '#5fae5a' }, { geo: new T3.ConeGeometry(0.5, 1.1, 7), x: -15.5, y: 24.9, z: -13, color: '#6fbf6a' }], 'slTopping');
  S.g.add(S.tree);
  slTap(S.g, 'site');
}
function slCutRibbon() {
  if (!slSite) return;
  slSite.cut = true; slRevealAt = now;
  const [rx, rz] = slw(-12, 0);
  spawnBurst(rx, 1.4, rz, ['#e8394a', '#ffffff', '#ffd36b'], 40, 2.4, 0.35); Sound.sparkle();
  SL_LAMPS.forEach(([x, z], i) => setTimeout(() => { if (cityGroup) spawnBurst(SL.x + x, 4.4, SL.z + z, ['#fff4c4', '#ffd36b'], 12, 1.2, 0.3); }, 500 + i * 180));
}
function slFireworks(n) {
  if (MODE !== 'host' || typeof scene === 'undefined' || !scene) return;
  for (let i = 0; i < n; i++) setTimeout(() => {
    const m = 60, pos = new Float32Array(m * 3), vel = [], cx = SL.x + (rand() - 0.5) * 30, cy = 22 + rand() * 10, cz = SL.z + (rand() - 0.5) * 24;
    for (let j = 0; j < m; j++) { pos[j * 3] = cx; pos[j * 3 + 1] = cy; pos[j * 3 + 2] = cz; const th = rand() * 6.28, ph = Math.acos(rand() * 2 - 1), sp = 5 + rand() * 3; vel.push([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp]); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3));
    const pts = new T3.Points(g, softPoints({ color: pick(['#ff8fb6', '#ffd36b', '#9fd3ff', '#c9b3ff', '#9fe3c4', '#ffffff']), size: 0.7, transparent: true, opacity: 1, depthWrite: false }));
    scene.add(pts); bursts.push({ pts, vel, age: 0 }); Sound.boom();
  }, i * 480);
}
// opening day: pieces at full size, site things fold away (right away if nobody watched the ribbon)
function slSiteDone() {
  slShown = 1; slApplyParts(); slParts = [];
  if (slSite && !slRevealAt) slClearSite();
}
function slClearSite() {
  if (!slSite) return;
  slSite.g.traverse((o) => { const i = tappables.indexOf(o); if (i >= 0) tappables.splice(i, 1); });
  slSite.g.parent?.remove(slSite.g); slSite = null; slRevealAt = 0;
}
function slSiteFrame(dt) {
  if (!cityGroup) { if (slBoard) { const b = slBoard.userData.buoys; if (b) b.position.y = Math.sin(now * 1.4) * 0.08; } return; }
  if (!cityOpen()) {
    const target = W.city?.progress ?? 0, d = target - slShown;
    if (Math.abs(d) > 0.0005) { slShown += Math.sign(d) * Math.min(Math.abs(d), dt * (0.004 + Math.abs(d) * 0.8)); slApplyParts(); }
  }
  const S = slSite; if (!S) return;
  if (slRevealAt) {
    const k = (now - slRevealAt) / 1.4;
    if (k >= 1) { slClearSite(); return; }
    S.g.scale.set(1, Math.max(0.01, 1 - slEase(k)), 1); S.ribbon.visible = false;
    return;
  }
  const g = slShown, ready = cityStage() === 'ready';
  for (const m of S.scaf) { const [a, b] = SL_WIN[m.userData.win]; m.visible = !ready && g > a - 0.03 && g < b + 0.05; if (m.visible) m.scale.y = Math.min(1, slEase((g - a) / (b - a)) + 0.15); }
  S.pads.visible = !ready;
  S.ribbon.visible = !S.cut && (ready || g >= 0.999);
  S.tree.visible = g >= 0.5 && !ready;
  const working = slCrew().some((p) => p.task?.kind === 'build' && p.task.phase === 'do');
  for (const c of S.cranes) {
    const u = c.userData; c.visible = !ready && g < 0.97;
    if (!c.visible) continue;
    const t = now * (working ? 1 : 0.35) + u.ph;
    u.jib.rotation.y = u.ry + Math.sin(t * 0.16) * 1.3;
    u.trolley.position.x = 7 + Math.sin(t * 0.23) * 4;
    const drop = 5 + (Math.sin(t * 0.37) * 0.5 + 0.5) * (u.h - 9);
    u.cable.scale.y = drop; u.load.position.y = -drop;
  }
  // dust and hammering while the crew is at it and you're looking
  if (working && now > slNextDust && !interior && controls && Math.hypot(controls.target.x - SL.x, controls.target.z - SL.z) < 70) {
    slNextDust = now + 0.9 + rand() * 1.2;
    const k = slBuilding(), box = k && SL_SCAF[k] ? SL_SCAF[k][0] : null;
    const [x, z] = box ? [box[0] + (rand() - 0.5) * box[2], box[1] + (rand() - 0.5) * box[3]] : [(rand() - 0.5) * 20, (rand() - 0.5) * 20];
    const y = box ? 0.5 + rand() * box[4] * slEase((g - SL_WIN[k][0]) / (SL_WIN[k][1] - SL_WIN[k][0])) : 0.5;
    spawnBurst(SL.x + x, y, SL.z + z, ['#e8dcc8', '#d4c4a8', '#fff6e0'], 10, 1.1, 0.4);
    if (rand() < 0.35) Sound.step?.();
  }
}
// the notice at the downtown end of the future bridge, with buoys marking the plot out at sea
function slBuildBillboard() {
  if (slBoard || cityLand() || typeof scene === 'undefined' || !scene || MODE !== 'host') return;
  const g = slBoard = new T3.Group();
  const [bx, bz] = polarDT(84, 26.5);
  const bits = [{ geo: new T3.CylinderGeometry(0.12, 0.14, 3.6, 8), x: -2.4, y: 1.8, color: '#8a6a4e' }, { geo: new T3.CylinderGeometry(0.12, 0.14, 3.6, 8), x: 2.4, y: 1.8, color: '#8a6a4e' }, { geo: new T3.BoxGeometry(5.8, 2.6, 0.18), y: 2.6, z: -0.05, color: '#fbf8f4' }, { geo: new T3.BoxGeometry(6.1, 0.22, 0.5), y: 4, color: '#3d4f86' }];
  const board = mesh(mergeGeos(bits), bakedMat('slBoard', { roughness: 0.8 }), 0, 0, 0, true); g.add(board);
  const s1 = sign('✦ STARLINE ✦', '#3d4f86', '#ffe98a', 5.2); s1.position.set(0, 3.1, 0.06); g.add(s1);
  const s2 = sign('a city quarter · coming soon', '#fbf8f4', '#3d4f86', 5); s2.position.set(0, 2, 0.06); g.add(s2);
  g.position.set(bx, 0, bz); g.rotation.y = -0.45;
  scene.add(g);
  const buoys = [];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, x = SL.x + Math.cos(a) * (SL.R - 1), z = SL.z + Math.sin(a) * (SL.R - 1); buoys.push({ geo: new T3.SphereGeometry(0.45, 8, 6), x, y: -0.1, z, color: '#ff8a4a' }, { geo: new T3.CylinderGeometry(0.05, 0.05, 1.2, 4), x, y: 0.6, z, color: '#fbf8f4' }); }
  const bm = mesh(mergeGeos(buoys), bakedMat('slBuoys', { roughness: 0.6 }), 0, 0, 0, false); scene.add(bm); g.userData.buoys = bm;
  slTap(g, 'plans');
}
function slDropBoard() {
  if (!slBoard) return;
  for (const o of [slBoard, slBoard.userData.buoys]) { if (!o) continue; o.traverse((c) => { const i = tappables.indexOf(c); if (i >= 0) tappables.splice(i, 1); }); scene.remove(o); }
  slBoard = null;
}
