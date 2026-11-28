export const PRESET_DECORATIONS = Object.freeze([
  { id: 'aurora-halo', name: 'Aurora Halo', subtitle: 'Designed by Subhajit · Northern lights', description: 'Flowing aurora ribbons, luminous orbs and a glassy teal-violet halo.', accent: '#71e6d1' },
  { id: 'royal-amethyst', name: 'Royal Amethyst', subtitle: 'Designed by Subhajit · Regal collection', description: 'A violet gemstone frame finished with a delicate crown and gold filigree.', accent: '#b58aff' },
  { id: 'solar-flare', name: 'Solar Flare', subtitle: 'Designed by Subhajit · Radiance collection', description: 'Molten gold, hot coral sparks and radiant sunlit arcs.', accent: '#ff9a4d' },
  { id: 'sakura-royale', name: 'Sakura Royale', subtitle: 'Designed by Subhajit · Blossom collection', description: 'Soft cherry blossoms and graceful rose-pink branches.', accent: '#f6a8cb' },
  { id: 'ocean-crown', name: 'Ocean Crown', subtitle: 'Designed by Subhajit · Deep sea collection', description: 'Pearlescent wavework, sea-glass blues and tiny luminous pearls.', accent: '#70d8f4' },
  { id: 'cyber-prism', name: 'Cyber Prism', subtitle: 'Designed by Subhajit · Neon collection', description: 'A futuristic frame of electric circuits, prism cuts and laser-blue light.', accent: '#72a7ff' },
  { id: 'celestial-rose', name: 'Celestial Rose', subtitle: 'Designed by Subhajit · Starlit collection', description: 'Rose-gold petals, tiny constellations and a soft champagne glow.', accent: '#f3a4a9' },
  { id: 'emerald-empress', name: 'Emerald Empress', subtitle: 'Designed by Subhajit · Botanical collection', description: 'Sculpted emerald leaves, fine gold veins and jewel-like accents.', accent: '#69d5a0' }
]);

const LEGACY_PRESET_ALIASES = Object.freeze({
  'neon-orbit': 'aurora-halo',
  'ember-ring': 'solar-flare',
  starlight: 'royal-amethyst',
  'sakura-bloom': 'sakura-royale',
  frostline: 'ocean-crown',
  'emerald-leaves': 'emerald-empress'
});

const DECORATION_ART = {
  'aurora-halo': {
    main: '#55d9cf', light: '#c1fff0', accent: '#a88cff',
    extras: '<path d="M72 158C125 58 219 53 256 97S384 132 440 70" fill="none" stroke="#7df3d9" stroke-width="10" stroke-linecap="round"/><path d="M67 352C144 438 218 425 258 390S375 365 445 430" fill="none" stroke="#b99bff" stroke-width="8" stroke-linecap="round"/><path d="M100 111Q256 20 412 111M100 401Q256 492 412 401" fill="none" stroke="#e0fff7" stroke-width="3" stroke-dasharray="2 13" opacity=".8"/><g fill="#e7fff9"><circle cx="91" cy="205" r="6"/><circle cx="421" cy="204" r="5"/><circle cx="126" cy="385" r="4"/><circle cx="383" cy="116" r="4"/></g><g fill="#a88cff" stroke="#f4eaff" stroke-width="3"><path d="M256 24l9 21 23 2-18 15 5 23-19-12-19 12 5-23-18-15 23-2z"/><circle cx="256" cy="87" r="5"/></g><g fill="none" stroke="#c1fff0" stroke-width="4" stroke-linecap="round"><path d="M54 257q18-23 36 0t36 0M386 257q18-23 36 0t36 0"/></g>'
  },
  'royal-amethyst': {
    main: '#9b70ed', light: '#f3d8ff', accent: '#e7b95e',
    extras: '<path d="M169 92l-18-48 48 29 57-55 57 55 48-29-18 48 35 25H134z" fill="#9b70ed" stroke="#ffe6a6" stroke-width="7" stroke-linejoin="round"/><path d="M151 119h210l-14 19H165z" fill="#e7b95e" stroke="#fff0c9" stroke-width="3"/><g fill="#fff3c9" stroke="#e7b95e" stroke-width="3"><path d="M199 64l10 13-10 14-10-14z"/><path d="M256 34l13 17-13 18-13-18z"/><path d="M313 64l10 13-10 14-10-14z"/></g><g fill="none" stroke="#e7b95e" stroke-width="5" stroke-linecap="round"><path d="M84 181q-28 35 0 70t0 70M428 181q28 35 0 70t0 70"/><path d="M105 343q-11 30 18 45M407 343q11 30-18 45"/></g><g fill="#f3d8ff" stroke="#9b70ed" stroke-width="3"><path d="M74 248l14 20-14 20-14-20z"/><path d="M438 248l14 20-14 20-14-20z"/><path d="M256 425l11 16-11 16-11-16z"/></g><path d="M128 407Q256 471 384 407" fill="none" stroke="#e7b95e" stroke-width="4" stroke-linecap="round"/>'
  },
  'solar-flare': {
    main: '#ff783d', light: '#ffe6a1', accent: '#ffbd55',
    extras: '<path d="M256 15c-18 25-22 46-3 65 6-18 21-24 27-44 20 26 22 46 4 69-27 33-78 10-70-28 4-21 20-43 42-62z" fill="#ff783d" stroke="#ffe6a1" stroke-width="5"/><path d="M256 497c-18-25-22-46-3-65 6 18 21 24 27 44 20-26 22-46 4-69-27-33-78-10-70 28 4 21 20 43 42 62z" fill="#ff783d" stroke="#ffe6a1" stroke-width="5"/><g stroke="#ffbd55" stroke-width="7" stroke-linecap="round"><path d="M90 112l18 24M422 112l-18 24M90 400l18-24M422 400l-18-24"/><path d="M49 256h35M428 256h35"/></g><g fill="#fff4bf"><path d="M123 74l7 18 18 7-18 7-7 18-7-18-18-7 18-7z"/><path d="M389 74l7 18 18 7-18 7-7 18-7-18-18-7 18-7z"/><path d="M123 418l7 18 18 7-18 7-7 18-7-18-18-7 18-7z"/><path d="M389 418l7 18 18 7-18 7-7 18-7-18-18-7 18-7z"/></g><path d="M106 153Q256 35 406 153M106 359Q256 477 406 359" fill="none" stroke="#ffe6a1" stroke-width="4" stroke-linecap="round" stroke-dasharray="7 11"/><g fill="#ffbd55"><circle cx="68" cy="184" r="5"/><circle cx="444" cy="184" r="5"/><circle cx="68" cy="328" r="5"/><circle cx="444" cy="328" r="5"/></g>'
  },
  'sakura-royale': {
    main: '#ed8db8', light: '#ffe4ef', accent: '#ffc1d7',
    extras: '<g fill="none" stroke="#b9709e" stroke-width="5" stroke-linecap="round"><path d="M74 102q64 42 84 112t-40 103M438 102q-64 42-84 112t40 103M110 417q34-28 52-69M402 417q-34-28-52-69"/></g><g fill="#ffc1d7" stroke="#fff0f6" stroke-width="4"><path d="M110 105c-24-26-4-48 14-31 9-28 39-20 33 8 28-8 38 20 9 33 15 25-10 43-28 16-20 23-45 5-28-18z"/><path d="M402 105c24-26 4-48-14-31-9-28-39-20-33 8-28-8-38 20-9 33-15 25 10 43 28 16 20 23 45 5 28-18z"/><path d="M82 357c-18-20-3-36 10-23 7-21 29-15 24 6 21-6 28 15 7 25 11 18-8 31-21 12-15 17-33 4-20-13z"/><path d="M430 357c18-20 3-36-10-23-7-21-29-15-24 6-21-6-28 15-7 25-11 18 8 31 21 12 15 17 33 4 20-13z"/></g><g fill="#ffe9a8"><circle cx="143" cy="112" r="6"/><circle cx="369" cy="112" r="6"/><circle cx="104" cy="369" r="5"/><circle cx="408" cy="369" r="5"/></g><path d="M139 55Q256 2 373 55M139 457Q256 510 373 457" fill="none" stroke="#ffe4ef" stroke-width="4" stroke-linecap="round"/><g fill="none" stroke="#ffc1d7" stroke-width="3"><circle cx="256" cy="46" r="15"/><circle cx="256" cy="466" r="15"/></g>'
  },
  'ocean-crown': {
    main: '#3eb9dd', light: '#d5fbff', accent: '#6f8cff',
    extras: '<path d="M65 176q36-42 72 0t72 0M303 176q36-42 72 0t72 0" fill="none" stroke="#b6f8ff" stroke-width="8" stroke-linecap="round"/><path d="M65 336q36 42 72 0t72 0M303 336q36 42 72 0t72 0" fill="none" stroke="#6f8cff" stroke-width="7" stroke-linecap="round"/><path d="M256 20l22 26-22 44-22-44z" fill="#d5fbff" stroke="#6f8cff" stroke-width="5"/><path d="M256 422l22 26-22 44-22-44z" fill="#d5fbff" stroke="#6f8cff" stroke-width="5"/><g fill="#d5fbff" stroke="#3eb9dd" stroke-width="4"><circle cx="91" cy="109" r="13"/><circle cx="421" cy="109" r="13"/><circle cx="91" cy="403" r="13"/><circle cx="421" cy="403" r="13"/></g><g fill="none" stroke="#b6f8ff" stroke-width="4"><path d="M117 82q22-20 44 0t44 0M307 82q22-20 44 0t44 0M117 430q22 20 44 0t44 0M307 430q22 20 44 0t44 0"/></g><g fill="#fff"><circle cx="121" cy="230" r="4"/><circle cx="391" cy="282" r="5"/><circle cx="136" cy="314" r="3"/><circle cx="379" cy="210" r="3"/></g>'
  },
  'cyber-prism': {
    main: '#4a8dff', light: '#bbf5ff', accent: '#d46aff',
    extras: '<path d="M256 17l40 26-14 27h-52l-14-27zM256 495l40-26-14-27h-52l-14 27z" fill="#4a8dff" stroke="#bbf5ff" stroke-width="5"/><g fill="none" stroke="#d46aff" stroke-width="6" stroke-linejoin="round"><path d="M78 150h40v-35h38M434 150h-40v-35h-38M78 362h40v35h38M434 362h-40v35h-38"/></g><g fill="#bbf5ff" stroke="#4a8dff" stroke-width="4"><path d="M76 236l22 20-22 20-22-20z"/><path d="M436 236l22 20-22 20-22-20z"/><path d="M256 95l13 15-13 15-13-15z"/><path d="M256 387l13 15-13 15-13-15z"/></g><g fill="none" stroke="#65efff" stroke-width="4" stroke-linecap="round"><path d="M112 80l-18 18m18-18H88m24 0V56M400 80l18 18m-18-18h24m-24 0V56M112 432l-18-18m18 18H88m24 0v24M400 432l18-18m-18 18h24m-24 0v24"/></g><g fill="#d46aff"><circle cx="137" cy="167" r="5"/><circle cx="375" cy="167" r="5"/><circle cx="137" cy="345" r="5"/><circle cx="375" cy="345" r="5"/></g><circle cx="256" cy="256" r="216" fill="none" stroke="#bbf5ff" stroke-width="3" stroke-dasharray="22 13" opacity=".65"/>'
  },
  'celestial-rose': {
    main: '#dc8e9d', light: '#ffe6cf', accent: '#f2b9d0',
    extras: '<g fill="none" stroke="#f2b9d0" stroke-width="5" stroke-linecap="round"><path d="M256 18q-22 18 0 42 22-24 0-42zM256 494q-22-18 0-42 22 24 0 42z"/><path d="M18 256q18-22 42 0-24 22-42 0zM494 256q-18-22-42 0 24 22 42 0z"/></g><g fill="#dc8e9d" stroke="#ffe6cf" stroke-width="3"><path d="M97 92c-24-17-46 5-26 23-21 20 4 43 22 20 21 17 42-7 19-24 16-18 0-35-15-19z"/><path d="M415 92c24-17 46 5 26 23 21 20-4 43-22 20-21 17-42-7-19-24 16-18 0-35 15-19z"/><path d="M97 420c-24 17-46-5-26-23-21-20 4-43 22-20 21-17 42 7 19 24-16 18 0 35-15 19z"/><path d="M415 420c24 17 46-5 26-23 21-20-4-43-22-20-21-17-42 7-19 24 16 18 0 35 15 19z"/></g><g fill="#ffe6cf"><circle cx="110" cy="110" r="5"/><circle cx="402" cy="110" r="5"/><circle cx="110" cy="402" r="5"/><circle cx="402" cy="402" r="5"/></g><g fill="none" stroke="#e7bb7e" stroke-width="3" stroke-dasharray="2 10"><path d="M143 58Q256 8 369 58M143 454Q256 504 369 454"/></g><path d="M72 256q21-37 42 0-21 37-42 0zM440 256q-21-37-42 0 21 37 42 0z" fill="#f2b9d0" stroke="#ffe6cf" stroke-width="3"/>'
  },
  'emerald-empress': {
    main: '#3eaf7b', light: '#d8ffe5', accent: '#b7e879',
    extras: '<g fill="#3eaf7b" stroke="#d8ffe5" stroke-width="4"><path d="M256 16c-42 24-51 57-7 82 42-25 43-54 7-82zM256 496c-42-24-51-57-7-82 42 25 43 54 7 82z"/><path d="M16 256c24-42 57-51 82-7-25 42-54 43-82 7zM496 256c-24-42-57-51-82-7 25 42 54 43 82 7z"/><path d="M87 89c-4 43 17 67 59 58-1-43-24-65-59-58zM425 89c4 43-17 67-59 58 1-43 24-65 59-58zM87 423c-4-43 17-67 59-58-1 43-24 65-59 58zM425 423c4-43-17-67-59-58 1 43 24 65 59 58z"/></g><g fill="none" stroke="#b7e879" stroke-width="4" stroke-linecap="round"><path d="M256 29v57M256 426v57M29 256h57M426 256h57"/><path d="M104 104l43 43M365 365l43 43M408 104l-43 43M147 365l-43 43"/></g><g fill="#d8ffe5" stroke="#3eaf7b" stroke-width="3"><path d="M256 88l13 17-13 17-13-17z"/><path d="M256 390l13 17-13 17-13-17z"/><path d="M88 256l17 13 17-13-17-13z"/><path d="M390 256l17 13 17-13-17-13z"/></g><g fill="#b7e879"><circle cx="111" cy="111" r="5"/><circle cx="401" cy="111" r="5"/><circle cx="111" cy="401" r="5"/><circle cx="401" cy="401" r="5"/></g>'
  }
};

export function getBuiltInDecorationImage(id) {
  const requestedId = String(id || '');
  const resolvedId = LEGACY_PRESET_ALIASES[requestedId] || requestedId;
  const art = DECORATION_ART[resolvedId];
  if (!art) return '';

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
    '<defs>',
    '<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">',
    '<stop stop-color="' + art.light + '"/>',
    '<stop offset=".48" stop-color="' + art.main + '"/>',
    '<stop offset="1" stop-color="' + art.accent + '"/>',
    '</linearGradient>',
    '<radialGradient id="shine"><stop stop-color="' + art.light + '" stop-opacity=".8"/><stop offset="1" stop-color="' + art.main + '" stop-opacity="0"/></radialGradient>',
    '<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
    '</defs>',
    '<circle cx="256" cy="256" r="216" fill="none" stroke="' + art.light + '" stroke-width="2.5" stroke-dasharray="3 13" opacity=".76"/>',
    '<circle cx="256" cy="256" r="201" fill="none" stroke="url(#ring)" stroke-width="5" opacity=".76"/>',
    '<circle cx="256" cy="256" r="190" fill="none" stroke="url(#ring)" stroke-width="13" filter="url(#glow)"/>',
    '<circle cx="256" cy="256" r="176" fill="none" stroke="' + art.light + '" stroke-width="2" opacity=".82"/>',
    '<circle cx="256" cy="256" r="224" fill="url(#shine)" opacity=".16"/>',
    art.extras,
    '<g fill="' + art.light + '" opacity=".95"><circle cx="57" cy="256" r="4"/><circle cx="455" cy="256" r="4"/><circle cx="256" cy="57" r="4"/><circle cx="256" cy="455" r="4"/></g>',
    '</svg>'
  ].join('');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
