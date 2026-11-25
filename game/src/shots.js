// shots.js — deterministic staged states for the four screenshots. Each shot sets
// every visible number, order, item and chef position by hand: no randomness, no
// running clock, so the same shot renders the same pixels every time. The camera
// zooms into the part of the kitchen each shot is about.

import { RECIPES } from './config.js';

export const SHOTS = {
  cover: {
    file: '1-cover.jpg',
    camera: { x: 0, y: 0, w: 1280, h: 800 },
    title: 'Full kitchen mid-rush',
  },
  orders: {
    file: '2-orders.jpg',
    camera: { x: 0, y: 30, w: 1100, h: 688 },
    title: 'Order board and build table close-up',
  },
  rush: {
    file: '3-rush.jpg',
    camera: { x: 560, y: 40, w: 720, h: 450 },
    title: 'Service rush with a burning patty',
  },
  serve: {
    file: '4-serve.jpg',
    camera: { x: 740, y: 300, w: 600, h: 375 },
    title: 'Plating and serving at the pass',
  },
};

function ticket(world, recipeName, frac) {
  const recipe = RECIPES.find((r) => r.name === recipeName);
  const patienceMax = 50;
  return {
    id: 0,
    recipe,
    patience: patienceMax * frac,
    patienceMax,
    bornAt: 0,
  };
}

function base(world, time, score, coins, combo) {
  world.mode = 'playing';
  world.time = time;
  world.timeLeft = 180 - time;
  world.score = score;
  world.coins = coins;
  world.combo = combo;
  world.comboTimer = 12;
  world.served = Math.max(1, Math.floor(score / 400));
  world.bestCombo = Math.max(combo, 3);
  world.orders = [];
  world.plates = [];
  world.loose = [];
  world.particles = [];
  world.popups = [];
  world.grills = {};
  world.boards = {};
  world.chop = { stationId: null, progress: 0 };
  world.hint = '';
  world.hintTimer = 0;
}

export function stageShot(world, name) {
  const chef = world.chef;
  if (name === 'cover') {
    base(world, 88, 1240, 86, 3);
    world.orders = [
      ticket(world, 'Classic Stack', 0.62),
      ticket(world, 'Cheese Melt', 0.45),
      ticket(world, 'Garden Fresh', 0.8),
    ];
    world.orders.forEach((o, i) => { o.id = i + 1; });
    chef.x = 775; chef.y = 365; chef.dir = -Math.PI / 2; chef.moving = false;
    chef.carrying = { kind: 'patty', state: 'cooked' };
    world.grills['grill-a'] = { item: { kind: 'patty', state: 'raw' }, t: 4.2 };
    world.grills['grill-b'] = { item: { kind: 'patty', state: 'cooked' }, t: 6.5 };
    world.boards['board-a'] = { kind: 'tomato', state: 'chopped' };
    world.plates.push({
      onAssembly: true,
      items: [
        { kind: 'bun', state: 'ready' },
        { kind: 'patty', state: 'cooked' },
        { kind: 'lettuce', state: 'chopped' },
      ],
    });
    world.loose.push({
      kind: 'plate', state: 'ready', x: 1198, y: 545,
      items: [
        { kind: 'bun', state: 'ready' },
        { kind: 'patty', state: 'cooked' },
        { kind: 'lettuce', state: 'chopped' },
        { kind: 'tomato', state: 'chopped' },
      ],
    });
    world.popups.push({ x: 1100, y: 450, text: '+14 coins', color: '#f6a821', life: 1.4 });
    return SHOTS.cover;
  }

  if (name === 'orders') {
    base(world, 120, 860, 54, 2);
    world.orders = [
      ticket(world, 'Classic Stack', 0.78),
      ticket(world, 'Cheese Melt', 0.22),
      ticket(world, 'Garden Fresh', 0.55),
      ticket(world, 'Saffron Special', 0.9),
    ];
    world.orders.forEach((o, i) => { o.id = i + 1; });
    chef.x = 1060; chef.y = 380; chef.dir = Math.PI; chef.moving = false;
    chef.carrying = { kind: 'tomato', state: 'chopped' };
    world.plates.push({
      onAssembly: true,
      items: [
        { kind: 'bun', state: 'ready' },
        { kind: 'lettuce', state: 'chopped' },
      ],
    });
    world.boards['board-a'] = { kind: 'onion', state: 'raw' };
    world.grills['grill-a'] = { item: { kind: 'patty', state: 'raw' }, t: 3 };
    return SHOTS.orders;
  }

  if (name === 'rush') {
    base(world, 156, 1420, 98, 2);
    world.orders = [
      ticket(world, 'Classic Stack', 0.12),
      ticket(world, 'Cheese Melt', 0.3),
      ticket(world, 'Garden Fresh', 0.08),
    ];
    world.orders.forEach((o, i) => { o.id = i + 1; });
    chef.x = 760; chef.y = 340; chef.dir = 0; chef.moving = true; chef.walkPhase = 1.2;
    chef.carrying = null;
    world.grills['grill-a'] = { item: { kind: 'patty', state: 'cooked' }, t: 6.2 };
    world.grills['grill-b'] = { item: { kind: 'patty', state: 'burnt' }, t: 11 };
    world.boards['board-a'] = { kind: 'lettuce', state: 'chopped' };
    world.plates.push({
      onAssembly: true,
      items: [
        { kind: 'bun', state: 'ready' },
        { kind: 'patty', state: 'cooked' },
      ],
    });
    world.hint = 'A patty burned! Trash it.';
    world.hintTimer = 2;
    for (let i = 0; i < 6; i++) {
      world.particles.push({
        x: 915 + i * 6, y: 200 - i * 8, vx: 8, vy: -30, life: 0.8, color: '#777777', size: 5,
      });
    }
    return SHOTS.rush;
  }

  if (name === 'serve') {
    base(world, 115, 1580, 112, 4);
    world.orders = [
      ticket(world, 'Classic Stack', 0.7),
      ticket(world, 'Saffron Special', 0.6),
    ];
    world.orders.forEach((o, i) => { o.id = i + 1; });
    chef.x = 1050; chef.y = 500; chef.dir = 0; chef.moving = false;
    chef.carrying = null;
    world.plates.push({
      onAssembly: true,
      items: [
        { kind: 'bun', state: 'ready' },
        { kind: 'cheese', state: 'ready' },
      ],
    });
    world.grills['grill-a'] = { item: { kind: 'patty', state: 'raw' }, t: 4.8 };
    // Popups float in the open floor left of the pass, clear of the SERVE sign.
    world.popups.push({ x: 1000, y: 420, text: '+32 coins', color: '#f6a821', life: 1.4 });
    world.popups.push({ x: 1000, y: 394, text: 'COMBO x4', color: '#2e9e5b', life: 1.4 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      world.particles.push({
        x: 1198 + Math.cos(a) * 26, y: 500 + Math.sin(a) * 16,
        vx: Math.cos(a) * 30, vy: Math.sin(a) * 20 - 20,
        life: 1, color: '#f6c453', size: 4,
      });
    }
    return SHOTS.serve;
  }

  return null;
}
