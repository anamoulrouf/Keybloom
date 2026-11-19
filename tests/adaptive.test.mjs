import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLearner, recordKeystroke, maybeUnlock, unlockedKeys, applyRun, keyWeakness,
  placementFrom, convertGroupsFromV1, KEY_GROUPS, HINT_FULL, HINT_NEXT, HINT_HIDDEN, UNLOCK_WINDOW,
} from '../src/core/adaptive.js';

function practise(l, key, n, correctEvery = 1, ms = 600) {
  for (let i = 0; i < n; i++) recordKeystroke(l, key, i % correctEvery === 0, ms);
}

test('starts with the home keys a s d f l', () => {
  assert.deepEqual(unlockedKeys(createLearner()), ['a', 's', 'd', 'f', 'l']);
});

test('unlocks the next group only when every key is accurate and quick', () => {
  const l = createLearner();
  for (const k of ['a', 's', 'd', 'l']) practise(l, k, UNLOCK_WINDOW);
  assert.equal(maybeUnlock(l), null, 'f not practised yet');
  practise(l, 'f', UNLOCK_WINDOW, 2); // 50% accuracy
  assert.equal(maybeUnlock(l), null, 'f not accurate enough');
  practise(l, 'f', UNLOCK_WINDOW);
  assert.deepEqual(maybeUnlock(l), ['g', 'h', 'k']);
});

test('slow keys block unlocking even when accurate', () => {
  const l = createLearner();
  for (const k of ['a', 's', 'd', 'f', 'l']) practise(l, k, UNLOCK_WINDOW, 1, 2000);
  assert.equal(maybeUnlock(l), null);
});

test('v1 saves keep the keys the child already had', () => {
  assert.equal(convertGroupsFromV1(1), 1);  // f j → a s d f l (start)
  assert.equal(convertGroupsFromV1(4), 1);  // f j d k s l a ; → a s d f l
  assert.equal(convertGroupsFromV1(5), 2);  // + g h → whole Spring
  assert.equal(convertGroupsFromV1(10), 7); // whole top row → through j p
  assert.equal(convertGroupsFromV1(14), KEY_GROUPS.length);
});

test('weak keys weigh more than strong keys', () => {
  const l = createLearner();
  practise(l, 'f', 30);
  practise(l, 'd', 30, 3);
  assert.ok(keyWeakness(l, 'd') > keyWeakness(l, 'f'));
});

test('target rises only after 3 runs in a row at ≥92% accuracy', () => {
  const l = createLearner();
  const start = l.targetWpm;
  applyRun(l, { wpm: 9, accuracy: 0.95 });
  applyRun(l, { wpm: 9, accuracy: 0.95 });
  assert.equal(l.targetWpm, start);
  applyRun(l, { wpm: 9, accuracy: 0.95 });
  assert.equal(l.targetWpm, start + 1);
});

test('a fast but sloppy run never raises the target', () => {
  const l = createLearner();
  for (let i = 0; i < 6; i++) applyRun(l, { wpm: 40, accuracy: 0.88 });
  assert.equal(l.targetWpm, 8);
});

test('target eases off quietly below 85% accuracy, never under the minimum', () => {
  const l = createLearner();
  for (let i = 0; i < 10; i++) applyRun(l, { wpm: 5, accuracy: 0.7 });
  assert.equal(l.targetWpm, 6);
});

test('hints fade after strong runs and return on struggle', () => {
  const l = createLearner();
  assert.equal(l.hintStage, HINT_FULL);
  applyRun(l, { wpm: 8, accuracy: 0.97 });
  applyRun(l, { wpm: 8, accuracy: 0.97 });
  assert.equal(l.hintStage, HINT_NEXT);
  applyRun(l, { wpm: 8, accuracy: 0.97 });
  applyRun(l, { wpm: 8, accuracy: 0.97 });
  assert.equal(l.hintStage, HINT_HIDDEN);
  applyRun(l, { wpm: 8, accuracy: 0.7 });
  assert.equal(l.hintStage, HINT_NEXT);
});

test('placement: beginners start at a s d f, confident typers skip ahead', () => {
  const a = createLearner();
  assert.equal(placementFrom(a, { skipped: true }), 'spring');
  assert.equal(a.groupsUnlocked, 1);
  const b = createLearner();
  assert.equal(placementFrom(b, { wpm: 18, accuracy: 0.93 }), 'summer');
  assert.ok(unlockedKeys(b).includes('p'));
  assert.equal(b.targetWpm, 18);
});
