// ============================================================
// DAYDREAM MINDS
// ============================================================
function leanings(p) {
  const s = p.selfNote.toLowerCase();
  return { kind: /(kind|shar|giv|generous|help|gentle)/.test(s), wary: /(careful|wary|mean|trust|hurt|alone)/.test(s), food: /(hungry|food close|save)/.test(s) };
}
function creatorLine(me) {
  const s = me.cr.score, fav = creatorFavorite(), color = Object.entries(me.cr.beliefs).filter(([k]) => COLORS[k]).sort((a, b) => b[1] - a[1])[0];
  if (s >= 6) return pick(['Do you think the Creator is watching us right now?', 'The Creator is so kind to us.', "I try to be good so the Creator's proud of me."]);
  if (s >= 2) return color ? `I think the Creator's favorite color is ${color[0]}.` : 'I wonder what the Creator is like.';
  if (s > -2) return pick(['Do you think the Creator is even real?', 'Who do you think made all this?', "Sometimes I talk to the sky. Is that weird?"]);
  if (s > -6) return fav && fav.id !== me.id ? `The Creator only cares about ${fav.name}.` : 'The Creator never listens to me.';
  return pick(["I don't need the Creator. We made this town ourselves.", "Stop talking about the Creator. They don't care."]);
}
function daydream(me, them, ctx) {
  const f = me.feelings[them.id], score = f ? f.score : 0, L = leanings(me), r = rand();
  let action = 'chat', say = '', feeling = 0, compliment = false, topic = null;
  if (ctx.replyTo) {
    if (ctx.topic === 'culture') { const cr = cultureReply(me, them); return { say: cr.say, action: 'chat', feeling: cr.feeling, compliment: false, topic: null }; }
    if (ctx.topic === 'creator') {
      const agree = Math.sign(me.cr.score) === Math.sign(ctx.stance) || Math.abs(me.cr.score - ctx.stance) < 3;
      if (agree) { say = me.cr.score >= 2 ? pick(['I feel it too!', "Yes! They're watching over us."]) : me.cr.score <= -2 ? pick(['Right? Where are they when we need them?', 'Finally, someone gets it.']) : pick(["I really don't know.", 'Maybe we just have to wait and see.']); feeling = 1; }
      else { say = me.cr.score >= 2 ? pick(["Don't talk about the Creator like that!", 'The Creator gave us everything.']) : pick(["You're such a Creator's pet.", 'Open your eyes. Nobody is up there.']); feeling = -1; }
      return { say, action, feeling, compliment, topic };
    }
    if (ctx.compliment) { say = pick(['Thank you! I picked it myself.', 'Hehe, you noticed!', "Really? I wasn't sure about it."]); feeling = 2; }
    else switch (ctx.replyTo) {
      case 'ask_for_help':
        if ((score >= 0 || L.kind) && me.coins > 1 && !(L.food && r < 0.5)) { action = 'give_coin'; say = pick(['Here, get yourself something at Berry Mart.', 'Take this coin.', "Go eat. It's on me."]); feeling = 1; }
        else { action = score < 0 ? 'walk_away' : 'chat'; say = pick(["I'm broke too.", "Sorry, I can't.", 'Maybe the berry bushes have some left?']); }
        break;
      case 'share_food': case 'give_coin': say = pick(['Oh! Thank you!', "You didn't have to do that.", "I'll remember this.", 'You are so nice.']); feeling = 2; break;
      case 'tease':
        if (score < -2 || L.wary) { action = r < 0.5 ? 'tease' : 'walk_away'; say = pick(['Well, YOUR hat is weird.', 'Leave me alone.', 'Whatever.']); }
        else say = pick(["That's not funny.", 'Why would you say that?', 'Hey…']);
        feeling = -2; break;
      case 'walk_away': say = pick(['Oh… okay.', 'Bye, then.', 'Was it something I said?']); feeling = -1; break;
      default:
        if (score >= 3) { say = pick(['Always happy to see you.', "Sure, let's go!", 'Hehe, yes.']); feeling = 1; }
        else if (score < 0) say = pick(['Mm.', 'If you say so.', "I'm busy."]);
        else { say = pick(['Hi.', 'Yeah, it is.', 'Just walking around.', `I like ${TOWN[me.at]?.name || 'it here'}.`]); feeling = rand() < 0.5 ? 1 : 0; }
    }
  } else {
    const fav = favoriteFood(me);
    if (score <= -4) { action = r < 0.5 ? 'tease' : 'walk_away'; say = pick(['You again.', 'Nobody asked you.', 'Hmph.']); feeling = -1; }
    else if (me.hunger > 0.65 && me.coins < 2 && r < 0.7) { action = 'ask_for_help'; say = pick(["I'm so hungry and I'm out of coins…", 'Could you spare a coin?', 'My tummy is empty.']); }
    else if (them.hunger > 0.75 && me.coins > 3 && (score >= 0 || L.kind) && r < 0.6) { action = 'give_coin'; say = pick([`You look hungry, ${them.name}. Here.`, 'Go get something to eat. On me.']); feeling = 1; }
    else if (me.lovesMili && isMili(them) && r < 0.7) { say = pick(['Yo. I love you.', 'I love you. Bye-bye.', 'Love you, bye-bye.', 'Hey. I love you.']); feeling = 2; }
    else if (me.lines?.length && r < 0.4) { say = pick(me.lines); }
    else if ((me.visitor || them.visitor) && r < 0.55) { say = cultureLine(me, them); topic = 'culture'; }
    else if (r < 0.2 && Object.entries(me.feelings).some(([id, x]) => id !== them.id && Math.abs(x.score) >= 4 && person(id))) { const [gid, gx] = Object.entries(me.feelings).filter(([id, x]) => id !== them.id && Math.abs(x.score) >= 4 && person(id)).sort(() => rand() - 0.5)[0]; const g = person(gid); say = gx.score > 0 ? pick([`Have you talked to ${g.name} lately? They're the best.`, `${g.name} helped me with something yesterday. So sweet.`]) : pick([`Is it just me, or is ${g.name} kind of full of themselves?`, `Don't tell ${g.name} I said this, but they get on my nerves.`, `Did you hear what ${g.name} did at the meeting?`]); topic = 'gossip'; feel(them, g, gx.score > 0 ? 0.5 : -0.5, true); remember(them, `${me.name} said: "${say}"`, 1, 'rumor', g.name); }
    else if (r < 0.26 && (W.day > 1 || W.creator.giftsTotal > 0)) { say = creatorLine(me); topic = 'creator'; }
    else if (them.outfit.hat && score >= 1 && r < 0.36) { say = `I love your ${hatText(them.outfit.hat)}!`; feeling = 1; compliment = true; }
    else if (score >= 5 && me.coins > 4 && r < 0.42) { action = 'give_coin'; say = pick(['This made me think of you.', 'For you!']); feeling = 1; }
    else if (!f) say = pick([`Hi! I'm ${me.name}.`, 'Oh! Hello, neighbor.', 'Have we met?', `You're in room ${them.room + 1}, right?`]);
    else if (score >= 4) { say = pick([`${them.name}! There you are.`, 'Want to get tea later?', "I was hoping I'd see you."]); feeling = 1; }
    else if ((L.wary && r < 0.55) || (score < 0 && r < 0.6)) { action = 'tease'; say = pick(['You walk funny.', 'Nice shirt. Ha.', 'Were you following me?']); feeling = -1; }
    else if (fav && r < 0.65) say = `Have you tried the ${fav}? So good.`;
    else if (me.cr.wish && r < 0.75) say = `I really want ${wishText(me.cr.wish)}. Maybe the Creator will hear me.`;
    else if (me.job && r < 0.85) say = me.job === 'pier' ? pick(['I caught a fish THIS big today.', 'The fish are shy today.']) : me.job === 'garden' ? 'The radishes are coming up nicely.' : `Work at ${TOWN[JOBS[me.job].place].name} was busy today.`;
    else say = pick([W.weather === 'storm' ? 'Did you hear the thunder?' : W.weather === 'rain' ? "I'm soaked." : W.weather === 'snow' ? pick(['Snow!!', 'My toes are frozen.', 'Want to build a snowman?']) : seasonOf().id === 'autumn' ? 'I love when the leaves crunch.' : "Nice day, isn't it?", 'Where are you headed?', 'What do you think is past the water?', W.project ? `Are you chipping in for ${PROJECTS[W.project.id].name}?` : 'This town needs something new.']);
  }
  return { say, action, feeling, compliment, topic, stance: me.cr.score };
}

