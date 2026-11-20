// On-screen keyboard with colour-coded fingers. Hint stages (from the adaptive engine):
//   0 full: every key coloured by finger + the next key glows + finger name
//   1 next: plain keys, only the next key glows
//   2 hidden: no keyboard ("eyes on the garden"); it comes back if the child struggles.
// Capitals and shifted symbols light up the key AND the Shift key on the other hand.
import { esc } from '../ui/dom.js';

const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['shiftL', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shiftR'],
];
export const FINGER = {
  q: 'lp', a: 'lp', z: 'lp', w: 'lr', s: 'lr', x: 'lr', e: 'lm', d: 'lm', c: 'lm',
  r: 'li', f: 'li', v: 'li', t: 'li', g: 'li', b: 'li',
  y: 'ri', h: 'ri', n: 'ri', u: 'ri', j: 'ri', m: 'ri',
  i: 'rm', k: 'rm', ',': 'rm', o: 'rr', l: 'rr', '.': 'rr', p: 'rp', ';': 'rp', "'": 'rp', '/': 'rp', ' ': 'th',
  1: 'lp', 2: 'lr', 3: 'lm', 4: 'li', 5: 'li', 6: 'ri', 7: 'ri', 8: 'rm', 9: 'rr', 0: 'rp', '-': 'rp', '=': 'rp',
  shiftL: 'lp', shiftR: 'rp',
};
export const FINGER_NAME = {
  lp: 'left little finger', lr: 'left ring finger', lm: 'left middle finger', li: 'left pointer finger',
  ri: 'right pointer finger', rm: 'right middle finger', rr: 'right ring finger', rp: 'right little finger', th: 'thumb',
};
/** Shifted characters → the key they live on (US QWERTY). */
export const SHIFTED = { '!': '1', '?': '/', '"': "'", ':': ';', '+': '=', _: '-', '@': '2', '#': '3', $: '4', '%': '5', '(': '9', ')': '0' };

/** Which physical key and whether Shift is needed for a character. */
export function keyFor(ch) {
  if (!ch) return { key: null, shift: false };
  if (SHIFTED[ch]) return { key: SHIFTED[ch], shift: true };
  if (/[A-Z]/.test(ch)) return { key: ch.toLowerCase(), shift: true };
  return { key: ch, shift: false };
}

const LABEL = { shiftL: 'shift', shiftR: 'shift' };

export function createKeyboard(container) {
  const wrap = document.createElement('div');
  wrap.className = 'kb';
  wrap.innerHTML =
    ROWS.map((row, r) => `<div class="kb-row r${r}">${row.map((k) => `<span class="key f-${FINGER[k]}${LABEL[k] ? ' shift' : ''}" data-k="${esc(k)}">${esc(LABEL[k] || k)}</span>`).join('')}</div>`).join('') +
    `<div class="kb-row"><span class="key space f-th" data-k=" ">space</span></div><div class="kb-finger" aria-live="off"></div>`;
  container.appendChild(wrap);
  const keyEl = (k) => wrap.querySelector(`[data-k="${CSS.escape(k)}"]`);
  let lit = [];

  return {
    el: wrap,
    setStage(stage) {
      wrap.dataset.stage = String(stage);
    },
    /** keys: characters the child can use; 'shift' unlocks both Shift keys. Digits row hides if unused. */
    setUnlocked(keys) {
      const set = new Set(keys);
      const usesDigits = [...set].some((k) => /[0-9=-]/.test(k));
      wrap.classList.toggle('no-digits', !usesDigits);
      wrap.querySelectorAll('.key').forEach((k) => {
        const id = k.dataset.k;
        const open = id === ' ' || set.has(id) || (id.startsWith('shift') && set.has('shift'));
        k.classList.toggle('locked', !open);
      });
    },
    setNext(ch) {
      lit.forEach((k) => k.classList.remove('next'));
      lit = [];
      const { key, shift } = keyFor(ch);
      const main = key ? keyEl(key) : null;
      if (main) lit.push(main);
      const f = key ? FINGER[key] : null;
      let shiftSide = null;
      if (shift && f) {
        shiftSide = f[0] === 'l' ? 'shiftR' : 'shiftL';
        lit.push(keyEl(shiftSide));
      }
      lit.forEach((k) => k && k.classList.add('next'));
      const finger = f ? `<i class="dot f-${f}"></i>${FINGER_NAME[f]}` : '';
      wrap.querySelector('.kb-finger').innerHTML = shiftSide ? `Hold <b>Shift</b> with your ${FINGER_NAME[FINGER[shiftSide]]}, then ${finger}` : finger;
    },
    /** A soft secondary glow on several keys (Garden Play: first letters of the words on screen). */
    setHints(chars) {
      wrap.querySelectorAll('.key.hint').forEach((k) => k.classList.remove('hint'));
      for (const ch of chars || []) {
        const { key, shift } = keyFor(ch);
        const k = key ? keyEl(key) : null;
        if (k) k.classList.add('hint');
        if (shift && key) keyEl(FINGER[key]?.[0] === 'l' ? 'shiftR' : 'shiftL')?.classList.add('hint');
      }
    },
    flash(ch, ok) {
      const k = keyEl(keyFor(ch).key || '');
      if (!k) return;
      k.classList.remove('ok', 'no');
      void k.offsetWidth;
      k.classList.add(ok ? 'ok' : 'no');
    },
    destroy() { wrap.remove(); },
  };
}
