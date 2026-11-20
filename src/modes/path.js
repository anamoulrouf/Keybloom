// Typing Path: the main beginner flow. Each round is 7–10 small words, one at a time, then a
// sentence that uses some of them. Three rounds make a session (about 3–4 minutes).
// Every word earns a star (two if typed with no mistakes); every sentence earns more.
import { lineRunner } from './line-runner.js';
import { planRound } from '../core/sentences.js';
import { starsFor, cheerWord } from '../core/stars.js';
import { mulberry32 } from '../core/rng.js';
import { esc } from '../ui/dom.js';

export const PATH_ROUNDS = 3;

export function pathMode(game) {
  const { profile } = game;
  const learner = profile.learner;
  const rng = mulberry32(Date.now() >>> 0);
  const items = []; // { text, kind: 'word'|'sentence', round, index, count, next: [] }
  const avoid = new Set();
  for (let r = 0; r < PATH_ROUNDS; r++) {
    const round = planRound(rng, learner, { avoid });
    avoid.add(round.raw);
    round.words.forEach((w, i) => items.push({ text: w, kind: 'word', round: r, index: i, count: round.words.length, next: round.words.slice(i + 1, i + 3) }));
    items.push({ text: round.sentence, kind: 'sentence', round: r, words: round.words });
  }
  game.scene.setTime('morning');

  return lineRunner(game, {
    mode: 'path',
    title: 'Typing Path',
    subtitle: 'Type the word you see. Take your time.',
    keyboard: 'stage',
    lineHeader(i) {
      const it = items[i];
      if (!it) return '';
      const round = `<span class="path-round">Round ${it.round + 1} of ${PATH_ROUNDS}</span>`;
      if (it.kind === 'sentence') return `${round}<div class="path-now">Now a sentence! It uses words you just typed.</div>`;
      return `${round}<div class="path-now">Word ${it.index + 1} of ${it.count}</div>
        <div class="path-next" aria-hidden="true">${it.next.map((w) => `<span>${esc(w)}</span>`).join('')}${it.index + 3 > it.count ? '<span class="soon">sentence</span>' : ''}</div>`;
    },
    nextLine: (i) => (i < items.length ? items[i].text : null),
    reward(i, clean) {
      const it = items[i];
      if (!it) return null;
      if (it.kind === 'sentence') {
        game.scene.bloomAll?.();
        game.scene.setPipPose('cheer');
        setTimeout(() => game.scene.setPipPose('idle'), 1400);
        game.audio.sparkle(8);
        return { stars: starsFor('sentence', clean), big: true, text: cheerWord(rng, true) };
      }
      return { stars: starsFor('word', clean), text: cheerWord(rng) };
    },
    onDone: (s) => game.finish({ ...s, mode: 'path' }),
  });
}
