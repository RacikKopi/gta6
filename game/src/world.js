// Solmara itself: the road grid, the blocks and buildings, the beach and the
// marina, the park, the palms and lamps, and the named places the story uses.
// Generation reads only the seeded stream, so one seed always builds one city.
// Nothing here draws: it only describes the city and answers collision questions.

import {
  BEACH_TOP, CAR_TYPES, HIDEOUT, MARINA_LEFT, PALETTE, PARK,
  ROADS_X, ROADS_Y, ROAD_WIDTH, WATER_TOP, WORLD,
} from './config.js';
import { chance, int, pick, range } from './random.js';

/** Right-hand lanes: for a vertical road, northbound is the east lane. */
export function laneX(roadX, headingNorth) {
  return roadX + (headingNorth ? 30 : -30);
}
/** For a horizontal road, eastbound is the south lane. */
export function laneY(roadY, headingEast) {
  return roadY + (headingEast ? 30 : -30);
}

function circleHitsRect(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

export function createWorld(random) {
  const buildings = [];
  const palms = [];
  const lamps = [];
  const trees = [];
  const parked = [];

  // Blocks are the cells between roads. The park block stays green; the strip
  // below the beachfront road is sand, and the east strip is the marina.
  const blockXs = [0, ...ROADS_X, WORLD.width];
  const blockYs = [0, ...ROADS_Y, WORLD.height];
  for (let bx = 0; bx < blockXs.length - 1; bx += 1) {
    for (let by = 0; by < blockYs.length - 1; by += 1) {
      const x0 = blockXs[bx] + ROAD_WIDTH / 2 + 14;
      const x1 = blockXs[bx + 1] - ROAD_WIDTH / 2 - 14;
      const y0 = blockYs[by] + ROAD_WIDTH / 2 + 14;
      const y1 = blockYs[by + 1] - ROAD_WIDTH / 2 - 14;
      const width = x1 - x0;
      const height = y1 - y0;
      if (width < 120 || height < 120) continue;
      // The park block and the beach/marina strips hold no buildings.
      const isPark = x0 >= PARK.x - 20 && y0 >= PARK.y - 20 && x0 < PARK.x + PARK.width && y0 < PARK.y + PARK.height;
      if (isPark) continue;
      if (y0 >= BEACH_TOP - 140) continue;
      if (x0 >= MARINA_LEFT - 140) continue;
      const count = width > 300 && height > 300 ? int(random, 2, 3) : 1;
      for (let i = 0; i < count; i += 1) {
        const bw = range(random, 90, Math.min(190, width - 40));
        const bh = range(random, 80, Math.min(170, height - 40));
        const bx0 = range(random, x0, Math.max(x0 + 1, x1 - bw));
        const by0 = range(random, y0, Math.max(y0 + 1, y1 - bh));
        const rect = { x: bx0, y: by0, width: bw, height: bh };
        let overlaps = false;
        for (const other of buildings) {
          if (rect.x < other.x + other.width + 24 && rect.x + rect.width + 24 > other.x &&
              rect.y < other.y + other.height + 24 && rect.y + rect.height + 24 > other.y) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) continue;
        buildings.push({
          ...rect,
          color: pick(random, PALETTE.buildingRoof),
          roof: chance(random, 0.5) ? 'flat' : 'trim',
          shade: range(random, 0.85, 1.05),
        });
      }
    }
  }

  // Palms along the beachfront and the marina walk, a few on the park's edge.
  for (let x = 120; x < WORLD.width - 120; x += 130) {
    if (chance(random, 0.8)) palms.push({ x: x + range(random, -20, 20), y: BEACH_TOP - 46 + range(random, -8, 8) });
  }
  for (let y = 500; y < BEACH_TOP - 100; y += 260) {
    if (chance(random, 0.6)) palms.push({ x: MARINA_LEFT - 90 + range(random, -10, 10), y });
  }
  for (let i = 0; i < 14; i += 1) {
    trees.push({
      x: range(random, PARK.x + 30, PARK.x + PARK.width - 30),
      y: range(random, PARK.y + 30, PARK.y + PARK.height - 30),
      r: range(random, 16, 26),
    });
  }

  // Street lamps at the corners of every intersection.
  for (const rx of ROADS_X) {
    for (const ry of ROADS_Y) {
      lamps.push({ x: rx - ROAD_WIDTH / 2 - 8, y: ry - ROAD_WIDTH / 2 - 8 });
      lamps.push({ x: rx + ROAD_WIDTH / 2 + 8, y: ry + ROAD_WIDTH / 2 + 8 });
    }
  }

  // Parked cars along the roads, on the right side, clear of intersections.
  const carKeys = Object.keys(CAR_TYPES).filter((k) => k !== 'police');
  for (let i = 0; i < 34; i += 1) {
    const vertical = chance(random, 0.5);
    let x;
    let y;
    let angle;
    if (vertical) {
      const road = pick(random, ROADS_X);
      const north = chance(random, 0.5);
      x = laneX(road, north);
      y = range(random, 200, WORLD.height - 300);
      angle = north ? -Math.PI / 2 : Math.PI / 2;
    } else {
      const road = pick(random, ROADS_Y);
      const east = chance(random, 0.5);
      y = laneY(road, east);
      x = range(random, 200, WORLD.width - 300);
      angle = east ? 0 : Math.PI;
    }
    // Keep clear of intersections: a car parked on a vertical road must be
    // clear of the horizontal roads (and vice versa). The old check compared
    // the car against its own road and rejected every single parked car.
    let nearJunction = false;
    if (vertical) {
      for (const ry of ROADS_Y) if (Math.abs(y - ry) < 110) nearJunction = true;
    } else {
      for (const rx of ROADS_X) if (Math.abs(x - rx) < 110) nearJunction = true;
    }
    if (nearJunction) continue;
    if (x > PARK.x - 60 && x < PARK.x + PARK.width + 60 && y > PARK.y - 60 && y < PARK.y + PARK.height + 60) continue;
    parked.push({ x, y, angle, type: pick(random, carKeys), id: `parked-${i}` });
  }

  // The named places the story and the missions use. All sit on or beside a road.
  const PLACES = {
    garage: { x: HIDEOUT.x, y: HIDEOUT.y, label: "Mira's Garage" },
    marina: { x: 2920, y: 1240, label: 'Solmara Marina' },
    motel: { x: 2380, y: 2080, label: 'Sunset Motel' },
    downtownLot: { x: 1700, y: 1420, label: 'Downtown Lot' },
    docks: { x: 2920, y: 1820, label: 'Harbor Docks' },
    park: { x: PARK.x + PARK.width / 2, y: PARK.y + PARK.height / 2, label: 'Palmetto Park' },
    bank: { x: 2280, y: 940, label: 'Solmara Bank' },
    vipers: { x: 640, y: 1780, label: 'Vipers Turf' },
    beach: { x: 1400, y: 2330, label: 'Solmara Beach' },
  };

  function isInWater(x, y) {
    return y >= WATER_TOP || x >= MARINA_LEFT;
  }

  function isOnRoad(x, y) {
    for (const rx of ROADS_X) if (Math.abs(x - rx) <= ROAD_WIDTH / 2) return true;
    for (const ry of ROADS_Y) if (Math.abs(y - ry) <= ROAD_WIDTH / 2) return true;
    return false;
  }

  function isInPark(x, y) {
    return x >= PARK.x && x <= PARK.x + PARK.width && y >= PARK.y && y <= PARK.y + PARK.height;
  }

  function hitsBuilding(x, y, r) {
    for (const b of buildings) if (circleHitsRect(x, y, r, b)) return b;
    return null;
  }

  /** Push a circle out of buildings and water; returns the corrected position. */
  function collide(x, y, r) {
    let nx = Math.max(r, Math.min(WORLD.width - r, x));
    let ny = Math.max(r, Math.min(WORLD.height - r, y));
    for (const b of buildings) {
      if (!circleHitsRect(nx, ny, r, b)) continue;
      const left = nx - (b.x - r);
      const right = b.x + b.width + r - nx;
      const top = ny - (b.y - r);
      const bottom = b.y + b.height + r - ny;
      const min = Math.min(left, right, top, bottom);
      if (min === left) nx = b.x - r;
      else if (min === right) nx = b.x + b.width + r;
      else if (min === top) ny = b.y - r;
      else ny = b.y + b.height + r;
    }
    if (ny + r > WATER_TOP) ny = WATER_TOP - r;
    if (nx + r > MARINA_LEFT) nx = MARINA_LEFT - r;
    return { x: nx, y: ny };
  }

  /** A random point on a road, for spawning traffic and pedestrians. */
  function randomRoadPoint() {
    if (chance(random, 0.5)) {
      const road = pick(random, ROADS_X);
      const north = chance(random, 0.5);
      return { x: laneX(road, north), y: range(random, 200, WORLD.height - 300), angle: north ? -Math.PI / 2 : Math.PI / 2 };
    }
    const road = pick(random, ROADS_Y);
    const east = chance(random, 0.5);
    return { x: range(random, 200, WORLD.width - 300), y: laneY(road, east), angle: east ? 0 : Math.PI };
  }

  /** A random sidewalk point, for pedestrians. */
  function randomSidewalkPoint() {
    const road = pick(random, ROADS_X);
    const side = chance(random, 0.5) ? 1 : -1;
    return {
      x: road + side * (ROAD_WIDTH / 2 + 14),
      y: range(random, 200, WORLD.height - 300),
      angle: chance(random, 0.5) ? -Math.PI / 2 : Math.PI / 2,
    };
  }

  return {
    buildings, palms, lamps, trees, parked, PLACES,
    isInWater, isOnRoad, isInPark, hitsBuilding, collide,
    randomRoadPoint, randomSidewalkPoint,
  };
}
