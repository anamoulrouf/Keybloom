import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SENTENCES } from '../src/data/sentences.js';
import { sentencesFor, planRound, pickSentence, dress } from '../src/core/sentences.js';
import { createLearner, unlockedKeys, KEY_GROUPS } from '../src/core/adaptive.js';
import { isBlockedWord } from '../src/data/words/blocklist.js';
import { starsFor, STARS } from '../src/core/stars.js';
import { createProfile, defaultSettings, save, load, SAVE_KEY } from '../src/ui/save.js';
import { mulberry32 } from '../src/core/rng.js';

const at = (groups) => Object.assign(createLearner(), { groupsUnlocked: groups });

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('every stage, from the very first keys, has sentences that fit its letters', () => {
  for (let g = 1; g <= KEY_GROUPS.length; g++) {
    const l = at(g);
    const keys = new Set(unlockedKeys(l));
    const pool = sentencesFor(l);
    assert.ok(pool.length >= 8, `stage ${g}: only ${pool.length} sentences`);
    for (const s of pool) for (const c of s.replace(/ /g, '')) assert.ok(keys.has(c), `stage ${g}: "${s}" uses ${c}`);
  }
  for (const s of sentencesFor(at(2))) assert.ok(s.length <= 32, `beginner sentence too long: ${s}`);
});

test('sentences are lowercase words only and contain no blocked words', () => {
  assert.equal(new Set(SENTENCES).size, SENTENCES.length, 'no duplicates');
  for (const s of SENTENCES) {
    assert.match(s, /^[a-z]+( [a-z]+)*$/, s);
    for (const w of s.split(' ')) assert.ok(!isBlockedWord(w), `${w} in "${s}"`);
  }
});

test('a round is 7–10 words on unlocked keys, at least 2 of them from its sentence', () => {
  const rng = mulberry32(21);
  for (let g = 1; g <= KEY_GROUPS.length; g++) {
    const l = at(g);
    const keys = new Set(unlockedKeys(l));
    for (let i = 0; i < 60; i++) {
      const r = planRound(rng, l);
      assert.ok(r.words.length >= 7 && r.words.length <= 10, `stage ${g}: ${r.words.length} words`);
      for (const w of r.words) for (const c of w) assert.ok(keys.has(c), `stage ${g}: ${w}`);
      const sw = new Set(r.raw.split(' '));
      assert.ok(r.words.filter((w) => sw.has(w)).length >= 2, `stage ${g}: words ${r.words} vs "${r.raw}"`);
      assert.ok(sentencesFor(l).includes(r.raw));
    }
  }
});

test('capitals and a full stop only once every letter is learned', () => {
  assert.equal(dress('the sun is out', at(5)), 'the sun is out');
  assert.equal(dress('the sun is out', at(KEY_GROUPS.length)), 'The sun is out.');
  const r = planRound(mulberry32(3), at(KEY_GROUPS.length));
  assert.match(r.sentence, /^[A-Z].*\.$/);
});

test('sentences in Garden Play lean toward the words just planted', () => {
  const rng = mulberry32(9);
  const l = at(8);
  let hits = 0;
  for (let i = 0; i < 200; i++) if (pickSentence(rng, l, { related: ['pond', 'pip'] }).split(' ').some((w) => w === 'pond' || w === 'pip')) hits++;
  assert.ok(hits > 100, `only ${hits} of 200 related`);
});

test('Stars: the reward table', () => {
  assert.equal(starsFor('word', false), 1);
  assert.equal(starsFor('word', true), 2);
  assert.equal(starsFor('sentence', false), 5);
  assert.equal(starsFor('sentence', true), 8);
  assert.equal(starsFor('line'), STARS.line);
  assert.equal(starsFor('finish'), 5);
});

test('Stars and the keyboard setting are saved, and old saves gain them', () => {
  assert.equal(defaultSettings().keyboard, 'show');
  const s = memoryStorage();
  const p = createProfile(1);
  p.stars = 42;
  save(p, s);
  assert.equal(load(s).profile.stars, 42);
  const old = memoryStorage();
  old.setItem(SAVE_KEY, JSON.stringify({ version: 3, active: 0, profiles: [{ id: 'g1', name: 'Zara', learner: {}, settings: { music: 0.3 } }] }));
  const { profile } = load(old);
  assert.equal(profile.stars, 0);
  assert.equal(profile.settings.keyboard, 'show');
  assert.equal(profile.settings.music, 0.3);
});
