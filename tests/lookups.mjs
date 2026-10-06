// npm test
// Looking things up: residents search the Outside when something makes them curious, read a
// filtered summary, react, follow rabbit holes, and keep what hooked them.
// The model and Wikipedia are replaced by stand-ins here, so no real calls are made.
import { openGame } from './lib.mjs';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond === true ? '  ok ' : ' FAIL'}  ${what}${cond === true || cond === false ? '' : ` (${cond})`}`); if (cond !== true) failed++; };

const { browser, page, E, errors } = await openGame();
try {
  await E(`(() => {
    W.meeting = null; W.meetingDay = W.day; W.t = 0.3; cfg.cutscenes = false; W.event = null; cfg.outside = true;
    W.outsideFound = { by: W.people[0].id, name: W.people[0].name, day: W.day };
    brainCfg.key = 'test-key'; aiDown = ''; brainCfg.voices = true; window.__calls = []; window.__urls = [];
    getJSON = async (url) => {
      window.__urls.push(url);
      if (/list=search/.test(url)) { const q = decodeURIComponent(/srsearch=([^&]+)/.exec(url)[1]); return { query: { search: [{ title: /octopus/i.test(q) ? 'Octopus' : 'Lighthouse' }] } }; }
      const t = decodeURIComponent(url.split('/summary/')[1] || '').replace(/_/g, ' ');
      return { title: t, type: 'standard', extract: t === 'Octopus' ? 'An octopus has eight arms and three hearts, and it can change the color of its skin in a fraction of a second.' : 'A lighthouse is a tower with a bright lamp that guides ships at night along dangerous coasts.' };
    };
    llm = async (input, opts = {}) => {
      const text = typeof input === 'string' ? input : input.map((m) => m.content).join('\\n');
      window.__calls.push(text);
      if (/What do they look up right now/.test(text)) return { q: 'lighthouses', why: 'the pier light' };
      if (/is reading this/.test(text)) return /Octopus:/.test(text) ? { react: 'THREE hearts??', takeaway: 'Octopuses have three hearts and change color in a blink.', hooked: 3, next: 'octopus camouflage', tell: null, post: null } : { react: 'Huh, neat.', takeaway: 'Lighthouses guide ships at night.', hooked: 1, next: null, tell: null, post: null };
      return { say: 'Did you know octopuses have three hearts?', thought: '', action: 'chat', look_up: 'octopus hearts' };
    };
  })()`);
  const P = `person(window.__p)`;
  await E(`(() => { const p = W.people.find((q) => !isRealish(q) && q.grow >= 1 && !q.visitor && canLookUp(q)); window.__p = p.id; p.toLookUp = []; p.browsed = []; p.curious = []; p.interests = 'baking'; })()`);

  ok(await E(`(async () => { const p = ${P}, o = W.people.find((q) => q !== p && q.grow >= 1); await aiLine(p, o, [], 'You run into them.'); return window.__calls.slice(-1)[0].includes('look_up') && (p.toLookUp || []).some((x) => x.q === 'octopus hearts') || JSON.stringify(p.toLookUp); })()`), 'something that comes up in a conversation goes on their list to look up');
  ok(await E(`(async () => { const p = ${P}; const r = await lookUp(p); const b = (p.browsed || []).slice(-1)[0]; return r && b && b.title === 'Octopus' && !(p.toLookUp || []).some((x) => x.q === 'octopus hearts') || JSON.stringify(b); })()`), 'they look it up and read a summary');
  ok(await E(`(() => { const p = ${P}; return (p.curious || []).some((c) => c.topic === 'Octopus') && (p.toLookUp || []).some((x) => x.q === 'octopus camouflage') && (p.today || []).some((m) => m.tag === 'lookup' && m.text.includes('three hearts')); })()`), 'what hooks them is kept, the rabbit hole goes on the list, and they remember it');
  ok(await E(`(async () => { const p = ${P}; await lookUp(p); return /octopus/.test(p.interests) || p.interests; })()`), 'hooked twice on the same thing, it becomes one of their interests');
  ok(await E(`(async () => { const p = ${P}; p.toLookUp = []; const r = await lookUp(p); const b = p.browsed.slice(-1)[0]; return r && b.title === 'Lighthouse' && b.why === 'the pier light' || JSON.stringify(b); })()`), 'with nothing on their list, they look up something of their own');
  ok(await E(`(async () => { const p = ${P}, o = W.people.find((q) => q !== p && q.grow >= 1); await aiLine(p, o, [], 'You run into them.'); const c = window.__calls.slice(-1)[0]; return c.includes("WHAT YOU'VE BEEN LOOKING UP") && c.includes('three hearts') && c.includes('WHAT HAS YOUR CURIOSITY LATELY'); })()`), 'what they read and what has their curiosity goes into their conversations');
  ok(await E(`(() => { const p = ${P}; const n = (p.toLookUp || []).length; wantLookUp(p, 'gun shop', 'x'); wantLookUp(p, 'nude beach', 'x'); return (p.toLookUp || []).length === n; })()`), 'searches go through the same filters as the Outside feed');
  ok(await E(`(async () => { cfg.outside = false; const p = ${P}; p.toLookUp = [{ q: 'kites', why: '', day: W.day }]; nextLookAt = 0; const n = window.__urls.length; lookTick(); await sleep(300); const r = window.__urls.length === n; cfg.outside = true; return r; })()`), 'with the Outside switched off in the Web tab, nobody looks anything up');
  ok(await E(`(() => { openDetail = window.__p; sheet.hidden = false; showTab('people'); return $('#pane-people').textContent.includes('Looked up lately') && $('#pane-people').textContent.includes('Curious about'); })()`), "their page shows what they've looked up and what they're curious about");
  ok(await E(`(async () => { brainCfg.key = ''; const p = ${P}; p.toLookUp = []; p.curious = [{ topic: 'Octopus', n: 2, day: W.day }]; const r = await lookUp(p); brainCfg.key = 'test-key'; return r === true; })()`), 'without a key, they still follow what already hooked them');
  ok(await E(`(() => { const c = () => (W.updates || []).filter((u) => /look things up/.test(u.text)).length; W.added.lookups1 = false; const n = c(); lookupsBoot(); lookupsBoot(); return c() === n + 1; })()`), 'old towns hear about it once');
} finally {
  if (errors.length) { console.log(' FAIL  page errors:\n   ' + errors.join('\n   ')); failed++; }
  await browser.close();
}
if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\nlookups: all good');
