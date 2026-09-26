// ============================================================
// SCENES AROUND TOWN: murders found at dawn, arrests, funerals,
// weddings, engagements, babies, and the props left behind
// ============================================================
function townStage(S, [cx, cz], cast, opts = {}) {
  if (interior) closeInterior();
  const dir = opts.dir ?? Math.atan2(-cx, -cz || -0.01);
  S.center = [cx, cz]; S.dir = dir;
  const n = cast.length;
  cast.forEach((pid, i) => {
    const p = person(pid); if (!p || jailed(p)) return;
    const spread = n <= 1 ? 0 : (i / (n - 1) - 0.5) * (opts.arc ?? 2.2);
    const r = (opts.r ?? 3) + (i % 2) * 0.9;
    const a = dir + Math.PI + spread, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
    cutPlace(p, x, z, Math.atan2(cx - x, cz - z));
  });
  (opts.marks || []).forEach(([pid, x, z, face]) => { const p = person(pid); if (p && !jailed(p)) cutPlace(p, x, z, face ?? Math.atan2(cx - x, cz - z)); });
  cutCam(cx, 1.2, cz, cx + Math.sin(dir) * 16, 8.5, cz + Math.cos(dir) * 16);
}
const castFrom = (ids, n) => [...new Set(ids.filter((id) => { const p = person(id); return p && !p.away && !jailed(p) && p.grow >= 0.8; }))].slice(0, n);
const onlookers = (excl, n) => W.people.filter((p) => !excl.includes(p.id) && !p.away && !jailed(p) && p.grow >= 0.8 && !p.visitor).sort(() => rand() - 0.5).slice(0, n).map((p) => p.id);

// ---------- a crime is found ----------
function discoverCut(C) {
  const K = CRIME_TYPES[C.type], det = detectiveOf(), V = C.victim && person(C.victim);
  const dec = C.type === 'murder' ? crimeState().deceased.find((d) => d.id === C.victim) : null;
  const finder = pick(W.people.filter((p) => adult(p) && p.id !== C.culprit && p !== det && !jailed(p) && p.id !== C.victim)) || det; C.finder = finder?.id || null;
  const close = C.type === 'murder' ? W.people.filter((p) => (p.feelings[C.victim]?.score || 0) >= 4 && p !== finder && !jailed(p)).sort((a, b) => (b.feelings[C.victim]?.score || 0) - (a.feelings[C.victim]?.score || 0)).slice(0, 2) : V ? [V] : [];
  const cul = person(C.culprit);
  const cast = castFrom([finder?.id, ...close.map((p) => p.id), det?.id, C.culprit, ...onlookers([C.culprit, finder?.id, det?.id, ...close.map((p) => p.id)], 3)], 8);
  const clue = C.clues.find((c) => c.found);
  const L = [];
  if (C.type === 'murder') {
    L.push(nline(`Dawn, day ${W.day}. ${C.where.label.charAt(0).toUpperCase() + C.where.label.slice(1)} was quiet. Too quiet.`, 'dark'));
    if (finder) { L.push(pline(finder.id, `${C.victimName}? Hey… are you okay? …${C.victimName}?`)); L.push(pline(finder.id, 'SOMEBODY! SOMEBODY HELP!', 'scream', { emote: '😱' })); }
    L.push({ who: 'crowd', text: '*gasp*', fx: 'gasp' });
    for (const p of close) L.push(pline(p.id, p.id === dec?.partner ? pick([`No. No no no. ${C.victimName}, wake up. Please wake up.`, `${C.victimName}! We were supposed to have breakfast today…`]) : pick([`Not ${C.victimName}. Not them.`, `This can't be real.`, `Who would do this?!`]), null, { emote: '💧' }));
    if (cul && rand() < 0.6) L.push(pline(cul.id, pick(['How awful.', '…That is terrible. Poor thing.', 'Who could have done this?']), null));
    if (det) { L.push(pline(det.id, 'Everyone, step back. Nobody touch anything.')); L.push(pline(det.id, `It ${C.way.staged}. But look. ${clue ? clue.text : 'Something is off.'} This was no accident.`, 'shock')); }
    L.push(nline(`${C.victimName} was gone. And someone on the island had done it.`));
    if (det) L.push(pline(det.id, 'Whoever did this is standing on this island right now. And I am going to find them.'));
  } else {
    L.push(nline(pick([`Morning, day ${W.day}. Something was wrong.`, 'The island woke up to bad news.'])));
    if (V) L.push(pline(V.id, pick([`My… my things. Someone was in here.`, `Who would DO this to me?`, `I can't believe this. On OUR island?`]), 'shock', { emote: '😱' }));
    else if (finder) L.push(pline(finder.id, pick(['Uh, everyone? You need to see this.', 'Oh no. Oh no no no.', 'Is this for real?']), 'shock'));
    L.push({ who: 'crowd', text: pick(['*murmuring*', 'No way…', 'Who did this?!']), fx: 'gasp' });
    if (det) { L.push(pline(det.id, `Nobody move. ${clue ? `Look. ${clue.text}` : 'There will be clues.'}`)); L.push(pline(det.id, pick(['I will get to the bottom of this.', 'Someone here is lying. I can feel it.', 'Case open. Nobody leaves the island.']))); }
  }
  queueCut({ kind: 'crime', crimeId: C.id, icon: K.icon, title: C.type === 'murder' ? `A Murder in ${ISL.name}` : `${K.label}!`, sub: C.type === 'murder' ? `${C.victimName}, found ${C.way.how}` : C.headline, music: 'mystery', dark: C.type === 'murder', lines: L,
    stage: (S) => townStage(S, [C.where.x, C.where.z], cast, C.where.key === 'pier' ? { r: 2.2, arc: 1.2 } : { r: 2.8 }) });
}
// ---------- an arrest, then straight to trial ----------
function arrestCut(C, by) {
  const A = person(C.accused), K = CRIME_TYPES[C.type]; if (!A) return crimeTrialNow(C);
  const det = by && by.id !== A.id ? by : detectiveOf();
  const cast = castFrom([det?.id, A.id, ...onlookers([A.id, det?.id], 4)], 6);
  const [cx, cz] = A.inside ? TOWN[homeKey(A)].spot : [A.x, A.z];
  const top = C.clues.filter((c) => c.found && fitsClue(C, c).includes(A.id) && !c.clears)[0];
  const L = [];
  if (det) L.push(pline(det.id, `${A.name}. You need to come with me to Glimmer Hall.`));
  L.push(pline(A.id, A.id === C.culprit ? pick(['What? Why? What did I do?', 'You have no proof.', '…I don\'t know what you are talking about.']) : pick(['What?! Me?! I didn\'t do anything!', 'This is insane. I was home!', 'You have the wrong person!']), 'shock', { emote: A.id === C.culprit ? '💧' : '💢' }));
  if (det && top) L.push(pline(det.id, `${top.text} Explain that.`, 'takethat'));
  L.push({ who: 'crowd', text: pick(['No way…', `${A.name}?!`, 'I KNEW it.', '*whispering*']), fx: 'gasp' });
  L.push(nline(`${A.name} was charged with ${K.label.toLowerCase()}. The trial started right away.`));
  queueCut({ kind: 'arrest', crimeId: C.id, icon: '🚨', title: `${A.name} is Arrested`, sub: `Charge: ${K.label}`, music: 'mystery', lines: L,
    stage: (S) => townStage(S, [cx, cz], cast, { r: 2.2 }), onEnd: () => crimeTrialNow(C) });
}
function confessCut(C) {
  const g = person(C.culprit), inn = person(C.convicted); if (!g) return;
  const cast = castFrom([g.id, ...onlookers([g.id], 5)], 6);
  const L = [pline(g.id, 'Everyone. Stop. I have to say something.'), pline(g.id, `${inn ? `${inn.name} didn't do it.` : 'They got it wrong.'} It was me. I ${C.why}.`, 'shock', { emote: '💧' }), { who: 'crowd', text: '*GASP*', fx: 'gasp' }, pline(g.id, 'I can\'t keep pretending. Take me to the Hall.')];
  queueCut({ kind: 'confession', crimeId: C.id, icon: '😶', title: 'A Confession', sub: `${g.name} breaks down at the fountain`, music: 'mystery', lines: L,
    stage: (S) => townStage(S, [0, 6.5], cast, { r: 2.4 }), onEnd: () => { C.confessed = true; C.clues.push({ id: 'cf', found: true, day: W.day, kind: 'confession', icon: '😶', text: `${g.name} confessed in front of everyone at the fountain.`, pid: g.id, genuine: true, strong: true }); reopenWrong(C); } });
}
// ---------- funerals and memorials ----------
function funeralCut(d) {
  const C = d.crime && crimeById(d.crime), det = detectiveOf();
  const close = W.people.filter((p) => (p.feelings[d.id]?.score || 0) >= 3 && !jailed(p)).sort((a, b) => (b.feelings[d.id]?.score || 0) - (a.feelings[d.id]?.score || 0));
  const cast = castFrom([...close.map((p) => p.id), ...onlookers(close.map((p) => p.id), 6)], 9);
  placeMemorial(d);
  const L = [nline(`The whole island came to say goodbye to ${d.name}.`, 'dark')];
  for (const p of close.slice(0, 3)) L.push(pline(p.id, pick([`${d.name} always saved me the good seat by the fountain. I don't know who will now.`, `I keep turning around to tell ${d.name} something.`, `${d.name} made this island better just by being on it.`, `I never told ${d.name} how much they meant to me. I'm telling you now.`]), null, { emote: '💧' }));
  if (C && C.status !== 'closed' && det) L.push(pline(det.id, `I promise you, ${d.name}. Whoever did this will answer for it.`));
  if (C && C.culprit && person(C.culprit) && !jailed(person(C.culprit))) L.push(pline(C.culprit, pick(['…Rest well.', 'Goodbye.', '…']), null));
  L.push(nline(`They left flowers at the new stone by the big tree. It says "${d.name}. Loved here."`, 'light'));
  queueCut({ kind: 'funeral', icon: '🕯', title: `Goodbye, ${d.name}`, sub: `Day ${d.born > 0 ? d.born : 1} to day ${d.died}`, music: 'funeral', lines: L,
    stage: (S) => townStage(S, memorialSpot(d), cast, { r: 3, arc: 2.6 }) });
}
function memorialSpot(d) { const i = crimeState().deceased.indexOf(d); const a = 252 + ((i % 5) - 2) * 9; return polar(a, 18.8 + Math.floor(i / 5) * 1.8); }
function placeMemorial(d) { const S = crimeState(); if (!S.memorials.some((m) => m.id === d.id)) { const [x, z] = memorialSpot(d); S.memorials.push({ id: d.id, name: d.name, x, z, died: d.died, born: d.born }); } crimeProps(); }
function releaseCut(p, why, C) {
  const cast = castFrom([p.id, ...W.people.filter((q) => fscore(q, p) >= 3).map((q) => q.id), ...onlookers([p.id], 2)], 6);
  const [hx, hz] = TOWN.hall.spot;
  const L = why === 'exonerated'
    ? [nline(`The doors of Glimmer Hall opened. ${p.name} walked out, blinking in the light.`), pline(p.id, 'I told everyone. I TOLD everyone it wasn\'t me.', null, { emote: '💧' }), { who: 'crowd', text: pick(['We\'re so sorry.', 'Welcome back.', '…Sorry.']) }, pline(p.id, 'Sorry doesn\'t give me those days back.')]
    : why === 'pardon' ? [nline(`By order of the Creator, ${p.name} was pardoned.`), pline(p.id, pick(['Thank you, Creator. I won\'t waste this.', 'I… I don\'t know what to say.']), 'flash', { emote: '✨' }), { who: 'crowd', text: '*murmuring*' }]
    : [nline(`${p.name} served their time and walked out of Glimmer Hall.`), pline(p.id, C && C.culprit !== p.id ? 'I didn\'t do it. I will say it until someone listens.' : pick(['I\'m going to do better.', 'Don\'t look at me like that. I paid for it.', 'Fresh air. Finally.'])), { who: 'crowd', text: '*whispering*' }];
  queueCut({ kind: 'release', icon: '🔓', title: why === 'exonerated' ? `${p.name} is Innocent` : why === 'pardon' ? 'A Pardon' : `${p.name} is Free`, sub: C ? CRIME_TYPES[C.type].label : '', music: 'trial', lines: L,
    stage: (S) => townStage(S, [hx, hz + 2], cast, { r: 2.4 }) });
}

// ---------- life's big moments ----------
function weddingCut(a, b) {
  const off = W.people.filter((p) => p !== a && p !== b && adult(p) && !jailed(p)).sort((x, y) => fscore(y, a) + fscore(y, b) - fscore(x, a) - fscore(x, b))[0];
  const cast = castFrom([...onlookers([a.id, b.id, off?.id], 7)], 7);
  const vow = (p, q) => (p.today || []).concat(p.past || []).filter((m) => (m.who === q.name || (m.text || '').includes(q.name)) && m.weight >= 2).slice(-1)[0];
  const va = vow(a, b), vb = vow(b, a);
  const L = [nline('Petals everywhere. The fountain sparkled like it knew.')];
  if (off) L.push(pline(off.id, `We're all here because ${a.name} and ${b.name} can't imagine life without each other. Honestly? Same.`));
  L.push(pline(a.id, va ? `${b.name}, I still think about ${va.text.replace(/^I |\.$/g, '').slice(0, 70).toLowerCase()}. I want a whole life of days like that.` : `${b.name}, you make every day on this island brighter. I promise to love you on the rainy ones too.`, null, { emote: '💕' }));
  L.push(pline(b.id, vb ? `${a.name}… you had me at ${vb.text.replace(/^I |\.$/g, '').slice(0, 60).toLowerCase()}. I do. Obviously I do.` : `${a.name}, I promise to share my snacks. Even the good ones. I do.`, null, { emote: '💕' }));
  if (off) L.push(pline(off.id, 'Then by the power of the fountain… you may kiss!', 'hearts'));
  L.push({ who: 'crowd', text: pick(['WOOOO!', '*happy crying*', 'Kiss! Kiss! Kiss!']), fx: 'confetti' });
  queueCut({ kind: 'wedding', icon: '💒', title: `The Wedding of ${a.name} & ${b.name}`, sub: `Day ${W.day}, at the fountain`, music: 'wedding', lines: L,
    stage: (S) => { const z0 = FOUNTAIN_R + 3.2; townStage(S, [0, z0], cast, { r: 3.4, arc: 2.4, dir: Math.PI, marks: [[a.id, -0.75, z0, Math.PI / 2], [b.id, 0.75, z0, -Math.PI / 2], ...(off ? [[off.id, 0, z0 + 1.3, Math.PI]] : [])] }); CUT.focus = { x: 0, z: z0 }; } });
}
function engageCut(a, b, l1, l2) {
  const cast = castFrom(onlookers([a.id, b.id], 4), 4), [cx, cz] = [(a.x + b.x) / 2, (a.z + b.z) / 2];
  const L = [pline(a.id, l1 || `${b.name}… will you marry me?`, null, { emote: '💍' }), pline(b.id, l2 || 'YES!', 'hearts', { emote: '💕' }), { who: 'crowd', text: pick(['AWWW!', '*clapping*', 'Finally!']), fx: 'confetti' }, nline('The wedding is tomorrow, at the fountain.')];
  queueCut({ kind: 'engaged', icon: '💍', title: `${a.name} & ${b.name} are Engaged!`, sub: 'She said yes. Or he did. Or they did. Someone said yes!', music: 'wedding', lines: L,
    stage: (S) => { townStage(S, [cx, cz], cast, { r: 3.2, marks: [[a.id, cx - 0.6, cz, Math.PI / 2], [b.id, cx + 0.6, cz, -Math.PI / 2]] }); CUT.focus = { x: cx, z: cz }; } });
}
function birthCut(k, a, b) {
  const [hx, hz] = TOWN[homeKey(k)].spot, cast = castFrom(onlookers([a.id, b.id, k.id], 4), 4);
  const L = [nline(`A new little face on ${ISL.name}.`), pline(a.id, `Everyone… meet ${k.name}.`, null, { emote: '💕' }), pline(b.id, pick(['Look at their tiny hands!', 'They have your eyes.', 'I am going to cry. I am crying.']), 'hearts', { emote: '💧' }), pline(k.id, pick(['Bwah!', '…Hi?', '*tiny sneeze*'])), { who: 'crowd', text: pick(['Awww!', 'So small!', 'Welcome!']), fx: 'confetti' }];
  queueCut({ kind: 'birth', icon: '🍼', title: `Welcome, ${k.name}!`, sub: `Born to ${a.name} and ${b.name}`, music: 'wedding', lines: L,
    stage: (S) => { townStage(S, [hx, hz + 2], cast, { r: 3, marks: [[a.id, hx - 0.9, hz + 2.2, 0], [b.id, hx + 0.9, hz + 2.2, 0], [k.id, hx, hz + 2.6, 0]] }); CUT.focus = { x: hx, z: hz + 2.5 }; } });
}
function divorceAskCut(a, b, l1, l2) {
  const cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2;
  const L = [nline(`${a.name} and ${b.name} had been quiet for days.`), pline(a.id, l1 || 'I want a divorce.', 'shock', { emote: '💔' }), pline(b.id, l2 || '…Oh.', null, { emote: '💧' }), nline('It is going to Glimmer Hall.')];
  queueCut({ kind: 'divorce', icon: '💔', title: `${a.name} & ${b.name}`, sub: 'A marriage ends', music: 'funeral', dark: true, lines: L,
    stage: (S) => townStage(S, [cx, cz], [], { marks: [[a.id, cx - 0.7, cz, Math.PI / 2], [b.id, cx + 0.7, cz, -Math.PI / 2]] }) });
}

// ---------- props: tape, chalk, evidence markers, graffiti, smoke, memorials ----------
let crimeGroup = null;
function tapeTex() {
  if (TEX.tape) return TEX.tape;
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const g = c.getContext('2d');
  g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 256, 32); g.fillStyle = '#1e1830'; g.font = 'bold 16px sans-serif'; g.textBaseline = 'middle';
  for (let x = 4; x < 256; x += 128) g.fillText('DO NOT CROSS ✦', x, 17);
  const t = new T3.CanvasTexture(c); t.wrapS = T3.RepeatWrapping; TEX.tape = t; return t;
}
function chalkTex() {
  if (TEX.chalk) return TEX.chalk;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.arc(64, 30, 20, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(48, 50); g.bezierCurveTo(30, 60, 36, 88, 50, 92); g.lineTo(44, 118); g.moveTo(80, 50); g.bezierCurveTo(98, 60, 92, 88, 78, 92); g.lineTo(86, 118); g.moveTo(50, 92); g.lineTo(78, 92);
  g.moveTo(46, 56); g.lineTo(18, 74); g.moveTo(82, 56); g.lineTo(110, 50); g.stroke();
  const t = new T3.CanvasTexture(c); TEX.chalk = t; return t;
}
function markerTex(n) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 48; const g = c.getContext('2d');
  g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#1e1830'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 32, 26);
  return new T3.CanvasTexture(c);
}
function graffitiTex(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  const cols = ['#ff4fa3', '#39e0ff', '#b6ff3a', '#ffcf3a', '#b07bff'];
  g.lineJoin = 'round'; g.font = 'bold 56px "Mochiy Pop One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { if ((cur + ' ' + w).length > 14) { lines.push(cur); cur = w; } else cur = (cur ? cur + ' ' : '') + w; } lines.push(cur);
  lines.slice(0, 3).forEach((ln, i) => { const y = 128 + (i - (lines.length - 1) / 2) * 64; g.lineWidth = 14; g.strokeStyle = '#1e1830'; g.strokeText(ln, 256, y); g.fillStyle = cols[i % cols.length]; g.fillText(ln, 256, y); });
  for (let i = 0; i < 18; i++) { g.fillStyle = pick(cols); g.globalAlpha = 0.7; g.beginPath(); g.arc(40 + rand() * 440, 30 + rand() * 200, 2 + rand() * 5, 0, 6.28); g.fill(); }
  return new T3.CanvasTexture(c);
}
function crimeScene(C) { crimeProps(); }
function buildingFrame(key) {
  const b = BLD[key] || DT_BLD[key]; if (!b) return null;
  const main = !!BLD[key], [x, z] = main ? polar(b.a, b.r) : polarDT(b.a, b.r), ang = main ? Math.atan2(-x, -z) : Math.atan2(DT.x - x, DT.z - z);
  return { x, z, ang, W: key === 'cafe' ? 9 : main ? 9.5 : 9 };
}
function crimeProps() {
  if (MODE !== 'host' || !scene) return;
  if (!crimeGroup) { crimeGroup = new T3.Group(); scene.add(crimeGroup); }
  while (crimeGroup.children.length) { const c = crimeGroup.children[0]; crimeGroup.remove(c); disposeTree(c); }
  const S = crimeState();
  for (const C of S.list) {
    const fresh = W.day - (C.discovered || C.day) <= (C.type === 'murder' ? 6 : 3);
    if (!C.discovered || C.tier < 2 || !fresh || C.status === 'closed') continue;
    const g = new T3.Group(); g.position.set(C.where.x, 0, C.where.z);
    const R = 1.9, posts = [[-R, -R], [R, -R], [R, R], [-R, R]], postM = toon('#ffd23f'), tapeM = new T3.MeshBasicMaterial({ map: tapeTex(), side: T3.DoubleSide, transparent: true, toneMapped: false });
    for (const [px, pz] of posts) g.add(mesh(cyl(0.05, 0.06, 1.05, 6), postM, px, 0.52, pz));
    for (let i = 0; i < 4; i++) { const [ax, az] = posts[i], [bx, bz] = posts[(i + 1) % 4]; const t = new T3.Mesh(new T3.PlaneGeometry(2 * R, 0.14), tapeM); t.position.set((ax + bx) / 2, 0.9, (az + bz) / 2); t.rotation.y = Math.atan2(bz - az, bx - ax) * -1; g.add(t); }
    if (C.type === 'murder') { const ch = new T3.Mesh(new T3.PlaneGeometry(1.6, 1.6), new T3.MeshBasicMaterial({ map: chalkTex(), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.85 })); ch.rotation.x = -Math.PI / 2; ch.rotation.z = rand() * 6; ch.position.y = C.where.key === 'pier' ? 0.3 : 0.09; g.add(ch); }
    C.clues.filter((c) => c.found).slice(0, 5).forEach((c, i) => { const a = i * 1.3 + 0.4, m = new T3.Mesh(new T3.ConeGeometry(0.14, 0.26, 3), new T3.MeshBasicMaterial({ map: markerTex(i + 1), toneMapped: false })); m.position.set(Math.cos(a) * 1.1, 0.13 + (C.where.key === 'pier' ? 0.2 : 0), Math.sin(a) * 1.1); g.add(m); });
    g.traverse((o) => { if (o.isMesh) { o.userData.tap = { kind: 'crimescene', id: C.id }; } });
    g.children.forEach((c) => tappables.push(c));
    crimeGroup.add(g);
  }
  // graffiti on a shop wall, smoke over a burned shop
  for (const C of S.list) {
    if (C.type === 'graffiti' && C.shop && W.day - C.day <= 4 && !C.cleaned) { const f = buildingFrame(C.shop); if (f) { const m = new T3.Mesh(new T3.PlaneGeometry(4.2, 2.1), new T3.MeshBasicMaterial({ map: graffitiTex(C.tag || 'HI'), transparent: true, depthWrite: false })); const lx = f.W / 2 + 0.03, lz = 0.5; m.position.set(f.x + lx * Math.cos(f.ang) + lz * Math.sin(f.ang), 2.6, f.z - lx * Math.sin(f.ang) + lz * Math.cos(f.ang)); m.rotation.y = f.ang + Math.PI / 2; crimeGroup.add(m); } }
    if (C.type === 'arson' && C.shop && crimeClosed(C.shop)) { const f = buildingFrame(C.shop); if (f) { const smoke = new T3.Points(new T3.BufferGeometry().setAttribute('position', new T3.Float32BufferAttribute(new Float32Array(40 * 3), 3)), new T3.PointsMaterial({ color: '#6a6470', size: 1.6, map: gfxOn() ? gfxTextures().dot : null, transparent: true, opacity: 0.55, depthWrite: false })); smoke.userData.smoke = { x: f.x, z: f.z, seed: Array.from({ length: 40 }, () => rand()) }; smoke.frustumCulled = false; crimeGroup.add(smoke); const sg = sign('CLOSED · FIRE', '#3a2a2a', '#ffd23f', 3.4); const lz = 4.25; sg.position.set(f.x + lz * Math.sin(f.ang), 1.6, f.z + lz * Math.cos(f.ang)); sg.rotation.y = f.ang; crimeGroup.add(sg); } }
  }
  // memorial stones by the big tree
  for (const m of S.memorials) {
    const g = new T3.Group(); g.position.set(m.x, 0, m.z); g.rotation.y = Math.atan2(-m.x, -m.z);
    if (gfxOn()) g.add(keepShared(prop('memorial', {}))); else { g.add(mesh(box(0.8, 1.1, 0.25), toon('#d9d3e6'), 0, 0.55, 0)); }
    for (let i = 0; i < 5; i++) g.add(mesh(sph(0.1, 8, 6), toon(['#ff9ec7', '#ffffff', '#ffd23f', '#b98cff', '#ff7a8a'][i]), -0.4 + i * 0.2, 0.1, 0.35, false));
    const candle = mesh(cyl(0.05, 0.05, 0.2, 8), toon('#fff4dc'), 0.45, 0.1, 0.25); g.add(candle);
    const fl = gfxOn() ? glowSprite('#ffc47a', 0.6, 0.9) : mesh(sph(0.04, 6, 5), toon('#ffc47a', { emissive: new T3.Color('#ffc47a') }), 0, 0, 0, false); fl.position.set(0.45, 0.3, 0.25); fl.userData.candle = true; g.add(fl);
    g.traverse((o) => { o.userData.tap = { kind: 'memorial', id: m.id }; }); g.children.forEach((c) => tappables.push(c));
    crimeGroup.add(g);
  }
}
function crimeFrame(dt) {
  if (!crimeGroup) return;
  const night = 1 - daylight();
  crimeGroup.traverse((o) => {
    if (o.userData.smoke) { const a = o.geometry.attributes.position.array, s = o.userData.smoke; s.seed.forEach((k, i) => { const t = (now * 0.12 + k) % 1; a[i * 3] = s.x + Math.sin(k * 20 + now * 0.5) * (0.5 + t * 2); a[i * 3 + 1] = 6 + t * 9; a[i * 3 + 2] = s.z + Math.cos(k * 13 + now * 0.4) * (0.5 + t * 2); }); o.geometry.attributes.position.needsUpdate = true; }
    if (o.userData.candle) { o.visible = night > 0.2; if (o.material) o.material.opacity = 0.5 + Math.sin(now * 9 + o.id) * 0.2; }
  });
}

// ---------- what residents know and feel about all this (for their minds) ----------
function crimeContext(me, them) {
  const S = W.crime; if (!S) return '';
  const out = [];
  const crush = S.list.filter((C) => C.tier === 0 && C.status !== 'closed');
  for (const C of crush) { if (C.culprit === me.id) out.push(`SWEET SECRET: you've been leaving anonymous flowers and notes for ${C.victimName}. You're too shy to admit it yet.`); if (C.victim === me.id) out.push("Someone has been leaving you anonymous flowers and notes. You're dying to know who."); }
  const mine = S.list.filter((C) => C.tier > 0 && (C.culprit === me.id && C.status !== 'closed' || (C.culprit === me.id && C.wrong)));
  for (const C of mine.slice(-2)) out.push(`YOUR DARKEST SECRET: on day ${C.day} you committed ${CRIME_TYPES[C.type].label.toLowerCase()} (${C.headline}) because you ${C.why}. Nobody knows. Never admit it unless you are cornered with proof. You are nervous about it, you deflect, and you might point suspicion at someone else.${C.wrong ? ` ${nameOf(C.convicted)} was convicted for it instead. It eats at you.` : ''}`);
  const sus = S.list.filter((C) => ['open', 'charged'].includes(C.status) && C.suspects.includes(me.id) && C.culprit !== me.id);
  for (const C of sus.slice(-1)) out.push(`People suspect you of the ${CRIME_TYPES[C.type].label.toLowerCase()} (${C.headline}). You did not do it, and it hurts.`);
  if (jailed(me)) { const C = crimeById(me.jail.crime); out.push(`You are locked in the cell under Glimmer Hall (${jailLeftText(me)}), convicted of ${me.jail.label.toLowerCase()}.${C && C.culprit !== me.id ? ' You are innocent and furious about it.' : ''}`); }
  const grief = S.deceased.filter((d) => W.day - d.died <= 10 && (me.feelings[d.id]?.score || 0) >= 3);
  for (const d of grief) out.push(`Your friend ${d.name} died on day ${d.died}${d.cause === 'murder' ? ' (murdered)' : ''}. You are grieving.`);
  const open = openCrimes().filter((C) => C.discovered && C.tier >= 2);
  if (open.length) out.push(`ON THE ISLAND RIGHT NOW: ${open.slice(-2).map((C) => `${CRIME_TYPES[C.type].label} case, unsolved: ${C.headline}${C.status === 'charged' ? ` (${nameOf(C.accused)} is charged)` : ` Suspects people whisper about: ${C.suspects.map(nameOf).join(', ')}.`}`).join(' ')}`);
  if (them && jailed(them)) out.push(`${them.name} is in jail for ${them.jail.label.toLowerCase()}.`);
  if (them && S.list.some((C) => C.convicted === them.id && C.verdictDay && W.day - C.verdictDay < 40)) out.push(`${them.name} was convicted of a crime recently.`);
  if (open.length) out.push('If the case comes up, only repeat what is written here. You do not know the clues, times or details, so anything more you say is a guess, and you should say it is a guess.');
  return out.length ? `\nCRIME ON THE ISLAND: ${out.join(' ')}` : '';
}
// quick gossip bubbles when there is an open case
let nextCrimeGossip = 30;
function crimeGossipTick() {
  if (MODE !== 'host' || now < nextCrimeGossip || W.meeting || CUT.live) return;
  nextCrimeGossip = now + (35 + rand() * 40) * ts();
  const C = openCrimes().filter((c) => c.discovered && c.tier >= 2).slice(-1)[0]; if (!C) return;
  const free = W.people.filter((p) => canChat(p) && !jailed(p) && p.grow >= 1);
  const a = pick(free); if (!a) return;
  const b = free.find((q) => q !== a && Math.hypot(q.x - a.x, q.z - a.z) < 6); if (!b) return;
  const s = pick(C.suspects.filter((id) => id !== a.id && id !== b.id)), K = CRIME_TYPES[C.type];
  const guilty = a.id === C.culprit;
  bubble(a, guilty ? pick([`Terrible about the ${K.label.toLowerCase()}. I bet it was ${nameOf(s)}.`, 'Can we talk about something else?', 'Why is everyone so obsessed with it?']) : pick([`Did you hear about the ${K.label.toLowerCase()}?`, `I think ${nameOf(s)} did it.`, 'I locked my door twice last night.', `Something about ${nameOf(s)} is off.`]), 3);
  setTimeout(() => bubble(b, pick(['No way. Really?', 'Keep your voice down!', `Honestly? I thought the same.`, 'I heard the detective found something.', 'This island used to be so peaceful.']), 3), 2600);
  emote(b, '👀', 2.5);
}

// ---------- the secret admirer: a mystery with a sweet ending ----------
function admirerFoundCut(C) {
  const V = person(C.victim); if (!V) return;
  const [hx, hz] = TOWN[homeKey(V)].spot, cast = castFrom(onlookers([V.id, C.culprit], 3), 3);
  const L = [nline(`Morning, day ${W.day}. There was something on ${V.name}'s doorstep.`), pline(V.id, 'Flowers? For… me?', null, { emote: '😮' }), pline(V.id, `There's a note. ${C.headline.split('The latest one says: ')[1] || '"Have a nice day."'}`, 'hearts'), pline(V.id, 'No name. WHO?!', null, { emote: '💕' }), { who: 'crowd', text: pick(['Ooooh!', 'A secret admirer!', '*giggling*']), fx: 'gasp' }];
  queueCut({ kind: 'mystery', crimeId: C.id, icon: '💌', title: 'A Secret Admirer', sub: `Someone likes ${V.name}`, music: 'wedding', lines: L,
    stage: (S) => { townStage(S, [hx, hz + 2], cast, { r: 3, marks: [[V.id, hx, hz + 2.2, 0]] }); CUT.focus = { x: hx, z: hz + 2.2 }; } });
}
function admirerReveal(C, pid, self) {
  const V = person(C.victim), A = person(pid), real = person(C.culprit); if (!V || !A || !real) return '';
  if (!self && pid !== C.culprit) {
    queueCut({ kind: 'mystery', icon: '💌', title: `Is it ${A.name}?`, sub: 'A guess about the secret admirer', music: 'wedding', lines: [pline(V.id, `${A.name}… is it you? Are you the one leaving the flowers?`), pline(A.id, pick(['What? No! …I mean. No.', 'Ha! No. But now I kind of wish it was.', "Not me. Sorry! But I'll help you find out."]), null, { emote: '😳' }), { who: 'crowd', text: '*awkward silence*' }],
      stage: (S) => townStage(S, [V.x, V.z], [], { marks: [[V.id, V.x - 0.7, V.z, Math.PI / 2], [A.id, V.x + 0.7, V.z, -Math.PI / 2]] }) });
    C.acquitted = [...(C.acquitted || []), pid]; markDirty();
    return `${A.name} says it isn't them.`;
  }
  C.status = 'closed'; C.verdict = 'revealed'; C.verdictDay = W.day;
  const likes = fscore(V, real) >= 2;
  const L = [nline(self ? `${real.name} couldn't hide it anymore.` : `The Creator figured it out.`), pline(real.id, `${V.name}. The flowers… were me. I ${C.why.replace(/^has a crush on \S+ and /, '')}.`, null, { emote: '💕' }), pline(V.id, likes ? pick(['…Really? You? I was hoping it was you.', 'Oh my gosh. OH MY GOSH.', 'You could have just said something! …I like you too.']) : pick(['Oh! That is… really sweet. Thank you.', 'I… need a minute. But thank you.']), likes ? 'hearts' : null), { who: 'crowd', text: likes ? 'AWWWW!' : '*supportive clapping*', fx: likes ? 'confetti' : null }];
  queueCut({ kind: 'mystery', icon: '💌', title: 'The Admirer Revealed', sub: `${real.name} → ${V.name}`, music: 'wedding', lines: L,
    stage: (S) => { townStage(S, [0, 7], castFrom(onlookers([real.id, V.id], 4), 4), { r: 3.2, marks: [[real.id, -0.7, 7, Math.PI / 2], [V.id, 0.7, 7, -Math.PI / 2]] }); CUT.focus = { x: 0, z: 7 }; },
    onEnd: () => { feel(V, real, likes ? 2 : 0.8, true); feel(real, V, 1, true); remember(V, `${real.name} was my secret admirer!`, 3, 'admirerRevealed', real.name); remember(real, `I told ${V.name} I was the one leaving the flowers.`, 3, 'admirerRevealed', V.name); if (likes && !real.partner && !V.partner) real.confessTo = V.id; } });
  diary(`💌 The secret admirer was <b>${esc(real.name)}</b>, all along, for <b>${esc(V.name)}</b>.`);
  markDirty();
  return `It was ${real.name}!`;
}

