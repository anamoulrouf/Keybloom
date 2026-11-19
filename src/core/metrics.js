// Run metrics. WPM = (correct characters / 5) / active minutes. Active time adds the gap between
// keystrokes, capped at 2 s, so drifting, reading or pausing never lowers a child's speed.
export const GAP_CAP_MS = 2000;

export function createMetrics() {
  return { correct: 0, wrong: 0, activeMs: 0, lastT: null, keyTimes: [] };
}

/** Records one keystroke. Returns the capped gap (ms) since the previous keystroke, or null. */
export function recordKey(m, correct, t) {
  let gap = null;
  if (m.lastT !== null) {
    gap = Math.min(Math.max(0, t - m.lastT), GAP_CAP_MS);
    m.activeMs += gap;
  }
  m.lastT = t;
  if (correct) {
    m.correct++;
    m.keyTimes.push(Math.round(m.activeMs));
  } else {
    m.wrong++;
  }
  return gap;
}

/** Call when the game pauses so the paused time is never counted. */
export function pauseMetrics(m) {
  m.lastT = null;
}

export function wpm(m) {
  const minutes = m.activeMs / 60000;
  if (minutes <= 0 || m.correct < 2) return 0;
  return m.correct / 5 / minutes;
}

export function accuracy(m) {
  const total = m.correct + m.wrong;
  return total ? m.correct / total : 1;
}

export function summary(m) {
  return {
    wpm: Math.round(wpm(m) * 10) / 10,
    accuracy: Math.round(accuracy(m) * 1000) / 1000,
    correct: m.correct,
    wrong: m.wrong,
    activeMs: Math.round(m.activeMs),
  };
}
