// ============================================================
// BIG PROJECTS: eight earned builds after Starline, paid in coins and supplies, built by a crew
// ============================================================
// W.tp[id] = { stage: 'plans' | 'build' | 'ready' | 'open', fund, progress, crew, x, z, rot, ... }
// plans: the Creator pays the cost a bit at a time from the Build tab.
// build: a site goes up, a crew of generated residents works shifts, the building rises.
// ready -> open: an opening ceremony with fireworks, then the building does its job every morning.
// Real people never join a crew or argue against a project; they only visit and enjoy.
const TP = {
  bank: { name: 'Glimmer Bank', icon: '🏦', size: 3.2, days: 1.2, cost: { coins: 1200, stone: 25, parts: 8 },
    blurb: 'Your coins earn interest every morning: 2% of what you hold, up to 800 a day.',
    pro: ['A bank! My coins finally get a home.', 'Columns. Real columns. Very fancy.', 'Interest! Free money for doing nothing.'],
    con: ['A bank? What do we need a bank for?', 'Money makes people weird.', 'I keep my coins in a sock. Works fine.'],
    visit: ['I opened an account. I feel so grown up.', 'The vault door is SO heavy.', 'They gave me a free pen.', 'I just like the echo in there.', 'Counting coins is weirdly relaxing.', 'Someday my savings will be huge.'],
    open: 'The doors of Glimmer Bank swung open. The vault was shiny and very, very empty.' },
  lighthouse: { name: 'Lighthouse', icon: '🗼', size: 2.4, days: 1.5, near: 'shore', cost: { coins: 2200, stone: 35, parts: 10, shells: 15 },
    blurb: 'A beam sweeps the sea at night. Golden stars turn up three times as often, and the tide leaves you shells every morning.',
    pro: ['A lighthouse! Ships will find us.', 'I want to watch the beam go round all night.', 'Every good island needs a lighthouse.'],
    con: ['That light is going to shine right in my window.', 'We have like one ferry.', 'Stripes? Bold choice.'],
    visit: ['You can see the whole sea from up here.', 'I counted the steps. One hundred and four.', 'The wind up here!', 'I waved at a seagull. It waved back. I think.', 'Somebody carved their initials up top.', 'The light is so warm when you stand next to it.'],
    open: 'The lamp came on for the first time, and a long beam swept out across the water.' },
  market: { name: 'Night Market', icon: '🏮', size: 4, days: 1.6, cost: { coins: 3200, wood: 35, flowers: 20, shells: 10 },
    blurb: 'Lantern stalls where residents shop after dark. Stall rent pays you every morning, and anything you sell fetches double.',
    pro: ['Lanterns and snacks after dark? Yes.', 'I am going to buy so many weird little things.', 'A night market. This town is getting fun.'],
    con: ['Who shops at night? Owls?', "It'll be noisy after sunset.", 'My shop already struggles in the daytime.'],
    visit: ['I bought a lantern shaped like a fish.', 'The dumpling stall is dangerous. I keep going back.', 'I got my fortune read. It said "maybe".', 'Everything glows here.', 'I traded a shell for a button. Good deal.', 'The skewers! Oh, the skewers.', 'I found a tiny ceramic frog. His name is Pip.'],
    open: 'The lanterns lit one after another, and the Night Market opened with the smell of something sweet.' },
  mine: { name: 'Gem Mine', icon: '⛏', size: 3, days: 1.8, lobe: 'peak', cost: { coins: 4000, wood: 40, parts: 12 },
    blurb: 'Dug into Glimmer Peak. Every morning: stone, metal parts, and a gem that sells for 80 to 250 coins.',
    pro: ['Gems! Inside our own mountain!', "I've always wanted a hard hat.", 'Imagine what is down there.'],
    con: ['Digging holes in a mountain feels rude.', 'What if we wake something up?', 'I liked the peak with no holes in it.'],
    visit: ['It echoes in there. Hello! …hello…', 'I found a shiny rock. Probably just a rock.', 'The cart ride was faster than I expected.', 'It smells like cold stones.', 'There is a little purple glow way down deep.', 'I bumped my head. Worth it.'],
    open: 'The first cart rolled out of the Gem Mine, and something purple glittered in it.' },
  aquarium: { name: 'Aquarium', icon: '🐠', size: 4, days: 2, cost: { coins: 6000, shells: 40, stone: 30, parts: 15 },
    blurb: 'A glass dome full of fish. Residents love it, and ticket sales come to you every morning.',
    pro: ['Fish in a glass dome! I need it.', 'A jellyfish tank. Please let there be a jellyfish tank.', 'Finally somewhere to take a date.'],
    con: ["Fish should be in the sea, where they live.", 'A dome? What if it cracks?', 'That is a lot of glass to clean.'],
    visit: ['A jellyfish looked right at me.', 'There is an eel who hates everyone. I love him.', 'The tunnel tank! Sharks over my head!', 'I could sit by the blue tank all day.', 'A little crab waved. Or pinched the air. Same thing.', 'I named a fish. Nobody can stop me.', 'The octopus opened its own jar.'],
    open: 'The last tank filled, the lights went blue, and the Aquarium let its first visitors in.' },
  coaster: { name: 'Comet Coaster', icon: '🎢', size: 5, days: 2.2, need: 'starline', lobe: 'east', cost: { coins: 9000, wood: 60, parts: 30, stone: 20 },
    blurb: 'A roller coaster with a loop, out on East meadow. The happiest ride on the island, and the loudest screams. Tickets pay you every morning.',
    pro: ['A ROLLER COASTER.', "I'm going to ride it until I'm dizzy.", 'With a loop? A whole loop?'],
    con: ['Nope. Absolutely not. Never.', "The screaming is going to carry.", 'That loop looks illegal.'],
    visit: ['AGAIN! AGAIN!', 'I screamed so loud I scared myself.', 'My hair will never be the same.', 'I kept my eyes open the whole loop!', 'My stomach is still up there somewhere.', 'Front seat. Hands up. No regrets.', 'I lost a shoe on the loop. Worth it.'],
    open: 'The first car climbed the hill, hung at the top for one long second, and dropped. Everybody screamed.' },
  palace: { name: 'Glimmer Palace', icon: '🏰', size: 4.5, days: 2.6, lobe: 'north', cost: { coins: 15000, stone: 80, flowers: 40, wood: 40, parts: 20 },
    blurb: 'A pastel palace on North Hill. Royal tea every morning brings in 400 coins and puts the whole town in a good mood.',
    pro: ['A palace?! Do we get crowns?', 'I will be wearing my nicest outfit every day now.', 'Towers! Flags! Tea!'],
    con: ['A palace for who, exactly?', 'Seems like a lot for one hill.', "We don't even have a king. Do we?"],
    visit: ['I had tea in the throne room. Pinky up.', 'There is a staircase that goes nowhere. I love it.', 'I curtsied to a painting.', 'The view from the tower!', 'They let me try on a cape.', 'Every room smells like roses.'],
    open: 'Trumpets sounded from the towers, the flags went up, and the gates of Glimmer Palace opened to everyone.' },
  rocket: { name: 'Rocket Pad', icon: '🚀', size: 4, days: 3, lobe: 'starlight', need: 'observatory', cost: { coins: 25000, parts: 60, stone: 40, shells: 20 },
    blurb: 'A real rocket on Starlight Isle. Every five days it launches, and it comes back with space treasure worth 1000 coins or more.',
    pro: ['We are going to SPACE.', 'I volunteer. I volunteer to go.', 'A rocket made by us. Wow.'],
    con: ['A rocket? On our tiny island?', 'What if it lands on my house?', "Space is fine where it is."],
    visit: ['I touched the rocket. It is cold.', 'Ten, nine, eight… just practising.', 'I asked if I can go next time. They said maybe.', 'The stars feel closer here.', 'I wrote my name on a fin. Very small.', 'Someday I am going to the moon.'],
    open: 'The gantry lights came on, the rocket stood tall on its pad, and the whole town stared up at it.' },
};
const TP_ORDER = Object.keys(TP);
const TP_TASKS = ['tpbuild', 'tpvisit'];
const TP_CREW_MAX = 3, TP_SHIFT_END = 0.5;
const TP_CREW_LINES = ['Pass the bolts!', 'Up a little… there!', 'Who has the blueprints?', 'Lunch soon?', 'Careful, careful…', 'It looks bigger every hour.', 'Mind your fingers!', 'Measure twice!', 'Hold that steady for me?', "I'm basically an architect now."];
const TP_SPACE = ['a moon rock', 'a sliver of comet ice', 'a heart-shaped meteorite', 'a photo of the island from space', 'a jar of stardust', 'a tiny space flag', 'a lost satellite bolt', 'a crystal from an asteroid'];
let tpGroup = null, tpObj = {}, tpOpenQ = new Set(), tpClock = null;

// ---------- state ----------
const tpState = (id) => (W.tp || {})[id] || null;
const tpStage = (id) => tpState(id)?.stage || 'none';
const tpIsOpen = (id) => !!W && tpStage(id) === 'open';
const tpOpenCount = () => (W ? TP_ORDER.filter(tpIsOpen).length : 0);
function tpEnsure(id) { W.tp = W.tp || {}; return (W.tp[id] = W.tp[id] || { stage: 'plans', fund: {}, progress: 0, crew: [], since: W.day }); }
function tpNeed(id, k) { const S = tpState(id); return Math.max(0, TP[id].cost[k] - ((S?.fund || {})[k] || 0)); }
function tpFunded(id) { return Object.keys(TP[id].cost).every((k) => tpNeed(id, k) <= 0); }
function tpFundShare(id) { const S = tpState(id) || { fund: {} }; let a = 0, b = 0; for (const [k, v] of Object.entries(TP[id].cost)) { const w = k === 'coins' ? 0.02 : 1; a += Math.min(v, S.fund[k] || 0) * w; b += v * w; } return a / b; }
// what has to exist first
function tpLock(id) {
  const P = TP[id], out = [];
  if (P.lobe && !(W.lobes || []).includes(P.lobe)) out.push(`raise ${LOBES[P.lobe].name} (More land)`);
  if (P.need === 'starline' && cityStage() !== 'open') out.push('open Starline');
  if (P.need === 'observatory' && !(W.placed || []).some((pl) => pl.type === 'observatory')) out.push('build the observatory (Landmarks)');
  return out;
}
const tpCostName = (k) => (k === 'coins' ? '✦ coins' : MATS[k]);
const tpCostText = (id) => Object.entries(TP[id].cost).map(([k, v]) => `${coinText(v)} ${tpCostName(k).split(' ').slice(1).join(' ')}`).join(', ');
const tpCrew = (id) => (tpState(id)?.crew || []).map(person).filter(slFree);
const tpSites = () => (W && W.tp ? TP_ORDER.filter((id) => W.tp[id]?.x != null).map((id) => ({ id, x: W.tp[id].x, z: W.tp[id].z, size: TP[id].size })) : []);
const tpLive = () => typeof offlineSim === 'undefined' || !offlineSim;
const tpDoing = (k) => ({ tpbuild: 'building a big project', tpvisit: 'out and about' })[k] || null;

// ---------- where it goes ----------
// land the lobe projects need stays free for them
const tpHeldLobes = (id) => [...new Set(TP_ORDER.filter((k) => k !== id && TP[k].lobe && tpState(k)?.x == null).map((k) => TP[k].lobe))].filter((k) => (W.lobes || []).includes(k));
// meadow grass, flowers and rocks stay off the sites
function tpClear(x, z, pad = 0) { for (const s of tpSites()) if (Math.hypot(x - s.x, z - s.z) < s.size + 1.2 + pad) return false; return true; }
// the island's own trees, bushes and lamps (not in spotProblem, which predates big buildings)
function tpScenery(x, z, size) {
  for (const [a, r, s] of TOWN_TREES) { const [tx, tz] = polar(a, r); if (Math.hypot(x - tx, z - tz) < size + 2 * (s || 1)) return true; }
  for (const [bx, bz] of BUSHES) if (Math.hypot(x - bx, z - bz) < size + 1.2) return true;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; if (Math.hypot(x - Math.cos(a) * 12.8, z - Math.sin(a) * 12.8) < size + 0.6) return true; }
  return false;
}
function tpSpotOk(id, x, z) {
  const size = TP[id].size;
  if (spotProblem(x, z, size) || tpScenery(x, z, size)) return false;
  if (!TP[id].lobe) for (const k of tpHeldLobes(id)) { const [cx, cz] = lobeCenter(k); if (Math.hypot(x - cx, z - cz) < lobeR(k) + size) return false; }
  for (const s of tpSites()) if (s.id !== id && Math.hypot(x - s.x, z - s.z) < size + s.size + 2.5) return false;
  return true;
}
// the mine is dug into the side of the mountain, between two boulders, facing away from the bridge
function tpMineSpot() {
  if (!(W.lobes || []).includes('peak')) return null;
  const [cx, cz] = lobeCenter('peak'), home = Math.atan2(-cz, -cx), gaps = [0, 1, 2, 3, 4].map((i) => ((i + 0.5) / 5) * 6.28);
  const off = (a) => Math.abs(Math.atan2(Math.sin(a - home), Math.cos(a - home)));
  for (const a of gaps.sort((p, q) => off(q) - off(p))) {
    const x = cx + Math.cos(a) * 6.8, z = cz + Math.sin(a) * 6.8;
    if (tpSites().some((s) => s.id !== 'mine' && Math.hypot(x - s.x, z - s.z) < s.size + 5.5)) continue;
    return [x, z, Math.atan2(Math.cos(a), Math.sin(a))];
  }
  return null;
}
function tpPickSpot(id) {
  const P = TP[id];
  if (id === 'mine') return tpMineSpot();
  const held = tpHeldLobes(id), meadows = (W.lobes || []).filter((k) => !LOBES[k].kind && !held.includes(k));
  for (let i = 0; i < 600; i++) {
    let x, z;
    if (P.lobe) { const [cx, cz] = lobeCenter(P.lobe), a = rand() * 6.28, r = Math.sqrt(rand()) * (lobeR(P.lobe) - P.size - 0.5); x = cx + Math.cos(a) * r; z = cz + Math.sin(a) * r; }
    else if (P.near === 'shore' && i < 400) { const a = rand() * 6.28, r = 23.5 + rand() * 2.5; x = Math.cos(a) * r; z = Math.sin(a) * r; }
    else if (i < 300 && meadows.length) { const k = meadows[i % meadows.length], [cx, cz] = lobeCenter(k), a = rand() * 6.28, r = Math.sqrt(rand()) * (lobeR(k) - P.size - 0.5); x = cx + Math.cos(a) * r; z = cz + Math.sin(a) * r; }
    else { const s = autoSpot(P.size); if (!s) continue; [x, z] = s; }
    if (tpSpotOk(id, x, z)) return [x, z];
  }
  return null;
}

// ---------- paying for it ----------
function tpCmd(c) {
  const id = c.id, P = TP[id]; if (!P) return '';
  const CR = W.creator;
  if (c.a === 'give') {
    if (tpLock(id).length) return `First, ${andList(tpLock(id))}.`;
    const st = tpStage(id); if (st !== 'none' && st !== 'plans') return '';
    const k = c.what; if (!(k in P.cost)) return '';
    const have = k === 'coins' ? CR.coins : mats()[k] || 0;
    const want = c.n === 'all' ? tpNeed(id, k) : Math.min(tpNeed(id, k), Math.max(0, Math.floor(Number(c.n) || 0)));
    const n = Math.min(have, want);
    if (n <= 0) return tpNeed(id, k) <= 0 ? `The ${P.name} has all the ${tpCostName(k)} it needs.` : `You don't have any ${tpCostName(k)} to give.`;
    const first = st === 'none', S = tpEnsure(id);
    if (k === 'coins') CR.coins -= n; else mats()[k] -= n;
    S.fund[k] = (S.fund[k] || 0) + n;
    if (first) tpPlansUp(id);
    Sound.coin?.(); markDirty();
    if (tpFunded(id)) return tpFundedNow(id);
    return `Put ${coinText(n)} ${tpCostName(k)} toward the ${P.name}. It's ${Math.round(tpFundShare(id) * 100)}% paid for.`;
  }
  if (c.a === 'help') {
    const S = tpState(id); if (!S || S.stage !== 'build') return '';
    if (S.helped === W.day) return "The crew says thanks, but that's enough help for today.";
    const M = mats(); if ((M.wood || 0) < 4 || (M.stone || 0) < 4) return 'Lending a hand takes 4 wood and 4 stone.';
    M.wood -= 4; M.stone -= 4; S.helped = W.day; tpAdvance(id, 0.1);
    diary(`🔨 <span class="cr">Creator</span> brought the ${esc(P.name)} crew extra wood and stone.`);
    for (const p of tpCrew(id)) { creatorShift(p, 0.2); remember(p, `The Creator came by the ${P.name} site and helped the crew.`, 1, 'build'); if (!p.inside) emote(p, '✨', 3); }
    Sound.sparkle?.(); markDirty();
    return `The crew cheered. The ${P.name} is ${Math.floor(Math.min(1, S.progress) * 100)}% built.`;
  }
  return '';
}
// the plans go up: a generated fan and a generated skeptic say their piece
function tpPlansUp(id) {
  const P = TP[id], S = tpState(id), pool = W.people.filter((p) => slNpc(p) && !p.inside).sort(() => rand() - 0.5);
  const fan = pool[0], skeptic = pool[1];
  diary(`📐 Plans for the <b>${esc(P.name)}</b> went up at the fountain. It needs ${tpCostText(id)}.`);
  if (fan) { S.fan = fan.id; const line = pick(P.pro); bubble(fan, line, 3.4); remember(fan, `Plans for the ${P.name} went up. I can't wait. ${line}`, 2, 'build'); }
  if (skeptic) { S.skeptic = skeptic.id; const line = pick(P.con); bubble(skeptic, line, 3.4); remember(skeptic, `Plans for the ${P.name} went up. ${line}`, 2, 'build'); }
  for (const p of W.people) if (!p.visitor && p.grow >= 0.6 && p !== fan && p !== skeptic && rand() < 0.4) remember(p, `The Creator is paying for a ${P.name}.`, 1, 'build');
  if (MODE === 'host' && tpLive()) toast(`${P.icon} Plans for the ${P.name} went up. Keep paying for it from the Build tab.`);
}
function tpFundedNow(id) {
  const P = TP[id], S = tpState(id), spot = tpPickSpot(id);
  if (!spot) { S.waitRoom = true; markDirty(); return `The ${P.name} is paid for, but there's no room for it yet. Remove something or raise more land, and the crew will start.`; }
  S.waitRoom = false; [S.x, S.z] = spot; S.rot = Math.atan2(-S.x, -S.z) + (rand() - 0.5) * 0.6;
  if (spot[2] != null) S.rot = spot[2];
  else if (P.lobe) { const [cx, cz] = lobeCenter(P.lobe); S.rot = Math.atan2(cx - S.x, cz - S.z) + Math.PI + (rand() - 0.5) * 0.5; if (Math.hypot(S.x - cx, S.z - cz) < 1) S.rot = Math.atan2(-cx, -cz); }
  S.stage = 'build'; S.started = W.day; S.progress = 0; S.crew = tpPickCrew(id);
  const crew = tpCrew(id);
  diary(`⛏ Ground broke on the <b>${esc(P.name)}</b>. ${crew.length ? `${andList(crew.map((p) => `<b>${esc(p.name)}</b>`))} signed up for the crew.` : 'Nobody here could be spared, so a crew came over from the mainland.'}`);
  for (const p of crew) { remember(p, `I joined the crew building the ${P.name}. I'll be on site every day until it's done.`, 3, 'build'); if (!p.inside) bubble(p, pick(["Hard hat's on. Let's build.", "Crew reporting!", "I've never built anything this big."]), 3); }
  for (const p of W.people) if (!p.visitor && !p.inside && !crew.includes(p) && rand() < 0.3) bubble(p, pick(['The ground is shaking!', 'Here we go!', 'Ooh, construction.', `A ${P.name}!`]), 2.6);
  if (MODE === 'host' && tpLive()) { toast(`${P.icon} The ${P.name} is paid for! The crew is breaking ground.`); tpBuild3D(); if (typeof controls !== 'undefined' && controls && !interior) camGoal = { x: S.x, z: S.z, r: 38 }; }
  markDirty();
  return `The ${P.name} is paid for! The crew is breaking ground.`;
}
// generated adults whose job someone else can cover. Real people keep their days to themselves.
function tpPickCrew(id) {
  const busy = new Set([...(W.city?.stage === 'build' ? W.city.crew || [] : []), ...TP_ORDER.filter((k) => k !== id && tpStage(k) === 'build').flatMap((k) => W.tp[k].crew || [])]);
  const count = (j) => W.people.filter((q) => q.job === j).length;
  const ok = (p) => slNpc(p) && !busy.has(p.id) && p.job && !JOBS[p.job]?.city && (p.job === 'builder' || p.job === 'civil' || (collarOf(p) !== 'white' && count(p.job) >= 2));
  const score = (p) => (p.job === 'builder' ? 4 : p.job === 'civil' ? 3 : 0) + (p.id === tpState(id)?.fan ? 2 : 0) + rand();
  return W.people.filter(ok).sort((a, b) => score(b) - score(a)).slice(0, TP_CREW_MAX).map((p) => p.id);
}

// ---------- building it ----------
function tpAdvance(id, d) {
  const S = tpState(id); if (!S || S.stage !== 'build' || d <= 0) return;
  const before = S.progress; S.progress = Math.min(1, before + d);
  if (before < 0.5 && S.progress >= 0.5) diary(`🏗 The <b>${esc(TP[id].name)}</b> is halfway built.`);
  if (S.progress >= 1) { S.stage = 'ready'; S.done = W.day; diary(`🏗 The <b>${esc(TP[id].name)}</b> is finished. The opening is next.`); for (const p of tpCrew(id)) { addJoy(p, 12); remember(p, `We finished building the ${TP[id].name}. I helped build that.`, 3, 'build'); } tpQueueOpening(id); }
  markDirty();
}
// per game day of crew work: a full crew finishes in P.days
const tpRate = (id) => 1 / (TP[id].days * TP_SHIFT_END * TP_CREW_MAX);
function tpCrewPlan(p) {
  if (!W.tp || p.visitor || p.grow < 1 || p.workedToday || W.t < 0.02 || W.t >= TP_SHIFT_END || W.weather === 'storm' || !slFree(p)) return false;
  const id = TP_ORDER.find((k) => tpStage(k) === 'build' && W.tp[k].crew.includes(p.id) && W.tp[k].x != null); if (!id) return false;
  const S = W.tp[id], r = TP[id].size + 1.2 + rand() * 1.4, a = rand() * 6.28;
  setTask(p, 'tpbuild', Math.hypot(S.x - DT.x, S.z - DT.z) < DT.R ? 'downtown' : 'plaza', [S.x + Math.cos(a) * r, S.z + Math.sin(a) * r], { id });
  return true;
}
function tpVisitPlan(p) {
  if (!W.tp || p.visitor || rand() > 0.09) return false;
  const night = W.t > 0.42 && W.t < 0.6;
  const open = TP_ORDER.filter((k) => tpIsOpen(k) && W.tp[k].x != null && (k !== 'market' || night) && !(k === 'rocket' && W.tp[k].away));
  if (!open.length) return false;
  const id = open.includes('market') && rand() < 0.5 ? 'market' : pick(open), S = W.tp[id], a = S.rot + (rand() - 0.5) * 2.2, r = TP[id].size + 1 + rand();
  setTask(p, 'tpvisit', Math.hypot(S.x - DT.x, S.z - DT.z) < DT.R ? 'downtown' : 'plaza', [S.x + Math.sin(a) * r, S.z + Math.cos(a) * r], { id });
  return true;
}
function tpStart(p, k) {
  if (!TP_TASKS.includes(k)) return false;
  const S = tpState(p.task.id); if (S) p.face = Math.atan2(S.x - p.x, S.z - p.z);
  if (k === 'tpbuild') { p.busyUntil = now + 4 * ts(); emote(p, pick(['🔨', '🔧', '🧱', '📐', '⛏']), 4); if (rand() < 0.25) bubble(p, pick(TP_CREW_LINES), 2.6); return true; }
  p.busyUntil = now + (4 + rand() * 3) * ts(); emote(p, TP[p.task.id]?.icon || '✨', 3);
  if (rand() < 0.5) bubble(p, pick(TP[p.task.id]?.visit || ['Nice.']), 2.8);
  return true;
}
function tpFinish(p, k) {
  const id = p.task?.id, P = TP[id]; if (!P) return;
  if (k === 'tpbuild') {
    if (W.t >= TP_SHIFT_END || tpStage(id) !== 'build') {
      p.workedToday = true; earn(p, 5); addJoy(p, 4);
      remember(p, pick([`Worked a shift building the ${P.name}. My back hurts, but it's going up.`, `Another day on the ${P.name} crew.`, `You can see the ${P.name} from the fountain now. I built part of that.`]), 1, 'build');
      bubble(p, pick(['Good shift, everyone.', 'See you tomorrow, site.', '+5 coins!', 'My arms are noodles.']), 2.4);
    }
    return;
  }
  addJoy(p, { coaster: 18, palace: 12, aquarium: 12, market: 10, lighthouse: 8, rocket: 10, mine: 6, bank: 4 }[id] || 8);
  remember(p, `Went to the ${P.name}. ${pick(P.visit)}`, 1, 'landmark');
  W.tpTix = W.tpTix || {}; W.tpTix[id] = (W.tpTix[id] || 0) + 1;
  if (id === 'market' && purse(p) >= 2 && !p.saving) spend(p, 2);
  if (rand() < 0.4) bubble(p, pick(P.visit), 2.6);
}

// ---------- the opening ----------
function tpQueueOpening(id) {
  if (tpOpenQ.has(id) || tpStage(id) !== 'ready') return; tpOpenQ.add(id);
  const P = TP[id], S = tpState(id), crew = tpCrew(id), fan = person(S.fan), sk = person(S.skeptic);
  const ids = [...crew.map((p) => p.id), fan && slFree(fan) ? fan.id : null, sk && slNpc(sk) ? sk.id : null].filter(Boolean);
  const cast = castFrom([...ids, ...onlookers(ids, 6)], 9);
  const days = Math.max(1, (S.done ?? W.day) - (S.started ?? W.day) + 1);
  const L = [nline(`The ${P.name} was finished. The whole town came to see it open.`)];
  if (crew[0]) L.push(pline(crew[0].id, pick([`${plural(days, 'day')} of work and nobody fell off anything. Thank you, crew.`, `We built this. With our own hands. ${crew.length > 1 ? 'All of us.' : ''}`.trim(), "I'd like to thank the crew, the Creator, and whoever brought the cookies."]), null, { emote: '🔨' }));
  else L.push(nline('The crew from the mainland waved from the ferry on their way home.'));
  if (fan && slFree(fan)) L.push(pline(fan.id, pick(P.pro), null, { emote: '✨' }));
  if (sk && slNpc(sk)) L.push(pline(sk.id, pick(['…Okay. Fine. It is pretty.', 'I still have questions. But it is nice.', "I'll try it once. Once.", 'Hm. Better than I thought.']), null, { emote: '😌' }));
  L.push({ who: 'narrator', text: 'The Creator cut the ribbon.', fx: 'confetti' });
  L.push({ who: 'narrator', text: P.open, fx: 'flash', run: () => tpFireworks(S.x, S.z, 6) });
  L.push({ who: 'crowd', text: pick(['Hooray!', 'Woooo!', `${P.name}! ${P.name}!`, '*cheering*']), hold: 3 });
  queueCut({ kind: 'project', icon: P.icon, title: `The ${P.name} Opens`, sub: 'Opening day', lines: L,
    stage: (C) => { const f = TP[id].size + 3.8, cx = S.x + Math.sin(S.rot) * f, cz = S.z + Math.cos(S.rot) * f; townStage(C, [cx, cz], cast, { r: 1.6, arc: 2.6, dir: S.rot }); CUT.focus = { x: cx, z: cz }; },
    onEnd: () => { tpOpenQ.delete(id); tpOpen(id); } });
}
function tpOpen(id) {
  const S = tpState(id); if (!S || S.stage === 'open') return;
  const P = TP[id]; S.stage = 'open'; S.openDay = W.day;
  if (id === 'rocket') S.nextLaunch = W.day + 2;
  diary(`${P.icon} The <b>${esc(P.name)}</b> is open. ${esc(P.blurb)}`);
  for (const p of W.people) if (!p.visitor && rand() < 0.6) remember(p, `The ${P.name} opened today with a ribbon cutting.`, 2, 'build');
  const sk = person(S.skeptic); if (sk) remember(sk, `I wasn't sure about the ${P.name}. It turned out okay.`, 1, 'build');
  if (MODE === 'host' && tpLive()) { toast(`${P.icon} The ${P.name} is open!`); Sound.levelup?.(); tpBuild3D(); }
  markDirty();
}

// ---------- every morning ----------
function tpDaily() {
  if (!W.tp) return;
  const tix = W.tpTix || {}; W.tpTix = {};
  for (const id of TP_ORDER) {
    const S = W.tp[id]; if (!S) continue;
    const P = TP[id];
    if (S.waitRoom) { tpFundedNow(id); continue; }
    if (S.stage === 'build') {
      S.crew = (S.crew || []).filter((pid) => slNpc(person(pid)));
      if (!S.crew.length) S.crew = tpPickCrew(id);
      const n = tpCrew(id).length, wx = W.weather === 'storm' ? 0 : W.weather === 'rain' || W.weather === 'snow' ? 0.6 : 1;
      // the box was off: the crew kept working; no crew at all: the mainland crew comes over
      if (!tpLive()) tpAdvance(id, n * tpRate(id) * TP_SHIFT_END * wx);
      else if (!n) tpAdvance(id, 0.25 / P.days * wx);
      continue;
    }
    if (S.stage === 'ready') { tpQueueOpening(id); continue; }
    if (S.stage !== 'open') continue;
    const t = tix[id] || 0;
    if (id === 'bank') { const n = Math.min(800, Math.floor(W.creator.coins * 0.02)); if (n > 0) { creatorEarn(n); diary(`🏦 Glimmer Bank paid ${coinText(n)} coins of interest.`); } }
    else if (id === 'lighthouse') { mats().shells += 4; diary('🗼 The tide left 4 shells by the lighthouse.'); }
    else if (id === 'market') { const n = 80 + t * 12; creatorEarn(n); diary(`🏮 Night Market stall rent brought in ${coinText(n)} coins.`); }
    else if (id === 'mine') { const M = mats(), g = 80 + Math.floor(rand() * 171); M.stone += 5; M.parts += 3; creatorEarn(g); diary(`⛏ The Gem Mine sent up 5 stone, 3 metal parts and ${pick(['a purple gem', 'a blue gem', 'a pink crystal', 'a lump of gold', 'a green gem'])} worth ${coinText(g)} coins.`); }
    else if (id === 'aquarium') { const n = 120 + t * 15; creatorEarn(n); diary(`🐠 Aquarium tickets brought in ${coinText(n)} coins.`); }
    else if (id === 'coaster') { const n = 150 + t * 20; creatorEarn(n); diary(`🎢 Comet Coaster tickets brought in ${coinText(n)} coins.`); }
    else if (id === 'palace') { creatorEarn(400); for (const p of W.people) if (!p.visitor) addJoy(p, 3); diary('🏰 Royal tea at Glimmer Palace brought in 400 coins. Everyone is in a good mood.'); }
    else if (id === 'rocket') tpRocketDaily(S);
  }
}
function tpRocketDaily(S) {
  if (S.away) {
    S.away = false; const what = pick(TP_SPACE), n = 1000 + Math.floor(rand() * 2001);
    creatorEarn(n); S.trips = (S.trips || 0) + 1;
    if ((W.placed || []).some((pl) => pl.type === 'museum')) { W.museum = W.museum || []; W.museum.push({ name: what, day: W.day }); }
    diary(`🚀 The rocket came home with ${what}, worth ${coinText(n)} coins.${(W.placed || []).some((pl) => pl.type === 'museum') ? ' It went on show in the museum.' : ''}`);
    for (const p of W.people) if (!p.visitor && rand() < 0.4) remember(p, `The rocket came back from space with ${what}.`, 2, 'build');
    if (MODE === 'host' && tpLive()) { toast(`🚀 The rocket is back with ${what}! +${coinText(n)} ✦`); tpBuild3D(); }
    S.nextLaunch = W.day + 5; return;
  }
  if (W.day < (S.nextLaunch || 0)) return;
  S.away = true; S.launches = (S.launches || 0) + 1;
  diary(`🚀 The rocket on Starlight Isle launched. ${pick(['Everyone stopped to watch.', 'The whole island shook.', 'It left a long white trail across the sky.'])}`);
  if (MODE !== 'host' || !tpLive() || !S.x) return;
  const cast = castFrom(onlookers([], 7), 7), f = TP.rocket.size + 6, cx = S.x + Math.sin(S.rot) * f, cz = S.z + Math.cos(S.rot) * f;
  const L = [nline('Everyone on Starlight Isle went quiet. The rocket was fuelled and ready.'), { who: 'crowd', text: 'Ten… nine… eight…' }, { who: 'crowd', text: 'Three… two… one…' }, { who: 'narrator', text: 'LIFTOFF!', fx: 'shock', run: tpLiftoff }];
  const a = cast.map(person).find((p) => p && p.grow >= 1); if (a) L.push(pline(a.id, pick(['Bring me back something shiny!', 'Bye, rocket! Be careful up there!', "I'm not crying. It's the smoke."]), null, { emote: '🚀' }));
  L.push({ who: 'crowd', text: pick(['Wooooo!', '*cheering*', 'Go, go, go!']), hold: 3 });
  queueCut({ kind: 'project', icon: '🚀', title: 'Liftoff', sub: `Launch number ${S.launches}`, lines: L,
    stage: (C) => { townStage(C, [cx, cz], cast, { r: 2, arc: 2.6, dir: S.rot }); cutCam(S.x, 6, S.z, cx + Math.sin(S.rot) * 18, 9, cz + Math.cos(S.rot) * 18); CUT.focus = { x: S.x, z: S.z }; },
    onEnd: tpLiftoff });
}
// the rocket climbs away once per launch, during the scene or right after it
function tpLiftoff() { const O = tpObj.rocket; if (O && !O.launched) { O.launched = true; O.launchAt = now; } }
function tpBoot() {
  if (!W.tp) return;
  for (const id of TP_ORDER) if (tpStage(id) === 'ready') tpQueueOpening(id);
  if (MODE === 'host') tpBuild3D();
}
function tpTap(id) {
  const S = tpState(id), P = TP[id]; if (!S || !P) return;
  const crew = tpCrew(id);
  const t = S.stage === 'open' ? `${P.icon} ${P.name}. ${P.blurb}${id === 'rocket' && S.away ? ' The rocket is in space right now. It comes back tomorrow.' : ''}`
    : S.stage === 'build' ? `${P.icon} The ${P.name}: ${Math.floor(S.progress * 100)}% built. ${crew.length ? `Crew: ${andList(crew.map((p) => p.name))}.` : 'The mainland crew is on it.'}`
    : `${P.icon} The ${P.name} is finished. The opening is next.`;
  toast(t); Sound.ui?.();
}
function tpFireworks(x, z, n) {
  if (MODE !== 'host' || typeof scene === 'undefined' || !scene) return;
  for (let i = 0; i < n; i++) setTimeout(() => {
    const m = 60, pos = new Float32Array(m * 3), vel = [], cx = x + (rand() - 0.5) * 16, cy = 14 + rand() * 8, cz = z + (rand() - 0.5) * 16;
    for (let j = 0; j < m; j++) { pos[j * 3] = cx; pos[j * 3 + 1] = cy; pos[j * 3 + 2] = cz; const th = rand() * 6.28, ph = Math.acos(rand() * 2 - 1), sp = 4 + rand() * 3; vel.push([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp]); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3));
    const pts = new T3.Points(g, softPoints({ color: pick(['#ff8fb6', '#ffd36b', '#9fd3ff', '#c9b3ff', '#9fe3c4', '#ffffff']), size: 0.7, transparent: true, opacity: 1, depthWrite: false }));
    scene.add(pts); bursts.push({ pts, vel, age: 0 }); Sound.boom?.();
  }, i * 450);
}

// ---------- what the Build tab says ----------
function tpBuildHtml() {
  const CR = W.creator, M = mats();
  const cards = TP_ORDER.map((id) => {
    const P = TP[id], S = tpState(id), st = tpStage(id), lock = tpLock(id);
    const head = `<div class="item-top"><span class="item-name">${P.icon} ${esc(P.name)}</span>${st === 'open' ? ' <span class="chip good">Open</span>' : st === 'build' ? ' <span class="chip">Building</span>' : ''}</div><span class="item-by">${esc(P.blurb)}</span>`;
    if (st === 'open') return `<div class="item">${head}<span class="item-by">Open since day ${S.openDay}.${id === 'rocket' ? (S.away ? ' The rocket is in space. Back tomorrow.' : ` Next launch on day ${S.nextLaunch}.`) : ''}</span></div>`;
    if (st === 'ready') return `<div class="item">${head}<span class="item-by">🎀 Finished. The opening is next.</span></div>`;
    if (st === 'build') {
      const pct = Math.floor(S.progress * 100), crew = tpCrew(id), can = (M.wood || 0) >= 4 && (M.stone || 0) >= 4;
      return `<div class="item">${head}<div class="meter"><i style="width:${pct}%;background:var(--gold)"></i></div><span class="item-by">🏗 ${pct}% built. Crew: ${crew.length ? andList(crew.map((p) => esc(p.name))) : 'a crew from the mainland'}.${W.weather === 'storm' ? ' The storm shut the site today.' : ''}</span><div class="btns"><button class="btn gold" type="button" data-tphelp="${id}" ${S.helped === W.day || !can ? 'disabled' : ''}>Lend a hand (4 wood, 4 stone)</button></div></div>`;
    }
    if (lock.length) return `<div class="item">${head}<span class="item-by">🔒 First, ${esc(andList(lock))}. Costs ${esc(tpCostText(id))}.</span></div>`;
    const rows = Object.keys(P.cost).map((k) => {
      const need = tpNeed(id, k), got = P.cost[k] - need, have = k === 'coins' ? CR.coins : M[k] || 0;
      const btns = need ? `${k === 'coins' ? [100, 1000, 5000].filter((v) => v < need).map((v) => `<button class="btn" type="button" data-tpfund="coins" data-tpid="${id}" data-n="${v}" ${have < 1 ? 'disabled' : ''}>${coinText(v)}</button>`).join('') : ''}<button class="btn gold" type="button" data-tpfund="${k}" data-tpid="${id}" data-n="all" ${have < 1 ? 'disabled' : ''}>Give ${coinText(Math.min(have, need)) || ''}</button>` : '<span class="chip good">Done</span>';
      return `<div style="margin-top:6px"><span class="item-by">${esc(tpCostName(k))}: ${coinText(got)} of ${coinText(P.cost[k])} · you have ${coinText(have)}</span><div class="meter"><i style="width:${(got / P.cost[k]) * 100}%;background:var(--gold)"></i></div><div class="btns">${btns}</div></div>`;
    }).join('');
    return `<div class="item">${head}${S?.waitRoom ? '<span class="item-by">💰 Paid for, but there is no room. Remove something or raise more land.</span>' : rows}</div>`;
  }).join('');
  return `<p class="label">Big projects</p><p class="hint">Pay a bit at a time in coins and supplies. Once one is paid for, a crew of residents builds it over a few days and the town opens it with fireworks. Each one keeps paying you back. ${tpOpenCount()} of ${TP_ORDER.length} open.</p><div class="items">${cards}</div>`;
}

// ---------- 3D ----------
const tpAt = (geo, x, y, z, color, r = {}) => ({ geo, x, y, z, color, ...r });
const tpBx = (w, h, d) => new T3.BoxGeometry(w, h, d);
const tpCy = (r1, r2, h, s = 12) => new T3.CylinderGeometry(r1, r2, h, s);
const tpCo = (r, h, s = 12) => new T3.ConeGeometry(r, h, s);
const tpSp = (r, a = 10, b = 8) => new T3.SphereGeometry(r, a, b);
// a part placed in a frame turned by ry around (ox, oz)
function tpTurn(list, ox, oz, ry) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return list.map((it) => ({ ...it, x: ox + it.x * c + it.z * s, z: oz - it.x * s + it.z * c, ry: (it.ry || 0) + ry }));
}
let tpGlowMat = null;
const tpGlow = () => (tpGlowMat = tpGlowMat || new T3.MeshBasicMaterial({ vertexColors: true }));
// coaster track: x, y, z at u in [0, 1)
const tpTrack = (u) => { const a = u * Math.PI * 2; return [Math.cos(a) * 4.6, 3 + Math.sin(2 * a) * 1.5 + Math.sin(a) * 0.8, Math.sin(a) * 3.3]; };
function tpModel(id) {
  const A = tpAt, solid = [], lit = [], out = { solid, lit, h: 6 };
  if (id === 'bank') {
    solid.push(A(tpBx(6.6, 0.4, 5.2), 0, 0.2, 0, '#d4cbe0'), A(tpBx(3, 0.25, 0.8), 0, 0.5, 2.7, '#e8e2f0'), A(tpBx(5.6, 3.2, 4), 0, 2.0, -0.2, '#f6efe2'));
    for (const x of [-2.1, -0.7, 0.7, 2.1]) solid.push(A(tpCy(0.24, 0.28, 3, 10), x, 2.0, 2.15, '#fffaf2'));
    solid.push(A(tpBx(6, 0.5, 4.8), 0, 3.85, 0, '#9fd8c4'), A(tpCo(4.1, 1.5, 4).rotateY(Math.PI / 4).scale(1, 1, 0.8), 0, 4.85, 0, '#7cc4ad'));
    solid.push(A(tpBx(1.2, 2, 0.12), 0, 1.4, 1.82, '#6b4a3a'), A(tpCy(0.7, 0.7, 0.16, 20), 0, 4.75, 2.3, '#ffd36b', { rx: Math.PI / 2 }));
    for (const s of [-1, 1]) solid.push(A(tpBx(0.1, 1.1, 0.9), s * 2.82, 2.2, -0.6, '#bfe8ff'));
    lit.push(A(tpSp(0.16), -1.4, 2.7, 2.0, '#fff4c4'), A(tpSp(0.16), 1.4, 2.7, 2.0, '#fff4c4'));
    out.h = 5.6;
  } else if (id === 'lighthouse') {
    solid.push(A(tpCy(2.3, 2.5, 0.7, 16), 0, 0.35, 0, '#a9a3c2'));
    for (let i = 0; i < 5; i++) solid.push(A(tpCy(1.5 - 0.11 * (i + 1), 1.5 - 0.11 * i, 1.5, 16), 0, 0.7 + i * 1.5 + 0.75, 0, i % 2 ? '#ffffff' : '#ff7a7a'));
    solid.push(A(tpCy(1.35, 1.35, 0.22, 16), 0, 8.31, 0, '#5a5470'), A(tpCy(0.8, 0.8, 1.2, 12), 0, 9.0, 0, '#bfe8ff'), A(tpCo(1.05, 1.0, 12), 0, 10.1, 0, '#ff7a7a'), A(tpSp(0.18), 0, 10.7, 0, '#ffd36b'), A(tpBx(0.8, 1.4, 0.1), 0, 1.4, 1.42, '#6b4a3a'));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28; solid.push(A(tpCy(0.04, 0.04, 0.5, 4), Math.cos(a) * 1.28, 8.67, Math.sin(a) * 1.28, '#5a5470')); }
    lit.push(A(tpSp(0.5), 0, 9.0, 0, '#fff4c4'));
    out.h = 10.8; out.lamp = 9.0;
  } else if (id === 'market') {
    const cols = ['#ff8fb6', '#9fd3ff', '#ffd36b', '#9fe3c4', '#c9b3ff'];
    [-1.6, -0.8, 0, 0.8, 1.6].forEach((a, i) => {
      const sx = Math.sin(a) * 3.2, sz = -Math.cos(a) * 3.2 + 0.6, stall = [A(tpBx(1.6, 0.8, 0.7), 0, 0.4, 0.3, '#c49a6c'), A(tpBx(1.9, 0.12, 1.3), 0, 2.25, 0.15, cols[i]), A(tpBx(0.55, 0.13, 1.31), 0, 2.26, 0.15, '#ffffff')];
      for (const px of [-0.75, 0.75]) for (const pz of [-0.45, 0.6]) stall.push(A(tpCy(0.05, 0.05, 2.2, 5), px, 1.1, pz, '#8a6a4e'));
      for (let j = 0; j < 3; j++) stall.push(A(tpSp(0.13, 8, 6), -0.5 + j * 0.5, 0.92, 0.3, pick(['#ff6f5e', '#ffb347', '#9fe3c4', '#c9b3ff'])));
      solid.push(...tpTurn(stall, sx, sz, -a));
    });
    for (const s of [-1, 1]) solid.push(A(tpCy(0.1, 0.12, 3.2, 6), s * 2.4, 1.6, 3.6, '#8a6a4e'));
    solid.push(A(tpBx(5.2, 0.6, 0.15), 0, 3.0, 3.6, '#e2766b'));
    for (let a = -1.9; a <= 1.91; a += 0.19) lit.push(A(tpSp(0.13, 6, 5), Math.sin(a) * 2.5, 2.75 - Math.abs(Math.sin(a * 5)) * 0.15, -Math.cos(a) * 2.5 + 0.6, pick(['#ff9ac0', '#ffe29a', '#ffb36b', '#c9b3ff'])));
    for (let i = 0; i < 7; i++) lit.push(A(tpSp(0.14, 6, 5), -2.1 + i * 0.7, 2.62, 3.6, i % 2 ? '#ffe29a' : '#ff9ac0'));
    out.h = 3.4;
  } else if (id === 'mine') {
    solid.push(A(new T3.DodecahedronGeometry(3, 1).scale(1, 0.75, 1), 0, 1.0, -0.8, '#9a93b8'), A(new T3.DodecahedronGeometry(1.6, 0), 2.2, 0.8, -2, '#8a84a8'), A(new T3.DodecahedronGeometry(1.1, 0), -2.3, 0.5, -1.4, '#a9a3c2'));
    solid.push(A(tpBx(1.8, 2, 0.6), 0, 1, 1.8, '#2a2440'), A(tpBx(2.6, 0.35, 0.4), 0, 2.45, 2.1, '#9a6f4e'));
    for (const s of [-1, 1]) solid.push(A(tpBx(0.3, 2.4, 0.3), s * 1.05, 1.2, 2.1, '#8a6a4e'), A(tpBx(0.08, 0.06, 3.6), s * 0.4, 0.05, 3.9, '#5a5470'));
    for (let i = 0; i < 6; i++) solid.push(A(tpBx(1.2, 0.06, 0.2), 0, 0.03, 2.4 + i * 0.6, '#8a6a4e'));
    solid.push(A(tpBx(1, 0.6, 1.3), 0, 0.55, 4.6, '#c98a3a'));
    for (const sx of [-0.52, 0.52]) for (const sz of [-0.4, 0.4]) solid.push(A(tpCy(0.18, 0.18, 0.1, 10), sx, 0.2, 4.6 + sz, '#3a3f66', { rz: Math.PI / 2 }));
    ['#7fb8ff', '#ff9ad8', '#9fe3c4', '#ffd36b', '#b39bff'].forEach((c, i) => lit.push(A(new T3.OctahedronGeometry(0.22, 0), -0.3 + (i % 3) * 0.3, 0.95 + (i > 2 ? 0.15 : 0), 4.4 + (i % 2) * 0.4, c)));
    lit.push(A(tpSp(0.18), 0, 2.15, 2.35, '#ffd9a0'));
    out.h = 3.6;
  } else if (id === 'aquarium') {
    solid.push(A(tpCy(4, 4.2, 0.8, 24), 0, 0.4, 0, '#fffaf2'), A(new T3.SphereGeometry(3.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.8, 0, '#8fd8e8'), A(tpCy(3.62, 3.62, 0.18, 24), 0, 1.7, 0, '#5fb8d8'));
    solid.push(A(tpBx(1.9, 2.3, 1.6), 0, 1.95, 3.4, '#fffaf2'), A(tpBx(1.1, 1.6, 0.1), 0, 1.6, 4.21, '#3d6f9a'), A(tpCy(0.1, 0.1, 0.9, 6), 0, 4.8, 0, '#5a5470'));
    solid.push(A(tpSp(0.9, 12, 8).scale(1.4, 0.8, 0.5), 0, 5.6, 0, '#ff9a4a'), A(tpCo(0.6, 0.9, 4), 1.6, 5.6, 0, '#ff9a4a', { rz: Math.PI / 2 }), A(tpSp(0.12), -0.8, 5.8, 0.35, '#3a3f66'));
    for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.28; lit.push(A(tpSp(0.16, 6, 5), Math.cos(a) * 3.3, 1.2 + (i % 3) * 0.7, Math.sin(a) * 3.3, ['#9fe3ff', '#ffb3e6', '#ffe98a'][i % 3])); }
    lit.push(A(tpSp(0.2), -1.1, 2.7, 4.25, '#fff4c4'), A(tpSp(0.2), 1.1, 2.7, 4.25, '#fff4c4'));
    out.h = 6.5;
  } else if (id === 'coaster') {
    const N = 56;
    for (let i = 0; i < N; i++) {
      const [x0, y0, z0] = tpTrack(i / N), [x1, y1, z1] = tpTrack((i + 1) / N), dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, hz = Math.hypot(dx, dz), len = Math.hypot(hz, dy);
      const pitch = -Math.atan2(dy, hz), ry = Math.atan2(dx, dz), mx = (x0 + x1) / 2, my = (y0 + y1) / 2, mz = (z0 + z1) / 2, c = Math.cos(ry), sn = Math.sin(ry);
      solid.push(A(tpBx(1.0, 0.18, len + 0.06).rotateX(pitch), mx, my, mz, i % 2 ? '#ff6f9f' : '#ff8fb6', { ry }));
      for (const side of [-0.48, 0.48]) solid.push(A(tpBx(0.12, 0.16, len + 0.06).rotateX(pitch), mx + side * c, my + 0.14, mz - side * sn, '#fffaf2', { ry }));
      if (i % 3 === 0) solid.push(A(tpCy(0.13, 0.17, y0, 6), x0, y0 / 2, z0, '#fff4dc'), A(tpBx(0.9, 0.12, 0.12), x0, y0 * 0.45, z0, '#ffd36b', { ry }));
    }
    solid.push(A(new T3.TorusGeometry(1.9, 0.24, 8, 32), 0, 2.4, 0, '#9fd3ff'));
    for (const s of [-1, 1]) solid.push(A(tpCy(0.1, 0.12, 2.3, 6), s * 0.9, 0.6, 0, '#fff4dc', { rz: s * 0.4 }));
    solid.push(A(tpBx(2.2, 0.3, 3), 5.9, 2.3, 0, '#c9b3ff'), A(tpBx(2.4, 0.2, 3.2), 5.9, 4.4, 0, '#ffd36b'));
    for (const sx of [5, 6.8]) for (const sz of [-1.3, 1.3]) solid.push(A(tpCy(0.14, 0.14, 4.4, 6), sx, 2.2, sz, '#fff4dc'));
    solid.push(A(tpBx(0.9, 2.2, 0.9), 6.6, 1.1, 1.0, '#c9b3ff'));
    for (let i = 0; i < 12; i++) { const [x, y, z] = tpTrack(i / 12); lit.push(A(tpSp(0.12, 6, 5), x, y + 0.25, z, ['#ffe29a', '#ff9ac0', '#9fd3ff'][i % 3])); }
    out.h = 5.6;
  } else if (id === 'palace') {
    solid.push(A(tpBx(8.4, 0.5, 7.4), 0, 0.25, 0, '#e8e2f0'), A(tpBx(6, 4, 4.6), 0, 2.5, -0.4, '#ffd6e6'), A(tpBx(6.2, 0.4, 4.8), 0, 4.7, -0.4, '#f4ecdc'));
    for (let i = 0; i < 7; i++) solid.push(A(tpBx(0.45, 0.5, 0.45), -2.7 + i * 0.9, 5.15, 1.75, '#f4ecdc'));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * 3.2, z = -0.4 + sz * 2.4;
      solid.push(A(tpCy(0.95, 1.05, 6, 12), x, 3.5, z, '#fff0f6'), A(tpCo(1.3, 2, 12), x, 7.5, z, '#b39bff'), A(tpBx(0.05, 0.9, 0.05), x, 8.9, z, '#5a5470'), A(tpBx(0.6, 0.35, 0.05), x + 0.3, 9.15, z, '#ffd36b'));
    }
    solid.push(A(tpCy(1.3, 1.4, 8, 14), 0, 4.5, -0.9, '#fff0f6'), A(tpCo(1.8, 3, 14), 0, 10, -0.9, '#9f86f0'), A(tpSp(0.25), 0, 11.6, -0.9, '#ffd36b'));
    solid.push(A(tpBx(1.6, 2.4, 0.12), 0, 1.7, 1.92, '#8a5a8a'), A(tpBx(3, 0.25, 1.2), 0, 0.55, 2.6, '#e8e2f0'));
    for (const x of [-2.1, -1.1, 1.1, 2.1]) lit.push(A(tpBx(0.5, 0.7, 0.06), x, 3.2, 1.9, '#fff4c4'));
    for (const sx of [-1, 1]) lit.push(A(tpBx(0.3, 0.6, 0.06), sx * 3.2, 5, -0.4 + 2.4 + 1.02, '#fff4c4'));
    out.h = 12;
  } else if (id === 'rocket') {
    solid.push(A(tpCy(3.8, 4, 0.5, 24), 0, 0.25, 0, '#a9a3c2'), A(new T3.TorusGeometry(3.2, 0.12, 4, 32), 0, 0.5, 0, '#ffd36b', { rx: Math.PI / 2 }));
    for (const sx of [1.6, 2.6]) for (const sz of [-0.5, 0.5]) solid.push(A(tpBx(0.16, 9, 0.16), sx, 4.5, sz, '#ff8a3d'));
    for (let y = 1.5; y < 9; y += 1.5) for (const sz of [-0.5, 0.5]) solid.push(A(tpBx(1.1, 0.1, 0.1), 2.1, y, sz, '#ff8a3d'));
    solid.push(A(tpBx(1.4, 0.15, 0.4), 1.2, 7, 0, '#5a5470'));
    lit.push(A(tpSp(0.18), 2.6, 9.1, 0.5, '#ff6f5e'), A(tpSp(0.18), 1.6, 9.1, -0.5, '#ff6f5e'));
    const r = [A(tpCy(0.4, 0.7, 0.8, 12), 0, 0.9, 0, '#5a5470'), A(tpCy(0.9, 0.9, 6, 16), 0, 4.3, 0, '#fbf8f4'), A(tpCo(0.9, 2, 16), 0, 8.3, 0, '#ff6f6f'), A(tpCy(0.92, 0.92, 0.3, 16), 0, 5.4, 0, '#ff6f6f'), A(tpCy(0.35, 0.35, 0.1, 14), 0, 6.3, 0.9, '#7fb8ff', { rx: Math.PI / 2 })];
    for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.28 + 0.785; r.push(A(tpBx(0.12, 1.5, 0.9), Math.sin(a) * 1.15, 1.9, Math.cos(a) * 1.15, '#ff6f6f', { ry: a })); }
    out.rocket = r; out.h = 9.5;
  }
  return out;
}
function tpBuild3D() {
  if (MODE !== 'host' || typeof scene === 'undefined' || !scene) return;
  if (!tpGroup) { tpGroup = new T3.Group(); scene.add(tpGroup); }
  if (gfxOn() && meadowGroup) setTimeout(gfxMeadow, 0);
  for (const o of Object.values(tpObj)) { o.g.traverse((m) => { const i = tappables.indexOf(m); if (i >= 0) tappables.splice(i, 1); }); tpGroup.remove(o.g); disposeTree(o.g); }
  tpObj = {};
  for (const id of TP_ORDER) {
    const S = tpState(id); if (!S || S.x == null || !['build', 'ready', 'open'].includes(S.stage)) continue;
    const P = TP[id], md = tpModel(id), g = new T3.Group(); g.position.set(S.x, 0, S.z); g.rotation.y = S.rot || 0;
    const O = tpObj[id] = { g, shown: S.stage === 'build' ? S.progress : 1, h: md.h };
    O.model = slMerged(md.solid, 'tp'); g.add(O.model);
    if (md.lit.length) { O.lit = mesh(mergeGeos(md.lit), tpGlow(), 0, 0, 0, false); g.add(O.lit); }
    if (md.rocket) { O.rocket = slMerged(md.rocket, 'tp'); g.add(O.rocket); O.rocket.visible = !S.away; }
    if (id === 'lighthouse') {
      const bm = new T3.MeshBasicMaterial({ color: 0xfff6c4, transparent: true, opacity: 0.09, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide });
      const beam = new T3.Group(); beam.position.y = md.lamp;
      for (const r of [0, Math.PI]) { const c = new T3.Mesh(new T3.ConeGeometry(1.8, 22, 16, 1, true).translate(0, -11, 0).rotateX(-Math.PI / 2), bm); c.rotation.y = r; beam.add(c); }
      O.beam = beam; g.add(beam);
    }
    if (id === 'coaster') { O.car = slMerged([tpAt(tpBx(0.7, 0.45, 0.8), 0, 0.3, 0, '#ffd36b'), tpAt(tpBx(0.7, 0.45, 0.8), 0, 0.3, -0.9, '#9fd3ff'), tpAt(tpBx(0.7, 0.45, 0.8), 0, 0.3, -1.8, '#ff8fb6')], 'tp'); g.add(O.car); }
    if (S.stage === 'build') {
      const R = P.size + 1.6, fence = [];
      for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; if (Math.abs(Math.sin(a / 2)) < 0.08) continue; fence.push({ geo: tpBx(Math.PI * 2 * R / 40 + 0.05, 1.6, 0.1), x: Math.sin(a) * R, y: 0.8, z: Math.cos(a) * R, ry: a + Math.PI / 2, color: i % 2 ? '#fbf1e2' : '#ffc4d6' }); }
      O.fence = slMerged(fence, 'tp'); g.add(O.fence);
      O.scaf = slScaffold([[0, 0, P.size * 1.7, P.size * 1.7, Math.min(md.h, 11)]]); g.add(O.scaf);
      if (P.size >= 4) { O.crane = slCrane(-P.size - 1, -P.size - 1, md.h + 4, rand() * 6); g.add(O.crane); }
    }
    g.traverse((m) => { if (m.isMesh) { m.userData.tap = { kind: 'tproj', id }; tappables.push(m); } });
    tpGroup.add(g); tpShowParts(id);
  }
}
function tpShowParts(id) {
  const O = tpObj[id], S = tpState(id); if (!O || !S) return;
  const open = S.stage !== 'build', k = open ? 1 : clamp(O.shown, 0, 1);
  O.model.scale.y = Math.max(0.02, k);
  if (O.lit) O.lit.visible = open;
  if (O.car) O.car.visible = open;
  if (O.beam) O.beam.visible = open && isNight();
  if (O.rocket) { O.rocket.scale.y = Math.max(0.02, k); if (!O.launchAt) { O.rocket.visible = !S.away; O.rocket.position.y = 0; } }
}
function tpFrame(dt) {
  if (MODE !== 'host' || !W || !W.tp) return;
  // crew on site moves the build along in game time
  const clock = W.day + W.t, dG = tpClock == null ? 0 : clamp(clock - tpClock, 0, 0.05); tpClock = clock;
  for (const id of TP_ORDER) {
    const S = W.tp[id]; if (!S) continue;
    if (S.stage === 'build' && dG > 0) {
      const on = tpCrew(id).filter((p) => p.task?.kind === 'tpbuild' && p.task.id === id && p.task.phase === 'do').length;
      const wx = W.weather === 'storm' ? 0 : W.weather === 'rain' || W.weather === 'snow' ? 0.6 : 1;
      if (on) tpAdvance(id, dG * on * tpRate(id) * wx);
    }
    const O = tpObj[id]; if (!O) continue;
    if (S.stage === 'build' && Math.abs(S.progress - O.shown) > 0.0005) { O.shown += Math.sign(S.progress - O.shown) * Math.min(Math.abs(S.progress - O.shown), dt * 0.2); tpShowParts(id); }
    if (O.crane) { const u = O.crane.userData; u.jib.rotation.y = u.ry + Math.sin(now * 0.25 + u.ph) * 0.9; }
    if (O.beam) { O.beam.visible = S.stage === 'open' && isNight(); if (O.beam.visible) O.beam.rotation.y += dt * 0.7; }
    if (O.car && O.car.visible) { const u = (now * 0.07) % 1, [x, y, z] = tpTrack(u), [x2, y2, z2] = tpTrack((u + 0.01) % 1); O.car.position.set(x, y + 0.06, z); O.car.rotation.set(0, Math.atan2(x2 - x, z2 - z), 0); O.car.rotateX(-Math.atan2(y2 - y, Math.hypot(x2 - x, z2 - z))); }
    if (O.rocket && O.launchAt) {
      const t = now - O.launchAt;
      if (t > 9) { O.launchAt = 0; O.rocket.visible = false; O.rocket.position.y = 0; }
      else if (t > 0) { O.rocket.visible = true; O.rocket.position.y = t * t * 1.4; if (rand() < 0.6) spawnBurst(S.x + (rand() - 0.5), O.rocket.position.y + 0.5, S.z + (rand() - 0.5), t < 1.5 ? ['#ffffff', '#e8e2f0'] : ['#ffb347', '#ffd36b', '#ffffff'], 6, 1.4, 0.4); }
    }
  }
}
