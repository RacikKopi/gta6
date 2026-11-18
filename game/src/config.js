// SOLMARA — every tuning number, colour and layout constant in one place.
// The camera shows a 1280x720 window of a 3200x2400 coastal city; the renderer
// scales that window to the browser, so no rule here depends on the screen size.

export const VIEW = { width: 1280, height: 720 };
export const WORLD = { width: 3200, height: 2400 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Centre lines of the city's roads; every road is ROAD_WIDTH wide, right-hand traffic. */
export const ROADS_X = [400, 1000, 1600, 2200, 2800];
export const ROADS_Y = [400, 1000, 1600, 2000, 2240];
export const ROAD_WIDTH = 120;
export const SIDEWALK = 26;

/** The beach and the sea along the south edge, and the marina on the east edge. */
export const BEACH_TOP = 2300;
export const WATER_TOP = 2360;
export const MARINA_LEFT = 3080;

/** The park block: no buildings, grass and trees, between the 1000/1600 roads. */
export const PARK = { x: 1060, y: 460, width: 480, height: 480 };

/** Mira's garage, the hideout: the player starts here and respawns here when busted. */
export const HIDEOUT = { x: 520, y: 520 };

export const PLAYER = {
  radius: 13,
  walkSpeed: 235,
  runSpeed: 345,
  accel: 2600,
  health: 100,
  punchDamage: 15,
  punchRange: 46,
  punchArc: 1.1,
  punchCooldown: 0.38,
};

export const CAR = {
  length: 66,
  width: 32,
  radius: 24,
  accel: 340,
  brake: 620,
  reverseMax: 210,
  steer: 2.5,
  drag: 0.55,
  grip: 7.5,
  enterRange: 70,
};

export const CAR_TYPES = {
  comet: { name: 'Comet GT', topSpeed: 660, accel: 430, color: '#f2c531', price: 0 },
  stingray: { name: 'Stingray', topSpeed: 600, accel: 380, color: '#c0392b', price: 0 },
  dolphin: { name: 'Dolphin', topSpeed: 480, accel: 300, color: '#3e7cb1', price: 0 },
  sunbeam: { name: 'Sunbeam', topSpeed: 430, accel: 280, color: '#e8e4d8', price: 0 },
  pelican: { name: 'Pelican Van', topSpeed: 400, accel: 250, color: '#7d8c8d', price: 0 },
  police: { name: 'Interceptor', topSpeed: 640, accel: 460, color: '#1c2733', price: 0 },
};

export const TRAFFIC_COUNT = 16;
export const PED_COUNT = 26;
export const PICKUP_COUNT = 10;

export const WANTED = {
  maxStars: 5,
  decayDelay: 12,
  decayInterval: 14,
  hideoutDecayInterval: 5,
  stealStars: 1,
  assaultStars: 1,
  shootStars: 1,
  killStars: 2,
  bustTouchSeconds: 1.1,
  bustCashLoss: 0.2,
};

export const POLICE = {
  chaseSpeed: 560,
  ramDamage: 8,
  copSpeed: 250,
  copDamage: 6,
  copPunchCooldown: 0.9,
  spawnDistance: 700,
};

export const COMBAT = {
  batDamage: 32,
  batRange: 62,
  pistolDamage: 26,
  pistolAmmo: 12,
  bulletSpeed: 780,
  bulletRange: 620,
  enemyHealth: 50,
  enemyDamage: 8,
  enemySpeed: 205,
};

export const PALETTE = {
  grass: '#7fae62',
  grassDark: '#6f9c54',
  sand: '#e8d5a2',
  water: '#2f7fb8',
  waterDeep: '#256b9e',
  road: '#3a3f47',
  roadEdge: '#2c3038',
  lane: '#e8d44d',
  sidewalk: '#b9b3a4',
  buildingRoof: ['#c96f4a', '#4a7fb5', '#8a6fb5', '#4fae8a', '#b54a6f', '#d9a441', '#5b7d8a', '#a8543f'],
  buildingEdge: '#00000033',
  parkGrass: '#69a854',
  tree: '#2f7d3a',
  treeDark: '#256b31',
  palm: '#3f9e4d',
  player: '#f2f2f2',
  playerJacket: '#e5534b',
  pedShirt: ['#e8e4d8', '#4fc3f7', '#f2c94c', '#e5534b', '#8a6fb5', '#4fae8a'],
  hudPanel: 'rgba(12, 16, 24, 0.72)',
  hudText: '#f5f1e6',
  hudGold: '#f2c531',
  hudRed: '#e5534b',
  hudBlue: '#4fc3f7',
  minimapWater: '#2f7fb8',
  minimapRoad: '#8b93a3',
  minimapPark: '#69a854',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the save lives between visits (this browser only). */
export const SAVE_KEY = 'solmara.save.v1';
export const BEST_KEY = 'solmara.best.v1';

/** The fixed seed the ?shot= scenes use, so every screenshot is repeatable. */
export const SHOT_SEED = 1;
/** The seed a fresh game uses when no ?seed= is given. */
export const DEFAULT_SEED = 20261118;
