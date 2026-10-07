// ============================================================
// THE TEXT ARCHIVE: every text ever sent in town, kept on the box, and residents remember theirs
// ============================================================
// W.texts keeps only the latest 400 (it syncs and saves with the town). Every text also goes
// into IndexedDB on the box, which keeps them all. When a resident talks, texts or answers the
// group chat, they recall their texts with that person, the latest group chat, and older texts
// of theirs that match what's being talked about. Residents only know texts they were part of,
// the group chat from the day they arrived, and texts someone showed them on their phone.
const TXA_DB = `glimmer-texts-${ISLE}`;
const TXA = { db: null, ready: null, seq: 0, failed: false, pending: [] };
function txaOpen() {
  if (TXA.ready) return TXA.ready;
  TXA.ready = new Promise((res) => {
    try {
      const rq = indexedDB.open(TXA_DB, 1);
      rq.onupgradeneeded = () => {
        const st = rq.result.createObjectStore('texts', { keyPath: 'seq' });
        st.createIndex('id', 'id', { unique: true });
        st.createIndex('pair', 'pair');
        st.createIndex('who', 'who', { multiEntry: true });
      };
      rq.onsuccess = () => { TXA.db = rq.result; res(TXA.db); };
      rq.onerror = () => { TXA.failed = true; res(null); };
      rq.onblocked = () => { TXA.failed = true; res(null); };
    } catch (e) { TXA.failed = true; res(null); }
  });
  try { navigator.storage?.persist?.(); } catch (e) {}
  return TXA.ready;
}
function txaRow(m) {
  TXA.seq = Math.max(TXA.seq + 1, Date.now() * 1000);
  return { seq: TXA.seq, id: m.id, from: m.from, fromName: m.fromName, to: m.to, text: String(m.text || ''), day: m.day, t: m.t, at: Date.now(), pair: textThreadKey(m.from, m.to), who: [m.from, m.to].filter((x) => x && x !== 'creator') };
}
// called for every new text, on the box
function archiveText(m) {
  if (MODE !== 'host' || !m || !m.id) return;
  TXA.pending.push(txaRow(m));
  if (TXA.pending.length === 1) setTimeout(txaFlush, 400);
}
async function txaFlush() {
  const db = await txaOpen(); const rows = TXA.pending.splice(0);
  if (!db || !rows.length) return;
  try { const tx = db.transaction('texts', 'readwrite'), st = tx.objectStore('texts'); for (const r of rows) { const a = st.add(r); a.onerror = (e) => { e.preventDefault(); e.stopPropagation(); }; } } catch (e) {}
}
// texts already in the town when this arrived go in once (anything older than the last 400 was already gone)
async function txaSeed() {
  if (MODE !== 'host' || !W) return;
  const db = await txaOpen(); if (!db) return;
  const have = await new Promise((res) => { try { const rq = db.transaction('texts').objectStore('texts').index('id').getAllKeys(); rq.onsuccess = () => res(new Set(rq.result)); rq.onerror = () => res(new Set()); } catch (e) { res(new Set()); } });
  for (const m of W.texts || []) if (m.id && !have.has(m.id) && !TXA.pending.some((r) => r.id === m.id)) { TXA.pending.push(txaRow(m)); }
  await txaFlush();
}
// newest first, from one index value, at most n (filter optional)
function txaScan(index, value, n, filter, maxScan = 20000) {
  return txaOpen().then((db) => new Promise((res) => {
    const out = []; let seen = 0;
    if (!db) return res(null);
    try {
      const rq = db.transaction('texts').objectStore('texts').index(index).openCursor(IDBKeyRange.only(value), 'prev');
      rq.onsuccess = () => { const c = rq.result; if (!c || out.length >= n || seen++ >= maxScan) return res(out); if (!filter || filter(c.value)) out.push(c.value); c.continue(); };
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  }));
}
const TXA_STOP = new Set('that this with have what your just like they them there their about would could from were been when then than into some will dont cant wont youre thats its know think really want going said says okay yeah also well very much more here even only over back after before still because which while where these those since lol tbh'.split(' '));
function txaWords(s) { return [...new Set(String(s || '').toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, ' ').split(' ').filter((w) => w.length >= 4 && !TXA_STOP.has(w)))].slice(0, 40); }
function txaGet(id) {
  return txaOpen().then((db) => new Promise((res) => {
    if (!db) return res((W.texts || []).find((m) => m.id === id) || null);
    try { const rq = db.transaction('texts').objectStore('texts').index('id').get(id); rq.onsuccess = () => res(rq.result || (W.texts || []).find((m) => m.id === id) || null); rq.onerror = () => res(null); } catch (e) { res(null); }
  }));
}
function txaLine(m, me) {
  if (m.shownBy) return `- day ${m.day}, ${m.from === 'creator' ? 'The Creator' : m.fromName} to ${person(m.to)?.name || 'someone'} (${person(m.shownBy)?.name || 'someone'} showed you this on their phone): ${fitLine(m.text, 500)}`;
  const from = m.from === 'creator' ? 'The Creator' : m.from === me.id ? 'You' : m.fromName;
  const to = m.to === 'town' ? 'the group chat' : m.to === me.id ? 'you' : (person(m.to)?.name || 'someone');
  return `- day ${m.day}, ${from} to ${to}: ${fitLine(m.text, 500)}`;
}
// what this resident remembers from their phone right now (them: who they're with, or null)
async function textRecall(me, them, hint = '', opts = {}) {
  if (!me || !W) return '';
  const pair = them && them.id !== me.id ? textThreadKey(me.id, them.id) : null;
  // the group chat only from the day they arrived in town
  const since = me.bornDay || 0, inTown = (m) => m.to !== 'town' || (m.day ?? 0) >= since;
  let mine = pair ? await txaScan('pair', pair, 16) : [];
  let town = opts.noTown ? [] : await txaScan('pair', 'town', 10, inTown);
  const words = txaWords(`${hint} ${them ? them.name : ''}`);
  const score = (m) => { const t = ` ${String(m.text).toLowerCase()} `; return words.reduce((s, w) => s + (t.includes(w) ? (w.length > 6 ? 2 : 1) : 0), 0); };
  const shown = new Set([...(mine || []), ...(town || []), ...(opts.skip || [])].map((m) => m.id || m));
  // older texts: the ones that match what's being talked about, from all of them; or else the latest few
  const match = (m) => !shown.has(m.id) && inTown(m) && score(m) > 0;
  let older = words.length ? await txaScan('who', me.id, 60, match) : [];
  const oldTown = words.length && older && (!opts.noTown || opts.townMatch) ? await txaScan('pair', 'town', 30, match) : [];
  if (older && oldTown) older = [...new Map([...older, ...oldTown].map((m) => [m.id, m])).values()].sort((a, b) => b.seq - a.seq);
  if (older && !pair && !older.length) older = await txaScan('who', me.id, 6, (m) => !shown.has(m.id) && inTown(m));
  if (mine === null || town === null || older === null) { // no archive on this phone: use what the town has
    const T = W.texts || [];
    mine = pair ? T.filter((m) => textThreadKey(m.from, m.to) === pair).slice(-16).reverse() : [];
    town = opts.noTown ? [] : T.filter((m) => m.to === 'town' && inTown(m)).slice(-10).reverse();
    const s2 = new Set([...mine, ...town].map((m) => m.id));
    const rest = T.filter((m) => (m.from === me.id || m.to === me.id || m.to === 'town') && inTown(m) && !s2.has(m.id)).reverse();
    older = rest.filter((m) => score(m) > 0); if (!pair && !older.length) older = rest.slice(0, 6);
  }
  const pick2 = older.map((m, i) => [m, score(m), i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).slice(0, 6).sort((a, b) => b[2] - a[2]).map((x) => x[0]);
  // texts other people showed them: they know those too, and who showed them
  const seenTx = [];
  for (const x of (me.shownTexts || []).slice(-30)) { const m = await txaGet(x.id); if (m && !shown.has(m.id) && (score(m) > 0 || (them && (m.from === them.id || x.by === them.id)))) seenTx.push({ ...m, shownBy: x.by }); }
  const part = (title, L) => (L.length ? `\n${title}:\n${L.slice().reverse().map((m) => txaLine(m, me)).join('\n')}` : '');
  const body = part(them && pair ? `YOUR TEXTS WITH ${them.name.toUpperCase()} (oldest first)` : '', mine) + part('THE GROUP CHAT LATELY', town) + part('OLDER TEXTS YOU REMEMBER THAT FIT', pick2) + part('TEXTS SOMEONE SHOWED YOU', seenTx.slice(-3).reverse());
  return body ? `\nYOUR PHONE: you remember every text you ever sent or got, and the group chat since you arrived. You only know other people's private texts if someone showed you. Bring one up only when it fits.${body}` : '';
}
// the same idea without the archive, for prompts built on the remote (it only has the town's texts)
function textRecallSync(me, n = 10) {
  const T = (W.texts || []).filter((m) => m.from === me.id || m.to === me.id || (m.to === 'town' && (m.day ?? 0) >= (me.bornDay || 0))).slice(-n);
  return T.length ? `\nYOUR PHONE LATELY (you remember every text):\n${T.map((m) => txaLine(m, me)).join('\n')}` : '';
}
