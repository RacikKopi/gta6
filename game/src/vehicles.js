// Cars: one arcade driving model for the player's car, the traffic and the
// police, plus the parked cars waiting to be stolen. A car is a heading and a
// speed; steering bites harder the faster it goes, and the handbrake slides it.
// Collisions are circles, so a chase never wedges a car into a building corner.

import { CAR, CAR_TYPES } from './config.js';

export function createCar(type, x, y, angle, id) {
  const spec = CAR_TYPES[type] || CAR_TYPES.dolphin;
  return {
    id,
    type,
    name: spec.name,
    x, y,
    angle,
    speed: 0,
    topSpeed: spec.topSpeed,
    accel: spec.accel,
    color: spec.color,
    length: CAR.length,
    width: CAR.width,
    radius: CAR.radius,
    stolen: false,
    parked: false,
    smoke: 0,
  };
}

/** Arcade driving: throttle -1..1, steer -1..1, handbrake slides the tail out. */
export function driveCar(car, dt, throttle, steer, handbrake, world) {
  const accel = throttle > 0 ? car.accel : CAR.brake;
  car.speed += throttle * accel * dt;
  if (throttle === 0) {
    const drag = Math.exp(-CAR.drag * dt);
    car.speed *= drag;
    if (Math.abs(car.speed) < 4) car.speed = 0;
  }
  if (car.speed > car.topSpeed) car.speed = car.topSpeed;
  if (car.speed < -CAR.reverseMax) car.speed = -CAR.reverseMax;
  const grip = handbrake ? CAR.grip * 0.35 : CAR.grip;
  const turn = steer * CAR.steer * Math.min(1, Math.abs(car.speed) / 160) * (car.speed < 0 ? -1 : 1);
  car.angle += turn * dt * (handbrake ? 1.6 : 1);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const fixed = world.collide(nx, ny, car.radius);
  if (fixed.x !== nx || fixed.y !== ny) {
    // A wall stops the car dead and throws a little smoke.
    car.speed *= 0.35;
    car.smoke = 0.5;
  }
  car.x = fixed.x;
  car.y = fixed.y;
  if (car.smoke > 0) car.smoke -= dt;
  void grip;
}

/** Two cars bumping: push them apart and trade a little speed. */
export function collideCars(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const min = a.radius + b.radius - 6;
  if (dist >= min || dist === 0) return 0;
  const push = (min - dist) / 2;
  const ux = dx / dist;
  const uy = dy / dist;
  a.x -= ux * push;
  a.y -= uy * push;
  b.x += ux * push;
  b.y += uy * push;
  const impact = Math.abs(a.speed - b.speed);
  a.speed *= 0.82;
  b.speed *= 0.82;
  return impact;
}

/** The nearest car the player could enter, within CAR.enterRange. */
export function nearestEnterableCar(x, y, cars, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (const car of cars) {
    const dist = Math.hypot(car.x - x, car.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = car;
    }
  }
  return best;
}
