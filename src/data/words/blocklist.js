// Content safety: words come only from curated allowlists, and tests check that none of them is
// an exact blocked word. The game never generates letter strings of its own.
export const BLOCKED_WORDS = new Set([
  'ass', 'fag', 'kkk', 'sex', 'shit', 'dick', 'cock', 'damn', 'hell', 'piss', 'kill', 'gun', 'drug',
  'butt', 'dumb', 'fat', 'ugly', 'hate', 'stupid', 'idiot', 'die', 'dead', 'nude', 'porn',
]);

export function isBlockedWord(word) {
  return BLOCKED_WORDS.has(word.toLowerCase());
}
