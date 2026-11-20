// Islamic Life: a calm chapter for typing the 99 Names of Allah, the meanings of Al-Fatiha and the
// last 10 surahs, and beautiful supplications. Arabic is shown for reading only and never typed.
// Typos must be fixed with Backspace so sacred text is always typed correctly. No music here
// (main.js turns on quiet mode for these screens), no jokes, no timers.
import { lineRunner } from './line-runner.js';
import { KEY_GROUPS } from '../core/adaptive.js';
import { wrapText } from '../core/wrap.js';
import { NAMES, NAME_LESSONS, nameLesson, nameLine } from '../data/islamic/names.js';
import { SURAHS, QURAN_SOURCE, typed } from '../data/islamic/quran.js';
import { DUAS } from '../data/islamic/duas.js';
import { el, esc } from '../ui/dom.js';

export const ISLAMIC_KEYS = [...KEY_GROUPS.flat(), 'shift', "'", '-', ',', '.', '!', '?', '"', ':', ';', '9', '0'];
const MAX_LINE = 48;

const TRACKS = {
  names: { title: 'Al-Asma ul Husna', sub: 'The 99 Beautiful Names of Allah', count: NAME_LESSONS },
  quran: { title: 'Quran', sub: 'Al-Fatiha and the last 10 surahs', count: SURAHS.length },
  duas: { title: 'Beautiful Supplications', sub: 'Duas to Allah, typed one part at a time', count: DUAS.length },
};

/** How much of each track is finished. */
export function islamicProgress(profile) {
  const s = profile.islamic || { names: [], quran: {}, duas: {} };
  return {
    names: s.names.length,
    namesTyped: Math.min(NAMES.length, s.names.reduce((n, i) => n + nameLesson(i).length, 0)),
    quran: SURAHS.filter((x) => s.quran[x.n]).length,
    duas: DUAS.filter((d) => (s.duas[d.id] || 0) >= d.parts.length).length,
  };
}

const lanterns = (lit, total) => `<div class="lanterns" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i < lit ? 'lit' : ''}"></i>`).join('')}</div>`;

function mount(game, html) {
  const root = el(html);
  game.app.appendChild(root);
  root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => game.go(b.dataset.go, b.dataset.args ? JSON.parse(b.dataset.args) : {})));
  (root.querySelector('.btn.primary') || root.querySelector('button'))?.focus({ preventScroll: true });
  return { destroy: () => root.remove(), root };
}
const go = (name, args) => `data-go="${name}" data-args='${esc(JSON.stringify(args))}'`;

/** Chapter home (no track) or one track's list of lessons. */
export function islamicScreen(game, { track } = {}) {
  game.scene.setTime('night');
  game.scene.setWeather(null);
  const p = game.profile;
  const s = p.islamic;
  const prog = islamicProgress(p);
  if (!track) {
    const card = (id, lit) => `<button class="isl-card" ${go('islamic', { track: id })}>
      <b>${TRACKS[id].title}</b><small>${TRACKS[id].sub}</small>${lanterns(lit, TRACKS[id].count)}
      <span class="small muted">${id === 'names' ? `${prog.namesTyped} of 99 names` : id === 'quran' ? `${prog.quran} of ${SURAHS.length} surahs` : `${prog.duas} of ${DUAS.length} duas`}</span></button>`;
    return mount(game, `<section class="screen center islamic" aria-label="Islamic Life">
      <div class="card wide isl-home">
        <header class="row"><h2>Islamic Life</h2><button class="btn" data-go="home">Back</button></header>
        <p class="bismillah" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
        <p class="muted small">Type slowly and carefully. Here every typo is fixed with <kbd>Backspace</kbd>, so the words are always written right. Each lesson you finish lights a lantern.</p>
        <div class="isl-cards">${card('names', s.names.length)}${card('quran', prog.quran)}${card('duas', prog.duas)}</div>
      </div></section>`);
  }
  let items = '';
  if (track === 'names') {
    items = Array.from({ length: NAME_LESSONS }, (_, i) => {
      const group = nameLesson(i);
      const done = s.names.includes(i);
      return `<li class="${done ? 'done' : ''}"><span class="isl-num">${group[0].n}–${group[group.length - 1].n}</span>
        <span class="isl-what"><span class="ar-inline" lang="ar" dir="rtl">${group.map((x) => esc(x.ar)).join(' · ')}</span><small>${group.map((x) => esc(x.tr)).join(', ')}</small></span>
        <button class="btn small ${!done && nextNames(s) === i ? 'primary' : ''}" ${go('islamic-lesson', { track, lesson: i })}>${done ? 'Type again' : 'Start'}</button></li>`;
    }).join('');
  } else if (track === 'quran') {
    items = SURAHS.map((x) => {
      const done = !!s.quran[x.n];
      return `<li class="${done ? 'done' : ''}"><span class="isl-num">${x.n}</span>
        <span class="isl-what"><b>${esc(x.name)}</b> <span class="ar-inline" lang="ar" dir="rtl">${esc(x.ar)}</span><small>${esc(x.meaning)} · ${x.verses.length} verses</small></span>
        <button class="btn small ${!done && nextSurah(s) === x.n ? 'primary' : ''}" ${go('islamic-lesson', { track, lesson: x.n })}>${done ? 'Type again' : 'Start'}</button></li>`;
    }).join('');
  } else {
    items = DUAS.map((d) => {
      const n = s.duas[d.id] || 0;
      const done = n >= d.parts.length;
      return `<li class="${done ? 'done' : ''}"><span class="isl-num">${d.id}</span>
        <span class="isl-what"><b>${esc(d.title)}</b><small>${done ? 'Complete' : `Part ${n + 1} of ${d.parts.length}`}</small>${lanterns(n, d.parts.length)}</span>
        <button class="btn small ${n && !done ? 'primary' : ''}" ${go('islamic-lesson', { track, lesson: d.id, part: done ? 0 : n })}>${done ? 'Type again' : n ? 'Continue' : 'Start'}</button></li>`;
    }).join('');
  }
  return mount(game, `<section class="screen center islamic" aria-label="${TRACKS[track].title}">
    <div class="card wide"><header class="row"><h2>${TRACKS[track].title}</h2><button class="btn" data-go="islamic">Back</button></header>
    <p class="muted small">${TRACKS[track].sub}.${track === 'quran' ? ` ${esc(QURAN_SOURCE)}` : ''}</p>
    <ol class="isl-list">${items}</ol></div></section>`);
}

const nextNames = (s) => Array.from({ length: NAME_LESSONS }, (_, i) => i).find((i) => !s.names.includes(i)) ?? -1;
const nextSurah = (s) => SURAHS.find((x) => !s.quran[x.n])?.n ?? -1;

/** Builds the typed lines (with a read-only header each) for one lesson. */
export function islamicLines(track, lesson, part = 0) {
  if (track === 'names') {
    return nameLesson(lesson).flatMap((x) => wrapText(nameLine(x), MAX_LINE).map((text) => ({
      text, header: `<div class="ar-name" lang="ar" dir="rtl">${esc(x.ar)}</div><div class="ar-caption">${x.n} of 99</div>`,
    })));
  }
  if (track === 'quran') {
    const surah = SURAHS.find((x) => x.n === lesson);
    return surah.verses.flatMap((v, i) => wrapText(typed(v.en), MAX_LINE).map((text) => ({
      text, header: `<div class="ar-verse" lang="ar" dir="rtl">${esc(v.ar)} <span class="ayah">${toArabicDigits(i + 1)}</span></div><div class="ar-caption">${esc(surah.name)} · verse ${i + 1} of ${surah.verses.length}</div>`,
    })));
  }
  const dua = DUAS.find((d) => d.id === lesson);
  const name = (dua.parts[part].match(/^(Ya [^,]+(?:, Ya [^,]+)?),/) || [])[1];
  return wrapText(dua.parts[part], MAX_LINE).map((text) => ({
    text, header: `<div class="ar-caption"><b>${esc(dua.title)}</b> · part ${part + 1} of ${dua.parts.length}${name ? ` · ${esc(name)}` : ''}</div>`,
  }));
}

const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

export function islamicLesson(game, { track, lesson, part = 0 }) {
  const lines = islamicLines(track, lesson, part);
  let title, readBack;
  if (track === 'names') {
    const g = nameLesson(lesson);
    title = `The Names of Allah, ${g[0].n} to ${g[g.length - 1].n}`;
    readBack = g.map(nameLine).join(' · ');
  } else if (track === 'quran') {
    const surah = SURAHS.find((x) => x.n === lesson);
    title = `Surah ${surah.name} (${surah.meaning})`;
    readBack = surah.verses.map((v, i) => `(${i + 1}) ${v.en}`).join(' ');
  } else {
    const dua = DUAS.find((d) => d.id === lesson);
    title = dua.title;
    readBack = dua.parts[part];
  }
  game.scene.setTime('night');
  return lineRunner(game, {
    mode: 'islamic',
    title,
    subtitle: 'Take your time. If you slip, press <kbd>Backspace</kbd> to fix it.',
    keyboard: 'stage',
    keys: ISLAMIC_KEYS,
    fixTypos: true,
    totalLines: lines.length,
    lineHeader: (i) => lines[i]?.header,
    nextLine: (i) => (i < lines.length ? lines[i].text : null),
    onDone: (s) => game.finish({
      ...s, mode: 'islamic', track, lesson, part,
      parts: track === 'duas' ? DUAS.find((d) => d.id === lesson).parts.length : 1,
      readTitle: title, readBack,
    }),
  });
}

/** Where the results screen's main button goes next. */
export function islamicNext(profile, run) {
  if (run.track === 'duas') {
    const dua = DUAS.find((d) => d.id === run.lesson);
    if (run.part + 1 < dua.parts.length) return { label: 'Next part', args: { track: 'duas', lesson: run.lesson, part: run.part + 1 } };
    const next = DUAS.find((d) => (profile.islamic.duas[d.id] || 0) < d.parts.length);
    return next ? { label: 'Next dua', args: { track: 'duas', lesson: next.id, part: profile.islamic.duas[next.id] || 0 } } : null;
  }
  if (run.track === 'names') {
    const i = nextNames(profile.islamic);
    return i >= 0 ? { label: 'Next names', args: { track: 'names', lesson: i } } : null;
  }
  const n = nextSurah(profile.islamic);
  return n >= 0 ? { label: 'Next surah', args: { track: 'quran', lesson: n } } : null;
}
