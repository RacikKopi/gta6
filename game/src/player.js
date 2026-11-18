// Rook Vega on foot: walking, running, facing, punching, health and money.
// The player is a circle; the world pushes it out of buildings and water.
// Driving lives in vehicles.js — this file only knows how to walk and fight.

import { PLAYER } from './config.js';

export function createPlayer(x, y) {
  const state = {
    x, y,
    vx: 0, vy: 0,
    angle: -Math.PI / 2,
    health: PLAYER.health,
    money: 0,
    weapon: 'fists',
    ammo: 0,
    punchCooldown: 0,
    invulnerable: 0,
    moving: false,
  };

  function update(dt, steer, running, world) {
    const speed = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const targetVx = steer.x * speed;
    const targetVy = steer.y * speed;
    const blend = Math.min(1, (PLAYER.accel / speed) * dt);
    state.vx += (targetVx - state.vx) * blend;
    state.vy += (targetVy - state.vy) * blend;
    if (Math.abs(state.vx) < 2) state.vx = 0;
    if (Math.abs(state.vy) < 2) state.vy = 0;
    const next = world.collide(state.x + state.vx * dt, state.y + state.vy * dt, PLAYER.radius);
    state.x = next.x;
    state.y = next.y;
    state.moving = state.vx !== 0 || state.vy !== 0;
    if (state.moving) state.angle = Math.atan2(state.vy, state.vx);
    if (state.punchCooldown > 0) state.punchCooldown -= dt;
    if (state.invulnerable > 0) state.invulnerable -= dt;
  }

  /** Punch (or swing the bat) in front of the player; returns the hit arc. */
  function punchArc() {
    const range = state.weapon === 'bat' ? 62 : PLAYER.punchRange;
    return { x: state.x, y: state.y, angle: state.angle, range, arc: PLAYER.punchArc };
  }

  function damage() {
    return state.weapon === 'bat' ? 32 : PLAYER.punchDamage;
  }

  function takeDamage(amount) {
    if (state.invulnerable > 0) return false;
    state.health = Math.max(0, state.health - amount);
    state.invulnerable = 0.5;
    return true;
  }

  function heal(amount) {
    state.health = Math.min(PLAYER.health, state.health + amount);
  }

  function addMoney(amount) {
    state.money = Math.max(0, state.money + amount);
  }

  function setWeapon(weapon, ammo) {
    state.weapon = weapon;
    state.ammo = ammo;
  }

  return { state, update, punchArc, damage, takeDamage, heal, addMoney, setWeapon };
}
