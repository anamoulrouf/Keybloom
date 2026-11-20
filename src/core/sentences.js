// The beginner flow: a few small words, then a sentence that uses some of them.
// The sentence is chosen first (it must fit the child's keys); the warm-up words are built around
// it, so typing the sentence feels like putting the words together.
import { SENTENCES } from '../data/sentences.js';
import { unlockedKeys, newestKeys, keyWeakness, KEY_GROUPS } from './adaptive.js';
import { pickWord } from './words.js';
import { weightedPick } from './rng.js';
import { isBlockedWord } from '../data/words/blocklist.js';

const lettersOf = (s) => new Set(s.replace(/[^a-z]/g, ''));

/** Sentences the child can type with the keys they have. */
export function sentencesFor(learner) {
  const keys = new Set(unlockedKeys(learner));
  return SENTENCES.filter((s) => [...lettersOf(s)].every((c) => keys.has(c)));
}

/** True once every letter is learned: sentences get a capital and a full stop. */
export const usesCapitals = (learner) => learner.groupsUnlocked >= KEY_GROUPS.length;

export function dress(sentence, learner) {
  return usesCapitals(learner) ? sentence[0].toUpperCase() + sentence.slice(1) + '.' : sentence;
}

/** Picks a sentence, leaning toward ones with the newest and weakest keys. related: words to overlap. */
export function pickSentence(rng, learner, { related = [], avoid = new Set() } = {}) {
  let pool = sentencesFor(learner).filter((s) => !avoid.has(s));
  if (!pool.length) pool = sentencesFor(learner);
  if (!pool.length) return null;
  const newest = newestKeys(learner);
  const rel = new Set(related.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')));
  // Prefer sentences that share words with what the child just typed, whenever any do.
  const overlap = (s) => s.split(' ').filter((x) => rel.has(x)).length;
  if (rel.size) {
    const sharing = pool.filter((s) => overlap(s) > 0);
    if (sharing.length) pool = sharing;
  }
  return weightedPick(rng, pool, (s) => {
    const letters = [...lettersOf(s)];
    let w = 1 + letters.reduce((a, c) => a + keyWeakness(learner, c), 0) / letters.length;
    if (letters.some((c) => newest.includes(c))) w += 2;
    w += s.split(' ').filter((x) => rel.has(x)).length * 4;
    return w;
  });
}

/**
 * One round: { words: 7–10 small words, sentence }.
 * About half of the words come from the sentence itself; the rest practise its letters.
 */
export function planRound(rng, learner, { avoid = new Set() } = {}) {
  const raw = pickSentence(rng, learner, { avoid });
  const count = 7 + Math.floor(rng() * 4);
  const fromSentence = [...new Set(raw.split(' ').filter((w) => w.length >= 2 && !isBlockedWord(w)))];
  for (let i = fromSentence.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [fromSentence[i], fromSentence[j]] = [fromSentence[j], fromSentence[i]];
  }
  const words = fromSentence.slice(0, Math.max(2, Math.ceil(count / 2)));
  const focus = [...lettersOf(raw)];
  const used = new Set(words);
  while (words.length < count) {
    const w = pickWord(rng, learner, { focus, avoid: used, maxLen: 6 });
    if (!w) break;
    used.add(w);
    words.push(w);
  }
  // Mix them so the sentence words are spread through the round.
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return { words, sentence: dress(raw, learner), raw };
}
