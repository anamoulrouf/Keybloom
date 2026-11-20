// A small "well done" moment after a word or sentence: a floating card with the stars earned,
// and a few star sparkles flying to the star counter. One at a time, short, calm.
import { el, esc } from './dom.js';
import { calmLevel } from '../scene/particles.js';

let current = null;

export function cheer({ text, stars = 0, x, y, big = false, gentle = false }) {
  current?.remove();
  const node = el(`<div class="cheer ${big ? 'big' : ''} ${gentle ? 'gentle' : ''}" role="status"><b>${esc(text)}</b>${stars ? `<span>+${stars} ⭐</span>` : ''}</div>`);
  node.style.left = `${Math.round(x ?? innerWidth / 2)}px`;
  node.style.top = `${Math.round(y ?? innerHeight * 0.3)}px`;
  document.body.appendChild(node);
  current = node;
  setTimeout(() => { node.remove(); if (current === node) current = null; }, big ? 1700 : 1000);
  if (stars && calmLevel() > 0) flyStars(x ?? innerWidth / 2, y ?? innerHeight * 0.3, Math.min(big ? 6 : 3, stars));
}

/** Little stars fly from (x, y) to the star counter. */
function flyStars(x, y, n) {
  const target = document.querySelector('#stars-hud');
  if (!target || target.offsetParent === null) return;
  const r = target.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const s = el('<i class="fly-star" aria-hidden="true">⭐</i>');
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    document.body.appendChild(s);
    const dx = r.left + r.width / 2 - x, dy = r.top + r.height / 2 - y;
    requestAnimationFrame(() => {
      s.style.transitionDelay = `${i * 80}ms`;
      s.style.transform = `translate(${dx}px, ${dy}px) scale(.6)`;
      s.style.opacity = '0.2';
    });
    setTimeout(() => s.remove(), 900 + i * 80);
  }
}
