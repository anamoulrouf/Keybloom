// The Greenhouse (bonus): numbers and simple sums on seed-packet labels. Opens once every letter
// is unlocked. Gets a little harder each time (digits → bigger numbers → sums).
import { lineRunner } from './line-runner.js';
import { greenhouseLine } from '../core/greenhouse.js';
import { mulberry32 } from '../core/rng.js';
import { KEY_GROUPS } from '../core/adaptive.js';

export function greenhouseMode(game) {
  const p = game.profile;
  const level = Math.min(2, Math.floor(p.greenhouseRuns / 3));
  const rng = mulberry32(Date.now() >>> 0);
  const lines = Array.from({ length: 4 }, () => greenhouseLine(rng, level));
  return lineRunner(game, {
    mode: 'greenhouse',
    title: 'The Greenhouse',
    subtitle: level < 2
      ? 'Label the seed trays. Numbers live on the top row: reach up and come back home.'
      : 'Little sums today! <kbd>+</kbd> needs <kbd>Shift</kbd> and the <kbd>=</kbd> key.',
    keyboard: 'stage',
    keys: [...KEY_GROUPS.flat(), ...'1234567890-=,'.split(''), 'shift'],
    totalLines: lines.length,
    nextLine: (i) => (i < lines.length ? lines[i] : null),
    onDone: (s) => game.finish({ ...s, mode: 'greenhouse' }),
  });
}
