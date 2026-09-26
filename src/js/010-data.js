// ============================================================
// DATA
// ============================================================
const SAVE_KEY = 'glimmer-town-v3';
const MAX_POP = 21;
const ACTIONS = ['chat', 'share_food', 'give_coin', 'ask_for_help', 'tease', 'walk_away'];
const EARS = ['none', 'round', 'pointy', 'antenna', 'sprout'];
const SYL = ['mo', 'ri', 'ka', 'lu', 'pe', 'zu', 'an', 'ti', 'so', 'ne', 'ya', 'bo', 'mi', 'fe', 'pu', 'chi', 'ro', 'na', 'ku', 'ha'];
const COLORS = {
  mint: '#9fe3c4', peach: '#ffc3a0', lilac: '#c9b3ff', sky: '#9fd3ff', lemon: '#ffe98a', rose: '#ff9fbf',
  cream: '#fff4dc', navy: '#3d4f86', tomato: '#ff6f5e', moss: '#8fae6a', charcoal: '#4a4652',
  gray: '#a3a3ad', silver: '#cfd3dc', dusk: '#8aa0bf',
  black: '#2e2a36', white: '#fbf8f4', wine: '#7a2e3a', forest: '#2f5d4a', khaki: '#cdb88f', hotpink: '#ff5fa8', plum: '#5e3a6e',
};
const HATS = {
  beanie: { name: 'beanie', price: 3 }, bow: { name: 'bow', price: 2 }, tophat: { name: 'top hat', price: 5 },
  crown: { name: 'flower crown', price: 3 }, cap: { name: 'cap', price: 3 }, witch: { name: 'witch hat', price: 5 },
  phones: { name: 'headphones', price: 4 },
};
const FOODS = [
  { id: 'apple', shop: 'plot', name: 'apples', price: 2, fill: 0.25, fl: { sweet: 0.7, salty: 0.1, spicy: 0 } },
  { id: 'strawberry', shop: 'plot', name: 'strawberries', price: 2, fill: 0.2, fl: { sweet: 0.85, salty: 0, spicy: 0 } },
  { id: 'carrot', shop: 'plot', name: 'carrots', price: 1, fill: 0.2, fl: { sweet: 0.4, salty: 0.2, spicy: 0 } },
  { id: 'tomato', shop: 'plot', name: 'tomatoes', price: 2, fill: 0.2, fl: { sweet: 0.3, salty: 0.4, spicy: 0 } },
  { id: 'pumpkin', shop: 'plot', name: 'a pumpkin', price: 3, fill: 0.5, fl: { sweet: 0.6, salty: 0.2, spicy: 0 } },
  { id: 'cabbage', shop: 'plot', name: 'a winter cabbage', price: 2, fill: 0.35, fl: { sweet: 0.1, salty: 0.35, spicy: 0.05 } },
  { id: 'onigiri', shop: 'mart', name: 'onigiri', price: 2, fill: 0.4, fl: { sweet: 0.1, salty: 0.8, spicy: 0 } },
  { id: 'tart', shop: 'mart', name: 'berry tart', price: 3, fill: 0.35, fl: { sweet: 0.95, salty: 0, spicy: 0 } },
  { id: 'curry', shop: 'mart', name: 'curry', price: 3, fill: 0.55, fl: { sweet: 0.1, salty: 0.4, spicy: 0.85 } },
  { id: 'miso', shop: 'mart', name: 'miso soup', price: 1, fill: 0.25, fl: { sweet: 0, salty: 0.7, spicy: 0 } },
  { id: 'mochi', shop: 'mart', name: 'mochi', price: 1, fill: 0.25, fl: { sweet: 0.75, salty: 0, spicy: 0 } },
  { id: 'fish', shop: 'mart', name: 'grilled fish', price: 2, fill: 0.45, fl: { sweet: 0, salty: 0.75, spicy: 0.1 } },
  { id: 'noodles', shop: 'mart', name: 'pepper noodles', price: 2, fill: 0.45, fl: { sweet: 0, salty: 0.3, spicy: 1 } },
  { id: 'melonpan', shop: 'mart', name: 'melon bread', price: 2, fill: 0.35, fl: { sweet: 0.65, salty: 0.2, spicy: 0 } },
  { id: 'croissant', shop: 'bakery', name: 'croissant', price: 2, fill: 0.3, fl: { sweet: 0.3, salty: 0.5, spicy: 0 } },
  { id: 'shortcake', shop: 'bakery', name: 'strawberry shortcake', price: 3, fill: 0.3, fl: { sweet: 0.95, salty: 0, spicy: 0 } },
  { id: 'cinnamon', shop: 'bakery', name: 'cinnamon roll', price: 2, fill: 0.35, fl: { sweet: 0.8, salty: 0.1, spicy: 0.2 } },
  { id: 'baguette', shop: 'bakery', name: 'baguette', price: 2, fill: 0.45, fl: { sweet: 0, salty: 0.6, spicy: 0 } },
  { id: 'vanilla', shop: 'icecream', name: 'vanilla cone', price: 1, fill: 0.15, fl: { sweet: 0.8, salty: 0, spicy: 0 } },
  { id: 'matchaice', shop: 'icecream', name: 'matcha soft serve', price: 2, fill: 0.15, fl: { sweet: 0.5, salty: 0, spicy: 0 } },
  { id: 'sundae', shop: 'icecream', name: 'strawberry sundae', price: 3, fill: 0.25, fl: { sweet: 1, salty: 0, spicy: 0 } },
  { id: 'chilimango', shop: 'icecream', name: 'chili mango pop', price: 2, fill: 0.12, fl: { sweet: 0.6, salty: 0.2, spicy: 0.7 } },
  { id: 'pizza', shop: 'mart', name: 'pizza', price: 3, fill: 0.5, fl: { sweet: 0.1, salty: 0.8, spicy: 0.2 } },
  { id: 'taco', shop: 'mart', name: 'taco', price: 2, fill: 0.4, fl: { sweet: 0, salty: 0.6, spicy: 0.5 } },
  { id: 'nachos', shop: 'mart', name: 'nachos with cheese', price: 2, fill: 0.35, fl: { sweet: 0.1, salty: 0.9, spicy: 0.2 } },
  { id: 'latte', shop: 'cafe', name: 'honey latte', price: 2, fill: 0.12, fl: { sweet: 0.6, salty: 0, spicy: 0 } },
  { id: 'matcha', shop: 'cafe', name: 'matcha', price: 2, fill: 0.1, fl: { sweet: 0.2, salty: 0.1, spicy: 0 } },
  { id: 'cocoa', shop: 'cafe', name: 'hot cocoa', price: 2, fill: 0.15, fl: { sweet: 0.9, salty: 0, spicy: 0 } },
  { id: 'chai', shop: 'cafe', name: 'spiced chai', price: 2, fill: 0.12, fl: { sweet: 0.4, salty: 0, spicy: 0.6 } },
  { id: 'cheesecake', shop: 'cafe', name: 'cheesecake', price: 3, fill: 0.3, fl: { sweet: 0.8, salty: 0.2, spicy: 0 } },
];
const foodById = (id) => FOODS.find((f) => f.id === id);
const DECOR = {
  lamp: { name: 'lamp', price: 4 }, rug: { name: 'rug', price: 5 }, plant: { name: 'potted plant', price: 3 },
  bouquet: { name: 'bouquet', price: 3 }, beanbag: { name: 'beanbag', price: 6 }, shelf: { name: 'bookshelf', price: 8 },
  quilt: { name: 'quilt', price: 7 }, poster: { name: 'poster', price: 3 }, painting: { name: 'painting', price: 6 },
  fishbowl: { name: 'fishbowl', price: 5 }, plush: { name: 'plush bunny', price: 4 }, musicbox: { name: 'music box', price: 6 },
  globe: { name: 'snow globe', price: 4 }, records: { name: 'record player', price: 9 }, books: { name: 'stack of books', price: 4 }, laptop: { name: 'laptop', price: 60 },
};
const NOOK_MADE = ['lamp', 'rug', 'beanbag', 'shelf', 'quilt', 'poster', 'painting', 'plush', 'musicbox', 'globe', 'records'];
const JOBS = {
  mart:    { short: 'Berry Mart clerk', title: 'clerk at Berry Mart', place: 'mart', pay: 3 },
  cafe:    { short: 'barista', title: 'barista at Moonbean Café', place: 'cafe', pay: 3 },
  clothes: { short: 'tailor', title: 'tailor at Thread & Thimble', place: 'clothes', pay: 3 },
  nook:    { short: 'woodworker', title: 'woodworker at Nook & Cranny', place: 'nook', pay: 3 },
  garden:  { short: 'gardener', title: 'gardener', place: 'garden', pay: 2 },
  pier:    { short: 'fisher', title: 'fisher at the pier', place: 'pier', pay: 2 },
  bakery:  { short: 'baker', title: 'baker at Sweet Rise Bakery', place: 'bakery', pay: 3 },
  icecream:{ short: 'ice cream scooper', title: 'scooper at Sundae Best', place: 'icecream', pay: 3 },
  books:   { short: 'bookseller', title: 'bookseller at Paper Moon Books', place: 'books', pay: 3 },
  arcade:  { short: 'arcade attendant', title: 'attendant at Pixel Palace', place: 'arcade', pay: 3 },
  dev:     { short: 'software developer', title: 'software developer at Glimmer Labs', place: 'labs', pay: 7, collar: 'white', indoor: true, needs: ['computers', 'math'] },
  ai:      { short: 'AI safety researcher', title: 'AI safety researcher at Glimmer Labs', place: 'labs', pay: 8, collar: 'white', indoor: true, needs: ['computers', 'safety', 'math'] },
  lawyer:  { short: 'lawyer', title: 'lawyer at Glimmer Hall', place: 'hall', pay: 6, collar: 'white', indoor: true, needs: ['history', 'philosophy', 'money'] },
  bio:     { short: 'biologist', title: 'biologist on the Science floor of Glimmer Labs', place: 'labs', pay: 6, collar: 'white', indoor: true, needs: ['science', 'ocean', 'animals', 'plants'], must: 'science' },
  chem:    { short: 'chemist', title: 'chemist on the Science floor of Glimmer Labs', place: 'labs', pay: 6, collar: 'white', indoor: true, needs: ['science', 'cooking', 'math'], must: 'science' },
  phys:    { short: 'physicist', title: 'physicist on the Science floor of Glimmer Labs', place: 'labs', pay: 7, collar: 'white', indoor: true, needs: ['science', 'space', 'math'], must: 'science' },
  robo:    { short: 'robotics engineer', title: 'robotics engineer on the Engineering floor of Glimmer Labs', place: 'labs', pay: 7, collar: 'white', indoor: true, needs: ['engineering', 'computers', 'math'], must: 'engineering' },
  civil:   { short: 'civil engineer', title: 'civil engineer on the Engineering floor of Glimmer Labs', place: 'labs', pay: 6, collar: 'white', indoor: true, needs: ['engineering', 'math', 'history'], must: 'engineering' },
  doctor:  { short: 'doctor', title: 'doctor at Glimmer Clinic', place: 'clinic', pay: 8, collar: 'white', indoor: true, needs: ['health', 'science', 'psych'], must: 'health' },
  therapist: { short: 'therapist', title: 'therapist at Glimmer Clinic', place: 'clinic', pay: 6, collar: 'white', indoor: true, needs: ['psych', 'philosophy'], must: 'psych' },
  builder: { short: 'construction worker', title: 'construction worker downtown', place: 'downtown', pay: 3, collar: 'blue' },
  janitor: { short: 'street sweeper', title: 'street sweeper', place: 'plaza', pay: 2, collar: 'blue' },
};
const SHOPS = {
  mart: { name: 'Berry Mart', job: 'mart', blurb: 'Meals cooked by whoever works the counter today.' },
  cafe: { name: 'Moonbean Café', job: 'cafe', blurb: 'Drinks and sweets made by the barista.' },
  clothes: { name: 'Thread & Thimble', job: 'clothes', blurb: 'Hats and shirts, sewn in the tailor\'s favorite colors.' },
  nook: { name: 'Nook & Cranny', job: 'nook', blurb: 'Furniture and trinkets for their rooms. Plants come from the gardener, fishbowls from the fisher.' },
  bakery: { name: 'Sweet Rise Bakery', job: 'bakery', blurb: 'Fresh bread and cakes, baked downtown every morning.' },
  icecream: { name: 'Sundae Best', job: 'icecream', blurb: 'Ice cream, scooped by whoever is working the counter.' },
  books: { name: 'Paper Moon Books', job: 'books', blurb: 'Books and little treasures for their shelves, picked by the bookseller.' },
  arcade: { name: 'Pixel Palace', job: 'arcade', blurb: 'The downtown arcade. Residents spend a coin here to play games.' },
};
const PROJECTS = {
  flowers:    { name: 'flower beds by the pier', cost: 40 },
  swing:      { name: 'a swing on the big tree', cost: 35 },
  lanterns:   { name: 'paper lanterns over the plaza', cost: 55 },
  telescope:  { name: 'a telescope on the pier', cost: 45 },
  lighthouse: { name: 'a little lighthouse', cost: 80 },
  statue:     { name: 'a statue of the Creator', cost: 60, creator: true },
  computer:   { name: 'a public computer at Paper Moon Books', cost: 90 },
};
const EVENTS = {
  picnic:  { name: 'a picnic in the garden', place: 'garden', t0: 0.30, t1: 0.37, at: '1:00 pm' },
  tea:     { name: 'a tea party at Moonbean Café', place: 'cafe', t0: 0.34, t1: 0.41, at: '2:00 pm' },
  fishing: { name: 'a fishing contest on the pier', place: 'pier', t0: 0.28, t1: 0.35, at: '12:30 pm' },
  stars:   { name: 'stargazing on the pier', place: 'pier', t0: 0.555, t1: 0.63, at: '7:15 pm' },
  park:    { name: 'games in the park', place: 'park', t0: 0.40, t1: 0.47, at: '3:30 pm' },
  festival: { name: 'the Starfall Festival', place: 'plaza', t0: 0.55, t1: 0.665, at: '7:00 pm', special: true },
  wedding: { name: 'a wedding at the fountain', place: 'plaza', t0: 0.44, t1: 0.52, at: '4:30 pm', special: true },
  bday: { name: 'a birthday party at Moonbean Café', place: 'cafe', t0: 0.36, t1: 0.43, at: '2:30 pm', special: true },
  snowball: { name: 'a snowball fight in the park', place: 'park', t0: 0.34, t1: 0.41, at: '2:00 pm', season: 'winter' },
  blossoms: { name: 'blossom viewing in the garden', place: 'garden', t0: 0.32, t1: 0.39, at: '1:30 pm', season: 'spring' },
  beach: { name: 'a beach day at Seashell Beach', place: 'beach', t0: 0.3, t1: 0.37, at: '1:00 pm', season: 'summer' },
  party: { name: 'a party in the park', place: 'park', t0: 0.42, t1: 0.5, at: '4:00 pm', special: true },
  harvest: { name: 'a harvest supper at Moonbean Café', place: 'cafe', t0: 0.5, t1: 0.57, at: '6:00 pm', season: 'autumn' },
};

function itemName(it) {
  if (it.kind === 'book') return `book called "${BOOKS[it.id]?.title || 'Untitled'}"`;
  if (it.kind === 'food') return foodById(it.id).name;
  if (it.kind === 'hat') return `${it.color} ${HATS[it.id].name}`;
  if (it.kind === 'shirt') return `${it.color} shirt`;
  if (it.label) return it.label;
  if (it.catchName) return `${it.catchName} in a fishbowl`;
  return `${it.color} ${DECOR[it.id].name}`;
}
function sellValue(it) { if (it.catchName) { const c = CATCHES.find((x) => x.name.endsWith(it.catchName)); return c ? [0, 2, 5, 14][c.q] : 2; } return Math.max(1, Math.floor(itemPrice(it) / 2)); }
function itemPrice(it) {
  if (it.kind === 'book') return BOOKS[it.id]?.price || 5;
  const base = it.kind === 'food' ? foodById(it.id).price : it.kind === 'hat' ? HATS[it.id].price : it.kind === 'shirt' ? 2 : DECOR[it.id].price;
  return base + Math.max(0, (it.q || 1) - 1);
}
function itemColor(it) { if (it.kind === 'book') return SUBJECTS[BOOKS[it.id]?.subj]?.color || '#8a6aa8'; return it.kind === 'food' ? (foodById(it.id).shop === 'cafe' ? '#c89b7b' : foodById(it.id).shop === 'plot' ? '#8fd48a' : '#ffb38a') : COLORS[it.color]; }

