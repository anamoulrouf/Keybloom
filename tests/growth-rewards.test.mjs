import { test } from 'node:test';
import assert from 'node:assert/strict';
import { growOvernight, plantSeed, MAX_STAGE } from '../src/core/growth.js';
import { dewdropsFor, flowersFor } from '../src/core/rewards.js';

test('plants grow one stage per new day, never more, never backwards', () => {
  const g = { plants: [] };
  plantSeed(g, 'daisy', 100);
  assert.equal(growOvernight(g, 100).length, 0, 'not the same day');
  assert.equal(growOvernight(g, 105).length, 1);
  assert.equal(g.plants[0].stage, 1);
  assert.equal(growOvernight(g, 105).length, 0, 'once per day');
  assert.equal(growOvernight(g, 90).length, 0, 'clock moved back: ignored');
  for (let d = 106; d < 120; d++) growOvernight(g, d);
  assert.equal(g.plants[0].stage, MAX_STAGE);
});

test('dewdrops favour accuracy over speed', () => {
  assert.ok(dewdropsFor(100, 0.97) > dewdropsFor(100, 0.9));
  assert.ok(dewdropsFor(100, 0.9) > dewdropsFor(150, 0.7));
});

test('flowers: 3 needs accuracy and target speed, 2 needs accuracy, finishing always gets 1', () => {
  assert.equal(flowersFor({ accuracy: 0.96, wpm: 12, targetWpm: 10 }), 3);
  assert.equal(flowersFor({ accuracy: 0.96, wpm: 8, targetWpm: 10 }), 2);
  assert.equal(flowersFor({ accuracy: 0.91, wpm: 30, targetWpm: 10 }), 2);
  assert.equal(flowersFor({ accuracy: 0.5, wpm: 3, targetWpm: 10 }), 1);
});
