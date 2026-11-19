import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, save, createProfile, SAVE_KEY, markDone } from '../src/ui/save.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
}

test('progress survives a save and reload', () => {
  const s = memoryStorage();
  const p = createProfile(100);
  p.name = 'Mia';
  p.dewdrops = 42;
  p.learner.groupsUnlocked = 4;
  save(p, s);
  const { profile, status } = load(s);
  assert.equal(status, 'loaded');
  assert.equal(profile.name, 'Mia');
  assert.equal(profile.dewdrops, 42);
  assert.equal(profile.learner.groupsUnlocked, 4);
});

test('a corrupted save falls back safely and keeps a backup', () => {
  const s = memoryStorage();
  s.setItem(SAVE_KEY, '{not json');
  const { profile, status } = load(s);
  assert.equal(status, 'recovered');
  assert.equal(profile.onboarded, false);
  assert.equal(s.getItem(SAVE_KEY + '.broken'), '{not json');
});

test('older saves gain new fields with defaults', () => {
  const s = memoryStorage();
  s.setItem(SAVE_KEY, JSON.stringify({ version: 1, profile: { name: 'Leo', settings: { music: 0.2 } } }));
  const { profile } = load(s);
  assert.equal(profile.settings.music, 0.2);
  assert.equal(profile.settings.pace, 'normal');
  assert.ok(profile.homeGarden.plants);
});

test('storage errors never crash the game', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
  assert.equal(load(broken).status, 'recovered');
  assert.equal(save(createProfile(), broken), false);
});

test('day streak grows on consecutive days and restarts gently', () => {
  const p = createProfile(10);
  markDone(p, 'water', 10);
  markDone(p, 'play', 10);
  markDone(p, 'water', 11);
  assert.equal(p.streak.count, 2);
  markDone(p, 'water', 15);
  assert.equal(p.streak.count, 1);
});

test('v1 saves are converted to the real-words key order', () => {
  const s = memoryStorage();
  s.setItem(SAVE_KEY, JSON.stringify({ version: 1, profile: { name: 'Ava', learner: { groupsUnlocked: 5 }, lessonsIntroduced: [0, 1, 2, 3, 4] } }));
  const { profile } = load(s);
  assert.equal(profile.learner.groupsUnlocked, 2); // whole home row: a s d f l, g h k
  assert.deepEqual(profile.lessonsIntroduced, [0, 1]);
});
