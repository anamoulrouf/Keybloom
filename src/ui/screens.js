// Menu screens: title, onboarding, home ("Today's Path"), season map, results, Almanac, journal,
// shop, settings and the story's ending. Each returns { destroy } like the play modes.
import { el, esc } from './dom.js';
import { SEASONS, BED_NAMES, JOURNAL } from '../data/seasons.js';
import { SPECIES, BY_ID } from '../data/species.js';
import { VISITORS, visitorArt } from '../scene/visitors.js';
import { DECOR } from '../scene/decor.js';
import { plantSVG } from '../scene/plant-gen.js';
import { bedOpen, seasonOpen, nextBed, harvestOpen, features, pendingHarvest } from '../core/progress.js';
import { ensureRequests } from '../core/requests.js';
import { unlockedKeys, KEY_GROUPS } from '../core/adaptive.js';
import { WHISPERS, SECRET_WORDS } from '../data/garden-words.js';
import { listProfiles } from './save.js';
import { islamicNext } from '../modes/islamic.js';

function mount(game, html, wire) {
  const root = el(html);
  game.app.appendChild(root);
  root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => game.go(b.dataset.go, b.dataset.args ? JSON.parse(b.dataset.args) : {})));
  wire?.(root);
  const first = root.querySelector('[autofocus], .btn.primary, button:not(:disabled)');
  first?.focus({ preventScroll: true });
  return { destroy: () => root.remove(), root };
}

const flowerIcons = (n, max = 3) => Array.from({ length: max }, (_, i) => `<i class="fl ${i < n ? 'on' : ''}" aria-hidden="true"></i>`).join('');
const args = (o) => `data-args='${JSON.stringify(o)}'`;

// ── Title ────────────────────────────────────────────────────────────────────
export function titleScreen(game) {
  const p = game.profile;
  const many = listProfiles().profiles.length > 1;
  return mount(game, `<section class="screen center" aria-label="Keybloom">
    <div class="title card">
      <h1>Keybloom</h1>
      <p class="tag">A calm garden where your typing makes things grow.</p>
      <button class="btn primary big" data-act="start" autofocus>${p.onboarded ? `Back to the garden` : 'Start'}</button>
      ${p.onboarded ? `<p class="small">Gardener: <b>${esc(p.name)}</b></p>` : ''}
      <p><button class="btn small" data-go="profiles">${many ? 'Switch gardener' : 'Add another gardener'}</button></p>
      <p class="small muted">Sound on? The music is soft and you can change it anytime.</p>
    </div>
  </section>`, (r) => {
    r.querySelector('[data-act="start"]').addEventListener('click', () => {
      game.audio.start();
      game.go(game.profile.onboarded ? 'home' : 'welcome');
    });
  });
}

/** Touch-only devices: a friendly note instead of a game that can't be played. */
export function touchScreen(game) {
  return mount(game, `<section class="screen center" aria-label="Grab a keyboard">
    <div class="title card narrow">
      <h1>Keybloom</h1>
      <p class="tag">This garden grows with a real keyboard.</p>
      <p>Keybloom teaches touch typing, so it needs keys you can feel. Connect a keyboard to this tablet, or play on a laptop or desktop computer.</p>
      <button class="btn primary" data-go="title">I have a keyboard</button>
    </div></section>`);
}

// ── Onboarding ───────────────────────────────────────────────────────────────
export function welcomeScreen(game) {
  const p = game.profile;
  return mount(game, `<section class="screen center" aria-label="Welcome">
    <form class="card narrow" data-act="form">
      <h2>Hello! I'm Pip.</h2>
      <p>I look after this garden. It's been asleep for a long time, and I could use a helper. What should I call you?</p>
      <label>Your name or nickname <input name="name" maxlength="20" autocomplete="off" value="${esc(p.name)}" autofocus required></label>
      <label>Name your garden <input name="garden" maxlength="28" autocomplete="off" placeholder="The Moonlit Patch" value="${esc(p.garden)}"></label>
      <p class="small muted">Names stay on this computer. Nothing is sent anywhere.</p>
      <button class="btn primary" type="submit">Nice to meet you</button>
    </form>
  </section>`, (r) => {
    r.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      p.name = String(fd.get('name') || '').trim().slice(0, 20) || 'Gardener';
      p.garden = String(fd.get('garden') || '').trim().slice(0, 28) || 'The Sleepy Garden';
      game.persist();
      game.go('sit');
    });
  });
}

export function sitScreen(game) {
  return mount(game, `<section class="screen center" aria-label="How to sit">
    <div class="card narrow">
      <h2>Before we plant: get comfy</h2>
      <div class="sit-grid">
        <svg viewBox="0 0 345 110" class="hands" aria-hidden="true">
          ${['a', 's', 'd', 'f', 'j', 'k', 'l', ';'].map((k, i) => `<g transform="translate(${18 + i * 37 + (i > 3 ? 20 : 0)} 52)"><rect width="32" height="32" rx="7" class="hk ${'fj'.includes(k) ? 'bump' : ''}"/><text x="16" y="21" text-anchor="middle">${k}</text>${'fj'.includes(k) ? '<rect x="11" y="25" width="10" height="3" rx="1.5" fill="#3D4A3F"/>' : ''}</g>`).join('')}
          ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<ellipse cx="${34 + i * 37 + (i > 3 ? 20 : 0)}" cy="40" rx="11" ry="16" class="finger"/>`).join('')}
        </svg>
        <ul>
          <li>Sit up tall with your feet on the floor.</li>
          <li>Find the little <b>bumps</b> on <kbd>F</kbd> and <kbd>J</kbd>. Rest your pointer fingers there.</li>
          <li>Let your other fingers rest on <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> and <kbd>K</kbd> <kbd>L</kbd> <kbd>;</kbd>.</li>
          <li>Thumbs float over the space bar. Eyes on the screen!</li>
        </ul>
      </div>
      <p>Next is a one-minute <b>Seed Test</b> so I know where to start. Slow and steady is perfect.</p>
      <button class="btn primary" data-go="seedtest">I'm ready</button>
    </div>
  </section>`);
}

// ── Home ─────────────────────────────────────────────────────────────────────
export function homeScreen(game) {
  const p = game.profile;
  const done = p.today.done || {};
  const nb = nextBed(p);
  const season = SEASONS.find((s) => s.id === nb.season);
  game.scene.setTime(season.time);
  game.scene.setSeason(season.id);
  game.scene.clearRunBed();
  const step = (key, title, sub, go, a) => `<li class="${done[key] ? 'done' : ''}"><button class="path-btn" data-go="${go}" ${a ? args(a) : ''}><span class="check" aria-hidden="true"></span><span><b>${title}</b><small>${sub}</small></span></button></li>`;
  const keys = unlockedKeys(p.learner).filter((k) => /[a-z;,.]/.test(k));
  const f = features(p);
  const harvest = pendingHarvest(p);
  const hs = harvest && SEASONS.find((s) => s.id === harvest);
  const tile = (id, go, label, sub) => `<button class="mode-tile ${f[id].open ? '' : 'locked'}" ${f[id].open ? `data-go="${go}"` : 'disabled'} title="${esc(f[id].open ? sub : f[id].why)}"><b>${label}</b><small>${esc(f[id].open ? sub : f[id].why)}</small></button>`;
  const req = ensureRequests(p, game.today(), new Set(Object.keys(f).filter((k) => f[k].open)));
  return mount(game, `<section class="screen home" aria-label="Home">
    <div class="home-card card">
      <header><h2>${esc(p.garden)}</h2><p class="muted">Gardener ${esc(p.name)}</p></header>
      <h3>Today's Path</h3>
      <ol class="path">
        ${step('water', 'Daily Watering', '2 min warm-up', 'daily')}
        ${step('lesson', 'Sprout Lesson', 'about 4 min', 'lesson')}
        ${hs ? `<li><button class="path-btn harvest" data-go="harvest" ${args({ season: hs.id })}><span class="check star" aria-hidden="true"></span><span><b>Giant Harvest: ${esc(hs.harvest.name)}</b><small>then the ${esc(hs.harvest.festival)}!</small></span></button></li>` : ''}
        ${step('play', `Garden Play: ${season.name}, ${BED_NAMES[nb.bed]}`, 'plant a bed of words', 'garden', nb)}
      </ol>
      <div class="stats">
        <span title="Dewdrops"><i class="dew" aria-hidden="true"></i>${p.dewdrops} dewdrops</span>
        <span title="Days in a row">🌱 ${p.streak.count || 0}-day streak</span>
        <span title="Target speed">🌻 aiming for ${p.learner.targetWpm} WPM</span>
      </div>
      <p class="keys-line small">Your keys: ${keys.map((k) => `<kbd>${esc(k)}</kbd>`).join(' ')}</p>
      <h3>More to grow</h3>
      <div class="mode-tiles">
        ${tile('race', 'race', 'Bee Race', 'race your own best run')}
        ${tile('relay', 'relay', 'Family Relay', 'take turns with someone')}
        ${tile('words', 'words', 'Garden Words', 'type it, grow it')}
        ${tile('story', 'stories', 'Story Seeds', 'type a story page')}
        ${tile('greenhouse', 'greenhouse', 'Greenhouse', 'numbers and sums')}
        ${tile('islamic', 'islamic', 'Islamic Life', 'Names of Allah, Quran, duas')}
      </div>
      <details class="requests" ${req.list.some((r) => !r.done) ? 'open' : ''}><summary><b>Pip's Requests</b> <small>this week</small></summary>
        <ul>${req.list.map((r) => `<li class="${r.done ? 'done' : ''}"><span class="check small" aria-hidden="true"></span>${esc(r.text)} <small>${r.done ? 'done!' : `${r.progress}/${r.goal}`}</small></li>`).join('')}</ul>
        <p class="small muted">Each one is worth 15 dewdrops. All three: a mystery seed. No rush, ever.</p>
      </details>
      <nav class="home-nav">
        <button class="btn" data-go="map">Garden map</button>
        <button class="btn" data-go="almanac">Almanac</button>
        <button class="btn" data-go="journal">Journal${p.journalPages ? ` (${p.journalPages})` : ''}</button>
        <button class="btn" data-go="shop">Shop</button>
        <button class="btn" data-act="postcard">Postcard</button>
        ${listProfiles().profiles.filter((x) => x.onboarded && x.id !== p.id).length ? '<button class="btn" data-go="visit">Visit a garden</button>' : ''}
        <button class="btn" data-go="settings">Settings</button>
      </nav>
    </div>
  </section>`, (r) => {
    r.querySelector('[data-act="postcard"]').addEventListener('click', async () => {
      try {
        const url = await game.scene.postcard(`${p.garden}, by ${p.name}`);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(p.garden || 'keybloom').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-postcard.png`;
        a.click();
        game.toast('<b>Postcard saved!</b> Look in your Downloads folder. It stays on this computer.');
      } catch {
        game.toast('Hmm, this browser could not make a postcard. Try a screenshot instead!');
      }
    });
  });
}

// ── Map ──────────────────────────────────────────────────────────────────────
export function mapScreen(game) {
  const p = game.profile;
  const seasonHTML = SEASONS.map((s, si) => {
    const open = seasonOpen(p, s.id);
    const prog = p.progress[s.id] || [];
    const prev = SEASONS[si - 1];
    const hOpen = harvestOpen(p, s.id);
    const fest = p.festivals.includes(s.id);
    return `<div class="season ${open ? '' : 'locked'}"><h3>${s.name} <small>${s.keysLabel}</small></h3>
      ${open ? '' : `<p class="muted small">Finish every ${prev.name} bed to open ${s.name}.</p>`}
      <div class="beds">${s.beds.map((b, i) => {
        const can = bedOpen(p, s.id, i);
        return `<button class="bed-btn" ${can ? `data-go="garden" ${args({ season: s.id, bed: i })}` : 'disabled'} aria-label="${s.name} ${BED_NAMES[i]}${can ? '' : ' (locked)'}">
          <svg viewBox="-30 -100 60 110" aria-hidden="true">${plantSVG(BY_ID[b.species], prog[i] ? 1 : can ? 0.35 : 0.05, i + 3)}</svg>
          <span>${BED_NAMES[i]}</span><span class="fls">${flowerIcons(prog[i] || 0)}</span></button>`;
      }).join('')}
        <button class="bed-btn harvest-btn ${fest ? 'done' : ''}" ${hOpen ? `data-go="harvest" ${args({ season: s.id })}` : 'disabled'} aria-label="${s.harvest.name}${hOpen ? '' : ' (locked)'}">
          <span class="giant-icon" aria-hidden="true">${fest ? '🎉' : hOpen ? '✨' : '🔒'}</span>
          <span>${esc(s.harvest.name)}</span><span class="small">${fest ? esc(s.harvest.festival) : hOpen ? 'Ready!' : 'After bed 8'}</span></button>
      </div></div>`;
  }).join('');
  return mount(game, `<section class="screen center" aria-label="Garden map">
    <div class="card wide"><header class="row"><h2>Garden map</h2><button class="btn" data-go="home">Back</button></header>
    <p class="muted small">Every finished bed opens the next one. Flowers: 1 for finishing, 2 for 90% accuracy, 3 for 95% accuracy at your target speed (and a mystery seed the first time).</p>
    <div class="seasons">${seasonHTML}</div></div></section>`);
}

// ── Results ──────────────────────────────────────────────────────────────────
const TITLES = { garden: 'Bed planted!', daily: 'Garden watered!', lesson: 'Lesson done!', race: 'Race finished!', story: 'Page typed!', greenhouse: 'Trays labelled!', harvest: 'What a harvest!' };

export function resultsScreen(game, { run, report, pip }) {
  const p = game.profile;
  const target = p.learner.targetWpm;
  const stem = Math.max(18, Math.min(150, (run.wpm / Math.max(target, 1)) * 100));
  const notes = [];
  if (report.race) notes.push(report.race.won ? '<b>You beat the bee!</b> Your target speed grew by 1.' : 'The bee got there first this time. It flies at your best pace, so you are really racing yourself.');
  if (report.festival) notes.push(`<b>${esc(SEASONS.find((s) => s.id === report.festival).harvest.festival)}!</b> +60 festival dewdrops.`);
  if (report.unlocked) notes.push(`New keys unlocked: ${report.unlocked.map((k) => `<kbd>${esc(k)}</kbd>`).join(' ')}. Try a Sprout Lesson to meet them!`);
  if (report.target > 0 && !report.race?.won) notes.push(`Your target speed grew to <b>${target} WPM</b>. Your accuracy earned it.`);
  if (report.target < 0) notes.push(`Pip slowed the garden down a little (<b>${target} WPM</b>). Careful typing first, speed later.`);
  if (report.hint > 0) notes.push(p.learner.hintStage === 2 ? 'The keyboard hint is resting now. Eyes on the garden!' : 'The keyboard hint is getting smaller. Your fingers know the way.');
  if (report.hint < 0) notes.push('The keyboard hint is back to help for a bit.');
  if (report.best) notes.push(`<b>New personal best!</b> Your speed sunflower grew taller.`);
  if (report.planted.length) notes.push(`Planted in your garden: ${report.planted.map((id) => `<b>${esc(BY_ID[id].name)}</b>`).join(', ')}.`);
  if (report.mystery) notes.push(`<b>A mystery seed packet!</b> It's planted in your garden. Nobody knows what it is until it blooms…`);
  for (const r of report.requests) notes.push(`<b>Request done:</b> ${esc(r.text)} (+15 dewdrops)`);
  if (report.requestsAll) notes.push('All three of this week\'s requests: Pip gave you a mystery seed!');
  if (report.story) notes.push(`A new book grew on your storybook tree (${report.story.total} so far).${run.storyEnd ? ' You finished the whole story!' : ''}`);
  if (report.page != null) notes.push('You found a lost <b>journal page</b>!');
  if (run.bestChain >= 5) notes.push(`Longest bloom chain: <b>${run.bestChain}</b> clean words.`);
  if (run.bonusDew) notes.push(`Weather bonus: <b>+${Math.round(run.bonusDew)}</b> dewdrops.`);
  const islamicTitle = run.mode === 'islamic' ? (run.track === 'quran' ? 'Surah complete' : run.track === 'duas' ? (report.islamic?.done ? 'Dua complete' : 'Part complete') : 'Lesson complete') : null;
  const title = islamicTitle || TITLES[run.mode] || 'Nicely done!';
  const islNext = run.mode === 'islamic' ? islamicNext(p, run) : null;
  const nb = nextBed(p);
  const primary = run.mode === 'islamic'
    ? (islNext ? `<button class="btn primary" data-go="islamic-lesson" ${args(islNext.args)}>${islNext.label}</button>` : '<button class="btn primary" data-go="islamic">Back to Islamic Life</button>')
    : run.mode === 'garden' && report.firstBedClear
    ? `<button class="btn primary" data-go="garden" ${args(nb)}>Next bed</button>`
    : run.mode === 'story' && !run.storyEnd
      ? `<button class="btn primary" data-go="story" ${args({ id: run.story, page: run.pageReached })}>Next page</button>`
      : `<button class="btn primary" data-go="home">Back to the garden</button>`;
  const again = run.mode === 'garden' ? `<button class="btn" data-go="garden" ${args({ season: run.season, bed: run.bed })}>Play again</button>`
    : run.mode === 'race' ? '<button class="btn" data-go="race">Race again</button>'
      : run.mode === 'story' ? '<button class="btn" data-go="stories">All stories</button>'
        : run.mode === 'islamic' && islNext ? '<button class="btn" data-go="islamic">Islamic Life</button>' : '';
  return mount(game, `<section class="screen center" aria-label="Results">
    <div class="card results">
      <h2>${title}</h2>
      ${run.mode === 'garden' ? `<div class="big-flowers" aria-label="${report.flowers} of 3 flowers">${flowerIcons(report.flowers)}</div>` : ''}
      ${run.mode === 'story' ? `<blockquote class="story-page">${esc(run.storyText)}</blockquote>` : ''}
      ${run.mode === 'islamic' ? `<blockquote class="story-page isl-read"><b>${esc(run.readTitle)}</b><br>${esc(run.readBack)}</blockquote>` : ''}
      <div class="res-grid">
        <figure class="speed-stem" aria-label="Speed ${run.wpm} words per minute">
          <svg viewBox="0 0 80 190" aria-hidden="true">
            <line x1="10" x2="70" y1="${170 - 100}" y2="${170 - 100}" class="target-line"/>
            <path d="M40 172 V ${172 - stem}" stroke="#6E9E62" stroke-width="5" stroke-linecap="round" class="grow"/>
            <path d="M40 ${172 - stem * 0.45} q -18 -6 -22 -20 q 16 2 22 14" fill="#86B36F"/>
            <g transform="translate(40 ${172 - stem})">${Array.from({ length: 14 }, (_, i) => `<ellipse cy="-11" rx="4.2" ry="10" fill="#F6C445" transform="rotate(${i * 25.7})"/>`).join('')}<circle r="8" fill="#8A5A3B"/></g>
          </svg>
          <figcaption><b>${run.wpm}</b> WPM<small>target ${target}</small></figcaption>
        </figure>
        <div class="res-nums">
          <p><span class="label">Accuracy</span><b>${Math.round(run.accuracy * 100)}%</b></p>
          <p><span class="label">Dewdrops</span><b>+${report.dew}</b></p>
          <p class="small muted">Dewdrops grow with accuracy, so careful typing earns more.</p>
        </div>
      </div>
      ${notes.length ? `<ul class="notes">${notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : ''}
      ${pip ? `<p class="pip-line">${esc(pip)}</p>` : ''}
      <div class="row">${primary}${again}${report.page != null ? '<button class="btn" data-go="journal">Read the page</button>' : ''}</div>
    </div>
  </section>`);
}

// ── Almanac ──────────────────────────────────────────────────────────────────
export function almanacScreen(game) {
  const p = game.profile;
  const grey = (sp) => ({ ...sp, petal: '#D8D2C6', center: '#C9C2B6', leaf: '#D3CDBF', stem: '#C9C2B6' });
  const hint = (sp) => sp.tags.includes('rare') ? 'A rare plant. Catch a golden seed to find it.'
    : sp.tags.includes('mystery') ? 'Grows from a mystery seed packet.'
      : sp.tags.includes('keybloom') ? 'The very last page of the story…' : 'Finish more beds to discover it.';
  const plants = SPECIES.map((sp, i) => {
    const known = p.almanac.includes(sp.id);
    return `<li class="${known ? '' : 'unknown'}"><svg viewBox="-30 -120 60 130" aria-hidden="true">${plantSVG(known ? sp : grey(sp), 1, i + 1)}</svg>
      <div><b>${known ? esc(sp.name) : '???'}</b><p class="small">${known ? esc(sp.fact) : hint(sp)}</p></div></li>`;
  }).join('');
  const visitors = VISITORS.map((v) => {
    const seen = p.visitorsSeen.includes(v.id);
    return `<li class="${seen ? '' : 'unknown'}"><svg viewBox="-50 -50 100 100" aria-hidden="true">${visitorArt(v.id)}</svg>
      <div><b>${seen ? esc(v.name) : '???'}</b><p class="small">${seen ? esc(v.fact) : esc(v.hint)}</p></div></li>`;
  }).join('');
  const found = p.secretsFound.length;
  const whispers = f(p).words.open ? `<h3>Whispers <small class="muted">(${found} of ${SECRET_WORDS.length} secret words found)</small></h3>
    <p class="small muted">Type these in Garden Words… if you can work out what they are.</p>
    <ul class="whispers">${WHISPERS.map((w, i) => `<li class="${p.secretsFound.includes(SECRET_WORDS[i]) ? 'found' : ''}">${esc(w)}${p.secretsFound.includes(SECRET_WORDS[i]) ? ` <b>(${esc(SECRET_WORDS[i])})</b>` : ''}</li>`).join('')}</ul>` : '';
  return mount(game, `<section class="screen center" aria-label="Almanac">
    <div class="card wide"><header class="row"><h2>Seed Almanac</h2><span class="muted">${p.almanac.length} of ${SPECIES.length} plants</span><button class="btn" data-go="home">Back</button></header>
    <h3>Plants</h3><ul class="almanac">${plants}</ul>
    <h3>Garden visitors</h3><ul class="almanac">${visitors}</ul>${whispers}</div></section>`);
}
const f = features;

// ── Journal ──────────────────────────────────────────────────────────────────
export function journalScreen(game) {
  const n = game.profile.journalPages;
  const names = ['Spring', 'Summer', 'Autumn', 'Winter'];
  const pages = JOURNAL.map((t, i) => `${i % 8 === 0 ? `<li class="season-mark">${names[i / 8]}</li>` : ''}${i < n ? `<li class="page"><span class="pg">Page ${i + 1}</span><p>${esc(t)}</p></li>` : `<li class="page missing"><span class="pg">Page ${i + 1}</span><p>This page is still lost somewhere in the garden.</p></li>`}`).join('');
  return mount(game, `<section class="screen center" aria-label="Journal">
    <div class="card wide journal"><header class="row"><h2>The Old Gardener's Journal</h2><span class="muted">${n} of ${JOURNAL.length} pages</span><button class="btn" data-go="home">Back</button></header>
    <p class="muted small">Every bed you finish for the first time brings back a lost page.</p>
    <ol class="pages">${pages}</ol></div></section>`);
}

// ── Shop ─────────────────────────────────────────────────────────────────────
export function shopScreen(game) {
  const p = game.profile;
  const SCARVES = ['#7FB3D5', '#E8A0A8', '#F2C14E', '#9AD08A', '#B39DDB', '#F29A4A'];
  const render = () => `<section class="screen center" aria-label="Shop">
    <div class="card wide"><header class="row"><h2>Garden shop</h2><span class="dew-count"><i class="dew" aria-hidden="true"></i>${p.dewdrops}</span><button class="btn" data-go="home">Back</button></header>
    <p class="muted small">Spend dewdrops on things for your garden. Nothing here costs real money, ever.</p>
    <ul class="shop">${DECOR.map((d) => {
      const owned = p.decor.includes(d.id);
      return `<li><b>${esc(d.name)}</b><button class="btn small" data-buy="${d.id}" ${owned || p.dewdrops < d.cost ? 'disabled' : ''}>${owned ? 'In your garden' : `${d.cost} dewdrops`}</button></li>`;
    }).join('')}</ul>
    <h3>Pip's scarf (free)</h3><div class="swatches">${SCARVES.map((c) => `<button class="swatch ${p.scarf === c ? 'on' : ''}" data-scarf="${c}" style="background:${c}" aria-label="Scarf colour"></button>`).join('')}</div>
    </div></section>`;
  const s = mount(game, render(), wire);
  function wire(root) {
    root.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => {
      const d = DECOR.find((x) => x.id === b.dataset.buy);
      if (!d || p.dewdrops < d.cost || p.decor.includes(d.id)) return;
      p.dewdrops -= d.cost;
      p.decor.push(d.id);
      game.persist();
      game.refreshGarden();
      game.audio.sparkle(6);
      game.go('shop');
    }));
    root.querySelectorAll('[data-scarf]').forEach((b) => b.addEventListener('click', () => {
      p.scarf = b.dataset.scarf;
      game.persist();
      game.refreshPip();
      game.go('shop');
    }));
  }
  return s;
}

// ── Settings ─────────────────────────────────────────────────────────────────
export function settingsScreen(game) {
  const st = game.profile.settings;
  const slider = (key, label) => `<label class="slider">${label}<input type="range" min="0" max="1" step="0.05" data-set="${key}" value="${st[key]}"></label>`;
  const radio = (key, val, label) => `<label class="chip"><input type="radio" name="${key}" value="${val}" ${String(st[key]) === String(val) ? 'checked' : ''}>${label}</label>`;
  return mount(game, `<section class="screen center" aria-label="Settings">
    <div class="card narrow settings"><header class="row"><h2>Settings</h2><button class="btn" data-go="home">Back</button></header>
      <h3>Sound</h3>
      ${slider('music', 'Music')}${slider('sfx', 'Typing sounds')}${slider('nature', 'Nature sounds')}
      <label class="check"><input type="checkbox" data-bool="natureOn" ${st.natureOn ? 'checked' : ''}> Birds and breeze</label>
      <label class="check"><input type="checkbox" data-bool="muted" ${st.muted ? 'checked' : ''}> Mute everything</label>
      <h3>Reading</h3>
      <div class="chips">${radio('font', 'atkinson', 'Easy-read font')}${radio('font', 'dyslexic', 'OpenDyslexic')}</div>
      <div class="chips">${radio('textSize', 0, 'Text: normal')}${radio('textSize', 1, 'Large')}${radio('textSize', 2, 'Extra large')}</div>
      <h3>Pace and motion</h3>
      <div class="chips">${radio('pace', 'calm', 'Extra calm')}${radio('pace', 'normal', 'Normal')}${radio('pace', 'breezy', 'Breezy (faster)')}</div>
      <label class="check"><input type="checkbox" data-bool="reducedMotion" ${game.reducedMotion() ? 'checked' : ''}> Reduce motion</label>
      <h3>Gardeners</h3>
      <div class="row"><button class="btn" data-go="profiles">Switch or add a gardener</button><button class="btn" data-go="parent">Parent Corner</button></div>
    </div></section>`, (root) => {
    root.querySelectorAll('[data-set]').forEach((i) => i.addEventListener('input', () => game.updateSettings({ [i.dataset.set]: Number(i.value) })));
    root.querySelectorAll('[data-bool]').forEach((i) => i.addEventListener('change', () => game.updateSettings({ [i.dataset.bool]: i.checked })));
    root.querySelectorAll('input[type=radio]').forEach((i) => i.addEventListener('change', () => game.updateSettings({ [i.name]: i.name === 'textSize' ? Number(i.value) : i.value })));
  });
}

// ── Ending ───────────────────────────────────────────────────────────────────
export function endingScreen(game) {
  const p = game.profile;
  p.endingSeen = true;
  game.persist();
  game.scene.setTime('night');
  game.scene.setWeather('fireflies');
  game.scene.setPipPose('cheer');
  game.audio.chime();
  return mount(game, `<section class="screen center" aria-label="The end">
    <div class="card narrow ending">
      <svg viewBox="-60 -130 120 140" class="ending-bloom" aria-hidden="true">${plantSVG(BY_ID.keybloom, 1, 7)}</svg>
      <h2>The Keybloom opened.</h2>
      <p>The old gardener's last seed was waiting for patient hands, and yours were ready. Every season, every letter, every careful key: that's what made it bloom.</p>
      <p>Pip has a new scarf, a full garden, and a best friend. That's you.</p>
      <p class="pip-line">"The garden is never really finished," says Pip. "Shall we keep growing?"</p>
      <div class="row"><button class="btn primary" data-go="home">Keep growing</button><button class="btn" data-go="journal">Read the last page</button></div>
    </div></section>`);
}

export { KEY_GROUPS };
