// ============================================================
// SOUND: music, effects and voices, all synthesized
// ============================================================
const Sound = (() => {
  let ctx = null, master, music, sfx, voiceBus, started = false, noiseBuf = null, nextBeat = 0, beat = 0, lastVoice = 0, lastStep = 0;
  const ok = () => ctx && ctx.state === 'running';
  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    music = ctx.createGain(); sfx = ctx.createGain(); voiceBus = ctx.createGain();
    const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 3200; music.connect(soft); soft.connect(master); try { const verb = ctx.createConvolver(), len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); } verb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.32; soft.connect(wet); wet.connect(verb); verb.connect(master); } catch (e) {}
    sfx.connect(master); voiceBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    levels(); return ctx;
  }
  function levels() { if (!ctx) return; const v = cfg.volume ?? 0.7; master.gain.value = v; music.gain.value = cfg.music === false ? 0 : 0.3; sfx.gain.value = cfg.sfx === false ? 0 : 0.55; voiceBus.gain.value = cfg.voices === false ? 0 : 0.5; }
  function tone(freq, t0, dur, o = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * o.slide), t0 + dur);
    const vol = o.vol ?? 0.2, a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + (o.release ?? 0.08));
    let head = g; if (o.lp) { const lf = ctx.createBiquadFilter(); lf.type = 'lowpass'; lf.frequency.value = o.lp; g.connect(lf); head = lf; }
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vib; lg.gain.value = freq * 0.006; l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + dur + (o.release ?? 0.08) + 0.05); }
    osc.connect(g); head.connect(o.dest || sfx); osc.start(t0); osc.stop(t0 + dur + (o.release ?? 0.08) + 0.05);
  }
  function noise(t0, dur, o = {}) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; f.type = o.filter || 'bandpass'; f.frequency.value = o.freq || 800; f.Q.value = o.q || 1;
    g.gain.setValueAtTime(o.vol ?? 0.1, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || sfx); src.start(t0); src.stop(t0 + dur + 0.05);
  }
  // --- music: a little radio station of songs that change with the island ---
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const SC = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11] };
  // p: chord degrees; bar: bars per chord; lead/pad/bass/arp: instruments; k/s/h: drum strings; b: bass pattern (R root, 5 fifth, 8 octave, 3 third, - rest)
  const SONGS = {
    petal: { title: 'Petal Parade', key: 67, sc: 'major', bpm: 96, p: [0, 4, 5, 3], lead: 'bell', arp: 'pluck', arpP: '0.1.2.1.', pad: 'pad', b: 'R...5...R...5.8.', k: 'x.......x.......', h: '..x...x...x...x.', dens: 0.55 },
    toast: { title: 'Morning Toast', key: 65, sc: 'major', bpm: 88, p: [0, 3, 5, 4], lead: 'marimba', pad: 'pad', b: 'R..5..R.R..5..8.', h: 'x.x.x.x.x.x.x.x.', hv: 0.5, dens: 0.6 },
    lemonade: { title: 'Lemonade Pier', key: 62, sc: 'major', bpm: 104, swing: 0.25, p: [1, 4, 0, 5], sev: true, lead: 'epiano', pad: 'epad', b: 'R..5..8.R..5..3.', rim: '...x..x....x..x.', h: 'x.x.x.x.x.x.x.x.', hv: 0.35, dens: 0.5 },
    scooter: { title: 'Sunbeam Scooters', key: 69, sc: 'mixo', bpm: 112, p: [0, 6, 3, 0], lead: 'chip', arp: 'chip', arpP: '0120', b: 'R.R.5.5.R.R.8.5.', bass: 'chipbass', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', dens: 0.6 },
    cinnamon: { title: 'Cinnamon Leaves', key: 64, sc: 'dorian', bpm: 84, meter: 12, p: [0, 3, 6, 4], lead: 'flute', pad: 'pad', arp: 'pluck', arpP: '.0.1.2', b: 'R.....5.....', k: 'x...........', dens: 0.45 },
    sweater: { title: 'Sweater Weather', key: 62, sc: 'dorian', bpm: 78, swing: 0.2, p: [0, 3, 0, 4], sev: true, lead: 'epiano', pad: 'epad', b: 'R......5R.....3.', k: 'x.......x.x.....', s: '....x.......x...', h: '..x...x...x...x.', hv: 0.4, dens: 0.4 },
    snowglobe: { title: 'Snow Globe', key: 72, sc: 'major', bpm: 70, meter: 12, p: [0, 5, 3, 4], lead: 'musicbox', arp: 'musicbox', arpP: '0.1.2.1.2.1.', pad: 'pad', b: 'R...........', dens: 0.4 },
    cocoa: { title: 'Cocoa Window', key: 65, sc: 'major', bpm: 72, swing: 0.3, p: [3, 2, 1, 4], sev: true, lead: 'epiano', pad: 'epad', b: 'R.......5...3...', k: 'x......x..x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', hv: 0.3, dens: 0.35, crackle: true },
    lantern: { title: 'Lantern Walk', key: 64, sc: 'major', bpm: 70, p: [0, 5, 1, 4], sev: true, lead: 'flute', pad: 'pad', arp: 'pluck', arpP: '0...2...1...2...', b: 'R.......5.......', dens: 0.4 },
    moon: { title: 'Moon Over Glimmer', key: 57, sc: 'minor', bpm: 56, p: [0, 5, 2, 6], sev: true, lead: 'bell', pad: 'pad', b: 'R...............', dens: 0.25, hi: 12 },
    firefly: { title: 'Firefly Lullaby', key: 60, sc: 'lydian', bpm: 60, meter: 12, p: [0, 1, 0, 4], lead: 'musicbox', pad: 'pad', arp: 'bell', arpP: '0.....2.....', b: 'R...........', dens: 0.3 },
    umbrella: { title: 'Umbrella Day', key: 63, sc: 'dorian', bpm: 76, swing: 0.25, p: [0, 3, 5, 4], sev: true, lead: 'epiano', pad: 'epad', b: 'R......5..R.....', k: 'x.....x...x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', hv: 0.3, dens: 0.35, crackle: true },
    thunder: { title: 'Thunder Tea', key: 50, sc: 'minor', bpm: 84, p: [0, 5, 3, 4], lead: 'saw', pad: 'pad', b: 'R.R.....R.R..5..', k: 'x.....x.x.......', tom: '..............xx', dens: 0.35 },
    starfall: { title: 'Starfall Stomp', key: 67, sc: 'major', bpm: 124, p: [0, 4, 5, 3], lead: 'chip', arp: 'chip', arpP: '0122', b: 'R.8.R.8.R.8.5.8.', bass: 'chipbass', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', clap: '....x.......x...', dens: 0.75 },
    promises: { title: 'Petals & Promises', key: 65, sc: 'major', bpm: 84, meter: 12, p: [0, 3, 4, 0, 5, 1, 4, 4], lead: 'bell', pad: 'pad', arp: 'pluck', arpP: '..0.1...0.1.', b: 'R...........', dens: 0.5 },
    cake: { title: 'Cake Parade', key: 70, sc: 'major', bpm: 116, p: [0, 3, 4, 0], lead: 'marimba', arp: 'pizz', arpP: '0.1.2.1.', b: 'R...5...R...5...', k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.', dens: 0.7 },
    order: { title: 'Order, Order', key: 60, sc: 'major', bpm: 72, p: [0, 4, 3, 4], lead: 'pizz', arp: 'pizz', arpP: '0...1...2...1...', b: 'R.......5.......', bass: 'pizzbass', dens: 0.35 },
    jazz: { title: 'Moonbean Jazz', key: 65, sc: 'dorian', bpm: 96, swing: 0.34, p: [1, 4, 0, 0], sev: true, lead: 'epiano', pad: 'epad', b: 'R...3...5...8...', bassWalk: true, rim: '....x.......x...', h: 'x..xx..xx..xx..x', hv: 0.35, dens: 0.45 },
    rush: { title: 'Pixel Rush', key: 64, sc: 'minor', bpm: 170, p: [0, 5, 3, 6], lead: 'chip', arp: 'chip', arpP: '0120', pad: 'pad', b: 'R.R.R.R.R.R.8.5.', bass: 'chipbass', breaks: true, dens: 0.7 },
    oven: { title: 'Warm Oven Waltz', key: 62, sc: 'major', bpm: 92, meter: 12, p: [0, 4, 0, 3, 0, 4, 5, 4], lead: 'flute', arp: 'pluck', arpP: '..0.1...0.1.', b: 'R...........', dens: 0.45 },
    pages: { title: 'Quiet Pages', key: 69, sc: 'major', bpm: 64, p: [0, 2, 3, 4], sev: true, lead: 'musicbox', pad: 'pad', b: 'R...............', dens: 0.3 },
    aisle: { title: 'Aisle Nine', key: 67, sc: 'major', bpm: 100, swing: 0.2, p: [3, 4, 2, 5], sev: true, lead: 'epiano', b: 'R..5..R.R..5..R.', rim: '...x..x....x..x.', h: 'x.x.x.x.x.x.x.x.', hv: 0.3, dens: 0.4 },
    runway: { title: 'Runway Thread', key: 65, sc: 'minor', bpm: 118, p: [0, 5, 6, 4], lead: 'saw', pad: 'pad', b: '..R...R...R...R.', k: 'x...x...x...x...', h: '..x...x...x...x.', clap: '....x.......x...', dens: 0.45 },
    sawdust: { title: 'Sawdust Folk', key: 62, sc: 'mixo', bpm: 98, p: [0, 6, 3, 0], lead: 'pluck', arp: 'pluck', arpP: '0.2.1.2.', b: 'R...5...R...5...', k: 'x.......x.......', rim: '....x.......x...', dens: 0.55 },
    sprinkles: { title: 'Sprinkles', key: 72, sc: 'major', bpm: 120, p: [0, 5, 3, 4], lead: 'chip', arp: 'musicbox', arpP: '0.1.2.1.', b: 'R...R...5...5...', bass: 'chipbass', k: 'x.......x.......', s: '....x.......x...', dens: 0.65 },
    roomtone: { title: 'Room Tone', key: 62, sc: 'major', bpm: 74, swing: 0.28, p: [3, 4, 2, 5], sev: true, lead: 'epiano', pad: 'epad', b: 'R.......5.......', k: 'x......x..x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', hv: 0.25, dens: 0.3, crackle: true },
    lullaby: { title: 'Pillow Fort', key: 65, sc: 'major', bpm: 58, meter: 12, p: [0, 3, 0, 4], lead: 'musicbox', pad: 'pad', b: 'R...........', dens: 0.3 },
    fixed: { title: 'Fixed Point', key: 66, sc: 'minor', bpm: 172, p: [0, 5, 2, 6], sev: true, lead: 'bell', pad: 'pad', arp: 'musicbox', arpP: '0.1.2.3.', b: 'R.......R.......', breaks: true, dens: 0.35, hi: 12 },
    pigeons: { title: 'City Pigeons', key: 60, sc: 'dorian', bpm: 90, swing: 0.3, p: [0, 3, 1, 4], sev: true, lead: 'epiano', pad: 'epad', b: 'R..R......5..R..', k: 'x......x..x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', hv: 0.35, dens: 0.4 },
    waiting: { title: 'Waiting Room', key: 64, sc: 'lydian', bpm: 66, swing: 0.2, p: [0, 3, 1, 4], sev: true, lead: 'marimba', pad: 'epad', b: 'R.......5.......', h: '....x.......x...', hv: 0.15, dens: 0.25 },
    beakers: { title: 'Beakers & Bunsens', key: 62, sc: 'mixo', bpm: 112, swing: 0.2, p: [0, 4, 3, 4], lead: 'pizz', pad: 'pad', arp: 'pluck', arpP: '0.2.1.3.', b: 'R...R...5...R...', k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', hv: 0.3, dens: 0.45 },
    gears: { title: 'Gearworks', key: 57, sc: 'dorian', bpm: 124, p: [0, 6, 5, 4], lead: 'chip', pad: 'pad', arp: 'chip', arpP: '0.2.0.3.', b: 'R.R.....R.R.....', k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', hv: 0.3, dens: 0.4 },
    trial: { title: 'Cross-Examination', key: 57, sc: 'minor', bpm: 132, p: [0, 5, 6, 4], lead: 'saw', pad: 'pad', arp: 'pluck', arpP: '0.1.2.1.', b: 'R.R.R.R.R.R.5.8.', k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', hv: 0.3, dens: 0.55 },
    mystery: { title: 'Footprints in the Fog', key: 52, sc: 'minor', bpm: 72, swing: 0.3, p: [0, 5, 3, 4], sev: true, lead: 'epiano', pad: 'epad', b: 'R.......R..5....', k: 'x.........x.....', rim: '....x.......x...', h: '..x...x...x...x.', hv: 0.25, dens: 0.3 },
    funeral: { title: 'Flowers by the Stone', key: 57, sc: 'minor', bpm: 58, meter: 12, p: [0, 5, 3, 4], lead: 'musicbox', pad: 'pad', b: 'R...........', dens: 0.25 },
    uproar: { title: 'Uproar', key: 57, sc: 'minor', bpm: 138, p: [0, 5, 3, 4], lead: 'saw', pad: 'pad', arp: 'pluck', arpP: '0.1.2.1.', b: 'R.R.R.R.R.R.R.R.', k: 'x...x...x..x.x..', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', hv: 0.35, dens: 0.5 },
  };
  const PLAYLISTS = {
    spring: ['petal', 'toast', 'lantern'], summer: ['lemonade', 'scooter', 'petal'], autumn: ['cinnamon', 'sweater', 'toast'], winter: ['snowglobe', 'cocoa', 'sweater'],
    evening: ['lantern', 'cocoa', 'roomtone'], night: ['moon', 'lullaby', 'firefly'], summernight: ['firefly', 'moon'], rain: ['umbrella', 'cocoa'], storm: ['thunder', 'umbrella'],
    festival: ['starfall'], wedding: ['promises'], bday: ['cake'], meeting: ['order'], city: ['pigeons', 'aisle', 'scooter'],
    cafe: ['jazz', 'cocoa'], arcade: ['rush', 'scooter'], bakery: ['oven', 'toast'], books: ['pages', 'lullaby'], mart: ['aisle'], clothes: ['runway'], nook: ['sawdust'], icecream: ['sprinkles'],
    room: ['roomtone', 'cocoa'], hall: ['order'], labs: ['pigeons', 'roomtone'], labsci: ['beakers', 'pigeons'], labeng: ['gears', 'scooter'], clinic: ['waiting', 'roomtone'], uproar: ['uproar'], trial: ['trial'], mystery: ['mystery'], funeral: ['funeral'], roomnight: ['lullaby', 'moon'], mili: ['fixed', 'roomtone'],
  };
  function contextKey() {
    if (!W) return 'spring';
    if (CUT.live && CUT.live.music && PLAYLISTS[CUT.live.music]) return CUT.live.music;
    if (interior) {
      if (interior.kind === 'hall') return 'hall';
    if (interior.kind === 'labs') return interior.wing === 'sci' ? 'labsci' : interior.wing === 'eng' ? 'labeng' : 'labs';
    if (interior.kind === 'clinic') return 'clinic';
    if (interior.kind === 'shop') return PLAYLISTS[interior.shop] ? interior.shop : 'mart';
      const p = typeof person === 'function' && person(interior.id);
      if (p && isMili(p)) return 'mili';
      return W.t >= 0.6 || W.t < 0.03 ? 'roomnight' : 'room';
    }
    if (W.meeting) return 'meeting';
    if (W.scene?.kind === 'uproar' && W.scene.live) return 'uproar';
    const ev = W.event && W.event.day === W.day && EVENTS[W.event.id];
    if (ev && W.t >= ev.t0 - 0.02 && W.t < ev.t1) { if (W.event.id === 'wedding') return 'wedding'; if (W.event.id === 'festival') return 'festival'; if (W.event.id === 'bday') return 'bday'; }
    if (W.weather === 'storm') return 'storm';
    if (W.weather === 'rain') return 'rain';
    const night = W.t >= 0.63 || W.t < 0.03;
    if (night) return seasonOf().id === 'summer' ? 'summernight' : 'night';
    if (W.t >= 0.52) return 'evening';
    if (controls && Math.hypot(controls.target.x - DT.x, controls.target.z - DT.z) < 26) return 'city';
    return seasonOf().id;
  }
  // seeded melodies so each song has its own tune that repeats like a real song
  function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function makePhrase(r, meter, dens) {
    const n = meter * 2, out = new Array(n).fill(null);
    let deg = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const strong = i % (meter / 2) === 0, mid = i % 4 === 0, off = i % 2 === 0;
      const pr = strong ? 0.85 : mid ? dens : off ? dens * 0.55 : dens * 0.18;
      if (r() < pr && !(i === n - 2 || i === n - 1)) {
        const leap = r() < 0.15 ? (r() < 0.5 ? -3 : 3) : Math.floor(r() * 5) - 2;
        deg = Math.max(0, Math.min(11, deg + leap));
        let len = 1; while (len < 6 && i + len < n && r() < (strong ? 0.6 : 0.35)) len++;
        out[i] = { deg, len, snap: strong };
      }
    }
    return out;
  }
  function buildSong(key) {
    const S = SONGS[key], r = seeded(S.title), meter = S.meter || 16;
    const A = makePhrase(r, meter, S.dens), B = makePhrase(r, meter, S.dens * 1.1);
    const A2 = A.map((x, i) => (i >= meter * 1.5 ? (r() < 0.5 ? null : x && { ...x, deg: Math.max(0, x.deg - 1) }) : x));
    const drumsRand = seeded(S.title + 'breaks');
    return { key, S, meter, phrases: [A, A2, B, A], bar: 0, step: 0, r: drumsRand, bus: null, started: 0 };
  }
  const deg2semi = (sc, d) => { const n = sc.length; const o = Math.floor(d / n); return sc[((d % n) + n) % n] + 12 * o; };
  function chordOf(S, bar) { const sc = SC[S.sc], root = S.p[Math.floor(bar / (S.bar || 1)) % S.p.length]; const tones = [0, 2, 4].concat(S.sev ? [6] : []).map((i) => deg2semi(sc, root + i)); return tones; }
  function inst(name, m, t, dur, v, bus) {
    const f = hz(m), o = { dest: bus };
    switch (name) {
      case 'bell': tone(f, t, dur * 0.4, { type: 'sine', vol: 0.07 * v, attack: 0.003, release: 1.1, ...o }); tone(f * 2.01, t, 0.05, { type: 'sine', vol: 0.02 * v, release: 0.6, ...o }); break;
      case 'musicbox': tone(f * 2, t, 0.04, { type: 'sine', vol: 0.055 * v, attack: 0.002, release: 0.9, ...o }); tone(f * 4.02, t, 0.02, { type: 'sine', vol: 0.012 * v, release: 0.35, ...o }); break;
      case 'marimba': tone(f, t, 0.06, { type: 'sine', vol: 0.09 * v, attack: 0.002, release: 0.35, ...o }); tone(f * 4, t, 0.015, { type: 'sine', vol: 0.02 * v, release: 0.06, ...o }); break;
      case 'pluck': tone(f, t, 0.05, { type: 'triangle', vol: 0.07 * v, attack: 0.002, release: 0.28, ...o }); break;
      case 'pizz': tone(f, t, 0.03, { type: 'triangle', vol: 0.08 * v, attack: 0.001, release: 0.14, ...o }); break;
      case 'chip': tone(f, t, Math.max(0.05, dur * 0.8), { type: 'square', vol: 0.03 * v, attack: 0.002, release: 0.03, ...o }); break;
      case 'flute': tone(f, t, dur, { type: 'sine', vol: 0.06 * v, attack: 0.07, release: 0.25, vib: 5.5, ...o }); tone(f * 2, t, dur, { type: 'sine', vol: 0.007 * v, attack: 0.09, release: 0.2, ...o }); break;
      case 'epiano': tone(f, t, dur * 0.5, { type: 'sine', vol: 0.06 * v, attack: 0.004, release: 0.8, ...o }); tone(f * 1.004, t, dur * 0.4, { type: 'triangle', vol: 0.014 * v, release: 0.6, ...o }); tone(f * 3, t, 0.02, { type: 'sine', vol: 0.008 * v, release: 0.15, ...o }); break;
      case 'saw': tone(f, t, dur, { type: 'sawtooth', vol: 0.018 * v, attack: 0.02, release: 0.12, lp: 1800, ...o }); break;
      case 'pad': tone(f, t, dur, { type: 'triangle', vol: 0.025 * v, attack: 0.5, release: 1.0, ...o }); tone(f * 1.006, t, dur, { type: 'sine', vol: 0.018 * v, attack: 0.6, release: 1.1, ...o }); break;
      case 'epad': tone(f, t, dur, { type: 'sine', vol: 0.03 * v, attack: 0.08, release: 0.9, vib: 3, ...o }); break;
      case 'bass': tone(f, t, dur, { type: 'sine', vol: 0.12 * v, attack: 0.01, release: 0.08, ...o }); tone(f * 2, t, dur * 0.4, { type: 'triangle', vol: 0.018 * v, release: 0.05, ...o }); break;
      case 'chipbass': tone(f, t, dur, { type: 'triangle', vol: 0.09 * v, attack: 0.002, release: 0.02, ...o }); break;
      case 'pizzbass': tone(f, t, 0.05, { type: 'triangle', vol: 0.1 * v, attack: 0.001, release: 0.2, ...o }); break;
    }
  }
  const drum = {
    k(t, v, b) { tone(150, t, 0.13, { slide: 0.28, vol: 0.17 * v, attack: 0.002, release: 0.05, dest: b }); },
    s(t, v, b) { noise(t, 0.14, { freq: 1900, q: 0.7, vol: 0.075 * v, dest: b }); tone(210, t, 0.04, { type: 'triangle', vol: 0.03 * v, dest: b }); },
    h(t, v, b) { noise(t, 0.03, { filter: 'highpass', freq: 7500, vol: 0.035 * v, dest: b }); },
    rim(t, v, b) { tone(1750, t, 0.008, { type: 'square', vol: 0.025 * v, release: 0.02, dest: b }); },
    clap(t, v, b) { for (let i = 0; i < 3; i++) noise(t + i * 0.011, 0.07, { freq: 1300, q: 1.2, vol: 0.05 * v, dest: b }); },
    tom(t, v, b) { tone(120, t, 0.2, { slide: 0.6, vol: 0.12 * v, dest: b }); },
  };
  const BREAKS = [['x.........x.....', '....x..x.x..x..x'], ['x.x.......xx....', '....x.x.....x.x.'], ['x.....x...x.....', '....x...x.xxx.x.'], ['x..x..x...x..x..', '..x.x..x..x.xxxx']];
  let cur = null, pending = null, nextStep = 0, songBars = 0, beatClock = { t0: 0, spb: 0.5 }, npTitle = '', lastCtx = '', rot = {};
  function pickSong(ctxKey, skip) {
    const L = PLAYLISTS[ctxKey] || PLAYLISTS.spring;
    rot[ctxKey] = rot[ctxKey] === undefined ? Math.floor(Math.random() * L.length) : (rot[ctxKey] + 1) % L.length;
    return L[rot[ctxKey]];
  }
  function startSong(key) {
    if (cur && cur.bus) { const b = cur.bus; b.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => { try { b.disconnect(); } catch (e) {} }, 3000); }
    cur = buildSong(key); cur.bus = ctx.createGain(); cur.bus.gain.value = 0; cur.bus.connect(music); cur.bus.gain.setTargetAtTime(1, ctx.currentTime + 0.3, 0.6);
    nextStep = Math.max(nextStep, ctx.currentTime + 0.12); songBars = 0; npTitle = cur.S.title;
    beatClock = { t0: nextStep, spb: 60 / cur.S.bpm };
    try { const np = document.getElementById('np'); if (np) np.textContent = `♪ ${npTitle}`; } catch (e) {}
    try { if (typeof onSongChange === 'function') onSongChange(npTitle); } catch (e) {}
  }
  function schedule() {
    if (!ok() || cfg.music === false || !W) return;
    const c = contextKey();
    if (!cur || c !== lastCtx) { lastCtx = c; startSong(pickSong(c)); }
    const S = cur.S, meter = cur.meter, sd = 60 / S.bpm / 4, b = cur.bus, sc = SC[S.sc];
    if (nextStep < ctx.currentTime) nextStep = ctx.currentTime + 0.05;
    while (nextStep < ctx.currentTime + 0.9) {
      const i = cur.step % meter, bar = Math.floor(cur.step / meter), sec = bar % 32;
      const intro = sec < 2, brk = sec >= 20 && sec < 24, big = sec >= 24;
      const t = nextStep + (S.swing && i % 4 === 2 ? S.swing * sd : 0);
      const ch = chordOf(S, bar), root = S.key - 12;
      // pad
      if (S.pad && i === 0 && bar % (S.bar || 1) === 0) for (const n of ch.slice(0, 3)) inst(S.pad, root + 12 + n, t, sd * meter * (S.bar || 1) * 0.95, brk ? 1.2 : 1, b);
      // bass
      const bc = S.b[i % S.b.length];
      if (bc && bc !== '.' && bc !== '-' && !brk) {
        let off = bc === 'R' ? ch[0] : bc === '5' ? ch[0] + 7 : bc === '8' ? ch[0] + 12 : bc === '3' ? ch[1] : ch[0];
        if (S.bassWalk) off = [ch[0], ch[1], ch[2], ch[0] + 12][Math.floor(i / 4)];
        inst(S.bass || 'bass', root - 12 + off, t, sd * 3, 1, b);
      }
      // arp
      if (S.arp && S.arpP) { const a = S.arpP[i % S.arpP.length]; if (a && a !== '.') inst(S.arp, root + 24 + ch[Number(a) % ch.length] + (big ? 12 : 0), t, sd * 2, brk ? 0.9 : 0.7, b); }
      // drums
      if (!brk && !(intro && sec < 1)) {
        const v = intro ? 0.6 : 1;
        if (S.breaks) {
          const pat = BREAKS[Math.floor(cur.r() * 1000 + bar) % BREAKS.length];
          if (pat[0][i] === 'x') drum.k(t, v, b);
          if (pat[1][i] === 'x') drum.s(t, v * (0.7 + cur.r() * 0.4), b);
          if (i % 2 === 1) drum.h(t, 0.5, b);
          if (bar % 4 === 3 && i >= 12) { drum.s(t, 0.6, b); drum.s(t + sd / 2, 0.5, b); }
        } else {
          if (S.k && S.k[i] === 'x') drum.k(t, v, b);
          if (S.s && S.s[i] === 'x') drum.s(t, v, b);
          if (S.h && S.h[i] === 'x') drum.h(t, v * (S.hv ?? 1), b);
          if (S.rim && S.rim[i] === 'x') drum.rim(t, v, b);
          if (S.clap && S.clap[i] === 'x' && !intro) drum.clap(t, v, b);
          if (S.tom && S.tom[i] === 'x' && bar % 2 === 1) drum.tom(t, v, b);
        }
      }
      if (S.crackle && i % 4 === 0 && Math.random() < 0.5) noise(t + Math.random() * sd * 3, 0.01, { filter: 'highpass', freq: 4000, vol: 0.012, dest: b });
      if (W.weather !== 'clear' && i === 0 && W.weather !== 'snow') noise(t, sd * meter, { freq: 1800, q: 0.4, vol: W.weather === 'storm' ? 0.04 : 0.02, dest: b });
      // melody
      if (!intro) {
        const ph = cur.phrases[Math.floor(bar / 2) % 4], idx = (bar % 2) * meter + i, nt = ph[idx];
        if (nt) {
          let semi = deg2semi(sc, nt.deg);
          if (nt.snap) { let best = semi, bd = 99; for (const ctn of ch) for (const o of [-12, 0, 12]) { const cand = ctn + o; const d = Math.abs(cand - semi); if (d < bd) { bd = d; best = cand; } } semi = best; }
          inst(S.lead, S.key + (S.hi || 0) + (big ? 12 : 0) + semi, t, sd * nt.len, brk ? 0.7 : 1, b);
        }
      }
      nextStep += sd; cur.step++;
      if (cur.step % meter === 0) { songBars++; if (songBars >= 64) { startSong(pickSong(lastCtx, true)); break; } }
    }
  }
  setInterval(schedule, 120);
  const at = () => ctx.currentTime + 0.01;
  return {
    unlock() { const c = ensure(); if (!c) return; if (c.state === 'suspended') c.resume(); started = true; },
    levels,
    nowPlaying() { return npTitle; },
    skip() { if (!ok() || cfg.music === false) return ''; startSong(pickSong(lastCtx || contextKey(), true)); return npTitle; },
    beatPhase() { if (!ok() || !cur) return (now * 1.5) % 1; return (((ctx.currentTime - beatClock.t0) / beatClock.spb) % 1 + 1) % 1; },
    beatCount() { if (!ok() || !cur) return Math.floor(now * 1.5); return Math.floor((ctx.currentTime - beatClock.t0) / beatClock.spb); },
    ui() { if (!ok()) return; tone(1180, at(), 0.025, { type: 'triangle', vol: 0.06 }); },
    door() { if (!ok()) return; const t = at(); tone(1319, t, 0.12, { vol: 0.12 }); tone(988, t + 0.12, 0.22, { vol: 0.12, release: 0.4 }); },
    coin() { if (!ok()) return; const t = at(); tone(988, t, 0.05, { type: 'square', vol: 0.05 }); tone(1319, t + 0.06, 0.18, { type: 'square', vol: 0.05 }); },
    sparkle() { if (!ok()) return; const t = at(); [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, t + i * 0.06, 0.08, { vol: 0.05, release: 0.3 })); },
    levelup() { if (!ok()) return; const t = at(); [60, 64, 67, 72, 76].forEach((m, i) => tone(hz(m + 12), t + i * 0.09, 0.12, { type: 'triangle', vol: 0.09, release: 0.25 })); },
    paper() { if (!ok()) return; const t = at(); noise(t, 0.12, { freq: 3000, q: 0.7, vol: 0.08 }); noise(t + 0.13, 0.1, { freq: 2400, q: 0.7, vol: 0.06 }); },
    bell() { if (!ok()) return; const t = at(); for (let i = 0; i < 3; i++) { tone(784, t + i * 0.45, 0.6, { vol: 0.08, release: 1.2 }); tone(1568, t + i * 0.45, 0.3, { vol: 0.03, release: 0.8 }); } },
    horn() { if (!ok()) return; const t = at(); tone(196, t, 1.1, { type: 'sawtooth', vol: 0.04, attack: 0.08, release: 0.5 }); tone(247, t, 1.1, { type: 'triangle', vol: 0.05, attack: 0.08, release: 0.5 }); },
    boom() { if (!ok()) return; const t = at(); noise(t, 0.9, { filter: 'lowpass', freq: 400, vol: 0.18 }); tone(90, t, 0.5, { vol: 0.12, slide: 0.4 }); noise(t + 0.25, 0.8, { freq: 5000, q: 0.3, vol: 0.02 }); },
    step() { if (!ok() || now - lastStep < 0.3) return; lastStep = now; noise(at(), 0.05, { freq: 350 + Math.random() * 150, q: 2, vol: 0.05 }); },
    splash() { if (!ok()) return; noise(at(), 0.4, { freq: 1200, q: 0.5, vol: 0.05 }); },
    shutter() { if (!ok()) return; const t = at(); noise(t, 0.05, { freq: 4200, q: 0.8, vol: 0.09 }); noise(t + 0.08, 0.06, { freq: 2600, q: 0.8, vol: 0.07 }); },
    objection(k = 1) { if (!ok()) return; const t = at(); [0, 3, 7, 12].forEach((s) => tone(hz(55 + s) * k, t, 0.42, { type: 'sawtooth', vol: 0.045, lp: 2600, release: 0.35 })); noise(t, 0.14, { freq: 1800, q: 0.6, vol: 0.14 }); tone(hz(43) * k, t, 0.3, { type: 'square', vol: 0.06, lp: 900 }); },
    gavel() { if (!ok()) return; const t = at(); for (let i = 0; i < 3; i++) { noise(t + i * 0.16, 0.05, { filter: 'lowpass', freq: 1100, vol: 0.22 }); tone(170, t + i * 0.16, 0.07, { type: 'triangle', vol: 0.12, slide: 0.5 }); } },
    stamp() { if (!ok()) return; const t = at(); noise(t, 0.3, { filter: 'lowpass', freq: 420, vol: 0.26 }); tone(70, t, 0.35, { vol: 0.16, slide: 0.45 }); },
    gasp(k = 1) { if (!ok()) return; const t = at(); noise(t, 0.55 * k, { freq: 1100, q: 0.5, vol: 0.05 * k }); noise(t + 0.05, 0.4 * k, { freq: 2300, q: 0.8, vol: 0.03 * k }); },
    heartbeat() { if (!ok()) return; const t = at(); for (let i = 0; i < 2; i++) { tone(60, t + i * 0.8, 0.12, { vol: 0.2, slide: 0.6 }); tone(55, t + i * 0.8 + 0.18, 0.12, { vol: 0.14, slide: 0.6 }); } },
    voice(p, text, force) {
      if (!ok() || cfg.voices === false || !p || !text || text === '…') return;
      if (!force && now - lastVoice < 0.5) return;
      lastVoice = now;
      const v = voiceOf(p), n = Math.min(16, Math.max(2, Math.ceil(text.length / 4))), q = /\?\s*$/.test(text), ex = /!\s*$/.test(text);
      let t = at();
      for (let i = 0; i < n; i++) {
        const lift = q && i >= n - 2 ? 1.25 : ex && i === 0 ? 1.15 : 1;
        const f = v.base * lift * (1 + (Math.random() - 0.5) * v.spread * 2);
        tone(f, t, v.len, { type: v.wave, vol: 0.05, attack: 0.008, release: 0.03, dest: voiceBus });
        tone(f * 2, t, v.len * 0.6, { type: 'sine', vol: 0.015, attack: 0.008, release: 0.02, dest: voiceBus });
        t += v.len + 0.018 + Math.random() * 0.02;
      }
    },
  };
})();
function voiceOf(p) {
  if (p.body.voice) return p.body.voice;
  const h = (parseInt(String(p.id).replace(/\D/g, '')) || 1) * 7919;
  const kid = p.grow < 1 ? 1.35 : 1;
  p.body.voice = { base: (160 + (h % 220)) * kid / p.body.size, spread: 0.12 + ((h >> 3) % 20) / 100, wave: ['square', 'triangle', 'sawtooth', 'sine'][(h >> 5) % 4], len: 0.055 + ((h >> 7) % 5) / 100 };
  return p.body.voice;
}
function hearable(p) {
  if (MODE !== 'host') return false;
  if (dlg && dlg.pid === p.id) return true;
  if (interior) return interior.kind === 'room' ? interior.id === p.id : p.inside && p.at === (interior.shop || interior.kind);
  if (p.inside) return false;
  return Math.hypot(p.x - controls.target.x, p.z - controls.target.z) < 22;
}
['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, () => Sound.unlock(), { passive: true }));
document.addEventListener('click', (e) => { if (e.target.closest('button, .tab')) Sound.ui(); });
$('#uproarBox').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || !W.scene) return; if (b.dataset.upx !== undefined) { upHidden = W.scene.id; renderUproarBox(); return; } if (b.dataset.upwatch !== undefined) { if (interior) closeInterior(); camGoal = { x: W.scene.center[0], z: W.scene.center[1], r: 26 }; lastTouch = now; return; } if (b.dataset.upc) { send({ t: 'uproar', choice: b.dataset.upc }); b.disabled = true; } });
setInterval(() => { try { renderUproarBox(); } catch (e) {} }, 800);
$('#labBox').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || !labOpen) return; if (b.dataset.labclose !== undefined) { $('#labBox').hidden = true; labOpen = null; return; } if (b.dataset.labask !== undefined) send({ t: 'lab', pid: labOpen, act: 'ask' }); if (b.dataset.labcoffee !== undefined) send({ t: 'lab', pid: labOpen, act: 'coffee' }); });
$('#labBox').addEventListener('submit', (e) => { e.preventDefault(); const t = $('#labIdea').value.trim(); if (!t || !labOpen) return; send({ t: 'lab', pid: labOpen, act: 'idea', text: t }); $('#labIdea').value = ''; });
setInterval(() => { if (labOpen && !$('#labBox').hidden && !($('#labIdea') && ($('#labIdea').value || document.activeElement === $('#labIdea')))) renderLab(); }, 2500);
$('#careBox').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || !careOpen) return; const D = b.dataset; if (D.careclose !== undefined) { $('#careBox').hidden = true; careOpen = null; return; } if (D.careask !== undefined) send({ t: 'care', pid: careOpen, act: 'ask' }); if (D.caresoup !== undefined) send({ t: 'care', pid: careOpen, act: 'soup' }); if (D.caredoc !== undefined) send({ t: 'care', pid: careOpen, act: 'doc' }); if (D.caretherapy !== undefined) send({ t: 'care', pid: careOpen, act: 'therapy' }); if (D.carecond) send({ t: 'care', pid: careOpen, act: 'cond', cond: D.carecond }); });
$('#careBox').addEventListener('submit', (e) => { e.preventDefault(); const t = $('#careText').value.trim(); if (!t || !careOpen) return; send({ t: 'care', pid: careOpen, act: 'kind', text: t }); $('#careText').value = ''; });
$('#careBox').addEventListener('toggle', (e) => { if (e.target.tagName === 'DETAILS') careDetailsOpen = e.target.open; }, true);
setInterval(() => { if (careOpen && !$('#careBox').hidden && !($('#careText') && ($('#careText').value || document.activeElement === $('#careText')))) renderCare(); }, 2500);
document.addEventListener('submit', (e) => { const f = e.target.closest && e.target.closest('[data-agentform]'); if (!f) return; e.preventDefault(); const req = $('#agentReq').value.trim(); if (!req) return; send({ t: 'agent', request: req }); });
document.addEventListener('change', (e) => { if (e.target.id === 'agentModel') { brainCfg.workshop = e.target.value.trim(); saveBrain(); toast(brainCfg.workshop ? `Claude will use ${brainCfg.workshop}.` : 'Claude will use the judge model.'); return; } if (e.target.id === 'outsideOn' || e.target.id === 'outsidePosts' || e.target.id === 'outsidePolitics') { const key = e.target.id === 'outsideOn' ? 'on' : e.target.id === 'outsidePolitics' ? 'politics' : 'posts'; if (MODE === 'host') { cfg[key === 'posts' ? 'outsidePosts' : key === 'politics' ? 'outsidePolitics' : 'outside'] = e.target.checked; savePrefs(); if (e.target.checked) fetchOutside(true); } else send({ t: 'outside', key, value: e.target.checked }); } });

