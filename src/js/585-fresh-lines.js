// ============================================================
// FRESH LINES: no cutscene line is ever shown twice. The town remembers every line it has
// heard, and a line that was said before comes out reworded for whoever is speaking.
// The extra words are only feelings and filler, never facts (no times, places, colors,
// objects or people), so crime scenes stay solvable from the board.
// ============================================================
const FRESH = {
  resident: {
    pre: ['Honestly? ', 'Okay. ', 'Look. ', 'Listen. ', "I'll just say it. ", 'Um. ', 'Ugh. ', 'Wait. ', 'Can I say something? ', 'So. ', 'Real talk. ', 'Fine. ', 'Oh. ', 'Hmm. ', 'Right. ', 'Okay, okay. ', 'Here goes. ', 'You know what? ', 'Sorry, but. ', 'Hold on. ', 'Phew. ', 'Well. ', 'Hey. ', 'Alright. ', 'Ahem. ', 'No, listen. '],
    suf: [' I mean it.', ' Seriously.', ' Just saying.', " That's all.", " I'm not kidding.", ' Okay?', ' For real.', ' Anyway.', ' Right?', ' You know?', ' Honestly.', " That's how I feel.", ' There. I said it.', ' Moving on.', ' I really do.', ' Believe me.', ' Every word.', ' No take-backs.', ' Okay, that is all.', ' Mm-hm.', ' Yep.', ' I needed to say that.', ' Promise.', ' Truly.', ' From the heart.'],
  },
  judge: {
    pre: ['Hoo. ', 'Ahem. ', 'Hmm. Hoo. ', 'Order. ', 'Well then. ', 'Hoo hoo. ', 'Now. ', 'Very well. ', 'Quiet, please. ', 'Let the record show. '],
    suf: [' Hoo.', ' Hoo hoo.', ' *ruffles feathers*', ' *adjusts spectacles*', ' *blinks slowly*', ' *taps the gavel once*', ' The court has spoken.', ' Hoo. Moving on.', ' *hoots softly*', ' Next.'],
  },
  narrator: {
    pre: ['', 'Then: ', 'And so, ', 'A beat. ', 'Just then, '],
    suf: [' A breeze moved through.', ' Somewhere, a gull called out.', ' A moment passed.', ' The sky shifted a little.', ' Someone shuffled their feet.', ' Nobody spoke for a second.', ' Everything felt very still.', ' The island seemed to listen.', ' A cloud drifted by.', ' Time slowed, just a little.'],
  },
  crowd: {
    pre: ['*gasp* ', '*murmurs* ', '*whispers* ', '*shuffling* ', '*someone coughs* ', '*a hush* '],
    suf: [' *whispering*', ' *everyone leans in*', ' *a gasp from the back*', ' *someone claps once*', ' *nervous giggles*', ' *murmuring*', ' *a long "ooooh"*', ' *heads turn*'],
  },
};
const freshKind = (L) => (L.who === 'judge' ? 'judge' : L.who === 'narrator' ? 'narrator' : L.who === 'crowd' ? 'crowd' : 'resident');
let heardSet = null;
// the set follows whichever town is loaded (the second island has its own memory)
function heardSync() { W.heard = W.heard || []; if (!heardSet || heardSet.src !== W.heard) { heardSet = new Set(W.heard); heardSet.src = W.heard; } }
function heardHas(h) { heardSync(); return heardSet.has(h); }
function heardAdd(h) {
  heardSync();
  W.heard.push(h); heardSet.add(h);
  if (W.heard.length > 6000) { for (const x of W.heard.splice(0, W.heard.length - 6000)) heardSet.delete(x); }
}
function freshVariants(text, kind) {
  const D = FRESH[kind], t = String(text).trim();
  const ended = /[.!?…*)"'~]$/.test(t) ? t : t + '.';
  const mix = (a) => a.sort(() => rand() - 0.5);
  // gentlest first: one word added, then both ends, then two endings
  const one = mix([...D.suf.map((s) => ended + s), ...D.pre.filter(Boolean).map((p) => p + t)]);
  const two = mix(D.pre.flatMap((p) => D.suf.map((s) => p + ended + s)));
  const three = mix(D.pre.flatMap((p) => D.suf.flatMap((a) => D.suf.filter((b) => b !== a).map((b) => p + ended + a + b))));
  return [...one, ...two, ...three];
}
// the line as it should be shown this time: unchanged the first time it's ever heard, reworded after that
function freshLine(L) {
  const t = String(L.text || '').trim(); if (!t || typeof W === 'undefined' || !W) return L.text;
  const h0 = hashStr(t);
  if (!heardHas(h0)) { heardAdd(h0); return t; }
  for (const v of freshVariants(t, freshKind(L))) { const h = hashStr(v); if (!heardHas(h)) { heardAdd(h); return v; } }
  return t;
}
