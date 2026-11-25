// orders.js — the ticket rail: spawning orders, patience countdowns, serving a
// plate against open orders, and the coin/combo payoff. A recipe is a set of
// prepared ingredients; order of items on the plate does not matter.

import { RECIPES, MAX_ACTIVE_ORDERS, COMBO_WINDOW_SECONDS } from './config.js';
import { addPopup, addParticles } from './world.js';
import { audio } from './audio.js';

let orderId = 0;

export function orderCount(world) {
  return world.orders.length;
}

function pickRecipe(world) {
  const idx = Math.floor(world.rng() * RECIPES.length);
  return RECIPES[idx];
}

function patienceSeconds(world) {
  // Tickets get less patient as the service goes on: 52s early, ~38s late.
  const elapsed = world.time / 180;
  return 52 - elapsed * 14;
}

export function spawnOrder(world) {
  if (world.orders.length >= MAX_ACTIVE_ORDERS) return null;
  const recipe = pickRecipe(world);
  const patience = patienceSeconds(world);
  const order = {
    id: ++orderId,
    recipe,
    patience,
    patienceMax: patience,
    bornAt: world.time,
  };
  world.orders.push(order);
  return order;
}

// Does the plate's items match the recipe exactly (same multiset of kind+state)?
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const key = (it) => `${it.kind}:${it.state}`;
  const have = plateItems.map(key).sort();
  const want = recipe.items.map(key).sort();
  return have.every((h, i) => h === want[i]);
}

export function servePlate(world, plateItems) {
  // Find the first open order this plate satisfies.
  const idx = world.orders.findIndex((o) => plateMatchesRecipe(plateItems, o.recipe));
  if (idx === -1) {
    // Wrong dish: no order takes it. Small patience penalty on the oldest ticket.
    if (world.orders.length > 0) {
      world.orders[0].patience -= 4;
    }
    world.combo = 0;
    audio.error();
    world.hint = 'Wrong dish! Check the ticket.';
    world.hintTimer = 2;
    return { served: false };
  }
  const order = world.orders[idx];
  world.orders.splice(idx, 1);
  const patienceFrac = Math.max(0, order.patience / order.patienceMax);
  const tip = Math.round(patienceFrac * 6);
  const coins = order.recipe.coins + tip;
  world.coins += coins;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.comboTimer = COMBO_WINDOW_SECONDS;
  const comboBonus = world.combo > 1 ? (world.combo - 1) * 2 : 0;
  world.score += coins * 10 + comboBonus * 10 + 50;
  const sx = 1198;
  const sy = 505;
  addPopup(world, sx, sy, `+${coins} coins`, '#f6a821');
  if (world.combo > 1) addPopup(world, sx, sy - 26, `COMBO x${world.combo}`, '#2e9e5b');
  addParticles(world, sx, sy, '#f6c453', 14);
  audio.ding();
  return { served: true, order, coins };
}

export function updateOrders(world, dt) {
  for (const order of world.orders) {
    order.patience -= dt;
  }
  const expired = world.orders.filter((o) => o.patience <= 0);
  if (expired.length > 0) {
    world.orders = world.orders.filter((o) => o.patience > 0);
    world.lost += expired.length;
    world.combo = 0;
    audio.error();
    world.hint = 'A ticket ran out of patience!';
    world.hintTimer = 2;
  }
}
