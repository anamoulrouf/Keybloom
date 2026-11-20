// Keybloom entry: loads the active gardener, builds the garden scene and music, routes between
// screens, and sends every keystroke to the active screen.
import { createScene } from './scene/scene.js';
import { pipSVG } from './scene/pip.js';
import { VISITORS } from './scene/visitors.js';
import { createAudio } from './audio/music.js';
import { load, save, rollDay } from './ui/save.js';
import { normalizeKey } from './core/typing-engine.js';
import { growOvernight, dayNumber } from './core/growth.js';
import { finishRun, visitorsFor, revealMysteries, requestEvent, featureSet, nextBed } from './core/progress.js';
import { ensureRequests } from './core/requests.js';
import { placementFrom } from './core/adaptive.js';
import { gardenMode } from './modes/garden.js';
import { lessonMode } from './modes/lesson.js';
import { dailyMode } from './modes/daily.js';
import { seedTestMode } from './modes/seedtest.js';
import { beeRaceMode } from './modes/bee-race.js';
import { relayMode } from './modes/relay.js';
import { storiesScreen, storyMode } from './modes/story.js';
import { sandboxMode } from './modes/sandbox.js';
import { harvestMode } from './modes/harvest.js';
import { greenhouseMode } from './modes/greenhouse.js';
import { islamicScreen, islamicLesson } from './modes/islamic.js';
import {
  titleScreen, welcomeScreen, sitScreen, homeScreen, mapScreen, resultsScreen,
  almanacScreen, journalScreen, shopScreen, settingsScreen, endingScreen, touchScreen,
} from './ui/screens.js';
import { parentScreen } from './ui/parent.js';
import { profilesScreen, visitScreen } from './ui/profiles.js';
import { el, esc } from './ui/dom.js';
import { BY_ID } from './data/species.js';
import { SEASONS } from './data/seasons.js';

const { profile, status } = load();
const today = dayNumber();
rollDay(profile, today);

const scene = createScene(document.getElementById('scene'));
const audio = createAudio();
const app = document.getElementById('app');
let current = null;
let currentName = '';
let pausedOverlay = null;
let playMsThisSession = 0;
let breakNudged = false;
let capsWarnAt = 0;

const game = {
  profile, scene, audio, app,
  persist: () => save(profile),
  today: () => dayNumber(),
  go,
  finish,
  record,
  say,
  toast,
  pauseMenu,
  refreshGarden,
  refreshPip,
  updateSettings,
  reducedMotion: () => (profile.settings.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches),
};

const SCREENS = {
  title: () => titleScreen(game),
  touch: () => touchScreen(game),
  profiles: () => profilesScreen(game),
  welcome: () => welcomeScreen(game),
  sit: () => sitScreen(game),
  seedtest: () => seedTestMode(game, { onDone: placed }),
  home: () => homeScreen(game),
  map: () => mapScreen(game),
  garden: (args) => gardenMode(game, args),
  lesson: () => lessonMode(game),
  daily: () => dailyMode(game),
  race: () => beeRaceMode(game),
  relay: () => relayMode(game),
  stories: () => storiesScreen(game),
  story: (args) => storyMode(game, args),
  words: () => sandboxMode(game),
  harvest: (args) => harvestMode(game, args),
  greenhouse: () => greenhouseMode(game),
  islamic: (args) => islamicScreen(game, args),
  'islamic-lesson': (args) => islamicLesson(game, args),
  results: (args) => resultsScreen(game, args),
  almanac: () => almanacScreen(game),
  journal: () => journalScreen(game),
  shop: () => shopScreen(game),
  settings: () => settingsScreen(game),
  parent: () => parentScreen(game),
  visit: (args) => visitScreen(game, args),
  ending: () => endingScreen(game),
};

function go(name, args = {}) {
  closePause();
  current?.destroy?.();
  currentName = name;
  document.body.dataset.screen = name;
  if (name !== 'visit') restoreOwnGarden();
  // Islamic Life is calm and music-free: only nature sounds and soft clicks.
  audio.setQuiet(name.startsWith('islamic') || (name === 'results' && args.run?.mode === 'islamic'));
  current = SCREENS[name](args);
  if (!current?.isPlay && name !== 'harvest') scene.setWeather(null);
  if (name === 'home') homeGreeting();
}

// ── Pip speaks ───────────────────────────────────────────────────────────────
const bubble = el('<div class="pip-bubble" role="status" aria-live="polite"></div>');
document.body.appendChild(bubble);
let bubbleTimer = null;
function say(text, ms = 4000) {
  const p = scene.toScreen(215, 520);
  bubble.style.left = `${Math.max(8, p.x)}px`;
  bubble.style.top = `${Math.max(8, p.y - 40)}px`;
  bubble.textContent = text;
  bubble.classList.add('on');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('on'), ms);
}

const toastEl = document.getElementById('toast');
let toastTimer = null;
const toastQueue = [];
function toast(html, ms = 3500) {
  if (toastEl.classList.contains('on')) {
    toastQueue.push([html, ms]);
    return;
  }
  toastEl.innerHTML = html;
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('on');
    const next = toastQueue.shift();
    if (next) setTimeout(() => toast(...next), 450);
  }, ms);
}

// ── Garden ───────────────────────────────────────────────────────────────────
let showingOther = false;
function refreshGarden() {
  showingOther = false;
  scene.renderHome(profile.homeGarden);
  scene.renderDecor(profile.decor);
  scene.renderMeadow(profile.meadow);
  scene.renderStoryTree(profile.storyPages);
  scene.renderSign(profile.notes);
  const vis = visitorsFor(profile, VISITORS);
  scene.renderVisitors(vis);
  const fresh = vis.filter((v) => !profile.visitorsSeen.includes(v));
  if (fresh.length) {
    profile.visitorsSeen.push(...fresh);
    const r = requestEvent(profile, { kind: 'visitor', amount: fresh.length }, dayNumber());
    persistSoon();
    const v = VISITORS.find((x) => x.id === fresh[0]);
    setTimeout(() => toast(`<b>A visitor!</b> ${esc(v.name)} came to your garden. Look in the Almanac.`, 5000), 1200);
    if (r.done.length) setTimeout(() => toast(`<b>Request done!</b> ${esc(r.done[0].text)} (+${r.dew} dewdrops)`, 4500), 1400);
  }
}
/** Garden visits draw someone else's garden; anything else puts ours back. */
game.showGarden = (other) => {
  showingOther = true;
  scene.renderHome(other.homeGarden);
  scene.renderDecor(other.decor);
  scene.renderMeadow(other.meadow);
  scene.renderStoryTree(other.storyPages);
  scene.renderSign(other.notes);
  scene.renderVisitors(visitorsFor(other, VISITORS));
};
function restoreOwnGarden() {
  if (showingOther) refreshGarden();
}

function refreshPip() {
  scene.svg.querySelector('#pip').innerHTML = pipSVG(profile.scarf);
}

let persistTimer = null;
function persistSoon() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => save(profile), 300);
}

const grownToday = growOvernight(profile.homeGarden, today);
const revealedToday = revealMysteries(profile);
ensureRequests(profile, today, featureSet(profile));
let greeted = false;
function homeGreeting() {
  const name = profile.name || 'friend';
  const nb = nextBed(profile);
  scene.setSeason(nb.season);
  if (!greeted) {
    greeted = true;
    const unread = profile.notes.filter((n) => !n.read);
    if (unread.length) {
      for (const n of unread) toast(`<b>A note on your garden sign from ${esc(n.from)}:</b> “${esc(n.text)}”`, 6500);
      unread.forEach((n) => { n.read = true; });
      persistSoon();
      setTimeout(() => scene.renderSign(profile.notes), 7000);
    }
    if (revealedToday.length) {
      const names = revealedToday.map((id) => BY_ID[id].name);
      say(`The mystery seed bloomed! It's a ${names[0]}. I've added it to the Almanac.`, 6000);
      return;
    }
    if (grownToday.length) {
      const bloomed = grownToday.filter((p) => p.stage === 4 && !p.mystery);
      say(bloomed.length ? `Look, ${name}! Your ${BY_ID[bloomed[0].species].name.toLowerCase()} bloomed overnight!` : `Welcome back, ${name}. Your garden grew while you were away.`, 5000);
      return;
    }
    if (status === 'recovered') {
      say('Hmm, I could not read your old save, so we are starting a fresh garden.', 5000);
      return;
    }
  }
  const lines = [
    `Hi ${name}. Shall we start with a little watering?`,
    'Fingers on the home row, and off we go.',
    'Careful typing grows the strongest plants.',
    'The bees are humming. They like it when you type smoothly.',
    'Have you checked my requests this week? No pressure. Well, a little pressure. Tiny.',
  ];
  say(lines[Math.floor(Math.random() * lines.length)], 3500);
}

// ── Runs ─────────────────────────────────────────────────────────────────────
/** Applies a run to the profile and saves. Returns the report (no screen change). */
function record(run) {
  const report = finishRun(profile, run, dayNumber());
  if ((run.mode === 'garden' || run.mode === 'race') && run.keyTimes && run.keyTimes.length >= 40 && (!profile.ghost || run.wpm > profile.ghost.wpm)) {
    profile.ghost = { wpm: run.wpm, keyTimes: run.keyTimes.slice(0, 400) };
  }
  save(profile);
  refreshGarden();
  return report;
}

function finish(run) {
  const report = record(run);
  let pip = null;
  const breakMs = (profile.settings.breakMins || 0) * 60 * 1000;
  if (breakMs && !breakNudged && playMsThisSession > breakMs) {
    breakNudged = true;
    pip = 'You have been typing for a while. Time to stretch your fingers and sip some water!';
  } else if (run.mode === 'islamic') pip = null;
  else if (run.mode === 'race') pip = run.won ? 'The bee is buzzing about your race. Happily.' : 'The bee was quick today. It only knows your best run, so it is really you you are racing.';
  else if (run.accuracy >= 0.95) pip = 'Neat as a row of seedlings. Lovely.';
  else if (run.accuracy < 0.85) pip = 'Slow and careful wins in the garden. Try finding the bump on F again.';
  if (report.ending) return go('ending');
  go('results', { run, report, pip });
}

function placed(result) {
  const where = placementFrom(profile.learner, result);
  profile.placed = true;
  profile.onboarded = true;
  profile.placedSeason = where;
  save(profile);
  go('home');
  if (result.skipped) say("We'll start at the beginning: A S D F with your left hand, and L with your right. Feel the bump on F? That's home.", 6000);
  else say(where === 'summer'
    ? `Wow, ${Math.round(result.wpm)} words a minute! You can start in Summer.`
    : `Nice! ${Math.round(result.wpm)} words a minute. We'll start in Spring and grow from there.`, 6000);
}

// ── Pause ────────────────────────────────────────────────────────────────────
function pauseMenu() {
  if (pausedOverlay || !current?.isPlay) return;
  current.pause?.();
  pausedOverlay = el(`<div class="overlay" role="dialog" aria-label="Paused"><div class="card narrow">
    <h2>Paused</h2><p class="muted">The garden will wait for you.</p>
    <div class="col">
      <button class="btn primary" data-p="resume">Keep going</button>
      <button class="btn" data-p="mute">${profile.settings.muted ? 'Sound on' : 'Mute sound'}</button>
      <button class="btn" data-p="leave">Leave and go home</button>
    </div></div></div>`);
  document.body.appendChild(pausedOverlay);
  pausedOverlay.querySelector('[data-p="resume"]').focus();
  pausedOverlay.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]');
    if (!b) return;
    if (b.dataset.p === 'resume') closePause(true);
    if (b.dataset.p === 'mute') {
      updateSettings({ muted: !profile.settings.muted });
      b.textContent = profile.settings.muted ? 'Sound on' : 'Mute sound';
    }
    if (b.dataset.p === 'leave') go('home');
  });
}
function closePause(resume = false) {
  if (!pausedOverlay) return;
  pausedOverlay.remove();
  pausedOverlay = null;
  if (resume) current?.resume?.();
}

// ── Settings ─────────────────────────────────────────────────────────────────
function updateSettings(partial) {
  Object.assign(profile.settings, partial);
  applySettings();
  persistSoon();
}
function applySettings() {
  const s = profile.settings;
  const b = document.body.classList;
  b.toggle('font-dyslexic', s.font === 'dyslexic');
  b.remove('ts-0', 'ts-1', 'ts-2');
  b.add(`ts-${s.textSize}`);
  b.toggle('reduced', game.reducedMotion());
  b.remove('pace-calm', 'pace-normal', 'pace-breezy');
  b.add(`pace-${s.pace}`);
  audio.set({ master: s.master, music: s.music, sfx: s.sfx, nature: s.nature, natureOn: s.natureOn, muted: s.muted });
}

// ── Input ────────────────────────────────────────────────────────────────────
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') {
    if (pausedOverlay) closePause(true);
    else if (current?.isPlay) pauseMenu();
    return;
  }
  if (!current?.isPlay || pausedOverlay) return;
  const key = normalizeKey(ev);
  if (key == null) return;
  // Stop the page scrolling (space), going back (Backspace) or opening quick-find (' and /).
  ev.preventDefault();
  if (ev.getModifierState && ev.getModifierState('CapsLock') && /[A-Z]/.test(key) && performance.now() - capsWarnAt > 15000) {
    capsWarnAt = performance.now();
    toast('<b>Caps Lock is on.</b> Tap the Caps Lock key to turn it off. For capitals, hold Shift instead.');
  }
  // Caps Lock flips letters: undo that, so capitals only come from Shift (as Winter teaches).
  const caps = ev.getModifierState?.('CapsLock');
  const k = caps && /^[A-Za-z]$/.test(key) ? (key === key.toUpperCase() ? key.toLowerCase() : key.toUpperCase()) : key;
  current.onKey(ev, k, performance.now());
});

function autoPause() {
  if (current?.isPlay && !pausedOverlay) pauseMenu();
}
window.addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    autoPause();
    audio.suspend();
  } else audio.resume();
});

// ── Loop ─────────────────────────────────────────────────────────────────────
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  scene.tick(dt);
  if (current?.isPlay && !pausedOverlay) {
    playMsThisSession += dt * 1000;
    current.tick?.(dt, now);
  }
  requestAnimationFrame(frame);
}

applySettings();
refreshPip();
refreshGarden();
scene.setTime('morning');
scene.setSeason(nextBed(profile).season);
save(profile);
const touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;
go(touchOnly ? 'touch' : 'title');
requestAnimationFrame(frame);
window.__keybloom = game; // handy for debugging in the console
export { SEASONS };
