import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  finishRun, seasonOpen, bedOpen, harvestOpen, nextBed, features, pickMystery, revealMysteries, pendingHarvest,
} from '../src/core/progress.js';
import { createProfile, save, load, listProfiles, addProfile, setActive, deleteProfile, getProfile, importProfile, SAVE_KEY, MAX_PROFILES } from '../src/ui/save.js';
import { ensureRequests, progressRequests, REQUEST_POOL } from '../src/core/requests.js';
import { relaySteps, simulateRelay } from '../src/core/relay.js';
import { createSandbox, pressSandbox, candidates } from '../src/core/sandbox.js';
import { winterize, wordPool } from '../src/core/words.js';
import { greenhouseLine } from '../src/core/greenhouse.js';
import { growOvernight } from '../src/core/growth.js';
import { mulberry32 } from '../src/core/rng.js';
import { KEY_GROUPS } from '../src/core/adaptive.js';
import { SEASONS, JOURNAL, WINTER_HARVEST } from '../src/data/seasons.js';
import { STORIES } from '../src/data/stories.js';
import { GARDEN_WORDS, SECRET_WORDS, wordKind } from '../src/data/garden-words.js';
import { BY_ID, MYSTERY_IDS, SPECIES } from '../src/data/species.js';
import { isBlockedWord } from '../src/data/words/blocklist.js';
import { plantSVG } from '../src/scene/plant-gen.js';
import { meadowArt, meadowLayout } from '../src/scene/meadow.js';
import { VISITORS, visitorArt } from '../src/scene/visitors.js';
import { visitorsFor } from '../src/core/progress.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
}

const cleanRun = (extra) => ({ wpm: 30, accuracy: 0.97, correct: 120, minutes: 1, bestChain: 12, words: 20, ...extra });

test('a scripted gardener finishes all four seasons, every festival, and the ending', () => {
  const p = createProfile(1000);
  p.placed = true;
  let day = 1000;
  for (const s of SEASONS) {
    assert.ok(seasonOpen(p, s.id), `${s.id} should be open`);
    for (let i = 0; i < 8; i++) {
      assert.ok(bedOpen(p, s.id, i), `${s.id} bed ${i}`);
      assert.deepEqual(nextBed(p), { season: s.id, bed: i });
      finishRun(p, cleanRun({ mode: 'garden', season: s.id, bed: i }), day++);
    }
    assert.ok(harvestOpen(p, s.id));
    assert.equal(pendingHarvest(p), s.id);
    const r = finishRun(p, cleanRun({ mode: 'harvest', season: s.id }), day++);
    assert.equal(r.festival, s.id);
    if (s.id === 'winter') assert.ok(r.ending);
  }
  assert.equal(p.journalPages, JOURNAL.length);
  assert.deepEqual(p.festivals, ['spring', 'summer', 'autumn', 'winter']);
  assert.ok(p.homeGarden.plants.some((x) => x.species === 'keybloom' && x.stage === 4));
  assert.equal(pendingHarvest(p), null);
});

test('later seasons stay closed until the season before is finished', () => {
  const p = createProfile(1);
  assert.ok(!seasonOpen(p, 'autumn'));
  assert.ok(!bedOpen(p, 'winter', 0));
  p.progress.spring = [1, 1, 1, 1, 1, 1, 1, 1];
  p.progress.summer = [1, 1, 1, 1, 1, 1, 1, 1];
  assert.ok(seasonOpen(p, 'autumn'));
  assert.ok(!seasonOpen(p, 'winter'));
});

test('mystery seeds are always new until the whole set is found, and reveal on bloom', () => {
  const p = createProfile(1);
  const rng = mulberry32(3);
  const seen = new Set();
  for (let i = 0; i < MYSTERY_IDS.length; i++) {
    const id = pickMystery(p, rng);
    assert.ok(!seen.has(id), `repeat ${id}`);
    seen.add(id);
    p.homeGarden.plants.push({ id: i + 1, species: id, stage: 0, lastGrownDay: 1, mystery: true });
  }
  assert.equal(seen.size, MYSTERY_IDS.length);
  assert.ok(MYSTERY_IDS.includes(pickMystery(p, rng)), 'after the set: still a mystery plant');
  for (let d = 2; d <= 6; d++) growOvernight(p.homeGarden, d);
  const revealed = revealMysteries(p);
  assert.equal(revealed.length, MYSTERY_IDS.length);
  assert.ok(MYSTERY_IDS.every((id) => p.almanac.includes(id)));
});

test('a 3-flower bed gives one mystery packet', () => {
  const p = createProfile(1);
  const r = finishRun(p, cleanRun({ mode: 'garden', season: 'spring', bed: 0, wpm: 40 }), 5);
  assert.equal(r.flowers, 3);
  assert.equal(r.mystery, 1);
  const again = finishRun(p, cleanRun({ mode: 'garden', season: 'spring', bed: 0, wpm: 40 }), 6);
  assert.equal(again.mystery, 0);
});

test("Pip's Requests: three per week, progress, rewards, no penalty", () => {
  const p = createProfile(1);
  const req = ensureRequests(p, 700, new Set());
  assert.equal(req.list.length, 3);
  assert.ok(req.list.every((r) => !REQUEST_POOL.find((x) => x.id === r.id).needs), 'only unlocked features');
  assert.equal(ensureRequests(p, 701, new Set()), req, 'same week, same requests');
  p.requests.list = [
    { id: 'water', kind: 'water', goal: 2, progress: 0, done: false, days: [] },
    { id: 'chain', kind: 'chain', goal: 10, progress: 0, done: false, days: [] },
    { id: 'lesson', kind: 'lesson', goal: 1, progress: 0, done: false, days: [] },
  ];
  progressRequests(p, { kind: 'water', day: 700 });
  progressRequests(p, { kind: 'water', day: 700 });
  assert.equal(p.requests.list[0].progress, 1, 'same day counts once');
  progressRequests(p, { kind: 'chain', amount: 7, max: true, day: 700 });
  progressRequests(p, { kind: 'chain', amount: 4, max: true, day: 700 });
  assert.equal(p.requests.list[1].progress, 7, 'chain keeps the best');
  const dewBefore = p.dewdrops;
  const r = finishRun(p, cleanRun({ mode: 'lesson' }), 701);
  assert.equal(r.requests.length, 1);
  assert.ok(p.dewdrops > dewBefore);
  progressRequests(p, { kind: 'water', day: 702 });
  const last = progressRequests(p, { kind: 'chain', amount: 12, max: true, day: 702 });
  assert.ok(last.allDone);
  ensureRequests(p, 707, new Set());
  assert.ok(p.requests.list.every((x) => !x.done), 'a new week starts fresh');
});

test('Family Relay is fair: equal-skill players win about 50/50, whatever their speed', () => {
  assert.equal(Math.round(relaySteps((20 * 5 * 30) / 60, 20)), 30);
  const rng = mulberry32(99);
  let a = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) {
    // A parent at 55 WPM against a child at 12 WPM, both typing at their usual speed.
    if (simulateRelay(rng, { trueWpm: 55, rating: 55 }, { trueWpm: 12, rating: 12 }) === 'a') a++;
  }
  assert.ok(Math.abs(a / N - 0.5) < 0.04, `parent won ${a / N}`);
  let b = 0;
  for (let i = 0; i < N; i++) if (simulateRelay(rng, { trueWpm: 12, rating: 12 }, { trueWpm: 15, rating: 12 }) === 'b') b++;
  assert.ok(b / N > 0.75, 'beating your own usual speed wins');
});

test('Garden Words matcher checks every key and plants whole words', () => {
  const sb = createSandbox(GARDEN_WORDS);
  assert.equal(pressSandbox(sb, 'f').type, 'correct');
  assert.equal(pressSandbox(sb, 'q').type, 'wrong');
  assert.equal(pressSandbox(sb, 'r').type, 'correct');
  pressSandbox(sb, 'o');
  const r = pressSandbox(sb, 'g');
  assert.deepEqual(r, { type: 'complete', word: 'frog' }, 'a word nothing longer continues plants itself');
  for (const c of 'fox') pressSandbox(sb, c);
  assert.deepEqual(pressSandbox(sb, ' '), { type: 'complete', word: 'fox' }, 'fox needs Space because of foxglove');
  for (const c of 'sun') pressSandbox(sb, c);
  assert.ok(candidates(sb).includes('sunflower'));
  assert.deepEqual(pressSandbox(sb, ' '), { type: 'complete', word: 'sun' }, 'Space plants a word that is also a prefix');
  assert.equal(pressSandbox(sb, 'Backspace').type, 'ignored');
  pressSandbox(sb, 'o');
  assert.equal(pressSandbox(sb, 'Backspace').type, 'erase');
  assert.equal(sb.buf, '');
});

test('Garden Words: 60 words, every one draws something, secrets are separate', () => {
  assert.equal(GARDEN_WORDS.length, 60);
  assert.equal(new Set(GARDEN_WORDS).size, 60);
  for (const w of GARDEN_WORDS) {
    assert.ok(wordKind(w), w);
    if (wordKind(w) !== 'magic') assert.ok(meadowArt(w).length > 20, `no art for ${w}`);
  }
  for (const s of SECRET_WORDS) assert.ok(!GARDEN_WORDS.includes(s));
  const placed = meadowLayout(GARDEN_WORDS.filter((w) => wordKind(w) !== 'magic').slice(0, 26).map((w) => ({ w })));
  assert.ok(placed.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
});

test('winter words keep their first letter and add capitals and punctuation', () => {
  const rng = mulberry32(5);
  let caps = 0, punct = 0;
  for (let i = 0; i < 2000; i++) {
    const w = winterize(rng, 'frost', 6);
    assert.equal(w[0].toLowerCase(), 'f');
    assert.match(w, /^[Ff]rost([.,?!]|'s)?$/);
    if (w[0] === 'F') caps++;
    if (w.length > 5) punct++;
  }
  assert.ok(caps > 500 && punct > 800);
  assert.equal(winterize(mulberry32(1), 'a', 0).toLowerCase(), 'a');
});

test('stories use only typeable characters, short lines, and safe words', () => {
  assert.ok(STORIES.length >= 8);
  for (const s of STORIES) {
    for (const page of s.pages) {
      for (const line of page) {
        assert.match(line, /^[A-Za-z0-9 .,!?'":;-]+$/, line);
        assert.ok(line.length <= 52, `too long (${line.length}): ${line}`);
        for (const w of line.toLowerCase().match(/[a-z]+/g)) assert.ok(!isBlockedWord(w), `${w} in ${s.id}`);
      }
    }
  }
  for (const line of WINTER_HARVEST) assert.ok(line.length <= 52);
});

test('greenhouse lines use digits and simple sums that add up', () => {
  const rng = mulberry32(8);
  for (let i = 0; i < 300; i++) {
    const line = greenhouseLine(rng, i % 3);
    assert.match(line, /^[a-z0-9 ,=+-]+$/);
    assert.match(line, /\d/);
    assert.doesNotMatch(line, /(^|\D)1 \w+s(,|$)/, `singular after 1: ${line}`);
    for (const [, a, op, b, c] of line.matchAll(/(\d+) ([+-]) (\d+) = (\d+)/g)) {
      assert.equal(op === '+' ? +a + +b : +a - +b, +c, line);
    }
  }
});

test('every species draws at every growth stage', () => {
  for (const sp of SPECIES) for (const g of [0, 0.3, 0.6, 0.85, 1]) assert.ok(plantSVG(sp, g, 3).startsWith('<g'), sp.id);
  for (const s of SEASONS) for (const b of s.beds) assert.ok(BY_ID[b.species], b.species);
});

test('autumn and winter visitors come for the right plants', () => {
  const p = createProfile(1);
  for (const v of VISITORS) assert.ok(visitorArt(v.id).length > 20, v.id);
  p.homeGarden.plants = [{ id: 1, species: 'pumpkin', stage: 4 }, { id: 2, species: 'holly', stage: 4 }];
  const v = visitorsFor(p, VISITORS);
  assert.ok(v.includes('squirrel') && v.includes('wren'));
  assert.ok(!v.includes('fox'));
});

test('features unlock with progress and explain why when locked', () => {
  const p = createProfile(1);
  let f = features(p);
  assert.ok(!f.race.open && f.race.why);
  assert.ok(!f.words.open && !f.story.open);
  p.ghost = { wpm: 20, keyTimes: [] };
  for (let i = 0; i < 5; i++) p.history.push({ acc: 0.93 });
  p.placedSeason = 'summer';
  p.learner.groupsUnlocked = KEY_GROUPS.length;
  f = features(p);
  assert.ok(f.race.open && f.words.open && f.story.open && f.greenhouse.open);
});

test('profiles: up to 4 gardeners share a save, switch, delete and import', () => {
  const s = memoryStorage();
  const a = createProfile(1);
  a.name = 'Mia';
  save(a, s);
  const b = addProfile(s);
  b.name = 'Leo';
  save(b, s);
  let list = listProfiles(s);
  assert.equal(list.profiles.length, 2);
  assert.equal(list.active, b.id);
  setActive(a.id, s);
  assert.equal(load(s).profile.name, 'Mia');
  addProfile(s);
  addProfile(s);
  assert.equal(addProfile(s), null, `at most ${MAX_PROFILES}`);
  setActive(a.id, s);
  deleteProfile(b.id, s);
  assert.equal(listProfiles(s).profiles.length, 3);
  assert.equal(load(s).profile.name, 'Mia', 'active stays the same after deleting someone else');
  importProfile(a.id, { profile: { ...a, name: 'Mia again', dewdrops: 99 } }, s);
  assert.equal(getProfile(a.id, s).dewdrops, 99);
  assert.throws(() => importProfile(a.id, { hello: 1 }, s));
});

test('v2 single-profile saves become the first of the profiles', () => {
  const s = memoryStorage();
  s.setItem(SAVE_KEY, JSON.stringify({ version: 2, profile: { name: 'Ava', dewdrops: 7, learner: { groupsUnlocked: 2 } } }));
  const { profile, status } = load(s);
  assert.equal(status, 'loaded');
  assert.equal(profile.name, 'Ava');
  assert.ok(profile.id);
  assert.deepEqual(profile.festivals, []);
  assert.deepEqual(profile.progress.autumn, []);
  profile.dewdrops = 50;
  save(profile, s);
  const again = load(s).profile;
  assert.equal(listProfiles(s).profiles.length, 1, 'saving an upgraded profile must not duplicate it');
  assert.equal(again.dewdrops, 50);
  assert.equal(again.id, profile.id);
});

test('every bed has enough real words at the keys a child is likely to have', () => {
  // By Autumn a child has at least the top row; there must be plenty to plant.
  assert.ok(wordPool(KEY_GROUPS.slice(0, 7).flat()).length > 300);
});
