// The HUD: health and money, the wanted stars, the job objective, the speed,
// the minimap, the toasts and the contextual hints. Everything here is drawn in
// screen space, on top of the world, in one place so the screens stay readable.

import { FONT, PALETTE, PARK, VIEW, WORLD } from './config.js';

const MAP_W = 208;
const MAP_H = 156;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
}

/** A five-pointed star as a path — never a text glyph, so the wanted level
 *  reads the same in every font environment (★ is missing from some). */
function drawStar(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (filled) ctx.fill();
  else ctx.stroke();
}

function drawMinimap(ctx, game, x, y) {
  const sx = MAP_W / WORLD.width;
  const sy = MAP_H / WORLD.height;
  panel(ctx, x - 6, y - 6, MAP_W + 12, MAP_H + 12);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, MAP_W, MAP_H);
  ctx.clip();
  // Ground, water and the park.
  ctx.fillStyle = '#5d8a4a';
  ctx.fillRect(x, y, MAP_W, MAP_H);
  ctx.fillStyle = PALETTE.minimapWater;
  ctx.fillRect(x, y + 2360 * sy, MAP_W, MAP_H - 2360 * sy);
  ctx.fillRect(x + 3080 * sx, y, MAP_W - 3080 * sx, MAP_H);
  ctx.fillStyle = PALETTE.minimapPark;
  ctx.fillRect(x + PARK.x * sx, y + PARK.y * sy, PARK.width * sx, PARK.height * sy);
  // Roads.
  ctx.fillStyle = PALETTE.minimapRoad;
  for (const rx of game.roadsX) ctx.fillRect(x + (rx - 60) * sx, y, 120 * sx, MAP_H);
  for (const ry of game.roadsY) ctx.fillRect(x, y + (ry - 60) * sy, MAP_W, 120 * sy);
  const dot = (px, py, color, r) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + px * sx, y + py * sy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  // Mission marker, pulsing.
  const mark = game.missionMarker;
  if (mark) {
    const pulse = 3 + Math.sin(game.elapsed * 5) * 1.5;
    dot(mark.x, mark.y, '#f2c531', pulse + 2);
    ctx.strokeStyle = '#f2c531';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + mark.x * sx, y + mark.y * sy, pulse + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const car of game.trafficCars) dot(car.x, car.y, '#c9c9c9', 2);
  for (const car of game.parkedCars) dot(car.x, car.y, '#9a9a9a', 1.5);
  for (const car of game.policeCars) dot(car.x, car.y, Math.floor(game.elapsed * 4) % 2 ? '#ff4444' : '#4488ff', 3);
  for (const enemy of game.enemies) dot(enemy.x, enemy.y, '#ff5544', 2.5);
  // The player, on top of everything.
  dot(game.playerX, game.playerY, '#ffffff', 3.5);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x + game.playerX * sx, y + game.playerY * sy, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('SOLMARA', x, y - 12);
}

export function drawHUD(ctx, game) {
  const w = VIEW.width;
  const h = VIEW.height;
  ctx.textBaseline = 'alphabetic';

  // Top-left: health and money.
  panel(ctx, 16, 14, 250, 64);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('ROOK VEGA', 28, 36);
  ctx.fillStyle = '#222';
  roundRect(ctx, 28, 44, 150, 12, 6);
  ctx.fill();
  const healthFrac = Math.max(0, game.health / 100);
  ctx.fillStyle = healthFrac > 0.5 ? '#5ec95e' : healthFrac > 0.25 ? '#f2c531' : '#e5534b';
  roundRect(ctx, 28, 44, 150 * healthFrac, 12, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudGold;
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText(`$${game.money.toLocaleString('en-US')}`, 188, 57);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `12px ${FONT}`;
  ctx.fillText(`JOBS ${game.jobDone}/5`, 28, 72 - 4);

  // Top-right: the wanted stars, drawn as paths (see drawStar above).
  panel(ctx, w - 216, 14, 200, 64);
  for (let i = 0; i < 5; i += 1) {
    const cx = w - 196 + i * 34;
    const cy = 36;
    if (i < game.stars) {
      ctx.fillStyle = '#ff5544';
      drawStar(ctx, cx, cy, 12, true);
    } else {
      ctx.strokeStyle = '#8b93a3';
      ctx.lineWidth = 2;
      drawStar(ctx, cx, cy, 12, false);
    }
  }
  if (game.stars > 0) {
    ctx.fillStyle = '#ff5544';
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('WANTED', w - 204, 68);
  }

  // Top-centre: the current objective.
  if (game.objective) {
    ctx.font = `bold 15px ${FONT}`;
    const tw = ctx.measureText(game.objective).width;
    panel(ctx, (w - tw) / 2 - 16, 14, tw + 32, 34);
    ctx.fillStyle = PALETTE.hudText;
    ctx.textAlign = 'center';
    ctx.fillText(game.objective, w / 2, 37);
  }

  // Bottom-left: speed, and what the player is holding.
  if (game.inCar) {
    panel(ctx, 16, h - 60, 190, 46);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `bold 22px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(Math.abs(game.speed) * 0.14)} mph`, 28, h - 34);
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = '#c9c9c9';
    ctx.fillText(game.carName || '', 28, h - 18);
  } else {
    panel(ctx, 16, h - 60, 190, 46);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(game.weapon === 'fists' ? 'FISTS' : game.weapon.toUpperCase(), 28, h - 34);
    if (game.weapon === 'pistol') {
      ctx.font = `12px ${FONT}`;
      ctx.fillStyle = '#c9c9c9';
      ctx.fillText(`${game.ammo} bullets — J / click to shoot`, 28, h - 18);
    }
  }

  // Bottom-right: the minimap.
  drawMinimap(ctx, game, w - MAP_W - 16, h - MAP_H - 16);

  // Contextual hint, bottom-centre.
  if (game.hint) {
    ctx.font = `bold 15px ${FONT}`;
    const tw = ctx.measureText(game.hint).width;
    panel(ctx, (w - tw) / 2 - 14, h - 40, tw + 28, 30);
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    ctx.fillText(game.hint, w / 2, h - 19);
  }

  // Toasts, under the objective.
  ctx.textAlign = 'center';
  game.toasts.forEach((toast, i) => {
    const alpha = Math.max(0, Math.min(1, toast.life / 1.2));
    ctx.globalAlpha = alpha;
    ctx.font = `bold 16px ${FONT}`;
    const tw = ctx.measureText(toast.text).width;
    panel(ctx, (w - tw) / 2 - 14, 60 + i * 34, tw + 28, 28);
    ctx.fillStyle = toast.good ? '#8be28b' : '#ffb3a7';
    ctx.fillText(toast.text, w / 2, 60 + i * 34 + 20);
    ctx.globalAlpha = 1;
  });

  // The mission-complete banner.
  if (game.banner) {
    const alpha = Math.max(0, Math.min(1, game.banner.life));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(12, 16, 24, 0.78)';
    ctx.fillRect(0, h / 2 - 56, w, 112);
    ctx.fillStyle = PALETTE.hudGold;
    ctx.font = `bold 40px ${FONT}`;
    ctx.fillText(game.banner.title, w / 2, h / 2 - 6);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `18px ${FONT}`;
    ctx.fillText(game.banner.sub, w / 2, h / 2 + 28);
    ctx.globalAlpha = 1;
  }
}
