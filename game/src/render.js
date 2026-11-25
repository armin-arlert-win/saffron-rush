// render.js — every pixel of Saffron Rush is drawn here with canvas vector art:
// floor tiles, stations, the chef, ingredient icons, the ticket rail, the HUD,
// and the title / game-over overlays. No image assets, no external files.
// A camera {x, y, w, h} selects which part of the kitchen fills the canvas;
// screenshots use it to zoom into the order board, the grills, or the pass.

import { CANVAS_W, CANVAS_H, COLORS, ITEMS, STATIONS } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- ingredient icons (drawn at center x, y, radius r) --------------------
export function drawIngredient(ctx, kind, state, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'tomato') {
    ctx.fillStyle = state === 'chopped' ? '#e05a4a' : '#d63c2f';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f8f3f';
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.7;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.3);
      ctx.lineTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
      ctx.lineTo(Math.cos(a + 0.5) * r * 0.4, Math.sin(a + 0.5) * r * 0.4);
      ctx.fill();
    }
    if (state === 'chopped') {
      ctx.strokeStyle = '#8f2a20';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(r * 0.6, 0);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'lettuce') {
    ctx.fillStyle = '#4da34d';
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rad = r * (0.85 + 0.15 * Math.sin(a * 3));
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7cc47c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'onion') {
    ctx.fillStyle = '#b678c2';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#efe2f5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f6c453';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.lineTo(r, r * 0.7);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d99e22';
    ctx.beginPath();
    ctx.arc(-r * 0.25, r * 0.25, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.3, r * 0.05, r * 0.12, 0, Math.PI * 2);
    ctx.arc(0, -r * 0.3, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'bun') {
    ctx.fillStyle = '#e8b96a';
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-r, r * 0.25, r * 2, r * 0.25);
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.45, -0.35], [0, -0.55], [0.45, -0.35], [-0.2, -0.15], [0.25, -0.1]]) {
      ctx.beginPath();
      ctx.ellipse(dx * r, dy * r, r * 0.1, r * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    if (state === 'burnt') {
      ctx.fillStyle = '#1d1d1d';
    } else if (state === 'cooked') {
      ctx.fillStyle = '#7a4a22';
    } else {
      ctx.fillStyle = '#c98a7a';
    }
    rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.fill();
    if (state === 'cooked') {
      ctx.strokeStyle = '#5a3413';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(r * 0.6, 0);
      ctx.stroke();
    }
    if (state === 'burnt') {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.2, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, items, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9b98a';
  ctx.lineWidth = 2;
  ctx.stroke();
  const n = items.length;
  items.forEach((it, i) => {
    const ix = n === 1 ? 0 : -26 + (i * 52) / Math.max(1, n - 1);
    if (it.kind === 'plate') return;
    drawIngredient(ctx, it.kind, it.state, ix, -2, 13);
  });
  ctx.restore();
}

// ---- stations --------------------------------------------------------------
function drawStation(ctx, world, s) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  ctx.save();
  if (s.kind === 'crate') {
    ctx.fillStyle = '#a9763f';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#c98f4e';
    rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 6);
    ctx.fill();
    drawIngredient(ctx, s.item, s.item === 'patty' ? 'raw' : 'ready', cx, cy - 8, 20);
    text(ctx, s.label, cx, s.y + s.h - 13, 12, '#5a3413', 'bold');
  } else if (s.kind === 'board') {
    ctx.fillStyle = '#8a6a42';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#e8d9b0';
    rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 22, 6);
    ctx.fill();
    const item = world.boards && world.boards[s.id];
    if (item) {
      drawIngredient(ctx, item.kind, item.state, cx, cy - 4, 22);
      if (item.state === 'raw') {
        const p = world.chop.stationId === s.id ? world.chop.progress : 0;
        ctx.fillStyle = '#d8c9a3';
        rr(ctx, s.x + 14, s.y + s.h - 12, s.w - 28, 7, 3);
        ctx.fill();
        ctx.fillStyle = COLORS.good;
        rr(ctx, s.x + 14, s.y + s.h - 12, (s.w - 28) * p, 7, 3);
        ctx.fill();
      }
    }
    // Knife.
    ctx.fillStyle = '#c0c8d0';
    ctx.beginPath();
    ctx.moveTo(s.x + s.w - 34, s.y + 12);
    ctx.lineTo(s.x + s.w - 12, s.y + 12);
    ctx.lineTo(s.x + s.w - 18, s.y + 22);
    ctx.lineTo(s.x + s.w - 34, s.y + 22);
    ctx.closePath();
    ctx.fill();
    text(ctx, s.label, cx, s.y + s.h + 14, 12, '#5a3413', 'bold');
  } else if (s.kind === 'grill') {
    ctx.fillStyle = '#2c2c2c';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    const slot = world.grills && world.grills[s.id];
    const cooking = slot && slot.item.state !== 'burnt';
    if (cooking) {
      ctx.fillStyle = 'rgba(255,122,47,0.35)';
      rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 6);
      ctx.fill();
    }
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + 8, s.y + (s.h / 4) * i);
      ctx.lineTo(s.x + s.w - 8, s.y + (s.h / 4) * i);
      ctx.stroke();
    }
    if (slot) {
      drawIngredient(ctx, 'patty', slot.item.state, cx, cy - 4, 24);
      const total = slot.item.state === 'raw' ? 6 : slot.item.state === 'cooked' ? 10 : 10;
      const frac = Math.min(1, slot.t / total);
      ctx.fillStyle = '#222';
      rr(ctx, s.x + 14, s.y + s.h - 12, s.w - 28, 7, 3);
      ctx.fill();
      ctx.fillStyle = slot.item.state === 'burnt' ? COLORS.bad : slot.item.state === 'cooked' ? COLORS.warn : COLORS.grillHot;
      rr(ctx, s.x + 14, s.y + s.h - 12, (s.w - 28) * frac, 7, 3);
      ctx.fill();
      if (slot.item.state === 'burnt') text(ctx, 'BURNT!', cx, s.y - 10, 14, COLORS.bad, 'bold');
      else if (slot.item.state === 'cooked') text(ctx, 'READY', cx, s.y - 10, 13, COLORS.good, 'bold');
    }
    text(ctx, s.label, cx, s.y + s.h + 14, 12, '#5a3413', 'bold');
  } else if (s.kind === 'assembly') {
    ctx.fillStyle = '#a9763f';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.woodTop;
    rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 6);
    ctx.fill();
    const plate = world.plates.find((p) => p.onAssembly);
    if (plate) drawPlate(ctx, cx, cy - 2, plate.items, 1);
    else {
      ctx.strokeStyle = 'rgba(90,52,19,0.5)';
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 46, 30, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    text(ctx, s.label, cx, s.y + s.h + 14, 12, '#5a3413', 'bold');
  } else if (s.kind === 'serve') {
    ctx.fillStyle = '#8c4a2e';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#f6c453';
    rr(ctx, s.x + 6, s.y + 6, s.w - 12, 34, 6);
    ctx.fill();
    text(ctx, 'SERVE', cx, s.y + 24, 15, '#5a3413', 'bold');
    ctx.fillStyle = '#f6f1e6';
    rr(ctx, s.x + 6, s.y + 46, s.w - 12, s.h - 52, 6);
    ctx.fill();
    // Bell on the pass.
    ctx.fillStyle = '#f6c453';
    ctx.beginPath();
    ctx.arc(cx, s.y + 66, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - 12, s.y + 66, 24, 4);
    const plate = world.loose.find((it) => it.kind === 'plate' && it.x > s.x && it.x < s.x + s.w);
    if (plate) drawPlate(ctx, cx, s.y + 108, plate.items, 0.85);
  } else if (s.kind === 'trash') {
    ctx.fillStyle = '#4a4a52';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#33333a';
    rr(ctx, s.x + 8, s.y + 8, s.w - 16, 26, 5);
    ctx.fill();
    text(ctx, 'TRASH', cx, s.y + s.h - 16, 13, '#ffffff', 'bold');
  }
  ctx.restore();
}

// ---- chef ------------------------------------------------------------------
function drawChef(ctx, world) {
  const c = world.chef;
  const bob = c.moving ? Math.sin(c.walkPhase) * 2 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob * 0.4);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: teal shirt + white apron.
  ctx.fillStyle = '#2f7d6d';
  ctx.beginPath();
  ctx.arc(0, 4, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.chefApron;
  rr(ctx, -13, -6, 26, 24, 7);
  ctx.fill();
  ctx.strokeStyle = '#2f7d6d';
  ctx.lineWidth = 2;
  rr(ctx, -13, -6, 26, 24, 7);
  ctx.stroke();
  // Head + toque.
  ctx.fillStyle = COLORS.chefSkin;
  ctx.beginPath();
  ctx.arc(0, -22, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.chefHat;
  rr(ctx, -15, -44, 30, 16, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-9, -44, 8, 0, Math.PI * 2);
  ctx.arc(0, -47, 9, 0, Math.PI * 2);
  ctx.arc(9, -44, 8, 0, Math.PI * 2);
  ctx.fill();
  // Eyes look where the chef walks.
  const ex = Math.cos(c.dir) * 4;
  const ey = Math.sin(c.dir) * 3;
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-5 + ex, -23 + ey, 2.2, 0, Math.PI * 2);
  ctx.arc(5 + ex, -23 + ey, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Carried item floats above the toque.
  if (c.carrying) {
    if (c.carrying.kind === 'plate') {
      drawPlate(ctx, 0, -62, c.carrying.items, 0.8);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(0, -62, 17, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, c.carrying.kind, c.carrying.state, 0, -62, 13);
    }
  }
  ctx.restore();
}

// ---- ticket rail + HUD ------------------------------------------------------
function drawOrders(ctx, world) {
  const y0 = 70;
  const w = 232;
  const h = 78;
  const gap = 14;
  world.orders.forEach((order, i) => {
    const x = 24 + i * (w + gap);
    const frac = Math.max(0, order.patience / order.patienceMax);
    const urgent = frac < 0.25;
    ctx.save();
    if (urgent && Math.floor(world.time * 3) % 2 === 0) {
      ctx.shadowColor = COLORS.bad;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = COLORS.ticketBg;
    rr(ctx, x, y0, w, h, 8);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = urgent ? COLORS.bad : COLORS.ticketEdge;
    ctx.lineWidth = urgent ? 3 : 2;
    rr(ctx, x, y0, w, h, 8);
    ctx.stroke();
    text(ctx, `#${order.id} ${order.recipe.name.toUpperCase()}`, x + 10, y0 + 14, 13, '#333', 'bold', 'left');
    order.recipe.items.forEach((it, j) => {
      drawIngredient(ctx, it.kind, it.state, x + 22 + j * 34, y0 + 38, 12);
    });
    text(ctx, `$${order.recipe.coins}`, x + w - 12, y0 + 38, 14, '#8a6a1f', 'bold', 'right');
    // Patience bar.
    ctx.fillStyle = '#e5dcc4';
    rr(ctx, x + 10, y0 + h - 14, w - 20, 8, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? COLORS.good : frac > 0.25 ? COLORS.warn : COLORS.bad;
    rr(ctx, x + 10, y0 + h - 14, (w - 20) * frac, 8, 4);
    ctx.fill();
  });
  if (world.orders.length === 0 && world.mode === 'playing') {
    text(ctx, 'No tickets — next order coming…', 640, y0 + 40, 16, '#8a7a5a', 'bold');
  }
}

function drawHUD(ctx, world) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, 64);
  ctx.fillStyle = COLORS.saffron;
  ctx.fillRect(0, 64, CANVAS_W, 4);
  text(ctx, 'SAFFRON RUSH', 24, 32, 22, COLORS.saffron, 'bold', 'left');
  text(ctx, `DAY ${world.day}`, 250, 32, 15, '#cdd6e4', 'bold', 'left');
  const t = Math.max(0, Math.ceil(world.timeLeft));
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  const low = t <= 30 && world.mode === 'playing';
  text(ctx, `${mm}:${ss}`, 640, 32, 34, low ? '#ff6b5e' : '#ffffff', 'bold');
  text(ctx, `SCORE ${world.score}`, 940, 32, 17, '#ffffff', 'bold', 'left');
  // Coin icon + count.
  ctx.fillStyle = '#f6c453';
  ctx.beginPath();
  ctx.arc(1120, 32, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, '$', 1120, 33, 13, '#7a5a00', 'bold');
  text(ctx, `${world.coins}`, 1138, 32, 18, '#ffffff', 'bold', 'left');
  if (world.combo > 1) {
    ctx.fillStyle = COLORS.good;
    rr(ctx, 1200, 16, 66, 32, 8);
    ctx.fill();
    text(ctx, `x${world.combo}`, 1233, 33, 16, '#ffffff', 'bold');
  }
}

// ---- overlays ---------------------------------------------------------------
function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(20,16,10,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SAFFRON RUSH', 640, 250, 84, '#f6a821', 'bold');
  text(ctx, 'One kitchen. One hundred eighty seconds. No burnt patties.', 640, 315, 24, '#ffffff', 'bold');
  text(ctx, 'WASD / arrows to move  •  E to grab, chop, grill, build & serve  •  Click to walk', 640, 390, 19, '#f6f1e6');
  text(ctx, 'Chop it. Grill it. Build it. Serve it before patience runs out.', 640, 425, 19, '#f6f1e6');
  ctx.fillStyle = '#f6a821';
  rr(ctx, 480, 470, 320, 58, 10);
  ctx.fill();
  text(ctx, 'CLICK OR PRESS ENTER TO START', 640, 500, 19, '#1f2a44', 'bold');
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(20,16,10,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SERVICE OVER!', 640, 220, 64, '#f6a821', 'bold');
  text(ctx, `Day ${world.day} complete`, 640, 280, 22, '#ffffff', 'bold');
  const rows = [
    [`SCORE`, `${world.score}`],
    [`COINS EARNED`, `$${world.coins}`],
    [`DISHES SERVED`, `${world.served}`],
    [`BEST COMBO`, `x${world.bestCombo}`],
    [`TICKETS LOST`, `${world.lost}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 340 + i * 44;
    text(ctx, label, 480, y, 20, '#cdd6e4', 'bold', 'left');
    text(ctx, value, 800, y, 22, '#ffffff', 'bold', 'right');
  });
  text(ctx, 'Press R or click to cook again', 640, 590, 20, '#f6a821', 'bold');
}

// ---- main render ------------------------------------------------------------
export function render(ctx, world, camera = null) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const cam = camera || { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H };
  // Width-driven scale: the camera rect sets the left edge and the width in
  // world units; the visible height follows the canvas aspect, so a zoomed
  // shot never stretches. cam.h is informational only.
  const scale = CANVAS_W / cam.w;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-cam.x, -cam.y);

  // Floor tiles.
  for (let ty = 0; ty < 10; ty++) {
    for (let tx = 0; tx < 20; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx * 64, 160 + ty * 64, 64, 64);
    }
  }
  // Rug in the middle of the kitchen.
  ctx.fillStyle = '#c96f4a';
  rr(ctx, 430, 420, 420, 180, 12);
  ctx.fill();
  ctx.strokeStyle = '#f6c453';
  ctx.lineWidth = 4;
  rr(ctx, 446, 436, 388, 148, 8);
  ctx.stroke();
  // Decorative prep counter along the bottom: plates and ingredients waiting,
  // so the lower half of the kitchen is not empty floor. (Decor only — not a
  // station, the chef walks past it.)
  ctx.fillStyle = '#a9763f';
  rr(ctx, 300, 630, 560, 58, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.woodTop;
  rr(ctx, 306, 636, 548, 46, 8);
  ctx.fill();
  drawIngredient(ctx, 'tomato', 'ready', 360, 659, 15);
  drawIngredient(ctx, 'lettuce', 'ready', 440, 659, 15);
  drawIngredient(ctx, 'cheese', 'ready', 520, 659, 15);
  drawIngredient(ctx, 'bun', 'ready', 600, 659, 15);
  drawIngredient(ctx, 'onion', 'ready', 680, 659, 15);
  drawIngredient(ctx, 'patty', 'raw', 760, 659, 15);
  // Potted herb plant in the bottom-left corner + a mat at the pass.
  ctx.fillStyle = '#b3502f';
  rr(ctx, 48, 736, 46, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#4da34d';
  ctx.beginPath();
  ctx.arc(71, 722, 20, 0, Math.PI * 2);
  ctx.arc(58, 730, 14, 0, Math.PI * 2);
  ctx.arc(84, 730, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c96f4a';
  rr(ctx, 1090, 700, 170, 60, 8);
  ctx.fill();
  // Wall band + sign above the kitchen.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 152, CANVAS_W, 10);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, 162, CANVAS_W, 3);

  // Stations, loose items, chef, particles, popups.
  for (const s of STATIONS) drawStation(ctx, world, s);
  for (const it of world.loose) {
    if (it.kind === 'plate') drawPlate(ctx, it.x, it.y, it.items, 0.9);
    else drawIngredient(ctx, it.kind, it.state, it.x, it.y, 16);
  }
  drawChef(ctx, world);
  // Popups are drawn in screen space (after the camera restore), so they are
  // stored here only. Particles stay in world space.
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Screen-space UI: HUD, ticket rail, hints, overlays.
  drawHUD(ctx, world);
  drawOrders(ctx, world);
  // Popups float in screen space (fixed size) so a zoomed camera never
  // blows them up over the station they celebrate.
  for (const p of world.popups) {
    ctx.globalAlpha = Math.min(1, p.life);
    text(ctx, p.text, (p.x - cam.x) * scale, (p.y - cam.y) * scale, 20, p.color, 'bold');
  }
  ctx.globalAlpha = 1;
  if (world.hint) {
    ctx.fillStyle = 'rgba(31,42,68,0.85)';
    const w = ctx.measureText(world.hint).width + 36;
    rr(ctx, 640 - w / 2, 756, w, 32, 8);
    ctx.fill();
    text(ctx, world.hint, 640, 773, 16, '#ffffff', 'bold');
  }
  if (world.mode === 'title') drawTitle(ctx, world);
  if (world.mode === 'over') drawGameOver(ctx, world);
}
