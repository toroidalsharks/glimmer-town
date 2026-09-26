// ============================================================
// THE TOWN RECORD: a written log of who dated, married, split up,
// and every crime, trial and verdict, so the minds stop forgetting
// ============================================================
// W.records is a plain array, oldest first. Each entry:
//   { id: 'r12', day: 14, at: 1790000000000, kind: 'married',
//     who: ['p3', 'p7'], names: ['Red', 'Tim'], text: 'Red and Tim got married at the fountain.' }
// day is the game day (null for things that happened before the record began), at is real
// time in ms, who holds resident ids and names holds their names at the time (ids can
// vanish when someone dies or leaves). kind is one of TOWN_RECORD_KINDS (trend and freeze come from 515-social-currents.js). The text is a
// full sentence written by the game, never by a model, so it is safe to show and to feed
// back into prompts. Other features (the relationship chart, the paper) can read it with
// townRecordFor(pid) and townRecordText(entry).
const TOWN_RECORD_KINDS = {
  dating: '💕', engaged: '💍', married: '💒', separated: '💔', breakup: '💔', divorce: '💔', admirer: '💌', cheating: '🤫',
  crime: '🚨', verdict: '⚖', acquitted: '⚖', exonerated: '🆕', court: '⚖', trend: '📣', freeze: '🧊', tradition: '🎏', memorial: '🕯',
  born: '👶', grewup: '🌱', arrival: '⛴', job: '💼', released: '🔓', exiled: '⛴', achievement: '🏅', role: '🔎',
  friends: '🤝', madeup: '🕊', rejected: '💔', fight: '💢', defended: '🛡', uproar: '🔥', party: '🎉', club: '🧩',
  discovery: '🌐', strike: '✊', meeting: '🗳', built: '🏗',
};
// small everyday things are dropped first when the record gets long, and read last
const TOWN_RECORD_MINOR = new Set(['friends', 'madeup', 'rejected', 'fight', 'defended', 'uproar', 'party', 'club', 'discovery', 'role', 'strike', 'meeting', 'built', 'court', 'trend']);
const TOWN_RECORD_LOVE = new Set(['dating', 'engaged', 'married', 'separated', 'breakup', 'divorce', 'admirer', 'cheating']);
const TOWN_RECORD_MAX = 320;
function townRecord(kind, ids, text, day = W.day) {
  if (!W || !text) return null;
  W.records = W.records || [];
  const who = [...new Set((ids || []).filter(Boolean))];
  const e = { id: 'r' + ((W.recordSeq = (W.recordSeq || 0) + 1)), day, at: Date.now(), kind, who, names: who.map((id) => person(id)?.name || null), text: String(text).slice(0, 220) };
  W.records.push(e);
  // over the cap, everyday things go first, then the rest; who married whom is kept longest
  while (W.records.length > TOWN_RECORD_MAX) {
    let i = W.records.findIndex((r) => TOWN_RECORD_MINOR.has(r.kind));
    if (i < 0) i = W.records.findIndex((r) => !TOWN_RECORD_LOVE.has(r.kind));
    W.records.splice(i >= 0 ? i : 0, 1);
  }
  markDirty();
  return e;
}
const townRecordFor = (pid) => (W.records || []).filter((r) => r.who.includes(pid));
function recordDayText(day) {
  if (day == null || day < 1) return 'Before the record began';
  return `Day ${day} (${dateText(yearDay(day))}, year ${Math.floor((day - 1) / YEAR) + 1})`;
}
const townRecordText = (r) => `${recordDayText(r.day)}: ${r.text}`;
// the part of the record one resident should know, for their prompt
function townRecordContext(me, them) {
  const all = W.records || []; if (!all.length) return '';
  const pickd = new Set();
  // how the current relationship started, however long ago
  if (me.partner) {
    const start = all.filter((r) => r.who.includes(me.id) && r.who.includes(me.partner) && ['dating', 'married'].includes(r.kind));
    for (const r of start.slice(-2)) pickd.add(r);
  }
  const mine = all.filter((r) => r.who.includes(me.id));
  for (const r of mine.filter((r) => !TOWN_RECORD_MINOR.has(r.kind)).slice(-12)) pickd.add(r);
  for (const r of mine.filter((r) => TOWN_RECORD_MINOR.has(r.kind)).slice(-5)) pickd.add(r);
  if (them) for (const r of all.filter((r) => r.who.includes(them.id) && !r.who.includes(me.id)).slice(-4)) pickd.add(r);
  for (const r of all.filter((r) => ['verdict', 'acquitted', 'exonerated', 'married', 'divorce'].includes(r.kind) || (r.kind === 'crime' && r.big)).slice(-4)) pickd.add(r);
  const lines = all.filter((r) => pickd.has(r)).map((r) => `- ${townRecordText(r)}`);
  return `\nTHE TOWN RECORD (written down at the time, so these are true; trust them over your own memory, and don't contradict them. Today is ${recordDayText(W.day).toLowerCase()}):\n${lines.join('\n')}`;
}
// a readable list for the Court tab
function townRecordHtml() {
  const all = (W.records || []).slice().reverse();
  if (!all.length) return '';
  return `<details class="creator"><summary><b>📜 The town record</b> <span class="hint">(${all.length} ${all.length === 1 ? 'entry' : 'entries'})</span></summary>
    <p class="hint">Written down as it happens: dating, weddings, breakups, crimes, trials and verdicts. Residents read the parts about them before they talk.</p>
    ${all.slice(0, 60).map((r) => `<p class="note"><span class="chip">${r.day == null ? 'earlier' : `day ${r.day}`}</span> ${TOWN_RECORD_KINDS[r.kind] || '•'} ${esc(r.text)}</p>`).join('')}</details>`;
}
// old saves: write down what the world already knows, once
function townRecordBoot() {
  W.added = W.added || {}; if (W.added.townRecord) return; W.added.townRecord = true;
  W.records = W.records || [];
  const back = [], seen = new Set();
  const add = (kind, ids, text, day, extra) => back.push({ kind, ids, text, day: day ?? null, ...extra });
  for (const p of W.people) {
    const q = p.partner && person(p.partner); if (!q) continue;
    const key = [p.id, q.id].sort().join('|'); if (seen.has(key)) continue; seen.add(key);
    if (p.married) add('married', [p.id, q.id], `${p.name} and ${q.name} are married.`, null);
    else add('dating', [p.id, q.id], `${p.name} and ${q.name} started dating.`, p.datingSince);
  }
  const S = W.crime;
  for (const C of S?.list || []) {
    const K = CRIME_TYPES[C.type]; if (!K) continue;
    if (C.tier >= 1 && C.discovered) add('crime', [C.victim], `${K.label}: ${C.headline}`, C.discovered, { big: C.tier >= 2 });
    if (C.verdict === 'revealed') add('admirer', [C.culprit, C.victim], `The secret admirer turned out to be ${nameOf(C.culprit)}, for ${C.victimName}.`, C.verdictDay);
    else if (C.convicted && C.verdictDay) add('verdict', [C.convicted, C.victim], `${nameOf(C.convicted)} was found guilty of ${K.label.toLowerCase()}${C.sentence ? ` and got ${C.sentence}` : ''}.`, C.verdictDay);
    for (const id of C.acquitted || []) if (person(id) && C.verdictDay) add('acquitted', [id, C.victim], `${nameOf(id)} was cleared in the ${K.label.toLowerCase()} case.`, C.verdictDay);
  }
  for (const c of W.cases || []) if (c.status === 'closed' && c.ruled && c.result && c.kind !== 'license') add(c.kind === 'divorce' && c.choice === 'grant' ? 'divorce' : 'court', [c.p, c.d], `${caseTitle(c)}: ${c.result}`, c.ruled);
  back.sort((x, y) => (x.day ?? -1) - (y.day ?? -1));
  for (const b of back) { const e = townRecord(b.kind, b.ids, b.text, b.day); if (e && b.big) e.big = true; }
  if (typeof logUpdate === 'function') logUpdate('build', 'The town keeps a written record now. Every date, engagement, wedding, breakup and divorce goes in it, along with every crime, trial and verdict. Residents read the parts about themselves and whoever they are talking to before they speak, so they stop forgetting who they married or how the last trial went. You can read it at the bottom of the Court tab. I also filled it in with what the town already knew.', 'the town record');
}

// ---------- the diary is read as it's written, and the big moments go in the record ----------
// Love, crime and court already write their own entries next to their diary lines, so they
// aren't matched here. The first pattern that fits decides the kind.
const DIARY_RECORD = [
  ['born', /was born to /], ['grewup', /grew up and started work/], ['arrival', /moved into room|stepped off the ferry and moved/],
  ['exiled', /was banished/], ['released', /walked out of Glimmer Hall/],
  ['job', /got hired as|quit being a .* and became|started work as|started work at Glimmer Labs/],
  ['achievement', /did what they set out to do|shipped .* at Glimmer Labs|at Glimmer Labs and named it|finished designing/],
  ['discovery', /found the Outside/], ['role', /is the island's detective now/],
  ['friends', /to be friends, and they said yes/], ['madeup', /apologized to .*They made up/],
  ['rejected', /confessed to .*said no|proposed to .*not ready yet/],
  ['fight', /got into a (fight|scuffle)|confronted .*It got loud/], ['defended', /stepped in and stood up for/],
  ['uproar', /An uproar broke out/], ['party', /threw a party/], ['club', /started the .* with /], ['strike', /Strike!/],
  ['meeting', /The town agreed to build|convinced the town/], ['built', /The town finished /],
];
const DIARY_RECORD_ANY = new RegExp(DIARY_RECORD.map(([, re]) => re.source).join('|'));
function diaryPlain(html) { return String(html || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim(); }
function diaryRecordKind(text) {
  if (!DIARY_RECORD_ANY.test(text)) return null;
  for (const [k, re] of DIARY_RECORD) if (re.test(text)) return k;
  return null;
}
function namesIn(text) {
  const ids = [];
  for (const p of W.people) { const n = p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); if (n.length > 1 && new RegExp(`\\b${n}\\b`).test(text)) ids.push(p.id); }
  return ids;
}
function recordFromDiary(html, day = W.day) {
  if (!W || MODE !== 'host') return null;
  const text = diaryPlain(html).replace(/^[^\p{L}\p{N}"]+/u, ''), kind = diaryRecordKind(text); if (!kind) return null;
  if ((W.records || []).some((r) => r.kind === kind && r.day === day && r.text === text)) return null;
  return townRecord(kind, namesIn(text), text.slice(0, 220), day);
}
// old saves: the last couple hundred diary lines are still there, so read them once
function townRecordDiaryBoot() {
  W.added = W.added || {}; if (W.added.townRecord2) return; W.added.townRecord2 = true;
  const before = (W.records || []).length;
  for (const l of W.log || []) recordFromDiary(l.text, l.day);
  W.records = (W.records || []).sort((a, b) => (a.day ?? -1) - (b.day ?? -1));
  const n = W.records.length - before;
  if (typeof logUpdate === 'function') logUpdate('build', `The town record keeps a lot more now: births, people moving in, new jobs, people leaving jail or getting banished, big achievements, new friendships, making up, fights, parties, clubs, uproars, strikes and what the town meeting decided. Residents read more of their own history before they talk, and the big moments always come first.${n ? ` I went back through the diary and added ${n} older ${n === 1 ? 'moment' : 'moments'} too.` : ''}`, 'a longer town record');
}
