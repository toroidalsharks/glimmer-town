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
  ok(await E(`window.__calls.some((c) => /next message in the group chat/.test(c) && c.includes('HOW TO TALK TO THE CREATOR') && c.includes('No worship') && c.includes('Match their length'))`), 'they are told to text you like a person in the chat: short, casual, no worship');
  ok(await E(`window.__calls.some((c) => /next message in the group chat/.test(c) && /WHAT THE CREATOR JUST SAID: "hi everyone!!.*how was your day\\?"/.test(c) && c.includes('Answer what the Creator just said') && c.includes('Never call them he or she') && c.includes("Don't invent things about them"))`), 'their prompt points at what you just said, and they are told not to make things up about you');
  ok(await E(`(() => { const T = [{ to: 'town', from: 'creator', text: 'go crazy!' }, { to: 'town', from: 'x', text: 'plaza tho' }, { to: 'town', from: 'creator', text: 'huh..?' }]; return chatCreatorSaid(T) === '"huh..?"' && chatCreatorSaid(T.slice(0, 2)) === '"go crazy!"'; })()`), 'a reply answers your newest message');
  ok(await E(`(async () => {
    const q = W.people.find((x) => chatCanReply(x)), was = { ...aiStats }, k = brainCfg.key, l = llm;
    creatorGroupPost('its my birthday, you guys forgot?'); chatRound++;
    const today = (() => { const d = new Date(); return (d.getMonth() + 1) + '-' + d.getDate(); })();
    aiStats.n = brainCfg.budget + 5; window.__calls.length = 0;
    await chatReplyLine(q); const used = window.__calls.some((c) => c.includes("TODAY IS THE CREATOR'S BIRTHDAY") && c.includes('its my birthday'));
    brainCfg.key = ''; const plain = await chatReplyLine(q);
    llm = async () => { throw { code: 'upstream_error' }; }; brainCfg.key = k; const failed = await chatReplyLine(q);
    llm = l; Object.assign(aiStats, was);
    return (W.creatorBirthday === today && used && /birthday|bday/i.test(plain) && /birthday|bday/i.test(failed)) || JSON.stringify({ b: W.creatorBirthday, used, plain, failed });
  })()`), 'your birthday is remembered, replies still use the model past the daily limit, and without one they still say happy birthday');
  ok(await E(`(() => { W.creatorChatAt = Date.now(); const n = W.texts.length; groupPost(W.people.find((q) => chatCanReply(q))); return W.texts.length === n; })()`), 'random group chatter waits while you are talking in the chat');
  ok(await E(`(() => { let most = 0; for (let i = 0; i < 30; i++) most = Math.max(most, chatRepliers('hi ' + person(window.__named).name + ', i ate soup').length); return most <= 2 || most; })()`), 'when you talk to one person, they answer and at most one other joins in');
  ok(await E(`(async () => {
    const was = llm; llm = async (input) => { const t = typeof input === 'string' ? input : input.map((m) => m.content).join('\\n'); window.__calls.push(t); return /starts a conversation with the Creator/.test(t) ? { text: 'how was the soup btw' } : { lines: {} }; };
    W.creatorChatAt = Date.now(); W.chatAskOpen = false; nextChatAskAt = 0; const n = W.texts.length;
    await creatorChatTick(); const first = W.texts.slice(-1)[0];
    nextChatAskAt = 0; await creatorChatTick(); const again = W.texts.slice(-1)[0];
    llm = was;
    return (first.to === 'town' && first.text === 'how was the soup btw' && again === first && W.chatAskOpen) || JSON.stringify(first);
  })()`), 'someone starts a conversation with you, and waits for your answer before starting another');
  ok(await E(`(() => { W.creatorChatAt = Date.now() - 48 * 3600e3; W.chatAskOpen = false; nextChatAskAt = 0; const n = W.texts.length; creatorChatTick(); return W.texts.length === n; })()`), "nobody starts one when you haven't been around for a while");
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, 'group-chat.png') });

  // every text is kept, and residents recall old ones that fit
  ok(await E(`(async () => {
    const [a, b] = W.people.filter((q) => q.grow >= 1 && !q.visitor && chatCanReply(q));
    window.__a = a.id; window.__b = b.id;
    voiceTrust('remember the purple walrus kite we lost at the pier');
    postText(a, b.id, 'remember the purple walrus kite we lost at the pier', 'chat');
    for (let i = 0; i < 450; i++) { const t = 'filler message number ' + i + ' about nothing much at all'; voiceTrust(t); postText(b, a.id, t, 'chat'); }
    await sleep(1500);
    const n = await new Promise((res) => { const rq = TXA.db.transaction('texts').objectStore('texts').count(); rq.onsuccess = () => res(rq.result); });
    return (!W.texts.some((m) => m.text.includes('walrus')) && n >= 451) || 'kept ' + n;
  })()`), 'the box keeps every text, past the 400 the town saves');
  ok(await E(`(async () => { const r = await textRecall(person(window.__a), null, 'that walrus kite'); return r.includes('purple walrus kite') || r.slice(0, 300); })()`), 'a resident recalls an old text that fits, even one the town no longer holds');
  ok(await E(`(async () => { await aiLine(person(window.__a), person(window.__b), [], 'You bump into them. The walrus kite comes to mind.'); const c = window.__calls.slice(-1)[0]; return c.includes('YOUR PHONE') && c.includes('purple walrus kite') && c.includes('filler message number 449'); })()`), 'when two residents talk, they remember their texts with each other');
  ok(await E(`textRecallSync(person(window.__a)).includes('filler message number 449')`), 'talking with you face to face, they know their latest texts');

  // texts stay private to the people in them
  ok(await E(`(async () => {
    const [a, b, c] = W.people.filter((q) => q.grow >= 1 && !q.visitor && chatCanReply(q));
    window.__c = c.id;
    voiceTrust('the secret pineapple plan is on for friday'); postText(a, b.id, 'the secret pineapple plan is on for friday', 'chat');
    await sleep(800);
    const before = await textRecall(c, null, 'pineapple plan');
    c.shownTexts = [{ id: W.texts.find((m) => m.text.includes('pineapple')).id, by: b.id }];
    const after = await textRecall(c, null, 'pineapple plan');
    c.shownTexts = [];
    return (!before.includes('pineapple') && after.includes('pineapple') && after.includes('showed you this')) || before.slice(0, 200) + ' || ' + after.slice(0, 200);
  })()`), "someone outside a private text doesn't know it, until it's shown to them");
  ok(await E(`(async () => {
    const c = person(window.__c), was = c.bornDay;
    voiceTrust('group chat note about the moonlit regatta'); postText(person(window.__a), 'town', 'group chat note about the moonlit regatta', 'group');
    await sleep(800);
    const inTown = await textRecall(c, null, 'moonlit regatta');
    c.bornDay = W.day + 1;
    const newcomer = await textRecall(c, null, 'moonlit regatta');
    c.bornDay = was;
    return (inTown.includes('moonlit regatta') && !newcomer.includes('moonlit regatta')) || 'in town: ' + inTown.includes('moonlit') + ', newcomer: ' + newcomer.includes('moonlit');
  })()`), 'the group chat is remembered only from the day they arrived');

  // no key: someone still answers
  await E(`(() => { brainCfg.key = ''; window.__n = W.texts.slice(-1)[0].id; send({ t: 'groupchat', text: 'testing testing' }); })()`);
  await page.waitForFunction(() => window.__g.ev(`W.texts.slice(W.texts.findIndex((m) => m.id === window.__n) + 1).some((m) => m.from !== 'creator' && m.to === 'town')`), null, { timeout: 30000 });
  ok(true, 'without a key, someone still answers in the group chat');
  ok(await E(`(() => { const d = JSON.stringify(W); return d.includes('testing testing'); })()`), 'your messages save with the town');
} finally {
  if (errors.length) { console.log(' FAIL  page errors:\n   ' + errors.join('\n   ')); failed++; }
  await browser.close();
}
if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\ngroup chat: all good');
