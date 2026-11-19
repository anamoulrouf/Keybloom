// Family Relay: two players share one keyboard and take turns (legs). To keep it fair for a
// parent and a child, each player moves by how they type compared with their OWN usual speed:
// typing exactly at your rating for one second moves you one step. Wrong keys never move you.
export const LEG_SECONDS = 30;
export const LEGS_EACH = 2;
export const GUEST_LEVELS = [
  { label: 'Just starting', wpm: 10 },
  { label: 'Getting there', wpm: 20 },
  { label: 'Pretty quick', wpm: 35 },
  { label: 'Very fast', wpm: 55 },
];

/** Steps earned for correct characters typed by a player with this rating. */
export function relaySteps(correctChars, ratingWpm) {
  const perSecond = (Math.max(4, ratingWpm) * 5) / 60;
  return correctChars / perSecond;
}

/** Simulates one race between two players (for fairness tests). */
export function simulateRelay(rng, a, b, legs = LEGS_EACH, seconds = LEG_SECONDS) {
  const leg = (p) => {
    // A real typist varies from leg to leg: ±20% speed, plus a few slips.
    const wpm = p.trueWpm * (0.8 + rng() * 0.4);
    return relaySteps(Math.round((wpm * 5 * seconds) / 60), p.rating);
  };
  let sa = 0, sb = 0;
  for (let i = 0; i < legs; i++) {
    sa += leg(a);
    sb += leg(b);
  }
  return sa === sb ? 'tie' : sa > sb ? 'a' : 'b';
}
