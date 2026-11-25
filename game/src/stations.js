// stations.js — what happens when the chef uses a station. One press does one
// thing (take, place, pick up, serve, trash); chopping is the only hold-to-work
// action and progresses while E is held near a board. Grill slots cook over time
// and burn if left too long.

import { STATIONS, ITEMS, CHOP_SECONDS, GRILL_COOK_SECONDS, GRILL_BURN_SECONDS, INTERACT_RANGE } from './config.js';
import { addPopup, addParticles } from './world.js';
import { servePlate } from './orders.js';
import { audio } from './audio.js';

function stationCenter(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

export function nearestStation(world) {
  const chef = world.chef;
  let best = null;
  let bestD = INTERACT_RANGE;
  for (const s of STATIONS) {
    const c = stationCenter(s);
    const d = Math.hypot(chef.x - c.x, chef.y - c.y);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

function grillSlot(world, station) {
  if (!world.grills) world.grills = {};
  if (!world.grills[station.id]) world.grills[station.id] = null;
  return world.grills[station.id];
}

function setGrillSlot(world, station, value) {
  if (!world.grills) world.grills = {};
  world.grills[station.id] = value;
}

function boardItem(world, station) {
  if (!world.boards) world.boards = {};
  return world.boards[station.id] || null;
}

function setBoardItem(world, station, value) {
  if (!world.boards) world.boards = {};
  world.boards[station.id] = value;
}

export function handleInteract(world, station) {
  const chef = world.chef;
  audio.unlock();

  if (station.kind === 'crate') {
    if (chef.carrying) {
      world.hint = 'Hands full — serve or trash it first.';
      world.hintTimer = 1.6;
      audio.error();
      return;
    }
    const def = ITEMS[station.item];
    // Raw means "needs work": choppable items need the board, the patty needs
    // the grill. Bun and cheese are ready as taken.
    chef.carrying = { kind: station.item, state: def.choppable || def.grillable ? 'raw' : 'ready' };
    audio.pickup();
    return;
  }

  if (station.kind === 'board') {
    const item = boardItem(world, station);
    if (item) {
      // Take the chopped (or still raw) item back.
      if (chef.carrying) {
        world.hint = 'Hands full.';
        world.hintTimer = 1.4;
        audio.error();
        return;
      }
      chef.carrying = item;
      setBoardItem(world, station, null);
      world.chop = { stationId: null, progress: 0 };
      audio.pickup();
      return;
    }
    if (!chef.carrying) return;
    const def = ITEMS[chef.carrying.kind];
    if (!def.choppable) {
      world.hint = `${def.label} needs no chopping.`;
      world.hintTimer = 1.6;
      audio.error();
      return;
    }
    if (chef.carrying.state !== 'raw') {
      world.hint = 'Already chopped.';
      world.hintTimer = 1.4;
      audio.error();
      return;
    }
    setBoardItem(world, station, chef.carrying);
    chef.carrying = null;
    world.chop = { stationId: station.id, progress: 0 };
    audio.place();
    return;
  }

  if (station.kind === 'grill') {
    const slot = grillSlot(world, station);
    if (slot) {
      if (chef.carrying) {
        world.hint = 'Grill is busy.';
        world.hintTimer = 1.4;
        audio.error();
        return;
      }
      chef.carrying = slot.item;
      setGrillSlot(world, station, null);
      audio.pickup();
      return;
    }
    if (!chef.carrying) return;
    if (chef.carrying.kind !== 'patty' || chef.carrying.state !== 'raw') {
      world.hint = 'Only a raw patty goes on the grill.';
      world.hintTimer = 1.6;
      audio.error();
      return;
    }
    setGrillSlot(world, station, { item: chef.carrying, t: 0 });
    chef.carrying = null;
    audio.sizzle();
    return;
  }

  if (station.kind === 'assembly') {
    if (!chef.carrying) {
      // Pick up a finished plate if one is waiting here.
      const plate = world.plates.find((p) => p.onAssembly);
      if (plate) {
        chef.carrying = { kind: 'plate', state: 'ready', items: plate.items };
        world.plates = world.plates.filter((p) => p !== plate);
        audio.pickup();
      }
      return;
    }
    if (chef.carrying.kind === 'plate') {
      world.hint = 'That plate is done — serve it!';
      world.hintTimer = 1.6;
      audio.error();
      return;
    }
    // Add the carried ingredient to the plate being built.
    let plate = world.plates.find((p) => p.onAssembly);
    if (!plate) {
      plate = { items: [], onAssembly: true };
      world.plates.push(plate);
    }
    if (plate.items.length >= 4) {
      world.hint = 'Plate is full — serve it!';
      world.hintTimer = 1.6;
      audio.error();
      return;
    }
    plate.items.push({ ...chef.carrying });
    chef.carrying = null;
    audio.place();
    return;
  }

  if (station.kind === 'serve') {
    if (!chef.carrying || chef.carrying.kind !== 'plate') {
      world.hint = 'Bring a finished plate to the pass.';
      world.hintTimer = 1.6;
      audio.error();
      return;
    }
    const result = servePlate(world, chef.carrying.items);
    if (result.served) {
      chef.carrying = null;
    } else {
      // Wrong dish stays in hand so the player can trash it.
      addParticles(world, 1198, 505, '#d63c2f', 8);
    }
    return;
  }

  if (station.kind === 'trash') {
    if (!chef.carrying) return;
    chef.carrying = null;
    world.hint = 'Tossed it.';
    world.hintTimer = 1;
    audio.place();
  }
}

// Hold E near a board with a raw item on it: progress chopping, then the item
// becomes chopped and ready to take.
export function updateChopping(world, station, dt) {
  const item = boardItem(world, station);
  if (!item || item.state !== 'raw') return;
  if (world.chop.stationId !== station.id) {
    world.chop = { stationId: station.id, progress: 0 };
  }
  world.chop.progress += dt / CHOP_SECONDS;
  if (Math.random() < dt * 8) {
    addParticles(world, station.x + station.w / 2, station.y + station.h / 2, '#4da34d', 1);
  }
  if (world.chop.progress >= 1) {
    item.state = 'chopped';
    world.chop = { stationId: null, progress: 0 };
    audio.chop();
    addPopup(world, station.x + station.w / 2, station.y - 8, 'CHOPPED!', '#2e9e5b');
  }
}

// Grill timers tick every frame: raw -> cooked -> burnt (with smoke + warning).
export function updateStations(world, dt, idle) {
  if (!world.grills) world.grills = {};
  for (const s of STATIONS) {
    if (s.kind !== 'grill') continue;
    const slot = world.grills[s.id];
    if (!slot) continue;
    slot.t += dt;
    if (slot.item.state === 'raw' && slot.t >= GRILL_COOK_SECONDS) {
      slot.item.state = 'cooked';
      audio.ding();
      addPopup(world, s.x + s.w / 2, s.y - 8, 'COOKED!', '#2e9e5b');
    } else if (slot.item.state === 'cooked' && slot.t >= GRILL_BURN_SECONDS) {
      slot.item.state = 'burnt';
      audio.burn();
      world.hint = 'A patty burned! Trash it.';
      world.hintTimer = 2;
    }
    if (slot.item.state === 'burnt' && Math.random() < dt * 6) {
      addParticles(world, s.x + s.w / 2, s.y + 10, '#666666', 1);
    }
  }
}
