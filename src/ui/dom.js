// Tiny DOM helpers.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function on(root, selector, event, fn) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) fn(e, target);
  });
}

export const charHTML = (c) => (c === ' ' ? '<span class="ch sp">&nbsp;</span>' : `<span class="ch">${esc(c)}</span>`);
