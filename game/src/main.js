// main.js — entry point: the game loop, the title / playing / game-over states,
// the deterministic screenshot mode (?shot=cover|orders|rush|serve) and the
// headless self-test (?selftest=1). Rendering lives in render.js; rules live in
// world.js, orders.js and stations.js.

import { CANVAS_W, CANVAS_H, STATIONS, ITEMS, RECIPES } from './config.js';
import { createWorld, startService, updateWorld } from './world.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { stageShot, SHOTS } from './shots.js';
import { audio } from './audio.js';
import { handleInteract, nearestStation, updateChopping, updateStations } from './stations.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 20261125);

const world = createWorld(seed);
const input = createInput(canvas);

// ---- deterministic screenshot mode -----------------------------------------
// ?shot=<name> stages a fixed kitchen, draws one frame, and stops. Nothing
// ticks, nothing is random, so the same shot renders the same pixels.
const shotName = params.get('shot');
if (shotName && SHOTS[shotName]) {
  const shot = stageShot(world, shotName);
  render(ctx, world, shot.camera);
  document.title = `shot:${shotName}`;
  window.__shotReady = true;
}

// ---- headless self-test -----------------------------------------------------
// ?selftest=1 plays the whole loop by hand through the real functions and
// writes PASS/FAIL lines into #testout (and the console). No input devices,
// no randomness beyond the seeded world.
async function runSelfTest() {
  const out = [];
  const check = (name, ok) => out.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  try {
    const w = createWorld(7);
    startService(w);
    check('service starts playing', w.mode === 'playing');
    check('first order spawned', w.orders.length >= 1);

    // Fake input: a still object with the same shape the loop passes.
    const fakeInput = {
      keyVector: () => null,
      moveTarget: null,
      interactHeld: false,
      interactPressed: false,
      restartPressed: false,
      mutePressed: false,
      consumePresses: () => {},
    };
    const near = (stationId) => {
      const s = STATIONS.find((st) => st.id === stationId);
      w.chef.x = s.x + s.w / 2;
      w.chef.y = s.y + s.h + 40;
    };

    // Take a tomato, chop it on board A.
    near('crate-tomato');
    handleInteract(w, STATIONS.find((s) => s.id === 'crate-tomato'));
    check('crate gives tomato', w.chef.carrying && w.chef.carrying.kind === 'tomato');
    near('board-a');
    handleInteract(w, STATIONS.find((s) => s.id === 'board-a'));
    check('tomato placed on board', !!w.boards['board-a']);
    for (let i = 0; i < 10; i++) updateChopping(w, STATIONS.find((s) => s.id === 'board-a'), 0.2);
    check('tomato chopped', w.boards['board-a'] && w.boards['board-a'].state === 'chopped');
    handleInteract(w, STATIONS.find((s) => s.id === 'board-a'));
    check('chopped tomato in hand', w.chef.carrying && w.chef.carrying.state === 'chopped');

    // Grill a patty: raw -> cooked after 7s on the grill. First trash the
    // tomato: hands must be empty before taking a new ingredient.
    near('trash');
    handleInteract(w, STATIONS.find((s) => s.id === 'trash'));
    check('trash empties hands', w.chef.carrying === null);
    near('crate-patty');
    handleInteract(w, STATIONS.find((s) => s.id === 'crate-patty'));
    near('grill-a');
    handleInteract(w, STATIONS.find((s) => s.id === 'grill-a'));
    for (let i = 0; i < 14; i++) updateStations(w, 0.5, false);
    check('patty cooked on grill', w.grills['grill-a'] && w.grills['grill-a'].item.state === 'cooked');
    handleInteract(w, STATIONS.find((s) => s.id === 'grill-a'));
    check('cooked patty in hand', w.chef.carrying && w.chef.carrying.state === 'cooked');

    // Build a Classic Stack and serve it against a forced matching order.
    const classic = RECIPES.find((r) => r.name === 'Classic Stack');
    w.orders = [{ id: 99, recipe: classic, patience: 40, patienceMax: 50, bornAt: 0 }];
    const addToPlate = (item) => {
      w.chef.carrying = item;
      near('assembly');
      handleInteract(w, STATIONS.find((s) => s.id === 'assembly'));
    };
    addToPlate({ kind: 'bun', state: 'ready' });
    addToPlate({ kind: 'patty', state: 'cooked' });
    addToPlate({ kind: 'lettuce', state: 'chopped' });
    addToPlate({ kind: 'tomato', state: 'chopped' });
    check('plate built with 4 items', w.plates.length === 1 && w.plates[0].items.length === 4);
    near('assembly');
    handleInteract(w, STATIONS.find((s) => s.id === 'assembly'));
    check('plate picked up', w.chef.carrying && w.chef.carrying.kind === 'plate');
    near('serve');
    handleInteract(w, STATIONS.find((s) => s.id === 'serve'));
    check('order served', w.served === 1 && w.coins > 0 && w.orders.length === 0);
    check('combo rose', w.combo === 1);

    // Wrong dish is refused and the combo breaks.
    w.orders = [{ id: 100, recipe: classic, patience: 40, patienceMax: 50, bornAt: 0 }];
    w.chef.carrying = { kind: 'plate', state: 'ready', items: [{ kind: 'bun', state: 'ready' }] };
    near('serve');
    handleInteract(w, STATIONS.find((s) => s.id === 'serve'));
    check('wrong dish refused', w.served === 1 && w.combo === 0);

    // Timer runs the service to game over.
    for (let i = 0; i < 200; i++) updateWorld(w, 1, fakeInput);
    check('service ends at 180s', w.mode === 'over' && w.timeLeft === 0);
    check('score is positive', w.score > 0);
  } catch (err) {
    out.push(`FAIL exception: ${err.message}`);
  }
  const el = document.getElementById('testout');
  if (el) el.textContent = out.join('\n');
  console.log(out.join('\n'));
  window.__selfTestDone = true;
  document.title = out.some((l) => l.startsWith('FAIL')) ? 'selftest:FAIL' : 'selftest:PASS';
}

if (params.get('selftest') === '1') {
  runSelfTest();
}

// ---- normal play ------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (world.mode === 'title') {
    updateWorld(world, dt, input);
    if (input.interactPressed || input.pointer.down) {
      audio.unlock();
      startService(world);
    }
  } else if (world.mode === 'playing') {
    if (input.mutePressed) {
      world.muted = !world.muted;
      audio.setMuted(world.muted);
    }
    updateWorld(world, dt, input);
  } else if (world.mode === 'over') {
    if (input.restartPressed || input.pointer.down) startService(world);
  }
  input.consumePresses();
  render(ctx, world);
  requestAnimationFrame(frame);
}

if (!shotName && params.get('selftest') !== '1') {
  requestAnimationFrame(frame);
}
