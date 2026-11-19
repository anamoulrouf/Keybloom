// Pip the hedgehog gardener (original character). Poses are CSS animations on #pip[data-pose].
export function pipSVG(scarf = '#7FB3D5') {
  let spikes = '';
  for (let i = 0; i < 11; i++) {
    const a = -160 + i * 16;
    spikes += `<path d="M0 0 L-9 -46 L9 -46Z" fill="${i % 2 ? '#8A6448' : '#9C7455'}" transform="translate(-6 18) rotate(${a + 90})"/>`;
  }
  return `<g class="pip-body">
    <ellipse cx="2" cy="70" rx="58" ry="10" fill="#6E8F5E" opacity=".35"/>
    <g transform="translate(0 20)">${spikes}</g>
    <ellipse cx="-4" cy="30" rx="50" ry="40" fill="#8A6448"/>
    <path d="M14 0 C 52 4, 70 30, 62 46 C 52 62, 18 64, 6 50Z" fill="#F3DFC2"/>
    <circle cx="66" cy="38" r="7" fill="#3D3631"/>
    <circle cx="68" cy="36" r="2" fill="#FFF"/>
    <g class="pip-eye"><ellipse cx="40" cy="24" rx="4.4" ry="5.2" fill="#3D3631"/><circle cx="41.5" cy="22" r="1.5" fill="#FFF"/></g>
    <ellipse cx="44" cy="40" rx="7" ry="4" fill="#F4B7A6" opacity=".7"/>
    <path d="M44 48 q 6 5 12 0" stroke="#3D3631" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M-8 48 C 10 60, 34 60, 46 50 L 50 60 C 30 72, 6 70, -10 60Z" fill="${scarf}" class="pip-scarf"/>
    <path d="M-6 56 l -16 22 l 12 2 l 10 -18Z" fill="${scarf}" class="pip-scarf"/>
    <ellipse cx="-22" cy="70" rx="12" ry="7" fill="#7A563D"/><ellipse cx="22" cy="72" rx="12" ry="7" fill="#7A563D"/>
    <g class="pip-hat"><path d="M-30 -20 Q 6 -44 44 -18 Q 8 -26 -30 -20Z" fill="#E9D3A1"/><ellipse cx="7" cy="-20" rx="44" ry="7" fill="#E2C68E"/><path d="M-14 -24 Q 7 -30 30 -24" stroke="#D98E7F" stroke-width="5" fill="none"/></g>
  </g>`;
}
