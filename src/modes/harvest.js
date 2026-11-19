// Giant Harvest and Season Festival: after a season's last bed, type a long phrase in parts to
// grow something enormous, then the whole garden celebrates. A big moment after a big effort,
// with no timer and no way to fail.
import { lineRunner } from './line-runner.js';
import { makeLine } from '../core/words.js';
import { mulberry32 } from '../core/rng.js';
import { KEY_GROUPS } from '../core/adaptive.js';
import { seasonById } from '../core/progress.js';
import { WINTER_HARVEST } from '../data/seasons.js';
import { puff } from '../scene/particles.js';
import { el, esc } from '../ui/dom.js';

export function harvestMode(game, { season: seasonId }) {
  const { scene, audio, profile } = game;
  const season = seasonById(seasonId);
  const { harvest } = season;
  const rng = mulberry32(Date.now() >>> 0);
  const lines = seasonId === 'winter'
    ? WINTER_HARVEST
    : Array.from({ length: 5 }, () => makeLine(rng, profile.learner, 5, { maxLen: 8 }));
  let festivalOverlay = null;
  let festTimer = null;

  scene.setSeason(seasonId);
  scene.setTime(season.time);
  scene.clearRunBed();
  scene.setGiant(harvest.giant, 0);

  const runner = lineRunner(game, {
    mode: 'harvest',
    title: `Giant Harvest: the ${harvest.name}`,
    subtitle: `Every line you type makes it grow. After that: the ${harvest.festival}!`,
    keyboard: 'stage',
    keys: seasonId === 'winter' ? [...KEY_GROUPS.flat(), ',', '.', "'", '/', '1', 'shift'] : undefined,
    totalLines: lines.length,
    nextLine: (i) => (i < lines.length ? lines[i] : null),
    onLine(i) {
      scene.setGiant(harvest.giant, i / lines.length);
      audio.sparkle(4 + i);
      const p = scene.toScreen(800, 600);
      puff(p.x, p.y, 10);
      if (i === lines.length - 1) game.say('One more line. It is SO big.', 2500);
    },
    onDone(s) {
      festival(() => game.finish({ ...s, mode: 'harvest', season: seasonId }));
    },
  });

  function festival(then) {
    scene.setGiant(harvest.giant, 1);
    scene.setFestival(true, seasonId);
    runner.state.root.classList.add('festival-hide');
    scene.setPipPose('cheer');
    audio.setChain(30);
    audio.chime();
    const v = scene.visibleX();
    for (let i = 0; i < 16; i++) {
      const p = scene.toScreen(v.left + ((v.right - v.left) * ((i * 7) % 16 + 0.5)) / 16, 180 + (i % 4) * 70);
      setTimeout(() => { puff(p.x, p.y, 12); if (i % 3 === 0) audio.sparkle(6); }, 300 + i * 260);
    }
    festivalOverlay = el(`<div class="festival-banner" role="status"><h2>${esc(harvest.festival)}!</h2><p>The whole garden came to celebrate your ${esc(season.name)}.</p></div>`);
    document.body.appendChild(festivalOverlay);
    festTimer = setTimeout(() => {
      festivalOverlay?.remove();
      festivalOverlay = null;
      scene.setPipPose('idle');
      then();
    }, game.reducedMotion() ? 2500 : 6500);
  }

  const destroy = runner.destroy;
  runner.destroy = () => {
    clearTimeout(festTimer);
    festivalOverlay?.remove();
    scene.setFestival(false);
    scene.setGiant(null);
    audio.setChain(0);
    destroy();
  };
  return runner;
}
