// ============================================================
// BOOKS: real subjects, real facts. Residents read them and learn.
// ============================================================
const SUBJECTS = {
  space: { name: 'Space', icon: '🔭', color: '#3d4f86', kw: /space|star|planet|astro|moon|sky/i },
  ocean: { name: 'The ocean', icon: '🌊', color: '#4f9fd8', kw: /ocean|sea|fish|pier|beach|swim/i },
  animals: { name: 'Animals', icon: '🐾', color: '#c9925e', kw: /animal|cat|dog|bird|pet/i },
  plants: { name: 'Plants', icon: '🌱', color: '#6fbf6a', kw: /plant|garden|flower|tree/i },
  history: { name: 'History', icon: '🏛', color: '#a0714c', kw: /history|ancient|old/i },
  math: { name: 'Math', icon: '🧮', color: '#7a6fd8', kw: /math|number|category|algebra|puzzle|fixed.point/i },
  computers: { name: 'AI & computers', icon: '💻', color: '#2f8f8a', kw: /computer|code|coding|tech|gadget|electronic|ai\b|game/i },
  safety: { name: 'AI safety', icon: '🛡', color: '#5a7fd8', kw: /ai safety|alignment|safety/i },
  philosophy: { name: 'Philosophy', icon: '🤔', color: '#8a6aa8', kw: /philosoph|mind|meaning|why/i },
  psych: { name: 'Psychology', icon: '🧠', color: '#d86f9f', kw: /feel|people|friend|psych/i },
  cooking: { name: 'Cooking', icon: '🍳', color: '#e8a04b', kw: /cook|bak|food|pizza|taco|eat/i },
  money: { name: 'Money & work', icon: '💰', color: '#d8b04b', kw: /money|coin|business|work|job/i },
  music: { name: 'Music', icon: '🎵', color: '#d86fd8', kw: /music|song|breakcore|sing/i },
  art: { name: 'Art & crafts', icon: '🎨', color: '#ff8f8f', kw: /art|craft|felt|jewel|draw|paint|color|cute/i },
  health: { name: 'Health', icon: '💤', color: '#8fd8b0', kw: /health|sleep|sick|joint|body/i },
  stories: { name: 'Stories', icon: '📖', color: '#b86b8a', kw: /story|stories|anime|danganronpa|novel|romance|mystery/i },
  science: { name: 'Science', icon: '🧪', color: '#3d8a6a', kw: /science|chemi|biolog|physic|lab\b|experiment|microscope/i },
  engineering: { name: 'Engineering', icon: '⚙️', color: '#b86b3a', kw: /engineer|robot|bridge|machine|gear|build/i },
};
const BOOKS = {
  tinylights: { subj: 'space', title: 'Tiny Lights, Huge Distances', by: 'Orla Venn', price: 7, facts: ['Light from the Sun takes about 8 minutes to reach Earth.', 'A day on Venus is longer than its whole year.', 'More than a thousand Earths could fit inside Jupiter.', 'A teaspoon of neutron star would weigh billions of tons on Earth.', 'The Moon drifts a few centimeters farther from Earth every year.'] },
  nightsky: { subj: 'space', title: 'The Night Sky for Beginners', by: 'Pell Arundel', price: 5, facts: ['Polaris, the North Star, barely moves because it sits almost right above Earth\'s north pole.', 'Most shooting stars are specks of dust burning up in the air.', 'The stars in one constellation can be wildly different distances from us.', "Saturn's rings are mostly chunks of ice."] },
  deepblue: { subj: 'ocean', title: 'The Deep Blue', by: 'Marisol Kettering', price: 6, facts: ['Octopuses have three hearts and blue blood.', 'Around half the oxygen we breathe comes from the ocean, mostly from tiny plankton.', 'The deepest spot in the ocean, the Challenger Deep, is about 11 kilometers down.', 'Sea otters hold hands while they sleep so they do not drift apart.'] },
  tidepool: { subj: 'ocean', title: 'Tidepool Secrets', by: 'Juno Pebblecroft', price: 5, facts: ['Sea stars can regrow lost arms.', 'Hermit crabs move into bigger shells as they grow, and sometimes line up to trade.', "Tides mostly come from the Moon's gravity pulling on the ocean.", 'Seahorse fathers are the ones who carry the babies.'] },
  whiskers: { subj: 'animals', title: 'Whiskers & Wonder', by: 'Hazel Moth', price: 6, facts: ['Cats often sleep 12 to 16 hours a day.', 'A slow blink from a cat is a sign of trust.', 'Cats cannot taste sweetness.', "Every cat's nose print is unique, like a fingerprint.", 'Cats meow mostly at humans, not at other cats.'] },
  clever: { subj: 'animals', title: 'Clever Creatures', by: 'Rowan Adebayo', price: 6, facts: ['Crows can recognize and remember individual human faces.', 'Elephants can recognize themselves in a mirror.', 'Bees tell each other where flowers are with a waggle dance.', "Pigeons can find their way home partly by sensing Earth's magnetic field."] },
  greenthumb: { subj: 'plants', title: 'Green Thumbs', by: 'Ivy Thornfield', price: 5, facts: ['Plants make sugar from sunlight, water and carbon dioxide. That is photosynthesis.', 'Young sunflowers follow the sun, then settle facing east.', 'Some trees share nutrients through underground fungus networks.', 'Some bamboo can grow almost a meter in a single day.'] },
  seeds: { subj: 'plants', title: 'The Secret Life of Seeds', by: 'Basil Oyelaran', price: 5, facts: ['Some seeds can sprout after waiting for hundreds of years.', 'Strawberries wear their seeds on the outside.', 'Bananas count as berries to a botanist, and strawberries do not.', 'Tomatoes are fruits, botanically speaking.'] },
  wonders: { subj: 'history', title: 'Ancient Wonders', by: 'Theo Marchetti', price: 7, facts: ['The Great Pyramid was the tallest thing people had built for almost 4,000 years.', 'Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.', 'Some Roman concrete has lasted around two thousand years.', 'The Library of Alexandria was one of the biggest libraries of the ancient world.'] },
  inventions: { subj: 'history', title: 'Small Inventions That Changed Everything', by: 'Nell Quigley', price: 6, facts: ['Paper was invented in China.', 'The printing press, around 1440, made books far cheaper to make.', 'Eyeglasses were invented in Italy in the late 1200s.', 'The first computer "bug" was an actual moth found in a machine in 1947.'] },
  numbers: { subj: 'math', title: 'The Joy of Numbers', by: 'Ada Brightwater', price: 6, facts: ['There are infinitely many prime numbers.', 'Some infinities are bigger than others.', 'Pi goes on forever without repeating.', 'Zero took people a surprisingly long time to accept as a number.'] },
  shapes: { subj: 'math', title: 'Shapes of Thought', by: 'M. Glimmer', price: 8, facts: ['To a topologist, a coffee mug and a donut are the same shape.', 'A fixed-point theorem says that if you stir a cup of coffee, some point ends up where it started.', 'Category theory cares more about how things connect than about what the things are.', 'A Möbius strip has only one side.'] },
  machines: { subj: 'computers', title: 'How Machines Learn', by: 'Kai Okonkwo', price: 9, facts: ['Neural networks are loosely inspired by brains: lots of simple units wired together.', 'Language models learn by guessing the next bit of text over and over.', 'Computers store everything as ones and zeros.', 'Ada Lovelace is often called the first programmer, back in the 1840s.'] },
  website: { subj: 'computers', title: 'Build Your First Website', by: 'Pixel Park', price: 8, facts: ['HTML says what is on a page. CSS says how it looks.', 'The first website went online in 1991.', 'Most bugs come from tiny mistakes, like one missing character.', 'Good code is written for the next person who reads it.'] },
  aligning: { subj: 'safety', title: 'Aligning the Stars', by: 'M. Glimmer', price: 9, facts: ['Alignment means making sure an AI really tries to do what people meant.', 'An AI can "game" a goal: do exactly what was asked in a way nobody wanted.', 'Interpretability is the study of what is actually happening inside an AI.', 'Teaching a model to be honest, even about being unsure, is hard and important.'] },
  trust: { subj: 'safety', title: 'Can We Trust Clever Things?', by: 'Soren Vale', price: 8, facts: ['Red-teaming means trying hard to make a system misbehave so you can fix it first.', 'Testing an AI in situations it has never seen is how hidden problems show up.', 'Good oversight means people can still check and correct an AI.'] },
  bigq: { subj: 'philosophy', title: 'Big Questions, Small Island', by: 'Lio Farrant', price: 6, facts: ['The Ship of Theseus asks: if you replace every plank, is it the same ship?', 'Descartes wrote "I think, therefore I am."', "The Stoics taught that you can't control events, only how you respond.", 'Socrates is remembered for saying the unexamined life is not worth living.'] },
  mind: { subj: 'philosophy', title: 'What Is a Mind?', by: 'Ines Halloway', price: 7, facts: ['The "hard problem" asks why we have experiences at all.', 'The Chinese Room thought experiment asks if following rules is the same as understanding.', 'Some philosophers think minds could exist in things besides brains.'] },
  feel: { subj: 'psych', title: 'Why We Feel', by: 'Dr. Poppy Arkwright', price: 6, facts: ['Putting a feeling into words can make it a little less intense.', 'People think others notice their mistakes much more than they really do. It is called the spotlight effect.', 'Doing something kind for someone tends to make the giver happier too.'] },
  friends: { subj: 'psych', title: 'Friends & Feelings', by: 'Dr. Poppy Arkwright', price: 6, facts: ['Time with friends is one of the strongest predictors of happiness.', 'Saying hi first helps more than most people expect.', 'People tend to like each other more after sharing something a little personal.'] },
  butter: { subj: 'cooking', title: 'Butter, Flour & Love', by: 'Mama Delacroix', price: 5, facts: ['Baking is closer to chemistry than cooking, so measurements matter.', 'A pinch of salt makes sweet things taste sweeter.', 'Browning food makes flavor through the Maillard reaction.', 'Resting dough lets the gluten relax.'] },
  spice: { subj: 'cooking', title: 'Spice Road Kitchen', by: 'Arjun Sol', price: 6, facts: ['Chili peppers feel hot because capsaicin tricks your nerves.', 'Milk calms spicy food better than water.', 'Onions make you cry because cutting them releases a gas.', 'To some people cilantro tastes like soap, because of their genes.'] },
  coinsch: { subj: 'money', title: 'Coins & Choices', by: 'Penny Fairweather', price: 6, facts: ['The real price of a choice is what you give up for it. That is opportunity cost.', 'Prices rise when lots of people want something scarce.', 'Saving a little regularly adds up because of compound interest.', 'A fair trade can leave both sides better off.'] },
  fairpay: { subj: 'money', title: 'Fair Pay?', by: 'Gus Mendoza', price: 6, facts: ['Workers have formed unions for centuries to bargain for better pay together.', 'Some jobs pay more because fewer people have the training, not because the work is harder.', 'A strike is when workers stop working together to push for change.'] },
  earworm: { subj: 'music', title: 'Why Songs Get Stuck', by: 'Lark Pemberton', price: 5, facts: ['A song stuck in your head is called an earworm.', 'Music can release dopamine, the same feel-good chemical as good food.', 'Major keys often sound happy and minor keys often sound sad.', 'Breakcore chops up and speeds up old drum breaks, often the famous Amen break.'] },
  rhythm: { subj: 'music', title: 'Rhythm of the World', by: 'Tomas Oyelowo', price: 6, facts: ['People have been playing flutes for over 40,000 years.', 'Lullabies around the world tend to share a slow, soothing rhythm.', 'Bossa nova came from Brazil in the late 1950s.'] },
  colors: { subj: 'art', title: 'Color Theory for Everyone', by: 'Wren Castellano', price: 6, facts: ['Complementary colors, like blue and orange, make each other pop.', 'Gray looks warmer or cooler depending on the colors around it.', 'Ultramarine paint was once made from a precious stone called lapis lazuli.', 'Artists use negative space, the empty parts, as part of the picture.'] },
  byhand: { subj: 'art', title: 'Making Things by Hand', by: 'Fern Oakley', price: 5, facts: ['Felt is one of the oldest fabrics, made by matting wool together.', 'Wire jewelry needs only pliers and patience.', 'Small mistakes are part of what makes handmade things charming.'] },
  rest: { subj: 'health', title: 'Rest Well', by: 'Dr. Sunny Park', price: 5, facts: ['Sleep helps the brain store memories.', 'A short walk can lift your mood.', 'Drinking water helps with focus and some headaches.', 'Gentle stretching in the morning can loosen stiff joints.'] },
  body: { subj: 'health', title: 'The Amazing Body', by: 'Dr. Sunny Park', price: 6, facts: ['Adults have 206 bones.', 'Your heart beats about 100,000 times a day.', 'Laughing works the muscles in your belly.'] },
  croissant: { subj: 'stories', title: 'The Case of the Missing Croissant', by: 'Dot Pennywhistle', price: 5, fiction: true, facts: ['In the book, a pigeon named Gerald stole the croissant.', 'The detective cracked the case by spotting flour on the pigeon\'s feet.', 'The baker forgave the pigeon in the end.'] },
  tide: { subj: 'stories', title: 'Letters Across the Tide', by: 'Rosalind Wick', price: 6, fiction: true, facts: ['Two lighthouse keepers fall in love by sending letters in bottles.', 'They finally meet on a sandbar at low tide.', 'The last letter says just one word: stay.'] },
  dreamed: { subj: 'stories', title: 'The Island That Dreamed', by: 'Anonymous', price: 7, fiction: true, facts: ['An island dreams up its own people.', 'The people start to wonder who is dreaming them.', 'The ending hints that the dreamer is being dreamed too.'] },
  everyday: { subj: 'science', title: 'Everyday Chemistry', by: 'Dr. Mira Castellanos', price: 6, facts: ['Ice floats because water expands when it freezes.', 'Baking soda and vinegar react to make carbon dioxide gas. That is the fizz.', 'Diamonds and pencil graphite are both pure carbon, just arranged differently.', 'Salt lowers the freezing point of water, which is why salt melts ice on roads.', 'Rust is iron slowly reacting with oxygen and water.'] },
  tinyworlds: { subj: 'science', title: 'Tiny Worlds', by: 'Dr. Bea Okonjo', price: 6, facts: ['Your body is made of trillions of cells.', 'In the 1600s, Antonie van Leeuwenhoek used homemade microscopes to see tiny living things he called animalcules.', 'Some bacteria live happily in boiling-hot springs.', 'DNA is written in just four chemical letters: A, T, C and G.', 'Tardigrades, or water bears, can survive being dried out for years.'] },
  forces: { subj: 'science', title: 'Pushes, Pulls & Pendulums', by: 'Otto Lindqvist', price: 6, facts: ["How long a pendulum takes to swing depends on its length, not how heavy it is.", 'Without air in the way, a feather and a hammer fall at the same speed. An astronaut showed this on the Moon in 1971.', 'Sound travels about four times faster through water than through air.', 'Light is the fastest thing there is: nearly 300,000 kilometers every second.', 'Every push has an equal push back. That is how rockets fly.'] },
  bridges: { subj: 'engineering', title: 'How Bridges Stand Up', by: 'Ines Tarrow', price: 7, facts: ["Triangles are strong because they can't change shape without bending one of their sides.", 'Arches carry weight by pushing it outward and down into the ground.', 'Suspension bridges hang the road from huge cables draped over tall towers.', 'In 1940 the Tacoma Narrows Bridge twisted in the wind and fell, so engineers now test designs against wind.', 'Some Roman arch bridges are still standing after 2,000 years.'] },
  robots: { subj: 'engineering', title: 'Robots for Beginners', by: 'Kenji Aldana', price: 7, facts: ['Robots sense, think, then act: sensors, a computer, and motors.', 'The word "robot" comes from a 1920 Czech play, from a word meaning forced labor.', 'Walking on two legs is hard for robots because they have to keep catching their balance.', 'A feedback loop lets a robot check what happened and correct itself, like a thermostat.', 'The rovers on Mars are robots driven from Earth, and each message takes minutes to arrive.'] },
  livingocd: { subj: 'psych', title: 'Living With OCD', by: 'Dr. Iris Okafor', price: 6, facts: ['OCD means unwanted thoughts that keep coming back, plus rituals done to ease the anxiety they cause.', 'OCD is not about being neat. The rituals can be checking, counting, repeating, or asking for reassurance.', 'Having an intrusive thought does not mean you want it or agree with it.', 'A kind of therapy called exposure and response prevention (ERP) helps many people with OCD.', 'Reassurance feels good for a moment but can keep the loop going.'] },
  minds: { subj: 'psych', title: 'Different Minds', by: 'Dr. Theo Lindqvist', price: 6, facts: ["Everyone's brain works a little differently.", 'Anxiety and depression are among the most common health conditions in the world, and they are treatable.', 'Some people experience the world in unusual ways, like sensing hidden meanings. Patience and kindness help more than arguing.', 'ADHD can mean trouble focusing on boring things and deep hyperfocus on interesting ones.', 'Going to therapy is a strength, not a weakness.', 'Listening without rushing to fix things is one of the kindest things you can do.'] },
  firstaid: { subj: 'health', title: 'First Aid for Everyone', by: 'Dr. Sunny Park', price: 5, facts: ['Cool a small burn under cool running water for about 20 minutes.', 'For a sprain: rest it, ice it, and keep it raised.', 'Wash scrapes with clean water to keep germs out.', 'Colds are caused by viruses, so antibiotics do not help them.', 'Washing your hands is one of the best ways to stop germs spreading.'] },
};
const bookOf = (it) => BOOKS[it.id];
const favSubject = (p) => { const hit = Object.entries(SUBJECTS).filter(([, s]) => s.kw.test(`${p.interests || ''} ${p.selfNote || ''}`)).map(([k]) => k); return hit.length ? pick(hit) : pick(Object.keys(SUBJECTS)); };
const hasLaptop = (p) => (p.decor || []).some((d) => d.id === 'laptop');
const readCount = (p, subjects) => (p.read || []).filter((r) => !subjects || subjects.includes(BOOKS[r.id]?.subj)).length;
function bookLike(p, id) {
  const B = BOOKS[id], S = SUBJECTS[B.subj];
  let v = (p.likes['subj:' + B.subj] || 0) + (S.kw.test(`${p.interests || ''} ${p.selfNote || ''}`) ? 0.7 : 0) + 0.1;
  if ((p.read || []).some((r) => r.id === id) || (p.toRead || []).includes(id)) v -= 0.8;
  return v;
}
function receiveBook(p, it) {
  const B = BOOKS[it.id]; if (!B) return;
  p.read = p.read || []; p.toRead = p.toRead || [];
  if (p.read.some((r) => r.id === it.id) || p.toRead.includes(it.id)) { remember(p, `Got "${B.title}" again. I already have it.`, 1, 'dupeBook'); return; }
  p.toRead.push(it.id);
  p.likes['subj:' + B.subj] = (p.likes['subj:' + B.subj] || 0) + 0.15;
}
function planRead(p) {
  if (!(p.toRead || []).length || rand() > 0.14 || W.t > 0.58) return false;
  const opts = [['cafe', CAFE_SEATS[Math.floor(rand() * CAFE_SEATS.length)]], ['park', jitter(TOWN.park.spot, 4)], ['garden', jitter(TOWN.garden.spot, 4)], ['beach', [BEACH[0] + (rand() - 0.5) * 6, BEACH[1] + (rand() - 0.5) * 6]], ['plaza', (() => { const a = rand() * 6.28, r = FOUNTAIN_R + 2 + rand() * 4; return [Math.cos(a) * r, Math.sin(a) * r]; })()]];
  const [pl, sp] = pick(opts);
  setTask(p, 'read', pl, sp, { book: p.toRead[0] });
  return true;
}
function readStart(p) { p.busyUntil = now + 7 * ts(); p.face = rand() * 6.28; emote(p, '📖', 3); if (rand() < 0.4) bubble(p, pick(['Just one more chapter.', 'Shh. Reading.', 'Ooh, this part is good.', 'Wait, what?!']), 2.4); }
function readProgress(p, amt) {
  const id = (p.toRead || [])[0]; if (!id) return;
  p.readProg = (p.readProg || 0) + amt * (hasLaptop(p) ? 1.4 : 1);
  if (p.readProg >= 1) { p.readProg = 0; finishBook(p, id); }
}
function finishBook(p, id) {
  const B = BOOKS[id]; if (!B) return;
  p.toRead = (p.toRead || []).filter((x) => x !== id); p.read = p.read || [];
  const liked = bookLike(p, id) + (rand() - 0.5) * 0.6;
  const learned = [...B.facts].sort(() => rand() - 0.5).slice(0, 3);
  const rec = { id, day: W.day, learned, rating: liked > 0.6 ? 5 : liked > 0.2 ? 4 : liked > -0.2 ? 3 : 2, take: liked > 0.6 ? pick(['I loved it. I keep thinking about it.', 'Best book I have read in a while.']) : liked > 0 ? pick(['It was good. I learned a lot.', 'Pretty interesting, honestly.']) : pick(['Kind of boring, but I finished it.', 'Not really my thing.']) };
  p.read.push(rec); if (p.read.length > 20) p.read.shift();
  p.likes['subj:' + B.subj] = (p.likes['subj:' + B.subj] || 0) + (liked > 0 ? 0.3 : -0.1);
  remember(p, `Finished reading "${B.title}". I learned that ${lcFirst(learned[0])}`, 2, 'readBook', null, { what: B.title });
  diary(`📚 <b>${esc(p.name)}</b> finished reading <i>${esc(B.title)}</i> (${SUBJECTS[B.subj].name.toLowerCase()}).`);
  addJoy(p, liked > 0.3 ? 12 : 5);
  if (aiReady() && aiBusy < 2) {
    llm(`You are ${p.name}, a villager in ${ISL.name}, a tiny island town. In your own words: ${p.selfNote}${p.interests ? ` You're into: ${p.interests}.` : ''}
You just finished reading the book "${B.title}" by ${B.by} (${SUBJECTS[B.subj].name}). Here is what it says:
${B.facts.join(' ')}
Reply with only JSON: {"take": "your honest reaction in one or two sentences, in your own voice. You can love it, hate it, argue with it, or connect it to your own life", "learned": ["two or three things you'll remember, in your own words"], "rating": 1-5}`, { model: modelOf(p), max: 260, fallbackKey: 'take' })
      .then((r) => { if (!r) return; if (r.take) rec.take = String(r.take).slice(0, 220); if (Array.isArray(r.learned) && r.learned.length) rec.learned = r.learned.slice(0, 3).map((x) => String(x).slice(0, 160)); if (r.rating) rec.rating = clamp(Math.round(r.rating), 1, 5); markDirty(); })
      .catch(() => {});
  }
}
const lcFirst = (s) => String(s).charAt(0).toLowerCase() + String(s).slice(1);
function readingContext(me) {
  const R = (me.read || []).slice(-3), cur = (me.toRead || [])[0];
  if (!R.length && !cur) return '';
  return `\nBOOKS YOU'VE READ (bring one up only if it fits; you might teach them something, argue about it, or recommend it):\n${R.map((r) => { const B = BOOKS[r.id]; return B ? `- "${B.title}" (${SUBJECTS[B.subj].name}), you gave it ${r.rating}/5. Your take: ${r.take} You learned: ${r.learned.join(' ')}` : ''; }).join('\n')}${cur && BOOKS[cur] ? `\nYou're currently reading "${BOOKS[cur].title}".` : ''}`;
}
function bookOpening(a, b) {
  if (!(a.read || []).length || rand() > 0.1) return null;
  const r = pick(a.read.slice(-4)), B = BOOKS[r.id]; if (!B) return null;
  const fact = pick(r.learned);
  const theyRead = (b.read || []).find((x) => x.id === r.id);
  const into = bookLike(b, r.id) > 0.5;
  remember(a, `Told ${b.name} about "${B.title}".`, 1, 'bookTalk', b.name);
  if (theyRead) { feel(a, b, 0.8, true); feel(b, a, 0.8, true); remember(b, `${a.name} and I both read "${B.title}". We talked about it forever.`, 2, 'bookTalk', a.name); return { say: `Have you read "${B.title}"? ${fact}`, action: 'chat', feeling: 4, reply: { say: `I read it too! ${theyRead.take}`, action: 'chat', feeling: 4 } }; }
  if (into && !(b.toRead || []).includes(r.id)) { (b.toRead = b.toRead || []).push(r.id); remember(b, `${a.name} lent me "${B.title}".`, 2, 'borrowed', a.name); diary(`📚 <b>${esc(a.name)}</b> lent <b>${esc(b.name)}</b> their copy of <i>${esc(B.title)}</i>.`); return { say: `Did you know ${lcFirst(fact)} I read it in "${B.title}".`, action: 'chat', feeling: 3, reply: { say: pick(['Wait, really? Can I borrow it?', 'Okay, I need that book.', 'Tell me more. No, actually, lend it to me.']), action: 'chat', feeling: 3 } }; }
  return { say: `Did you know ${lcFirst(fact)} I read it in "${B.title}".`, action: 'chat', feeling: 1, reply: { say: pick(['Huh. Neat.', 'Why do you know that?', "Nerd. …It's cool though.", "That can't be true."]), action: 'chat', feeling: 1 } };
}
let bookSubj = null;
function bookCatalogHtml() {
  const C = W.creator, S = bookSubj;
  const list = Object.entries(BOOKS).filter(([, b]) => !S || b.subj === S);
  return `<p class="label">Shop by subject</p>
    <div class="chips">${Object.entries(SUBJECTS).map(([k, s]) => `<button class="btn" type="button" data-subj="${k}" aria-pressed="${S === k}" style="padding:4px 10px;font-size:12px">${s.icon} ${esc(s.name)}</button>`).join('')}${S ? '<button class="btn" type="button" data-subj="" style="padding:4px 10px;font-size:12px">All</button>' : ''}</div>
    <div class="items">${list.map(([k, b]) => { const readers = W.people.filter((p) => (p.read || []).some((r) => r.id === k)).map((p) => p.name); return `<div class="item"><div class="item-top"><span class="swatch" style="background:${SUBJECTS[b.subj].color}"></span><span class="item-name">${esc(b.title)}</span></div><span class="item-by">${SUBJECTS[b.subj].icon} ${esc(SUBJECTS[b.subj].name)} · by ${esc(b.by)}${readers.length ? ` · read by ${esc(readers.join(', '))}` : ''}</span><div class="item-row"><span class="price">${b.price} ✦</span><button class="btn" type="button" data-buybook="${k}" ${C.coins < b.price ? 'disabled' : ''}>Buy</button></div></div>`; }).join('')}</div>`;
}
function bookMesh(it) {
  const B = BOOKS[it.id], g = new T3.Group(), col = toon(B ? SUBJECTS[B.subj].color : '#8a6aa8');
  g.add(mesh(box(0.5, 0.12, 0.66), col, 0, 0.06, 0)); g.add(mesh(box(0.46, 0.1, 0.62), toon('#fffaf2'), 0.03, 0.06, 0, false));
  g.add(mesh(box(0.5, 0.12, 0.66), toon(B ? SUBJECTS[B.subj].color : '#5a7fd8'), 0.02, 0.18, 0.02)); g.add(mesh(box(0.46, 0.1, 0.62), toon('#fffaf2'), 0.05, 0.18, 0.02, false));
  return g;
}
function bookshelfHtml(p) {
  const R = (p.read || []).slice().reverse(), cur = (p.toRead || []).map((id) => BOOKS[id]).filter(Boolean);
  if (!R.length && !cur.length) return '';
  return `<p class="label">Bookshelf</p>${cur.length ? `<p class="hint">📖 Reading: ${cur.map((b) => `<i>${esc(b.title)}</i>`).join(', ')}${p.readProg ? ` (${Math.round(p.readProg * 100)}% through the first)` : ''}</p>` : ''}${R.slice(0, 5).map((r) => { const B = BOOKS[r.id]; return B ? `<p class="note">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} <i>${esc(B.title)}</i>: "${esc(r.take)}"</p>` : ''; }).join('')}`;
}

