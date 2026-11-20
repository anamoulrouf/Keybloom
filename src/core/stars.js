// Stars: a score that only ever goes up, shown under each gardener (badges and a family
// leaderboard will use it later). Dewdrops stay the shop money.
export const STARS = {
  word: 1, cleanWord: 1,          // every word, +1 more with no mistakes
  sentence: 5, cleanSentence: 3,  // every sentence, +3 more with no mistakes
  line: 2,                        // a line in lessons, stories, Islamic Life
  finish: 5,                      // finishing a bed or a session
};

export function starsFor(kind, clean = false) {
  if (kind === 'word') return STARS.word + (clean ? STARS.cleanWord : 0);
  if (kind === 'sentence') return STARS.sentence + (clean ? STARS.cleanSentence : 0);
  if (kind === 'line') return STARS.line;
  if (kind === 'finish') return STARS.finish;
  return 0;
}

const SMALL = ['Nice!', 'Great!', 'Super!', 'Well done!', 'Yay!', 'Lovely!', 'Good job!'];
const BIG = ['Wonderful sentence!', 'Amazing!', 'Brilliant!', 'Fantastic!', 'You did it!'];
export const cheerWord = (rng = Math.random, big = false) => (big ? BIG : SMALL)[Math.floor(rng() * (big ? BIG : SMALL).length)];
