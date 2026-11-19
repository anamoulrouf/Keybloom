import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickWord, wordPool, allWords, makeLine } from '../src/core/words.js';
import { createLearner, recordKeystroke, unlockedKeys, KEY_GROUPS, newestKeys } from '../src/core/adaptive.js';
import { mulberry32 } from '../src/core/rng.js';
import { isBlockedWord } from '../src/data/words/blocklist.js';

const at = (groups) => Object.assign(createLearner(), { groupsUnlocked: groups });

test('every curated word is lowercase letters and not a blocked word', () => {
  for (const w of allWords()) {
    assert.match(w, /^[a-z]+$/);
    assert.ok(!isBlockedWord(w), w);
  }
  assert.ok(allWords().length > 700, `only ${allWords().length} words`);
});

test('only unlocked letters are ever used (all stages, 2k samples each)', () => {
  const rng = mulberry32(7);
  for (let g = 1; g <= KEY_GROUPS.length; g++) {
    const l = at(g);
    const keys = new Set(unlockedKeys(l));
    for (let i = 0; i < 2000; i++) {
      const w = pickWord(rng, l);
      assert.ok(w, `stage ${g} produced nothing`);
      for (const c of w) assert.ok(keys.has(c), `stage ${g}: "${w}" uses ${c}`);
    }
  }
});

test('every output is a real curated word, never a made-up string (100k samples)', () => {
  const rng = mulberry32(42);
  const real = new Set(allWords());
  for (let i = 0; i < 100_000; i++) {
    const l = at(1 + (i % KEY_GROUPS.length));
    const w = pickWord(rng, l);
    assert.ok(real.has(w), `not a real word: ${w}`);
    assert.ok(!isBlockedWord(w), `blocked word: ${w}`);
  }
});

test('every stage has real words, and words that use its new keys', () => {
  for (let g = 1; g <= KEY_GROUPS.length; g++) {
    const l = at(g);
    const pool = wordPool(unlockedKeys(l));
    assert.ok(pool.length >= 8, `stage ${g} has only ${pool.length} words`);
    for (const k of newestKeys(l)) {
      const n = pool.filter((w) => w.includes(k)).length;
      assert.ok(n >= 3, `stage ${g}: only ${n} words use "${k}"`);
    }
  }
});

test('require keeps lesson words on the new keys', () => {
  const rng = mulberry32(9);
  const l = at(2);
  for (let i = 0; i < 200; i++) {
    const w = pickWord(rng, l, { require: ['g', 'h', 'k'], maxLen: 5 });
    assert.ok(/[ghk]/.test(w), w);
  }
});

test('excludeFirst keeps first letters unique on screen', () => {
  const rng = mulberry32(3);
  const l = at(8);
  for (let i = 0; i < 500; i++) {
    const onScreen = new Set();
    for (let n = 0; n < 5; n++) {
      const w = pickWord(rng, l, { excludeFirst: onScreen });
      if (!w) break;
      assert.ok(!onScreen.has(w[0]));
      onScreen.add(w[0]);
    }
  }
});

test('returns null instead of breaking the rule when all first letters are taken', () => {
  const l = at(1);
  assert.equal(pickWord(mulberry32(1), l, { excludeFirst: new Set(['a', 's', 'd', 'f', 'l']) }), null);
});

test('weak keys appear more often', () => {
  const rng = mulberry32(11);
  const l = at(10);
  for (const k of unlockedKeys(l)) for (let i = 0; i < 30; i++) recordKeystroke(l, k, k !== 'p' || i % 2 === 0, 500);
  let withP = 0;
  const N = 3000;
  for (let i = 0; i < N; i++) if (pickWord(rng, l).includes('p')) withP++;
  const base = wordPool(unlockedKeys(l)).filter((w) => w.includes('p')).length / wordPool(unlockedKeys(l)).length;
  assert.ok(withP / N > base * 1.3, `p share ${withP / N} vs base ${base}`);
});

test('makeLine builds a space separated line', () => {
  const line = makeLine(mulberry32(5), at(6), 6);
  assert.equal(line.split(' ').length, 6);
});
