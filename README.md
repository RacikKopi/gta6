# gta6

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![make.fun · gta6-01 rank](https://make.fun/badge/gta6-01/RacikKopi/gta6/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![make.fun · gta6-01 reward](https://make.fun/badge/gta6-01/RacikKopi/gta6/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**SOLMARA** — a sun-soaked open-world crime story in a coastal city, built in vanilla
JavaScript on a 2D top-down canvas. No libraries, no assets, no network: every street,
building, car and sound is generated in code.

Rook Vega owes $5,000 to Dario "The Hook" Fontaine of the Harbor Kings. His only way
out is five jobs lined up by Mira Solano, the mechanic at the garage: a first fare, a
stolen Comet GT, a package run through a police dragnet, payback on the Street Vipers,
and one last money-van heist to pay the debt.

What is in the city:

- **Open world** — a 3200×2400 city to explore on foot and by car: roads, blocks and
  buildings, a beach and a marina, Palmetto Park, and nine named places.
- **Driving** — enter and exit any car, steal parked cars and traffic, arcade handling
  with handbrake slides and skid marks.
- **Traffic and pedestrians** — traffic AI drives the right-hand lanes, brakes for the
  car ahead and turns around when boxed in; pedestrians stroll the sidewalks and flee
  from gunfire, punches and speeding cars.
- **Wanted 1–5★** — crimes raise the heat; police interceptors chase and ram, foot
  cops run you down and bust you, and the stars cool off when you lay low.
- **Five story jobs** — a chained mission system with pay, progression and a story
  ending; finishing all five pays the debt and opens free roam.
- **Combat** — fists, a bat pickup and a pistol pickup with aimed shooting.
- **HUD and minimap** — health, cash, wanted stars, the current objective, speed,
  toasts and a live minimap with the mission marker.
- **Screens and save** — title, pause, wasted/busted, story complete, and progress
  auto-saved to localStorage.
- **Sound** — engine hum, two-tone siren, punches, gunshots, crashes, pickups and a
  job-complete jingle, all synthesized with WebAudio.

## Controls

| Keys | Action |
| --- | --- |
| WASD / Arrows | Move on foot, drive the car |
| Shift | Run / handbrake |
| E | Enter or steal a car, get out |
| F | Interact (pick up, deliver) |
| Space | Punch |
| J / Click | Shoot (pistol) |
| P / Esc | Pause |
| M | Mute |
| R | Restart |

## Run it

Serve the game locally:

```
node serve.ts
```

then open http://localhost:8080.

Or build the submission bundle:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

The cover (`1-chase.jpg`) is a three-star police chase down the avenue, with the
minimap and the job objective in the HUD. The others show the city on foot, driving
through traffic, and the Payback job at the Vipers' turf. Every screenshot is a real
render from this code, staged deterministically with `?shot=<name>&seed=1`.

<sub>Entered on [make.fun](https://make.fun/?ref=pthebz3v&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
