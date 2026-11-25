// world.js — the single game state and its per-frame update: chef movement with
// collision, timers, particles, popups, and the service clock. Order spawning and
// station rules live in orders.js and stations.js; this file wires them together.

import {
  CANVAS_W, CANVAS_H, SERVICE_SECONDS, CHEF_SPEED, KITCHEN_BOUNDS,
  STATIONS, DECOR_SOLIDS, mulberry32,
} from './config.js';
import { updateOrders, spawnOrder, orderCount } from './orders.js';
import { nearestStation, handleInteract, updateStations, updateChopping } from './stations.js';
import { audio } from './audio.js';

export function createWorld(seed = 20261125) {
  const rng = mulberry32(seed);
  return {
    rng,
    mode: 'title', // 'title' | 'playing' | 'over'
    time: 0,
    timeLeft: SERVICE_SECONDS,
    score: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    comboTimer: 0,
    day: 1,
    chef: { x: 640, y: 520, dir: 0, carrying: null, moving: false, walkPhase: 0 },
    orders: [],
    spawnTimer: 1.5,
    plates: [], // plates on the assembly table: {items: [{kind, state}]}
    loose: [], // chopped/cooked items resting on counters: {kind, state, x, y}
    particles: [],
    popups: [], // floating "+12" texts: {x, y, text, color, life}
    chop: { stationId: null, progress: 0 }, // current chopping job
    hint: '',
    hintTimer: 0,
    muted: false,
    lastTickSecond: -1,
  };
}

export function startService(world) {
  world.mode = 'playing';
  world.time = 0;
  world.timeLeft = SERVICE_SECONDS;
  world.score = 0;
  world.coins = 0;
  world.served = 0;
  world.lost = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.comboTimer = 0;
  world.orders = [];
  world.spawnTimer = 1.5;
  world.plates = [];
  world.loose = [];
  world.particles = [];
  world.popups = [];
  world.chop = { stationId: null, progress: 0 };
  world.chef.x = 640;
  world.chef.y = 520;
  world.chef.carrying = null;
  spawnOrder(world);
}

function collidesWithStation(x, y) {
  for (const s of STATIONS) {
    const pad = 14;
    if (x > s.x - pad && x < s.x + s.w + pad && y > s.y - pad && y < s.y + s.h + pad) return s;
  }
  for (const s of DECOR_SOLIDS) {
    const pad = 10;
    if (x > s.x - pad && x < s.x + s.w + pad && y > s.y - pad && y < s.y + s.h + pad) return s;
  }
  return null;
}

export function moveChef(world, dt, input) {
  const chef = world.chef;
  let vx = 0;
  let vy = 0;
  const kv = input.keyVector();
  if (kv) {
    vx = kv.x;
    vy = kv.y;
  } else if (input.moveTarget) {
    const dx = input.moveTarget.x - chef.x;
    const dy = input.moveTarget.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d > 10) {
      vx = dx / d;
      vy = dy / d;
    } else {
      input.moveTarget = null;
    }
  }
  if (vx === 0 && vy === 0) {
    chef.moving = false;
    return;
  }
  chef.moving = true;
  chef.dir = Math.atan2(vy, vx);
  chef.walkPhase += dt * 11;
  const nx = chef.x + vx * CHEF_SPEED * dt;
  const ny = chef.y + vy * CHEF_SPEED * dt;
  // Axis-separated movement so the chef slides along counters instead of sticking.
  if (!collidesWithStation(nx, chef.y)) chef.x = nx;
  if (!collidesWithStation(chef.x, ny)) chef.y = ny;
  chef.x = Math.max(KITCHEN_BOUNDS.x0 + 20, Math.min(KITCHEN_BOUNDS.x1 - 20, chef.x));
  chef.y = Math.max(KITCHEN_BOUNDS.y0 + 20, Math.min(KITCHEN_BOUNDS.y1 - 20, chef.y));
}

export function addPopup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color, life: 1.4 });
}

export function addParticles(world, x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = world.rng() * Math.PI * 2;
    const sp = 40 + world.rng() * 120;
    world.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      life: 0.5 + world.rng() * 0.5,
      color,
      size: 2 + world.rng() * 4,
    });
  }
}

export function updateWorld(world, dt, input) {
  if (world.mode === 'title') {
    // Gentle idle drift so the title screen is alive behind the overlay.
    world.time += dt;
    updateStations(world, dt, true);
    return;
  }
  if (world.mode === 'over') return;

  world.time += dt;
  world.timeLeft = Math.max(0, SERVICE_SECONDS - world.time);
  const whole = Math.ceil(world.timeLeft);
  if (whole <= 10 && whole !== world.lastTickSecond && whole > 0) {
    world.lastTickSecond = whole;
    audio.tick();
  }

  moveChef(world, dt, input);

  // Interaction: a press uses the nearest station; holding E keeps chopping.
  if (input.interactPressed) {
    const station = nearestStation(world);
    if (station) handleInteract(world, station);
  }
  if (input.interactHeld) {
    const station = nearestStation(world);
    if (station && station.kind === 'board') updateChopping(world, station, dt);
  }
  updateStations(world, dt, false);
  updateOrders(world, dt);

  // Combo decay.
  if (world.combo > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // Particles and popups.
  for (const p of world.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt;
    p.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const p of world.popups) {
    p.y -= 34 * dt;
    p.life -= dt;
  }
  world.popups = world.popups.filter((p) => p.life > 0);
  if (world.hintTimer > 0) {
    world.hintTimer -= dt;
    if (world.hintTimer <= 0) world.hint = '';
  }

  // Order spawning ramps up as the service goes on.
  if (orderCount(world) < 4) {
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      spawnOrder(world);
      const elapsed = world.time / SERVICE_SECONDS;
      world.spawnTimer = 15 - elapsed * 6; // 15s early, ~9s late
    }
  }

  if (world.timeLeft <= 0) {
    world.mode = 'over';
    world.combo = 0;
  }
}
