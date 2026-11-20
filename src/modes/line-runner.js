// Shared runner for line typing: Sprout Lessons, Daily Watering and the Seed Test.
// Lines come one at a time; the on-screen keyboard follows the child's hint stage.
// A timed run shows a watering can that slowly empties instead of a countdown clock.
import { createLine, pressLine } from '../core/typing-engine.js';
import { createMetrics, recordKey, pauseMetrics, summary } from '../core/metrics.js';
import { recordKeystroke, unlockedKeys } from '../core/adaptive.js';
import { createKeyboard } from '../scene/keyboard-hint.js';
import { createLineView } from '../ui/line-view.js';
import { el, esc } from '../ui/dom.js';
import { sparkle, puff } from '../scene/particles.js';
import { starsFor, cheerWord } from '../core/stars.js';
import { cheer } from '../ui/cheer.js';

/**
 * opts: { mode, title, subtitle, nextLine(i) → string|null, seconds?, keyboard: true|false|'stage',
 *         recordStats?: true, onDone(summary), extraButton?: { label, onClick },
 *         keys?: [chars for the keyboard], fixTypos?, trackHTML?, onProgress?(state),
 *         onTick?(dt, now, state), onLine?(index), learner? (whose stats to record),
 *         lineHeader?(index) → html shown above each line (e.g. Arabic text, read only) }
 */
export function lineRunner(game, opts) {
  const { profile, audio } = game;
  const learner = opts.learner || profile.learner;
  const metrics = createMetrics();
  let paused = false;
  let ended = false;
  let lineIndex = 0;
  let line = null;
  let elapsed = 0;
  let lastNow = null;
  let lineClean = true;
  let charsDone = 0; // correct characters across all lines

  const root = el(`<section class="screen lines" aria-label="${esc(opts.title)}">
    <div class="lines-card card">
      <header><h2>${esc(opts.title)}</h2>${opts.subtitle ? `<p class="sub">${opts.subtitle}</p>` : ''}
        <button class="icon-btn" data-act="pause" aria-label="Pause">❚❚</button></header>
      ${opts.seconds ? '<div class="drain" aria-hidden="true"><div class="drain-fill"></div></div>' : '<div class="dots" aria-hidden="true"></div>'}
      ${opts.trackHTML || ''}
      ${opts.lineHeader ? '<div class="line-header"></div>' : ''}
      <div class="line-slot"></div>
      <div class="kb-slot"></div>
      ${opts.extraButton ? `<button class="btn ghost small" data-act="extra">${esc(opts.extraButton.label)}</button>` : ''}
    </div>
  </section>`);
  game.app.appendChild(root);
  root.querySelector('[data-act="pause"]').addEventListener('click', () => game.pauseMenu());
  if (opts.extraButton) root.querySelector('[data-act="extra"]').addEventListener('click', opts.extraButton.onClick);

  const view = createLineView(root.querySelector('.line-slot'));
  let kb = null;
  {
    kb = createKeyboard(root.querySelector('.kb-slot'));
    // The keyboard stays visible (the child can hide it in Settings): finger colours for
    // beginners, then plain keys with the next key highlighted.
    kb.setStage(profile.settings.keyboard === 'hide' ? 2 : opts.keyboard === 'stage' ? Math.min(1, learner.hintStage) : opts.keyboard === false ? 1 : 0);
    kb.setUnlocked(opts.keys || (opts.allKeys ? [...'abcdefghijklmnopqrstuvwxyz;,.\'/', 'shift'] : unlockedKeys(learner)));
  }
  const dots = root.querySelector('.dots');
  if (dots && opts.totalLines) dots.innerHTML = Array.from({ length: opts.totalLines }, () => '<i></i>').join('');

  function loadLine() {
    const text = opts.nextLine(lineIndex);
    if (text == null) return finish();
    line = createLine(text, { fixTypos: !!opts.fixTypos });
    if (opts.lineHeader) root.querySelector('.line-header').innerHTML = opts.lineHeader(lineIndex) || '';
    lineClean = true;
    view.setText(text);
    kb?.setNext(text[0]);
    if (dots) dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i < lineIndex));
  }

  function finish() {
    if (ended) return;
    ended = true;
    const s = summary(metrics);
    opts.onDone({ ...s, minutes: s.activeMs / 60000, mode: opts.mode, lines: lineIndex });
  }

  const state = {
    get chars() { return charsDone; },
    get elapsed() { return elapsed; },
    get lineIndex() { return lineIndex; },
    metrics,
    root,
    finish,
    get ended() { return ended; },
  };

  loadLine();

  return {
    isPlay: true,
    state,
    onKey(ev, key, now) {
      if (paused || ended || !line) return;
      const r = pressLine(line, key);
      if (r.type === 'ignored') return;
      if (r.type === 'erase') {
        view.setTypos(line.typos);
        return;
      }
      const ok = r.type === 'correct' || r.type === 'complete';
      const gap = recordKey(metrics, ok, now);
      if (opts.recordStats !== false) recordKeystroke(learner, r.expected, ok, gap);
      kb?.flash(key, ok);
      if (ok) {
        audio.keyNote();
        charsDone++;
        opts.onProgress?.(state, now);
        view.setPos(line.pos);
        kb?.setNext(line.text[line.pos]);
        if (r.expected === ' ') audio.resetKeyStep();
        if (r.type === 'complete') {
          audio.pop();
          const b = view.el.getBoundingClientRect();
          puff(b.right - 20, b.top + b.height / 2, lineClean ? 8 : 4);
          // Stars and a short "well done" after every line (modes can choose their own reward).
          const reward = opts.reward ? opts.reward(lineIndex, lineClean, line.text) : { stars: starsFor('line') };
          if (reward && reward.stars) {
            game.addStars(reward.stars);
            cheer({ text: reward.text || cheerWord(Math.random, reward.big), stars: reward.stars, big: reward.big, gentle: opts.mode === 'islamic', x: b.left + b.width / 2, y: b.top - 10 });
          }
          lineIndex++;
          opts.onLine?.(lineIndex);
          if (!ended) setTimeout(() => { if (!ended) loadLine(); }, 280);
        } else {
          const cur = view.el.querySelector('.ch.cur');
          if (cur && Math.random() < 0.35) {
            const b = cur.getBoundingClientRect();
            sparkle(b.left, b.top);
          }
        }
      } else {
        lineClean = false;
        audio.tok();
        view.wobble(line.pos);
        view.setTypos(line.typos);
      }
    },
    tick(dt, now) {
      if (paused || ended) return;
      opts.onTick?.(dt, now, state);
      if (!opts.seconds) return;
      if (metrics.correct + metrics.wrong === 0) return; // the clock starts at the first key
      // Wall-clock time (not frame count), so a throttled background tab can't stretch the run.
      if (lastNow != null) elapsed += Math.min(1, (now - lastNow) / 1000);
      lastNow = now;
      const f = root.querySelector('.drain-fill');
      if (f) f.style.transform = `scaleX(${Math.max(0, 1 - elapsed / opts.seconds)})`;
      if (elapsed >= opts.seconds) finish();
    },
    pause() { paused = true; lastNow = null; pauseMetrics(metrics); },
    resume() { paused = false; },
    destroy() { root.remove(); },
  };
}
