// Rewards weighted toward accuracy: clean typing is what pays, speed alone earns nothing extra.
export function accuracyMultiplier(acc) {
  if (acc >= 0.95) return 1.5;
  if (acc >= 0.85) return 1;
  return 0.5;
}

/** Dewdrops for a run: one per correct word-length (5 chars), scaled by accuracy. */
export function dewdropsFor(correctChars, acc) {
  return Math.round((correctChars / 5) * accuracyMultiplier(acc));
}

/** Bed result: 1 finished, 2 at ≥90% accuracy, 3 at ≥95% accuracy and at/above target speed. */
export function flowersFor({ accuracy, wpm, targetWpm }) {
  if (accuracy >= 0.95 && wpm >= targetWpm) return 3;
  if (accuracy >= 0.9) return 2;
  return 1;
}
