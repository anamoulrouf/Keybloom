// Daily Watering: a 2-minute warm-up built from the child's 5 weakest keys.
import { lineRunner } from './line-runner.js';
import { weakestKeys } from '../core/adaptive.js';
import { makeLine } from '../core/words.js';
import { mulberry32 } from '../core/rng.js';
import { esc } from '../ui/dom.js';

export function dailyMode(game) {
  const learner = game.profile.learner;
  const rng = mulberry32(Date.now() >>> 0);
  const focus = weakestKeys(learner, 5);
  return lineRunner(game, {
    mode: 'daily',
    title: 'Daily Watering',
    subtitle: `Two gentle minutes. Today's watering focuses on ${focus.map((k) => `<b>${esc(k)}</b>`).join(' ')}. The can starts pouring at your first key.`,
    seconds: 120,
    keyboard: 'stage',
    nextLine: () => makeLine(rng, learner, 5, { focus, maxLen: 7 }),
    onDone: (s) => game.finish({ ...s, mode: 'daily' }),
  });
}
