// Sprout Lessons: one new pair of keys at a time, with the finger hint. If every key is already
// introduced, the lesson practises the child's weakest keys instead.
import { lineRunner } from './line-runner.js';
import { newestKeys, weakestKeys, KEY_GROUPS } from '../core/adaptive.js';
import { makeLine } from '../core/words.js';
import { mulberry32 } from '../core/rng.js';
import { FINGER, FINGER_NAME } from '../scene/keyboard-hint.js';
import { esc } from '../ui/dom.js';

export function lessonMode(game) {
  const { profile } = game;
  const learner = profile.learner;
  const rng = mulberry32(Date.now() >>> 0);
  const introduced = (profile.lessonsIntroduced ||= []);
  const groupIdx = learner.groupsUnlocked - 1;
  const isNew = !introduced.includes(groupIdx);
  const focus = isNew ? newestKeys(learner).filter((k) => /[a-z;,.]/.test(k)) : weakestKeys(learner, 3);
  const focusLetters = focus.filter((k) => /[a-z]/.test(k));

  // Real words only. 1–2: short words that all use the new (or tricky) keys;
  // 3–5: longer mixed lines that still lean on them.
  const lines = [];
  lines.push(makeLine(rng, learner, 4, { require: focusLetters, focus, maxLen: 5 }));
  lines.push(makeLine(rng, learner, 5, { require: focusLetters, focus, maxLen: 6 }));
  for (let i = 0; i < 3; i++) lines.push(makeLine(rng, learner, 5, { focus, maxLen: 7 }));

  const fingerText = focus.map((k) => `<b>${esc(k === ';' ? ';' : k)}</b> uses your ${FINGER_NAME[FINGER[k]]}`).join(', ');
  const subtitle = isNew
    ? `New keys! ${fingerText}. Keep your fingers resting on the home row.`
    : `Extra practice for the keys that need a little care: ${focus.map((k) => `<b>${esc(k)}</b>`).join(' ')}.`;

  return lineRunner(game, {
    mode: 'lesson',
    title: isNew ? `Sprout Lesson: ${focus.length > 1 ? focus.slice(0, -1).join(', ') + ' and ' + focus.at(-1) : focus[0]}` : 'Sprout Lesson: tricky keys',
    subtitle,
    keyboard: 'stage',
    totalLines: lines.length,
    nextLine: (i) => (i < lines.length ? lines[i] : null),
    onDone: (s) => {
      if (isNew && !introduced.includes(groupIdx)) introduced.push(groupIdx);
      game.finish({ ...s, mode: 'lesson', groupCount: KEY_GROUPS.length });
    },
  });
}
