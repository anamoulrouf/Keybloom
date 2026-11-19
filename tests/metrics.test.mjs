import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMetrics, recordKey, pauseMetrics, wpm, accuracy, GAP_CAP_MS } from '../src/core/metrics.js';

test('WPM is (correct chars / 5) per active minute', () => {
  const m = createMetrics();
  // 61 correct keys, 200 ms apart → 60 gaps × 200 ms = 12 s active → 61/5 per 0.2 min = 61 WPM
  for (let i = 0; i <= 60; i++) recordKey(m, true, i * 200);
  assert.equal(Math.round(wpm(m)), 61);
});

test('idle gaps are capped at 2 s so drifting never lowers speed', () => {
  const m = createMetrics();
  recordKey(m, true, 0);
  recordKey(m, true, 60_000); // a whole minute of looking at the garden
  assert.equal(m.activeMs, GAP_CAP_MS);
});

test('paused time is not counted', () => {
  const m = createMetrics();
  recordKey(m, true, 0);
  pauseMetrics(m);
  recordKey(m, true, 1500);
  assert.equal(m.activeMs, 0);
});

test('accuracy counts every keystroke', () => {
  const m = createMetrics();
  for (let i = 0; i < 9; i++) recordKey(m, true, i * 300);
  recordKey(m, false, 3000);
  assert.equal(accuracy(m), 0.9);
});
