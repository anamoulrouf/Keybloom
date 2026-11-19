// Bee Race: a friendly bee flies at the pace of YOUR best Garden Play run (it replays your real
// key timings). Beat it and your target speed grows a little. Never strangers, never a timer.
import { lineRunner } from './line-runner.js';
import { makeLine } from '../core/words.js';
import { mulberry32 } from '../core/rng.js';
import { GAP_CAP_MS } from '../core/metrics.js';
import { visitorArt } from '../scene/visitors.js';

const BUTTERFLY = '<g class="bob"><path d="M0 0 C -24 -26, -30 6, -4 4 C -22 22, -6 28, 0 6 C 6 28, 22 22, 4 4 C 30 6, 24 -26, 0 0Z" fill="#F4BFD8"/><path d="M0 -4 v14" stroke="#7A5A44" stroke-width="2.5" stroke-linecap="round"/></g>';

/** How many characters the ghost has typed after `clockMs` of active time. */
export function ghostChars(keyTimes, clockMs) {
  let lo = 0, hi = keyTimes.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keyTimes[mid] <= clockMs) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function beeRaceMode(game) {
  const { profile } = game;
  const learner = profile.learner;
  const ghost = profile.ghost;
  const rng = mulberry32(Date.now() >>> 0);
  const raceLen = Math.max(40, Math.min(ghost.keyTimes.length, 150));
  const lines = [];
  let total = 0;
  while (total < raceLen) {
    const l = makeLine(rng, learner, 5, { maxLen: 7 });
    if (!l) break;
    lines.push(l);
    total += l.length;
  }
  const lane = (cls, art) => `<div class="lane ${cls}"><span class="racer">${`<svg viewBox="-34 -30 68 60" aria-hidden="true">${art}</svg>`}</span></div>`;
  let won = null;
  let beeDone = false;

  const runner = lineRunner(game, {
    mode: 'race',
    title: 'Bee Race',
    subtitle: `The bee flies at your best Garden Play pace (${Math.round(ghost.wpm)} WPM). It waits for your first key. Careful keys are the fast ones!`,
    keyboard: 'stage',
    trackHTML: `<div class="race-track" aria-hidden="true">${lane('bee-lane', visitorArt('bee'))}${lane('you-lane', BUTTERFLY)}<i class="finish-flower"></i></div>`,
    nextLine: (i) => (i < lines.length ? lines[i] : null),
    onProgress(state) {
      move('.you-lane', state.chars / raceLen);
      if (state.chars >= raceLen && won == null) {
        won = !beeDone;
        state.finish();
      }
    },
    onTick(dt, now, state) {
      const m = state.metrics;
      if (m.lastT == null && m.correct === 0) return; // waiting for the first key
      const clock = m.activeMs + (m.lastT == null ? 0 : Math.min(GAP_CAP_MS, now - m.lastT));
      const g = ghostChars(ghost.keyTimes, clock);
      move('.bee-lane', g / raceLen);
      if (g >= raceLen && !beeDone) {
        beeDone = true;
        game.say('The bee reached the flower first. Keep going, finish your race!', 3500);
      }
    },
    onDone: (s) => game.finish({ ...s, mode: 'race', won: won ?? !beeDone }),
  });

  function move(sel, f) {
    const r = runner.state.root.querySelector(`${sel} .racer`);
    if (r) r.style.left = `calc(${Math.min(1, f) * 100}% - ${Math.min(1, f) * 44}px)`;
  }
  return runner;
}
