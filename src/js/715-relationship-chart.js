// ============================================================
// RELATIONSHIP CHART: who a resident loves, lives with, likes and can't stand
// ============================================================
// Built only from what the game already keeps: partner/married/separated, the
// wedding plan, parents (by name), exes (by name) and feelings (-10..10).
// Thresholds match the words aboutThem() gives the AI (close 5, warm 2, annoyed -2, hostile -5).
const REL_KINDS = {
  married: { order: 0, group: 'Love', label: 'married', color: '#ffd36b', width: 4.5 },
  engaged: { order: 1, group: 'Love', label: 'engaged', color: '#ffd36b', width: 3.5, dash: '7 4' },
  separated: { order: 2, group: 'Love', label: 'separated', color: '#c9a95a', width: 3, dash: '3 5' },
  dating: { order: 3, group: 'Love', label: 'dating', color: '#ff8fb6', width: 3.5 },
  parent: { order: 4, group: 'Family', label: 'parent', color: '#8fc7ff', width: 3 },
  child: { order: 5, group: 'Family', label: 'child', color: '#8fc7ff', width: 3 },
  sibling: { order: 6, group: 'Family', label: 'sibling', color: '#8fc7ff', width: 2.5 },
  close: { order: 7, group: 'Friends', label: 'close friend', color: '#7be0a4', width: 3 },
  friend: { order: 8, group: 'Friends', label: 'friend', color: '#7be0a4', width: 1.8 },
  feud: { order: 9, group: 'Trouble', label: 'feud', color: '#ff6b7d', width: 3 },
  annoyed: { order: 10, group: 'Trouble', label: "doesn't get along", color: '#ff6b7d', width: 1.8, dash: '4 4' },
  ex: { order: 11, group: 'Past', label: 'ex', color: '#8a82a8', width: 1.8, dash: '2 5' },
};
const REL_GROUPS = ['Love', 'Family', 'Friends', 'Trouble', 'Past'];
const REL_CHART_MAX = 14;

function personNamed(name) { return W.people.find((q) => q.name === name); }

// Every tie p has, one entry per other resident (or remembered name), strongest kind first.
function relationsOf(p) {
  const byKey = new Map();
  const add = (q, name, kind) => {
    const key = q ? q.id : 'name:' + name;
    let r = byKey.get(key);
    if (!r) { r = { q, name: q ? q.name : name, kinds: [] }; byKey.set(key, r); }
    if (!r.kinds.includes(kind)) r.kinds.push(kind);
  };
  const partner = p.partner && person(p.partner);
  if (partner) add(partner, null, p.married ? (p.separated ? 'separated' : 'married') : 'dating');
  const wed = W.wedding;
  if (wed && (wed.a === p.id || wed.b === p.id)) { const q = person(wed.a === p.id ? wed.b : wed.a); if (q) add(q, null, 'engaged'); }
  for (const n of p.parents || []) add(personNamed(n), n, 'parent');
  for (const q of W.people) {
    if (q === p) continue;
    if ((q.parents || []).includes(p.name)) add(q, null, 'child');
    else if (!(p.parents || []).includes(q.name) && (p.parents || []).length && (q.parents || []).some((n) => p.parents.includes(n))) add(q, null, 'sibling');
  }
  for (const n of p.exes || []) if (!partner || partner.name !== n) add(personNamed(n), n, 'ex');
  for (const [id, f] of Object.entries(p.feelings || {})) {
    const q = person(id); if (!q || q === p) continue;
    const s = f.score ?? 0;
    const kind = s >= 5 ? 'close' : s >= 2 ? 'friend' : s <= -5 ? 'feud' : s <= -2 ? 'annoyed' : null;
    if (kind) add(q, null, kind);
  }
  const list = [...byKey.values()];
  for (const r of list) {
    r.kinds.sort((a, b) => REL_KINDS[a].order - REL_KINDS[b].order);
    r.main = r.kinds[0];
    r.mine = r.q ? p.feelings?.[r.q.id]?.score ?? null : null;
    r.theirs = r.q ? r.q.feelings?.[p.id]?.score ?? null : null;
  }
  return list.sort((a, b) => REL_KINDS[a.main].order - REL_KINDS[b.main].order || Math.abs(b.mine ?? 0) - Math.abs(a.mine ?? 0));
}

// How the other side feels back, in a few words, when it differs enough to matter.
function relTwoWay(r) {
  if (r.mine == null || r.theirs == null) return '';
  if (r.mine >= 2 && r.theirs >= 2) return 'both ways';
  if (r.mine <= -2 && r.theirs <= -2) return 'both ways';
  if (r.mine >= 2 && r.theirs <= -2) return `${r.name} doesn't feel the same`;
  if (r.mine <= -2 && r.theirs >= 2) return `${r.name} still likes them`;
  if (Math.abs(r.mine - r.theirs) >= 4) return r.theirs > r.mine ? `${r.name} is fonder of them` : `${r.name} is less keen`;
  return '';
}

function relShortName(n) { return n.length > 10 ? n.slice(0, 9) + '…' : n; }

// Love and family always make the chart; after that the strongest feelings win, good or bad.
function relChartPick(rels) {
  const weight = (r) => (REL_KINDS[r.main].group === 'Love' || REL_KINDS[r.main].group === 'Family' ? 100 - REL_KINDS[r.main].order : Math.abs(r.mine ?? 0));
  return rels.filter((r) => r.q).sort((a, b) => weight(b) - weight(a)).slice(0, REL_CHART_MAX).sort((a, b) => REL_KINDS[a.main].order - REL_KINDS[b.main].order);
}

function relChartSvg(p, rels) {
  const shown = relChartPick(rels);
  const W0 = 340, H0 = 320, cx = W0 / 2, cy = H0 / 2 - 4, R = shown.length > 8 ? 122 : 108;
  // with a crowd, every other face sits on an inner ring so the names don't run into each other
  const pos = shown.map((r, i) => { const a = -Math.PI / 2 + (i / shown.length) * Math.PI * 2, rr = shown.length > 8 && i % 2 ? R * 0.68 : R; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.92]; });
  const lines = shown.map((r, i) => {
    const k = REL_KINDS[r.main], [x, y] = pos[i];
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${k.color}" stroke-width="${k.width}" stroke-linecap="round"${k.dash ? ` stroke-dasharray="${k.dash}"` : ''} opacity="0.9"/>`;
  }).join('');
  const node = (q, x, y, r, big) => `<g ${big ? 'class="rel-self"' : `class="rel-node" data-id="${q.id}" role="button" tabindex="0"`} aria-label="${esc(q.name)}">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 10}" fill="transparent"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${skinCss(q)}" stroke="${COLORS[q.outfit?.shirt] || '#2f2947'}" stroke-width="${big ? 4 : 3}"/>
      <text x="${x.toFixed(1)}" y="${(y + r + 13).toFixed(1)}" text-anchor="middle" class="${big ? 'rel-me' : ''}">${esc(relShortName(q.name))}</text></g>`;
  const nodes = shown.map((r, i) => node(r.q, pos[i][0], pos[i][1], 13, false)).join('');
  return `<svg class="rel-chart" viewBox="0 0 ${W0} ${H0}" role="img" aria-label="${esc(p.name)}'s relationships">${lines}${nodes}${node(p, cx, cy, 19, true)}</svg>`;
}

function relChartHtml(p) {
  const rels = relationsOf(p);
  if (!rels.length) return `<p class="label">Relationships</p><p class="hint">${esc(p.name)} hasn't grown close to anyone, or fallen out with anyone, yet.</p>`;
  const used = [...new Set(relChartPick(rels).map((r) => r.main))].sort((a, b) => REL_KINDS[a].order - REL_KINDS[b].order);
  const legend = used.map((k) => { const K = REL_KINDS[k]; return `<span class="rel-key"><svg viewBox="0 0 26 8" aria-hidden="true"><line x1="2" y1="4" x2="24" y2="4" stroke="${K.color}" stroke-width="${Math.min(K.width, 4)}" stroke-linecap="round"${K.dash ? ` stroke-dasharray="${K.dash}"` : ''}/></svg>${K.label}</span>`; }).join('');
  const hidden = rels.filter((r) => r.q).length - REL_CHART_MAX;
  const groups = REL_GROUPS.map((g) => {
    const rows = rels.filter((r) => REL_KINDS[r.main].group === g);
    if (!rows.length) return '';
    return `<div class="rel-group"><b>${g}</b>${rows.map((r) => {
      const who = r.q ? `<button class="rel-name" type="button" data-id="${r.q.id}">${esc(r.name)}</button>` : `<span class="rel-name gone">${esc(r.name)}</span>`;
      const two = relTwoWay(r);
      return `<span class="rel-row">${who} <span class="rel-tags">${r.kinds.map((k) => REL_KINDS[k].label).join(', ')}${two ? ` · ${esc(two)}` : ''}${r.q ? '' : ' · not on the island'}</span></span>`;
    }).join('')}</div>`;
  }).join('');
  return `<p class="label">Relationships</p>
    <div class="rel-wrap">${relChartSvg(p, rels)}<div class="rel-legend">${legend}</div>${hidden > 0 ? `<p class="hint">The chart shows the ${REL_CHART_MAX} strongest ties. The list below has all ${rels.length}.</p>` : ''}<p class="hint">Tap anyone to open their page.</p></div>
    <div class="rel-list">${groups}</div>`;
}
// The chart is SVG, so its faces aren't <button>s; open the tapped resident the same way the sheet's data-id buttons do.
function openRelNode(g) {
  const id = g.dataset.id; if (!id || !person(id)) return;
  openDetail = id; giftPick = null; send({ t: 'follow', id }); refreshPanel(true); $('#pane-people').scrollTop = 0;
}
document.addEventListener('click', (e) => { const g = e.target.closest && e.target.closest('.rel-node'); if (g) openRelNode(g); });
document.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const g = e.target.closest && e.target.closest('.rel-node'); if (g) { e.preventDefault(); openRelNode(g); } });
