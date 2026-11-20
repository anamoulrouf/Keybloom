// Shows a line of text being typed: finished letters soften, the next letter is underlined and
// larger, a wrong key makes it wobble in lavender (shape + colour, never red).
import { charHTML, esc } from './dom.js';

export function createLineView(container) {
  const box = document.createElement('div');
  box.className = 'line-view';
  container.appendChild(box);
  let spans = [];
  let typoEl = null;

  return {
    el: box,
    setText(text) {
      // Letters are grouped into words that never break across lines (only spaces can wrap).
      const html = text.split(/( )/).filter((t) => t !== '').map((t) => (t === ' ' ? charHTML(' ') : `<span class="w">${[...t].map(charHTML).join('')}</span>`)).join('');
      box.innerHTML = html + '<span class="typos"></span>';
      spans = [...box.querySelectorAll('.ch')];
      typoEl = box.querySelector('.typos');
      this.setPos(0);
    },
    setPos(pos) {
      spans.forEach((s, i) => {
        s.classList.toggle('done', i < pos);
        s.classList.toggle('cur', i === pos);
      });
    },
    wobble(pos) {
      const s = spans[pos];
      if (!s) return;
      s.classList.remove('miss');
      void s.offsetWidth;
      s.classList.add('miss');
    },
    setTypos(t) {
      if (typoEl) typoEl.textContent = t ? '' : '';
      if (typoEl) typoEl.innerHTML = t ? esc(t) : '';
    },
    destroy() { box.remove(); },
  };
}
