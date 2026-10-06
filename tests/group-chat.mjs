// npm test
// The Outside clock, writing in the group chat, and long texts that are never cut.
// The model is replaced by a stand-in here, so no real calls are made.
import { openGame, OUT } from './lib.mjs';
import { join } from 'node:path';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond === true ? '  ok ' : ' FAIL'}  ${what}${cond === true || cond === false ? '' : ` (${cond})`}`); if (cond !== true) failed++; };

const { browser, page, E, errors } = await openGame({ width: 420, height: 820 });
try {
  await E(`(() => { W.meeting = null; W.meetingDay = W.day; W.t = 0.3; W.weather = 'clear'; cfg.cutscenes = false; W.event = null; W.people.forEach((q) => { q.inside = false; }); })()`);
  const LONG = 'so here is the thing. '.repeat(30) + 'the end.';
  await E(`(() => {
    brainCfg.key = 'test-key'; aiDown = ''; window.__calls = [];
    llm = async (input, opts = {}) => {
      const text = typeof input === 'string' ? input : input.map((m) => m.content).join('\\n');
      window.__calls.push(text);
      if (/next message in the group chat/.test(text)) { const who = /Write (.+?)'s next message/.exec(text)[1]; return { text: who + ' here. ' + ${JSON.stringify(LONG)}, thought: 'wow' }; }
      if (/"lines"/.test(text)) return { lines: {} };
      return { say: ${JSON.stringify(LONG)}, thought: '', action: 'chat' };
    };
  })()`);

  // the Outside clock
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  ok(await E(`outsideClockContext().includes(${JSON.stringify(today)}) && outsideClockContext().includes('${new Date().getFullYear()}')`), 'the Outside clock reads the real weekday and year');
  ok(await E(`(async () => { const [a, b] = W.people.filter((q) => q.grow >= 1); await aiLine(a, b, [], 'test'); return window.__calls.slice(-1)[0].includes('THE OUTSIDE CLOCK') && window.__calls.slice(-1)[0].includes(${JSON.stringify(today)}); })()`), 'residents are told the day and time in The Outside when they talk');

  // long texts are kept whole
  ok(await E(`(async () => { const [a, b] = W.people.filter((q) => q.grow >= 1 && !q.visitor); const t = await aiText(a, b, { kind: 'plans' }, [], false); const m = postText(a, b.id, t, 'chat'); return m.text.length > 600 || m.text.length; })()`), 'a long text from the model is saved whole');

  // the group chat
  await E(`(() => { sheet.hidden = false; showTab('texts'); textThread = null; refreshPanel(true); })()`);
  ok(await page.locator('#pane-texts .who', { hasText: 'group chat' }).count() >= 1, 'the group chat is in the Texts list');
  await page.locator('#pane-texts .who', { hasText: 'group chat' }).first().click();
  const box = page.locator('#groupChatInput');
  ok(await box.isVisible(), 'the group chat has a box to write in');
  await box.click();
  await box.fill('half typed');
  await E(`(() => { const p = W.people.find((q) => !q.visitor && q.grow >= 1); postText(p, 'town', 'anyone up?', 'group'); refreshPanel(false); })()`);
  ok(await E(`document.activeElement.id === 'groupChatInput' && document.activeElement.value === 'half typed' && $('#pane-texts .chat').textContent.includes('anyone up')`), 'a new message shows while typing, and what you typed stays');
  await E(`(() => { $('#pane-texts').dataset.view = ''; refreshPanel(true); })()`);
  ok(await E(`$('#groupChatInput').value === 'half typed'`), 'a full redraw puts your draft back');

  const red = await E(`(() => { const p = W.people.find((q) => !q.away && !q.visitor && q.grow >= 1 && chatCanReply(q)); window.__named = p.id; return p.name; })()`);
  await box.fill(`hi everyone!! ${red}, how was your day?`);
  await box.press('Enter');
  ok(await E(`(() => { const m = W.texts.slice(-1)[0]; return m.from === 'creator' && m.to === 'town' && m.text.includes('how was your day') && $('#groupChatInput').value === ''; })()`), 'Enter sends it as you, and the box empties');
  ok(await E(`[...document.querySelectorAll('#pane-texts .msg.you')].some((e) => e.textContent.includes('how was your day'))`), 'your message shows on your side of the chat');
  await page.waitForFunction((id) => window.__g.ev(`(W.texts || []).some((m) => m.to === 'town' && m.from === '${id}' && m.text.includes('here.'))`), await E('window.__named'), { timeout: 60000 });
  ok(await E(`(() => { const m = W.texts.find((x) => x.to === 'town' && x.from === window.__named && x.text.includes('here.')); return m.text.length > 600 || m.text.length; })()`), 'the resident you named answers, and their long reply is not cut');
  ok(await E(`window.__calls.some((c) => /next message in the group chat/.test(c) && c.includes('THE OUTSIDE CLOCK') && c.includes('how was your day') && c.includes('never cheat'))`), 'their prompt has the chat, the Outside clock and the safety rules');
  ok(await E(`(person(window.__named).today || []).some((m) => m.tag === 'creatorChat')`), 'they remember the Creator wrote to them');
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, 'group-chat.png') });

  // no key: someone still answers
  await E(`(() => { brainCfg.key = ''; window.__n = W.texts.length; send({ t: 'groupchat', text: 'testing testing' }); })()`);
  await page.waitForFunction(() => window.__g.ev(`W.texts.slice(window.__n).some((m) => m.from !== 'creator' && m.to === 'town')`), null, { timeout: 30000 });
  ok(true, 'without a key, someone still answers in the group chat');
  ok(await E(`(() => { const d = JSON.stringify(W); return d.includes('testing testing'); })()`), 'your messages save with the town');
} finally {
  if (errors.length) { console.log(' FAIL  page errors:\n   ' + errors.join('\n   ')); failed++; }
  await browser.close();
}
if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\ngroup chat: all good');
