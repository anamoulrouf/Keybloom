// Procedural plant generator: species data + growth (0..1) → an SVG <g> string.
// Origin (0,0) is the soil line; the plant grows upward (negative y). Seeded so each plant has its
// own small personality (lean, leaf angles) but redraws identically every frame.
import { mulberry32 } from '../core/rng.js';

const RAINBOW = ['#F49AA0', '#F6C445', '#9AD08A', '#8FC3E8', '#B39DDB'];
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (g, a, b) => clamp01((g - a) / (b - a));
const f = (n) => Math.round(n * 10) / 10;

function leafPath(shape, len, w) {
  if (shape === 'round') return `M0 0 C ${f(w)} ${f(-len * 0.2)}, ${f(w)} ${f(-len * 0.9)}, 0 ${f(-len)} C ${f(-w)} ${f(-len * 0.9)}, ${f(-w)} ${f(-len * 0.2)}, 0 0Z`;
  if (shape === 'heart') return `M0 0 C ${f(w * 1.3)} ${f(-len * 0.3)}, ${f(w * 0.9)} ${f(-len)}, 0 ${f(-len * 0.8)} C ${f(-w * 0.9)} ${f(-len)}, ${f(-w * 1.3)} ${f(-len * 0.3)}, 0 0Z`;
  return `M0 0 Q ${f(w)} ${f(-len * 0.5)} 0 ${f(-len)} Q ${f(-w)} ${f(-len * 0.5)} 0 0Z`; // long
}

function fernLeaf(len, color) {
  let s = `<path d="M0 0 L0 ${f(-len)}" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`;
  for (let i = 1; i <= 4; i++) {
    const y = -len * (i / 5);
    const l = len * 0.32 * (1 - i / 6);
    s += `<path d="M0 ${f(y)} q ${f(l)} ${f(-l * 0.4)} ${f(l * 1.1)} ${f(-l)} M0 ${f(y)} q ${f(-l)} ${f(-l * 0.4)} ${f(-l * 1.1)} ${f(-l)}" stroke="${color}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

function bloomSVG(sp, open, rng) {
  const r = sp.size * (0.35 + 0.65 * open);
  const petalColor = (i) => (sp.petal === 'rainbow' ? RAINBOW[i % RAINBOW.length] : sp.petal);
  let s = '';
  switch (sp.bloom) {
    case 'daisy':
    case 'sun': {
      const n = sp.petals;
      const pl = r * (sp.bloom === 'sun' ? 0.95 : 0.85);
      for (let i = 0; i < n; i++) {
        const a = (360 / n) * i + rng() * 6;
        s += `<ellipse cx="0" cy="${f(-pl * 0.62)}" rx="${f(Math.max(1.6, (r * 2.4) / n + 1))}" ry="${f(pl * 0.62)}" fill="${petalColor(i)}" transform="rotate(${f(a)})"/>`;
      }
      s += `<circle r="${f(r * (sp.bloom === 'sun' ? 0.48 : 0.34))}" fill="${sp.center}"/>`;
      if (sp.bloom === 'sun') s += `<circle r="${f(r * 0.3)}" fill="#6E4630" opacity=".45"/>`;
      return s;
    }
    case 'tulip': {
      const w = r * 0.85, h = r * 1.3;
      s += `<path d="M${f(-w)} 0 C ${f(-w)} ${f(-h * 0.9)}, ${f(-w * 0.35)} ${f(-h)}, 0 ${f(-h * 0.7)} C ${f(w * 0.35)} ${f(-h)}, ${f(w)} ${f(-h * 0.9)}, ${f(w)} 0 C ${f(w * 0.6)} ${f(h * 0.35)}, ${f(-w * 0.6)} ${f(h * 0.35)}, ${f(-w)} 0Z" fill="${petalColor(0)}"/>`;
      s += `<path d="M0 ${f(h * 0.2)} C ${f(-w * 0.45)} ${f(-h * 0.2)}, ${f(-w * 0.2)} ${f(-h * 0.8)}, 0 ${f(-h * 0.95)} C ${f(w * 0.2)} ${f(-h * 0.8)}, ${f(w * 0.45)} ${f(-h * 0.2)}, 0 ${f(h * 0.2)}Z" fill="${sp.center}" opacity="${f(0.55 + open * 0.3)}"/>`;
      return s;
    }
    case 'bell': {
      for (let i = 0; i < sp.petals; i++) {
        const x = (i - (sp.petals - 1) / 2) * r * 1.3;
        const y = i * r * 0.9;
        s += `<path d="M${f(x)} ${f(y - r * 0.2)} q ${f(r * 0.05)} ${f(-r * 0.2)} 0 ${f(-r * 0.5)}" stroke="#6E9E62" stroke-width="1.2" fill="none"/>`;
        s += `<path d="M${f(x - r * 0.7)} ${f(y + r)} C ${f(x - r * 0.7)} ${f(y - r * 0.2)}, ${f(x + r * 0.7)} ${f(y - r * 0.2)}, ${f(x + r * 0.7)} ${f(y + r)} q ${f(-r * 0.35)} ${f(-r * 0.25)} ${f(-r * 0.7)} 0 q ${f(-r * 0.35)} ${f(r * 0.25)} ${f(-r * 0.7)} 0Z" fill="${petalColor(i)}"/>`;
      }
      return s;
    }
    case 'puff': {
      for (let i = 0; i < sp.petals; i++) {
        const y = -i * r * 0.9;
        s += `<circle cx="${f((rng() - 0.5) * r * 0.8)}" cy="${f(y)}" r="${f(r * (0.75 + rng() * 0.3))}" fill="${i % 2 ? sp.center : petalColor(i)}"/>`;
      }
      return s;
    }
    case 'berry': {
      s += `<path d="M0 ${f(-r)} C ${f(r * 1.2)} ${f(-r)}, ${f(r * 0.9)} ${f(r * 1.2)}, 0 ${f(r * 1.6)} C ${f(-r * 0.9)} ${f(r * 1.2)}, ${f(-r * 1.2)} ${f(-r)}, 0 ${f(-r)}Z" fill="${sp.petal}"/>`;
      for (let i = 0; i < 6; i++) s += `<circle cx="${f((rng() - 0.5) * r)}" cy="${f(rng() * r * 1.2 - r * 0.3)}" r=".8" fill="#FFF4C8"/>`;
      s += `<path d="M${f(-r * 0.8)} ${f(-r)} l${f(r * 0.4)} ${f(-r * 0.5)} l${f(r * 0.4)} ${f(r * 0.3)} l${f(r * 0.4)} ${f(-r * 0.3)} l${f(r * 0.4)} ${f(r * 0.5)}Z" fill="#6E9E62"/>`;
      return s;
    }
    case 'cluster': {
      const n = Math.max(3, sp.petals);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rng() * 0.5;
        const d = r * 0.55 * (i % 2 ? 1 : 0.6);
        s += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(r * 0.38)}" fill="${i % 3 ? sp.petal : sp.center}"/>`;
      }
      s += `<circle cx="${f(-r * 0.15)}" cy="${f(-r * 0.2)}" r="${f(r * 0.12)}" fill="#fff" opacity=".6"/>`;
      return s;
    }
    default:
      return '';
  }
}

/**
 * plantSVG(species, growth, seed) → '<g>…</g>'
 * growth: 0–0.15 seed mound · 0.15–0.5 sprout and stem · 0.5–0.8 leaves · 0.8–0.9 bud · 0.9–1 bloom
 */
export function plantSVG(sp, growth, seed = 1) {
  const g = clamp01(growth);
  const rng = mulberry32(seed);
  const lean = (rng() - 0.5) * 10;
  let out = `<g class="plant" data-species="${sp.id}">`;
  out += `<ellipse cx="0" cy="1" rx="${f(10 + g * 6)}" ry="3.5" fill="#8B6B4E" opacity=".55"/>`;
  if (g < 0.15) {
    const s = seg(g, 0, 0.15);
    out += `<ellipse cx="0" cy="-1" rx="${f(4 + s * 2)}" ry="${f(2.5 + s)}" fill="#A07A55"/>`;
    if (s > 0.5) out += `<path d="M0 -2 q 1.5 -4 3 -5" stroke="${sp.stem}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    return out + '</g>';
  }
  const isVeg = sp.bloom === 'veg' || sp.bloom === 'leafy' || sp.bloom === 'gourd';
  const stemH = sp.h * (0.18 + 0.82 * seg(g, 0.15, 0.85));
  const tipX = lean * seg(g, 0.15, 1);
  // Veg: root shows at the soil
  if (sp.bloom === 'veg') {
    const vr = sp.size * (0.3 + 0.7 * seg(g, 0.5, 1));
    out += `<path d="M${f(-vr * 0.7)} -2 Q 0 ${f(vr * 0.5)} ${f(vr * 0.7)} -2Z" fill="${sp.petal}"/>`;
  }
  // Gourd: a round fruit sits on the soil and swells as it ripens
  const gourd = sp.bloom === 'gourd' ? sp.size * (0.15 + 0.85 * seg(g, 0.45, 1)) : 0;
  if (!isVeg || sp.bloom === 'veg') {
    if (sp.bloom !== 'veg') out += `<path d="M0 0 Q ${f(tipX * 0.2)} ${f(-stemH * 0.5)} ${f(tipX)} ${f(-stemH)}" stroke="${sp.stem}" stroke-width="${f(sp.h > 100 ? 3.2 : 2.2)}" fill="none" stroke-linecap="round"/>`;
  }
  // Leaves
  const leafCount = Math.max(1, Math.round(sp.leaves * (0.3 + 0.7 * seg(g, 0.2, 0.8))));
  const leafScale = 0.4 + 0.6 * seg(g, 0.2, 0.85);
  for (let i = 0; i < leafCount; i++) {
    const side = i % 2 ? 1 : -1;
    if (isVeg) {
      const a = side * (10 + i * (60 / sp.leaves)) + (rng() - 0.5) * 10;
      const len = (sp.bloom === 'leafy' ? sp.size : sp.h * 0.8) * leafScale * (0.8 + rng() * 0.3);
      const body = sp.leafShape === 'fern' ? fernLeaf(len, sp.leaf) : `<path d="${leafPath(sp.leafShape, len, len * 0.45)}" fill="${sp.leaf}"/>`;
      out += `<g transform="rotate(${f(a)})">${body}</g>`;
      continue;
    }
    const t = 0.15 + (i / leafCount) * 0.6;
    const x = tipX * t * t, y = -stemH * t;
    const a = side * (40 + rng() * 25);
    const len = Math.min(28, sp.h * 0.28) * leafScale;
    const body = sp.leafShape === 'fern' ? fernLeaf(len, sp.leaf) : `<path d="${leafPath(sp.leafShape, len, len * 0.38)}" fill="${sp.leaf}"/>`;
    out += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">${body}</g>`;
  }
  if (gourd) {
    const ripe = seg(g, 0.75, 1);
    const col = ripe > 0.5 ? sp.petal : '#B7C46A';
    out += `<g transform="translate(${f(lean * 0.6)} 0)"><ellipse cx="0" cy="${f(-gourd * 0.62)}" rx="${f(gourd)}" ry="${f(gourd * 0.66)}" fill="${col}"/>`;
    out += `<path d="M0 ${f(-gourd * 1.25)} Q ${f(-gourd * 0.5)} ${f(-gourd * 0.62)} 0 0 M0 ${f(-gourd * 1.25)} Q ${f(gourd * 0.5)} ${f(-gourd * 0.62)} 0 0" stroke="${sp.center}" stroke-width="1.6" fill="none" opacity=".7"/>`;
    out += `<path d="M0 ${f(-gourd * 1.22)} q 2 -6 6 -7" stroke="#7A6A3E" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  }
  // Bud → bloom
  if (!isVeg && g >= 0.8) {
    const open = seg(g, 0.88, 1);
    out += `<g class="bloom" transform="translate(${f(tipX)} ${f(-stemH)})">`;
    if (open <= 0) {
      const b = 3 + seg(g, 0.8, 0.88) * 3;
      out += `<ellipse rx="${f(b * 0.7)}" ry="${f(b)}" fill="${sp.petal === 'rainbow' ? RAINBOW[0] : sp.petal}" stroke="${sp.stem}" stroke-width="1.2"/>`;
    } else {
      out += bloomSVG(sp, open, rng);
    }
    out += '</g>';
  }
  return out + '</g>';
}
