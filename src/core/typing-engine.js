// Keystroke matching. Two shapes:
//  • Line: one piece of text typed left to right (lessons, warm-ups, stories).
//      strict (default): a wrong key never advances; nothing to erase.
//      fixTypos (Story Seeds): wrong keys are shown and must be removed with Backspace.
//  • Field: several floating words (Garden Play). The first correct letter locks a word;
//      Backspace releases the lock. Spawners keep first letters unique so targeting is never ambiguous.

/** Normalises a KeyboardEvent-like {key} into a typed character, 'Backspace', or null (ignore). */
export function normalizeKey(ev) {
  if (!ev || ev.repeat || ev.isComposing) return null;
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return null;
  if (ev.key === 'Backspace') return 'Backspace';
  if (typeof ev.key === 'string' && ev.key.length === 1) return ev.key;
  return null;
}

export function createLine(text, { fixTypos = false } = {}) {
  return { text, pos: 0, typos: '', fixTypos, done: text.length === 0 };
}

/** Returns { type: 'correct'|'wrong'|'complete'|'erase'|'ignored', expected } */
export function pressLine(line, key) {
  if (line.done || key == null) return { type: 'ignored' };
  const expected = line.text[line.pos];
  if (key === 'Backspace') {
    if (line.typos.length) {
      line.typos = line.typos.slice(0, -1);
      return { type: 'erase', expected };
    }
    return { type: 'ignored', expected };
  }
  if (line.fixTypos && line.typos.length) {
    // Already off track: everything typed is a typo until it is erased (max 8 shown).
    if (line.typos.length < 8) line.typos += key;
    return { type: 'wrong', expected };
  }
  if (key === expected) {
    line.pos++;
    if (line.pos >= line.text.length) {
      line.done = true;
      return { type: 'complete', expected };
    }
    return { type: 'correct', expected };
  }
  if (line.fixTypos) line.typos += key;
  return { type: 'wrong', expected };
}

export function createField() {
  return { targets: [], locked: null, nextId: 1 };
}

export function addTarget(field, text, extra = {}) {
  const t = { id: field.nextId++, text, pos: 0, ...extra };
  field.targets.push(t);
  return t;
}

export function removeTarget(field, id) {
  field.targets = field.targets.filter((t) => t.id !== id);
  if (field.locked && field.locked.id === id) field.locked = null;
}

export function firstLetters(field) {
  return new Set(field.targets.map((t) => t.text[0]));
}

/** Returns { type: 'correct'|'wrong'|'complete'|'release'|'ignored', target, expected } */
export function pressField(field, key) {
  if (key == null) return { type: 'ignored' };
  if (key === 'Backspace') {
    if (!field.locked) return { type: 'ignored' };
    const target = field.locked;
    target.pos = 0;
    field.locked = null;
    return { type: 'release', target };
  }
  if (!field.locked) {
    const target = field.targets.find((t) => t.text[0] === key);
    if (!target) return { type: 'wrong', target: null, expected: null };
    field.locked = target;
    target.pos = 1;
    if (target.pos >= target.text.length) return finish(field, target, key);
    return { type: 'correct', target, expected: key };
  }
  const target = field.locked;
  const expected = target.text[target.pos];
  if (key !== expected) return { type: 'wrong', target, expected };
  target.pos++;
  if (target.pos >= target.text.length) return finish(field, target, expected);
  return { type: 'correct', target, expected };
}

function finish(field, target, expected) {
  removeTarget(field, target.id);
  return { type: 'complete', target, expected };
}
