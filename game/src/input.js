// input.js — keyboard (WASD / arrows + E / Space to interact, R to restart,
// M to mute) and mouse (click to walk to a point, click a station to use it).
// Holds one plain state object; the game loop reads it every frame.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    moveTarget: null, // {x, y} in canvas coordinates, or null
    interactHeld: false,
    interactPressed: false, // consumed by the game loop once per press
    restartPressed: false,
    mutePressed: false,
    pointer: { x: 0, y: 0, down: false },
  };

  function canvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (ev) => {
    const k = ev.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) ev.preventDefault();
    if (!ev.repeat) {
      if (k === 'e' || k === ' ') {
        state.interactHeld = true;
        state.interactPressed = true;
      }
      if (k === 'r') state.restartPressed = true;
      if (k === 'm') state.mutePressed = true;
    }
    keys.add(k);
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      state.moveTarget = null; // keyboard steering cancels a click target
    }
  });

  window.addEventListener('keyup', (ev) => {
    const k = ev.key.toLowerCase();
    keys.delete(k);
    if (k === 'e' || k === ' ') state.interactHeld = false;
  });

  canvas.addEventListener('pointerdown', (ev) => {
    state.pointer = { ...canvasPoint(ev.clientX, ev.clientY), down: true };
    state.moveTarget = canvasPoint(ev.clientX, ev.clientY);
  });
  canvas.addEventListener('pointerup', () => {
    state.pointer.down = false;
  });
  canvas.addEventListener('pointermove', (ev) => {
    state.pointer = { ...canvasPoint(ev.clientX, ev.clientY), down: state.pointer.down };
  });

  // The loop calls this after each update so a press fires exactly once.
  state.consumePresses = () => {
    state.interactPressed = false;
    state.restartPressed = false;
    state.mutePressed = false;
  };

  // Movement vector from keys, or null when no key is held.
  state.keyVector = () => {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (x === 0 && y === 0) return null;
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  };

  return state;
}
