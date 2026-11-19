// Word generator: real words only from curated allowlists, filtered to the keys a child has
// unlocked and weighted toward their weak and newest keys. Every word a child types is a real word:
// the key order (see adaptive.js) guarantees real words exist from the very first stage.
import { DOLCH, EVERYDAY } from '../data/words/common.js';
import { GARDEN } from '../data/words/garden.js';
import { isBlockedWord } from '../data/words/blocklist.js';
import { unlockedKeys, newestKeys, keyWeakness } from './adaptive.js';
import { weightedPick } from './rng.js';

const ALL_WORDS = [...new Set([...GARDEN, ...DOLCH, ...EVERYDAY])].filter(
  (w) => /^[a-z]+$/.test(w) && !isBlockedWord(w),
);
const GARDEN_SET = new Set(GARDEN);

export function allWords() {
  return ALL_WORDS;
}

const poolCache = new Map();
export function wordPool(keys, maxLen = 9) {
  const cacheKey = keys.join('') + '|' + maxLen;
  let pool = poolCache.get(cacheKey);
  if (!pool) {
    const set = new Set(keys);
    pool = ALL_WORDS.filter((w) => w.length <= maxLen && [...w].every((c) => set.has(c)));
    poolCache.set(cacheKey, pool);
  }
  return pool;
}

function wordWeight(learner, word, newest) {
  let w = 0;
  for (const c of word) w += keyWeakness(learner, c);
  w /= word.length;
  if ([...word].some((c) => newest.includes(c))) w += 2;
  if (GARDEN_SET.has(word)) w += 0.75;
  return w;
}

/**
 * Picks one word for a child.
 * opts.excludeFirst: Set of first letters already on screen (Garden Play targeting rule).
 * opts.avoid: Set of words recently used.
 * opts.focus: array of keys to favour heavily (Daily Watering, lessons).
 * opts.require: array of keys; only words containing at least one of them (if any exist).
 * Returns null if nothing fits (e.g. every possible first letter is taken).
 */
export function pickWord(rng, learner, opts = {}) {
  const { excludeFirst = new Set(), avoid = new Set(), focus = null, require = null, maxLen = 9 } = opts;
  const keys = unlockedKeys(learner);
  const newest = newestKeys(learner);
  let pool = wordPool(keys, maxLen);
  if (pool.length === 0 && maxLen < 9) pool = wordPool(keys, 9);
  if (require && require.length) {
    const withKey = pool.filter((w) => require.some((k) => w.includes(k)));
    if (withKey.length) pool = withKey;
  }
  if (excludeFirst.size) pool = pool.filter((w) => !excludeFirst.has(w[0]));
  const fresh = avoid.size ? pool.filter((w) => !avoid.has(w)) : pool;
  const candidates = fresh.length >= 3 ? fresh : pool;
  if (candidates.length === 0) return null;
  return weightedPick(rng, candidates, (w) => {
    let weight = wordWeight(learner, w, newest);
    if (focus) weight += [...w].filter((c) => focus.includes(c)).length * 3;
    return weight;
  });
}

/** A line of space-separated words for lessons and warm-ups. */
export function makeLine(rng, learner, count, opts = {}) {
  const words = [];
  const avoid = new Set();
  for (let i = 0; i < count; i++) {
    const w = pickWord(rng, learner, { ...opts, avoid });
    if (!w) break;
    words.push(w);
    avoid.add(w);
  }
  return words.join(' ');
}

/**
 * Winter words: capitals and punctuation, more as the season goes on.
 * level = bed index (0–7). The first letter stays the same letter, so targeting is unchanged
 * (a capital needs Shift, which is the point).
 */
export function winterize(rng, word, level) {
  let w = word;
  const capChance = level < 2 ? 0.5 : 0.4;
  if (rng() < capChance) w = w[0].toUpperCase() + w.slice(1);
  if (level >= 2) {
    const r = rng();
    const ends = level >= 4 ? ['.', ',', '?', '!', "'s"] : ['.', ','];
    if (r < (level >= 6 ? 0.6 : 0.4)) {
      const e = ends[Math.floor(rng() * ends.length)];
      if (e === "'s" && !GARDEN_SET.has(word)) w += '.';
      else w += e;
    }
  }
  return w;
}
