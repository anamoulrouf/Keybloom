// Family Relay: two gardeners, one keyboard. Players take turns in short legs; each moves by how
// they type compared with their own usual speed (core/relay.js), so a parent and a child race fairly.
import { lineRunner } from './line-runner.js';
import { makeLine } from '../core/words.js';
import { mulberry32 } from '../core/rng.js';
import { createLearner, KEY_GROUPS } from '../core/adaptive.js';
import { relaySteps, LEG_SECONDS, LEGS_EACH, GUEST_LEVELS } from '../core/relay.js';
import { finishRun } from '../core/progress.js';
import { listProfiles, getProfile, save } from '../ui/save.js';
import { visitorArt } from '../scene/visitors.js';
import { el, esc } from '../ui/dom.js';

const BUTTERFLY = '<g class="bob"><path d="M0 0 C -24 -26, -30 6, -4 4 C -22 22, -6 28, 0 6 C 6 28, 22 22, 4 4 C 30 6, 24 -26, 0 0Z" fill="#F4BFD8"/><path d="M0 -4 v14" stroke="#7A5A44" stroke-width="2.5" stroke-linecap="round"/></g>';
const GOAL = LEG_SECONDS * LEGS_EACH; // steps you make typing at your usual speed for every leg

export function relayMode(game) {
  const { profile } = game;
  const others = listProfiles().profiles.filter((p) => p.id !== profile.id && p.onboarded);
  let sub = null; // the active leg runner, when typing
  let paused = false;

  const root = el(`<section class="screen center" aria-label="Family Relay"><div class="card narrow relay-setup">
    <h2>Family Relay</h2>
    <p>Two gardeners take turns at the keyboard: ${LEGS_EACH} legs each, ${LEG_SECONDS} seconds a leg. Everybody races against <b>their own usual speed</b>, so grown-ups and kids have the same chance. Careful keys count; wrong keys don't move you.</p>
    <p><b>${esc(profile.name)}</b> flies the bee.</p>
    <h3>Who flies the butterfly?</h3>
    <div class="col">
      ${others.map((o) => `<button class="btn" data-p2="${o.id}">${esc(o.name)}</button>`).join('')}
      <label>A guest's name <input name="guest" maxlength="16" placeholder="Mum, Dad, Grandpa…" autocomplete="off"></label>
      <div class="chips">${GUEST_LEVELS.map((l, i) => `<label class="chip"><input type="radio" name="lvl" value="${i}" ${i === 1 ? 'checked' : ''}>${l.label}</label>`).join('')}</div>
      <button class="btn primary" data-act="guest">Race with this guest</button>
      <button class="btn ghost" data-go="home">Back</button>
    </div></div></section>`);
  game.app.appendChild(root);
  root.querySelector('[data-go]').addEventListener('click', () => game.go('home'));
  root.querySelectorAll('[data-p2]').forEach((b) => b.addEventListener('click', () => {
    const p2 = getProfile(b.dataset.p2);
    start({ name: p2.name, learner: p2.learner, rating: Math.max(6, p2.learner.targetWpm), profile: p2 });
  }));
  root.querySelector('[data-act="guest"]').addEventListener('click', () => {
    const name = root.querySelector('[name="guest"]').value.trim().slice(0, 16) || 'Guest';
    const lvl = GUEST_LEVELS[Number(root.querySelector('[name="lvl"]:checked').value)];
    const l = createLearner();
    l.groupsUnlocked = KEY_GROUPS.length;
    start({ name, learner: l, rating: lvl.wpm, guest: true });
  });
  root.querySelector('button')?.focus();

  const players = [];
  let leg = 0;
  const rng = mulberry32(Date.now() >>> 0);

  function start(p2) {
    players.length = 0;
    players.push({ name: profile.name, learner: profile.learner, rating: Math.max(6, profile.learner.targetWpm), profile, steps: 0, correct: 0, wrong: 0, ms: 0, art: visitorArt('bee') });
    players.push({ ...p2, steps: 0, correct: 0, wrong: 0, ms: 0, art: BUTTERFLY });
    root.innerHTML = '';
    handoff();
  }

  const track = () => `<div class="race-track relay" aria-hidden="true">${players.map((p, i) => `<div class="lane p${i}"><span class="racer" style="left:calc(${Math.min(1, p.steps / GOAL) * 100}% - ${Math.min(1, p.steps / GOAL) * 44}px)"><svg viewBox="-34 -30 68 60">${p.art}</svg></span><span class="lane-name">${esc(p.name)}</span></div>`).join('')}<i class="finish-flower"></i></div>`;

  function handoff() {
    sub = null;
    const p = players[leg % 2];
    root.innerHTML = `<div class="card narrow relay-hand"><h2>Leg ${leg + 1} of ${LEGS_EACH * 2}</h2>${track()}
      <p>Pass the keyboard to <b>${esc(p.name)}</b>. Fingers on the home row!</p>
      <p class="muted small">${esc(p.name)} moves one step for every second of typing at their usual speed (${Math.round(p.rating)} WPM).</p>
      <button class="btn primary" data-act="go">${esc(p.name)} is ready</button></div>`;
    const b = root.querySelector('[data-act="go"]');
    b.addEventListener('click', runLeg);
    b.focus();
  }

  function runLeg() {
    root.innerHTML = '';
    const p = players[leg % 2];
    const lrng = mulberry32(rng() * 1e9);
    sub = lineRunner(game, {
      mode: 'relay',
      title: `${p.name}'s leg`,
      subtitle: `Leg ${leg + 1} of ${LEGS_EACH * 2}. The can empties in ${LEG_SECONDS} seconds once you start.`,
      seconds: LEG_SECONDS,
      keyboard: p.guest ? false : 'stage',
      learner: p.learner,
      recordStats: !p.guest,
      trackHTML: track(),
      nextLine: () => makeLine(lrng, p.learner, 5, { maxLen: 7 }),
      onProgress(state) {
        const now = p.steps + relaySteps(state.chars, p.rating);
        const r = state.root.querySelector(`.lane.p${leg % 2} .racer`);
        if (r) r.style.left = `calc(${Math.min(1, now / GOAL) * 100}% - ${Math.min(1, now / GOAL) * 44}px)`;
      },
      onDone(s) {
        p.steps += relaySteps(s.correct, p.rating);
        p.correct += s.correct;
        p.wrong += s.wrong;
        p.ms += s.activeMs;
        sub.destroy();
        sub = null;
        leg++;
        if (leg < LEGS_EACH * 2) handoff();
        else results();
      },
    });
  }

  function results() {
    const [a, b] = players;
    const diff = Math.abs(a.steps - b.steps);
    const winner = a.steps === b.steps ? null : a.steps > b.steps ? a : b;
    const line = !winner ? 'A perfect tie! The flower is shared.' : diff < 3 ? `${winner.name} wins by a whisker!` : `${winner.name} wins!`;
    const stat = (p) => {
      const mins = p.ms / 60000;
      const wpm = mins > 0 ? Math.round((p.correct / 5 / mins) * 10) / 10 : 0;
      const acc = p.correct + p.wrong ? p.correct / (p.correct + p.wrong) : 1;
      return { wpm, acc, mins };
    };
    for (const p of players) {
      if (p.guest || !p.profile) continue;
      const s = stat(p);
      const run = { mode: 'relay', wpm: s.wpm, accuracy: s.acc, correct: p.correct, minutes: s.mins };
      if (p.profile === profile) game.record(run);
      else {
        finishRun(p.profile, run, game.today());
        save(p.profile);
      }
    }
    game.audio.sparkle(10);
    root.innerHTML = `<div class="card narrow relay-hand"><h2>${esc(line)}</h2>${track()}
      <ul class="notes">${players.map((p) => {
        const s = stat(p);
        const vs = s.wpm >= p.rating ? `faster than their usual ${Math.round(p.rating)}` : `their usual is ${Math.round(p.rating)}`;
        return `<li><b>${esc(p.name)}</b>: ${s.wpm} WPM (${vs}) and ${Math.round(s.acc * 100)}% accuracy</li>`;
      }).join('')}</ul>
      <p class="pip-line">Pip: "Everybody who typed carefully is a winner in this garden. That's the rule. I just made it up."</p>
      <div class="row"><button class="btn primary" data-act="again">Rematch</button><button class="btn" data-act="home">Home</button></div></div>`;
    root.querySelector('[data-act="again"]').addEventListener('click', () => { leg = 0; for (const p of players) Object.assign(p, { steps: 0, correct: 0, wrong: 0, ms: 0 }); handoff(); });
    root.querySelector('[data-act="home"]').addEventListener('click', () => game.go('home'));
    root.querySelector('[data-act="again"]').focus();
  }

  return {
    get isPlay() { return !!sub; },
    onKey(ev, key, now) { if (!paused) sub?.onKey(ev, key, now); },
    tick(dt, now) { if (!paused) sub?.tick?.(dt, now); },
    pause() { paused = true; sub?.pause?.(); },
    resume() { paused = false; sub?.resume?.(); },
    destroy() { sub?.destroy(); root.remove(); },
  };
}
