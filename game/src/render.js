// The renderer: a camera that follows the player across Solmara, the city
// itself (roads, buildings, beach, marina, park), every car and person in it,
// the effects, and the screens. The view is always 1280x720 world units,
// scaled to whatever window the browser gives it.

import { FONT, PALETTE, PARK, ROADS_X, ROADS_Y, ROAD_WIDTH, VIEW, WORLD } from './config.js';
import { drawHUD } from './hud.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;
export const SCREEN_STORY = 4;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  // The game's elapsed time, kept here so the police light bar flashes on the
  // simulation clock (deterministic) instead of the wall clock.
  let elapsedNow = 0;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
    offsetX = (canvas.width - VIEW.width * scale) / 2;
    offsetY = (canvas.height - VIEW.height * scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  function camera(game) {
    const focus = game.cameraFocus;
    let cx = focus.x - VIEW.width / 2;
    let cy = focus.y - VIEW.height / 2;
    cx = Math.max(0, Math.min(WORLD.width - VIEW.width, cx));
    cy = Math.max(0, Math.min(WORLD.height - VIEW.height, cy));
    if (WORLD.width <= VIEW.width) cx = (WORLD.width - VIEW.width) / 2;
    if (WORLD.height <= VIEW.height) cy = (WORLD.height - VIEW.height) / 2;
    return { x: cx, y: cy };
  }

  function drawGround(cam) {
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Beach and sea along the south edge.
    const sandY = 2300 - cam.y;
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(0, sandY, VIEW.width, VIEW.height - sandY);
    const waterY = 2360 - cam.y;
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(0, waterY, VIEW.width, VIEW.height - waterY);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const y = waterY + 12 + i * 10;
      ctx.beginPath();
      for (let x = 0; x <= VIEW.width; x += 40) {
        ctx.lineTo(x, y + Math.sin((x + i * 90) * 0.02) * 3);
      }
      ctx.stroke();
    }
    // The marina water on the east edge.
    const marinaX = 3080 - cam.x;
    ctx.fillStyle = PALETTE.waterDeep;
    ctx.fillRect(marinaX, 0, VIEW.width - marinaX, VIEW.height);
  }

  function drawRoads(cam) {
    // Sidewalks first (a pale band either side of every road), then asphalt.
    ctx.fillStyle = PALETTE.sidewalk;
    for (const rx of ROADS_X) ctx.fillRect(rx - ROAD_WIDTH / 2 - 26 - cam.x, 0, ROAD_WIDTH + 52, VIEW.height);
    for (const ry of ROADS_Y) ctx.fillRect(0, ry - ROAD_WIDTH / 2 - 26 - cam.y, VIEW.width, ROAD_WIDTH + 52);
    ctx.fillStyle = PALETTE.road;
    for (const rx of ROADS_X) ctx.fillRect(rx - ROAD_WIDTH / 2 - cam.x, 0, ROAD_WIDTH, VIEW.height);
    for (const ry of ROADS_Y) ctx.fillRect(0, ry - ROAD_WIDTH / 2 - cam.y, VIEW.width, ROAD_WIDTH);
    // Centre dashes.
    ctx.fillStyle = PALETTE.lane;
    for (const rx of ROADS_X) {
      for (let y = 0; y < WORLD.height; y += 64) {
        if (hash2(rx, y) < 0.5) ctx.fillRect(rx - 3 - cam.x, y - cam.y, 6, 30);
      }
    }
    for (const ry of ROADS_Y) {
      for (let x = 0; x < WORLD.width; x += 64) {
        if (hash2(x, ry) < 0.5) ctx.fillRect(x - cam.x, ry - 3 - cam.y, 30, 6);
      }
    }
  }

  function drawPark(world, cam) {
    const p = PARK;
    ctx.fillStyle = PALETTE.parkGrass;
    ctx.fillRect(p.x - cam.x, p.y - cam.y, p.width, p.height);
    // The pond.
    ctx.fillStyle = PALETTE.water;
    ctx.beginPath();
    ctx.ellipse(p.x + p.width * 0.68 - cam.x, p.y + p.height * 0.62 - cam.y, 74, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.width * 0.68 - cam.x, p.y + p.height * 0.62 - cam.y, 52, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const tree of world.trees) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.arc(tree.x - cam.x + 4, tree.y - cam.y + 5, tree.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.tree;
      ctx.beginPath();
      ctx.arc(tree.x - cam.x, tree.y - cam.y, tree.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.treeDark;
      ctx.beginPath();
      ctx.arc(tree.x - cam.x - 5, tree.y - cam.y - 5, tree.r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBuildings(world, cam) {
    for (const b of world.buildings) {
      const x = b.x - cam.x;
      const y = b.y - cam.y;
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(x + 8, y + 10, b.width, b.height);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = b.shade;
      ctx.fillRect(x, y, b.width, b.height);
      ctx.globalAlpha = 1;
      if (b.roof === 'trim') {
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 5, y + 5, b.width - 10, b.height - 10);
      }
      // Windows, stable per building.
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      const cols = Math.max(1, Math.floor(b.width / 34));
      const rows = Math.max(1, Math.floor(b.height / 34));
      for (let i = 0; i < cols; i += 1) {
        for (let j = 0; j < rows; j += 1) {
          if (hash2(b.x + i * 34, b.y + j * 34) < 0.55) {
            ctx.fillRect(x + 12 + i * 34, y + 12 + j * 34, 14, 10);
          }
        }
      }
    }
  }

  function drawProps(world, cam) {
    for (const palm of world.palms) {
      const x = palm.x - cam.x;
      const y = palm.y - cam.y;
      ctx.strokeStyle = '#8a6b46';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 3, y - 26);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.palm;
      ctx.lineWidth = 4;
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        ctx.beginPath();
        ctx.moveTo(x + 3, y - 26);
        ctx.lineTo(x + 3 + Math.cos(a) * 18, y - 26 + Math.sin(a) * 10);
        ctx.stroke();
      }
    }
    for (const lamp of world.lamps) {
      const x = lamp.x - cam.x;
      const y = lamp.y - cam.y;
      ctx.strokeStyle = '#5a5f6a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 18);
      ctx.stroke();
      ctx.fillStyle = '#f2e6a0';
      ctx.beginPath();
      ctx.arc(x, y - 20, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBeacon(game, cam) {
    const mark = game.missionMarker;
    if (!mark) return;
    const x = mark.x - cam.x;
    const y = mark.y - cam.y;
    const pulse = 1 + Math.sin(game.elapsed * 4) * 0.15;
    // Off-screen: an arrow on the view's edge points the way.
    if (x < 40 || x > VIEW.width - 40 || y < 40 || y > VIEW.height - 40) {
      const cx = VIEW.width / 2;
      const cy = VIEW.height / 2;
      const angle = Math.atan2(mark.y - game.cameraFocus.y, mark.x - game.cameraFocus.x);
      const ax = cx + Math.cos(angle) * 300;
      const ay = cy + Math.sin(angle) * 220;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(angle);
      ctx.fillStyle = '#f2c531';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -12);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.strokeStyle = '#f2c531';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 34 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(242,197,49,0.25)';
    ctx.beginPath();
    ctx.arc(x, y, 34 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2c531';
    ctx.beginPath();
    ctx.moveTo(x, y - 26);
    ctx.lineTo(x - 9, y - 8);
    ctx.lineTo(x + 9, y - 8);
    ctx.closePath();
    ctx.fill();
  }

  function drawPickup(pickup, cam) {
    const x = pickup.x - cam.x;
    const y = pickup.y - cam.y + Math.sin(pickup.bob) * 2;
    ctx.save();
    ctx.translate(x, y);
    if (pickup.kind === 'health') {
      ctx.fillStyle = '#f5f1e6';
      roundRect(ctx, -11, -11, 22, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#e5534b';
      ctx.fillRect(-2.5, -8, 5, 16);
      ctx.fillRect(-8, -2.5, 16, 5);
    } else if (pickup.kind === 'bat') {
      ctx.rotate(0.6);
      ctx.fillStyle = '#8a6b46';
      roundRect(ctx, -3, -16, 6, 32, 3);
      ctx.fill();
    } else if (pickup.kind === 'pistol') {
      ctx.fillStyle = '#22262e';
      ctx.fillRect(-10, -4, 20, 6);
      ctx.fillRect(4, -4, 5, 12);
    } else {
      ctx.fillStyle = '#7dc383';
      roundRect(ctx, -11, -7, 22, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#2f7d3a';
      ctx.font = 'bold 11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 4);
    }
    ctx.restore();
  }

  function drawCarShape(car, cam, isPlayer) {
    const x = car.x - cam.x;
    const y = car.y - cam.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(car.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    roundRect(ctx, -car.length / 2 + 4, -car.width / 2 + 5, car.length, car.width, 8);
    ctx.fill();
    ctx.fillStyle = car.color;
    roundRect(ctx, -car.length / 2, -car.width / 2, car.length, car.width, 8);
    ctx.fill();
    if (car.type === 'police') {
      ctx.fillStyle = '#f5f1e6';
      ctx.fillRect(-6, -car.width / 2, 12, car.width);
      const flashing = Math.floor(elapsedNow * 3.6) % 2 === 0;
      ctx.fillStyle = flashing ? '#ff4444' : '#4488ff';
      roundRect(ctx, -8, -car.width / 2 - 2, 16, 7, 3);
      ctx.fill();
      ctx.fillStyle = flashing ? '#4488ff' : '#ff4444';
      roundRect(ctx, -8, car.width / 2 - 5, 16, 7, 3);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(20,28,38,0.85)';
    roundRect(ctx, -8, -car.width / 2 + 5, 18, car.width - 10, 4);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(car.length / 2 - 3, -car.width / 2 + 7, 3, 0, Math.PI * 2);
    ctx.arc(car.length / 2 - 3, car.width / 2 - 7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1f24';
    ctx.fillRect(-car.length / 2 + 6, -car.width / 2 - 3, 10, 5);
    ctx.fillRect(-car.length / 2 + 6, car.width / 2 - 2, 10, 5);
    ctx.fillRect(car.length / 2 - 16, -car.width / 2 - 3, 10, 5);
    ctx.fillRect(car.length / 2 - 16, car.width / 2 - 2, 10, 5);
    if (isPlayer) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      roundRect(ctx, -car.length / 2 - 3, -car.width / 2 - 3, car.length + 6, car.width + 6, 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPerson(x, y, angle, shirt, cam, down) {
    const px = x - cam.x;
    const py = y - cam.y;
    ctx.save();
    ctx.translate(px, py);
    if (down) {
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 4, Math.sin(angle) * 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawScreens(game, screen) {
    const w = VIEW.width;
    const h = VIEW.height;
    ctx.textAlign = 'center';
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(10, 14, 22, 0.82)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.hudGold;
      ctx.font = 'bold 92px ' + FONT;
      ctx.fillText('SOLMARA', w / 2, 168);
      ctx.fillStyle = PALETTE.hudText;
      ctx.font = '22px ' + FONT;
      ctx.fillText('A sun-soaked open-world crime story', w / 2, 208);
      ctx.font = '16px ' + FONT;
      ctx.fillStyle = '#c9c9c9';
      ctx.fillText('Rook Vega owes $5,000 to the Harbor Kings. Five jobs. One city. No way out but through.', w / 2, 246);
      ctx.fillText('Drive. Steal. Evade. Fight. Pay the debt.', w / 2, 272);
      ctx.fillStyle = PALETTE.hudGold;
      ctx.font = 'bold 15px ' + FONT;
      ctx.fillText('OPEN WORLD  ·  5 STORY JOBS  ·  WANTED 1-5 STARS  ·  TRAFFIC & POLICE  ·  HUD + MINIMAP  ·  SAVE', w / 2, 312);
      ctx.fillStyle = PALETTE.hudText;
      ctx.font = '15px ' + FONT;
      ctx.fillText('WASD / Arrows — move & drive      E — enter / steal a car      F — interact', w / 2, 372);
      ctx.fillText('SPACE — punch      J / Click — shoot      SHIFT — run      P — pause      M — mute', w / 2, 398);
      if (game.hasSave) {
        ctx.fillStyle = '#8be28b';
        ctx.font = 'bold 20px ' + FONT;
        ctx.fillText('SPACE — Continue your story      R — Start fresh', w / 2, 470);
      }
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 22px ' + FONT;
      ctx.fillText(game.hasSave ? 'Press SPACE to continue' : 'Press SPACE to start', w / 2, 512);
      ctx.fillStyle = '#8b93a3';
      ctx.font = '13px ' + FONT;
      ctx.fillText(`Jobs done: ${game.jobDone}/5   •   Best cash: $${game.bestCash.toLocaleString('en-US')}`, w / 2, 560);
    } else if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(10, 14, 22, 0.72)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.hudText;
      ctx.font = 'bold 56px ' + FONT;
      ctx.fillText('PAUSED', w / 2, 300);
      ctx.font = '17px ' + FONT;
      ctx.fillStyle = '#c9c9c9';
      ctx.fillText('P — Resume      R — Restart the day      M — Mute', w / 2, 350);
    } else if (screen === SCREEN_OVER) {
      ctx.fillStyle = 'rgba(10, 14, 22, 0.78)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = game.overKind === 'busted' ? '#4fc3f7' : '#e5534b';
      ctx.font = 'bold 72px ' + FONT;
      ctx.fillText(game.overKind === 'busted' ? 'BUSTED' : 'WASTED', w / 2, 320);
      ctx.fillStyle = PALETTE.hudText;
      ctx.font = '18px ' + FONT;
      ctx.fillText(game.overKind === 'busted'
        ? 'The Solmara PD took you in. They kept a cut of your cash.'
        : 'Rook went down. The city keeps moving without you.', w / 2, 366);
      ctx.font = '16px ' + FONT;
      ctx.fillStyle = '#c9c9c9';
      ctx.fillText(`Cash: $${game.money.toLocaleString('en-US')}   •   Jobs done: ${game.jobDone}/5`, w / 2, 404);
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 20px ' + FONT;
      ctx.fillText('Press SPACE to get back out there', w / 2, 462);
    } else if (screen === SCREEN_STORY) {
      ctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.hudGold;
      ctx.font = 'bold 64px ' + FONT;
      ctx.fillText('DEBT PAID', w / 2, 280);
      ctx.fillStyle = PALETTE.hudText;
      ctx.font = '20px ' + FONT;
      ctx.fillText('Rook delivered the van, Dario got his money, and Solmara is yours now.', w / 2, 330);
      ctx.fillText('Free roam: keep driving, keep the city. The story is done — the fun is not.', w / 2, 360);
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 20px ' + FONT;
      ctx.fillText('Press SPACE to keep playing', w / 2, 430);
    }
  }

  function draw(game, screen) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0c1018';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    elapsedNow = game.elapsed || 0;
    const cam = camera(game);
    const shake = game.shake || 0;
    const shx = shake > 0 ? Math.sin(game.elapsed * 61) * shake : 0;
    const shy = shake > 0 ? Math.cos(game.elapsed * 53) * shake : 0;
    ctx.setTransform(scale, 0, 0, scale, offsetX + shx * scale, offsetY + shy * scale);
    const viewCam = { x: cam.x, y: cam.y };
    drawGround(viewCam);
    drawRoads(viewCam);
    drawPark(game.world, viewCam);
    drawBuildings(game.world, viewCam);
    drawProps(game.world, viewCam);
    drawBeacon(game, viewCam);
    for (const skid of game.skids) {
      ctx.strokeStyle = `rgba(20,20,24,${Math.max(0, skid.life * 0.5)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(skid.x1 - viewCam.x, skid.y1 - viewCam.y);
      ctx.lineTo(skid.x2 - viewCam.x, skid.y2 - viewCam.y);
      ctx.stroke();
    }
    for (const pickup of game.pickups) drawPickup(pickup, viewCam);
    for (const ped of game.peds) drawPerson(ped.x, ped.y, ped.angle, ped.shirt, viewCam, ped.state === 'down');
    for (const enemy of game.enemies) {
      // The Vipers wear purple, so they never read as the player (red jacket).
      drawPerson(enemy.x, enemy.y, enemy.angle, enemy.weapon === 'bat' ? '#8a6b46' : '#9b59b6', viewCam, enemy.state === 'down');
    }
    for (const cop of game.cops) drawPerson(cop.x, cop.y, cop.angle, '#1c2733', viewCam, false);
    for (const car of game.parkedCars) drawCarShape(car, viewCam, false);
    for (const car of game.trafficCars) drawCarShape(car, viewCam, false);
    for (const car of game.policeCars) drawCarShape(car, viewCam, false);
    if (game.playerCar) drawCarShape(game.playerCar, viewCam, true);
    if (!game.playerCar) {
      const p = game.player;
      drawPerson(p.x, p.y, p.angle, PALETTE.playerJacket, viewCam, false);
      if (game.punchFlash > 0) {
        ctx.strokeStyle = `rgba(255,255,255,${game.punchFlash})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x - viewCam.x, p.y - viewCam.y, 34, p.angle - 0.9, p.angle + 0.9);
        ctx.stroke();
      }
    }
    for (const bullet of game.bullets) {
      ctx.strokeStyle = '#ffe9a8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bullet.x - bullet.vx * 0.02 - viewCam.x, bullet.y - bullet.vy * 0.02 - viewCam.y);
      ctx.lineTo(bullet.x - viewCam.x, bullet.y - viewCam.y);
      ctx.stroke();
    }
    for (const particle of game.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x - viewCam.x, particle.y - viewCam.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHUD(ctx, game.hud);
    drawScreens(game, screen);
  }

  return { draw, resize };
}
