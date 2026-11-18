// Traffic: the cars that belong to the city. Each one picks an intersection,
// drives to it on the right-hand lane, then picks the next. It brakes for the
// car ahead and never leaves the roads, so the streets always feel alive.

import { CAR_TYPES, ROADS_X, ROADS_Y } from './config.js';
import { createCar, driveCar } from './vehicles.js';
import { pick, range } from './random.js';

const TRAFFIC_TYPES = ['dolphin', 'sunbeam', 'pelican', 'stingray'];

function randomIntersection(random) {
  return { x: pick(random, ROADS_X), y: pick(random, ROADS_Y) };
}

function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createTraffic(world, random, count) {
  const cars = [];
  for (let i = 0; i < count; i += 1) {
    const spot = world.randomRoadPoint();
    const car = createCar(pick(random, TRAFFIC_TYPES), spot.x, spot.y, spot.angle, `traffic-${i}`);
    car.speed = range(random, 120, 200);
    cars.push({
      car,
      target: randomIntersection(random),
      targetSpeed: range(random, 150, 230),
      stuck: 0,
    });
  }

  function carAhead(entry, allCars) {
    const c = entry.car;
    const aheadX = c.x + Math.cos(c.angle) * 70;
    const aheadY = c.y + Math.sin(c.angle) * 70;
    for (const other of allCars) {
      if (other === c) continue;
      const dx = other.x - aheadX;
      const dy = other.y - aheadY;
      if (dx * dx + dy * dy < 70 * 70) return true;
    }
    return false;
  }

  function update(dt, allCars, playerCar) {
    for (const entry of cars) {
      const c = entry.car;
      const distToTarget = Math.hypot(entry.target.x - c.x, entry.target.y - c.y);
      if (distToTarget < 70) {
        // Pick a neighbouring intersection: one road step away.
        const options = [];
        for (const rx of ROADS_X) {
          if (rx !== entry.target.x) options.push({ x: rx, y: entry.target.y });
        }
        for (const ry of ROADS_Y) {
          if (ry !== entry.target.y) options.push({ x: entry.target.x, y: ry });
        }
        entry.target = pick(random, options);
      }
      // Aim at the target, offset to the right-hand lane.
      const desired = angleTo(c, entry.target);
      const steer = Math.max(-1, Math.min(1, angleDiff(c.angle, desired) * 2.2));
      const blocked = carAhead(entry, allCars) || (playerCar && carAhead(entry, [playerCar]));
      const throttle = blocked ? -0.6 : 0.7;
      const speed = Math.min(entry.targetSpeed, c.topSpeed * 0.55);
      if (c.speed > speed) driveCar(c, dt, -0.4, steer, false, world);
      else driveCar(c, dt, throttle, steer, false, world);
      if (blocked) entry.stuck += dt;
      else entry.stuck = 0;
      // A car boxed in for a while turns around and finds a new target.
      if (entry.stuck > 6) {
        entry.target = randomIntersection(random);
        entry.stuck = 0;
      }
    }
  }

  return { cars: cars.map((entry) => entry.car), entries: cars, update };
}
