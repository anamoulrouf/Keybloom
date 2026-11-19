// Adaptive learning engine (keybr-style, wrapped in play):
//  • keys unlock in left/right pairs, only when every unlocked key is accurate and quick enough;
//  • weak keys are weighted up so they show up more often;
//  • the target WPM rises only after 3 runs in a row at ≥92% accuracy and eases off below 85%;
//  • on-screen keyboard hints fade as accuracy rises and come back when a child struggles.

// Ordered so that every stage can be practised with real words only (never letter drills):
// "a s d f l" already makes add, dad, sad, fall, salad; "g h k" adds had, flag, flask. "j" waits
// until the vowels arrive (jar, jog, jelly) because the home row alone has no j words.
export const KEY_GROUPS = [
  ['a', 's', 'd', 'f', 'l'], ['g', 'h', 'k'],                  // Spring: home row
  ['e', 'i'], ['r', 'u'], ['t', 'y'], ['o', 'w'], ['j', 'p'], // Summer: top row (+ j)
  ['c', 'n'], ['m', 'v'], ['b', 'x'], ['q', 'z'],             // Autumn: bottom row and the rare ones
];
export const SEASON_GROUPS = { spring: [0, 1], summer: [2, 6], autumn: [7, 10] };
/** The original v1 order, kept so old saves can be converted. */
export const KEY_GROUPS_V1 = [
  ['f', 'j'], ['d', 'k'], ['s', 'l'], ['a', ';'], ['g', 'h'], ['e', 'i'], ['r', 'u'], ['t', 'y'],
  ['o', 'w'], ['p', 'q'], ['c', 'n'], ['m', 'v'], ['b', 'x'], ['z', ',', '.'],
];

/** Converts a v1 group count to the current order: keeps every group whose keys were all unlocked. */
export function convertGroupsFromV1(count) {
  const had = new Set(KEY_GROUPS_V1.slice(0, count).flat());
  let n = 0;
  while (n < KEY_GROUPS.length && KEY_GROUPS[n].every((k) => had.has(k))) n++;
  return Math.max(1, n);
}
export const ALL_LETTERS = KEY_GROUPS.flat();

export const UNLOCK_WINDOW = 30;      // presses looked at per key
export const UNLOCK_ACCURACY = 0.9;
export const UNLOCK_MAX_MS = 1500;    // average time to press (≈8 WPM)
export const TARGET_RISE_ACC = 0.92;
export const TARGET_DROP_ACC = 0.85;
export const MIN_TARGET = 6;
export const HINT_FULL = 0, HINT_NEXT = 1, HINT_HIDDEN = 2;

export function createLearner() {
  return {
    groupsUnlocked: 1,
    keyStats: {},
    targetWpm: 8,
    goodRunStreak: 0,
    hintStage: HINT_FULL,
    hintRuns: 0,
    lowRuns: 0,
  };
}

export function unlockedKeys(learner) {
  return KEY_GROUPS.slice(0, learner.groupsUnlocked).flat();
}

export function newestKeys(learner) {
  return KEY_GROUPS[learner.groupsUnlocked - 1] || [];
}

export function statFor(learner, key) {
  const k = key.toLowerCase();
  return (learner.keyStats[k] ||= { hits: 0, misses: 0, recent: [], avgMs: null });
}

/** Records one keystroke against the key the child was meant to press. gapMs may be null. */
export function recordKeystroke(learner, expectedKey, correct, gapMs) {
  if (!expectedKey || expectedKey === ' ') return;
  const s = statFor(learner, expectedKey);
  if (correct) s.hits++;
  else s.misses++;
  s.recent.push(correct ? 1 : 0);
  if (s.recent.length > UNLOCK_WINDOW) s.recent.shift();
  if (correct && gapMs != null) s.avgMs = s.avgMs == null ? gapMs : s.avgMs * 0.85 + gapMs * 0.15;
}

export function keyAccuracy(stat) {
  if (!stat || !stat.recent.length) return null;
  return stat.recent.reduce((a, b) => a + b, 0) / stat.recent.length;
}

export function keyConfident(stat) {
  return !!stat && stat.recent.length >= UNLOCK_WINDOW && keyAccuracy(stat) >= UNLOCK_ACCURACY &&
    stat.avgMs != null && stat.avgMs <= UNLOCK_MAX_MS;
}

/** Weight used when sampling words: weaker and newer keys appear more often. */
export function keyWeakness(learner, key) {
  const s = learner.keyStats[key];
  if (!s || s.recent.length < 5) return 3; // new or barely seen: give it practice
  const acc = keyAccuracy(s);
  const slow = s.avgMs == null ? 1 : Math.min(2, Math.max(0, (s.avgMs - 400) / 800));
  return 1 + (1 - acc) * 6 + slow;
}

export function weakestKeys(learner, n = 5) {
  return unlockedKeys(learner)
    .filter((k) => /[a-z]/.test(k))
    .sort((a, b) => keyWeakness(learner, b) - keyWeakness(learner, a))
    .slice(0, n);
}

export function canUnlockNext(learner) {
  if (learner.groupsUnlocked >= KEY_GROUPS.length) return false;
  return unlockedKeys(learner).every((k) => keyConfident(learner.keyStats[k]));
}

/** Unlocks the next pair if earned. Returns the new keys, or null. */
export function maybeUnlock(learner) {
  if (!canUnlockNext(learner)) return null;
  learner.groupsUnlocked++;
  return newestKeys(learner);
}

/** Applies a finished run to the target speed and hint stage. Returns what changed. */
export function applyRun(learner, run) {
  const changes = { target: 0, hint: 0 };
  if (run.accuracy >= TARGET_RISE_ACC) {
    learner.goodRunStreak++;
    learner.lowRuns = 0;
    if (learner.goodRunStreak >= 3 && run.wpm >= learner.targetWpm * 0.9) {
      const step = run.wpm >= learner.targetWpm + 2 ? 2 : 1;
      learner.targetWpm += step;
      changes.target = step;
      learner.goodRunStreak = 0;
    }
  } else {
    learner.goodRunStreak = 0;
    if (run.accuracy < TARGET_DROP_ACC) {
      learner.lowRuns++;
      if (learner.targetWpm > MIN_TARGET) {
        learner.targetWpm--;
        changes.target = -1;
      }
    }
  }
  // Hint fading: step down after 2 strong runs, come back on a rough one.
  if (run.accuracy >= 0.95) {
    learner.hintRuns++;
    if (learner.hintRuns >= 2 && learner.hintStage < HINT_HIDDEN) {
      learner.hintStage++;
      learner.hintRuns = 0;
      changes.hint = 1;
    }
  } else if (run.accuracy < TARGET_DROP_ACC && learner.hintStage > HINT_FULL) {
    learner.hintStage--;
    learner.hintRuns = 0;
    changes.hint = -1;
  } else {
    learner.hintRuns = 0;
  }
  return changes;
}

/** Placement from the 60-second Seed Test. */
export function placementFrom(learner, { wpm, accuracy, skipped }) {
  if (skipped || wpm < 8 || accuracy < 0.85) {
    learner.groupsUnlocked = 1;
    learner.targetWpm = 8;
    return 'spring';
  }
  learner.targetWpm = Math.max(8, Math.min(40, Math.round(wpm)));
  if (wpm >= 22) {
    learner.groupsUnlocked = KEY_GROUPS.length;
    learner.hintStage = HINT_HIDDEN;
    return 'summer';
  }
  if (wpm >= 15) {
    learner.groupsUnlocked = 7;
    learner.hintStage = HINT_NEXT;
    return 'summer';
  }
  learner.groupsUnlocked = 2;
  return 'spring';
}
