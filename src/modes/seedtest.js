// The 60-second Seed Test (placement). Kids who already type well skip ahead; anyone can say
// "I'm new to typing" and start gently with a s d f l.
import { lineRunner } from './line-runner.js';

const PASSAGE = [
  'pip waters the garden every morning',
  'a quiet fox sleeps by the old stone wall',
  'bees hum over the lavender and the peas',
  'we dig small rows and plant the seeds',
  'the rain makes the young leaves grow tall',
  'a robin hops along the path to find a worm',
  'sunflowers turn their faces to the sky',
  'jam and bread taste best after gardening',
  'quick little ants carry crumbs back home',
  'the moon rises and the fireflies glow',
];

export function seedTestMode(game, { onDone }) {
  return lineRunner(game, {
    mode: 'seedtest',
    title: 'The Seed Test',
    subtitle: 'Type what you see for one minute, at a comfy speed. It just tells Pip where to start. There is no wrong answer.',
    seconds: 60,
    keyboard: false,
    recordStats: false,
    allKeys: true,
    nextLine: (i) => PASSAGE[i % PASSAGE.length],
    extraButton: { label: "I'm new to typing: start from the beginning", onClick: () => onDone({ skipped: true }) },
    onDone: (s) => onDone(s),
  });
}
