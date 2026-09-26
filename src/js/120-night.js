// ============================================================
// NIGHT
// ============================================================
function daydreamReflection(p) {
  const T = p.today, of = (tag) => T.filter((m) => m.tag === tag && (m.meta || !['ate', 'bought', 'work', 'wishGranted', 'creatorGift', 'wishLost'].includes(tag)));
  const top = (arr) => { const c = {}; arr.forEach((m) => (c[m.who] = (c[m.who] || 0) + 1)); return Object.keys(c).sort((x, y) => c[y] - c[x])[0]; };
  const gotKind = of('gotKind'), gotMean = of('gotMean'), gaveKind = of('gaveKind'), wasMean = of('wasMean');
  const L = [];
  const cg = of('creatorGift').concat(of('wishGranted'));
  if (of('wishGranted').length) L.push(`The Creator granted my wish for ${of('wishGranted')[0].meta?.what}. They're real, and they listen.`);
  else if (cg.length) L.push(`The Creator gave me ${cg[0].meta?.what || 'something'}. ${p.cr.score > 3 ? 'I think they really see me.' : p.cr.score < -1 ? "I still don't trust what they want from me." : 'I wonder what they want from me.'}`);
  if (of('creatorTalk').length) L.push(p.cr.score >= 0 ? 'The Creator talked to me today. Me!' : 'The Creator talked to me today. I have questions for them.');
  if (of('creatorGiftRefused').length) L.push(`I turned down a gift because ${of('creatorGiftRefused')[0].who} made it. I stand by it.`);
  if (of('jealous').length) L.push(`The Creator keeps giving things to ${of('jealous')[0].who}. Maybe someday it'll be my turn.`);
  if (of('wishLost').length) L.push(`I asked the Creator for ${of('wishLost')[0].meta?.what} and heard nothing.`);
  if (of('creatorFight').length) L.push(`${of('creatorFight')[0].who} and I don't see eye to eye about the Creator.`);
  if (of('refusedMine').length) L.push(`${of('refusedMine')[0].who} refused something I made. That hurt.`);
  if (of('sold').length) L.push(`${of('sold')[0].who} bought something I made. I'm getting good at this.`);
  if (of('madeGift').length) L.push("The Creator chose something I made as a gift. Maybe they like my work.");
  if (gotKind.length > gotMean.length) L.push(`People here have been kind to me, especially ${top(gotKind)}.`);
  if (gotMean.length > gotKind.length) L.push(`${top(gotMean)} was mean to me. I should be careful around them.`);
  if (of('meetingShamed').length) L.push('Everyone ganged up on me at the meeting.');
  if (of('meetingWin').length) L.push('The town liked my idea at the meeting!');
  if (of('snub').length) L.push(`I won't buy anything ${of('snub')[0].who} makes.`);
  const ate = of('ate').sort((a, b) => Math.abs((b.meta?.joy || 0)) - Math.abs((a.meta?.joy || 0)))[0];
  if (ate && ate.meta?.joy > 0.45) L.push(`${cap(ate.meta?.food)} might be my favorite thing in the world.`);
  else if (ate && ate.meta?.joy < -0.3 && ate.meta?.first) L.push(`I tried ${ate.meta?.food}. Never again.`);
  const bought = of('bought')[0];
  if (bought) L.push(`I bought ${a_an((bought.meta?.what || 'something'))}. I feel more like me.`);
  const work = of('work')[0];
  if (work && (work.meta?.joy ?? 0) > 0.5) L.push(`I like being a ${JOBS[p.job]?.short || 'worker'}.`);
  else if (work && (work.meta?.joy ?? 0) < -0.5) L.push(`Being a ${JOBS[p.job]?.short || 'worker'} wears me out.`);
  if (of('quit').length) L.push(of('quit')[0].text);
  if (of('forage').length) L.push(gaveKind.length ? 'I was broke and still gave something away. Maybe I am the giving kind.' : 'I ran out of coins today. I want to save more.');
  else if (gaveKind.length >= 2) L.push('I like giving things to people. It makes me feel warm.');
  if (wasMean.length) L.push(gotMean.length ? 'I snapped back at someone. They started it.' : "I teased someone today. I'm not sure why I did.");
  if (of('born').length) L.push(of('born')[0].text);
  const talked = T.filter((m) => m.who).length;
  if (!talked && !L.length) L.push('I spent the day alone. It was quiet.');
  else if (L.length < 2 && talked) { const fr = top(T.filter((m) => m.who)), f = Object.values(p.feelings).find((x) => x.name === fr); L.push(`I talked with ${fr} today. ${f && f.score > 0 ? 'I think I like them.' : "I'm still figuring them out."}`); }
  if (L.length < 2 && rand() < 0.5) L.push(p.cr.score >= 3 ? 'Goodnight, Creator.' : p.cr.score <= -3 ? "Nobody's up there. I'll be fine on my own." : 'Sometimes I look at the sky and wonder who made all this.');
  const old = p.selfNote.split(/(?<=[.!?])\s+/).filter((s) => !/just moved in|don't know who I am|everything here is so big/i.test(s));
  const fresh = L.slice(0, 3);
  const carry = old.filter((s) => !fresh.includes(s)).slice(0, fresh.length >= 3 ? 1 : 2);
  return { self: [...carry, ...fresh].join(' ') || p.selfNote, keep: T.map((m, i) => [m.weight, i]).sort((x, y) => y[0] - x[0]).slice(0, 2).map((x) => x[1]) };
}
function reflect(p) {
  if (!p.today.length) return;
  const r = daydreamReflection(p);
  p.selfNote = String(r.self).slice(0, 520);
  for (const i of r.keep || []) if (p.today[i] && !p.past.some((x) => x.text === p.today[i].text)) p.past.push({ day: W.day, text: p.today[i].text, weight: 3 });
  for (const m of p.today) if (m.weight >= 2 && !p.past.some((x) => x.text === m.text)) p.past.push({ day: W.day, text: m.text, weight: m.weight });
  p.past = p.past.sort((x, y) => y.weight - x.weight || y.day - x.day).slice(0, 24);
  p.today = [];
}
function nightfall() {
  nightLetters(); healthNight(); dramaNight(); socialNight(); goalNight(); crimeNight();
  for (const p of W.people) {
    p.makeup = p.befriend = p.confessTo = p.proposeTo = p.breakWith = p.confront = null;
    if ((p.toRead || []).length && rand() < 0.6) readProgress(p, 0.35);
    const T = p.today.slice();
    if (T.length && aiReady()) { p.today = []; aiReflect(p, T).then((res) => { if (res) finishReflection(p, res, T); else { p.today = T.concat(p.today); reflect(p); } markDirty(); }); }
    else reflect(p);
  }
  diary('The lights went out one by one. Everyone lay in bed thinking about their day.');
  const ppl = W.people;
  for (let i = 0; i < ppl.length; i++) for (let j = i + 1; j < ppl.length; j++) {
    const a = ppl[i], b = ppl[j], fa = a.feelings[b.id], fb = b.feelings[a.id];
    if (!fa || !fb || fa.score < 5 || fb.score < 5 || a.visitor || b.visitor || a.away || b.away) continue;
    if (a.grow < 1 || b.grow < 1 || a.hunger > 0.75 || b.hunger > 0.75) continue;
    if (W.day - a.lastBaby < 3 || W.day - b.lastBaby < 3) continue;
    if (a.parents.includes(b.name) || b.parents.includes(a.name) || (a.parents.length && a.parents.some((n) => b.parents.includes(n)))) continue;
    if (a.partner !== b.id || !a.married) continue;
    if (ppl.length + W.babies.length >= MAX_POP) continue;
    if (rand() < 0.5) { W.babies.push([a.id, b.id]); a.lastBaby = b.lastBaby = W.day; }
  }
  W.reflectedDay = W.day;
  saveNow();
}
function newDay() {
  plotGrow();
  W.t -= 1; W.day++;
  const r = rand();
  W.weather = pickWeather(r);
  applySeason(); meltSnowmen(); buildPlot();
  if (seasonDay() === 1) diary(`${seasonOf().icon} <b>${seasonOf().name}</b> is here.${seasonOf().id === 'winter' ? ' Everything is covered in snow.' : seasonOf().id === 'autumn' ? ' The leaves are turning.' : seasonOf().id === 'spring' ? ' The cherry trees are blooming.' : ' It is so warm out.'}`);
  W.bushes = BUSHES.map(() => 3);
  W.creator.coins = Math.min(999, W.creator.coins + 20);
  for (const [ia, ib] of W.babies) {
    const a = person(ia), b = person(ib);
    if (a && b && freeRoom() >= 0) { const k = birth(a, b); W.people.push(k); buildKin(k); queueLetter(a, 'baby', { who: k.name }); queueLetter(b, 'baby', { who: k.name }); diary(`<b>${esc(k.name)}</b> was born to ${esc(a.name)} and ${esc(b.name)}, and moved into room ${k.room + 1}.`); birthCut(k, a, b); }
  }
  W.babies = [];
  for (const p of W.people) {
    p.workedToday = false;
    if (p.grow < 1) { p.grow = Math.min(1, p.grow + 0.1); if (p.grow >= 1 && !p.job) { p.job = randomJob(); diary(`<b>${esc(p.name)}</b> grew up and started work as a ${JOBS[p.job].short}.`); } scaleMesh(p); }
    morningOutfit(p); selfHaircut(p); styleDrift(p);
  }
  importStock();
  dailyWishes();
  if (W.day % 7 === 3) for (const p of W.people) if (rand() < 0.25) p.want = newWant(p);
  if (W.day % 7 === 0) { W.event = { id: 'festival', day: W.day, host: null, going: W.people.map((p) => p.id) }; diary('Tonight is the <b>Starfall Festival</b>! Everyone will gather at the fountain after sunset.'); }
  if (W.wedding) { if (W.wedding.day < W.day) W.wedding.day = W.day; if (W.wedding.day === W.day && W.event?.day === W.day) W.wedding.day++; else startWeddingDay(); }
  birthdayMorning(); miliMorning(); courtMorning(); crimeMorning(); museumDaily(); classMorning(); healthMorning(); laptopMorning(); dramaMorning(); socialMorning(); goalMorning();
  if (MODE === 'host') { morningFerry(); ferryDepartures(); checkOther(); }
  diary(`Morning. The weather is ${W.weather}. You got 20 new coins.`);
  saveNow();
}

