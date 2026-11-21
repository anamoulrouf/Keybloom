import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NAMES, NAME_LESSONS, nameLesson, nameLine } from '../src/data/islamic/names.js';
import { SURAHS, typed } from '../src/data/islamic/quran.js';
import { DUAS, normalize } from '../src/data/islamic/duas.js';
import { wrapText } from '../src/core/wrap.js';
import { createProfile, save, load, SAVE_KEY } from '../src/ui/save.js';
import { finishRun, features } from '../src/core/progress.js';
import { KEY_GROUPS } from '../src/core/adaptive.js';

// Everything a child types must be on the keyboard (letters, digits, Shift symbols we teach).
const TYPEABLE = /^[A-Za-z0-9 .,!?'":;()-]+$/;
const lines = (text) => wrapText(text, 48);

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('99 Names: numbered 1–99 in order, complete, unique and typeable', () => {
  assert.equal(NAMES.length, 99);
  NAMES.forEach((x, i) => {
    assert.equal(x.n, i + 1);
    assert.ok(x.ar && x.tr && x.en, `name ${x.n} incomplete`);
    assert.match(x.ar, /^[؀-ۿ\s]+$/, `name ${x.n}: Arabic only`);
    assert.match(nameLine(x), TYPEABLE, nameLine(x));
    for (const l of lines(nameLine(x))) assert.ok(l.length <= 48, l);
  });
  assert.equal(new Set(NAMES.map((x) => x.tr)).size, 99, 'no duplicate transliterations');
  assert.equal(NAME_LESSONS, 20);
  assert.equal(nameLesson(19).length, 4);
  assert.equal(NAMES[0].tr, 'Ar-Rahman');
  assert.equal(NAMES[98].tr, 'As-Sabur');
});

test('Quran: Al-Fatiha and 105–114 with matching Arabic and English verse counts', () => {
  const expected = { 1: 7, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3, 111: 5, 112: 4, 113: 5, 114: 6 };
  assert.deepEqual(SURAHS.map((s) => s.n), Object.keys(expected).map(Number).sort((a, b) => a - b));
  for (const s of SURAHS) {
    assert.equal(s.verses.length, expected[s.n], s.name);
    for (const v of s.verses) {
      assert.match(v.ar, /[؀-ۿ]/);
      assert.ok(v.en.length > 5);
    }
  }
  assert.equal(SURAHS[0].verses[0].en, 'In the name of Allāh, the Entirely Merciful, the Especially Merciful.', 'English kept exactly as provided');
});

test('Quran: the typed version changes only ā ū ḥ and brackets', () => {
  for (const s of SURAHS) {
    for (const v of s.verses) {
      const t = typed(v.en);
      assert.match(t, TYPEABLE, t);
      assert.doesNotMatch(t, /[āūḥ[\]]/);
      const undo = v.en.replace(/ā/g, 'a').replace(/ū/g, 'u').replace(/ḥ/g, 'h').replace(/[[\]]/g, '').trim();
      assert.equal(t, undo, 'nothing else changed');
      for (const l of lines(t)) assert.ok(l.length <= 48, l);
    }
  }
  assert.equal(typed('Their accustomed security [in] the caravan'), 'Their accustomed security in the caravan');
  assert.equal(typed('O Muḥammad'), 'O Muhammad');
});

test('Supplications: 29 duas in parts, typeable, wording kept', () => {
  assert.equal(DUAS.length, 29);
  DUAS.forEach((d, i) => {
    assert.equal(d.id, i + 1);
    assert.ok(d.parts.length >= 1, d.title);
    for (const p of d.parts) {
      assert.match(p, TYPEABLE, `${d.id}: ${p.slice(0, 40)}`);
      for (const l of lines(p)) assert.ok(l.length <= 48, l);
    }
  });
  assert.equal(DUAS[20].title, 'Faith Feels Weak');
  assert.equal(DUAS[24].title, 'Received More Than Earned');
  assert.ok(DUAS[0].parts[0].startsWith('Ya Rahman, From Your Throne, You wrote mercy upon Yourself.'));
  assert.ok(DUAS[0].parts[2].startsWith("Ya Ra'uf, Cover me from storms I don't see coming."));
  assert.ok(DUAS[28].parts.at(-1).endsWith('to You all praise is due. Ameen.'));
  assert.equal(normalize('Ya Ra’uf,  “Thank You.” — yes'), 'Ya Ra\'uf, "Thank You." - yes');
});

test('wrapText never breaks a word and keeps every word in order', () => {
  const text = 'Let every blessing You bestow lead me back to its source You, and only You. Ameen.';
  const out = wrapText(text, 20);
  assert.equal(out.join(' '), text);
  assert.ok(out.every((l) => l.length <= 20));
  assert.deepEqual(wrapText('one', 48), ['one']);
});

test('Islamic Life is open from the start and records progress per track', () => {
  const p = createProfile(1);
  assert.ok(features(p).islamic.open);
  const run = { mode: 'islamic', wpm: 15, accuracy: 0.96, correct: 200, minutes: 3 };
  finishRun(p, { ...run, track: 'names', lesson: 0 }, 10);
  finishRun(p, { ...run, track: 'quran', lesson: 112 }, 10);
  const r1 = finishRun(p, { ...run, track: 'duas', lesson: 15, part: 0, parts: 2 }, 10);
  assert.equal(r1.islamic.done, false);
  const r2 = finishRun(p, { ...run, track: 'duas', lesson: 15, part: 1, parts: 2 }, 10);
  assert.equal(r2.islamic.done, true);
  assert.deepEqual(p.islamic, { names: [0], quran: { 112: true }, duas: { 15: 2 } });
  assert.ok(p.dewdrops > 0);
  assert.equal(p.history.at(-1).mode, 'islamic');
});

test('older saves gain Islamic Life progress', () => {
  const s = memoryStorage();
  s.setItem(SAVE_KEY, JSON.stringify({ version: 3, active: 0, profiles: [{ id: 'g1', name: 'Amina', learner: {} }] }));
  const { profile } = load(s);
  assert.deepEqual(profile.islamic, { names: [], quran: {}, duas: {} });
  save(profile, s);
});
