// ============================================================
// CREATOR COINS: no ceiling, a morning allowance that grows with the town, town goals that pay out
// ============================================================
// Coins used to stop at 999 every morning, which put every landmark over 1000, most of the
// land and all of Starline out of reach. Now they only stop at a number nobody will hit.
const COIN_MAX = 99999999;
function creatorEarn(n) {
  const C = W.creator, v = Math.floor(Number(n) || 0);
  C.coins = clamp(Math.floor(C.coins || 0) + v, 0, COIN_MAX);
  return C.coins;
}
const coinText = (n) => Math.floor(n || 0).toLocaleString('en-US');
// grows with the town: people, landmarks, land, Starline and the big projects
function allowanceParts() {
  const res = W.people.filter((p) => !p.visitor).length, big = (W.placed || []).filter((pl) => BUILDS[pl.type]?.big).length, land = (W.lobes || []).length;
  return { base: 60, people: res * 6, landmarks: big * 20, land: land * 15, starline: cityStage() === 'open' ? 80 : 0, projects: tpOpenCount() * 25 };
}
function morningAllowance() { return Object.values(allowanceParts()).reduce((a, b) => a + b, 0); }
function allowanceText() {
  const A = allowanceParts(), bits = [`${A.base} to start`];
  if (A.people) bits.push(`${A.people} for your residents`);
  if (A.landmarks) bits.push(`${A.landmarks} for landmarks`);
  if (A.land) bits.push(`${A.land} for land`);
  if (A.starline) bits.push(`${A.starline} for Starline`);
  if (A.projects) bits.push(`${A.projects} for big projects`);
  return `You get ${coinText(morningAllowance())} every morning (${bits.join(', ')}). It grows as the town does.`;
}
// coins owed for the mornings the old cap swallowed, paid once
function coinsBoot() {
  W.added = W.added || {}; if (W.added.coinCap) return; W.added.coinCap = true;
  const back = W.day > 3 ? clamp(W.day * 40, 500, 6000) : 0;
  if (back) creatorEarn(back);
  if (typeof logUpdate === 'function') logUpdate('build', `Your coins don't stop at 999 anymore. The morning allowance grows with the town now (${coinText(morningAllowance())} a day here), golden stars pay a lot more, and there are town goals that pay out and eight big projects to build in the Build tab: a bank, a lighthouse, a night market, a gem mine, an aquarium, a roller coaster, a palace and a rocket.${back ? ` I also paid back ${coinText(back)} coins for the mornings the old limit ate.` : ''}`, 'no more coin limit');
}

// ---------- town goals: checked every few seconds, paid out once ----------
const lobeCount = () => (W.lobes || []).length;
const bigCount = () => new Set((W.placed || []).filter((pl) => BUILDS[pl.type]?.big).map((pl) => pl.type)).size;
const decorCount = () => (W.placed || []).filter((pl) => BUILDS[pl.type] && !BUILDS[pl.type].big).length;
const residentsNow = () => W.people.filter((p) => !p.visitor).length;
const bornHere = () => W.people.filter((p) => (p.parents || []).length).length;
const recordCount = (k) => (W.records || []).filter((r) => r.kind === k).length;
const TOWN_GOALS = [
  { id: 'pop8', icon: '🏡', text: '8 residents', need: 8, have: residentsNow, pay: 300 },
  { id: 'pop12', icon: '🏡', text: '12 residents', need: 12, have: residentsNow, pay: 700 },
  { id: 'pop16', icon: '🏘', text: '16 residents', need: 16, have: residentsNow, pay: 1200 },
  { id: 'pop21', icon: '🏙', text: '21 residents', need: 21, have: residentsNow, pay: 2000 },
  { id: 'pop25', icon: '🌆', text: 'A full town: 25 residents', need: 25, have: residentsNow, pay: 4000 },
  { id: 'decor5', icon: '🌷', text: 'Place 5 decorations', need: 5, have: decorCount, pay: 150 },
  { id: 'decor15', icon: '🌷', text: 'Place 15 decorations', need: 15, have: decorCount, pay: 500 },
  { id: 'decor30', icon: '🎡', text: 'Place 30 decorations', need: 30, have: decorCount, pay: 1200 },
  { id: 'big1', icon: '🎠', text: 'Build your first landmark', need: 1, have: bigCount, pay: 400 },
  { id: 'big3', icon: '🏛', text: 'Build 3 landmarks', need: 3, have: bigCount, pay: 1500 },
  { id: 'big6', icon: '🎡', text: 'Build all 6 landmarks', need: 6, have: bigCount, pay: 5000 },
  { id: 'land1', icon: '🌱', text: 'Raise new land', need: 1, have: lobeCount, pay: 300 },
  { id: 'land3', icon: '⛰', text: 'Raise 3 pieces of land', need: 3, have: lobeCount, pay: 1200 },
  { id: 'land6', icon: '🌌', text: 'Raise all 6 pieces of land', need: 6, have: lobeCount, pay: 5000 },
  { id: 'starlinePaid', icon: '📐', text: 'Pay for Starline', need: 1, have: () => (['build', 'ready', 'open'].includes(cityStage()) ? 1 : 0), pay: 1500 },
  { id: 'starlineOpen', icon: '🌃', text: 'Open Starline', need: 1, have: () => (cityStage() === 'open' ? 1 : 0), pay: 3000 },
  { id: 'proj1', icon: '🏗', text: 'Finish a big project', need: 1, have: () => tpOpenCount(), pay: 800 },
  { id: 'proj4', icon: '🏗', text: 'Finish 4 big projects', need: 4, have: () => tpOpenCount(), pay: 4000 },
  { id: 'proj8', icon: '🚀', text: 'Finish every big project', need: 8, have: () => tpOpenCount(), pay: 20000 },
  { id: 'stars50', icon: '⭐', text: 'Catch 50 sparkles', need: 50, have: () => W.shinesFound || 0, pay: 400 },
  { id: 'stars250', icon: '🌟', text: 'Catch 250 sparkles', need: 250, have: () => W.shinesFound || 0, pay: 2000 },
  { id: 'museum10', icon: '🏺', text: '10 museum exhibits', need: 10, have: () => (W.museum || []).length, pay: 1000 },
  { id: 'wedding', icon: '💒', text: 'A wedding in town', need: 1, have: () => recordCount('married'), pay: 600 },
  { id: 'baby', icon: '🍼', text: 'A baby born in town', need: 1, have: bornHere, pay: 600 },
  { id: 'year1', icon: '🎂', text: 'Reach day 28 (one year)', need: 28, have: () => W.day, pay: 1500 },
  { id: 'year4', icon: '🎉', text: 'Reach day 112 (four years)', need: 112, have: () => W.day, pay: 6000 },
];
let nextGoalCheck = 0;
function goalsCheck() {
  if (MODE !== 'host' || !W) return;
  W.goals = W.goals || {};
  for (const G of TOWN_GOALS) {
    if (W.goals[G.id] != null) continue;
    let v = 0; try { v = G.have(); } catch (e) { continue; }
    if (v < G.need) continue;
    W.goals[G.id] = W.day; creatorEarn(G.pay);
    diary(`🏆 Town goal reached: <b>${esc(G.text)}</b>. The <span class="cr">Creator</span> got ${coinText(G.pay)} coins.`);
    if (typeof offlineSim === 'undefined' || !offlineSim) { toast(`🏆 ${G.text}! +${coinText(G.pay)} ✦`); Sound.levelup?.(); }
    markDirty();
  }
}
function goalsFrame() { if (now < nextGoalCheck) return; nextGoalCheck = now + 4; goalsCheck(); }
function goalsHtml() {
  const got = W.goals || {}, done = TOWN_GOALS.filter((G) => got[G.id] != null), open = TOWN_GOALS.filter((G) => got[G.id] == null);
  const val = (G) => { try { return G.have(); } catch (e) { return 0; } };
  const next = open.map((G) => ({ G, k: Math.min(1, val(G) / G.need) })).sort((a, b) => b.k - a.k).slice(0, 6);
  return `<p class="label">Town goals</p><p class="hint">Each one pays out once. ${done.length} of ${TOWN_GOALS.length} done.</p>
    <div class="items">${next.map(({ G, k }) => `<div class="item"><div class="item-top"><span class="item-name">${G.icon} ${esc(G.text)}</span></div><div class="meter"><i style="width:${Math.round(k * 100)}%;background:var(--gold)"></i></div><span class="item-by">${coinText(Math.min(val(G), G.need))} of ${coinText(G.need)} · pays ${coinText(G.pay)} ✦</span></div>`).join('')}</div>
    ${done.length ? `<div class="chips">${done.map((G) => `<span class="chip good">${G.icon} ${esc(G.text)}</span>`).join('')}</div>` : ''}`;
}
