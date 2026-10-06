// npm test
// Inner lives: complexes, swearing for grown-ups, couples' private nights, and the Mirror.
// The model is replaced by a stand-in here, so no real calls are made.
import { openGame } from './lib.mjs';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond === true ? '  ok ' : ' FAIL'}  ${what}${cond === true || cond === false ? '' : ` (${cond})`}`); if (cond !== true) failed++; };

const { browser, page, E, errors } = await openGame();
try {
  await E(`(() => {
    W.meeting = null; W.meetingDay = W.day; W.t = 0.3; cfg.cutscenes = false; W.event = null;
    brainCfg.key = 'test-key'; aiDown = ''; brainCfg.voices = true; window.__calls = [];
    llm = async (input, opts = {}) => {
      const text = typeof input === 'string' ? input : input.map((m) => m.content).join('\\n');
      window.__calls.push(text);
      if (/who they are when nobody's looking/.test(text)) return { face: 'The life of every party.', truth: 'Goes home and replays every joke that landed wrong.', tell: 'Laughs first, always.' };
      if (/You are the Mirror/.test(text)) return { title: 'The long week', page: 'They argued. They made up. Someone brought soup.' };
      return { say: 'Hey.', thought: '', action: 'chat' };
    };
  })()`);
  ok(await E(`(() => { innerBoot(); const gen = W.people.filter((p) => innerOk(p)); return gen.length > 0 && gen.every((p) => COMPLEXES[p.complex]) && W.people.filter((p) => isRealish(p) || stageOf(p) !== 'adult').every((p) => !p.complex); })()`), 'generated grown-ups get a complex; real people and kids never do');
  ok(await E(`(async () => { const p = W.people.find((q) => innerOk(q)); p.inner = null; p.innerAsked = false; await writeInner(p); window.__g1 = p.id; return p.inner && p.inner.face === 'The life of every party.' || JSON.stringify(p.inner); })()`), 'the model writes their public face and private truth once');
  ok(await E(`(async () => { const p = person(window.__g1), o = W.people.find((q) => q !== p && q.grow >= 1); await aiLine(p, o, [], 'Hi.'); const c = window.__calls.slice(-1)[0]; return c.includes("WHAT'S UNDERNEATH") && c.includes('replays every joke') && c.includes('perform for each other'); })()`), 'what they show and what is underneath goes into their conversations');
  ok(await E(`(async () => { const m = W.people.find((q) => isRealish(q)); if (!m) return true; const o = W.people.find((q) => q !== m && q.grow >= 1); await aiLine(m, o, [], 'Hi.'); return !window.__calls.slice(-1)[0].includes("WHAT'S UNDERNEATH"); })()`), "real people's prompts get no complex");

  // swearing
  ok(await E(`(() => { brainCfg.swear = true; return voiceRules().includes('fuck') && /swear/i.test(swearNote(person(window.__g1))); })()`), 'with the switch on, grown-ups may swear');
  ok(await E(`(() => { const k = W.people.find((q) => stageOf(q) === 'kid' || stageOf(q) === 'teen'); if (!k) { const p = W.people[W.people.length - 1]; const was = p.stage; p.stage = 'kid'; const r = /don't swear/.test(swearNote(p)) && !canSwear(p); p.stage = was; return r; } return /don't swear/.test(swearNote(k)) && !canSwear(k); })()`), 'kids and teens never swear');
  ok(await E(`(() => { brainCfg.swear = false; const r = !voiceRules().includes('fuck') && swearNote(person(window.__g1)) === ''; brainCfg.swear = true; return r; })()`), 'switched off in Settings, the old mild rule comes back');

  // couples
  ok(await E(`(() => {
    const [a, b] = W.people.filter((q) => innerOk(q) && !q.partner);
    if (!a || !b) return 'need two single grown-ups';
    a.partner = b.id; b.partner = a.id; a.datingSince = b.datingSince = W.day;
    a.feelings[b.id] = { score: 8, note: 'mine', name: b.name }; b.feelings[a.id] = { score: 8, note: 'mine', name: a.name };
    window.__ca = a.id; window.__cb = b.id;
    for (let i = 0; i < 25; i++) intimateMorning();
    return (a.today || []).concat(a.past || []).some((m) => m.tag === 'intimate') && a.lastIntimate === W.day;
  })()`), 'a close grown-up couple sometimes spends the night together, and remembers it');
  ok(await E(`intimacyContext(person(window.__ca), person(window.__cb)).includes('never explicit') && !intimacyContext(person(window.__ca), W.people.find((q) => q.id !== window.__ca && q.id !== window.__cb))`), 'their conversations know they are a couple in every sense, and nobody else gets that');
  ok(await E(`(() => { const m = W.people.find((q) => isMili(q)), r = W.people.find((q) => q.lovesMili); if (!m || !r) return true; const was = [m.partner, r.partner]; m.partner = r.id; r.partner = m.id; m.feelings[r.id] = { score: 9, note: '', name: r.name }; r.feelings[m.id] = { score: 9, note: '', name: m.name }; for (let i = 0; i < 25; i++) intimateMorning(); const bad = (m.today || []).concat(m.past || []).some((x) => x.tag === 'intimate'); [m.partner, r.partner] = was; return !bad && !intimacyContext(m, r); })()`), 'real people never get private nights');

  // the Mirror
  ok(await E(`(W.mirror || []).length >= 1 && W.mirror[0].title === MIRROR_PAGES[0][0] && W.log.some((e) => /The Mirror, page 1/.test(e.text))`), 'the first Mirror page appears in the Diary');
  ok(await E(`(async () => { const n = W.mirrorState.n; await mirrorMorning(); return W.mirrorState.n === n; })()`), 'pages are spaced a few real hours apart');
  ok(await E(`(async () => { await mirrorMorning(true); return W.mirror.slice(-1)[0].title === MIRROR_PAGES[1][0]; })()`), 'the next written page comes next');
  ok(await E(`(async () => { W.mirrorState.n = MIRROR_PAGES.length; for (let i = 0; i < 4; i++) diary('Something happened ' + i); W.log.forEach((e) => { e.day = W.day - 1; }); await mirrorMorning(true); const c = window.__calls.slice(-1)[0]; return W.mirror.slice(-1)[0].page === 'They argued. They made up. Someone brought soup.' && c.includes('other side of the same glass') && c.includes('Something happened'); })()`), 'after the written pages, the model keeps going in the same voice about what really happened');
  ok(await E(`(() => { sheet.hidden = false; showTab('diary'); const t = $('#pane-diary').textContent; return t.includes('The Mirror') && t.includes('Read all'); })()`), 'the Diary shows the newest page, with the rest a tap away');
  await page.locator('[data-mirrorall]').click();
  ok(await E(`$('#pane-diary').textContent.includes(MIRROR_PAGES[0][1].slice(0, 40))`), 'tapping shows every page');
  ok(await E(`(() => { brainCfg.key = ''; for (let i = 0; i < 300; i++) step(0.2); return W.people.every((p) => Number.isFinite(p.x)); })()`), 'a busy stretch runs clean');
} finally {
  if (errors.length) { console.log(' FAIL  page errors:\n   ' + errors.join('\n   ')); failed++; }
  await browser.close();
}
if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\ninner lives: all good');
