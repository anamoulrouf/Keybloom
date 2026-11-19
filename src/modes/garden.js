// Garden Play: words drift across the garden on seed packets. Typing a word plants it in the bed.
// Clean words build the Bloom Chain (music layers join at 5/10/20/30); every 5 clean words the
// whole bed blooms. Nothing is lost: words that drift away go to the compost and come back later.
// About once every 5 minutes of play a gentle weather event happens: Rain Rush (catch falling
// letters in the barrel), Firefly Night (words ride on fireflies) or Windy Day (dandelion seeds).
// Winter beds add capitals and punctuation.
import { createField, addTarget, removeTarget, pressField, firstLetters } from '../core/typing-engine.js';
import { createMetrics, recordKey, pauseMetrics, summary } from '../core/metrics.js';
import { recordKeystroke, unlockedKeys } from '../core/adaptive.js';
import { pickWord, wordPool, winterize } from '../core/words.js';
import { mulberry32, pick } from '../core/rng.js';
import { seasonById } from '../core/progress.js';
import { BED_NAMES } from '../data/seasons.js';
import { RARE_IDS, BY_ID } from '../data/species.js';
import { COMPOST, BED_Y } from '../scene/scene.js';
import { puff, sparkle, flySeed } from '../scene/particles.js';
import { el, esc } from '../ui/dom.js';

const PACE = { calm: 1.4, normal: 1, breezy: 0.8 };
export const EVENT_EVERY_MS = 5 * 60 * 1000;
const EVENTS = {
  rain: { name: 'Rain Rush', secs: 30, tip: 'Catch the falling letters in the rain barrel!' },
  fireflies: { name: 'Firefly Night', secs: 40, tip: 'The fireflies are carrying words. Each one is worth extra dewdrops.' },
  wind: { name: 'Windy Day', secs: 40, tip: 'Dandelion seeds are dancing on the wind. Catch them as they swirl!' },
};
const LANES = [230, 300, 370, 440, 505];

const OBJECT_ART = {
  packet: (c) => `<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M4 6 h32 v38 h-32Z" fill="#FBF3E2" stroke="#D9C6A5" stroke-width="2"/><path d="M4 6 l4 -4 h24 l4 4" fill="#EADBC0"/><circle cx="20" cy="24" r="9" fill="${c}"/><path d="M20 33 v7" stroke="#6E9E62" stroke-width="2.5"/></svg>`,
  can: () => `<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M8 14 h22 v22 h-22Z" fill="#9EC3D6"/><path d="M30 18 l14 -10 l2 4 l-14 12" fill="#9EC3D6"/><path d="M12 14 q7 -12 14 0" stroke="#7FA7BD" stroke-width="3" fill="none"/></svg>`,
  golden: () => `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#FFF3C4" opacity=".7"/><ellipse cx="20" cy="21" rx="9" ry="12" fill="#F2C14E"/><path d="M20 9 q4 -6 9 -5" stroke="#6E9E62" stroke-width="2.5" fill="none"/></svg>`,
  firefly: () => `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#FFF7B8" opacity=".55"/><circle cx="20" cy="22" r="7" fill="#FFF09A"/><ellipse cx="14" cy="14" rx="6" ry="4" fill="#EAF4FB" opacity=".9"/><ellipse cx="26" cy="14" rx="6" ry="4" fill="#EAF4FB" opacity=".9"/><circle cx="20" cy="14" r="4" fill="#5C5248"/></svg>`,
  dandelion: () => `<svg viewBox="0 0 40 48" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<path d="M20 18 l0 -14" stroke="#E9E4DA" stroke-width="1.4" transform="rotate(${i * 30} 20 18)"/><circle cx="20" cy="4" r="2.2" fill="#FFFDF6" transform="rotate(${i * 30} 20 18)"/>`).join('')}<path d="M20 18 v28" stroke="#C9C2B6" stroke-width="1.5"/></svg>`,
  drop: () => `<svg viewBox="0 0 30 40" aria-hidden="true"><path d="M15 2 C 22 14, 27 20, 27 27 A 12 12 0 0 1 3 27 C 3 20, 8 14, 15 2Z" fill="#9FC9DE"/><ellipse cx="11" cy="26" rx="3" ry="5" fill="#D9ECF5"/></svg>`,
};

export function gardenMode(game, { season: seasonId, bed: bedIndex }) {
  const { profile, scene, audio } = game;
  const learner = profile.learner;
  const season = seasonById(seasonId);
  const bed = season.beds[bedIndex];
  const totalWords = bed.words;
  const rng = mulberry32((Date.now() ^ (bedIndex * 7919)) >>> 0);
  const pace = PACE[profile.settings.pace] || 1;

  const field = createField();
  const metrics = createMetrics();
  const objects = new Map(); // target id → { el, x, y, lane, speed, phase, kind, word }
  const compostQueue = [];
  const recent = new Set();
  let planted = 0;
  let chain = 0;
  let bestChain = 0;
  let spawnTimer = 0.4;
  let spawnedCount = 0;
  let paused = false;
  let ended = false;
  let time = 0;
  let golden = { at: Math.floor(totalWords * (0.3 + rng() * 0.4)), spawned: false, caught: null };
  let laneIndex = 0;
  const winter = seasonId === 'winter';
  const ambient = seasonId === 'autumn' ? 'leaves' : winter ? 'snow' : null;
  // Weather event: due after ~5 minutes of play (with a little jitter), starts partway into a bed.
  const eventDue = (profile.eventMs || 0) >= EVENT_EVERY_MS * (0.8 + rng() * 0.4);
  const eventKinds = winter ? ['rain', 'fireflies'] : seasonId === 'spring' ? ['rain', 'wind'] : ['rain', 'fireflies', 'wind'];
  const event = { kind: eventDue ? pick(rng, eventKinds) : null, at: Math.max(2, Math.floor(totalWords * 0.35)), active: false, left: 0, done: false, dropTimer: 0, caught: 0 };
  let bonusDew = 0;

  scene.setSeason(seasonId);
  scene.setTime(season.time);
  scene.setWeather(ambient);
  scene.clearRunBed();
  audio.setChain(0);

  const root = el(`<section class="screen play" aria-label="Garden Play">
    <header class="hud">
      <div class="hud-left card-soft"><strong>${esc(season.name)} · ${esc(BED_NAMES[bedIndex])}</strong><span class="planted"><b>0</b> / ${totalWords} planted</span></div>
      <div class="hud-right">
        <div class="can card-soft" title="Bloom chain"><svg viewBox="0 0 48 40" aria-hidden="true"><defs><clipPath id="canClip"><path d="M8 14 h22 v22 h-22Z"/></clipPath></defs><path d="M8 14 h22 v22 h-22Z" fill="#E7EEF2"/><rect class="can-fill" x="8" y="36" width="22" height="0" fill="#8FC3E8" clip-path="url(#canClip)"/><path d="M30 18 l14 -10 l2 4 l-14 12" fill="#B9D3E0"/><path d="M8 14 h22 v22 h-22Z" fill="none" stroke="#7FA7BD" stroke-width="2"/></svg><span class="chain">Bloom chain <b>0</b></span></div>
        <div class="barrel card-soft" hidden title="Rain barrel"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 8 h24 l-2 28 h-20Z" fill="#B58C66"/><path d="M8 16 h24 M9 28 h22" stroke="#8B6B4E" stroke-width="2"/><rect class="barrel-fill" x="10" y="36" width="20" height="0" fill="#9FC9DE"/></svg><b>0</b></div>
        <button class="icon-btn" data-act="pause" aria-label="Pause">❚❚</button>
      </div>
    </header>
    <div class="drift-layer"></div>
    <p class="play-tip">Type a word to plant it. <kbd>Backspace</kbd> lets go of a word. <kbd>Esc</kbd> pauses.</p>
  </section>`);
  game.app.appendChild(root);
  const layer = root.querySelector('.drift-layer');
  root.querySelector('[data-act="pause"]').addEventListener('click', () => game.pauseMenu());
  setTimeout(() => root.querySelector('.play-tip')?.classList.add('fade'), 6000);

  const fill = root.querySelector('.can-fill');
  function updateHud() {
    root.querySelector('.planted b').textContent = planted;
    root.querySelector('.chain b').textContent = chain;
    const level = (chain % 5) / 5 || (chain > 0 && chain % 5 === 0 ? 1 : 0);
    fill.setAttribute('y', String(36 - 22 * level));
    fill.setAttribute('height', String(22 * level));
  }

  // Seconds between words, from the child's target speed with ~30% slack.
  function spawnInterval() {
    const charsPerSec = (learner.targetWpm * 5) / 60;
    return Math.max(1.6, (5.2 / charsPerSec) * 1.3 * pace);
  }
  function maxOnScreen() {
    const starts = new Set(wordPool(unlockedKeys(learner)).map((w) => w[0]));
    const letters = unlockedKeys(learner).filter((k) => /[a-z]/.test(k)).length;
    return Math.max(1, Math.min(4, Math.max(starts.size, Math.min(letters, 2))));
  }
  function bounds() {
    const v = scene.visibleX();
    return { left: v.left - 60, right: Math.min(v.right - 90, COMPOST.x - 30) };
  }

  function takenLetters() {
    return new Set([...firstLetters(field)].map((c) => c.toLowerCase()));
  }

  function spawn() {
    const taken = takenLetters();
    let word = null, kind = 'packet';
    // Review words from the compost come back first, if their first letter is free.
    const qi = compostQueue.findIndex((w) => !taken.has(w[0].toLowerCase()));
    if (qi >= 0 && spawnedCount % 2 === 1) word = compostQueue.splice(qi, 1)[0];
    if (!word && !golden.spawned && planted >= golden.at) {
      const longs = wordPool(unlockedKeys(learner)).filter((w) => w.length >= 5 && !taken.has(w[0]));
      if (longs.length) {
        word = pick(rng, longs);
        kind = 'golden';
        golden.spawned = true;
      }
    }
    if (!word) {
      word = pickWord(rng, learner, { excludeFirst: taken, avoid: recent });
      if (word && winter) word = winterize(rng, word, bedIndex);
    } else if (winter && kind === 'golden') word = winterize(rng, word, bedIndex);
    if (!word) return false;
    recent.add(word.toLowerCase().replace(/[^a-z]/g, ''));
    if (recent.size > 12) recent.delete(recent.values().next().value);
    if (kind === 'packet' && rng() < 0.2) kind = 'can';
    if (kind !== 'golden' && event.active && event.kind === 'fireflies') kind = 'firefly';
    if (kind !== 'golden' && event.active && event.kind === 'wind') kind = 'dandelion';
    const t = addTarget(field, word, { clean: true });
    const node = el(`<div class="drifter ${kind}" role="img" aria-label="${esc(word)}">
      <span class="obj">${OBJECT_ART[kind] && kind !== 'packet' ? OBJECT_ART[kind]() : OBJECT_ART.packet(bed ? BY_ID[bed.species].petal.replace('rainbow', '#F49AA0') : '#F4BFA6')}</span>
      <span class="word">${[...word].map((c) => `<span class="ch">${esc(c)}</span>`).join('')}</span></div>`);
    layer.appendChild(node);
    const b = bounds();
    const lane = LANES[laneIndex++ % LANES.length];
    const crossTime = Math.max(14, spawnInterval() * maxOnScreen() * 1.15);
    const speed = ((b.right - b.left) / crossTime) * (kind === 'dandelion' ? 1.1 : 1);
    objects.set(t.id, { el: node, x: b.left, lane, y: lane, speed, phase: rng() * 6, kind, word, target: t, wave: kind === 'dandelion' ? 46 : kind === 'firefly' ? 24 : 12 });
    spawnedCount++;
    return true;
  }

  // ── Weather events ──────────────────────────────────────────────────────────
  const barrel = root.querySelector('.barrel');
  function startEvent() {
    const info = EVENTS[event.kind];
    event.active = true;
    event.left = info.secs;
    profile.eventMs = 0;
    game.toast(`<b>${info.name}!</b> ${info.tip}`, 4500);
    audio.chime();
    if (event.kind === 'rain') { scene.setWeather('rain'); barrel.hidden = false; }
    if (event.kind === 'fireflies') { scene.setTime('night'); scene.setWeather('fireflies'); }
    if (event.kind === 'wind') scene.setWeather('wind');
  }
  function endEvent() {
    event.active = false;
    event.done = true;
    scene.setTime(season.time);
    scene.setWeather(ambient);
    for (const o of [...objects.values()]) if (o.kind === 'drop') splash(o);
    if (event.kind === 'rain' && event.caught) game.say(`${event.caught} raindrops in the barrel. That's ${event.caught} bonus dewdrops!`, 3500);
    setTimeout(() => { barrel.hidden = true; }, 2500);
  }
  function spawnDrop() {
    const taken = takenLetters();
    const letters = unlockedKeys(learner).filter((k) => /[a-z]/.test(k) && !taken.has(k));
    if (!letters.length) return;
    const ch = pick(rng, letters);
    const t = addTarget(field, ch, { clean: true });
    const node = el(`<div class="drifter drop" role="img" aria-label="${esc(ch)}"><span class="obj">${OBJECT_ART.drop()}</span><span class="word"><span class="ch">${esc(ch)}</span></span></div>`);
    layer.appendChild(node);
    const v = scene.visibleX();
    const x = v.left + 120 + rng() * Math.max(100, Math.min(COMPOST.x - 160, v.right - 160) - v.left - 120);
    const fall = Math.max(5, 7 * pace * (12 / Math.max(8, learner.targetWpm)) ** 0.5);
    objects.set(t.id, { el: node, x, y: 110, lane: 110, speed: 0, fallSpeed: (BED_Y - 190) / fall, phase: 0, kind: 'drop', word: ch, target: t });
  }
  function splash(o) {
    removeTarget(field, o.target.id);
    objects.delete(o.target.id);
    o.el.classList.add('fade-out');
    setTimeout(() => o.el.remove(), 600);
  }

  function place(o) {
    const p = scene.toScreen(o.x, o.y);
    o.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }

  function charEls(o) {
    return o.el.querySelectorAll('.word .ch');
  }

  function showProgress(o) {
    charEls(o).forEach((c, i) => {
      c.classList.toggle('done', i < o.target.pos);
      c.classList.toggle('cur', i === o.target.pos);
    });
    o.el.classList.toggle('locked', field.locked && field.locked.id === o.target.id);
  }

  function toCompost(o) {
    removeTarget(field, o.target.id);
    objects.delete(o.target.id);
    if (o.kind !== 'golden') compostQueue.push(o.word);
    else game.say('The golden seed floated off. Maybe next time!', 3500);
    const c = scene.toScreen(COMPOST.x, COMPOST.y - 20);
    o.el.classList.add('to-compost');
    o.el.style.transform = `translate(${c.x}px, ${c.y}px) scale(.3)`;
    setTimeout(() => o.el.remove(), 900);
    if (compostQueue.length === 1 && planted < 3) game.say('No rush. Words in the compost come back around.', 3500);
  }

  function bedSlotX(i) {
    const v = scene.visibleX();
    const left = Math.max(60, v.left + 70);
    const right = Math.min(COMPOST.x - 90, v.right - 70);
    return left + ((right - left) * (i + 0.5)) / totalWords;
  }

  function complete(o) {
    objects.delete(o.target.id);
    if (o.kind === 'drop') {
      event.caught++;
      bonusDew += 1;
      audio.sparkle(3);
      const b = o.el.getBoundingClientRect();
      puff(b.left + b.width / 2, b.top + 10, 5, ['#9FC9DE', '#D9ECF5', '#BFD9EA']);
      o.el.classList.add('picked');
      setTimeout(() => o.el.remove(), 350);
      barrel.querySelector('b').textContent = event.caught;
      const lvl = Math.min(1, event.caught / 12);
      barrel.querySelector('.barrel-fill').setAttribute('y', String(36 - 26 * lvl));
      barrel.querySelector('.barrel-fill').setAttribute('height', String(26 * lvl));
      return;
    }
    if (o.kind === 'firefly') bonusDew += 2;
    if (o.kind === 'dandelion') bonusDew += 1;
    const clean = o.target.clean;
    chain = clean ? chain + 1 : 0;
    bestChain = Math.max(bestChain, chain);
    audio.setChain(chain);
    audio.pop();
    const from = o.el.getBoundingClientRect();
    const fx = from.left + from.width / 2, fy = from.top + from.height / 2;
    puff(fx, fy, o.kind === 'golden' ? 16 : 7);
    o.el.classList.add('picked');
    setTimeout(() => o.el.remove(), 350);
    if (o.kind === 'golden') {
      golden.caught = pick(rng, RARE_IDS);
      audio.sparkle(10);
      game.say(`A golden seed! It's a ${BY_ID[golden.caught].name}. I'll plant it in your garden.`, 4200);
      scene.setPipPose('cheer');
      setTimeout(() => scene.setPipPose('idle'), 1600);
      updateHud();
      return;
    }
    const slot = planted;
    planted++;
    const x = bedSlotX(slot);
    const to = scene.toScreen(x, BED_Y);
    flySeed(fx, fy, to.x, to.y).then(() => {
      scene.addRunPlant(x, bed.species, clean ? 0.66 : 0.5, slot * 31 + 7);
      if (chain > 0 && chain % 5 === 0) bloomWave();
    });
    updateHud();
    if (planted >= totalWords) endRun();
  }

  function bloomWave() {
    scene.bloomAll();
    audio.sparkle(9);
    scene.setPipPose('cheer');
    setTimeout(() => scene.setPipPose('idle'), 1500);
    const v = scene.visibleX();
    for (let i = 0; i < 6; i++) {
      const p = scene.toScreen(v.left + ((v.right - v.left) * (i + 0.5)) / 6, BED_Y - 60);
      setTimeout(() => puff(p.x, p.y, 6), i * 90);
    }
    const lines = ['The whole bed is blooming!', 'Listen. The garden is singing along.', 'Five clean words. Look at that!', 'Smooth typing makes the flowers open.'];
    if (chain === 5 || chain % 10 === 0) game.say(chain >= 20 ? `A ${chain}-word chain. The garden orchestra is here!` : pick(rng, lines), 3000);
  }

  function endRun() {
    if (ended) return;
    ended = true;
    for (const o of objects.values()) o.el.classList.add('fade-out');
    setTimeout(() => {
      scene.bloomAll();
      audio.sparkle(12);
      const s = summary(metrics);
      setTimeout(() => {
        game.finish({
          mode: 'garden', season: seasonId, bed: bedIndex,
          wpm: s.wpm, accuracy: s.accuracy, correct: s.correct, minutes: s.activeMs / 60000,
          golden: golden.caught, bestChain, keyTimes: metrics.keyTimes, words: planted, bonusDew,
        });
      }, 1400);
    }, 600);
  }

  return {
    isPlay: true,
    onKey(ev, key, now) {
      if (paused || ended) return;
      const r = pressField(field, key);
      if (r.type === 'ignored') return;
      if (r.type === 'release') {
        const o = objects.get(r.target.id);
        if (o) showProgress(o);
        audio.resetKeyStep();
        return;
      }
      const ok = r.type === 'correct' || r.type === 'complete';
      const gap = recordKey(metrics, ok, now);
      recordKeystroke(learner, r.expected ?? (r.target ? r.target.text[r.target.pos] : null), ok, gap);
      if (ok) {
        audio.keyNote();
        const o = objects.get(r.target.id);
        if (!o) return;
        if (r.type === 'complete') {
          complete(o);
        } else {
          showProgress(o);
          const c = charEls(o)[r.target.pos - 1];
          if (c) {
            const b = c.getBoundingClientRect();
            sparkle(b.left + b.width / 2, b.top);
          }
        }
      } else {
        audio.tok();
        if (r.target) {
          r.target.clean = false;
          const o = objects.get(r.target.id);
          const c = o && charEls(o)[r.target.pos];
          if (c) {
            c.classList.remove('miss');
            void c.offsetWidth;
            c.classList.add('miss');
          }
          if (chain >= 5) audio.setChain(0);
          chain = 0;
          updateHud();
        } else {
          layer.classList.remove('nudge');
          void layer.offsetWidth;
          layer.classList.add('nudge');
        }
      }
    },
    tick(dt) {
      if (paused || ended) return;
      time += dt;
      profile.eventMs = (profile.eventMs || 0) + dt * 1000;
      if (event.kind && !event.active && !event.done && planted >= event.at) startEvent();
      if (event.active) {
        event.left -= dt;
        if (event.left <= 0) endEvent();
      }
      const raining = event.active && event.kind === 'rain';
      if (raining) {
        event.dropTimer -= dt;
        const drops = [...objects.values()].filter((o) => o.kind === 'drop').length;
        if (event.dropTimer <= 0 && drops < 3) {
          spawnDrop();
          event.dropTimer = Math.max(0.9, spawnInterval() * 0.45);
        }
      }
      spawnTimer -= dt;
      const words = [...objects.values()].filter((o) => o.kind !== 'drop').length;
      const want = !raining && (words === 0 || (spawnTimer <= 0 && words < maxOnScreen()));
      if (want && planted + words < totalWords + (golden.spawned && !golden.caught ? 1 : 0) + 1) {
        if (spawn()) spawnTimer = spawnInterval();
        else spawnTimer = 0.5;
      }
      const b = bounds();
      for (const o of [...objects.values()]) {
        const lockedHere = field.locked && field.locked.id === o.target.id;
        if (o.kind === 'drop') {
          o.y += o.fallSpeed * dt;
          o.x += Math.sin(time * 1.3 + o.target.id) * 4 * dt;
          place(o);
          if (o.y > BED_Y - 80) splash(o);
          continue;
        }
        o.x += o.speed * dt * (lockedHere ? 0.35 : 1); // the word you're typing slows down for you
        o.y = o.lane + Math.sin(time * (o.kind === 'dandelion' ? 1.1 : 0.7) + o.phase) * (o.wave || 12);
        place(o);
        if (o.x > b.right) toCompost(o);
      }
    },
    pause() {
      paused = true;
      pauseMetrics(metrics);
    },
    resume() { paused = false; },
    destroy() {
      root.remove();
      audio.setChain(0);
      scene.setWeather(null);
    },
  };
}
