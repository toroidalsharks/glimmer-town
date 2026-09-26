// ============================================================
// THE TOWN RECORD: a written log of who dated, married, split up,
// and every crime, trial and verdict, so the minds stop forgetting
// ============================================================
// W.records is a plain array, oldest first. Each entry:
//   { id: 'r12', day: 14, at: 1790000000000, kind: 'married',
//     who: ['p3', 'p7'], names: ['Red', 'Tim'], text: 'Red and Tim got married at the fountain.' }
// day is the game day (null for things that happened before the record began), at is real
// time in ms, who holds resident ids and names holds their names at the time (ids can
// vanish when someone dies or leaves). kind is one of TOWN_RECORD_KINDS. The text is a
// full sentence written by the game, never by a model, so it is safe to show and to feed
// back into prompts. Other features (the relationship chart, the paper) can read it with
// townRecordFor(pid) and townRecordText(entry).
const TOWN_RECORD_KINDS = {
  dating: '💕', engaged: '💍', married: '💒', separated: '💔', breakup: '💔', divorce: '💔', admirer: '💌',
  crime: '🚨', verdict: '⚖', acquitted: '⚖', exonerated: '🆕', court: '⚖',
};
const TOWN_RECORD_LOVE = new Set(['dating', 'engaged', 'married', 'separated', 'breakup', 'divorce', 'admirer']);
const TOWN_RECORD_MAX = 200;
function townRecord(kind, ids, text, day = W.day) {
  if (!W || !text) return null;
  W.records = W.records || [];
  const who = [...new Set((ids || []).filter(Boolean))];
  const e = { id: 'r' + ((W.recordSeq = (W.recordSeq || 0) + 1)), day, at: Date.now(), kind, who, names: who.map((id) => person(id)?.name || null), text: String(text).slice(0, 220) };
  W.records.push(e);
  // over the cap, court and crime entries go first; who married whom is kept longest
  while (W.records.length > TOWN_RECORD_MAX) {
    const i = W.records.findIndex((r) => !TOWN_RECORD_LOVE.has(r.kind));
    W.records.splice(i >= 0 ? i : 0, 1);
  }
  markDirty();
  return e;
}
const townRecordFor = (pid) => (W.records || []).filter((r) => r.who.includes(pid));
function recordDayText(day) {
  if (day == null) return 'Before the record began';
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
  for (const r of all.filter((r) => r.who.includes(me.id)).slice(-8)) pickd.add(r);
  if (them) for (const r of all.filter((r) => r.who.includes(them.id) && !r.who.includes(me.id)).slice(-3)) pickd.add(r);
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
    ${all.slice(0, 40).map((r) => `<p class="note"><span class="chip">${r.day == null ? 'earlier' : `day ${r.day}`}</span> ${TOWN_RECORD_KINDS[r.kind] || '•'} ${esc(r.text)}</p>`).join('')}</details>`;
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
