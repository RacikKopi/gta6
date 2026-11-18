// Combat: fists, a bat, a pistol, and the Street Vipers who carry them.
// Bullets fly straight and die on walls; enemies chase, punch and drop cash;
// pickups (health, bat, pistol, cash) wait on the street to be collected.

import { COMBAT } from './config.js';
import { chance, pick, range } from './random.js';

const PICKUP_KINDS = ['health', 'bat', 'pistol', 'cash'];

export function createCombat(world, random) {
  const bullets = [];
  const pickups = [];
  const enemies = [];

  function spawnPickups(count) {
    for (let i = 0; i < count; i += 1) {
      const spot = world.randomSidewalkPoint();
      pickups.push({
        kind: pick(random, PICKUP_KINDS),
        x: spot.x,
        y: spot.y,
        amount: 0,
        bob: random() * Math.PI * 2,
      });
    }
    for (const pickup of pickups) {
      if (pickup.kind === 'health') pickup.amount = 40;
      else if (pickup.kind === 'pistol') pickup.amount = COMBAT.pistolAmmo;
      else if (pickup.kind === 'cash') pickup.amount = range(random, 25, 100) | 0;
    }
  }

  function spawnEnemy(x, y) {
    const enemy = {
      x, y,
      angle: 0,
      health: COMBAT.enemyHealth,
      state: 'chase',
      punchTimer: 0,
      downTimer: 0,
      weapon: chance(random, 0.4) ? 'bat' : 'fists',
    };
    enemies.push(enemy);
    return enemy;
  }

  function clearEnemies() {
    enemies.length = 0;
  }

  /** A punch arc (from the player or an enemy) against a list of bodies. */
  function punchHit(arc, damage, bodies) {
    const hits = [];
    for (const body of bodies) {
      if (body.health !== undefined && body.health <= 0) continue;
      if (body.state === 'down') continue;
      const dx = body.x - arc.x;
      const dy = body.y - arc.y;
      const dist = Math.hypot(dx, dy);
      if (dist > arc.range + 14) continue;
      const angleTo = Math.atan2(dy, dx);
      let diff = angleTo - arc.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > arc.arc) continue;
      body.health -= damage;
      // Knockback away from the puncher.
      const push = 26;
      const nx = body.x + (dx / (dist || 1)) * push;
      const ny = body.y + (dy / (dist || 1)) * push;
      const fixed = world.collide(nx, ny, 12);
      body.x = fixed.x;
      body.y = fixed.y;
      hits.push(body);
      if (body.health <= 0) body.state = 'down';
    }
    return hits;
  }

  function shoot(x, y, angle) {
    bullets.push({
      x: x + Math.cos(angle) * 30,
      y: y + Math.sin(angle) * 30,
      vx: Math.cos(angle) * COMBAT.bulletSpeed,
      vy: Math.sin(angle) * COMBAT.bulletSpeed,
      life: COMBAT.bulletRange / COMBAT.bulletSpeed,
    });
  }

  /**
   * One step for bullets and enemies. Returns { hits, kills, cashDropped }.
   * `player` is the player state; `onEnemyDown` runs for each defeated enemy.
   */
  function update(dt, player, onEnemyDown) {
    const out = { hits: 0, kills: 0, cashDropped: 0 };
    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const b = bullets[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      let dead = b.life <= 0 || world.hitsBuilding(b.x, b.y, 2) !== null;
      if (!dead) {
        for (const enemy of enemies) {
          if (enemy.state === 'down') continue;
          if (Math.hypot(enemy.x - b.x, enemy.y - b.y) < 18) {
            enemy.health -= COMBAT.pistolDamage;
            out.hits += 1;
            if (enemy.health <= 0) {
              enemy.state = 'down';
              out.kills += 1;
              dropCash(enemy.x, enemy.y);
              if (onEnemyDown) onEnemyDown(enemy);
            }
            dead = true;
            break;
          }
        }
      }
      if (dead) bullets.splice(i, 1);
    }

    for (const enemy of enemies) {
      if (enemy.state === 'down') {
        enemy.downTimer -= dt;
        continue;
      }
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist > 700) continue;
      const desired = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.angle = desired;
      if (dist > 30) {
        const nx = enemy.x + Math.cos(desired) * COMBAT.enemySpeed * dt;
        const ny = enemy.y + Math.sin(desired) * COMBAT.enemySpeed * dt;
        const fixed = world.collide(nx, ny, 12);
        enemy.x = fixed.x;
        enemy.y = fixed.y;
      } else {
        enemy.punchTimer -= dt;
        if (enemy.punchTimer <= 0) {
          const arc = { x: enemy.x, y: enemy.y, angle: desired, range: 46, arc: 1.1 };
          const hit = punchHit(arc, COMBAT.enemyDamage, [player]);
          if (hit.length > 0) enemy.punchTimer = 0.9;
        }
      }
    }
    return out;
  }

  function dropCash(x, y) {
    pickups.push({ kind: 'cash', x: x + range(random, -16, 16), y: y + range(random, -16, 16), amount: range(random, 40, 120) | 0, bob: 0 });
  }

  /** Collect pickups the player touches; returns the collected ones. */
  function collect(player) {
    const taken = [];
    for (let i = pickups.length - 1; i >= 0; i -= 1) {
      const pickup = pickups[i];
      if (Math.hypot(pickup.x - player.x, pickup.y - player.y) < 30) {
        taken.push(pickup);
        pickups.splice(i, 1);
      }
    }
    return taken;
  }

  return { bullets, pickups, enemies, spawnPickups, spawnEnemy, clearEnemies, punchHit, shoot, update, collect, dropCash };
}
