// ============================================================
// THE MORNING PAPER
// ============================================================
const stripTags = (h) => String(h).replace(/<[^>]+>/g, '');
function paperTemplate() {
  const lines = W.log.filter((e) => e.day >= W.day - 1).map((e) => stripTags(e.text));
  const big = lines.filter((l) => /refused|finished|born|apologized|ferry|festival|won|quit|leveled|level|made up|stop waiting|dreamed/i.test(l));
  const pool = (big.length ? big : lines.filter((l) => !/^Morning|lights went out/.test(l))).slice(-6);
  const TAGS = [[/ferry/i, 'All Aboard!'], [/refused/i, 'Gift Snubbed!'], [/born/i, 'Baby News'], [/finished/i, 'Built Together'], [/apologized|made up/i, 'Making Up'], [/won/i, 'We Have a Winner'], [/dreamed/i, 'Sweet Dreams'], [/quit/i, 'Career Change'], [/level/i, 'Happy Days'], [/festival/i, 'Festival Night'], [/stop waiting/i, 'Town Turns Its Back']];
  const stories = pool.slice(-3).reverse().map((l) => ({ title: (TAGS.find(([re]) => re.test(l)) || [0, 'Around Town'])[1], text: l }));
  return { day: W.day, headline: stories[0] ? stories[0].text.split(/[.!]/)[0].slice(0, 90) : `A quiet day in ${ISL.name}`, stories };
}
async function makePaper(btn) {
  if (btn) { btn.disabled = true; btn.textContent = 'Printing…'; }
  let paper = null;
  if (RT.sample) {
    const lines = W.log.filter((e) => e.day >= W.day - 1).map((e) => `Day ${e.day}: ${stripTags(e.text)}`).slice(-45).join('\n');
    const who = W.people.map((p) => `${p.name} (${p.job ? JOBS[p.job].short : 'child'}, ${attitude(p)[0].toLowerCase()} toward the Creator)`).join('; ');
    try {
      const r = await RT.sample.json(`You write the tiny daily newspaper for ${ISL.name}, a cute island town full of small villagers, like the news in Tomodachi Life. Residents: ${who}. "The Creator" is the unseen being who made the island and sends gifts.

Here is what happened recently:
${lines || '(nothing yet)'}

Write today's paper: a catchy headline and 2 or 3 short, playful stories (2 or 3 sentences each) about the most interesting things, with a little gossip and quotes from residents that fit what happened. Only use events from the list.
Reply with only JSON: {"headline": "...", "stories": [{"title": "...", "text": "..."}]}`, { modelTier: 'quick', cache: false });
      if (r?.headline && Array.isArray(r.stories)) paper = { day: W.day, headline: String(r.headline).slice(0, 120), stories: r.stories.slice(0, 3).map((s) => ({ title: String(s.title || '').slice(0, 100), text: String(s.text || '').slice(0, 600) })) };
    } catch (e) {}
  }
  if (!paper) paper = paperTemplate();
  send({ t: 'paper', paper });
  if (MODE !== 'host') { W.paper = paper; refreshPanel(true); }
}

