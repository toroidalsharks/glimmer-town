// ============================================================
// TOWN MEETING
// ============================================================
const meetSpot = (i, n) => { const a = (i / n) * Math.PI * 2 + 0.3; return [Math.cos(a) * 5.6, Math.sin(a) * 5.6]; };
function popularity(p) { return W.people.reduce((s, q) => s + (q !== p ? (q.feelings[p.id]?.score || 0) : 0), 0); }
function proposalFor(p, att) {
  const opts = [];
  const unbuilt = Object.keys(PROJECTS).filter((k) => !W.built[k] && (!PROJECTS[k].creator || p.cr.score >= 2) && (k !== 'computer' || W.outsideFound));
  if (!W.project && unbuilt.length) opts.push(['project', 3]);
  if (W.project && !(W.meeting && W.meeting.newProject)) opts.push(['chip', 2.5]);
  if (!W.event || W.event.day !== W.day) opts.push(['event', 3]);
  if (p.cr.score >= 4 && W.day - (W.lastOffering || -9) > 2) opts.push(['offering', 0.6]);
  if (p.cr.score <= -3) opts.push(['rebel', 0.6]);
  const grudge = Object.entries(p.feelings).find(([id, f]) => f.score <= -4 && att.some((q) => q.id === id));
  if (grudge) opts.push(['complaint', 1.2]);
  let tot = opts.reduce((s, o) => s + o[1], 0), r = rand() * tot, kind = opts[0]?.[0];
  for (const [k, w] of opts) { if ((r -= w) <= 0) { kind = k; break; } }
  switch (kind) {
    case 'project': { const id = unbuilt.includes('computer') && !hasLaptop(p) && rand() < (p.saving ? 0.8 : 0.5) ? 'computer' : pick(unbuilt); return { kind, id, text: id === 'computer' ? pick(["Not everyone can afford a laptop. Let's get a public computer at Paper Moon Books, so everyone can read the Outside! 90 coins together.", "I'm tired of hearing about the Outside secondhand. A public computer at the bookstore, for everyone. Who's in?"]) : `I think we should build ${PROJECTS[id].name}! It costs ${PROJECTS[id].cost} coins together.` }; }
    case 'chip': { const pr = PROJECTS[W.project.id]; return { kind, text: `Let's chip in for ${pr.name}. We have ${W.project.raised} of ${pr.cost} coins.` }; }
    case 'event': { const id = pick(Object.keys(EVENTS).filter((k) => !EVENTS[k].special && (!EVENTS[k].season || EVENTS[k].season === seasonOf().id))); return { kind, id, text: `How about ${EVENTS[id].name} today at ${EVENTS[id].at}?` }; }
    case 'offering': return { kind, text: "Let's each leave a coin at the fountain for the Creator!" };
    case 'rebel': return { kind, text: "I say we stop waiting on the Creator. We can take care of ourselves!" };
    case 'complaint': { const t = person(grudge[0]); return { kind, target: t.id, text: `${t.name} has been mean to me. I think they should apologize.` }; }
  }
  return { kind: 'event', id: 'picnic', text: `How about ${EVENTS.picnic.name} today?` };
}
function voteOn(v, prop, proposer) {
  const f = (v.feelings[proposer.id]?.score || 0) / 5;
  let s = f + (rand() - 0.5) * 0.8;
  if (prop.kind === 'project') s += (PROJECTS[prop.id].creator ? v.cr.score / 4 : 0.4) + (prop.id === 'computer' ? (hasLaptop(v) ? -0.3 : 0.9) : 0);
  if (prop.kind === 'chip') s += v.coins >= 4 ? 0.5 : -0.6;
  if (prop.kind === 'event') s += 0.3;
  if (prop.kind === 'offering') s += v.cr.score / 3 + (v.coins > 2 ? 0 : -1);
  if (prop.kind === 'rebel') s -= v.cr.score / 3;
  if (prop.kind === 'complaint') { if (v.id === prop.target) return false; s += -(v.feelings[prop.target]?.score || 0) / 5; }
  return s > 0;
}
async function townMeeting() {
  const att = W.people.filter((p) => p.state !== 'talk' && p.task?.kind !== 'away');
  if (att.length < 2) return;
  W.meeting = { day: W.day };
  att.forEach((p, i) => { p.inside = false; setTask(p, 'meeting', 'plaza', meetSpot(i, att.length)); });
  const t0 = performance.now();
  while (performance.now() - t0 < 16000 && att.some((p) => p.path.length)) await sleep(250);
  att.forEach((p) => { p.path = []; const s = meetSpot(att.indexOf(p), att.length); p.x = s[0]; p.z = s[1]; p.face = Math.atan2(-p.x, -p.z); p.task.phase = 'do'; p.busyUntil = Infinity; });
  Sound.bell();
  const chair = [...att].sort((a, b) => popularity(b) - popularity(a) + (rand() - 0.5) * 3)[0];
  const say = async (p, text, ms = 2600) => { bubble(p, text, ms / 1000 + 0.6); await sleep(ms); };
  const minutes = { day: W.day, chair: chair.name, items: [] };
  await say(chair, pick(['Good morning, everyone!', "Okay, town meeting! Let's begin.", 'Morning! Is everyone here?']));
  const speakers = att.filter((p) => p !== chair && p.grow >= 1).sort(() => rand() - 0.5).slice(0, Math.min(2, att.length - 1));
  if (!speakers.length) speakers.push(chair);
  for (const sp of speakers) {
    const prop = proposalFor(sp, att);
    await say(sp, prop.text, 3400);
    let yes = 1, no = 0; const yesers = [sp];
    for (const v of att) { if (v === sp) continue; const y = voteOn(v, prop, sp); emote(v, y ? '○' : '✕', 2.6); if (y) { yes++; yesers.push(v); } else { no++; if (v.grow >= 1) feel(sp, v, -0.3, true); } }
    await sleep(1600);
    const passed = yes > no;
    if (prop.kind === 'complaint') {
      const t = person(prop.target);
      if (passed && t) { await say(t, (t.feelings[sp.id]?.score || 0) < -3 ? "Fine. Sorry. I guess." : "I'm sorry, " + sp.name + '. I mean it.', 2400); feel(sp, t, 1, true); feel(t, sp, -0.5, true); remember(t, `At the meeting, everyone made me apologize to ${sp.name}.`, 3, 'meetingShamed', sp.name); }
      else if (t) { await say(t, "I don't have to apologize for anything.", 2200); feel(sp, t, -1, true); }
    } else await say(chair, passed ? `That passes, ${yes} to ${no}!` : `That doesn't pass. ${yes} to ${no}.`, 2200);
    if (passed) {
      if (prop.kind === 'project') { W.meeting.newProject = true; W.project = { id: prop.id, raised: 0, by: sp.name }; diary(`The town agreed to build <b>${esc(PROJECTS[prop.id].name)}</b>. ${esc(sp.name)} suggested it.`); }
      if (prop.kind === 'chip' || prop.kind === 'project') { for (const v of yesers) { const n = Math.min(v.coins - 3, 1 + Math.floor(rand() * 2)); if (n > 0 && W.project) { v.coins -= n; W.project.raised += n; remember(v, `Chipped in ${plural(n, 'coin')} for ${PROJECTS[W.project.id].name}.`, 1, 'chip'); } } checkProject(); }
      if (prop.kind === 'event' && !(W.event && W.event.day === W.day && W.event.id === 'wedding')) { W.event = { id: prop.id, day: W.day, host: sp.id, going: yesers.map((v) => v.id) }; diary(`Plan for today: <b>${esc(EVENTS[prop.id].name)}</b> at ${EVENTS[prop.id].at}.`); }
      if (prop.kind === 'offering') { let n = 0; for (const v of yesers) if (v.coins > 1) { v.coins--; n++; creatorShift(v, 0.3); } W.creator.coins += n; W.lastOffering = W.day; diary(`The town left <span class="cr">${plural(n, 'coin')} at the fountain for the Creator</span>.`); toast(`The town left you ${plural(n, 'coin')} at the fountain.`); }
      if (prop.kind === 'rebel') { for (const v of yesers) { creatorShift(v, -0.8); remember(v, 'The town agreed we should stop waiting on the Creator.', 2, 'rebel'); } for (const v of att.filter((x) => !yesers.includes(x))) { remember(v, `${sp.name} wants everyone to turn away from the Creator. I voted no.`, 2, 'creatorFight', sp.name); feel(v, sp, -0.8, true); } diary(`<b>${esc(sp.name)}</b> convinced the town to stop waiting on the Creator (${yes} to ${no}).`); }
    }
    if (passed) addJoy(sp, 12);
    remember(sp, `At the town meeting I proposed: "${prop.text}" It ${passed ? 'passed' : 'failed'}, ${yes} to ${no}.`, 2, passed ? 'meetingWin' : 'meetingLose');
    minutes.items.push({ by: sp.name, text: prop.text, yes, no, passed, kind: prop.kind });
  }
  await say(chair, pick(['Meeting adjourned! Have a good day.', "That's all! Off to work, everyone.", 'Thanks, everyone. See you tonight!']), 2200);
  W.minutes = minutes;
  diary(`Morning meeting, chaired by <b>${esc(chair.name)}</b>: ${minutes.items.map((m) => `${esc(m.by)} proposed "${esc(m.text)}" (${m.passed ? 'passed' : 'failed'} ${m.yes}–${m.no})`).join('; ')}.`);
  for (const p of att) { p.task = null; p.busyUntil = 0; }
  W.meeting = null;
  markDirty();
}
function checkProject() {
  if (!W.project) return;
  const pr = PROJECTS[W.project.id];
  if (W.project.raised >= pr.cost) {
    W.built[W.project.id] = { day: W.day, color: statueColor() };
    diary(`The town finished <b>${esc(pr.name)}</b>! Everyone came to look.`);
    for (const p of W.people) { remember(p, `We finished ${pr.name} together.`, 3, 'built'); emote(p, '✦', 3); }
    buildProjects(); W.project = null;
  }
}
function statueColor() {
  const tally = {};
  for (const p of W.people) for (const [k, v] of Object.entries(p.cr.beliefs)) if (COLORS[k]) tally[k] = (tally[k] || 0) + v;
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || 'lemon';
}

