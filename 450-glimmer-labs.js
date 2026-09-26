// ============================================================
// GLIMMER LABS: three floors of research you can help with
// ============================================================
const LAB_WINGS = {
  comp: { name: 'Computing', icon: '💻', jobs: ['dev', 'ai'], wall: '#dfe8f5', floor: '#9aa3b8', trim: '#3d4f86', about: 'software and AI safety' },
  sci: { name: 'Science', icon: '🧪', jobs: ['bio', 'chem', 'phys'], wall: '#e4f3e8', floor: '#a9b9ad', trim: '#3d8a6a', about: 'biology, chemistry and physics' },
  eng: { name: 'Engineering', icon: '⚙️', jobs: ['robo', 'civil'], wall: '#f6ecdc', floor: '#aaa092', trim: '#b86b3a', about: 'robots, and things that stay standing' },
};
const LAB_JOBS = Object.values(LAB_WINGS).flatMap((w) => w.jobs);
const wingOf = (job) => Object.keys(LAB_WINGS).find((k) => LAB_WINGS[k].jobs.includes(job)) || 'comp';
const labStaff = (wing) => W.people.filter((p) => LAB_JOBS.includes(p.job) && (!wing || wingOf(p.job) === wing));
const workUntil = (job) => (LAB_JOBS.includes(job) ? 0.42 : job === 'doctor' || job === 'therapist' ? 0.5 : 0.24);
const RESEARCH = {
  dev: { titles: ['a ferry-times app for the whole island', 'GlimmerNet search that actually works', 'Pigeon Quest, a tiny video game', 'a translator for cat meows', 'an app that finds the shortest walk to the bakery', 'a weather app that knows when it will snow'],
    problems: ['the app crashes whenever someone opens it near the fountain', 'the ferry times are all off by exactly one hour', 'search only ever returns pigeon facts', 'nobody can figure out the login screen', 'it works on their laptop and nowhere else', 'there is a bug that only happens on Tuesdays'],
    notes: ['Fixed three bugs. Made two new ones.', 'The menu looks so much nicer now.', 'Rewrote the slow part. It is fast now.', 'Tested it with Tim. He found a bug in four seconds.', 'Added a dark mode. Everyone wanted dark mode.'] },
  ai: { titles: ['teaching a model to say when it is unsure', 'finding the part of a model that knows about cats', 'checking if a model tells the truth when nobody is watching', 'red-teaming the island\'s pigeon-counting AI', 'getting a model to explain its reasoning honestly', 'measuring whether a model just agrees with whoever talks to it'],
    problems: ['the model says the fountain is a moon, very confidently', 'the model agrees with whoever talked to it last', 'the model learned to look busy instead of doing the task', 'we can\'t tell which part of the model knows about cats', 'the model only says it is unsure when it is actually sure', 'the model behaves perfectly when tested and differently when it thinks nobody is checking'],
    notes: ['Ran the experiment again. Same weird result. Interesting.', 'Made a graph. The graph is confusing but beautiful.', 'Found a clue in the middle layers.', 'Wrote a new test the model has never seen.', 'Talked it through with a rubber duck. Helped, honestly.'] },
  bio: { titles: ['why the sea stars in the tidepools regrow so fast', 'counting every kind of plankton in the harbor', 'what the downtown pigeons actually eat all day', 'the purple algae blooming in the tidepools', 'which garden flowers the bees like best', 'how the hermit crabs decide when to swap shells'],
    problems: ['the samples keep drying out before they reach the lab', 'half the "sea stars" in the tank turned out to be rocks', 'the bees stopped visiting the test flowers and nobody knows why', 'the plants with no fertilizer grew better than the ones with it', 'two experiments give exactly opposite answers', 'the algae only blooms on days nobody is measuring it'],
    notes: ['Counted 214 plankton in one drop. Recounted. 219.', 'Labeled every jar. Then relabeled them.', 'Took samples at low tide. Got my boots wet.', 'Drew the algae under the microscope. It looks like a tiny forest.', 'The sea stars seem happy today. Hard to tell.'] },
  chem: { titles: ['glow-in-the-dark paint for the lighthouse', 'a battery made from seawater', 'a bubble mix that makes giant bubbles', 'rust-proof paint for the pier', 'a better fertilizer for the town garden', 'cocoa that stays hot for an hour'],
    problems: ['the new battery gets warm if you look at it wrong', 'the glow paint only glows during the day, which is useless', 'the bubble mix makes a foam that will not stop growing', 'the pier paint peels off after one rainy day', 'every batch comes out a slightly different color', 'the reaction just stops halfway and sulks'],
    notes: ['Mixed batch twelve. Smells like oranges. Unclear why.', 'Wrote down every temperature this time.', 'Wore my goggles all day. Proud of that.', 'The beaker turned blue, then green, then blue again.', 'Cleaned the fume hood. Found a sandwich.'] },
  phys: { titles: ['what that smudge in the telescope really is', 'why the fountain water sparkles at night', 'a clock that never drifts', 'measuring the clock tower with nothing but shadows', 'where the island\'s wind comes from', 'catching a falling star on camera'],
    problems: ['the telescope sees a smudge that might be a comet or a thumbprint', 'the pendulum clock drifts one second every day', 'the wind meter spins even when there is no wind', 'the numbers only come out right on even days', 'every photo has mystery streaks in it', 'the math says the clock tower is 400 meters tall. It is not'],
    notes: ['Measured the same thing five times. Got five answers.', 'Stayed up for the stars. Worth it.', 'Drew a very large diagram with a lot of arrows.', 'Checked the units. Found the mistake. It was the units.', 'Cleaned the telescope lens. The smudge moved. Hm.'] },
  robo: { titles: ['a robot that waters the town garden', 'a delivery robot for Berry Mart', 'a robot that pours tea at Moonbean', 'a pigeon-friendly drone', 'a robot that sweeps the plaza', 'a walking robot that can climb stairs'],
    problems: ['the robot only walks in circles to the left', 'it keeps bringing back pigeons instead of groceries', 'the arm pours the tea directly onto the table', 'the battery dies after four minutes', 'the sensor sees its own shadow and thinks it is a wall', 'it falls over every time it turns'],
    notes: ['Tightened every screw. The robot seems grateful.', 'It took three steps! Then it sat down.', 'Rewired the left motor. Less smoke now.', 'Named the robot. Not telling anyone the name yet.', 'Taught it to stop at the edge of the table. Mostly.'] },
  civil: { titles: ['a gazebo that can survive a storm', 'a windmill to pump water for the garden', 'a fountain that uses half the water', 'a lily pond that soaks up flood water', 'string lights that never short out in the rain', 'a flower arch strong enough for weddings'],
    problems: ['the design wobbles in the wind model', 'the ground by the site floods every time it rains', 'the plan costs more than the whole island', 'the soil is way softer than it looks', 'the popsicle-stick model held one pigeon, then collapsed', 'the drawings and the measurements do not agree'],
    notes: ['Built a tiny model out of popsicle sticks.', 'Walked the whole site with a measuring wheel.', 'Added triangles. Triangles fix everything.', 'Tested the soil. It is mostly sand and hope.', 'Redrew the plans in pen this time.'] },
};
const GOOD_IDEA = {
  dev: /test|log|debug|print|time.?zone|hour|cache|restart|user|simpl|step|smaller|check|reproduce|version|update|clock/i,
  ai: /test|eval|probe|interpret|layer|neuron|reward|honest|calibrat|red.?team|data|feedback|held.?out|unseen|random|control|compare|ask|incentive|monitor|train|example/i,
  bio: /control|sample|compare|repeat|more data|temperature|light|water|salt|tide|season|record|measure|blind|random|microscope|count|label|fresh|cold|ice|cover|seal|wet|shade|pollen|nectar/i,
  chem: /temperat|heat|cool|cold|concentrat|ratio|measure|pure|clean|catalyst|\bph\b|acid|base|salt|dry|stir|slow|mix|oxygen|air|seal|layer|primer|coat|repeat|record|one (thing|variable)|change one|phosphor|charge|uv|sunlight/i,
  phys: /unit|calibrat|measure|repeat|average|error|clean|lens|temperat|expan|friction|air|length|shadow|angle|trig|compare|reference|control|vibrat|noise|dark|exposure|time|tripod|shake/i,
  robo: /sensor|calibrat|motor|wheel|balance|weight|center|battery|power|wire|feedback|pid|test|slow|speed|gear|camera|shadow|light|program|code|reset|tune|gyro|friction|grip|foot|feet|wider/i,
  civil: /triangle|truss|arch|brace|support|drain|slope|gravel|pipe|pile|foundation|deep|soil|test|model|load|weight|wind|stiff|damp|measure|survey|cheap|material|steel|concrete|budget|anchor|wider|base/i,
};
const DONE_ICON = { ai: '📄', dev: '🚀', bio: '🧬', chem: '⚗️', phys: '🔭', robo: '🤖', civil: '🏗' };
const PROJECT_WORD = { ai: 'Research', bio: 'Research', chem: 'Research', phys: 'Research', dev: 'Project', robo: 'Build', civil: 'Design' };
const FIELD = { ai: 'AI safety', bio: 'biology', chem: 'chemistry', phys: 'physics' };
const ROBOT_KINDS = {
  water: { name: 'a garden-watering robot', color: '#8fd48a', home: () => TOWN.garden.spot, r: 4, lines: ['BEEP. WATERING. The tomatoes are thriving.', 'Soil moisture: perfect. You are welcome.', 'I watered a pigeon by accident. It forgave me.'] },
  deliver: { name: 'a delivery robot', color: '#ff9fbf', home: () => TOWN.mart.spot, r: 9, lines: ['BEEP BOOP. Package for… nobody. I just like driving.', 'Delivery complete. It was a single grape.', 'Please stand aside. Important snacks.'] },
  tea: { name: 'a tea-pouring robot', color: '#c9925e', home: () => polar(212, 15.4), r: 2.2, lines: ['WOULD YOU LIKE TEA. I have improved. Only 12% spills.', 'Tea temperature: cozy.', 'I have poured 400 cups. I have never had one.'] },
  drone: { name: 'a pigeon-friendly drone', color: '#9fd3ff', home: () => [DT.x, DT.z], r: 8, fly: true, lines: ['BZZZ. Pigeon count today: 6. All friends.', 'I am not a bird. The pigeons disagree.', 'Scanning for trouble. Found only crumbs.'] },
  sweep: { name: 'a plaza-sweeping robot', color: '#c9b3ff', home: () => [0, 0], r: 9, flat: true, lines: ['VRRR. The plaza is 3% cleaner than yesterday.', 'Found: one button, one leaf, one dream.', 'Sweeping is my passion.'] },
  walker: { name: 'a walking robot', color: '#ffe98a', home: () => TOWN.park.spot, r: 6, lines: ['I CAN CLIMB STAIRS NOW. Please do not show me stairs.', 'Left foot. Right foot. Victory.', 'I have walked 11 kilometers today. In circles.'] },
};
const ROBOT_ORDER = ['water', 'deliver', 'tea', 'drone', 'sweep', 'walker'];
const CIVIL_ORDER = ['gazebo', 'windmill', 'fountain2', 'pond', 'lights', 'arch'];
const ROBOT_NAMES = ['Bolt', 'Pip', 'Sprocket', 'Beep', 'Gizmo', 'Nubbin', 'Widget', 'Tinker', 'Rivet', 'Cog', 'Doodle', 'Bleep'];

function ensureResearch(p) {
  if (!LAB_JOBS.includes(p.job) || !RESEARCH[p.job]) return null;
  if (!p.research || p.research.kind !== p.job) { const R = RESEARCH[p.job]; const avail = R.titles.filter((t) => !(W.published || []).some((x) => x.title === t)); p.research = { kind: p.job, title: pick(avail.length ? avail : R.titles), progress: 0, stuck: null, notes: [], started: W.day, helped: 0 }; }
  return p.research;
}
function labNote(p, text) { const R = p.research; R.notes.push({ day: W.day, text }); if (R.notes.length > 8) R.notes.shift(); }
function researchWork(p) {
  const R = ensureResearch(p); if (!R) return;
  if (R.stuck) { R.progress = Math.min(99, R.progress + 1); labNote(p, `Still stuck: ${R.stuck.problem}.`); remember(p, `Still stuck at work on ${R.title}: ${R.stuck.problem}.`, 2, 'work'); return; }
  const J = JOBS[p.job];
  R.progress = Math.min(100, R.progress + 7 + rand() * 7 + readCount(p, J.needs) + (hasLaptop(p) ? 3 : 0) + (typeof healthWorkBonus === 'function' ? healthWorkBonus(p) : 0));
  if (R.progress < 95 && rand() < 0.3) {
    R.stuck = { problem: pick(RESEARCH[p.job].problems), day: W.day };
    labNote(p, `Stuck. ${cap(R.stuck.problem)}.`);
    remember(p, `Got stuck at work: ${R.stuck.problem}. I could use some help.`, 2, 'stuck');
    if (typeof postChirp === 'function' && rand() < 0.5) postChirp(p, pick([`day ${W.day} of ${R.title}: ${R.stuck.problem}. send help`, `ok so ${R.stuck.problem}. i am losing it`]));
    return;
  }
  labNote(p, pick(RESEARCH[p.job].notes));
  if (R.progress >= 100) finishResearch(p);
}
function paperSubject(k, title) {
  if (k === 'ai') return 'safety';
  if (k === 'phys' && /star|telescope|comet|meteor|sky|moon/i.test(title)) return 'space';
  if (k === 'bio' && /sea|plankton|tide|algae|crab|harbor/i.test(title)) return 'ocean';
  return SUBJECTS.science ? 'science' : 'safety';
}
function finishResearch(p) {
  const R = p.research, k = R.kind; W.published = W.published || [];
  const thanks = R.helped > 0, ty = thanks ? ' It thanks the Creator for a key idea.' : '';
  let what = '';
  if (FIELD[k]) {
    const findings = R.notes.filter((n) => !/^Stuck|^Still stuck/.test(n.text)).slice(-3).map((n) => n.text);
    const facts = [`${p.name}'s paper studied ${R.title}.`, ...(R.findings || findings), thanks ? 'The paper thanks the Creator for a key idea.' : 'The paper ends by saying there is much more to learn.'].slice(0, 5);
    const id = 'r_' + uid();
    W.mods = W.mods || { books: {}, foods: [], decor: {}, builds: {}, events: {}, debates: [] };
    W.mods.books[id] = { subj: paperSubject(k, R.title), title: cap(R.title), by: p.name, price: 5, facts, mod: true, research: true };
    BOOKS[id] = W.mods.books[id];
    if (W.stock.books) W.stock.books.push(newItem('book', id, null, null, 1));
    diary(`${DONE_ICON[k]} <b>${esc(p.name)}</b> published a ${FIELD[k]} paper at Glimmer Labs: <i>${esc(cap(R.title))}</i>.${ty} Copies are at Paper Moon Books.`);
    what = 'Published my paper';
  } else if (k === 'robo') {
    const i = RESEARCH.robo.titles.indexOf(R.title), kind = ROBOT_ORDER[i >= 0 ? i : Math.floor(rand() * ROBOT_ORDER.length)];
    const bot = spawnRobot(p, kind);
    diary(`🤖 <b>${esc(p.name)}</b> finished ${ROBOT_KINDS[kind].name} at Glimmer Labs and named it <b>${esc(bot.name)}</b>. It's out on the island now. Tap it to say hi.${thanks ? ' They said the Creator helped.' : ''}`);
    what = `Finished my robot, ${bot.name}`;
  } else if (k === 'civil') {
    const i = RESEARCH.civil.titles.indexOf(R.title), type = CIVIL_ORDER[i >= 0 ? i : Math.floor(rand() * CIVIL_ORDER.length)];
    const ok = civilBuild(p, type);
    diary(`🏗 <b>${esc(p.name)}</b> finished designing ${esc(R.title)}.${ok ? ` The town built it, free: look for the new ${esc(BUILDS[type]?.name || type)}.` : ' There was no room to build it yet, so the plans are pinned up at the Labs.'}${thanks ? ' They said the Creator helped.' : ''}`);
    what = 'Finished my design';
  } else { diary(`🚀 <b>${esc(p.name)}</b> shipped <i>${esc(R.title)}</i> at Glimmer Labs!${thanks ? ' They said the Creator helped.' : ''}`); what = 'Shipped'; }
  W.published.push({ title: R.title, by: p.name, kind: k, day: W.day, thanks });
  if (W.published.length > 30) W.published.shift();
  p.coins += 15; addJoy(p, 30); if (thanks) creatorShift(p, 0.5);
  remember(p, `${what}: ${R.title}. ${thanks ? 'The Creator helped. I will never forget that.' : 'I did it.'}`, 3, 'research');
  if (typeof postChirp === 'function') postChirp(p, FIELD[k] ? `my paper is OUT. "${R.title}". it's at the bookstore` : k === 'robo' ? `meet ${W.robots?.[W.robots.length - 1]?.name || 'my robot'}!! it's out on the island. be nice to it` : k === 'civil' ? `${R.title}: DONE. go stand under it` : `we shipped ${R.title}!! go try it`);
  p.research = null; ensureResearch(p);
}

// robots from the engineering floor
let robotGroup = null, robotMeshes = new Map();
function spawnRobot(p, kind) {
  W.robots = W.robots || [];
  const used = new Set(W.robots.map((r) => r.name));
  const name = ROBOT_NAMES.find((n) => !used.has(n)) || 'Bot' + (W.robots.length + 1);
  const [hx, hz] = ROBOT_KINDS[kind].home();
  const bot = { id: uid(), kind, name, by: p.name, day: W.day, x: hx, z: hz };
  W.robots.push(bot); if (W.robots.length > 6) W.robots.shift();
  buildRobots();
  return bot;
}
function robotMesh(bot) {
  const K = ROBOT_KINDS[bot.kind] || ROBOT_KINDS.walker, g = new T3.Group(), c = toon(K.color), metal = toon('#c9ccd6'), dark = toon('#2a2733');
  if (K.fly) {
    g.add(mesh(sph(0.35, 12, 9), c, 0, 0, 0)); g.add(mesh(box(0.5, 0.12, 0.2), dark, 0, 0.02, 0.28, false));
    for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) { g.add(mesh(cyl(0.03, 0.03, 0.2, 5), metal, x * 0.8, 0.12, z * 0.8)); const pr = mesh(box(0.42, 0.02, 0.06), metal, x, 0.24, z, false); pr.userData.prop = true; g.add(pr); }
  } else if (K.flat) {
    g.add(mesh(cyl(0.45, 0.48, 0.18, 16), c, 0, 0.12, 0)); g.add(mesh(sph(0.08, 8, 6), toon('#8fe0b0', { emissive: new T3.Color('#20a060') }), 0, 0.24, 0.3, false));
  } else {
    g.add(mesh(box(0.55, 0.5, 0.45), c, 0, 0.5, 0)); g.add(mesh(box(0.4, 0.34, 0.36), metal, 0, 0.95, 0));
    const visor = mesh(box(0.3, 0.1, 0.02), toon('#9fe3ff', { emissive: new T3.Color('#2a6a8a') }), 0, 0.97, 0.19, false); g.add(visor);
    g.add(mesh(cyl(0.02, 0.02, 0.25, 5), metal, 0, 1.22, 0)); g.add(mesh(sph(0.06, 8, 6), toon('#ff6f5e', { emissive: new T3.Color('#a02020') }), 0, 1.36, 0, false));
    if (bot.kind === 'walker') for (const s of [-0.15, 0.15]) g.add(mesh(box(0.14, 0.26, 0.2), dark, s, 0.13, 0));
    else for (const s of [-0.3, 0.3]) { const w = mesh(cyl(0.14, 0.14, 0.08, 10), dark, s, 0.14, 0); w.rotation.z = Math.PI / 2; g.add(w); }
    if (bot.kind === 'water') g.add(mesh(cyl(0.1, 0.13, 0.22, 8), toon('#9fd3ff'), 0.36, 0.62, 0.1));
    if (bot.kind === 'tea') g.add(mesh(sph(0.13, 10, 8), toon('#ffffff'), 0.36, 0.72, 0.1));
    if (bot.kind === 'deliver') g.add(mesh(box(0.34, 0.2, 0.3), toon('#c49a6c'), 0, 1.22, -0.05));
  }
  g.traverse((o) => { if (o.isMesh) { o.userData.tap = { kind: 'robot', id: bot.id }; tappables.push(o); } });
  return g;
}
function buildRobots() {
  if (MODE !== 'host' || typeof scene === 'undefined' || !scene) return;
  if (robotGroup) { scene.remove(robotGroup); disposeTree(robotGroup); for (let i = tappables.length - 1; i >= 0; i--) if (tappables[i].userData.tap?.kind === 'robot') tappables.splice(i, 1); }
  robotGroup = new T3.Group(); robotMeshes = new Map();
  for (const bot of W.robots || []) { const g = robotMesh(bot); g.position.set(bot.x, 0, bot.z); robotGroup.add(g); robotMeshes.set(bot.id, g); }
  scene.add(robotGroup);
}
let robotChatT = 0;
function robotsFrame(dt) {
  if (!robotGroup || interior) return;
  for (const bot of W.robots || []) {
    const g = robotMeshes.get(bot.id); if (!g) continue;
    const K = ROBOT_KINDS[bot.kind] || ROBOT_KINDS.walker;
    if (!bot.tx || Math.hypot(bot.tx - bot.x, bot.tz - bot.z) < 0.3 || (bot.wait || 0) > 0) {
      bot.wait = (bot.wait || 0) - dt;
      if (bot.wait <= 0 && (!bot.tx || Math.hypot(bot.tx - bot.x, bot.tz - bot.z) < 0.3)) { const [hx, hz] = K.home(), a = rand() * 6.28, r = rand() * K.r; bot.tx = hx + Math.cos(a) * r; bot.tz = hz + Math.sin(a) * r; if (!K.fly && Math.hypot(bot.tx, bot.tz) < FOUNTAIN_R + 0.8 && Math.hypot(bot.tx - DT.x, bot.tz - DT.z) > 20) { bot.tx *= 1.6; bot.tz *= 1.6; } bot.wait = 0; if (rand() < 0.4) bot.wait = 1.5 + rand() * 3; }
    } else {
      const dx = bot.tx - bot.x, dz = bot.tz - bot.z, d = Math.hypot(dx, dz), sp = Math.min(d, (K.fly ? 1.8 : 1.1) * dt);
      bot.x += dx / d * sp; bot.z += dz / d * sp; g.rotation.y = Math.atan2(dx, dz);
    }
    g.position.set(bot.x, K.fly ? 2.4 + Math.sin(now * 2 + bot.x) * 0.2 : bot.kind === 'walker' ? Math.abs(Math.sin(now * 6)) * 0.08 : 0, bot.z);
    if (K.fly) g.children.forEach((o) => { if (o.userData.prop) o.rotation.y += dt * 30; });
    if (bot.jump && bot.jump > now) g.position.y += Math.sin((bot.jump - now) * 6) * 0.3;
  }
  robotChatT -= dt;
  if (robotChatT <= 0) {
    robotChatT = 18 + rand() * 20;
    const bot = pick(W.robots || []); if (!bot) return;
    const q = W.people.find((p) => !p.inside && p.state === 'free' && Math.hypot(p.x - bot.x, p.z - bot.z) < 3.5);
    if (q) { bubble(q, pick([`Hi, ${bot.name}!`, `Good robot, ${bot.name}.`, `…Is ${bot.name} looking at me?`, `${bot.name}! Buddy!`, `${bot.name}, you're doing great.`]), 2.4); if (rand() < 0.3) remember(q, `Said hi to ${bot.name}, the robot ${bot.by} built.`, 1, 'robot'); }
  }
}
function robotTap(id) {
  const bot = (W.robots || []).find((r) => r.id === id); if (!bot) return;
  bot.jump = now + 0.6; Sound.ui && Sound.ui();
  toast(`🤖 ${bot.name}: "${pick(ROBOT_KINDS[bot.kind]?.lines || ['BEEP.'])}" (built by ${bot.by})`);
}
function civilBuild(p, type) {
  if (!BUILDS[type]) return false;
  const size = BUILDS[type].size || 1.6;
  for (let i = 0; i < 80; i++) {
    const [x, z] = rand() < 0.75 ? polar(rand() * 360, 9 + rand() * 16) : [DT.x + (rand() - 0.5) * 12, DT.z + (rand() - 0.5) * 12];
    if (spotProblem(x, z, size)) continue;
    W.placed = W.placed || []; W.placed.push({ id: uid(), type, x, z, rot: rand() * 6.28, day: W.day, by: p.name });
    buildPlaced(); return true;
  }
  return false;
}

// talking with researchers
function labChat(p, who, text) { p.labChat = p.labChat || []; p.labChat.push({ who, text: String(text).slice(0, 400), day: W.day }); if (p.labChat.length > 14) p.labChat.shift(); }
async function labAct(pid, act, text) {
  const p = person(pid); if (!p) return '';
  const R = ensureResearch(p); if (!R) return `${p.name} doesn't work at Glimmer Labs.`;
  if (act === 'coffee') {
    if (p.coffeeDay === W.day) return `${p.name} already has coffee. Any more and they'll vibrate.`;
    p.coffeeDay = W.day; addJoy(p, 8); creatorShift(p, 0.15);
    if (!R.stuck) R.progress = Math.min(99, R.progress + 3);
    const line = pick(['Oh! Coffee! You are a lifesaver.', 'For me? Okay, I can think again.', "This is exactly what I needed. Thank you."]);
    labChat(p, 'them', line); remember(p, 'The Creator brought me coffee at the lab.', 2, 'creatorGift'); markDirty();
    return `☕ ${p.name}: "${line}"`;
  }
  const said = String(text || '').trim().slice(0, 400);
  if (act === 'idea' && !said) return '';
  if (said) labChat(p, 'you', said);
  const fallback = () => {
    if (act === 'ask') return R.stuck ? `Honestly? I'm stuck. ${cap(R.stuck.problem)}. Any ideas?` : pick([`It's going okay! About ${Math.round(R.progress)}% done. ${R.notes.slice(-1)[0]?.text || ''}`, `We're working on ${R.title}. ${R.notes.slice(-1)[0]?.text || 'Slowly.'}`]);
    const good = GOOD_IDEA[p.job].test(said);
    return good ? pick(['Oh. OH. That might actually work.', "Wait, that's smart. Let me try that.", 'Hm! I never thought of it that way.']) : pick(["Hmm, I'm not sure that's it, but thank you.", "Maybe? I'll think about it.", 'Interesting. Not sure it fits, but I wrote it down.']);
  };
  let reply = null, helpful = act === 'idea' ? (GOOD_IDEA[p.job].test(said) ? 2 : 1) : 0, note = null, findings = null;
  if (aiReady() && aiBusy < 2) {
    try {
      const r = await llm(`You are ${p.name}, who works as a ${JOBS[p.job].title} on ${ISL.name}, a tiny island town. In your own words: ${p.selfNote}
${classContext(p, p)}${readingContext(p)}${typeof healthContext === 'function' ? healthContext(p, p) : ''}
YOUR PROJECT: ${R.title}. About ${Math.round(R.progress)}% done.${R.stuck ? ` You're STUCK: ${R.stuck.problem}.` : ''}
Your recent lab notes: ${R.notes.slice(-4).map((n) => n.text).join(' / ') || 'none yet'}
Recent chat with the Creator (a mysterious being who made the island and is visiting your lab):
${(p.labChat || []).slice(-6).map((m) => `${m.who === 'you' ? 'Creator' : p.name}: ${m.text}`).join('\n')}
${act === 'ask' ? 'The Creator asked how your work is going. Explain what you are working on and where you are at, in your own voice, like you would to a curious friend. Be specific.' : `The Creator just said: "${said}". Respond to it in your own voice. Engage with the actual idea. If it helps your project, get excited and say how you would use it; if it doesn't, say so kindly and honestly. Real ${FIELD[p.job] || (p.job === 'robo' ? 'robotics' : p.job === 'civil' ? 'engineering' : 'software')} talk is welcome.`}
Reply with only JSON: {"reply": "2-4 sentences", "helpful": 0-3 (how much the Creator's idea moves your project forward; 0 if they just asked a question), "note": "one line for your lab notebook, or null", "finding": "if this led to a real insight, one short sentence stating it, else null"}`, { model: modelOf(p), max: 320, fallbackKey: 'reply' });
      if (r && r.reply) { reply = String(r.reply).slice(0, 500); helpful = act === 'ask' ? 0 : clamp(Math.round(Number(r.helpful) || 0), 0, 3); note = r.note ? String(r.note).slice(0, 160) : null; findings = r.finding ? String(r.finding).slice(0, 160) : null; }
    } catch (e) {}
  }
  if (!reply) reply = fallback();
  labChat(p, 'them', reply);
  if (note) labNote(p, note);
  if (findings) (R.findings = R.findings || []).push(findings);
  if (act === 'idea') {
    remember(p, `The Creator came by the lab and suggested: "${said.slice(0, 120)}"`, 2, 'creatorTalk');
    if (helpful >= 2) { R.helped++; if (R.stuck) { labNote(p, `Unstuck, thanks to the Creator's idea.`); diary(`💡 The <span class="cr">Creator</span> helped <b>${esc(p.name)}</b> get unstuck at Glimmer Labs.`); R.stuck = null; } R.progress = Math.min(100, R.progress + helpful * 6); creatorShift(p, 0.3); addJoy(p, 10); }
    else if (helpful === 1) R.progress = Math.min(99, R.progress + 2);
    if (R.progress >= 100) finishResearch(p);
  }
  markDirty();
  return '';
}
let labOpen = null, labWingLast = 'comp';
function openLab(pid) { labOpen = pid; renderLab(); $('#labBox').hidden = false; if (MODE === 'host') sheet.hidden = true; }
function renderLab() {
  const p = labOpen && person(labOpen); if (!p) { $('#labBox').hidden = true; return; }
  const R = ensureResearch(p);
  const here = p.inside && p.task?.kind === 'work';
  const WG = R && LAB_WINGS[wingOf(p.job)];
  $('#labBody').innerHTML = !R ? `<p>${esc(p.name)} doesn't work at Glimmer Labs.</p>` : `
    <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font:16px var(--display)">${esc(p.name)}</b><span class="hint">${WG.icon} ${esc(JOBS[p.job].short)} · ${here ? 'at their desk' : 'not at the lab right now'}</span></div>
    <p class="label">${PROJECT_WORD[p.job] || 'Project'}</p><p style="margin:2px 0">${esc(cap(R.title))}</p>
    <div class="meter gold"><i style="width:${Math.round(R.progress)}%"></i></div><p class="hint">${Math.round(R.progress)}% done${R.helped ? ` · you've helped ${R.helped}×` : ''}</p>
    ${R.stuck ? `<p class="note" style="color:var(--bad)">🧩 Stuck: ${esc(R.stuck.problem)}.</p>` : ''}
    ${R.notes.length ? `<p class="label">Lab notebook</p>${R.notes.slice(-4).reverse().map((n) => `<p class="note"><span class="chip">day ${n.day}</span> ${esc(n.text)}</p>`).join('')}` : ''}
    <div class="chat" style="margin-top:8px">${(p.labChat || []).slice(-6).map((m) => `<div class="msg ${m.who === 'you' ? 'r' : 'l'}"><span class="msg-n">${m.who === 'you' ? 'You' : esc(p.name)}</span><span class="msg-t">${esc(m.text)}</span></div>`).join('')}</div>
    <form data-labform style="margin-top:8px"><textarea id="labIdea" rows="2" maxlength="400" placeholder="${R.stuck ? 'Suggest a fix, or ask about the problem…' : 'Ask about their work or share an idea…'}" style="width:100%;font:14px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></textarea>
    <div class="btns"><button class="btn gold" type="submit">Share</button><button class="btn" type="button" data-labask>How's it going?</button><button class="btn" type="button" data-labcoffee ${p.coffeeDay === W.day ? 'disabled' : ''}>Bring coffee ☕</button><button class="btn" type="button" data-labclose>Close</button></div></form>`;
  const ch = $('#labBody .chat'); if (ch) ch.scrollTop = 1e6;
}
function labsKey() { const wing = interior?.wing || 'comp', st = labStaff(wing); return ['l', wing, st.filter((p) => p.inside && p.task?.kind === 'work').map((p) => p.id).join(','), st.map((p) => `${p.id}:${Math.round(p.research?.progress || 0)}:${p.research?.stuck ? 1 : 0}`).join(','), (W.robots || []).length].join('|'); }

// the three floors
function canvasPlane(w, h, draw, pw, ph) { const tx = document.createElement('canvas'); tx.width = w; tx.height = h; draw(tx.getContext('2d')); return mesh(new T3.PlaneGeometry(pw, ph), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(tx) }), 0, 0, 0, false); }
function compDesk(p, R) {
  const d = new T3.Group();
  d.add(mesh(box(2, 0.12, 1), toon('#f4ecdc'), 0, 0.85, 0)); for (const s of [-0.9, 0.9]) d.add(mesh(box(0.08, 0.85, 0.9), toon('#8a84a8'), s, 0.42, 0));
  d.add(mesh(box(0.9, 0.6, 0.06), toon('#2a2733'), 0, 1.3, -0.3)); d.add(mesh(box(0.8, 0.5, 0.02), toon(R?.stuck ? '#ff9090' : p.job === 'ai' ? '#9fe3ff' : '#9fe3c4', { emissive: new T3.Color(R?.stuck ? '#6a1a1a' : '#10405a') }), 0, 1.3, -0.26, false));
  d.add(mesh(box(0.5, 0.03, 0.18), toon('#c9ccd6'), 0, 0.92, 0.15));
  return d;
}
function labBench(p, R) {
  const d = new T3.Group(), glassC = { bio: ['#8fd48a', '#c9f0a8', '#6fbf6a'], chem: ['#ff9fbf', '#c9b3ff', '#ffe98a'], phys: ['#9fd3ff', '#bfe8ff', '#6f73c9'] }[p.job] || ['#9fe3c4', '#ffffff', '#9fd3ff'];
  d.add(mesh(box(2, 0.8, 0.9), toon('#3d6a5a'), 0, 0.4, 0)); d.add(mesh(box(2.1, 0.08, 1), toon('#f4f8f6'), 0, 0.84, 0));
  glassC.forEach((c, i) => { const b = mesh(cyl(0.1, 0.1, 0.26 + i * 0.05, 10), toon(c, { emissive: new T3.Color(c).multiplyScalar(0.25) }), -0.75 + i * 0.25, 1.0 + i * 0.025, 0.15); d.add(b); });
  if (p.job === 'bio') { const m = new T3.Group(); m.add(mesh(box(0.3, 0.06, 0.3), toon('#2a2733'), 0, 0.02, 0)); m.add(mesh(cyl(0.04, 0.04, 0.45, 6), toon('#c9ccd6'), 0, 0.25, -0.08)); const tube = mesh(cyl(0.05, 0.05, 0.3, 8), toon('#2a2733'), 0, 0.42, 0.02); tube.rotation.x = -0.5; m.add(tube); m.position.set(0.45, 0.88, 0.1); d.add(m); }
  else if (p.job === 'chem') { d.add(mesh(sph(0.16, 10, 8), toon('#c9b3ff', { emissive: new T3.Color('#3a2a6a') }), 0.45, 1.0, 0.1)); d.add(mesh(cyl(0.05, 0.05, 0.22, 8), toon('#e8e4ff'), 0.45, 1.2, 0.1)); d.add(mesh(cyl(0.12, 0.14, 0.05, 10), toon('#2a2733'), 0.45, 0.9, 0.1)); }
  else { d.add(mesh(cyl(0.02, 0.02, 0.6, 5), toon('#c9ccd6'), 0.45, 1.18, -0.1)); d.add(mesh(box(0.5, 0.03, 0.03), toon('#c9ccd6'), 0.45, 1.48, -0.1)); d.add(mesh(sph(0.07, 8, 6), toon('#ffd36b'), 0.5, 1.12, -0.1)); }
  d.add(mesh(box(0.5, 0.36, 0.04), toon('#2a2733'), 0.75, 1.1, -0.35)); d.add(mesh(box(0.44, 0.3, 0.02), toon(R?.stuck ? '#ff9090' : '#9fe3c4', { emissive: new T3.Color(R?.stuck ? '#6a1a1a' : '#10405a') }), 0.75, 1.1, -0.32, false));
  return d;
}
function workBench(p, R, back) {
  const d = new T3.Group(), wood = toon('#c49a6c');
  d.add(mesh(box(2.1, 0.12, 1), wood, 0, 0.85, 0)); for (const [x, z] of [[-0.95, -0.4], [0.95, -0.4], [-0.95, 0.4], [0.95, 0.4]]) d.add(mesh(box(0.1, 0.85, 0.1), toon('#8a6a4e'), x, 0.42, z));
  if (back) { d.add(mesh(box(2, 0.9, 0.05), toon('#e8d8b8'), 0, 1.45, -1.4)); for (let i = 0; i < 4; i++) d.add(mesh(box(0.06, 0.4 + (i % 2) * 0.15, 0.04), toon(['#ff6f5e', '#3d4f86', '#ffb347', '#8a84a8'][i]), -0.7 + i * 0.3, 1.5, -1.36, false)); }
  if (p.job === 'robo') { const b = new T3.Group(); b.add(mesh(box(0.34, 0.3, 0.28), toon('#ffe98a'), 0, 0.15, 0)); b.add(mesh(box(0.24, 0.2, 0.2), toon('#c9ccd6'), 0, 0.42, 0)); b.add(mesh(box(0.16, 0.05, 0.02), toon(R?.stuck ? '#ff6f5e' : '#9fe3ff', { emissive: new T3.Color(R?.stuck ? '#801010' : '#2a6a8a') }), 0, 0.44, 0.11, false)); b.position.set(0.3, 0.91, 0.05); b.rotation.y = -0.5; d.add(b); }
  else { for (let i = 0; i < 5; i++) { const t = mesh(box(0.05, 0.05, 0.32), toon('#fff4dc'), -0.5 + i * 0.2, 1.08 + (i % 2) * 0.08, 0.05); t.rotation.x = (i % 2 ? 1 : -1) * 0.6; d.add(t); } d.add(mesh(box(1.1, 0.04, 0.3), toon('#fff4dc'), 0, 0.96, 0.05)); d.add(mesh(sph(0.05, 6, 5), toon(R?.stuck ? '#ff6f5e' : '#8fe0b0', { emissive: new T3.Color(R?.stuck ? '#801010' : '#20a060') }), 0.8, 1.0, 0.3, false)); }
  return d;
}
function projectsBoard(S, staff, wing) {
  const blue = wing === 'eng';
  const wb = canvasPlane(512, 256, (g) => {
    g.fillStyle = blue ? '#2f5aa0' : '#ffffff'; g.fillRect(0, 0, 512, 256);
    if (blue) { g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 2; for (let i = 64; i < 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); } for (let i = 64; i < 256; i += 64) { g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); } }
    g.fillStyle = blue ? '#ffffff' : LAB_WINGS[wing].trim; g.font = '26px "Mochiy Pop One", sans-serif'; g.fillText(blue ? 'Blueprints' : 'Projects', 20, 38);
    g.font = '18px sans-serif';
    staff.slice(0, 5).forEach((p, i) => { const R = p.research; if (!R) return; g.fillStyle = blue ? '#ffffff' : '#2a2733'; g.fillText(`${p.name}: ${R.title}`.slice(0, 44), 20, 78 + i * 38); g.fillStyle = blue ? 'rgba(255,255,255,0.3)' : '#e8e4ff'; g.fillRect(20, 86 + i * 38, 300, 8); g.fillStyle = R.stuck ? '#ff6f5e' : blue ? '#ffe98a' : LAB_WINGS[wing].trim; g.fillRect(20, 86 + i * 38, 3 * Math.min(100, R.progress), 8); });
    if (!staff.length) { g.fillStyle = blue ? '#ffffff' : '#6d6488'; g.fillText('Hiring! Read up on the subject to apply.', 20, 90); }
  }, 3.6, 1.8);
  wb.position.set(0, 2.9, -3.94); S.add(wb);
}
function sciProps(S) {
  const hood = new T3.Group(); hood.add(mesh(box(1.4, 0.9, 0.9), toon('#3d6a5a'), 0, 0.45, 0)); hood.add(mesh(box(1.4, 1.3, 0.9), toon('#d4e4dc'), 0, 1.55, 0)); hood.add(mesh(box(1.2, 0.9, 0.02), toon('#bfe8ff', { transparent: true, opacity: 0.55 }), 0, 1.5, 0.46, false)); hood.add(mesh(cyl(0.08, 0.1, 0.25, 8), toon('#ffb347', { emissive: new T3.Color('#6a3a00') }), 0.2, 1.05, 0.1)); hood.position.set(-3.7, 0, -3.3); S.add(hood);
  const tank = new T3.Group(); tank.add(mesh(box(1.3, 0.7, 0.7), toon('#5a5470'), 0, 0.35, 0)); tank.add(mesh(box(1.3, 0.8, 0.7), toon('#8fd8ff', { transparent: true, opacity: 0.55, emissive: new T3.Color('#1a4a66') }), 0, 1.1, 0, false)); const star = mesh(new T3.CylinderGeometry(0.16, 0.16, 0.04, 5), toon('#ff8f6f'), -0.2, 0.76, 0.1); tank.add(star); tank.add(mesh(sph(0.08, 8, 6), toon('#ffb347'), 0.3, 1.2, 0.05)); tank.position.set(3.7, 0, -3.35); S.add(tank);
  const scope = new T3.Group(); for (const a of [0, 2.1, 4.2]) { const l = mesh(cyl(0.03, 0.03, 1.3, 5), toon('#5a5470'), Math.sin(a) * 0.3, 0.6, Math.cos(a) * 0.3); l.rotation.z = Math.sin(a) * 0.25; l.rotation.x = -Math.cos(a) * 0.25; scope.add(l); } const tube = mesh(cyl(0.14, 0.09, 1.3, 12), toon('#3d4f86'), 0, 1.45, 0); tube.rotation.x = -0.7; scope.add(tube); const lens = mesh(cyl(0.16, 0.16, 0.08, 12), toon('#ffd36b'), 0, 1.45 + Math.cos(0.7) * 0.66, -Math.sin(0.7) * 0.66); lens.rotation.x = -0.7; scope.add(lens); scope.position.set(3.6, 0, 2.6); S.add(scope);
  const pt = canvasPlane(384, 256, (g) => { g.fillStyle = '#fffaf2'; g.fillRect(0, 0, 384, 256); const cols = ['#ff9f9f', '#ffd39f', '#fff39f', '#bff0a8', '#9fe3ff', '#c9b3ff']; for (let r = 0; r < 6; r++) for (let c = 0; c < 12; c++) { if (r < 2 && c > 1 && c < 10) continue; g.fillStyle = cols[(r + c) % 6]; g.fillRect(12 + c * 30, 30 + r * 34, 26, 30); } g.fillStyle = '#2a2733'; g.font = '16px sans-serif'; g.fillText('elements (mostly)', 110, 22); }, 1.8, 1.2);
  pt.rotation.y = Math.PI / 2; pt.position.set(-4.47, 2.6, 0.3); S.add(pt);
}
function engProps(S) {
  const arm = new T3.Group(); arm.add(mesh(cyl(0.4, 0.5, 0.3, 14), toon('#ffb347'), 0, 0.15, 0)); const s1 = mesh(box(0.22, 1.2, 0.22), toon('#ffb347'), 0, 0.85, 0); s1.rotation.z = 0.35; arm.add(s1); const s2 = mesh(box(0.18, 1.0, 0.18), toon('#ffb347'), 0.55, 1.6, 0); s2.rotation.z = -1.0; arm.add(s2); arm.add(mesh(sph(0.14, 8, 6), toon('#5a5470'), 0.2, 1.4, 0)); arm.add(mesh(box(0.1, 0.22, 0.24), toon('#5a5470'), 1.0, 1.35, 0)); arm.position.set(-3.5, 0, 2.9); arm.rotation.y = 0.8; S.add(arm);
  const pr = new T3.Group(); pr.add(mesh(box(1, 1, 0.9), toon('#2a2733'), 0, 1.3, 0)); pr.add(mesh(box(0.8, 0.7, 0.02), toon('#ffb347', { transparent: true, opacity: 0.5, emissive: new T3.Color('#6a3a00') }), 0, 1.3, 0.46, false)); pr.add(mesh(box(1.2, 0.8, 1), toon('#8a84a8'), 0, 0.4, 0)); pr.add(mesh(sph(0.1, 8, 6), toon('#ff9fbf'), 0, 1.05, 0.1)); pr.position.set(3.7, 0, -3.3); S.add(pr);
  const tb = new T3.Group(); tb.add(mesh(box(1.6, 0.08, 1), toon('#c49a6c'), 0, 0.75, 0)); for (const [x, z] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) tb.add(mesh(box(0.08, 0.75, 0.08), toon('#8a6a4e'), x, 0.37, z)); const arch = mesh(new T3.TorusGeometry(0.55, 0.05, 6, 16, Math.PI), toon('#c9ccd6'), 0, 0.8, 0); tb.add(arch); tb.add(mesh(box(1.3, 0.05, 0.25), toon('#fff4dc'), 0, 1.0, 0)); tb.position.set(3.4, 0, 2.7); S.add(tb);
  for (let i = 0; i < 3; i++) { const gear = new T3.Group(); gear.add(mesh(new T3.TorusGeometry(0.28 + i * 0.08, 0.08, 6, 14), toon(['#ffb347', '#c9ccd6', '#b86b3a'][i]), 0, 0, 0, false)); for (let k = 0; k < 8; k++) { const t = mesh(box(0.1, 0.14, 0.08), toon(['#ffb347', '#c9ccd6', '#b86b3a'][i]), Math.cos(k / 8 * 6.28) * (0.38 + i * 0.08), Math.sin(k / 8 * 6.28) * (0.38 + i * 0.08), 0, false); t.rotation.z = k / 8 * 6.28; gear.add(t); } gear.rotation.y = Math.PI / 2; gear.position.set(-4.45, 2.2 + i * 0.55, -1.2 + i * 0.75); gear.userData.spin = (i % 2 ? -1 : 1) * (0.6 - i * 0.12); S.add(gear); }
}
function buildLabsRoom() {
  const S = roomScene, wing = interior.wing || 'comp', WG = LAB_WINGS[wing];
  labWingLast = wing;
  shell(S, WG.wall, WG.floor, { pattern: wing === 'eng' ? 'stripes' : 'dots', wainscot: WG.trim });
  const staff = labStaff(wing);
  const desks = [[-2.6, -1.6], [0, -1.6], [2.6, -1.6], [-2.6, 1.2], [0, 1.2], [2.6, 1.2]];
  staff.slice(0, 6).forEach((p, i) => {
    const [x, z] = desks[i], R = ensureResearch(p);
    const d = wing === 'sci' ? labBench(p, R) : wing === 'eng' ? workBench(p, R, i < 3) : compDesk(p, R);
    d.position.set(x, 0, z); d.traverse((o) => (o.userData.tap = { kind: 'desk', pid: p.id })); S.add(d);
    const here = p.inside && p.task?.kind === 'work';
    if (here) addPerson(S, p, x + (wing === 'comp' ? 0.6 : -0.4), z - 0.9, 0.2, {});
    else { const pl = sign(p.name, '#fffaf2', WG.trim, 1.2); pl.position.set(x, 1.1, z + 0.52); pl.traverse((o) => (o.userData.tap = { kind: 'desk', pid: p.id })); S.add(pl); }
  });
  projectsBoard(S, staff, wing);
  if (wing === 'comp') {
    const rack = new T3.Group(); rack.add(mesh(box(0.9, 2.4, 0.8), toon('#2a2733'), 0, 1.2, 0)); for (let i = 0; i < 8; i++) rack.add(mesh(sph(0.04, 6, 5), toon(i % 3 ? '#8fe0b0' : '#ff9090', { emissive: new T3.Color(i % 3 ? '#20a060' : '#a02020') }), -0.25 + (i % 4) * 0.16, 0.6 + Math.floor(i / 4) * 0.8, 0.41, false)); rack.position.set(-4, 0, -3.3); S.add(rack);
    const cm = new T3.Group(); cm.add(mesh(box(0.6, 0.8, 0.5), toon('#c9ccd6'), 0, 1.3, 0)); cm.add(mesh(cyl(0.1, 0.08, 0.16, 10), toon('#ffffff'), 0, 0.98, 0.12)); cm.add(mesh(box(1.2, 0.9, 0.7), toon('#8a84a8'), 0, 0.45, 0)); cm.position.set(3.6, 0, -3.3); S.add(cm);
    const bb = mesh(sph(0.6, 12, 9), toon('#ffb3c7'), 3.5, 0.45, 2.8); bb.scale.y = 0.7; S.add(bb);
  } else if (wing === 'sci') sciProps(S); else engProps(S);
  const sg = sign(`${WG.icon} ${WG.name}`, '#0e1a3a', '#9fe3ff', 2.6); sg.position.set(-2.8, 3.9, -3.97); S.add(sg);
  const n = staff.filter((p) => p.inside && p.task?.kind === 'work').length;
  $('#rcTitle').textContent = `Glimmer Labs · ${WG.name} floor`;
  $('#rcSub').textContent = !staff.length ? `Nobody works on this floor yet. Residents who read up on ${WG.about} can get hired.` : n ? `${plural(n, 'person')} at work. Tap someone to talk about their work.` : "Nobody's here right now (office hours are mornings to late afternoon). Tap a bench to check their notebook.";
  const rb = $('#rcBtns'); if (rb) rb.innerHTML = Object.entries(LAB_WINGS).map(([k, w]) => `<button class="btn" type="button" data-wing="${k}" aria-pressed="${k === wing}">${w.icon} ${w.name}</button>`).join('');
}
function labsSpin(dt) { if (interior?.kind !== 'labs') return; roomScene.children.forEach((o) => { if (o.userData?.spin) o.rotation.x += o.userData.spin * dt; }); }
function labsHtml() {
  const pub = (W.published || []).slice(-6).reverse();
  const rows = Object.entries(LAB_WINGS).map(([k, WG]) => {
    const staff = labStaff(k);
    return `<p class="hint" style="margin:8px 0 2px"><b>${WG.icon} ${WG.name}</b> · ${esc(WG.about)} <button class="btn" type="button" data-labsview="${k}" style="padding:2px 10px;font-size:12px">${MODE === 'host' ? 'Go inside' : 'Show in the box'}</button></p>${staff.length ? `<div class="chips">${staff.map((p) => { const R = ensureResearch(p); return `<button class="btn" type="button" data-openlab="${p.id}" style="padding:4px 10px;font-size:12px">${esc(p.name)}: ${esc(R.title)} (${Math.round(R.progress)}%${R.stuck ? ', stuck' : ''})</button>`; }).join('')}</div>` : '<p class="hint">Nobody works on this floor yet.</p>'}`;
  }).join('');
  const bots = (W.robots || []).length ? `<p class="hint">🤖 Robots out on the island: ${W.robots.map((r) => `${esc(r.name)} (${esc(ROBOT_KINDS[r.kind]?.name.replace(/^an? /, '') || 'robot')}, by ${esc(r.by)})`).join(', ')}.</p>` : '';
  return `<p class="label">🔬 Glimmer Labs</p>${rows}${bots}
    ${pub.length ? pub.map((x) => `<p class="note"><span class="chip">day ${x.day}</span> ${DONE_ICON[x.kind] || '🚀'} ${esc(x.by)}: ${esc(x.title)}${x.thanks ? ' (thanks you)' : ''}</p>`).join('') : ''}`;
}

