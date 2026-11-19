// The living garden backdrop: one SVG (1600×900, scaled to cover the window) with sky, light,
// clouds, hills, the cottage fence, the home-garden plot and the run bed where words become plants.
// DOM layers (drifting words, Pip's bubble) use toScreen() to line up with SVG positions.
import { plantSVG } from './plant-gen.js';
import { BY_ID } from '../data/species.js';
import { pipSVG } from './pip.js';
import { visitorSVG } from './visitors.js';
import { meadowArt, meadowLayout } from './meadow.js';
import { decorSVG } from './decor.js';

export const VIEW_W = 1600, VIEW_H = 900;
export const BED_Y = 812;          // soil line of the run bed
export const HOME_ROWS = [690, 760]; // soil lines of the home garden rows
export const COMPOST = { x: 1505, y: 770 };

const NS = 'http://www.w3.org/2000/svg';

export function createScene(root) {
  root.innerHTML = `
<svg id="world" viewBox="0 0 ${VIEW_W} ${VIEW_H}" preserveAspectRatio="xMidYMid slice" xmlns="${NS}">
  <defs>
    <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#BFD9EA"/><stop offset=".6" stop-color="#DDEBF0"/><stop offset="1" stop-color="#FBF6EC"/>
    </linearGradient>
    <linearGradient id="skyDusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#C9B6DD"/><stop offset=".55" stop-color="#F4C9B4"/><stop offset="1" stop-color="#F9E2C4"/>
    </linearGradient>
    <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2E3A5C"/><stop offset=".6" stop-color="#4B5B82"/><stop offset="1" stop-color="#6E7A9A"/>
    </linearGradient>
    <radialGradient id="sunGlow"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".9"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></radialGradient>
    <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B58C66"/><stop offset="1" stop-color="#9A7352"/></linearGradient>
  </defs>
  <rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#skyDay)"/>
  <rect id="dusk" class="sky-layer" width="${VIEW_W}" height="${VIEW_H}" fill="url(#skyDusk)"/>
  <rect id="night" class="sky-layer" width="${VIEW_W}" height="${VIEW_H}" fill="url(#skyNight)"/>
  <g id="stars" class="sky-layer">${stars()}</g>
  <g id="sun" class="celestial"><circle cx="1290" cy="150" r="120" fill="url(#sunGlow)"/><circle cx="1290" cy="150" r="46" fill="#FBE7A6"/></g>
  <g id="moon" class="celestial"><circle cx="1290" cy="150" r="40" fill="#F4F1E4"/><circle cx="1306" cy="140" r="36" fill="#4B5B82" opacity=".9"/></g>
  <g id="sky-items"></g>
  <g id="clouds">${cloud(120, 120, 1)}${cloud(620, 80, 0.8)}${cloud(980, 190, 1.15)}${cloud(1450, 110, 0.7)}</g>
  <path class="hill1" d="M0 520 C 200 430, 420 470, 600 500 S 1000 420, 1200 470 S 1500 430, 1600 460 L1600 900 L0 900Z" fill="#C9DDB8"/>
  <path class="hill2" d="M0 590 C 260 540, 480 575, 760 560 S 1240 520, 1600 560 L1600 900 L0 900Z" fill="#B3CFA0"/>
  ${trees()}
  ${cottage()}
  <path class="ground" d="M0 640 C 400 615, 1200 615, 1600 640 L1600 900 L0 900Z" fill="#A4C690"/>
  <g id="story-tree" transform="translate(1395 606)"></g>
  <g id="meadow"></g>
  ${fence()}
  <g id="sign" transform="translate(262 668)"></g>
  <g id="decor"></g>
  <g id="home-plot">
    <path d="M120 678 Q 800 662 1480 678 L1490 702 Q 800 690 110 702Z" fill="url(#soil)" opacity=".85"/>
    <path d="M100 748 Q 800 732 1500 748 L1510 772 Q 800 760 90 772Z" fill="url(#soil)" opacity=".85"/>
  </g>
  <g id="home-plants"></g>
  <g id="visitors"></g>
  <g id="compost" transform="translate(${COMPOST.x} ${COMPOST.y})">
    <path d="M-52 34 L-44 -6 L44 -6 L52 34Z" fill="#9C7B5B"/>
    <path d="M-48 -6 Q 0 -32 48 -6Z" fill="#7C9A62"/>
    <path d="M-44 6 H44 M-46 18 H46" stroke="#86684B" stroke-width="3"/>
  </g>
  <path d="M0 800 Q 800 786 1600 800 L1600 900 L0 900Z" fill="url(#soil)"/>
  <path d="M0 800 Q 800 786 1600 800" stroke="#8B6B4E" stroke-width="3" fill="none" opacity=".5"/>
  <g id="giant" transform="translate(800 ${BED_Y})"></g>
  <g id="run-bed"></g>
  <g id="pip" transform="translate(150 610)">${pipSVG()}</g>
  <g id="festival"></g>
  <g id="weather"></g>
</svg>`;
  const svg = root.querySelector('#world');
  const $ = (id) => svg.querySelector('#' + id);

  let map = { scale: 1, offX: 0, offY: 0 };
  function measure() {
    const W = root.clientWidth || window.innerWidth;
    const H = root.clientHeight || window.innerHeight;
    const scale = Math.max(W / VIEW_W, H / VIEW_H);
    map = { scale, offX: (W - VIEW_W * scale) / 2, offY: (H - VIEW_H * scale) / 2, W, H };
  }
  measure();
  window.addEventListener('resize', measure);

  /** Visible SVG x-range (the sides can be cropped on narrow windows). */
  function visibleX() {
    return { left: -map.offX / map.scale, right: (map.W - map.offX) / map.scale };
  }

  const runPlants = [];

  return {
    svg,
    measure,
    visibleX,
    toScreen: (x, y) => ({ x: map.offX + x * map.scale, y: map.offY + y * map.scale }),
    scale: () => map.scale,

    setTime(t) {
      svg.dataset.time = t; // morning | day | evening | night (CSS fades the sky layers)
    },

    renderHome(garden, { onlyBloomed = false } = {}) {
      const g = $('home-plants');
      const slots = homeSlots();
      g.innerHTML = garden.plants.slice(0, slots.length).map((p, i) => {
        const sp = BY_ID[p.species];
        if (!sp || (onlyBloomed && p.stage < 4)) return '';
        const s = slots[i];
        const body = p.mystery ? mysterySVG(p.stage) : plantSVG(sp, p.stage / 4, p.id * 97);
        return `<g transform="translate(${s.x} ${s.y}) scale(${s.scale})" class="sway${p.species === 'keybloom' ? ' keybloom' : ''}" style="--d:${(i % 7) * 0.4}s">${body}</g>`;
      }).join('');
    },

    renderVisitors(list) {
      $('visitors').innerHTML = list.map((v) => visitorSVG(v)).join('');
    },

    /** Garden Words items: ground ones behind the fence, sky ones over the hills. */
    renderMeadow(items) {
      const laid = meadowLayout(items || []);
      $('meadow').innerHTML = laid.filter((it) => !it.sky).map((it, i) => `<g transform="translate(${it.x} ${it.y}) scale(.8)" class="m-item" style="--d:${(i % 5) * 0.3}s">${meadowArt(it.w, i * 13 + 5)}</g>`).join('');
      $('sky-items').innerHTML = laid.filter((it) => it.sky).map((it, i) => `<g transform="translate(${it.x} ${it.y})" class="m-item sky">${meadowArt(it.w, i)}</g>`).join('');
    },

    /** The storybook tree grows with every story page typed. */
    renderStoryTree(pages) {
      $('story-tree').innerHTML = pages > 0 ? storyTreeSVG(pages) : '';
    },

    renderSign(notes) {
      $('sign').innerHTML = notes && notes.length ? `<rect x="-3" y="-40" width="6" height="44" fill="#A87E5B"/><rect x="-26" y="-56" width="52" height="26" rx="4" fill="#E2C68E" stroke="#C79A72" stroke-width="2"/><path d="M-16 -47 h32 M-16 -40 h22" stroke="#9A7A5E" stroke-width="2.5" stroke-linecap="round"/>${notes.some((n) => !n.read) ? '<circle cx="24" cy="-58" r="7" fill="#E8656B"/>' : ''}` : '';
    },

    /** Giant Harvest: 'sunflower' | 'strawberry' | 'pumpkin' | 'tree', growth 0..1 (null clears). */
    setGiant(kind, growth) {
      $('giant').innerHTML = kind ? giantSVG(kind, growth) : '';
    },

    setFestival(on, season) {
      const g = $('festival');
      svg.dataset.festival = on ? 'on' : '';
      if (!on) { g.innerHTML = ''; return; }
      const colors = { spring: ['#F49AA0', '#FFFDF6', '#F6E3A1', '#9AD08A'], summer: ['#F6C445', '#F49AA0', '#8FC3E8', '#9AD08A'], autumn: ['#F29A4A', '#E8656B', '#F6C445', '#C2774A'], winter: ['#BFD9EA', '#FFFFFF', '#C9B6DD', '#F6E3A1'] }[season] || ['#F49AA0', '#F6E3A1'];
      let flags = '';
      for (let i = 0; i < 34; i++) {
        const x = 20 + i * 47;
        const y = 40 + Math.sin((i / 33) * Math.PI) * 60;
        flags += `<path d="M${x} ${y} l18 0 l-9 26Z" fill="${colors[i % colors.length]}"/>`;
      }
      let lanterns = '';
      for (let i = 0; i < 9; i++) lanterns += `<rect class="glow" x="${110 + i * 170}" y="${120 + (i % 2) * 20}" width="26" height="34" rx="11" fill="${colors[i % colors.length]}" style="animation-delay:${i * 0.3}s"/>`;
      g.innerHTML = `<path d="M0 40 Q 800 160 1600 40" stroke="#8B6B4E" stroke-width="2" fill="none"/>${flags}${lanterns}`;
      $('visitors').classList.toggle('dance', true);
      setTimeout(() => $('visitors').classList.remove('dance'), 9000);
    },

    setDance(on) {
      $('visitors').classList.toggle('dance', on);
      $('meadow').classList.toggle('dance', on);
    },

    setSeason(id) {
      svg.dataset.season = id || 'spring';
    },

    /** Renders the garden as a PNG (Garden Postcard). Resolves to a data: URL. */
    async postcard(caption) {
      const clone = svg.cloneNode(true);
      const time = svg.dataset.time;
      const vis = (sel, on) => clone.querySelectorAll(sel).forEach((n) => n.setAttribute('opacity', on ? '1' : '0'));
      vis('#dusk', time === 'evening');
      vis('#night, #stars, #moon', time === 'night');
      vis('#sun', time !== 'night');
      const season = svg.dataset.season;
      const tint = { autumn: '#E3A35F', winter: '#E4ECEE' }[season];
      if (tint) clone.querySelectorAll('.crown circle').forEach((c, i) => c.setAttribute('fill', season === 'autumn' ? ['#E3A35F', '#D9774F', '#EBC06A'][i % 3] : tint));
      // Copy the season's hill colours (they come from CSS, which a standalone image doesn't have).
      for (const cls of ['hill1', 'hill2', 'ground']) {
        const live = svg.querySelector('.' + cls);
        clone.querySelector('.' + cls)?.setAttribute('fill', getComputedStyle(live).fill);
      }
      clone.setAttribute('width', '1600');
      clone.setAttribute('height', '900');
      clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const xml = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FBF6EC';
      ctx.fillRect(0, 0, 1600, 1000);
      ctx.drawImage(img, 0, 0, 1600, 900);
      ctx.fillStyle = '#3D4A3F';
      ctx.font = '700 40px "Atkinson Hyperlegible", system-ui, sans-serif';
      ctx.fillText(caption, 40, 965);
      ctx.font = '400 26px "Atkinson Hyperlegible", system-ui, sans-serif';
      ctx.fillStyle = '#66756A';
      ctx.textAlign = 'right';
      ctx.fillText('grown in Keybloom', 1560, 962);
      return canvas.toDataURL('image/png');
    },

    renderDecor(items) {
      $('decor').innerHTML = items.map((d) => decorSVG(d)).join('');
    },

    /** Adds a sprout to the run bed and grows it smoothly to `to`. */
    addRunPlant(x, speciesId, to = 0.62, seed = 1) {
      const sp = BY_ID[speciesId];
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `translate(${Math.round(x)} ${BED_Y + 4}) scale(1.5)`);
      $('run-bed').appendChild(g);
      const p = { g, sp, growth: 0, target: to, seed };
      runPlants.push(p);
      return p;
    },

    bloomAll() {
      for (const p of runPlants) p.target = 1;
    },

    clearRunBed() {
      runPlants.length = 0;
      $('run-bed').innerHTML = '';
    },

    runPlantCount: () => runPlants.length,

    /** Called every frame: eases run plants toward their target growth. */
    tick(dt) {
      for (const p of runPlants) {
        if (Math.abs(p.target - p.growth) < 0.004) continue;
        p.growth += (p.target - p.growth) * Math.min(1, dt * 2.6);
        p.g.innerHTML = plantSVG(p.sp, p.growth, p.seed);
      }
    },

    setPipPose(pose) {
      const pip = $('pip');
      pip.dataset.pose = pose;
    },

    setWeather(kind) {
      const w = $('weather');
      w.dataset.kind = kind || '';
      w.innerHTML = weatherSVG(kind);
    },
  };
}

function weatherSVG(kind) {
  let s = '';
  const n = (count, fn) => { for (let i = 0; i < count; i++) s += fn(i); };
  switch (kind) {
    case 'fireflies':
      n(26, (i) => `<circle class="firefly" cx="${80 + ((i * 263) % 1440)}" cy="${300 + ((i * 131) % 420)}" r="3.2" style="--d:${(i % 9) * 0.7}s"/>`);
      break;
    case 'rain':
      n(70, (i) => `<path class="drop" d="M${(i * 113) % 1600} ${-20 - ((i * 71) % 300)} l-6 22" stroke="#8FB7D0" stroke-width="2.5" stroke-linecap="round" style="--d:${((i * 37) % 100) / 100}s"/>`);
      break;
    case 'snow':
      n(80, (i) => `<circle class="flake" cx="${(i * 97) % 1600}" cy="${-10 - ((i * 53) % 300)}" r="${2 + (i % 3)}" fill="#fff" style="--d:${((i * 41) % 100) / 12}s;--t:${7 + (i % 5)}s"/>`);
      break;
    case 'leaves':
      n(26, (i) => `<path class="leaf-fall" d="M${(i * 157) % 1600} -20 q 6 -8 12 0 q -6 8 -12 0Z" fill="${['#E3A35F', '#D9774F', '#EBC06A'][i % 3]}" style="--d:${((i * 29) % 100) / 10}s;--t:${8 + (i % 6)}s"/>`);
      break;
    case 'wind':
      n(24, (i) => `<g class="seed-drift" style="--d:${((i * 43) % 100) / 10}s;--y:${200 + ((i * 89) % 400)}px"><circle r="6" fill="#FFFDF6" opacity=".9"/><path d="M0 0 v10" stroke="#C9C2B6"/></g>`);
      break;
    case 'rainbow':
      s = ['#F49AA0', '#F6C445', '#F6E3A1', '#9AD08A', '#8FC3E8', '#B39DDB'].map((c, i) => `<path d="M200 640 A 600 520 0 0 1 1400 640" stroke="${c}" stroke-width="18" fill="none" opacity=".55" transform="translate(0 ${i * 18})"/>`).join('');
      s = `<g class="rainbow-in">${s}</g>`;
      break;
    case 'wish':
      s = '<g class="shooting"><path d="M0 0 l-120 40" stroke="#FFF9E6" stroke-width="3" stroke-linecap="round" opacity=".8"/><circle r="6" fill="#FFF9E6"/></g>';
      break;
  }
  return s;
}

function mysterySVG(stage) {
  const h = 8 + stage * 9;
  return `<ellipse cx="0" cy="1" rx="12" ry="3.5" fill="#8B6B4E" opacity=".55"/>${stage > 0 ? `<path d="M0 0 V${-h}" stroke="#7AAE6A" stroke-width="2.2" stroke-linecap="round"/><path d="M0 ${-h * 0.6} q 9 -4 12 -12 q -10 0 -12 8 M0 ${-h * 0.4} q -9 -4 -12 -12 q 10 0 12 8" fill="#94C47E"/>` : '<ellipse cx="0" cy="-1" rx="6" ry="3.5" fill="#A07A55"/>'}<g transform="translate(14 -10)"><path d="M0 0 V14" stroke="#A87E5B" stroke-width="2"/><rect x="-9" y="-14" width="18" height="16" rx="3" fill="#F3E3CB" stroke="#C79A72"/><text x="0" y="-1" text-anchor="middle" font-size="13" font-weight="700" fill="#8A6FC4">?</text></g>`;
}

function storyTreeSVG(pages) {
  const k = Math.min(1, 0.35 + pages / 27);
  const books = Math.min(12, pages);
  let s = `<g transform="scale(${k.toFixed(2)})"><rect x="-7" y="-60" width="14" height="60" rx="5" fill="#9A7A5E"/>`;
  s += '<g class="crown"><circle cx="0" cy="-96" r="46" fill="#A9C998"/><circle cx="-34" cy="-74" r="30" fill="#A9C998"/><circle cx="34" cy="-76" r="32" fill="#A9C998"/></g>';
  const spots = [[-30, -80], [20, -110], [32, -70], [-8, -122], [-40, -100], [8, -84], [44, -96], [-20, -60], [16, -58], [-50, -70], [0, -100], [30, -120]];
  const colors = ['#F49AA0', '#8FC3E8', '#F6C445', '#B39DDB', '#9AD08A', '#F29A4A'];
  for (let i = 0; i < books; i++) {
    const [x, y] = spots[i];
    s += `<g transform="translate(${x} ${y}) rotate(${(i % 3) * 8 - 8})"><path d="M0 -10 v-6" stroke="#8B6B4E" stroke-width="1.5"/><rect x="-7" y="-10" width="14" height="17" rx="2" fill="${colors[i % colors.length]}"/><path d="M0 -10 v17" stroke="#fff" stroke-width="1.5" opacity=".7"/></g>`;
  }
  return s + '</g>';
}

function giantSVG(kind, growth) {
  const g = Math.max(0, Math.min(1, growth));
  const k = 0.25 + g * 0.75;
  if (kind === 'tree') {
    let s = `<g transform="scale(${k.toFixed(3)})"><path d="M-30 0 C -24 -80, -30 -170, -14 -240 H14 C 30 -170, 24 -80, 30 0Z" fill="#8B6B4E"/>`;
    s += '<path d="M-14 -200 C -60 -230, -90 -250, -120 -300 M14 -210 C 60 -240, 100 -260, 130 -310 M0 -240 V-330" stroke="#8B6B4E" stroke-width="14" stroke-linecap="round" fill="none"/>';
    if (g > 0.3) s += `<g opacity="${Math.min(1, (g - 0.3) * 2)}"><circle cx="0" cy="-330" r="80" fill="#DCE8E2"/><circle cx="-120" cy="-300" r="62" fill="#E4ECEE"/><circle cx="130" cy="-310" r="66" fill="#DCE8E2"/></g>`;
    if (g > 0.6) for (let i = 0; i < 14; i++) s += `<rect class="glow" x="${-150 + ((i * 47) % 300)}" y="${-380 + ((i * 61) % 140)}" width="12" height="16" rx="5" fill="${['#F6E3A1', '#F49AA0', '#BFD9EA'][i % 3]}" style="animation-delay:${i * 0.2}s"/>`;
    return s + '</g>';
  }
  const sp = BY_ID[kind];
  const scale = kind === 'sunflower' ? 3.4 : 5.6;
  return `<g transform="scale(${(k * scale).toFixed(3)})">${plantSVG(sp, 0.2 + g * 0.8, 77)}</g>`;
}

export function homeSlots() {
  const slots = [];
  for (let r = 0; r < HOME_ROWS.length; r++) {
    for (let i = 0; i < 12; i++) slots.push({ x: 300 + i * 98 + (r ? 45 : 0), y: HOME_ROWS[r], scale: r ? 1.45 : 1.25 });
  }
  return slots;
}

function stars() {
  let s = '';
  for (let i = 0; i < 60; i++) s += `<circle cx="${(i * 389) % 1600}" cy="${(i * 211) % 420}" r="${1 + (i % 3) * 0.6}" fill="#FFF9E6" opacity="${0.4 + (i % 5) * 0.12}"/>`;
  return s;
}

function cloud(x, y, k) {
  return `<g class="cloud" style="--x:${x}px;--k:${k};--t:${90 + (x % 50)}s" transform="translate(${x} ${y}) scale(${k})">
    <ellipse cx="0" cy="0" rx="70" ry="26" fill="#FFFDF8" opacity=".92"/>
    <ellipse cx="-38" cy="6" rx="40" ry="20" fill="#FFFDF8" opacity=".92"/>
    <ellipse cx="34" cy="-12" rx="44" ry="28" fill="#FFFDF8" opacity=".92"/></g>`;
}

function trees() {
  const t = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-5" y="-10" width="10" height="44" rx="4" fill="#9A7A5E"/><g class="crown"><circle cx="0" cy="-30" r="34" fill="${c}"/><circle cx="-22" cy="-14" r="22" fill="${c}"/><circle cx="22" cy="-16" r="24" fill="${c}"/></g></g>`;
  return t(330, 560, 1.1, '#9DBF8B') + t(410, 575, 0.8, '#A9C998') + t(1080, 548, 1.25, '#94B984') + t(1180, 568, 0.85, '#A9C998') + t(1540, 560, 1, '#9DBF8B');
}

function cottage() {
  return `<g transform="translate(560 520)">
    <rect x="0" y="40" width="150" height="90" rx="6" fill="#F3E3CB"/>
    <path d="M-14 46 L75 -14 L164 46Z" fill="#D99A86"/>
    <rect x="58" y="78" width="34" height="52" rx="14" fill="#B98563"/>
    <rect x="16" y="66" width="30" height="26" rx="5" fill="#FFF2B8"/><rect x="104" y="66" width="30" height="26" rx="5" fill="#FFF2B8"/>
    <path d="M31 66 V92 M16 79 H46 M119 66 V92 M104 79 H134" stroke="#E6CFAE" stroke-width="2.5"/>
    <rect x="112" y="-2" width="16" height="30" fill="#C98C78"/>
  </g>`;
}

function fence() {
  let s = '<g opacity=".9">';
  for (let x = 20; x < 1600; x += 46) s += `<path d="M${x} 652 v-46 l8 -9 l8 9 v46Z" fill="#F7EEDF"/>`;
  s += '<rect x="0" y="616" width="1600" height="7" rx="3" fill="#EFE2CC"/><rect x="0" y="636" width="1600" height="7" rx="3" fill="#EFE2CC"/></g>';
  return s;
}
