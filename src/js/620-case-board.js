// ============================================================
// THE CASE BOARD (in the Court tab): clues, suspects, alibis,
// search / question / accuse, the cell, memorials, replays
// ============================================================
const swatch = (hex, label) => `<i title="${esc(label)}" style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${hex};border:1px solid rgba(255,255,255,.35);vertical-align:-1px;margin-right:3px"></i>`;
const SHOE_HEX = Object.fromEntries(Object.entries(SHOE_NAMES).map(([h, n]) => [n, h]));
function suspectRow(C, pid) {
  const p = person(pid), T = C.traits[pid]; if (!T) return '';
  const q = C.questioned[pid], canQ = MODE !== 'host' || !q || q.day !== W.day;
  const dead = !p && crimeState().deceased.some((d) => d.id === pid);
  return `<div class="note" style="display:flex;flex-direction:column;gap:4px">
    <div style="display:flex;justify-content:space-between;gap:6px;align-items:center;flex-wrap:wrap"><b>${esc(p?.name || nameOf(pid))}${p && jailed(p) ? ' 🔒' : ''}${dead ? ' 🕯' : ''}</b>
    <span class="hint" style="font-size:12px">that night: ${swatch(COLORS[T.shirt] || '#ccc', T.shirt)}${esc(T.shirt)} top · ${swatch(HAIR_COLORS[T.hair] || '#555', T.hair)}${esc(T.hair)} hair · ${swatch(SHOE_HEX[T.shoe] || '#fff', T.shoe)}${esc(T.shoe)} shoes · ${esc(T.build)} · ${esc(T.ears === 'none' ? 'no ears' : T.ears + ' ears')}</span></div>
    <div class="hint" style="font-size:12px">Evidence against them: <span style="color:var(--gold);letter-spacing:1px">${evidenceDots(C, pid)}</span> · ${esc(C.motives[pid] || '')}</div>
    ${q ? `<div style="font-size:13px">🗣 "${esc(q.alibi)}"${q.said ? ` <span class="hint">…${esc(q.said)}</span>` : ''}</div>` : ''}
    ${C.status === 'open' && p ? `<div class="btns"><button class="btn" type="button" data-crime="question" data-cid="${C.id}" data-pid="${pid}" ${canQ ? '' : 'disabled'} style="padding:3px 10px;font-size:12px">🗣 Question</button><button class="btn gold" type="button" data-crime="accuse" data-cid="${C.id}" data-pid="${pid}" style="padding:3px 10px;font-size:12px">${C.tier === 0 ? '💌 Is it them?' : '⚖ Accuse'}</button></div>` : ''}
  </div>`;
}
function crimeCard(C) {
  const K = CRIME_TYPES[C.type], found = C.clues.filter((c) => c.found), left = C.clues.length - found.length;
  const status = C.status === 'charged' || C.status === 'trial' ? `<span class="chip gold">${esc(nameOf(C.accused))} charged</span>` : C.status === 'cold' ? '<span class="chip">cold case</span>' : C.status === 'closed' ? `<span class="chip">${C.verdict === 'guilty' ? `${esc(nameOf(C.convicted))} convicted` : 'closed'}</span>` : '<span class="chip gold">open</span>';
  return `<div class="creator"><h3>${K.icon} ${esc(K.label)}${C.victimName ? ` · ${esc(C.victimName)}` : ''}</h3>
    <div class="chips"><span class="chip">case #${C.n}</span><span class="chip">day ${C.day}</span>${status}${C.acting && person(C.acting) ? `<span class="chip">🔎 acting detective: ${esc(nameOf(C.acting))}</span>` : ''}</div>
    <p>${esc(C.headline)}</p>
    <p class="label" style="margin-top:6px">Clues (${found.length}${left ? `, ${left} still out there` : ', all found'})</p>
    ${found.map((c) => { const f = fitsClue(C, c), [lab, tone] = clueLabel(c); return `<p class="note"${c.ruledOut ? ' style="opacity:.55"' : ''}><span class="chip ${tone}" style="font-size:10px;padding:1px 6px;margin-right:4px">${lab}</span>${c.icon || '•'} <span${c.ruledOut ? ' style="text-decoration:line-through"' : ''}>${esc(c.text)}</span>${f.length && !c.clears ? ` <span class="hint">fits: ${f.map((id) => esc(nameOf(id))).join(', ')}</span>` : c.clears ? ` <span class="hint">clears ${esc(nameOf(c.pid))}</span>` : ''}</p>`; }).join('') || '<p class="hint">Nothing yet.</p>'}
    ${C.status === 'open' ? `<div class="btns"><button class="btn" type="button" data-crime="search" data-cid="${C.id}" ${C.searchDay === W.day || !left ? 'disabled' : ''}>🔍 Search the scene${C.searchDay === W.day ? ' (tomorrow)' : ''}</button>${C.tier >= 1 ? `<button class="btn" type="button" data-crime="briefing" data-cid="${C.id}">🎬 Detective's briefing</button>` : ''}</div>` : ''}
    ${['charged', 'trial'].includes(C.status) && !trialsQueued.has(C.id) ? `<div class="btns"><button class="btn gold" type="button" data-crime="trialnow" data-cid="${C.id}">⚖ Hold the trial now</button></div>` : ''}
    <p class="label" style="margin-top:6px">Suspects</p>
    ${C.suspects.map((pid) => suspectRow(C, pid)).join('')}
    ${C.sentence ? `<p class="note">Sentence: ${esc(C.sentence)}</p>` : ''}
  </div>`;
}
function crimeBoardHtml() {
  const S = crimeState(), det = detectiveOf();
  const live = S.list.filter((C) => C.discovered && (['open', 'charged', 'trial', 'cold'].includes(C.status) || (C.verdictDay && W.day - C.verdictDay <= 3))).slice(-5).reverse();
  const cell = jailedPeople(), mem = S.memorials;
  const opts = W.people.filter((p) => adult(p) && !jailed(p)).map((p) => `<option value="${p.id}" ${det && det.id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  return `<div class="creator"><h3>🔎 Investigations</h3><p>Crimes leave clues that match real residents: the color of their clothes, hair, shoes, how tall they are, their ears. The detective finds a clue every morning. You can search the scene once a day, question each suspect once a day, and accuse whoever you think did it. Every charge goes to trial.</p>
    <div class="field"><label for="detSel">Island detective</label><select id="detSel">${opts}</select></div>
    <div class="field"><label for="paceSel">Murders</label><select id="paceSel">${Object.entries(MURDER_PACES).map(([k, l]) => `<option value="${k}" ${(S.murderPace || 'real') === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div></div>
    ${live.length ? live.map(crimeCard).join('') : '<p class="hint">No open cases. Suspiciously quiet.</p>'}
    ${cell.length ? `<p class="label">🔒 The cell under Glimmer Hall</p>${cell.map((p) => `<div class="note" style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>${esc(p.name)}</b>, ${esc(p.jail.label.toLowerCase())}, ${jailLeftText(p)}</span><span class="btns" style="margin:0"><button class="btn" type="button" data-crime="visit" style="padding:3px 10px;font-size:12px">Visit</button>${p.jail.nextHearing ? `<button class="btn" type="button" data-crime="parole" data-pid="${p.id}" style="padding:3px 10px;font-size:12px">Parole hearing</button>` : ''}<button class="btn" type="button" data-crime="pardon" data-pid="${p.id}" style="padding:3px 10px;font-size:12px">Pardon</button></span></div>`).join('')}` : ''}
    ${mem.length ? `<p class="label">🕯 Remembered</p>${mem.map((m) => `<p class="note">${esc(m.name)} <span class="hint">(day ${m.born} to day ${m.died})</span></p>`).join('')}` : ''}
    ${cutReplaysHtml()}`;
}
async function questionSuspect(C, p) {
  const guilty = C.culprit === p.id;
  const q = { day: W.day, alibi: C.alibis[p.id] || 'I was home.', said: '' };
  C.questioned[p.id] = q;
  q.said = guilty ? pick(['Why are you looking at me like that?', `Ask ${nameOf(pick(C.suspects.filter((id) => id !== p.id)))} where THEY were.`, 'I have nothing else to say.', 'Is this going to take long?']) : pick(['I didn\'t do it. I swear on the fountain.', 'You really think I could do something like that?', `Honestly? Talk to ${nameOf(pick(C.suspects.filter((id) => id !== p.id)))}.`, 'I want this solved more than anyone.']);
  remember(p, `The Creator questioned me about the ${CRIME_TYPES[C.type].label.toLowerCase()}.`, 2, 'questioned');
  if (aiReady() && aiBusy < 3) {
    try {
      const r = await llm(`You are ${p.name}, a villager in ${ISL.name}. ${String(p.selfNote || '').slice(0, 200)}
The Creator (the island's god-like player) is questioning you about a ${CRIME_TYPES[C.type].label.toLowerCase()}: ${C.headline}
Your alibi: "${q.alibi}". ${guilty ? `You DID do it (you ${C.why}). Lie. Stay calm but let a little nervousness slip.` : 'You did not do it. You are hurt that anyone suspects you.'}
In one or two short sentences, answer the Creator in your own voice. Talk only about how you feel and what kind of person you are. Do not mention any time, place, color, clothing, object or evidence, and do not name anyone except ${[p.id, ...C.suspects.filter((id) => id !== p.id), C.victim].filter(Boolean).map(nameOf).join(', ')}. Never invent facts. Reply with only JSON: {"say":"..."}`, { max: 160, temperature: 0.9 });
      if (r?.say && factSafe(r.say, [p.id, ...C.suspects, C.victim])) q.said = String(r.say).slice(0, 220);
    } catch (e) {}
  }
  markDirty(); if (activeTab === 'court') refreshPanel(true);
}
function crimeCmd(c) {
  const C = c.cid && crimeById(c.cid), p = c.pid && person(c.pid);
  switch (c.a) {
    case 'search': { if (!C || C.status !== 'open' || C.searchDay === W.day) return 'You already searched today.'; C.searchDay = W.day; const cl = revealClue(C, null); Sound.paper(); return cl ? `🔍 You found something: ${cl.text}` : 'Nothing new here.'; }
    case 'question': { if (!C || !p) return ''; if (C.questioned[p.id]?.day === W.day) return `You already talked to ${p.name} today.`; questionSuspect(C, p); return `You questioned ${p.name}.`; }
    case 'accuse': { if (!C || !p) return ''; if (C.tier === 0) return chargeCrime(C, p.id, null, true); if (C.clues.filter((x) => x.found).length < 2) return 'You need at least two clues before you accuse anyone.'; creatorShift(p, -0.6); return chargeCrime(C, p.id, null, true); }
    case 'trialnow': { if (!C || !['charged', 'trial'].includes(C.status)) return ''; if (trialsQueued.has(C.id)) return 'The trial is already on its way.'; crimeTrialNow(C); return 'The court is gathering.'; }
    case 'detective': { if (!p) return ''; crimeState().detective = p.id; remember(p, 'The Creator made me the island\'s detective.', 3, 'detective'); diary(`🔎 The Creator made <b>${esc(p.name)}</b> the island's detective.`); return `${p.name} is the detective now.`; }
    case 'pardon': { if (!p || !jailed(p)) return ''; releaseFromJail(p, 'pardon'); for (const q of W.people) if (q !== p && rand() < 0.5) creatorShift(q, rand() < 0.5 ? 0.1 : -0.2); return `You pardoned ${p.name}.`; }
    case 'parole': { if (!p || !jailed(p)) return ''; return paroleCut(p); }
    case 'briefing': { if (!C) return ''; return briefingCut(C); }
    case 'pace': { if (!MURDER_PACES[c.pace]) return ''; crimeState().murderPace = c.pace; markDirty(); return `Murders: ${MURDER_PACES[c.pace].toLowerCase()}.`; }
    case 'visit': { if (MODE === 'host') { $('#sheet').hidden = true; openInterior({ kind: 'hall' }); } return ''; }
  }
  return '';
}

