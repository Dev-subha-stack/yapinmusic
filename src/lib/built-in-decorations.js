export const PRESET_DECORATIONS = Object.freeze([
  {
    id: 'neon-orbit',
    name: 'Neon Orbit',
    subtitle: 'Electric purple glow',
    description: 'A bright violet orbit with luminous accents.'
  },
  {
    id: 'ember-ring',
    name: 'Ember Ring',
    subtitle: 'Warm flame accents',
    description: 'A fiery orange-red frame with glowing sparks.'
  },
  {
    id: 'starlight',
    name: 'Starlight',
    subtitle: 'Golden celestial details',
    description: 'Golden stars and a soft celestial halo.'
  },
  {
    id: 'sakura-bloom',
    name: 'Sakura Bloom',
    subtitle: 'Soft pink blossoms',
    description: 'Delicate cherry blossoms around your avatar.'
  },
  {
    id: 'frostline',
    name: 'Frostline',
    subtitle: 'Ice-blue crystal trim',
    description: 'A cool crystal border with icy highlights.'
  },
  {
    id: 'emerald-leaves',
    name: 'Emerald Leaves',
    subtitle: 'Fresh green details',
    description: 'Leafy green accents and a natural frame.'
  }
]);

const DECORATION_ART = {
  'neon-orbit': {
    main: '#b46bff',
    light: '#70e6ff',
    accent: '#ff83e6',
    extras: '<path d="M95 160 Q256 22 417 160" fill="none" stroke="#ff83e6" stroke-width="8" stroke-linecap="round"/><path d="M105 360 Q256 482 407 360" fill="none" stroke="#70e6ff" stroke-width="7" stroke-linecap="round"/><path d="M80 256l8 18 18 8-18 8-8 18-8-18-18-8 18-8z M432 246l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" fill="#fff"/>'
  },
  'ember-ring': {
    main: '#ff713b',
    light: '#ffd166',
    accent: '#f13d54',
    extras: '<path d="M256 20c-22 26-8 42 0 52 5-17 22-24 17-50 27 25 37 45 19 70-18 25-59 24-71-5-9-21 7-45 35-67z M256 492c-22-26-8-42 0-52 5 17 22 24 17 50 27-25 37-45 19-70-18-25-59-24-71 5-9 21 7 45 35 67z" fill="#ff9a4d" stroke="#ffe0a0" stroke-width="4"/><g fill="#fff0b0"><circle cx="105" cy="110" r="6"/><circle cx="407" cy="110" r="6"/><circle cx="105" cy="402" r="5"/><circle cx="407" cy="402" r="5"/></g>'
  },
  'starlight': {
    main: '#edc45e',
    light: '#fff4bf',
    accent: '#fff0a0',
    extras: '<path d="M256 18l13 26 29 4-21 20 5 29-26-14-26 14 5-29-21-20 29-4z M78 220l8 18 18 8-18 8-8 18-8-18-18-8 18-8z M434 220l8 18 18 8-18 8-8 18-8-18-18-8 18-8z M256 454l7 15 15 7-15 7-7 15-7-15-15-7 15-7z" fill="#fff0a0" stroke="#d99f39" stroke-width="3"/>'
  },
  'sakura-bloom': {
    main: '#f28cbd',
    light: '#ffd7e8',
    accent: '#ffb4d3',
    extras: '<g fill="#ffb4d3" stroke="#fff0f6" stroke-width="3"><g transform="translate(256 42)"><ellipse cy="-14" rx="10" ry="16"/><ellipse cy="14" rx="10" ry="16"/><ellipse cx="-14" rx="16" ry="10"/><ellipse cx="14" rx="16" ry="10"/><circle r="6" fill="#ffdc78"/></g><g transform="translate(448 256) rotate(90)"><ellipse cy="-14" rx="10" ry="16"/><ellipse cy="14" rx="10" ry="16"/><ellipse cx="-14" rx="16" ry="10"/><ellipse cx="14" rx="16" ry="10"/><circle r="6" fill="#ffdc78"/></g><g transform="translate(256 470)"><ellipse cy="-14" rx="10" ry="16"/><ellipse cy="14" rx="10" ry="16"/><ellipse cx="-14" rx="16" ry="10"/><ellipse cx="14" rx="16" ry="10"/><circle r="6" fill="#ffdc78"/></g><g transform="translate(64 256) rotate(90)"><ellipse cy="-14" rx="10" ry="16"/><ellipse cy="14" rx="10" ry="16"/><ellipse cx="-14" rx="16" ry="10"/><ellipse cx="14" rx="16" ry="10"/><circle r="6" fill="#ffdc78"/></g></g><g fill="#f18bb8"><circle cx="111" cy="111" r="7"/><circle cx="401" cy="111" r="7"/><circle cx="111" cy="401" r="7"/><circle cx="401" cy="401" r="7"/></g>'
  },
  'frostline': {
    main: '#70cbed',
    light: '#e1fbff',
    accent: '#a1ddff',
    extras: '<g fill="#a1ddff" stroke="#f1fdff" stroke-width="3"><path d="M256 18l22 40-22 30-22-30z M494 256l-40 22-30-22 30-22z M256 494l-22-40 22-30 22 30z M18 256l40-22 30 22-30 22z"/></g><g stroke="#f3fdff" stroke-width="5" stroke-linecap="round"><path d="M116 106l20 20m-20 0l20-20m-10-9v38m-19-19h38 M376 106l20 20m-20 0l20-20m-10-9v38m-19-19h38 M116 388l20 20m-20 0l20-20m-10-9v38m-19-19h38 M376 388l20 20m-20 0l20-20m-10-9v38m-19-19h38"/></g>'
  },
  'emerald-leaves': {
    main: '#49c88b',
    light: '#d7ffba',
    accent: '#a2ed70',
    extras: '<g fill="#79df9f" stroke="#e3ffdc" stroke-width="3"><path d="M256 20c-37 20-45 49-4 70 33-26 31-49 4-70z M492 256c-20-37-49-45-70-4 26 33 49 31 70 4z M256 492c-37-20-45-49-4-70 33 26 31 49 4 70z M20 256c20-37 49-45 70-4-26 33-49 31-70 4z"/></g><g stroke="#d9ffe2" stroke-width="4" fill="none" stroke-linecap="round"><path d="M110 112q20 25 38 48m-38-48q-4 30-22 41 M402 112q-20 25-38 48m38-48q4 30 22 41 M110 400q20-25 38-48m-38 48q-4-30-22-41 M402 400q-20-25-38-48m38 48q4-30 22-41"/></g>'
  }
};

export function getBuiltInDecorationImage(id) {
  const art = DECORATION_ART[String(id || '')];
  if (!art) return '';

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
    '<defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">',
    '<stop stop-color="' + art.light + '"/><stop offset=".5" stop-color="' + art.main + '"/><stop offset="1" stop-color="' + art.accent + '"/>',
    '</linearGradient><filter id="soft"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>',
    '<circle cx="256" cy="256" r="194" fill="none" stroke="url(#ring)" stroke-width="16" filter="url(#soft)"/>',
    '<circle cx="256" cy="256" r="214" fill="none" stroke="' + art.light + '" stroke-width="3" stroke-dasharray="3 12" opacity=".92"/>',
    art.extras,
    '<g fill="' + art.light + '"><circle cx="111" cy="111" r="4"/><circle cx="401" cy="111" r="4"/><circle cx="111" cy="401" r="4"/><circle cx="401" cy="401" r="4"/></g>',
    '</svg>'
  ].join('');

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
