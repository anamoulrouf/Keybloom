// Gardener profiles (up to 4 on one computer) and garden visits: siblings can look at each
// other's gardens and leave a typed note on the little wooden sign.
import { el, esc } from './dom.js';
import { listProfiles, setActive, addProfile, getProfile, save, MAX_PROFILES } from './save.js';

export function profilesScreen(game) {
  game.persist();
  const { profiles } = listProfiles();
  const root = el(`<section class="screen center" aria-label="Gardeners"><div class="card narrow">
    <header class="row"><h2>Who's gardening?</h2><button class="btn" data-act="back">Back</button></header>
    <ul class="profiles">${profiles.map((p) => `<li><button class="btn ${p.id === game.profile.id ? 'primary' : ''}" data-id="${p.id}"><b>${esc(p.name || 'New gardener')}</b> <small>${esc(p.garden || '')}</small><span class="pstars">⭐ ${p.stars}</span></button></li>`).join('')}</ul>
    ${profiles.length < MAX_PROFILES ? '<button class="btn" data-act="add">+ A new gardener</button>' : `<p class="small muted">${MAX_PROFILES} gardeners is the most this computer can hold.</p>`}
    <p class="small muted">Each gardener has their own garden, keys and progress. Everything stays on this computer.</p>
  </div></section>`);
  game.app.appendChild(root);
  root.querySelector('[data-act="back"]').addEventListener('click', () => game.go(game.profile.onboarded ? 'home' : 'title'));
  root.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.id === game.profile.id) return game.go(game.profile.onboarded ? 'home' : 'title');
    setActive(b.dataset.id);
    location.reload();
  }));
  root.querySelector('[data-act="add"]')?.addEventListener('click', () => {
    if (addProfile()) location.reload();
  });
  root.querySelector('.btn.primary')?.focus();
  return { destroy: () => root.remove() };
}

export function visitScreen(game, { id } = {}) {
  const others = listProfiles().profiles.filter((p) => p.id !== game.profile.id && p.onboarded);
  const root = el('<section class="screen visit" aria-label="Visit a garden"></section>');
  game.app.appendChild(root);

  function chooser() {
    root.className = 'screen center';
    root.innerHTML = `<div class="card narrow"><header class="row"><h2>Visit a garden</h2><button class="btn" data-act="home">Back</button></header>
      <ul class="profiles">${others.map((p) => `<li><button class="btn" data-id="${p.id}"><b>${esc(p.name)}</b> <small>${esc(p.garden)}</small><span class="pstars">⭐ ${p.stars}</span></button></li>`).join('')}</ul></div>`;
    root.querySelector('[data-act="home"]').addEventListener('click', () => game.go('home'));
    root.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => visit(b.dataset.id)));
    root.querySelector('[data-id]')?.focus();
  }

  function visit(otherId) {
    const other = getProfile(otherId);
    if (!other) return chooser();
    game.showGarden(other);
    root.className = 'screen visit';
    root.innerHTML = `<div class="card visit-card">
      <h2>${esc(other.garden)}</h2>
      <p class="pstars-line">⭐ ${other.stars || 0} stars</p>
      <p class="muted">${esc(other.name)}'s garden: ${other.homeGarden.plants.length} plants, ${other.visitorsSeen.length} visitors, best speed ${other.bestWpm || 0} WPM.</p>
      <form class="note-form"><label>Leave a note on ${esc(other.name)}'s garden sign
        <input name="note" maxlength="80" autocomplete="off" placeholder="Your sunflowers are SO tall!"></label>
        <div class="row"><button class="btn primary">Pin the note</button><button class="btn" type="button" data-act="home">Back home</button></div>
      </form><p class="small muted" role="status"></p></div>`;
    root.querySelector('[data-act="home"]').addEventListener('click', () => game.go('home'));
    const form = root.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = form.note.value.trim().slice(0, 80);
      if (!text) return;
      const fresh = getProfile(otherId);
      fresh.notes = [...(fresh.notes || []), { from: game.profile.name, text, day: game.today(), read: false }].slice(-10);
      save(fresh);
      game.scene.renderSign(fresh.notes);
      form.note.value = '';
      root.querySelector('[role="status"]').textContent = `Pinned! ${other.name} will see it next time they come to the garden.`;
      game.audio.sparkle(5);
    });
    form.note.focus();
  }

  if (id) visit(id);
  else if (others.length === 1) visit(others[0].id);
  else chooser();
  return { destroy: () => root.remove() };
}
