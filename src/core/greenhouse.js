// Greenhouse (bonus): numbers and a few symbols, typed as seed-packet labels and little sums.
import { pick } from './rng.js';

const NOUNS = ['seeds', 'pots', 'bulbs', 'beans', 'plums', 'roses', 'trays', 'peas', 'ferns', 'tulips'];
const noun = (rng, n) => { const w = pick(rng, NOUNS); return n === 1 ? w.slice(0, -1) : w; };

/** level 0: digits · 1: bigger numbers and = · 2: sums with + and - */
export function greenhouseLine(rng, level = 0) {
  const n = () => 1 + Math.floor(rng() * (level ? 20 : 9));
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const kind = level === 0 ? Math.floor(rng() * 2) : Math.floor(rng() * (level === 1 ? 3 : 4));
    const a = n(), b = n();
    if (kind === 0) parts.push(`plant ${a} ${noun(rng, a)}`);
    else if (kind === 1) parts.push(`row ${a} has ${b} ${noun(rng, b)}`);
    else if (kind === 2) parts.push(`tray ${a} = ${b} ${noun(rng, b)}`);
    else parts.push(rng() < 0.5 ? `${a} + ${b} = ${a + b}` : `${Math.max(a, b)} - ${Math.min(a, b)} = ${Math.max(a, b) - Math.min(a, b)}`);
  }
  return parts.join(', ');
}

export const GREENHOUSE_KEYS = '1234567890-=+,'.split('');
