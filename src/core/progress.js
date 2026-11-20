// Applying a finished run to the profile: learner targets and hints, key unlocks, history,
// dewdrops, flowers, journal pages, home-garden seeds, mystery seeds, Pip's Requests, races,
// stories, festivals and the Almanac. Pure data (testable).
import { applyRun, maybeUnlock, KEY_GROUPS } from './adaptive.js';
import { dewdropsFor, flowersFor } from './rewards.js';
import { plantSeed, MAX_STAGE } from './growth.js';
import { ensureRequests, progressRequests, REQUEST_DEW } from './requests.js';
import { mulberry32 } from './rng.js';
import { SEASONS, JOURNAL } from '../data/seasons.js';
import { BY_ID, MYSTERY_IDS } from '../data/species.js';
import { markDone } from '../ui/save.js';

export const SEASON_ORDER = SEASONS.map((s) => s.id);
export const FESTIVAL_DEW = 60;
export const RACE_UNLOCK_RUNS = 5;

export function seasonById(id) {
  return SEASONS.find((s) => s.id === id);
}

export function seasonOpen(profile, seasonId) {
  const i = SEASON_ORDER.indexOf(seasonId);
  if (i < 0) return false;
  if (i === 0) return true;
  if (seasonId === 'summer' && profile.placedSeason === 'summer') return true;
  const prev = SEASON_ORDER[i - 1];
  return seasonOpen(profile, prev) && (profile.progress[prev] || [])[7] > 0;
}

/** Bed i is open when its season is open and it is the first bed or the one before has flowers. */
export function bedOpen(profile, seasonId, i) {
  const season = seasonById(seasonId);
  if (!season || !season.open || !seasonOpen(profile, seasonId)) return false;
  return i === 0 || (profile.progress[seasonId] || [])[i - 1] > 0;
}

/** The Giant Harvest opens once the season's last bed is finished. */
export function harvestOpen(profile, seasonId) {
  return (profile.progress[seasonId] || [])[7] > 0;
}

/** The next bed to suggest on Today's Path. */
export function nextBed(profile) {
  for (const s of SEASONS) {
    if (!s.open || !seasonOpen(profile, s.id)) continue;
    const prog = profile.progress[s.id] || [];
    for (let i = 0; i < s.beds.length; i++) if (!(prog[i] > 0)) return { season: s.id, bed: i };
  }
  const last = SEASONS.filter((s) => s.open && seasonOpen(profile, s.id)).pop();
  return { season: last.id, bed: last.beds.length - 1 };
}

/** The next unfinished Giant Harvest, if any. */
export function pendingHarvest(profile) {
  return SEASON_ORDER.find((id) => harvestOpen(profile, id) && !profile.festivals.includes(id)) || null;
}

export const allLetters = (profile) => profile.learner.groupsUnlocked >= KEY_GROUPS.length;

/** Which extra modes are open, with a friendly reason when they are not. */
export function features(profile) {
  const recent = profile.history.slice(-RACE_UNLOCK_RUNS);
  const steady = recent.length >= RACE_UNLOCK_RUNS && recent.reduce((a, h) => a + h.acc, 0) / recent.length >= 0.9;
  const f = {
    race: { open: !!profile.ghost && steady, why: !profile.ghost ? 'Plant a bed in Garden Play first, so the bee has your run to copy.' : 'Opens when your last 5 runs average 90% accuracy.' },
    relay: { open: !!profile.placed, why: 'Finish the Seed Test first.' },
    words: { open: seasonOpen(profile, 'summer'), why: 'Opens in Summer.' },
    story: { open: allLetters(profile) || seasonOpen(profile, 'winter'), why: 'Opens when you have every letter.' },
    greenhouse: { open: allLetters(profile), why: 'Opens when you have every letter.' },
    islamic: { open: allLetters(profile), why: 'Opens when you have every letter.' },
  };
  return f;
}

export function featureSet(profile) {
  const f = features(profile);
  return new Set(Object.keys(f).filter((k) => f[k].open));
}

/** A mystery species that is new to this gardener (or any, once the whole set is found). */
export function pickMystery(profile, rng) {
  const planted = new Set(profile.homeGarden.plants.filter((p) => p.mystery).map((p) => p.species));
  const fresh = MYSTERY_IDS.filter((id) => !profile.almanac.includes(id) && !planted.has(id));
  const pool = fresh.length ? fresh : MYSTERY_IDS;
  return pool[Math.floor(rng() * pool.length)];
}

function giveMystery(profile, today, report, rng) {
  const id = pickMystery(profile, rng);
  plantSeed(profile.homeGarden, id, today, { mystery: true });
  report.mystery = (report.mystery || 0) + 1;
}

/** Mystery plants that bloomed: they join the Almanac and stop being a mystery. */
export function revealMysteries(profile) {
  const out = [];
  for (const p of profile.homeGarden.plants) {
    if (p.mystery && p.stage >= MAX_STAGE) {
      p.mystery = false;
      if (!profile.almanac.includes(p.species)) profile.almanac.push(p.species);
      out.push(p.species);
    }
  }
  return out;
}

/** Counts an outside event (a new visitor) toward Pip's Requests. Returns dewdrops earned. */
export function requestEvent(profile, event, today) {
  ensureRequests(profile, today, featureSet(profile));
  const r = progressRequests(profile, { ...event, day: today });
  let dew = r.done.length * REQUEST_DEW;
  profile.dewdrops += dew;
  if (r.allDone) giveMystery(profile, today, {}, mulberry32(today * 31 + 7));
  return { ...r, dew };
}

/**
 * run: { mode, wpm, accuracy, correct, minutes, season?, bed?, golden?, bestChain?, words?,
 *        bonusDew?, won?, story?, pages?, placed?, festival? }
 * Returns a report the results screen can show.
 */
export function finishRun(profile, run, today, rng = mulberry32((today * 9973 + profile.history.length) >>> 0)) {
  const report = {
    dew: 0, flowers: 0, unlocked: null, target: 0, hint: 0, best: false, page: null, planted: [],
    firstBedClear: false, mystery: 0, requests: [], requestsAll: false, race: null, festival: null, ending: false,
  };
  const learner = profile.learner;
  const practice = run.mode !== 'relay-guest';
  const changes = practice ? applyRun(learner, run) : { target: 0, hint: 0 };
  report.target = changes.target;
  report.hint = changes.hint;
  report.unlocked = practice ? maybeUnlock(learner) : null;
  report.dew = dewdropsFor(run.correct || 0, run.accuracy ?? 1) + Math.round(run.bonusDew || 0);
  if (run.wpm > profile.bestWpm && run.correct >= 40 && run.mode !== 'greenhouse') {
    report.best = profile.bestWpm > 0;
    profile.bestWpm = Math.round(run.wpm * 10) / 10;
  }
  profile.history.push({ day: today, mode: run.mode, wpm: Math.round((run.wpm || 0) * 10) / 10, acc: Math.round((run.accuracy ?? 1) * 1000) / 1000, mins: Math.round((run.minutes || 0) * 10) / 10 });

  ensureRequests(profile, today, featureSet(profile));
  const events = [];

  if (run.mode === 'garden' && run.season != null) {
    const prog = (profile.progress[run.season] ||= []);
    const before = prog[run.bed] || 0;
    report.flowers = flowersFor({ accuracy: run.accuracy, wpm: run.wpm, targetWpm: learner.targetWpm - changes.target });
    prog[run.bed] = Math.max(before, report.flowers);
    if (!before) {
      report.firstBedClear = true;
      const season = seasonById(run.season);
      const species = season.beds[run.bed].species;
      plantSeed(profile.homeGarden, species, today);
      report.planted.push(species);
      if (profile.journalPages < JOURNAL.length) {
        report.page = profile.journalPages;
        profile.journalPages++;
      }
    }
    // A bed's first 3-flower result earns a mystery seed packet.
    if (report.flowers === 3 && before < 3) giveMystery(profile, today, report, rng);
    if (run.accuracy >= 0.95) events.push({ kind: 'cleanWords', amount: run.words || 0 });
    events.push({ kind: 'chain', amount: run.bestChain || 0, max: true });
    if (report.flowers === 3) events.push({ kind: 'threeFlowers' });
    markDone(profile, 'play', today);
  }
  if (run.golden) {
    plantSeed(profile.homeGarden, run.golden, today);
    report.planted.push(run.golden);
  }
  if (run.mode === 'race') {
    profile.races.run++;
    report.race = { won: !!run.won };
    if (run.won) {
      profile.races.won++;
      if (changes.target <= 0) {
        learner.targetWpm += 1;
        report.target = 1;
      }
    }
    events.push({ kind: 'race' });
    markDone(profile, 'play', today);
  }
  if (run.mode === 'story' && run.story) {
    const pages = run.pages || 0;
    profile.stories[run.story] = Math.max(profile.stories[run.story] || 0, run.pageReached || pages);
    profile.storyPages += pages;
    report.story = { pages, total: profile.storyPages };
    if (pages) events.push({ kind: 'story', amount: pages });
  }
  if (run.mode === 'words' && run.placed) events.push({ kind: 'words', amount: run.placed });
  if (run.mode === 'greenhouse') {
    profile.greenhouseRuns++;
    events.push({ kind: 'greenhouse' });
  }
  if (run.mode === 'harvest' && run.season && !profile.festivals.includes(run.season)) {
    profile.festivals.push(run.season);
    report.festival = run.season;
    report.dew += FESTIVAL_DEW;
    if (run.season === 'winter') {
      plantSeed(profile.homeGarden, 'keybloom', today, { stage: MAX_STAGE });
      report.planted.push('keybloom');
      report.ending = true;
    }
  }
  if (run.mode === 'islamic') report.islamic = recordIslamic(profile, run);
  if (run.mode === 'path') markDone(profile, 'path', today);
  if (run.mode === 'lesson') {
    markDone(profile, 'lesson', today);
    events.push({ kind: 'lesson' });
  }
  if (run.mode === 'daily') {
    markDone(profile, 'water', today);
    events.push({ kind: 'water' });
  }

  for (const e of events) {
    const r = progressRequests(profile, { ...e, day: today });
    report.requests.push(...r.done);
    if (r.allDone) {
      report.requestsAll = true;
      giveMystery(profile, today, report, rng);
    }
  }
  report.dew += report.requests.length * REQUEST_DEW;
  profile.dewdrops += report.dew;
  for (const id of report.planted) if (!profile.almanac.includes(id)) profile.almanac.push(id);
  return report;
}

/**
 * Islamic Life progress. run.track: 'names' (run.lesson = group index), 'quran' (run.lesson = surah
 * number) or 'duas' (run.lesson = dua id, run.part = part index, run.parts = how many parts).
 * Returns { track, lesson, done } where done is true when the lesson (or the whole dua) is complete.
 */
export function recordIslamic(profile, run) {
  const s = (profile.islamic ||= { names: [], quran: {}, duas: {} });
  const out = { track: run.track, lesson: run.lesson, done: true };
  if (run.track === 'names' && !s.names.includes(run.lesson)) s.names.push(run.lesson);
  if (run.track === 'quran') s.quran[run.lesson] = true;
  if (run.track === 'duas') {
    s.duas[run.lesson] = Math.max(s.duas[run.lesson] || 0, (run.part ?? 0) + 1);
    out.done = s.duas[run.lesson] >= run.parts;
  }
  return out;
}

/** Which visitors the home garden attracts right now. */
export function visitorsFor(profile, VISITORS) {
  const plants = profile.homeGarden.plants.map((p) => ({ ...p, tags: p.mystery ? [] : (BY_ID[p.species] || { tags: [] }).tags }));
  return VISITORS.filter((v) => v.needs(plants, profile)).map((v) => v.id);
}
