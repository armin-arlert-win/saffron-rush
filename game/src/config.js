// config.js — every constant for Saffron Rush: canvas size, palette, recipes,
// station layout, timings. No code runs here; other modules read these values.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const SERVICE_SECONDS = 180;
export const CHEF_SPEED = 270;
export const INTERACT_RANGE = 78;
export const CHOP_SECONDS = 1.2;
export const GRILL_COOK_SECONDS = 6;
export const GRILL_BURN_SECONDS = 10;
export const MAX_ACTIVE_ORDERS = 4;
export const COMBO_WINDOW_SECONDS = 20;

// Warm kitchen palette: cream floor, terracotta walls, teal counters, saffron accents.
export const COLORS = {
  floorA: '#f2e3c6',
  floorB: '#e6d3a8',
  wall: '#8c4a2e',
  wallTrim: '#f6a821',
  counterTop: '#2f7d6d',
  counterBody: '#245f53',
  woodTop: '#d9a066',
  woodBody: '#a9763f',
  grillTop: '#3a3a3a',
  grillHot: '#ff7a2f',
  hudBg: '#1f2a44',
  hudText: '#ffffff',
  saffron: '#f6a821',
  ticketBg: '#fffdf5',
  ticketEdge: '#d8c9a3',
  good: '#2e9e5b',
  warn: '#e8a13a',
  bad: '#d63c2f',
  chefSkin: '#f2c09a',
  chefHat: '#ffffff',
  chefApron: '#f6f1e6',
};

// Ingredients. choppable: must be chopped on a board before plating.
// grillable: must be grilled before plating. The rest are ready as taken.
export const ITEMS = {
  bun: { label: 'Bun', color: '#e8b96a', choppable: false, grillable: false },
  patty: { label: 'Patty', color: '#8a5a33', choppable: false, grillable: true },
  tomato: { label: 'Tomato', color: '#d63c2f', choppable: true, grillable: false },
  lettuce: { label: 'Lettuce', color: '#4da34d', choppable: true, grillable: false },
  cheese: { label: 'Cheese', color: '#f6c453', choppable: false, grillable: false },
  onion: { label: 'Onion', color: '#b678c2', choppable: true, grillable: false },
};

// An order is a set of prepared ingredients. state: 'ready' | 'chopped' | 'cooked'.
export const RECIPES = [
  {
    name: 'Classic Stack',
    items: [
      { kind: 'bun', state: 'ready' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
    ],
    coins: 14,
  },
  {
    name: 'Cheese Melt',
    items: [
      { kind: 'bun', state: 'ready' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'cheese', state: 'ready' },
    ],
    coins: 11,
  },
  {
    name: 'Garden Fresh',
    items: [
      { kind: 'bun', state: 'ready' },
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
      { kind: 'cheese', state: 'ready' },
    ],
    coins: 12,
  },
  {
    name: 'Saffron Special',
    items: [
      { kind: 'bun', state: 'ready' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'cheese', state: 'ready' },
      { kind: 'onion', state: 'chopped' },
    ],
    coins: 15,
  },
  {
    name: 'Little Onion',
    items: [
      { kind: 'bun', state: 'ready' },
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'onion', state: 'chopped' },
    ],
    coins: 9,
  },
];

// Station layout. kind: 'crate' | 'board' | 'grill' | 'assembly' | 'serve' | 'trash'.
// Crates hand out a raw ingredient; boards chop; grills cook; assembly builds a plate;
// serve checks the plate against open orders; trash discards what the chef carries.
export const STATIONS = [
  { id: 'crate-tomato', kind: 'crate', item: 'tomato', x: 24, y: 196, w: 118, h: 74, label: 'TOMATO' },
  { id: 'crate-lettuce', kind: 'crate', item: 'lettuce', x: 24, y: 286, w: 118, h: 74, label: 'LETTUCE' },
  { id: 'crate-onion', kind: 'crate', item: 'onion', x: 24, y: 376, w: 118, h: 74, label: 'ONION' },
  { id: 'crate-patty', kind: 'crate', item: 'patty', x: 24, y: 466, w: 118, h: 74, label: 'PATTY' },
  { id: 'crate-bun', kind: 'crate', item: 'bun', x: 24, y: 556, w: 118, h: 74, label: 'BUN' },
  { id: 'crate-cheese', kind: 'crate', item: 'cheese', x: 24, y: 646, w: 118, h: 74, label: 'CHEESE' },
  { id: 'board-a', kind: 'board', x: 250, y: 186, w: 150, h: 92, label: 'CHOP' },
  { id: 'board-b', kind: 'board', x: 440, y: 186, w: 150, h: 92, label: 'CHOP' },
  { id: 'grill-a', kind: 'grill', x: 650, y: 186, w: 150, h: 92, label: 'GRILL' },
  { id: 'grill-b', kind: 'grill', x: 840, y: 186, w: 150, h: 92, label: 'GRILL' },
  { id: 'assembly', kind: 'assembly', x: 1040, y: 186, w: 180, h: 92, label: 'BUILD' },
  { id: 'serve', kind: 'serve', x: 1140, y: 430, w: 116, h: 150, label: 'SERVE' },
  { id: 'trash', kind: 'trash', x: 1140, y: 630, w: 116, h: 96, label: 'TRASH' },
];

export const KITCHEN_BOUNDS = { x0: 8, y0: 160, x1: 1272, y1: 792 };

// Decorative solids the chef cannot walk through (the prep counter and the
// plant pot, drawn by render.js). Kept here so collision and drawing agree.
export const DECOR_SOLIDS = [
  { x: 300, y: 630, w: 560, h: 58 },
  { x: 44, y: 720, w: 54, h: 56 },
];

// Small seeded RNG so a fresh run is varied but a screenshot stage is reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
