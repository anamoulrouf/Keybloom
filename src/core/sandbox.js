// Garden Words matcher. Free typing, but every key is still checked: a letter is "correct" only if
// it continues some garden word, so practice stays accurate and key stats still count.
export function createSandbox(words) {
  return { buf: '', words: [...new Set(words)] };
}

export function candidates(sb) {
  return sb.words.filter((w) => w.startsWith(sb.buf));
}

/** Returns { type: 'correct'|'wrong'|'erase'|'complete'|'ignored', word? } */
export function pressSandbox(sb, key) {
  if (key == null) return { type: 'ignored' };
  if (key === 'Backspace') {
    if (!sb.buf) return { type: 'ignored' };
    sb.buf = sb.buf.slice(0, -1);
    return { type: 'erase' };
  }
  if (key === ' ') {
    if (!sb.buf) return { type: 'ignored' };
    if (sb.words.includes(sb.buf)) return complete(sb);
    return { type: 'wrong' };
  }
  const k = key.toLowerCase();
  if (!/^[a-z]$/.test(k)) return { type: 'ignored' };
  const next = sb.buf + k;
  if (!sb.words.some((w) => w.startsWith(next))) return { type: 'wrong' };
  sb.buf = next;
  // A whole word that no longer word continues completes by itself; otherwise Space plants it.
  if (sb.words.includes(next) && !sb.words.some((w) => w !== next && w.startsWith(next))) return complete(sb);
  return { type: 'correct' };
}

function complete(sb) {
  const word = sb.buf;
  sb.buf = '';
  return { type: 'complete', word };
}
