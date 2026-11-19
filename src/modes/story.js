// Story Seeds: type one page of a short garden story. Typos must be fixed with Backspace here
// (real-world typing). Every finished page grows the storybook tree in the garden.
import { lineRunner } from './line-runner.js';
import { STORIES } from '../data/stories.js';
import { KEY_GROUPS } from '../core/adaptive.js';
import { el, esc } from '../ui/dom.js';

const ALL_KEYS = [...KEY_GROUPS.flat(), ',', '.', "'", '/', ';', 'shift', '1'];

/** The story list: pick a story and see which page is next. */
export function storiesScreen(game) {
  const p = game.profile;
  const root = el(`<section class="screen center" aria-label="Story Seeds"><div class="card wide">
    <header class="row"><h2>Story Seeds</h2><button class="btn" data-go="home">Back</button></header>
    <p class="muted small">Type a page of a story. Here you fix your own typos with <kbd>Backspace</kbd>, like real writing. Every page grows a book on your storybook tree (${p.storyPages} so far).</p>
    <ul class="stories">${STORIES.map((s) => {
      const done = p.stories[s.id] || 0;
      const next = done >= s.pages.length ? 0 : done;
      return `<li><b>${esc(s.title)}</b><span class="small muted">${done >= s.pages.length ? 'Finished! Type it again?' : `Page ${next + 1} of ${s.pages.length}`}</span>
        <span class="pages-dots">${s.pages.map((_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('')}</span>
        <button class="btn small ${done && done < s.pages.length ? 'primary' : ''}" data-story="${s.id}" data-page="${next}">${done >= s.pages.length ? 'Read again' : done ? 'Keep going' : 'Start'}</button></li>`;
    }).join('')}</ul></div></section>`);
  game.app.appendChild(root);
  root.querySelector('[data-go]').addEventListener('click', () => game.go('home'));
  root.querySelectorAll('[data-story]').forEach((b) => b.addEventListener('click', () => game.go('story', { id: b.dataset.story, page: Number(b.dataset.page) })));
  (root.querySelector('.btn.primary[data-story]') || root.querySelector('[data-story]'))?.focus();
  return { destroy: () => root.remove() };
}

export function storyMode(game, { id, page = 0 }) {
  const story = STORIES.find((s) => s.id === id) || STORIES[0];
  const lines = story.pages[page];
  return lineRunner(game, {
    mode: 'story',
    title: story.title,
    subtitle: `Page ${page + 1} of ${story.pages.length}. Capitals need <kbd>Shift</kbd>. If you slip, press <kbd>Backspace</kbd> to fix it.`,
    keyboard: 'stage',
    keys: ALL_KEYS,
    fixTypos: true,
    totalLines: lines.length,
    nextLine: (i) => (i < lines.length ? lines[i] : null),
    onDone: (s) => game.finish({ ...s, mode: 'story', story: story.id, pages: 1, pageReached: page + 1, storyText: lines.join(' '), storyTitle: story.title, storyEnd: page + 1 >= story.pages.length }),
  });
}
