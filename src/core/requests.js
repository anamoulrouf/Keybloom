// Pip's Requests: three small goals each week, picked from features the child has unlocked.
// Missing them costs nothing; finishing one gives dewdrops, finishing all three a mystery seed.
import { mulberry32, hashString } from './rng.js';

export const REQUEST_DEW = 15;
export const REQUEST_POOL = [
  { id: 'clean', kind: 'cleanWords', goal: 40, text: 'Plant 40 words in Garden Play at 95% accuracy or better' },
  { id: 'chain', kind: 'chain', goal: 10, text: 'Make a bloom chain of 10 clean words' },
  { id: 'water', kind: 'water', goal: 3, text: 'Do Daily Watering on 3 different days' },
  { id: 'lesson', kind: 'lesson', goal: 2, text: 'Finish 2 Sprout Lessons' },
  { id: 'three', kind: 'threeFlowers', goal: 1, text: 'Earn 3 flowers on any bed' },
  { id: 'visitor', kind: 'visitor', goal: 1, text: 'Welcome a new visitor to your garden' },
  { id: 'race', kind: 'race', goal: 1, needs: 'race', text: 'Race the ghost bee' },
  { id: 'story', kind: 'story', goal: 1, needs: 'story', text: 'Type a page of a Story Seed' },
  { id: 'words', kind: 'words', goal: 5, needs: 'words', text: 'Grow 5 things with Garden Words' },
  { id: 'greenhouse', kind: 'greenhouse', goal: 1, needs: 'greenhouse', text: 'Water the greenhouse once' },
];

export function weekNumber(day) {
  return Math.floor((day + 3) / 7); // weeks start on Monday (day 0 = Thursday 1 Jan 1970)
}

/** Makes sure this week's three requests exist. features: Set of unlocked feature names. */
export function ensureRequests(profile, today, features = new Set()) {
  const week = weekNumber(today);
  if (profile.requests && profile.requests.week === week) return profile.requests;
  const rng = mulberry32(hashString(`${profile.id || 'kb'}:${week}`));
  const pool = REQUEST_POOL.filter((r) => !r.needs || features.has(r.needs));
  const chosen = [];
  while (chosen.length < 3 && pool.length) chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  profile.requests = {
    week,
    allRewarded: false,
    list: chosen.map((r) => ({ id: r.id, kind: r.kind, goal: r.goal, text: r.text, progress: 0, done: false, days: [] })),
  };
  return profile.requests;
}

/**
 * Counts an event toward this week's requests. event: { kind, amount = 1, day, max = false }.
 * max: true means "best value" (bloom chain) rather than a running total.
 * Returns { done: [requests finished now], allDone: true the moment the third one completes }.
 */
export function progressRequests(profile, event) {
  const out = { done: [], allDone: false };
  const req = profile.requests;
  if (!req) return out;
  for (const r of req.list) {
    if (r.done || r.kind !== event.kind) continue;
    if (r.kind === 'water') {
      if (!r.days.includes(event.day)) r.days.push(event.day);
      r.progress = r.days.length;
    } else if (event.max) {
      r.progress = Math.max(r.progress, event.amount ?? 1);
    } else {
      r.progress += event.amount ?? 1;
    }
    if (r.progress >= r.goal) {
      r.progress = r.goal;
      r.done = true;
      out.done.push(r);
    }
  }
  if (out.done.length && !req.allRewarded && req.list.every((r) => r.done)) {
    req.allRewarded = true;
    out.allDone = true;
  }
  return out;
}
