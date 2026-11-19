// Parent Corner: behind a hold-for-3-seconds + simple sum gate (it only prevents accidental
// resets; nothing sensitive is stored). Shows speed and accuracy over time (two separate charts,
// never one dual-axis chart), minutes per day, a trouble-key map, the recommended next focus,
// and export / import / reset / delete for each gardener. Everything stays on this computer.
import { el, esc } from './dom.js';
import { keyAccuracy, weakestKeys, unlockedKeys } from '../core/adaptive.js';
import { listProfiles, getProfile, importProfile, deleteProfile, createProfile, save } from './save.js';

const INK = '#3D4A3F', MUTED = '#66756A', GRID = '#E5DCCB', SERIES = '#5F8F5A', BAR = '#7FA7BD';
// Sequential ramp for the trouble-key map: one hue, light (fine) → dark (needs care).
const HEAT = ['#FBEFEA', '#F6D2C4', '#EDA98F', '#D97A5C', '#B5523A'];

/** A small single-series line chart with hover tooltips. points: [{x: label, y: number}] */
function lineChart(points, { yMax, unit, title }) {
  const W = 440, H = 170, L = 38, R = 12, T = 14, B = 26;
  if (points.length < 2) return `<p class="muted small">Not enough runs yet to draw ${esc(title.toLowerCase())}.</p>`;
  const max = yMax || Math.max(10, Math.ceil(Math.max(...points.map((p) => p.y)) / 10) * 10);
  const x = (i) => L + (i * (W - L - R)) / (points.length - 1);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, max / 2, max];
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.y).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" class="pc-chart" role="img" aria-label="${esc(title)}">
    ${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="${GRID}" stroke-width="1"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="${MUTED}">${Math.round(t)}</text>`).join('')}
    <path d="${path}" fill="none" stroke="${SERIES}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(points.length - 1)}" cy="${y(last.y)}" r="4" fill="${SERIES}" stroke="#fff" stroke-width="2"/>
    <text x="${x(points.length - 1) - 6}" y="${y(last.y) < T + 14 ? y(last.y) + 18 : y(last.y) - 9}" text-anchor="end" font-size="12" font-weight="700" fill="${INK}">${last.y}${unit}</text>
    ${points.map((p, i) => `<g class="hit"><rect x="${x(i) - (W - L - R) / points.length / 2}" y="${T}" width="${(W - L - R) / points.length}" height="${H - T - B}" fill="transparent"/><line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}" class="cross"/><circle cx="${x(i)}" cy="${y(p.y)}" r="4" class="dot-h" fill="${SERIES}"/><title>${esc(p.x)}: ${p.y}${unit}</title></g>`).join('')}
    <text x="${L}" y="${H - 6}" font-size="11" fill="${MUTED}">${esc(points[0].x)}</text>
    <text x="${W - R}" y="${H - 6}" font-size="11" fill="${MUTED}" text-anchor="end">${esc(last.x)}</text>
  </svg>`;
}

function barChart(days) {
  const W = 440, H = 150, L = 30, R = 8, T = 12, B = 24;
  const max = Math.max(10, Math.ceil(Math.max(...days.map((d) => d.mins)) / 5) * 5);
  const bw = (W - L - R) / days.length;
  const y = (v) => T + (1 - v / max) * (H - T - B);
  return `<svg viewBox="0 0 ${W} ${H}" class="pc-chart" role="img" aria-label="Minutes typed per day, last 14 days">
    ${[0, max].map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="${GRID}"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="${MUTED}">${t}</text>`).join('')}
    ${days.map((d, i) => {
      const h = Math.max(0, H - B - y(d.mins));
      const bx = L + i * bw + 1, w = bw - 2;
      const bar = h > 0 ? `<path d="M${bx} ${H - B} V${H - B - h + Math.min(4, h)} q0 -${Math.min(4, h)} ${Math.min(4, w / 2)} -${Math.min(4, h)} H${bx + w - Math.min(4, w / 2)} q${Math.min(4, w / 2)} 0 ${Math.min(4, w / 2)} ${Math.min(4, h)} V${H - B}Z" fill="${BAR}"/>` : '';
      return `<g class="hit"><rect x="${bx}" y="${T}" width="${w}" height="${H - T - B}" fill="transparent"/>${bar}<title>${esc(d.label)}: ${d.mins} min</title></g>`;
    }).join('')}
    <text x="${L}" y="${H - 6}" font-size="11" fill="${MUTED}">${esc(days[0].label)}</text>
    <text x="${W - R}" y="${H - 6}" font-size="11" fill="${MUTED}" text-anchor="end">today</text>
  </svg>`;
}

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function heatmap(learner) {
  const open = new Set(unlockedKeys(learner));
  return `<div class="pc-heat" role="img" aria-label="Accuracy by key">${ROWS.map((row, r) => `<div class="pc-heat-row" style="margin-left:${r * 16}px">${[...row].map((k) => {
    const s = learner.keyStats[k];
    const acc = keyAccuracy(s);
    if (!open.has(k) || acc == null) return `<span class="hk-cell none" title="${k}: not practised yet">${k}</span>`;
    const err = 1 - acc;
    const step = Math.min(HEAT.length - 1, Math.floor(err / 0.05));
    return `<span class="hk-cell" style="background:${HEAT[step]};color:${step >= 3 ? '#fff' : INK}" title="${k}: ${Math.round(acc * 100)}% accurate, ${s.avgMs ? Math.round(s.avgMs) + ' ms' : '–'} per key">${k}</span>`;
  }).join('')}</div>`).join('')}
  <div class="pc-heat-legend small muted"><span>fine</span>${HEAT.map((c) => `<i style="background:${c}"></i>`).join('')}<span>needs care</span></div></div>`;
}

function dayLabel(day) {
  const d = new Date(day * 86400000);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function report(p, today) {
  const runs = p.history.filter((h) => h.mode !== 'words' && h.mode !== 'greenhouse' && h.wpm > 0).slice(-30);
  const speed = runs.map((h) => ({ x: dayLabel(h.day), y: h.wpm }));
  const acc = runs.map((h) => ({ x: dayLabel(h.day), y: Math.round(h.acc * 100) }));
  const days = Array.from({ length: 14 }, (_, i) => {
    const day = today - 13 + i;
    return { label: dayLabel(day), mins: Math.round(p.history.filter((h) => h.day === day).reduce((a, h) => a + (h.mins || 0), 0) * 10) / 10 };
  });
  const weak = weakestKeys(p.learner, 4);
  const avgAcc = runs.length ? runs.slice(-5).reduce((a, h) => a + h.acc, 0) / Math.min(5, runs.length) : null;
  const focus = !runs.length ? 'Start with the Seed Test and a Sprout Lesson.'
    : avgAcc < 0.9 ? `Accuracy first: recent runs average ${Math.round(avgAcc * 100)}%. Daily Watering targets the trickiest keys (${weak.join(' ')}). Speed comes once accuracy is steady.`
      : `Accuracy is steady (${Math.round(avgAcc * 100)}%). Keep going with Garden Play at the target of ${p.learner.targetWpm} WPM; the Bee Race helps build speed. Keys to watch: ${weak.join(' ')}.`;
  return `
    <div class="pc-summary">
      <p><span class="label">Best speed</span><b>${p.bestWpm || 0} WPM</b></p>
      <p><span class="label">Target speed</span><b>${p.learner.targetWpm} WPM</b></p>
      <p><span class="label">Keys learned</span><b>${unlockedKeys(p.learner).filter((k) => /[a-z]/.test(k)).length} of 26</b></p>
      <p><span class="label">Days in a row</span><b>${p.streak.count || 0}</b></p>
    </div>
    <p class="pc-focus"><b>Recommended next focus:</b> ${esc(focus)}</p>
    <div class="pc-grid">
      <figure><figcaption>Speed (WPM), last ${runs.length} runs</figcaption>${lineChart(speed, { unit: '', title: 'Speed over time' })}</figure>
      <figure><figcaption>Accuracy (%), last ${runs.length} runs</figcaption>${lineChart(acc, { yMax: 100, unit: '%', title: 'Accuracy over time' })}</figure>
      <figure><figcaption>Minutes typed per day, last 14 days</figcaption>${barChart(days)}</figure>
      <figure><figcaption>Trouble keys (darker = more mistakes)</figcaption>${heatmap(p.learner)}</figure>
    </div>
    <details class="pc-table"><summary>Show the numbers as a table</summary>
      <table><thead><tr><th>Day</th><th>Activity</th><th>WPM</th><th>Accuracy</th><th>Minutes</th></tr></thead>
      <tbody>${p.history.slice(-40).reverse().map((h) => `<tr><td>${dayLabel(h.day)}</td><td>${esc(h.mode)}</td><td>${h.wpm}</td><td>${Math.round(h.acc * 100)}%</td><td>${h.mins}</td></tr>`).join('')}</tbody></table>
    </details>`;
}

export function parentScreen(game) {
  const a = 3 + Math.floor(Math.random() * 6), b = 4 + Math.floor(Math.random() * 6);
  const root = el(`<section class="screen center" aria-label="Parent Corner"><div class="card narrow pc-gate">
    <h2>Parent Corner</h2>
    <p>For grown-ups: progress, trouble keys, and saving or resetting a gardener.</p>
    <p class="small muted">Hold the button for 3 seconds, then answer the sum.</p>
    <button class="btn hold" data-act="hold"><span class="hold-fill"></span><span>Hold me</span></button>
    <form class="sum" hidden><label>What is ${a} + ${b}? <input name="ans" inputmode="numeric" maxlength="3" autocomplete="off"></label><button class="btn primary">Open</button></form>
    <button class="btn ghost" data-go="settings">Back</button></div></section>`);
  game.app.appendChild(root);
  root.querySelector('[data-go]').addEventListener('click', () => game.go('settings'));
  const hold = root.querySelector('[data-act="hold"]');
  let t = null;
  const startHold = () => {
    hold.classList.add('holding');
    t = setTimeout(() => {
      hold.hidden = true;
      const f = root.querySelector('.sum');
      f.hidden = false;
      f.querySelector('input').focus();
    }, 3000);
  };
  const stopHold = () => { hold.classList.remove('holding'); clearTimeout(t); };
  hold.addEventListener('pointerdown', startHold);
  hold.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
  ['pointerup', 'pointerleave'].forEach((ev) => hold.addEventListener(ev, stopHold));
  hold.addEventListener('keyup', stopHold);
  root.querySelector('.sum').addEventListener('submit', (e) => {
    e.preventDefault();
    if (Number(e.target.ans.value) === a + b) openCorner();
    else { e.target.ans.value = ''; e.target.ans.placeholder = 'Try again'; }
  });
  hold.focus();

  function openCorner(selectedId = game.profile.id) {
    game.persist();
    const list = listProfiles().profiles;
    const p = selectedId === game.profile.id ? game.profile : getProfile(selectedId);
    root.innerHTML = `<div class="card wide pc">
      <header class="row"><h2>Parent Corner</h2><button class="btn" data-act="close">Done</button></header>
      ${list.length > 1 ? `<div class="chips">${list.map((x) => `<button class="chip ${x.id === p.id ? 'on' : ''}" data-pick="${x.id}">${esc(x.name || 'New gardener')}</button>`).join('')}</div>` : ''}
      <h3>${esc(p.name || 'Gardener')} <small class="muted">${esc(p.garden || '')}</small></h3>
      ${report(p, game.today())}
      <h3>Settings for grown-ups</h3>
      <label class="inline-select">Break reminder after
        <select data-act="break">${[0, 15, 20, 30, 45].map((m) => `<option value="${m}" ${p.settings.breakMins === m ? 'selected' : ''}>${m ? `${m} minutes` : 'never'}</option>`).join('')}</select></label>
      <h3>Save, restore, reset</h3>
      <p class="small muted">A save file is a small JSON file you keep. Nothing is uploaded anywhere.</p>
      <div class="row">
        <button class="btn" data-act="export">Export ${esc(p.name || 'gardener')}</button>
        <label class="btn file-btn">Import into ${esc(p.name || 'gardener')}<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        <button class="btn" data-act="reset">Reset progress</button>
        ${list.length > 1 ? '<button class="btn" data-act="delete">Delete this gardener</button>' : ''}
      </div>
      <p class="pc-msg small" role="status"></p>
    </div>`;
    const msg = (t) => { root.querySelector('.pc-msg').textContent = t; };
    root.querySelector('[data-act="close"]').addEventListener('click', () => game.go('home'));
    root.querySelectorAll('[data-pick]').forEach((bt) => bt.addEventListener('click', () => openCorner(bt.dataset.pick)));
    root.querySelector('[data-act="break"]').addEventListener('change', (e) => {
      p.settings.breakMins = Number(e.target.value);
      if (p === game.profile) game.persist(); else save(p);
      msg('Saved.');
    });
    root.querySelector('[data-act="export"]').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ app: 'keybloom', exported: new Date().toISOString(), profile: p }, null, 1)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `keybloom-${(p.name || 'gardener').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      msg('Exported. Look in your Downloads folder.');
    });
    root.querySelector('[data-act="import"]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!confirm(`Replace ${p.name || 'this gardener'}'s progress with the file "${file.name}"?`)) return;
        importProfile(p.id, data);
        if (p === game.profile) location.reload();
        else openCorner(p.id);
      } catch (err) {
        msg(`That file could not be read as a Keybloom save (${err.message}).`);
      }
    });
    root.querySelector('[data-act="reset"]').addEventListener('click', () => {
      if (!confirm(`Reset all of ${p.name || 'this gardener'}'s progress? Export first if you might want it back. This cannot be undone.`)) return;
      const fresh = createProfile();
      fresh.id = p.id;
      save(fresh);
      if (p === game.profile) location.reload();
      else openCorner(p.id);
    });
    root.querySelector('[data-act="delete"]')?.addEventListener('click', () => {
      if (!confirm(`Delete ${p.name || 'this gardener'} and their whole garden? This cannot be undone.`)) return;
      deleteProfile(p.id);
      if (p.id === game.profile.id) location.reload();
      else openCorner(game.profile.id);
    });
    root.querySelector('[data-act="close"]').focus();
  }
  return { destroy: () => { clearTimeout(t); root.remove(); } };
}
