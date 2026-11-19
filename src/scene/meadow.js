// Art for Garden Words items. Each drawing is anchored at its base (0,0) and grows upward.
// Ground items stand along the meadow behind the fence; sky items float above the hills.
import { plantSVG } from './plant-gen.js';
import { BY_ID } from '../data/species.js';
import { PLANT_WORDS, TREE_WORDS, SKY_WORDS } from '../data/garden-words.js';

const TREE_COLORS = { oak: '#8FB77E', pine: '#6F9A7A', maple: '#E39B5F', birch: '#B9D49A', apple: '#9DC48A', willow: '#A9C998' };

function tree(kind) {
  const c = TREE_COLORS[kind];
  const trunk = kind === 'birch' ? '#EDE8DF' : '#9A7A5E';
  if (kind === 'pine') return `<rect x="-5" y="-22" width="10" height="22" fill="${trunk}"/><path d="M0 -110 L32 -50 H-32Z M0 -86 L38 -22 H-38Z" fill="${c}"/>`;
  if (kind === 'willow') return `<rect x="-5" y="-50" width="10" height="50" rx="4" fill="${trunk}"/><ellipse cx="0" cy="-70" rx="40" ry="30" fill="${c}"/>${[-32, -18, -4, 10, 24].map((x) => `<path d="M${x} -60 q -4 30 0 52" stroke="${c}" stroke-width="7" stroke-linecap="round" fill="none"/>`).join('')}`;
  let s = `<rect x="-5" y="-46" width="10" height="46" rx="4" fill="${trunk}"/>`;
  if (kind === 'birch') s += '<path d="M-5 -36 h4 M1 -24 h4 M-5 -12 h3" stroke="#5C5248" stroke-width="2"/>';
  s += `<circle cx="0" cy="-70" r="32" fill="${c}"/><circle cx="-22" cy="-54" r="20" fill="${c}"/><circle cx="22" cy="-56" r="22" fill="${c}"/>`;
  if (kind === 'apple') s += [[-14, -70], [10, -80], [16, -56], [-20, -52], [2, -60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#E8656B"/>`).join('');
  return s;
}

const THINGS = {
  pond: '<ellipse cx="0" cy="-6" rx="46" ry="12" fill="#9FC9DE"/><ellipse cx="-10" cy="-8" rx="20" ry="4" fill="#C7E2EE"/><ellipse cx="22" cy="-7" rx="7" ry="3" fill="#86B36F"/>',
  rock: '<path d="M-26 0 Q -28 -22 -6 -26 Q 20 -30 26 -8 L28 0Z" fill="#BDB6AA"/><path d="M-10 -20 q 8 -4 16 0" stroke="#D8D2C6" stroke-width="3" fill="none"/>',
  log: '<rect x="-34" y="-20" width="62" height="20" rx="10" fill="#A87E5B"/><ellipse cx="28" cy="-10" rx="8" ry="10" fill="#D9B48A"/><circle cx="28" cy="-10" r="4" fill="none" stroke="#A87E5B" stroke-width="1.5"/>',
  mushroom: '<rect x="-6" y="-20" width="12" height="20" rx="5" fill="#F3E8D6"/><path d="M-24 -18 Q 0 -50 24 -18Z" fill="#E8656B"/><circle cx="-8" cy="-28" r="3.5" fill="#fff"/><circle cx="8" cy="-24" r="3" fill="#fff"/>',
  kite: '<path d="M0 -40 L18 -14 L0 14 L-18 -14Z" fill="#F49AA0"/><path d="M0 -40 V14 M-18 -14 H18" stroke="#fff" stroke-width="2"/><path d="M0 14 q 10 20 -4 36 q -10 14 6 28" stroke="#7FA7BD" stroke-width="1.5" fill="none"/>',
  nest: '<path d="M-24 -10 Q 0 6 24 -10 Q 20 4 0 6 Q -20 4 -24 -10Z" fill="#B58C66"/><ellipse cx="-6" cy="-12" rx="6" ry="7" fill="#BFD9EA"/><ellipse cx="6" cy="-12" rx="6" ry="7" fill="#DCEBF5"/><path d="M-26 -10 q 26 8 52 0" stroke="#8B6B4E" stroke-width="3" fill="none"/>',
  hive: '<rect x="-4" y="-10" width="8" height="10" fill="#A87E5B"/>' + [0, 1, 2, 3].map((i) => `<ellipse cx="0" cy="${-16 - i * 10}" rx="${22 - i * 4}" ry="7" fill="#F6C445" stroke="#D9A03A" stroke-width="1.5"/>`).join('') + '<ellipse cx="0" cy="-14" rx="4" ry="3" fill="#6E4630"/>',
  lantern: '<path d="M0 -70 V-50" stroke="#8B6B4E" stroke-width="2"/><rect x="-12" y="-50" width="24" height="32" rx="10" fill="#F6E3A1" class="glow"/><path d="M-4 0 V-18 M4 0 V-18" stroke="#8B6B4E" stroke-width="2"/>',
  tent: '<path d="M-38 0 L0 -50 L38 0Z" fill="#F4BFA6"/><path d="M0 -50 L-10 0 H10Z" fill="#D99A86"/><path d="M0 -50 v-10" stroke="#8B6B4E" stroke-width="2"/><path d="M0 -60 l12 4 l-12 4Z" fill="#9AD08A"/>',
  well: '<rect x="-26" y="-26" width="52" height="26" rx="4" fill="#C9C2B6"/><path d="M-26 -18 H26 M-26 -9 H26" stroke="#B0A99C" stroke-width="2"/><path d="M-22 -26 V-60 M22 -26 V-60" stroke="#A87E5B" stroke-width="5"/><path d="M-32 -58 L0 -76 L32 -58Z" fill="#D99A86"/>',
  bucket: '<path d="M-14 -24 h28 l-4 24 h-20Z" fill="#9EC3D6"/><path d="M-14 -24 q 14 -18 28 0" stroke="#7FA7BD" stroke-width="2" fill="none"/>',
  wagon: '<rect x="-30" y="-28" width="56" height="18" rx="4" fill="#E8656B"/><circle cx="-18" cy="-6" r="7" fill="#6E6A66"/><circle cx="14" cy="-6" r="7" fill="#6E6A66"/><path d="M26 -24 l22 -10" stroke="#8B6B4E" stroke-width="3" stroke-linecap="round"/>',
  snowman: '<circle cx="0" cy="-18" r="18" fill="#FFFFFF" stroke="#DCE6E8"/><circle cx="0" cy="-48" r="13" fill="#FFFFFF" stroke="#DCE6E8"/><circle cx="-4" cy="-51" r="1.6" fill="#3D3631"/><circle cx="4" cy="-51" r="1.6" fill="#3D3631"/><path d="M0 -47 l9 2 l-9 2Z" fill="#F29A4A"/><path d="M-12 -38 h24" stroke="#E8656B" stroke-width="4" stroke-linecap="round"/>',
};

const ANIMALS = {
  fox: '<ellipse cx="0" cy="-14" rx="20" ry="12" fill="#E39B5F"/><circle cx="18" cy="-26" r="10" fill="#E39B5F"/><path d="M12 -34 l3 -10 l5 8Z M20 -34 l5 -9 l3 9Z" fill="#E39B5F"/><path d="M24 -24 l8 2 l-8 3Z" fill="#FFF4E6"/><circle cx="20" cy="-28" r="1.6" fill="#3D3631"/><path d="M-18 -16 q -18 -2 -22 -18 q 10 4 18 8" fill="#E39B5F"/><path d="M-36 -30 l-4 -4 l6 1Z" fill="#fff"/><path d="M-10 -3 v3 M10 -3 v3" stroke="#6E4630" stroke-width="3"/>',
  owl: '<ellipse cx="0" cy="-20" rx="16" ry="20" fill="#B58C66"/><ellipse cx="0" cy="-14" rx="10" ry="12" fill="#E8D5B5"/><circle cx="-6" cy="-28" r="6" fill="#fff"/><circle cx="6" cy="-28" r="6" fill="#fff"/><circle cx="-6" cy="-28" r="2.6" fill="#3D3631"/><circle cx="6" cy="-28" r="2.6" fill="#3D3631"/><path d="M-2 -22 l2 4 l2 -4Z" fill="#E7B65A"/><path d="M-14 -38 l4 -6 l3 6 M14 -38 l-4 -6 l-3 6" fill="#B58C66" stroke="#B58C66" stroke-width="2"/>',
  frog: '<ellipse cx="0" cy="-10" rx="18" ry="11" fill="#86B36F"/><circle cx="-8" cy="-20" r="6" fill="#86B36F"/><circle cx="8" cy="-20" r="6" fill="#86B36F"/><circle cx="-8" cy="-21" r="2.6" fill="#3D3631"/><circle cx="8" cy="-21" r="2.6" fill="#3D3631"/><path d="M-6 -10 q 6 4 12 0" stroke="#3D3631" stroke-width="1.6" fill="none"/>',
  duck: '<ellipse cx="0" cy="-12" rx="20" ry="12" fill="#FFF6D6"/><circle cx="16" cy="-26" r="9" fill="#FFF6D6"/><path d="M24 -26 l9 2 l-9 3Z" fill="#F29A4A"/><circle cx="18" cy="-28" r="1.6" fill="#3D3631"/><path d="M-20 -14 l-8 -6 l2 10Z" fill="#FFF6D6"/>',
  cat: '<ellipse cx="0" cy="-14" rx="18" ry="13" fill="#9C9188"/><circle cx="14" cy="-30" r="10" fill="#9C9188"/><path d="M7 -37 l2 -9 l6 6Z M17 -38 l5 -8 l2 9Z" fill="#9C9188"/><circle cx="12" cy="-31" r="1.5" fill="#3D3631"/><circle cx="18" cy="-31" r="1.5" fill="#3D3631"/><path d="M-18 -10 q -14 -4 -12 -24" stroke="#9C9188" stroke-width="5" fill="none" stroke-linecap="round"/>',
  dog: '<ellipse cx="0" cy="-16" rx="20" ry="13" fill="#D9B48A"/><circle cx="18" cy="-30" r="11" fill="#D9B48A"/><ellipse cx="12" cy="-28" rx="5" ry="9" fill="#A87E5B"/><circle cx="21" cy="-32" r="1.6" fill="#3D3631"/><circle cx="28" cy="-28" r="2.4" fill="#3D3631"/><path d="M-20 -20 q -8 -8 -4 -16" stroke="#D9B48A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-12 -4 v4 M12 -4 v4" stroke="#A87E5B" stroke-width="4"/>',
  butterfly: '<g class="bob"><path d="M0 0 C -24 -26, -30 6, -4 4 C -22 22, -6 28, 0 6 C 6 28, 22 22, 4 4 C 30 6, 24 -26, 0 0Z" fill="#F4BFD8"/><path d="M0 -4 v14" stroke="#7A5A44" stroke-width="2.5" stroke-linecap="round"/></g>',
  ladybug: '<ellipse cx="0" cy="-8" rx="10" ry="8" fill="#E8656B"/><path d="M0 -16 V0" stroke="#3D3631" stroke-width="1.5"/><circle cx="-4" cy="-9" r="1.8" fill="#3D3631"/><circle cx="4" cy="-6" r="1.8" fill="#3D3631"/><circle cx="10" cy="-10" r="4" fill="#3D3631"/>',
  bird: '<g class="bob"><path d="M-16 0 q 8 -10 16 0 q 8 -10 16 0" stroke="#66756A" stroke-width="3" fill="none" stroke-linecap="round"/></g>',
  deer: '<ellipse cx="0" cy="-30" rx="22" ry="11" fill="#C99A72"/><path d="M-14 -22 v22 M-6 -22 v22 M8 -22 v22 M16 -22 v22" stroke="#A9795A" stroke-width="3.5"/><path d="M18 -36 l6 -16" stroke="#C99A72" stroke-width="7" stroke-linecap="round"/><ellipse cx="28" cy="-54" rx="9" ry="6" fill="#C99A72"/><circle cx="30" cy="-56" r="1.5" fill="#3D3631"/><path d="M22 -60 l-6 -10 m3 5 l-6 0 M28 -60 l2 -12 m-1 6 l6 -2" stroke="#8B6B4E" stroke-width="2" fill="none"/><circle cx="-8" cy="-34" r="2" fill="#F3E3CB"/><circle cx="2" cy="-36" r="2" fill="#F3E3CB"/>',
  squirrel: '<path d="M-6 -10 C -30 -10, -32 -46, -12 -48 C -4 -48, -4 -38, -14 -36 C -22 -30, -16 -18, -6 -18Z" fill="#C2774A"/><ellipse cx="6" cy="-14" rx="10" ry="12" fill="#D2875A"/><circle cx="10" cy="-30" r="8" fill="#D2875A"/><path d="M6 -37 l2 -6 l3 5Z" fill="#D2875A"/><circle cx="12" cy="-31" r="1.5" fill="#3D3631"/><circle cx="14" cy="-14" r="4" fill="#A87E5B"/>',
  mouse: '<ellipse cx="0" cy="-8" rx="12" ry="8" fill="#BDB6AA"/><circle cx="10" cy="-12" r="6" fill="#BDB6AA"/><circle cx="8" cy="-19" r="4" fill="#E8D5CB"/><circle cx="13" cy="-13" r="1.2" fill="#3D3631"/><path d="M-12 -6 q -12 2 -14 -8" stroke="#BDB6AA" stroke-width="2" fill="none"/>',
  turtle: '<path d="M-22 -2 Q -20 -28 0 -28 Q 20 -28 22 -2Z" fill="#7FA86E"/><path d="M-10 -10 l10 -10 l10 10 l-10 6Z" fill="#9DC48A"/><circle cx="26" cy="-8" r="6" fill="#B7C46A"/><circle cx="28" cy="-10" r="1.3" fill="#3D3631"/><path d="M-14 0 v3 M12 0 v3" stroke="#B7C46A" stroke-width="5" stroke-linecap="round"/>',
};

/** The drawing for one Garden Words item, anchored at its base. */
export function meadowArt(word, seed = 1) {
  if (PLANT_WORDS[word]) return `<g transform="scale(1.1)">${plantSVG(BY_ID[PLANT_WORDS[word]], 1, seed)}</g>`;
  if (TREE_WORDS.includes(word)) return tree(word);
  return THINGS[word] || ANIMALS[word] || '';
}

/** Ground slots run along the meadow behind the fence; sky slots float over the hills. */
// Filled from the middle outward, because narrow windows crop the sides of the scene.
const byCentre = (a, b) => Math.abs(a.x - 800) - Math.abs(b.x - 800);
export const GROUND_SLOTS = Array.from({ length: 18 }, (_, i) => ({ x: 90 + i * 82 + (i % 2) * 12, y: 604 + (i % 3) * 6 })).sort(byCentre);
export const SKY_SLOTS = Array.from({ length: 8 }, (_, i) => ({ x: 180 + i * 170, y: 250 + (i % 3) * 55 })).sort(byCentre);
export const MEADOW_CAP = GROUND_SLOTS.length + SKY_SLOTS.length;

/** Places items: each ground or sky item takes the next free slot of its kind (oldest first). */
export function meadowLayout(items) {
  let g = 0, s = 0;
  return items.map((it) => {
    const sky = SKY_WORDS.has(it.w);
    const slot = sky ? SKY_SLOTS[s++ % SKY_SLOTS.length] : GROUND_SLOTS[g++ % GROUND_SLOTS.length];
    return { ...it, ...slot, sky };
  });
}
