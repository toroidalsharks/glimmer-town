// npm test
// Voices: scripted lines get rewritten by the model in each resident's own words and are
// used once. Without a key, residents still vary how they say things and skip what the town
// heard lately. Surprise moments play out with reactions, and the safety rules hold.
// The model is replaced by a stand-in here, so no real calls are made.
import { openGame } from './lib.mjs';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond === true ? '  ok ' : ' FAIL'}  ${what}${cond === true || cond === false ? '' : ` (${cond})`}`); if (cond !== true) failed++; };

const { browser, page, E, errors } = await openGame();
try {
  await E(`(() => { W.meeting = null; W.meetingDay = W.day; W.t = 0.3; W.weather = 'clear'; cfg.cutscenes = false; W.event = null; brainCfg.key = ''; })()`);
  await E(`(() => { const p = W.people.find((q) => !isRealish(q) && q.grow >= 1 && !q.visitor); window.__p = p.id; p.inside = false; p.state = 'free'; })()`);
  const P = `person(window.__p)`;

  // no key: the same scripted line comes out a different way each time
  ok(await E(`(() => { const p = ${P}, out = []; for (let i = 0; i < 12; i++) { bubble(p, 'What a view.', 2); out.push(p.bubble.text); } const uniq = new Set(out).size; return uniq >= 9 || out.join(' | '); })()`), 'without a key, the same old line is said 12 different ways in a row');
  ok(await E(`(() => { const p = ${P}; bubble(p, '…', 30); return p.bubble.text === '…'; })()`), 'the thinking dots stay as they are');
  ok(await E(`(() => { const p = ${P}; p.lines = ['My own words, exactly.']; bubble(p, 'My own words, exactly.', 2); bubble(p, 'My own words, exactly.', 2); const r = p.bubble.text === 'My own words, exactly.'; p.lines = null; return r; })()`), "a custom resident's own written lines are never changed");
  ok(await E(`(() => { const m = W.people.find((q) => q.lovesMili); if (!m) return true; bubble(m, 'Yo. I love you.', 2); bubble(m, 'Yo. I love you.', 2); return m.bubble.text === 'Yo. I love you.'; })()`), "Red's own 'I love you' stays his");
  ok(await E(`(() => { const s = voiceSeed('Did you see ' + W.people[1].name + ' at the "Moon Movie"? 3 times!'); return s.seed === 'Did you see {A} at the "{q1}"? {n1} times!' && s.slots['{A}'] === W.people[1].name || JSON.stringify(s); })()`), 'names, titles and numbers become slots, so one moment covers them all');

  // with a model: lines are written in batches, used once each, and fill the slots
  await E(`(() => {
    brainCfg.key = 'test-key'; aiDown = ''; brainCfg.voices = true; brainCfg.wild = true; window.__calls = [];
    llm = async (input, opts = {}) => {
      const text = typeof input === 'string' ? input : input.map((m) => m.content).join('\\n');
      window.__calls.push(text);
      if (/"lines"/.test(text)) {
        const n = (text.match(/^#\\d+$/gm) || []).length, lines = {};
        for (let i = 1; i <= n; i++) lines[i] = [1, 2, 3, 4, 5].map((k) => 'Fresh line ' + i + '-' + k + ' for {A}' + (k === 5 ? ' at {n1}' : '') + '.');
        return { lines };
      }
      if (/Something surprising/.test(text)) return window.__wild;
      if (/Give .* a storyline/.test(text)) return { title: 'The Midnight Bakery', premise: 'Secretly baking bread at night to beat the bakery.', beats: 3 };
      if (/storyline "/.test(text)) { const last = /the LAST one/.test(text); return { say: last ? 'It rose. It actually rose!' : 'Nobody can know about the flour.', thought: 'Almost there.', reactions: [], diary: last ? 'The loaf came out perfect.' : 'Flour everywhere.', outcome: 'success', changed: 'Now they believe they can do anything.' }; }
      if (/opens Chirp and posts/.test(text)) return { post: 'the sea smelled like pennies today and nobody else noticed' };
      return { say: 'A model line.', thought: '', action: 'chat' };
    };
  })()`);
  ok(await E(`aiReady() && voiceRoom()`), 'with a key the voices are ready');
  ok(await E(`(async () => {
    const p = ${P}, o = W.people.find((q) => q !== p);
    window.__o = o.id;
    bubble(p, 'Have you seen ' + o.name + '? 4 times today.', 2); bubble(p, 'Have you seen ' + o.name + '? 4 times today.', 2);
    if (!voiceQueue.some((r) => r.pid === p.id)) return 'not queued';
    voiceQueue.forEach((r) => (r.at -= 20000)); voiceNextBatch = 0; await voiceBatch();
    const got = [];
    for (let i = 0; i < 4; i++) { bubble(p, 'Have you seen ' + o.name + '? 4 times today.', 2); got.push(p.bubble.text); }
    return got.every((t) => /^Fresh line \\d-\\d for /.test(t) && t.includes(o.name)) && new Set(got).size === 4 || got.join(' | ');
  })()`), 'the model writes fresh lines for that resident, each used once, with names filled in');
  ok(await E(`window.__calls.slice(-1)[0].includes('THE MOMENT') && window.__calls.slice(-1)[0].includes('never cheat') && window.__calls.slice(-1)[0].includes('Already said lately')`), 'the batch prompt carries the moment, the safety rules and what they said lately');
  ok(await E(`(() => { const p = ${P}, o = person(window.__o); const before = VOICE.book[Object.keys(VOICE.book).find((k) => VOICE.book[k].some((l) => l.by === p.id))]; const q = W.people.find((x) => x !== p && x !== o && !isRealish(x) && x.grow >= 1); bubble(q, 'Have you seen ' + o.name + '? 4 times today.', 2); return /^Fresh line/.test(q.bubble.text) || q.bubble.text; })()`), 'someone else in the same moment can borrow a line the town has not heard yet');
  ok(await E(`(() => { const p = ${P}; voiceTrust('Model wrote this exact sentence.'); bubble(p, 'Model wrote this exact sentence.', 2); return p.bubble.text === 'Model wrote this exact sentence.'; })()`), 'lines a model already wrote pass through untouched');
  ok(await E(`(() => { const p = ${P}, o = person(window.__o); const m = postText(p, o.id, 'whats up', 'chat'); postText(p, o.id, 'whats up', 'chat'); const m2 = postText(p, o.id, 'whats up', 'chat'); return !!m && m2.text !== m.text && W.texts.slice(-1)[0].text === m2.text; })()`), 'texts are voiced too, and the saved text is what was sent');
  ok(await E(`(() => { const p = ${P}; const out = voiceLine(p, 'I think someone did it.', 'say', { safe: (t) => !/Fresh/.test(t) }); return !/Fresh/.test(out); })()`), 'crime gossip only uses lines that pass the fact check');
  ok(await E(`(async () => { await aiLine(${P}, person(window.__o), [], 'test'); return window.__calls.slice(-1)[0].includes('THINGS YOU SAID LATELY'); })()`), 'live conversations are told what the speaker said lately');

  // surprise moments
  ok(await E(`(async () => {
    const p = ${P}; const near = W.people.filter((q) => q !== p && !isRealish(q) && q.grow >= 1 && !q.visitor).slice(0, 2);
    for (const q of [p, ...near]) { q.inside = false; q.away = null; q.state = 'free'; q.task = null; q.path = []; q.heldByDlg = false; }
    near.forEach((q, i) => { q.x = p.x + 1 + i; q.z = p.z; q.state = 'talk'; });
    W.people.forEach((q) => { if (q !== p && !near.includes(q)) q.inside = true; });
    window.__wild = { move: 'confess', say: 'I have never once finished a book. Not one.', to: near[0].name, thought: 'Finally.', reactions: [{ who: near[0].name, say: 'Not even the short ones?!' }], diary: 'The plaza went very quiet.' };
    const before = fscore(near[0], p);
    const r = await wildMoment(true); near.forEach((q) => { q.state = 'free'; });
    return r === true && p.bubble.text.includes('finished a book') && W.log.some((e) => /⚡/.test(e.text)) && fscore(near[0], p) > before && near[0].today.some((m) => /secret/.test(m.text)) || [r, p.bubble?.text].join(' ');
  })()`), 'a surprise confession plays out, and the friend remembers it');
  ok(await E(`(async () => { await new Promise((r) => setTimeout(r, 6000)); return W.log.some((e) => /Not even the short ones/.test(e.text)); })()`), 'the people nearby react in their own words');
  ok(await E(`(async () => {
    const p = ${P}; const real = W.people.find((q) => isRealish(q) && q.grow >= 1); if (!real) return true;
    real.inside = false; real.away = null; real.x = p.x + 1; real.z = p.z; real.state = 'talk'; p.state = 'free'; p.task = null;
    const before = fscore(real, p);
    window.__wild = { move: 'outburst', say: 'I am SO done with all of this!', to: real.name, reactions: [] };
    const r = await wildMoment(true); real.inside = true; real.state = 'free';
    return r === true && fscore(real, p) === before && !real.today.some((m) => /blew up at me/.test(m.text)) || 'hit';
  })()`), 'an outburst is never aimed at a real person');
  ok(await E(`(async () => {
    const k = birth(); k.grow = 0.5; k.stage = 'kid'; k.bornDay = W.day - 10; W.people.push(k); buildKin(k);
    W.people.forEach((q) => { q.inside = q !== k; }); k.state = 'free'; k.task = null; k.path = [];
    window.__wild = { move: 'hot_take', say: 'Hot take incoming.', reactions: [] };
    const r = await wildMoment(true);
    const prompt = window.__calls.slice(-1)[0];
    W.people.splice(W.people.indexOf(k), 1);
    return r === false && !/hot_take \\(/.test(prompt) && /outburst \\(/.test(prompt) === false || [r, prompt.slice(-600)].join(' ');
  })()`), 'kids only get kid-friendly surprise moves');
  ok(await E(`(async () => {
    const p = ${P}; W.people.forEach((q) => { q.inside = q !== p; }); p.state = 'free'; p.task = null; p.path = []; p.heldByDlg = false;
    const arc = await arcStart(true); if (!arc) return 'no arc';
    for (let i = 0; i < 3; i++) { p.state = 'free'; await arcBeat(arc, true); }
    const html = voiceDetailHtml(p);
    return arc.done && arc.outcome === 'success' && arc.beats.length === 3 && W.log.some((e) => /Midnight Bakery/.test(e.text)) && p.past.some((m) => /believe they can do anything/.test(m.text)) && html.includes('The loaf came out perfect') && html.includes('Almost there') || [arc.beats.length, arc.done, html.slice(0, 200)].join(' ');
  })()`), 'a storyline starts, plays out scene by scene, resolves, and shows on their page');
  ok(await E(`(async () => { const p = ${P}; const t = await aiChirp(p); postChirp(p, t); return W.chirps.slice(-1)[0].text === 'the sea smelled like pennies today and nobody else noticed'; })()`), 'residents write their own Chirp posts');
  ok(await E(`(() => { const c = () => (W.updates || []).filter((u) => /stopped reading from a script/.test(u.text)).length; W.added.voices1 = false; const n = c(); voicesBoot(); voicesBoot(); return c() === n + 1; })()`), 'old towns hear about it once');
  ok(await E(`(() => { brainCfg.key = ''; W.people.forEach((q) => { q.inside = false; }); W.t = 0.25; for (let i = 0; i < 600; i++) step(0.2); voiceDirty = true; voiceSave(); return !!localStorage.getItem(VOICE_KEY) && W.people.every((p) => Number.isFinite(p.x)); })()`), 'a busy stretch runs clean and the voices are kept on the phone');
} finally {
  if (errors.length) { console.log(' FAIL  page errors:\n   ' + errors.join('\n   ')); failed++; }
  await browser.close();
}
if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\nvoices: all good');
