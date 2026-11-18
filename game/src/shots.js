// Shot staging: ?shot=<name> prepares one deterministic scene for the
// screenshots, always from the same seed, so the same URL always renders the
// same frame. The cover shot is the police chase; the others show the city on
// foot, the traffic, and a job in progress.
//
// After staging, the game runs its fixed-step loop for 30 frames (half a
// second) so traffic and the chase settle, then window.__shotReady is set.
// The screenshot is taken only once that flag is true.

import { createCar } from './vehicles.js';

export const SHOT_NAMES = ['start', 'play', 'drive', 'chase', 'mission'];

// Where the cover chase runs: straight down the avenue at x=2200.
const CHASE_ROAD_X = 2200;
const CHASE_Y = 1500;

export function stageShot(game, name) {
  game.shotName = name;
  if (name === 'start') {
    // The title screen paints itself over the city; park the camera at the
    // garage so the backdrop is the hideout and the marina behind it.
    game.player.state.x = 520;
    game.player.state.y = 520;
    game.player.state.angle = -Math.PI / 2;
    return null;
  }
  if (name === 'play') {
    // On foot on the marina promenade, pedestrians around, job one active.
    // x=2800 keeps the player inside the camera's frame (the world edge would
    // push a player at x=2960 toward the screen's edge).
    game.player.state.x = 2800;
    game.player.state.y = 1500;
    game.player.state.angle = Math.PI;
    game.playerCar = null;
    game.startJob(0);
    return null;
  }
  if (name === 'drive') {
    // Behind the wheel of the Comet GT, heading north up the avenue, traffic
    // ahead and behind.
    const car = createCar('comet', 1600, 1900, -Math.PI / 2, 'shot-drive');
    car.speed = 300;
    game.enterCar(car);
    game.startJob(0);
    return {
      // Keep the car centred on its avenue.
      drive(game) {
        const car = game.playerCar;
        if (!car) return { throttle: 0, steer: 0, handbrake: false };
        return {
          throttle: 0.7,
          steer: Math.max(-1, Math.min(1, (1600 - car.x) * 0.004)),
          handbrake: false,
        };
      },
    };
  }
  if (name === 'chase') {
    // The cover: three wanted stars, two interceptors on the player's tail,
    // the money van job under way.
    const car = createCar('comet', CHASE_ROAD_X, CHASE_Y, Math.PI / 2, 'shot-chase');
    car.speed = 250;
    game.enterCar(car);
    game.startJob(4);
    game.police.addStars(3);
    // Staged close behind on the player's own lane, so both interceptors
    // are in the frame after the half-second settle. The car starts below
    // police chase speed, so the interceptors close in instead of falling
    // behind the Comet's top speed (a parked car can also deflect a
    // wide-staged chaser off the avenue).
    game.police.spawnChaseCar(CHASE_ROAD_X - 10, CHASE_Y - 100, Math.PI / 2);
    game.police.spawnChaseCar(CHASE_ROAD_X + 10, CHASE_Y - 200, Math.PI / 2);
    return {
      drive(game) {
        const car = game.playerCar;
        if (!car) return { throttle: 0, steer: 0, handbrake: false };
        return {
          throttle: 1,
          steer: Math.max(-1, Math.min(1, (CHASE_ROAD_X - car.x) * 0.004)),
          handbrake: false,
        };
      },
    };
  }
  if (name === 'mission') {
    // On foot at the Vipers' turf, pistol in hand, four Vipers closing in,
    // the Payback job under way (the arrival step is already done).
    game.player.state.x = 640;
    game.player.state.y = 1780;
    game.player.state.angle = -Math.PI / 2;
    game.playerCar = null;
    game.startJob(3);
    game.missions.update({
      x: 640, y: 1780, inCar: false, carId: null,
      interact: false, enemiesDown: 0, itemCollected: false,
    });
    game.player.setWeapon('pistol', 12);
    return null;
  }
  return null;
}

export function shotList() {
  return [
    { file: '1-chase.jpg', shot: 'chase', title: 'Three-star chase down the avenue' },
    { file: '2-street.jpg', shot: 'play', title: 'On foot at the marina' },
    { file: '3-drive.jpg', shot: 'drive', title: 'Driving the Comet GT through traffic' },
    { file: '4-mission.jpg', shot: 'mission', title: 'Payback — Vipers at their turf' },
  ];
}
