// Gentle DOM particles: petal puffs, sparkles and seeds flying to the bed.
const MAX = 48;
let layer = null;
let live = 0;
const PETALS = ['#F4BFA6', '#F6E3A1', '#C9B6DD', '#FBD3DC', '#BFD9EA', '#FFFDF6'];

function ensureLayer() {
  if (layer) return layer;
  layer = document.createElement('div');
  layer.className = 'particles';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  return layer;
}

export function calmLevel() {
  const b = document.body.classList;
  if (b.contains('reduced')) return 0;
  if (b.contains('pace-calm')) return 0.5;
  return 1;
}

export function puff(x, y, n = 6, colors = PETALS) {
  const k = calmLevel();
  const count = Math.round(n * k);
  if (!count) return;
  const L = ensureLayer();
  for (let i = 0; i < count && live < MAX; i++) {
    const p = document.createElement('i');
    p.className = 'petal';
    const a = Math.random() * Math.PI * 2;
    const d = 30 + Math.random() * 40;
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 20}px;--r:${Math.random() * 360}deg;background:${colors[i % colors.length]}`;
    L.appendChild(p);
    live++;
    setTimeout(() => { p.remove(); live--; }, 1300);
  }
}

export function sparkle(x, y) {
  if (!calmLevel()) return;
  const L = ensureLayer();
  if (live >= MAX) return;
  const s = document.createElement('i');
  s.className = 'spark';
  s.style.cssText = `left:${x}px;top:${y}px`;
  L.appendChild(s);
  live++;
  setTimeout(() => { s.remove(); live--; }, 700);
}

/** A seed arcs from (x1,y1) to (x2,y2); resolves when it lands. */
export function flySeed(x1, y1, x2, y2, color = '#A07A55') {
  return new Promise((resolve) => {
    const L = ensureLayer();
    const s = document.createElement('i');
    s.className = 'seed-fly';
    s.style.cssText = `left:${x1}px;top:${y1}px;background:${color}`;
    L.appendChild(s);
    const dur = calmLevel() ? 650 : 1;
    const anim = s.animate(
      [
        { transform: 'translate(0,0) scale(1)' },
        { transform: `translate(${(x2 - x1) / 2}px, ${Math.min(y1, y2) - y1 - 80}px) scale(1.2)`, offset: 0.45 },
        { transform: `translate(${x2 - x1}px, ${y2 - y1}px) scale(.8)` },
      ],
      { duration: dur, easing: 'ease-in-out' },
    );
    anim.onfinish = () => { s.remove(); resolve(); };
  });
}
