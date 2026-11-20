// Saving: one versioned record in localStorage holding up to 4 gardener profiles (siblings can
// share a computer). Corrupt or unreadable saves fall back to a fresh profile (the broken copy is
// kept under a backup key so a parent could recover it). Nothing ever leaves the device.
import { createLearner, convertGroupsFromV1 } from '../core/adaptive.js';
import { dayNumber } from '../core/growth.js';

export const SAVE_KEY = 'keybloom.save';
export const SAVE_VERSION = 3;
export const MAX_PROFILES = 4;
const HISTORY_CAP = 365;

export function defaultSettings() {
  return {
    master: 0.8, music: 0.5, sfx: 0.7, nature: 0.45, natureOn: true, muted: false,
    font: 'atkinson', textSize: 1, reducedMotion: null, pace: 'normal', breakMins: 20, keyboard: 'show',
  };
}

const newId = () => 'g' + Math.random().toString(36).slice(2, 9);

export function createProfile(today = dayNumber()) {
  return {
    id: newId(),
    name: '', garden: '', createdDay: today, scarf: '#7FB3D5',
    onboarded: false, placed: false,
    settings: defaultSettings(),
    learner: createLearner(),
    progress: { spring: [], summer: [], autumn: [], winter: [] },
    dewdrops: 0,
    stars: 0,
    homeGarden: { plants: [], nextId: 0 },
    decor: [],
    meadow: [],
    visitorsSeen: [],
    almanac: [],
    journalPages: 0,
    history: [],
    today: { day: today, done: {}, playMs: 0 },
    streak: { lastDay: null, count: 0 },
    bestWpm: 0,
    ghost: null,
    lessonsIntroduced: [],
    requests: null,
    stories: {},
    storyPages: 0,
    festivals: [],
    endingSeen: false,
    eventMs: 0,
    greenhouseRuns: 0,
    secretsFound: [],
    notes: [],
    races: { won: 0, run: 0 },
    islamic: { names: [], quran: {}, duas: {} },
  };
}

/** Brings one stored profile up to date (fills new fields with defaults). */
export function upgradeProfile(raw) {
  const fresh = createProfile();
  const p = { ...fresh, ...raw };
  p.settings = { ...fresh.settings, ...(raw.settings || {}) };
  p.learner = { ...fresh.learner, ...(raw.learner || {}) };
  p.progress = { ...fresh.progress, ...(raw.progress || {}) };
  p.islamic = { ...fresh.islamic, ...(raw.islamic || {}) };
  if (!raw.id) p.id = newId();
  return p;
}

/** Any older save → { version, active, profiles }. Throws if it cannot be read. */
export function migrate(data) {
  if (!data || typeof data !== 'object') throw new Error('no save');
  if (data.version > SAVE_VERSION) throw new Error('save from a newer version');
  if (data.version === 1 && data.profile) {
    // v2 reordered the key groups so every stage uses real words. Keep the keys a child had.
    const prof = data.profile;
    if (prof.learner && prof.learner.groupsUnlocked) {
      const n = convertGroupsFromV1(prof.learner.groupsUnlocked);
      const introduced = (prof.lessonsIntroduced || []).length;
      prof.learner.groupsUnlocked = n;
      prof.lessonsIntroduced = introduced ? Array.from({ length: Math.min(n, convertGroupsFromV1(introduced)) }, (_, i) => i) : [];
    }
    data.version = 2;
  }
  if (data.version === 2 && data.profile) {
    data = { version: 3, active: 0, profiles: [data.profile] };
  }
  if (!Array.isArray(data.profiles) || !data.profiles.length) throw new Error('no profiles');
  const profiles = data.profiles.slice(0, MAX_PROFILES).map(upgradeProfile);
  const active = Math.min(Math.max(0, data.active | 0), profiles.length - 1);
  return { version: SAVE_VERSION, active, profiles };
}

function readStore(storage) {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;
  const data = JSON.parse(raw);
  const stale = data.version !== SAVE_VERSION || !Array.isArray(data.profiles) || data.profiles.some((p) => !p.id);
  const store = migrate(data);
  // Write an upgraded save straight back, so new ids stick (otherwise every read would mint new ones).
  if (stale) writeStore(store, storage);
  return store;
}

function writeStore(store, storage) {
  for (const p of store.profiles) if (p.history.length > HISTORY_CAP) p.history = p.history.slice(-HISTORY_CAP);
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false; // private mode or storage full: the game keeps working, it just can't remember
  }
}

/** Loads the active profile. status: 'new' | 'loaded' | 'recovered'. */
export function load(storage = globalThis.localStorage) {
  let raw = null;
  try {
    raw = storage.getItem(SAVE_KEY);
    const store = readStore(storage);
    if (!store) return { profile: createProfile(), status: 'new' };
    return { profile: store.profiles[store.active], status: 'loaded' };
  } catch (e) {
    try { if (raw) storage.setItem(SAVE_KEY + '.broken', raw); } catch { /* storage full or blocked */ }
    return { profile: createProfile(), status: 'recovered' };
  }
}

function safeStore(storage) {
  try { return readStore(storage); } catch { return null; }
}

/** Saves one profile into the store (adds it if it is new). */
export function save(profile, storage = globalThis.localStorage) {
  const store = safeStore(storage) || { version: SAVE_VERSION, active: 0, profiles: [] };
  const i = store.profiles.findIndex((p) => p.id === profile.id);
  if (i >= 0) store.profiles[i] = profile;
  else {
    store.profiles.push(profile);
    store.active = store.profiles.length - 1;
  }
  return writeStore(store, storage);
}

export function listProfiles(storage = globalThis.localStorage) {
  const store = safeStore(storage);
  if (!store) return { active: null, profiles: [] };
  return { active: store.profiles[store.active]?.id, profiles: store.profiles.map((p) => ({ id: p.id, name: p.name, garden: p.garden, onboarded: p.onboarded, stars: p.stars || 0 })) };
}

export function getProfile(id, storage = globalThis.localStorage) {
  return safeStore(storage)?.profiles.find((p) => p.id === id) || null;
}

export function setActive(id, storage = globalThis.localStorage) {
  const store = safeStore(storage);
  if (!store) return false;
  const i = store.profiles.findIndex((p) => p.id === id);
  if (i < 0) return false;
  store.active = i;
  return writeStore(store, storage);
}

/** Adds a fresh gardener and makes it active. Returns it, or null when 4 already exist. */
export function addProfile(storage = globalThis.localStorage) {
  const store = safeStore(storage) || { version: SAVE_VERSION, active: 0, profiles: [] };
  if (store.profiles.length >= MAX_PROFILES) return null;
  const p = createProfile();
  store.profiles.push(p);
  store.active = store.profiles.length - 1;
  writeStore(store, storage);
  return p;
}

export function deleteProfile(id, storage = globalThis.localStorage) {
  const store = safeStore(storage);
  if (!store) return false;
  const activeId = store.profiles[store.active]?.id;
  store.profiles = store.profiles.filter((p) => p.id !== id);
  if (!store.profiles.length) store.profiles.push(createProfile());
  const i = store.profiles.findIndex((p) => p.id === activeId);
  store.active = i >= 0 ? i : 0;
  return writeStore(store, storage);
}

/** Replaces one profile with imported data (Parent Corner). Keeps its id so nothing else breaks. */
export function importProfile(id, data, storage = globalThis.localStorage) {
  const store = safeStore(storage);
  if (!store) return false;
  const i = store.profiles.findIndex((p) => p.id === id);
  if (i < 0) return false;
  const src = data && data.profile ? data.profile : data;
  if (!src || typeof src !== 'object' || !src.learner) throw new Error('not a Keybloom profile');
  store.profiles[i] = upgradeProfile({ ...src, id });
  return writeStore(store, storage);
}

/** Rolls the "today" record and day streak forward. A missed day never punishes: the streak plant just rests. */
export function rollDay(profile, today = dayNumber()) {
  if (profile.today.day !== today) profile.today = { day: today, done: {}, playMs: 0 };
}

export function markDone(profile, what, today = dayNumber()) {
  rollDay(profile, today);
  profile.today.done[what] = true;
  if (profile.streak.lastDay !== today) {
    profile.streak.count = profile.streak.lastDay === today - 1 ? profile.streak.count + 1 : 1;
    profile.streak.lastDay = today;
  }
}
