// Animal visitors that come to the home garden depending on what grows there.
// needs(plants, profile): plants carry their species tags; profile gives decor and the rest.
export const VISITORS = [
  { id: 'bee', name: 'Bumble the bee', x: 1000, y: 600, needs: (plants) => plants.some((p) => p.stage >= 4 && p.tags.includes('nectar')), hint: 'Grow a flower all the way to bloom.', fact: 'A bumblebee beats its wings about 200 times every second.' },
  { id: 'bunny', name: 'Clover the bunny', x: 300, y: 722, needs: (plants) => plants.some((p) => p.stage >= 3 && p.tags.includes('veg')), hint: 'Bunnies come for leafy vegetables.', fact: 'Rabbits can turn their ears almost all the way around to listen.' },
  { id: 'snail', name: 'Sir Slowly the snail', x: 760, y: 765, needs: (plants) => plants.filter((p) => p.stage >= 2).length >= 6, hint: 'Snails like a garden with lots of leaves.', fact: 'Snails can sleep for days at a time when the weather is too dry.' },
  { id: 'robin', name: 'Ruby the robin', x: 1250, y: 612, needs: (plants) => plants.length >= 10, hint: 'Robins visit busy, well-dug gardens.', fact: 'Robins follow gardeners around, hoping a worm turns up in the soil.' },
  { id: 'moth', name: 'Luna the moon moth', x: 520, y: 560, needs: (plants) => plants.some((p) => p.stage >= 4 && p.tags.includes('night')), hint: 'Something rare might flutter in for a night-blooming flower.', fact: 'Luna moths have no mouths as adults and live only about a week.' },
  { id: 'fox', name: 'Rusty the fox', x: 1420, y: 640, needs: (plants, profile) => plants.filter((p) => p.stage >= 4).length >= 8 && (profile?.decor || []).length >= 2, hint: 'A shy visitor likes a garden full of blooms and cosy things to hide behind.', fact: 'Foxes use their big bushy tails as a warm blanket when they sleep.' },
  { id: 'squirrel', name: 'Hazel the squirrel', x: 1110, y: 520, needs: (plants) => plants.some((p) => p.stage >= 4 && p.tags.includes('seeds')), hint: 'Someone with a bushy tail loves seeds, from sunflowers or pumpkins.', fact: 'Squirrels bury thousands of nuts each year and forget many of them, which plants new trees.' },
  { id: 'wren', name: 'Pebble the wren', x: 880, y: 600, needs: (plants) => plants.some((p) => p.stage >= 4 && p.tags.includes('berries')), hint: 'A tiny bird looks for berries in the cold months.', fact: 'The wren is tiny, but its song is one of the loudest in the garden.' },
];

/** The animal drawn around (0,0), for the scene (translated) and the Almanac. */
export function visitorArt(id) {
  switch (id) {
    case 'bee': return '<g class="bob"><ellipse rx="13" ry="10" fill="#F6C445"/><path d="M-4 -9 v18 M4 -9 v18" stroke="#4A3B30" stroke-width="3.5"/><ellipse cx="-3" cy="-12" rx="8" ry="6" fill="#EAF4FB" opacity=".9"/><ellipse cx="6" cy="-13" rx="7" ry="5" fill="#EAF4FB" opacity=".9"/><circle cx="11" cy="-2" r="1.6" fill="#3D3631"/></g>';
    case 'bunny': return '<ellipse cx="0" cy="0" rx="26" ry="20" fill="#EFE6DA"/><circle cx="22" cy="-14" r="13" fill="#EFE6DA"/><ellipse cx="18" cy="-38" rx="5" ry="16" fill="#EFE6DA"/><ellipse cx="28" cy="-36" rx="5" ry="15" fill="#EFE6DA" transform="rotate(14 28 -36)"/><ellipse cx="18" cy="-38" rx="2.2" ry="10" fill="#F4C3BB"/><circle cx="27" cy="-16" r="2" fill="#3D3631"/><circle cx="-26" cy="-2" r="7" fill="#FFF"/>';
    case 'snail': return '<path d="M-26 6 Q 0 -2 30 6 Q 34 0 30 -8 L22 -6 Q 0 8 -26 6Z" fill="#D9C7A8"/><circle cx="-2" cy="-12" r="17" fill="#C99A72"/><path d="M-2 -12 m-10 0 a10 10 0 1 0 10 -10 a6 6 0 1 0 6 6" stroke="#A9795A" stroke-width="2.5" fill="none"/><path d="M26 -6 l4 -12 M30 -4 l8 -10" stroke="#D9C7A8" stroke-width="2"/>';
    case 'robin': return '<ellipse rx="18" ry="14" fill="#9C7B60"/><ellipse cx="6" cy="4" rx="11" ry="9" fill="#E9876A"/><circle cx="14" cy="-8" r="10" fill="#9C7B60"/><circle cx="17" cy="-10" r="1.8" fill="#3D3631"/><path d="M23 -8 l8 2 l-8 2Z" fill="#E7B65A"/><path d="M-16 0 l-14 -6 l2 10Z" fill="#86684F"/>';
    case 'moth': return '<g class="bob"><path d="M0 0 C -30 -30, -40 10, -6 8 C -30 30, -10 40, 0 10 C 10 40, 30 30, 6 8 C 40 10, 30 -30, 0 0Z" fill="#CFEBD8" opacity=".95"/><circle cx="-16" cy="-4" r="4" fill="#F3E3A8"/><circle cx="16" cy="-4" r="4" fill="#F3E3A8"/><path d="M0 -2 v16" stroke="#A9C7B2" stroke-width="3" stroke-linecap="round"/></g>';
    case 'fox': return '<ellipse cx="0" cy="0" rx="24" ry="14" fill="#E39B5F"/><circle cx="22" cy="-14" r="12" fill="#E39B5F"/><path d="M14 -24 l4 -12 l6 10Z M24 -24 l6 -11 l3 11Z" fill="#E39B5F"/><path d="M30 -12 l10 2 l-10 4Z" fill="#FFF4E6"/><circle cx="24" cy="-16" r="1.8" fill="#3D3631"/><path d="M-22 -2 q -22 -2 -26 -22 q 12 5 22 10" fill="#E39B5F"/><path d="M-44 -20 l-5 -5 l7 1Z" fill="#fff"/>';
    case 'squirrel': return '<path d="M-6 10 C -30 10, -32 -26, -12 -28 C -4 -28, -4 -18, -14 -16 C -22 -10, -16 2, -6 2Z" fill="#C2774A"/><ellipse cx="6" cy="6" rx="10" ry="12" fill="#D2875A"/><circle cx="10" cy="-10" r="8" fill="#D2875A"/><path d="M6 -17 l2 -6 l3 5Z" fill="#D2875A"/><circle cx="12" cy="-11" r="1.5" fill="#3D3631"/><circle cx="14" cy="6" r="4" fill="#A87E5B"/>';
    case 'wren': return '<ellipse rx="13" ry="10" fill="#A9795A"/><circle cx="10" cy="-7" r="7" fill="#A9795A"/><circle cx="12" cy="-8" r="1.4" fill="#3D3631"/><path d="M16 -7 l6 1 l-6 2Z" fill="#7A5A44"/><path d="M-10 -4 l-6 -14 l6 4Z" fill="#8B6B4E"/><path d="M-4 2 h10" stroke="#8B6B4E" stroke-width="1.5"/>';
  }
  return '';
}

export function visitorSVG(id) {
  const v = VISITORS.find((x) => x.id === id);
  if (!v) return '';
  return `<g class="v-${id}" transform="translate(${v.x} ${v.y})">${visitorArt(id)}</g>`;
}
