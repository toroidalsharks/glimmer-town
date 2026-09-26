// ============================================================
// TOWN LAYOUT
// ============================================================
const polar = (deg, r) => [Math.sin(deg * Math.PI / 180) * r, -Math.cos(deg * Math.PI / 180) * r];
const BLD = { home: { a: 0, r: 27, d: 9 }, clothes: { a: 62, r: 24, d: 8 }, nook: { a: 114, r: 24, d: 8 }, cafe: { a: 212, r: 24, d: 8 }, mart: { a: 298, r: 24, d: 8 } };
const TOWN = {
  home:    { name: 'the apartments', spot: polar(0, 27 - 4.5 - 0.7), entry: polar(0, 11.4) },
  clothes: { name: 'Thread & Thimble', spot: polar(62, 24 - 4 - 0.7), entry: polar(62, 11.4) },
  nook:    { name: 'Nook & Cranny', spot: polar(114, 24 - 4 - 0.7), entry: polar(114, 11.4) },
  cafe:    { name: 'Moonbean Café', spot: polar(212, 24 - 4 - 1.6), entry: polar(212, 11.4) },
  mart:    { name: 'Berry Mart', spot: polar(298, 24 - 4 - 0.7), entry: polar(298, 11.4) },
  garden:  { name: 'the garden', spot: polar(158, 21), entry: polar(158, 11.4) },
  park:    { name: 'the park', spot: polar(252, 20), entry: polar(252, 11.4) },
  pier:    { name: 'the pier', spot: [0, 39.4], entry: [0, 11.4] },
  plaza:   { name: 'the fountain', spot: [0, 0], entry: null },
};
const CAFE_SEATS = (() => { const s = []; for (const deg of [204, 220]) { const [cx, cz] = polar(deg, 15.6), a = deg * Math.PI / 180; for (const j of [-1, 1]) s.push([cx + Math.cos(a) * 1.15 * j, cz + Math.sin(a) * 1.15 * j]); } return s; })();
const BUSHES = [polar(28, 8.6), polar(150, 8.6), polar(270, 8.6)];
const FOUNTAIN_R = 3.9;
const DT = { x: 0, z: -56, R: 32 };
const polarDT = (deg, r) => [DT.x + Math.sin(deg * Math.PI / 180) * r, DT.z - Math.cos(deg * Math.PI / 180) * r];
const DT_GATE = [[9.4, -19], [11, -28.5]];
const DT_HUB = [4, -42.5];
const DT_BLD = { home2: { a: 0, r: 22, d: 8 }, home3: { a: 300, r: 22, d: 8 }, bakery: { a: 58, r: 21, d: 8 }, books: { a: 108, r: 21, d: 8 }, arcade: { a: 245, r: 21, d: 8 }, icecream: { a: 202, r: 21, d: 8 }, hall: { a: 272, r: 21, d: 8 }, labs: { a: 32, r: 21, d: 8 }, clinic: { a: 135, r: 21.5, d: 7 } };
const DT_NAMES = { home2: 'Bluebell Court', home3: 'Sunny Heights', bakery: 'Sweet Rise Bakery', books: 'Paper Moon Books', arcade: 'Pixel Palace', icecream: 'Sundae Best', hall: 'Glimmer Hall', labs: 'Glimmer Labs', clinic: 'Glimmer Clinic' };
for (const [k, b] of Object.entries(DT_BLD)) TOWN[k] = { name: DT_NAMES[k], spot: polarDT(b.a, b.r - b.d / 2 - 0.8), entry: [...DT_GATE, DT_HUB, polarDT(b.a, 10.2)], local: [polarDT(b.a, 10.2)], zone: 'dt' };
TOWN.beach = { name: 'Seashell Beach', spot: polar(222, 36), entry: [polar(229, 11.4), polar(229, 27.5)] };
TOWN.downtown = { name: 'downtown', spot: [DT.x, DT.z + 6], entry: [...DT_GATE, DT_HUB], local: [], zone: 'dt' };
const BEACH = polar(222, 39), BEACH_R = 9.5;
const OBSTACLES = [[0, 0, FOUNTAIN_R], [DT.x, DT.z, 3.6]];
const homeKey = (p) => (p.room >= 15 ? 'home3' : p.room >= 9 ? 'home2' : 'home');

