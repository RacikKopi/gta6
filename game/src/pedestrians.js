// Pedestrians: Solmara's people, walking the sidewalks. They stroll, turn at
// intersections, and run when something violent happens near them — a gunshot,
// a speeding car, a punch. Run one down and the city notices.

import { PALETTE, ROADS_X, ROADS_Y, ROAD_WIDTH } from './config.js';
import { chance, pick, range } from './random.js';

export function createPedestrians(world, random, count) {
  const peds = [];
  for (let i = 0; i < count; i += 1) {
    const spot = world.randomSidewalkPoint();
    peds.push({
      x: spot.x,
      y: spot.y,
      angle: spot.angle,
      speed: range(random, 45, 75),
      shirt: pick(random, PALETTE.pedShirt),
      state: 'walk',
      stateTimer: 0,
      fleeX: 0,
      fleeY: 0,
      downTimer: 0,
      scared: 0,
    });
  }

  function turnAtIntersection(ped) {
    // At a crossing, sometimes step onto the other road's sidewalk.
    for (const ry of ROADS_Y) {
      if (Math.abs(ped.y - ry) < 70 && chance(random, 0.3)) {
        ped.angle = chance(random, 0.5) ? 0 : Math.PI;
        return;
      }
    }
    for (const rx of ROADS_X) {
      if (Math.abs(ped.x - rx) < 70 && chance(random, 0.3)) {
        ped.angle = chance(random, 0.5) ? -Math.PI / 2 : Math.PI / 2;
        return;
      }
    }
  }

  function update(dt, threats) {
    for (const ped of peds) {
      if (ped.state === 'down') {
        ped.downTimer -= dt;
        if (ped.downTimer <= 0) {
          ped.state = 'flee';
          ped.stateTimer = 2.5;
        }
        continue;
      }
      // A threat nearby (gunshot, punch, fast car) sends them running away from it.
      let nearest = null;
      let nearestDist = 150;
      for (const threat of threats) {
        const dist = Math.hypot(threat.x - ped.x, threat.y - ped.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = threat;
        }
      }
      if (nearest) {
        ped.state = 'flee';
        ped.stateTimer = 2;
        ped.fleeX = nearest.x;
        ped.fleeY = nearest.y;
      }
      if (ped.state === 'flee') {
        ped.stateTimer -= dt;
        const away = Math.atan2(ped.y - ped.fleeY, ped.x - ped.fleeX);
        ped.angle = away;
        const speed = 235;
        const nx = ped.x + Math.cos(away) * speed * dt;
        const ny = ped.y + Math.sin(away) * speed * dt;
        const fixed = world.collide(nx, ny, 12);
        ped.x = fixed.x;
        ped.y = fixed.y;
        if (ped.stateTimer <= 0) ped.state = 'walk';
        continue;
      }
      // Strolling: keep to the sidewalk line, turn at intersections, reverse at the edge.
      const nx = ped.x + Math.cos(ped.angle) * ped.speed * dt;
      const ny = ped.y + Math.sin(ped.angle) * ped.speed * dt;
      if (nx < 90 || nx > 3120 || ny < 90 || ny > 2280) {
        ped.angle += Math.PI;
      } else {
        ped.x = nx;
        ped.y = ny;
      }
      turnAtIntersection(ped);
    }
  }

  /** Knock a pedestrian down (a car hit or a punch): they stay down, then flee. */
  function knockDown(ped) {
    if (ped.state === 'down') return;
    ped.state = 'down';
    ped.downTimer = 3;
  }

  return { peds, update, knockDown };
}
