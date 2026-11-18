// The law in Solmara: a wanted level of 0 to 5 stars, police cars that chase
// and ram, and foot cops who run the player down. Commit a crime and the stars
// climb; stay clean and out of sight and they fall away one by one.

import { POLICE, WANTED } from './config.js';
import { createCar, driveCar, collideCars } from './vehicles.js';

export function createPolice(world, random) {
  const state = {
    stars: 0,
    crimeTimer: 0,
    decayTimer: 0,
    policeCars: [],
    cops: [],
    bustTimer: 0,
  };

  function targetCarCount() {
    return Math.min(state.stars, 5);
  }

  function spawnPoliceCar(playerX, playerY) {
    // Appear on a road a little way off, so the chase arrives rather than pops in.
    let spot = world.randomRoadPoint();
    let tries = 0;
    while (Math.hypot(spot.x - playerX, spot.y - playerY) < POLICE.spawnDistance && tries < 12) {
      spot = world.randomRoadPoint();
      tries += 1;
    }
    const car = createCar('police', spot.x, spot.y, spot.angle, `police-${Math.floor(random() * 1e9)}`);
    state.policeCars.push(car);
    return car;
  }

  function spawnCop(x, y) {
    state.cops.push({ x, y, angle: 0, touchTimer: 0, punchTimer: 0 });
  }

  /** Place a pursuit car at a chosen spot (the chase screenshot stages its own). */
  function spawnChaseCar(x, y, angle) {
    const car = createCar('police', x, y, angle, `police-${Math.floor(random() * 1e9)}`);
    car.speed = 430;
    state.policeCars.push(car);
    return car;
  }

  /** A crime was committed: raise the stars and start the decay clock over. */
  function addStars(count) {
    const before = state.stars;
    state.stars = Math.min(WANTED.maxStars, state.stars + count);
    state.crimeTimer = 0;
    state.decayTimer = 0;
    return state.stars > before;
  }

  function clearStars() {
    state.stars = 0;
    state.policeCars = [];
    state.cops = [];
    state.bustTimer = 0;
  }

  function angleDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  /**
   * One step. `target` is {x, y, inCar, car, speed} for the player.
   * Returns { busted, damageToPlayer, damageToCar, sirenNear }.
   */
  function update(dt, target, allCars) {
    const out = { busted: false, damageToPlayer: 0, damageToCar: 0, sirenNear: false };
    state.crimeTimer += dt;

    // Decay: stay clean and unseen and the heat cools off, one star at a time.
    if (state.stars > 0 && state.crimeTimer > WANTED.decayDelay) {
      state.decayTimer += dt;
      const interval = target.inHideout ? WANTED.hideoutDecayInterval : WANTED.decayInterval;
      if (state.decayTimer >= interval) {
        state.stars -= 1;
        state.decayTimer = 0;
        if (state.stars === 0) clearStars();
      }
    }

    // Keep the pursuit at the strength the stars call for.
    while (state.policeCars.length < targetCarCount()) spawnPoliceCar(target.x, target.y);
    while (state.policeCars.length > targetCarCount()) state.policeCars.pop();

    let nearestPolice = Infinity;
    for (const car of state.policeCars) {
      const dist = Math.hypot(car.x - target.x, car.y - target.y);
      nearestPolice = Math.min(nearestPolice, dist);
      const desired = Math.atan2(target.y - car.y, target.x - car.x);
      const steer = Math.max(-1, Math.min(1, angleDiff(car.angle, desired) * 2.4));
      driveCar(car, dt, 1, steer, false, world);
      // A police car that reaches the player on foot stops and sends a cop out.
      if (!target.inCar && dist < 110 && state.cops.length < 2) {
        spawnCop(car.x, car.y);
      }
      if (target.inCar && dist < car.radius + target.car.radius + 4) {
        out.damageToCar += POLICE.ramDamage * dt * 2;
        out.damageToPlayer += POLICE.ramDamage * dt;
      }
    }
    out.sirenNear = nearestPolice < 650;

    // Foot cops chase the player down; hold contact and the player is busted.
    for (let i = state.cops.length - 1; i >= 0; i -= 1) {
      const cop = state.cops[i];
      const dist = Math.hypot(target.x - cop.x, target.y - cop.y);
      if (dist > 900 || state.stars === 0) {
        state.cops.splice(i, 1);
        continue;
      }
      const desired = Math.atan2(target.y - cop.y, target.x - cop.x);
      cop.angle = desired;
      const nx = cop.x + Math.cos(desired) * POLICE.copSpeed * dt;
      const ny = cop.y + Math.sin(desired) * POLICE.copSpeed * dt;
      const fixed = world.collide(nx, ny, 12);
      cop.x = fixed.x;
      cop.y = fixed.y;
      if (dist < 30) {
        cop.touchTimer += dt;
        cop.punchTimer -= dt;
        if (cop.punchTimer <= 0) {
          out.damageToPlayer += POLICE.copDamage;
          cop.punchTimer = POLICE.copPunchCooldown;
        }
        if (cop.touchTimer >= WANTED.bustTouchSeconds) {
          out.busted = true;
          return out;
        }
      } else {
        cop.touchTimer = Math.max(0, cop.touchTimer - dt * 2);
      }
    }

    // A stopped player car with a police car glued to it is busted too.
    if (target.inCar && target.car && Math.abs(target.car.speed) < 12) {
      for (const car of state.policeCars) {
        const dist = Math.hypot(car.x - target.x, car.y - target.y);
        if (dist < car.radius + target.car.radius + 10) {
          state.bustTimer += dt;
          if (state.bustTimer >= 2) {
            out.busted = true;
            return out;
          }
        }
      }
    } else {
      state.bustTimer = 0;
    }

    // Police cars bump each other and the traffic apart.
    const cars = [...state.policeCars, ...allCars];
    for (let i = 0; i < cars.length; i += 1) {
      for (let j = i + 1; j < cars.length; j += 1) collideCars(cars[i], cars[j]);
    }
    return out;
  }

  return { state, addStars, clearStars, spawnChaseCar, update };
}
