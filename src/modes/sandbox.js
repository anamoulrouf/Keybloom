// Garden Words: type any of the garden words and it appears in your garden. Magic words change
// the sky; secret words do surprising things. Every key is still checked (core/sandbox.js), so
// it is real practice, logged like any other run.
import { createSandbox, pressSandbox, candidates } from '../core/sandbox.js';
import { createMetrics, recordKey, pauseMetrics, summary } from '../core/metrics.js';
import { recordKeystroke } from '../core/adaptive.js';
import { GARDEN_WORDS, SECRET_WORDS, MAGIC_WORDS, wordKind } from '../data/garden-words.js';
import { MEADOW_CAP } from '../scene/meadow.js';
import { puff } from '../scene/particles.js';
import { el, esc } from '../ui/dom.js';

export function sandboxMode(game) {
  const { profile, scene, audio } = game;
  const sb = createSandbox([...GARDEN_WORDS, ...SECRET_WORDS]);
  const metrics = createMetrics();
  let placed = 0;
  let paused = false;
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  const root = el(`<section class="screen play words-play" aria-label="Garden Words">
    <header class="hud">
      <div class="hud-left card-soft"><strong>Garden Words</strong><span class="small">Type a word, and it grows. <kbd>Space</kbd> plants a word that could be longer.</span></div>
      <div class="hud-right"><button class="btn small" data-act="tidy">Tidy up</button><button class="btn small primary" data-act="done">Done</button></div>
    </header>
    <div class="words-panel card-soft">
      <div class="typed" aria-live="polite"><span class="buf"></span><span class="caret"></span></div>
      <div class="chips-list"></div>
      <p class="small muted magic-line">Magic words: ${MAGIC_WORDS.map((w) => `<b>${w}</b>`).join(', ')}. Psst: the Almanac whispers some secret ones.</p>
    </div>
  </section>`);
  game.app.appendChild(root);
  const bufEl = root.querySelector('.buf');
  const chipsEl = root.querySelector('.chips-list');
  root.querySelector('[data-act="tidy"]').addEventListener('click', () => {
    profile.meadow = [];
    scene.renderMeadow(profile.meadow);
    game.persist();
    game.say('All tidy. A fresh meadow to fill!', 2500);
  });
  root.querySelector('[data-act="done"]').addEventListener('click', done);

  function render() {
    bufEl.textContent = sb.buf;
    const list = sb.buf ? candidates(sb).filter((w) => GARDEN_WORDS.includes(w)) : GARDEN_WORDS.filter((w) => wordKind(w) !== 'magic');
    chipsEl.innerHTML = list.slice(0, 40).map((w) => `<span class="wchip${sb.buf && w === sb.buf ? ' exact' : ''}">${sb.buf ? `<b>${esc(w.slice(0, sb.buf.length))}</b>${esc(w.slice(sb.buf.length))}` : esc(w)}</span>`).join('');
  }
  render();

  function grow(word) {
    const kind = wordKind(word);
    const b = bufEl.getBoundingClientRect();
    puff(b.left + 30, b.top, 8);
    audio.pop();
    if (kind === 'magic') return magic(word);
    if (kind === 'secret') return secret(word);
    profile.meadow.push({ w: word });
    if (profile.meadow.length > MEADOW_CAP) profile.meadow.shift();
    placed++;
    scene.renderMeadow(profile.meadow);
    game.persist(); // keep it even if the child leaves through the pause menu
    audio.sparkle(4);
    if (placed === 1) game.say(`A ${word}! Keep going, your meadow is behind the fence.`, 3000);
  }

  function magic(word) {
    audio.sparkle(8);
    if (word === 'sun') { scene.setTime('day'); scene.setWeather(null); game.say('Good morning, sunshine.', 2500); }
    if (word === 'moon') { scene.setTime('night'); scene.setWeather('fireflies'); game.say('The moon is up. The fireflies came out to see.', 3000); }
    if (word === 'rain') { scene.setWeather('rain'); game.say('Plip, plop. The garden says thank you.', 2500); later(() => scene.setWeather(null), 9000); }
    if (word === 'rainbow') { scene.setWeather('rainbow'); game.say('A rainbow! Make a wish. (Or type one.)', 3000); later(() => scene.setWeather(null), 10000); }
    if (word === 'snow') { scene.setWeather('snow'); game.say('Snow! Pip is catching flakes on her nose.', 3000); later(() => scene.setWeather(null), 10000); }
  }

  function secret(word) {
    const first = !profile.secretsFound.includes(word);
    if (first) { profile.secretsFound.push(word); game.persist(); }
    audio.chime();
    if (word === 'hedgehog') { scene.setPipPose('cartwheel'); later(() => scene.setPipPose('idle'), 1600); game.say('Wheee! Hedgehogs can do cartwheels. Who knew?', 3000); }
    if (word === 'pip') { scene.setPipPose('cheer'); later(() => scene.setPipPose('idle'), 1500); game.say("That's me! Hello, hello.", 2500); }
    if (word === 'keybloom') {
      const v = scene.visibleX();
      for (let i = 0; i < 10; i++) { const p = scene.toScreen(v.left + ((v.right - v.left) * (i + 0.5)) / 10, 300 + (i % 3) * 80); later(() => puff(p.x, p.y, 10), i * 120); }
      game.say('Petals of every colour! You know the secret name.', 3200);
    }
    if (word === 'wish') { scene.setTime('night'); scene.setWeather('wish'); game.say('A shooting star! I hope your wish is a good one.', 3200); later(() => scene.setWeather(null), 4000); }
    if (word === 'dance') { scene.setDance(true); game.say('Everybody dance!', 2500); later(() => scene.setDance(false), 5000); }
    if (first) game.toast(`<b>Secret found!</b> "${esc(word)}" (${profile.secretsFound.length} of ${SECRET_WORDS.length})`);
  }

  function done() {
    timers.forEach(clearTimeout);
    const s = summary(metrics);
    game.record({ ...s, minutes: s.activeMs / 60000, mode: 'words', placed });
    game.go('home');
    if (placed) game.toast(`You grew <b>${placed}</b> new thing${placed === 1 ? '' : 's'} with Garden Words.`);
  }

  return {
    isPlay: true,
    onKey(ev, key, now) {
      if (paused) return;
      const expected = key.length === 1 ? key.toLowerCase() : null;
      const r = pressSandbox(sb, key);
      if (r.type === 'ignored') return;
      if (r.type === 'erase') { render(); return; }
      const ok = r.type !== 'wrong';
      const gap = recordKey(metrics, ok, now);
      if (ok && expected !== ' ') recordKeystroke(profile.learner, expected, true, gap);
      if (ok) {
        audio.keyNote();
        if (r.type === 'complete') { grow(r.word); audio.resetKeyStep(); }
      } else {
        audio.tok();
        bufEl.parentElement.classList.remove('miss');
        void bufEl.offsetWidth;
        bufEl.parentElement.classList.add('miss');
      }
      render();
    },
    pause() { paused = true; pauseMetrics(metrics); },
    resume() { paused = false; },
    destroy() {
      timers.forEach(clearTimeout);
      root.remove();
      scene.setDance(false);
    },
  };
}
