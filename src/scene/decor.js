// Garden decorations bought with dewdrops. Each has a fixed spot so the garden always looks tidy.
export const DECOR = [
  { id: 'bench', name: 'Wooden bench', cost: 30, x: 1340, y: 700 },
  { id: 'birdbath', name: 'Birdbath', cost: 40, x: 880, y: 640 },
  { id: 'lantern', name: 'Paper lanterns', cost: 50, x: 300, y: 540 },
  { id: 'stones', name: 'Stepping stones', cost: 25, x: 1000, y: 735 },
  { id: 'birdhouse', name: 'Birdhouse', cost: 45, x: 1220, y: 600 },
  { id: 'barrow', name: 'Wheelbarrow', cost: 35, x: 70, y: 712 },
  { id: 'swing', name: 'Tree swing', cost: 60, x: 1080, y: 470 },
  { id: 'scarecrow', name: 'Friendly scarecrow', cost: 55, x: 470, y: 640 },
];

export function decorSVG(id) {
  const d = DECOR.find((x) => x.id === id);
  if (!d) return '';
  const t = `transform="translate(${d.x} ${d.y})"`;
  switch (id) {
    case 'bench': return `<g ${t}><rect x="-50" y="-22" width="100" height="10" rx="4" fill="#C79A72"/><rect x="-50" y="-40" width="100" height="8" rx="4" fill="#C79A72"/><rect x="-44" y="-12" width="8" height="24" fill="#A87E5B"/><rect x="36" y="-12" width="8" height="24" fill="#A87E5B"/></g>`;
    case 'birdbath': return `<g ${t}><path d="M-12 30 h24 l-6 -40 h-12Z" fill="#DCD6CC"/><ellipse cx="0" cy="-12" rx="40" ry="10" fill="#E6E1D8"/><ellipse cx="0" cy="-14" rx="32" ry="6" fill="#BFD9EA"/></g>`;
    case 'lantern': return `<g ${t}><path d="M-120 0 Q 0 40 120 0" stroke="#8B6B4E" stroke-width="2" fill="none"/>${[-80, -20, 40, 100].map((x, i) => `<g transform="translate(${x} ${14 + Math.abs(x) / 10})"><rect x="-10" y="0" width="20" height="26" rx="9" fill="${['#F4BFA6', '#F6E3A1', '#C9B6DD', '#BFD9EA'][i]}" class="glow"/></g>`).join('')}</g>`;
    case 'stones': return `<g ${t}>${[0, 60, 120, 180].map((x, i) => `<ellipse cx="${x - 90}" cy="${i % 2 ? 4 : -2}" rx="22" ry="8" fill="#D8D2C6"/>`).join('')}</g>`;
    case 'birdhouse': return `<g ${t}><rect x="-4" y="0" width="8" height="70" fill="#A87E5B"/><rect x="-22" y="-34" width="44" height="36" rx="4" fill="#F0C9A0"/><path d="M-28 -32 L0 -56 L28 -32Z" fill="#D99A86"/><circle cx="0" cy="-18" r="7" fill="#7A5A44"/></g>`;
    case 'barrow': return `<g ${t}><path d="M-40 -30 h70 l-10 30 h-50Z" fill="#9EB8C9"/><circle cx="-6" cy="8" r="12" fill="#6E6A66"/><path d="M30 -24 l26 -12" stroke="#A87E5B" stroke-width="5" stroke-linecap="round"/></g>`;
    case 'swing': return `<g ${t} class="swing"><path d="M-20 0 V110 M20 0 V110" stroke="#A88E70" stroke-width="2.5"/><rect x="-28" y="108" width="56" height="9" rx="4" fill="#C79A72"/></g>`;
    case 'scarecrow': return `<g ${t}><path d="M0 -10 V60" stroke="#A87E5B" stroke-width="6"/><path d="M-40 6 H40" stroke="#A87E5B" stroke-width="6"/><path d="M-22 0 h44 l-6 40 h-32Z" fill="#9EC3A8"/><circle cx="0" cy="-24" r="18" fill="#F3DFC2"/><path d="M-26 -36 h52 l-12 -16 h-28Z" fill="#E2C68E"/><circle cx="-6" cy="-26" r="2.2" fill="#3D3631"/><circle cx="6" cy="-26" r="2.2" fill="#3D3631"/><path d="M-6 -18 q6 5 12 0" stroke="#3D3631" stroke-width="2" fill="none"/></g>`;
  }
  return '';
}
