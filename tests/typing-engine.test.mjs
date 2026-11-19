import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLine, pressLine, createField, addTarget, pressField, normalizeKey } from '../src/core/typing-engine.js';

test('line: wrong key never advances in strict mode', () => {
  const l = createLine('fad');
  assert.equal(pressLine(l, 'f').type, 'correct');
  assert.equal(pressLine(l, 'x').type, 'wrong');
  assert.equal(l.pos, 1);
  assert.equal(pressLine(l, 'a').type, 'correct');
  assert.equal(pressLine(l, 'd').type, 'complete');
  assert.equal(pressLine(l, 'd').type, 'ignored');
});

test('line: Story mode typos must be erased with Backspace', () => {
  const l = createLine('sun', { fixTypos: true });
  pressLine(l, 's');
  assert.equal(pressLine(l, 'x').type, 'wrong');
  assert.equal(pressLine(l, 'u').type, 'wrong', 'still off track until the typo is erased');
  assert.equal(l.typos, 'xu');
  pressLine(l, 'Backspace');
  pressLine(l, 'Backspace');
  assert.equal(l.typos, '');
  assert.equal(pressLine(l, 'u').type, 'correct');
  assert.equal(pressLine(l, 'n').type, 'complete');
});

test('field: first letter locks a target, Backspace releases it', () => {
  const f = createField();
  addTarget(f, 'seed');
  addTarget(f, 'leaf');
  const r = pressField(f, 'l');
  assert.equal(r.type, 'correct');
  assert.equal(f.locked.text, 'leaf');
  assert.equal(pressField(f, 's').type, 'wrong', 'locked target ignores other words');
  assert.equal(pressField(f, 'Backspace').type, 'release');
  assert.equal(f.locked, null);
  for (const c of 'see') pressField(f, c);
  assert.equal(pressField(f, 'd').type, 'complete');
  assert.equal(f.targets.length, 1);
});

test('field: a key matching no word is a wrong press with no target', () => {
  const f = createField();
  addTarget(f, 'dew');
  const r = pressField(f, 'q');
  assert.equal(r.type, 'wrong');
  assert.equal(r.target, null);
});

test('normalizeKey ignores key repeat, modifiers, IME and named keys', () => {
  assert.equal(normalizeKey({ key: 'a', repeat: true }), null);
  assert.equal(normalizeKey({ key: 'a', ctrlKey: true }), null);
  assert.equal(normalizeKey({ key: 'a', isComposing: true }), null);
  assert.equal(normalizeKey({ key: 'Shift' }), null);
  assert.equal(normalizeKey({ key: 'Backspace' }), 'Backspace');
  assert.equal(normalizeKey({ key: 'A' }), 'A');
});
