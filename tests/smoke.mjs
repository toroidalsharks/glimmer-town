// npm test
// Boots the built game headless and plays through the big systems:
// a burglary, a murder from discovery to verdict, a civil case, a wedding,
// the case board, then a save and reload. Fails on any page error.
import { openGame } from './lib.mjs';

const verbose = process.argv.includes('-v');
const log = (...a) => verbose && console.log('   ', ...a);
let failed = 0;
const ok = (cond, what) => { console.log(`${cond ? '  ok ' : ' FAIL'}  ${what}`); if (!cond) failed++; };

const t0 = Date.now();
const { browser, page, E, errors, cutStep } = await openGame();
try {
  ok(await E('W.people.length') >= 5, 'the town boots with residents');
  ok(await E(`W.people.every((p) => p.look && FASHION[p.look.fashion] && p.look.face)`), 'everyone has a style and a face');
  ok(await E(`W.people.filter(isRealish).every((p) => p.look.fashion === 'casual' || p.likes['style:' + p.look.fashion] >= 1)`), 'real people start in a plain style');
  ok(await E(`(() => { const p = W.people.find((q) => q.job && q.grow >= 1 && !isRealish(q)); if (!p) return true; const before = lookKey(p); p.task = { kind: 'work', phase: 'do' }; const m = meshes.get(p.id); lookFrame(p, m); const on = m.lookKey !== before && /uniform/.test(lookText(p)); p.task = null; lookFrame(p, m); return on && !/uniform/.test(lookText(p)); })()`), 'residents change into a uniform for work and back');
  ok(await E(`(() => { const [a, b] = W.people.filter((p) => !isRealish(p) && p.grow >= 1); setFashion(a, 'goth'); setFashion(b, 'goth'); const r = styleRemark(a, b, 2); return !!r && r.feeling > 0 && /goth/.test(outfitText(b)); })()`), 'two goths notice each other');

  // the look studio: a button on every card, every style and piece builds, faces stick
  ok(await E(`(() => { const p = W.people.find((q) => q.grow >= 1); lookOpen = null; const closed = lookStudioHtml(p); lookOpen = p.id; lookTab = 'style'; const open = lookStudioHtml(p); lookTab = 'outfit'; const o = lookStudioHtml(p); lookTab = 'face'; const f = lookStudioHtml(p); lookOpen = null; return /Change look/.test(closed) && /data-part="style"/.test(open) && /data-part="layer"/.test(o) && /data-part="eyes"/.test(f); })()`), 'the resident card has a look studio');
  ok(await E(`Object.keys(FASHION).length >= 27 && FASHION_ORDER.every((k) => FASHION[k]) && Object.keys(FASHION).every((k) => FASHION_ORDER.includes(k))`), 'every style is listed in the picker');
  ok(await E(`(() => { const p = W.people.find((q) => !isRealish(q) && q.grow >= 1); for (const k of FASHION_ORDER) { lookEdit(p.id, 'style', k); if (p.look.fashion !== k || !meshes.get(p.id).lookParts.length) return 'style ' + k; } for (const [part, list] of [['layer', LOOK_LAYERS], ['bottom', LOOK_BOTTOMS], ['head', LOOK_HEADS], ['extra', LOOK_EXTRAS], ['neck', LOOK_NECKS], ['print', ['heart', 'star', 'rainbow']], ['eyes', Object.keys(EYE_SHAPES)], ['mouth', Object.keys(MOUTHS)], ['mark', Object.keys(FACE_MARKS)], ['eyeColor', Object.keys(EYE_COLORS)]]) for (const v of list) lookEdit(p.id, part, v); lookEdit(p.id, 'glasses', 'shades'); lookEdit(p.id, 'skin', 3); lookEdit(p.id, 'ears', 'cat'); return !!meshes.get(p.id) && p.body.ears === 'cat' && /sunglasses/.test(lookText(p)); })()`) === true, 'every style, piece and face part builds on a resident');
  ok(await E(`(() => { const p = W.people.find((q) => !isRealish(q) && q.grow >= 1); lookEdit(p.id, 'eyes', 'cat'); lookEdit(p.id, 'eyeColor', 'violet'); lookEdit(p.id, 'style', 'goth'); const kept = p.look.face.eyes === 'cat' && p.look.face.eyeColor === 'violet' && p.look.byCreator; lookEdit(p.id, 'resetface', 1); return kept && !p.body.faceMods; })()`), 'face changes survive a new style, and can be reset');
  ok(await E(`(() => { const k = birth(); k.grow = 0.3; W.people.push(k); buildKin(k); lookEdit(k.id, 'lips', '#ff5f8f'); lookEdit(k.id, 'style', 'goth'); lookEdit(k.id, 'layer', 'corset'); const ok = !k.look.face.lips && k.look.fashion !== 'goth' && k.look.layer !== 'corset'; lookEdit(k.id, 'style', 'neko'); return ok && k.look.fashion === 'neko'; })()`), 'kids only get kid styles and no makeup');
  ok(await E(`lookEdit(W.people[0].id, 'layer', '<img onerror=x>') === '' && lookEdit(W.people[0].id, 'nope', 'x') === ''`), 'the look command ignores bad input');

  // the workshop remembers the color you picked, through panel refreshes
  ok(await E(`(() => { const [a, b, c] = W.people.filter((p) => p.grow >= 1 && !isRealish(p)); const keep = JSON.stringify([a.partner, a.married, b.partner, b.married, a.feelings, c.feelings]); a.partner = b.id; b.partner = a.id; a.married = b.married = true; a.feelings[c.id] = { name: c.name, score: -7, note: 'test' }; const R = relationsOf(a); const h = relChartHtml(a); const [ap, am, bp, bm, af, cf] = JSON.parse(keep); a.partner = ap; a.married = am; b.partner = bp; b.married = bm; a.feelings = af; c.feelings = cf; return R[0].q === b && R[0].main === 'married' && R.some((r) => r.q === c && r.main === 'feud') && (h.match(/class="rel-node"/g) || []).length === R.filter((r) => r.q).length && h.includes('data-id="' + b.id + '"'); })()`), 'the relationship chart shows a spouse and a feud');
  ok(await E(`(() => { craftPick = 'plum'; activeTab = 'gifts'; openSheet(); refreshPanel(true); refreshPanel(true); const h = workshopHtml(); const M = mats(); for (const k of Object.keys(MATS)) M[k] = 50; const n = W.creator.items.length; applyCmd({ t: 'craft', kind: 'hat', id: 'beanie', color: craftPick }); const it = W.creator.items[n]; sheet.hidden = true; return craftPick === 'plum' && /data-craftcolor="plum" aria-pressed="true"/.test(h) && /data-color="plum"/.test(h) && it && it.color === 'plum'; })()`), 'the workshop keeps the color you picked');

  // real people keep the hair they were given: Mili wears her pixie, and random haircuts skip them
  ok(await E(`(() => { const m = findMili(); return !m || hairOf(m).style === 'pixie'; })()`), "Mili has her pixie cut");
  ok(await E(`(() => { const real = W.people.filter(isRealish).filter((p) => p.body); const before = real.map((p) => JSON.stringify(hairOf(p))); real.forEach((p) => { const g = p.grow; p.grow = 1; for (let i = 0; i < 400; i++) selfHaircut(p); p.grow = g; }); return real.every((p, i) => JSON.stringify(hairOf(p)) === before[i]); })()`), 'random haircuts leave real people alone');

  // more grown-ups, all outside, so crimes have enough suspects
  await E(`(() => { W.meeting = null; W.meetingDay = W.day; W.t = 0.3; for (let i = 0; i < 6; i++) { const k = birth(); k.grow = 1; W.people.push(k); buildKin(k); } W.people.forEach((p) => { p.inside = false; p.task = null; p.state = 'free'; p.x = (rand() - 0.5) * 20; p.z = 8 + rand() * 10; }); })()`);

  // 1. a property crime is discovered in a cutscene
  const petty = await E(`__g.crime('burglary') || __g.crime('pickpocket') || __g.crime('hack')`);
  ok(!!petty, 'a property crime happens');
  await page.waitForTimeout(800);
  ok(['end', 'none'].includes(await cutStep(40, log)), 'its discovery scene plays to the end');

  // 2. a murder: discovery, search, question, accuse, arrest, trial, verdict
  const real = await E(`W.people.filter(isRealish).map((p) => p.id)`);
  const cid = await E('__g.murder()');
  ok(!!cid, 'a murder happens');
  await page.waitForTimeout(800);
  await cutStep(40, log);
  const C = (k) => E(`crimeById('${cid}').${k}`);
  const culprit = await C('culprit');
  ok(!real.includes(culprit) && !real.includes(await C('victim')), 'no real person is the killer or the victim');
  ok((await E(`crimeBoardHtml()`)).includes('Investigations'), 'the case board renders');
  ok(await E(`(() => { const S = crimeState(); return (S.murderPace || 'real') === 'real' && S.nextMurderAt > Date.now() + 200 * 864e5; })()`), 'the next murder is most of a real year away');
  ok(await E(`(() => { const S = crimeState(), MY = { day: 0, done: false }; return !murderDue(S, MY); })()`), 'no murder is due today');
  ok(await E(`(() => { const X = crimeById('${cid}'); return X.clues.filter((c) => c.genuine === false && !c.clears && (c.attr || c.kind === 'witness')).every((c) => X.clues.some((d) => d.debunks === c.id)); })()`), 'every misleading clue has a follow-up that rules it out');
  ok(await E(`(() => { const X = crimeById('${cid}'), det = detectiveOf(); if (!det) return false; det.feelings[X.victim] = { name: X.victimName, score: 6, note: '' }; const a = caseDetective(X, det); return a && a.id !== det.id && !X.suspects.includes(a.id) && a.id !== X.culprit; })()`), 'a grieving detective hands the case to someone else');
  ok(await E(`(() => { const X = crimeById('${cid}'); let n = 0; while (X.clues.some((c) => !c.found) && n++ < 30) revealClue(X, null, true); const bad = X.clues.filter((c) => c.genuine === false && !c.clears && (c.attr || c.kind === 'witness')); return bad.every((c) => c.ruledOut) && fitsClue(X, bad[0] || { ruledOut: true }).length === 0; })()`), 'once found, misleading clues are crossed out');
  ok(await E(`(() => { const X = crimeById('${cid}'); const top = X.suspects.map((id) => [id, evidenceAgainst(X, id)]).sort((a, b) => b[1] - a[1])[0][0]; return top === X.culprit || !!X.planted; })()`), 'with every clue found, the evidence points at the real culprit');
  await E(`briefingCut(crimeById('${cid}'))`);
  await page.waitForTimeout(800);
  ok(['end', 'none'].includes(await cutStep(60, log)), "the detective's briefing plays");
  log(await E(`crimeCmd({ a: 'search', cid: '${cid}' })`));
  log(await E(`crimeCmd({ a: 'question', cid: '${cid}', pid: '${culprit}' })`));
  // make sure there are two clues to accuse with
  await E(`(() => { const X = crimeById('${cid}'); while (X.clues.filter((c) => c.found).length < 2 && X.clues.some((c) => !c.found)) revealClue(X, null); })()`);
  log(await E(`crimeCmd({ a: 'accuse', cid: '${cid}', pid: '${culprit}' })`));
  ok(['charged', 'trial'].includes(await C('status')), 'accusing charges the suspect');
  ok(await E(`(() => { const A = person('${culprit}'); return jailed(A) && A.jail.remand && !isRealish(A); })()`), 'the accused waits for trial in the cell');
  await page.waitForTimeout(800);
  await cutStep(30, log); // the arrest
  // pressing "Hold the trial now" (twice, impatiently) must not stack up extra trials
  log(await E(`crimeCmd({ a: 'trialnow', cid: '${cid}' })`), await E(`crimeCmd({ a: 'trialnow', cid: '${cid}' })`));
  let st = 'none';
  for (let i = 0; i < 20 && st !== 'wait'; i++) { await page.waitForTimeout(700); st = await cutStep(80, log); }
  ok(st === 'wait', 'the trial reaches the verdict choice');
  ok((await E(`CUT.live.lines.filter((L) => L.fx === 'objection').length`)) > 0, 'somebody objects');
  await E(`cutPick('guilty')`);
  ok(await cutStep(20, log) === 'wait', 'the Creator is asked for a sentence');
  await E(`cutPick('prison')`);
  await cutStep(20, log);
  ok(await C('verdict') === 'guilty', 'the verdict is recorded');
  ok(await E(`jailed(person('${culprit}'))`), 'the convicted resident goes to the cell');
  ok(await E(`(() => { const J = person('${culprit}').jail; return J.untilReal > Date.now() + 300 * 864e5 && J.nextHearing > Date.now(); })()`), 'a murder sentence lasts a real year, with parole hearings');
  ok(await E(`/jumpsuit/.test(lookText(person('${culprit}')))`), 'prisoners wear an orange jumpsuit');
  ok(await E(`factSafe('Justice matters to this town, and so does fairness.', []) && !factSafe('I was at the pier around 2.', []) && !factSafe('It was a navy thread.', [])`), 'AI lines that state facts are thrown out');
  await page.waitForTimeout(1000);
  ok(await E(`!CUT.queue.some((q) => q.crimeId === '${cid}') && !(CUT.live && CUT.live.crimeId === '${cid}')`), 'the case gets exactly one trial');
  // a parole hearing, granted
  await E(`paroleCut(person('${culprit}'))`);
  st = 'none';
  for (let i = 0; i < 10 && st !== 'wait'; i++) { await page.waitForTimeout(700); st = await cutStep(40, log); }
  ok(st === 'wait', 'a parole hearing asks the Creator');
  await E(`cutPick('grant')`); await cutStep(20, log);
  ok(await E(`!jailed(person('${culprit}')) && onProbation(person('${culprit}')) && /ankle monitor/.test(lookText(person('${culprit}')))`), 'parole means probation with an ankle monitor');

  // 3. a civil case
  await E(`(() => { const [a, b] = W.people.filter((p) => !jailed(p) && p.grow >= 1); startCivilTrial(fileCase('fight', a, b)); })()`);
  st = 'none';
  for (let i = 0; i < 10 && st !== 'wait'; i++) { await page.waitForTimeout(700); st = await cutStep(60, log); }
  ok(st === 'wait', 'a civil case reaches a ruling');
  await E(`cutPick('fine')`); await cutStep(20, log);

  // a trial lost to a reload gets held again, and the accused stays in custody until then
  ok(await E(`(() => { const id = __g.crime('burglary') || __g.crime('pickpocket'); const X = crimeById(id); if (!X) return 'no crime'; const A = person(X.suspects.find((q) => !jailed(person(q)))); X.status = 'charged'; X.accused = A.id; X.chargedDay = W.day - 1; trialsQueued.delete(X.id); CUT.queue = CUT.queue.filter((q) => q.crimeId !== X.id); const realTrial = crimeTrialNow; crimeTrialNow = (Y) => trialsQueued.add(Y.id); custodyCheck(false); crimeTrialNow = realTrial; const held = jailed(A) && A.jail.remand && trialsQueued.has(X.id); crimeVerdict(X, { def: A.id, jury: [] }, 'innocent', true); CUT.queue = CUT.queue.filter((q) => q.crimeId !== X.id); return held && !jailed(A) && X.status !== 'charged'; })()`) === true, 'lost trials come back, and not guilty means free');
  // letters: at most two a night, no exact repeats, and you can page through them
  ok(await E(`(() => { W.mail = []; W.people.forEach((p) => { p.today.push({ text: 'Best day ever.', weight: 3, tag: 'levelUp' }); p.cr.lastSeen = W.day - 9; }); nightLetters(); const n1 = W.mail.length; W.day++; nightLetters(); W.day--; const bodies = W.mail.map((m) => m.body.split(String.fromCharCode(10))[0]); return n1 <= 2 && W.mail.length <= 4 && new Set(bodies.map((b, i) => W.mail[i].from + b)).size === bodies.length; })()`), 'letters come a couple at a time and read differently');
  ok(await E(`(() => { for (let i = 0; i < 3; i++) { const p = W.people[i]; W.mail.unshift({ id: 'tm' + i, from: p.id, fromName: p.name, day: W.day, kind: 'talk', greet: 'Hi,', body: 'Test ' + i, sign: 'Bye,', read: false, written: true }); } activeTab = 'mail'; openSheet(); mailOpen = W.mail[0].id; refreshPanel(true); mailStep(1); const second = mailOpen === W.mail[1].id; mailStep(-1); const back = mailOpen === W.mail[0].id; const html = $('#pane-mail').innerHTML; mailOpen = null; sheet.hidden = true; return second && back && /data-mailnav/.test(html); })()`), 'you can flip through letters without going back to the list');
  ok(await E(`(() => { const p = W.people[0]; activeTab = 'people'; openDetail = p.id; lookOpen = p.id; openSheet(); CUT.sheetTouch = performance.now() - 120000; const busy = sheetBusy(); lookOpen = null; const idle = sheetBusy(); sheet.hidden = true; openDetail = null; return busy && !idle; })()`), 'scenes wait while you are dressing someone');

  // 4. a wedding scene
  await E(`(() => { const [a, b] = W.people.filter((p) => !jailed(p) && p.grow >= 1 && !isRealish(p)).slice(2); weddingCut(a, b); })()`);
  await page.waitForTimeout(800);
  ok(['end', 'none'].includes(await cutStep(40, log)), 'a wedding scene plays');

  // 5. the court tab, the replay archive
  await E(`(() => { activeTab = 'court'; openSheet(); refreshPanel(true); })()`);
  await page.waitForTimeout(500);
  ok(await E(`W.cutscenes.length`) >= 4, 'scenes are saved for replay');

  // 6. save, reload, and the world is still there
  const before = await E(`JSON.stringify([W.day, W.people.length, jailedPeople().map((p) => p.id)])`);
  await E(`saveNow()`);
  await page.reload();
  await page.waitForFunction(() => window.__g && window.__g.ev('typeof W !== "undefined" && W.people.length > 0'), null, { timeout: 60000 });
  const after = await E(`JSON.stringify([W.day, W.people.length, jailedPeople().map((p) => p.id)])`);
  ok(before === after, 'the town survives a reload');
} catch (e) {
  console.log(' FAIL  the test itself crashed: ' + e.message); failed++;
}
ok(errors.length === 0, 'no errors on the page' + (errors.length ? ':\n        ' + errors.slice(0, 5).join('\n        ') : ''));
await browser.close();
console.log(failed ? `\n${failed} problem${failed > 1 ? 's' : ''} (${((Date.now() - t0) / 1000).toFixed(0)} s)` : `\nall good (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
process.exit(failed ? 1 : 0);
