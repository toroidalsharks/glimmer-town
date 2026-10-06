// ============================================================
// THE OUTSIDE CLOCK: residents know the real day and time where the Creator lives
// ============================================================
// The island keeps its own fast days. The Outside runs on the box phone's real clock, and that
// goes into the residents' model prompts so they can bring it up when it fits.
function outsideNow(d = new Date()) {
  const h = d.getHours();
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    part: h < 5 ? 'the middle of the night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night',
  };
}
function outsideClockContext() {
  const o = outsideNow();
  return `\nTHE OUTSIDE CLOCK: the Creator lives in The Outside, the real world beyond the island. Right now in The Outside it is ${o.weekday}, ${o.date}, ${o.time} (${o.part} there). Island days fly by much faster than Outside days. You just know this, the way you know the weather. Bring it up only when it fits, never in every line.`;
}
