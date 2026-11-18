// The story of SOLMARA: Rook Vega owes $5,000 to Dario "The Hook" Fontaine
// of the Harbor Kings. Mira Solano, the mechanic at the garage, lines up five
// jobs to pay it off. Each mission is a chain of steps — go somewhere, pick
// something up, steal a car, win a fight, bring it home — and each one pays.
// Finish all five and the debt is gone.

const MISSIONS = [
  {
    id: 'first-fare',
    title: 'First Fare',
    brief: "Mira's cousin Lena is waiting at the marina. Give her a lift to the Sunset Motel and get your first pay.",
    reward: 400,
    steps: [
      { type: 'goto', place: 'marina', text: 'Pick up Lena at the Marina' },
      { type: 'interact', place: 'marina', text: 'Press F to pick up Lena' },
      { type: 'goto', place: 'motel', text: 'Drive Lena to the Sunset Motel', needCar: true },
    ],
  },
  {
    id: 'hot-wheels',
    title: 'Hot Wheels',
    brief: 'A yellow Comet GT sits in the Downtown Lot. Take it — quietly — and bring it to the garage.',
    reward: 600,
    cars: [{ id: 'mission-comet', type: 'comet', place: 'downtownLot' }],
    steps: [
      { type: 'goto', place: 'downtownLot', text: 'Find the yellow Comet GT' },
      { type: 'enterCar', carId: 'mission-comet', text: 'Steal the Comet GT (E to enter)' },
      { type: 'deliverCar', place: 'garage', carId: 'mission-comet', text: "Deliver the Comet to Mira's Garage" },
    ],
  },
  {
    id: 'the-drop',
    title: 'The Drop',
    brief: 'A package is waiting at the Harbor Docks. Collect it, deliver it to Palmetto Park — and mind the heat.',
    reward: 800,
    steps: [
      { type: 'goto', place: 'docks', text: 'Collect the package at the Harbor Docks' },
      { type: 'interact', place: 'docks', text: 'Press F to take the package', heat: 2 },
      { type: 'goto', place: 'park', text: 'Deliver the package to Palmetto Park' },
    ],
  },
  {
    id: 'payback',
    title: 'Payback',
    brief: 'The Street Vipers took Mira\'s cash. Go to their turf, teach them a lesson, and bring the money home.',
    reward: 1000,
    enemies: [{ place: 'vipers', count: 4 }],
    steps: [
      { type: 'goto', place: 'vipers', text: 'Find the Vipers at their turf' },
      { type: 'defeat', count: 4, text: 'Teach the Vipers a lesson' },
      { type: 'collect', place: 'vipers', text: "Grab Mira's cash" },
      { type: 'goto', place: 'garage', text: 'Bring the cash back to the garage' },
    ],
  },
  {
    id: 'the-big-score',
    title: 'The Big Score',
    brief: "Dario's money van leaves the Solmara Bank at noon. Take it, shake the whole department, and the debt is paid.",
    reward: 2500,
    cars: [{ id: 'mission-van', type: 'pelican', place: 'bank' }],
    steps: [
      { type: 'goto', place: 'bank', text: 'Reach the Solmara Bank' },
      { type: 'enterCar', carId: 'mission-van', text: 'Steal the money van (E to enter)', heat: 3 },
      { type: 'deliverCar', place: 'garage', carId: 'mission-van', text: 'Bring the van home and pay the debt' },
    ],
  },
];

const STEP_RADIUS = 90;

export function createMissions(places) {
  let missionIndex = 0;
  let stepIndex = 0;
  let defeated = 0;
  let collected = false;
  let storyComplete = false;
  let started = false;

  function current() {
    if (storyComplete || missionIndex >= MISSIONS.length) return null;
    const def = MISSIONS[missionIndex];
    return { def, step: def.steps[stepIndex], stepIndex, missionIndex };
  }

  /** The cars and enemies a mission needs when it starts; main.js creates them. */
  function setupFor(index) {
    const def = MISSIONS[index];
    return { cars: def.cars || [], enemies: def.enemies || [] };
  }

  function startMission(index) {
    missionIndex = index;
    stepIndex = 0;
    defeated = 0;
    collected = false;
    started = true;
    return setupFor(index);
  }

  function marker() {
    const cur = current();
    if (!cur) return null;
    const step = cur.step;
    if (step.place) {
      const place = places[step.place];
      return { x: place.x, y: place.y, label: place.label };
    }
    if (step.type === 'defeat' || step.type === 'collect') {
      const place = places.vipers;
      return { x: place.x, y: place.y, label: place.label };
    }
    return null;
  }

  function objectiveText() {
    const cur = current();
    if (!cur) return storyComplete ? 'Debt paid — Solmara is yours. Free roam!' : 'No job right now.';
    let text = cur.step.text;
    if (cur.step.type === 'defeat') text += ` (${defeated}/${cur.step.count})`;
    return `JOB ${cur.missionIndex + 1}/5 — ${cur.def.title}: ${text}`;
  }

  function advance() {
    const cur = current();
    if (!cur) return { missionDone: false };
    const def = cur.def;
    stepIndex += 1;
    defeated = 0;
    collected = false;
    if (stepIndex >= def.steps.length) {
      missionIndex += 1;
      stepIndex = 0;
      if (missionIndex >= MISSIONS.length) {
        storyComplete = true;
        return { missionDone: true, reward: def.reward, storyDone: true };
      }
      return { missionDone: true, reward: def.reward, next: MISSIONS[missionIndex] };
    }
    return { stepDone: true };
  }

  /**
   * One step. ctx: { x, y, inCar, carId, interact, enemiesDown, itemCollected }.
   * Returns { stepDone, missionDone, storyDone, reward, heat, message, next }.
   */
  function update(ctx) {
    const cur = current();
    if (!cur) return {};
    const step = cur.step;
    const mark = marker();
    let done = false;
    if (step.type === 'goto') {
      if (mark && Math.hypot(ctx.x - mark.x, ctx.y - mark.y) < STEP_RADIUS) {
        if (!step.needCar || ctx.inCar) done = true;
      }
    } else if (step.type === 'interact') {
      if (mark && ctx.interact && Math.hypot(ctx.x - mark.x, ctx.y - mark.y) < STEP_RADIUS) done = true;
    } else if (step.type === 'enterCar') {
      if (ctx.carId === step.carId) done = true;
    } else if (step.type === 'deliverCar') {
      if (ctx.inCar && ctx.carId === step.carId && mark && Math.hypot(ctx.x - mark.x, ctx.y - mark.y) < STEP_RADIUS) done = true;
    } else if (step.type === 'defeat') {
      if (defeated >= step.count) done = true;
    } else if (step.type === 'collect') {
      if (collected) done = true;
    }
    if (!done) return {};
    const heat = step.heat || 0;
    const result = advance();
    return { ...result, heat, message: result.missionDone ? `Job done: ${cur.def.title} — $${cur.def.reward}` : null };
  }

  function onEnemyDefeated() {
    defeated += 1;
  }

  function onItemCollected() {
    collected = true;
  }

  function saveState() {
    return { missionIndex, stepIndex, defeated, collected, storyComplete, started };
  }

  function loadState(saved) {
    if (!saved) return;
    missionIndex = saved.missionIndex || 0;
    stepIndex = saved.stepIndex || 0;
    defeated = saved.defeated || 0;
    collected = saved.collected || false;
    storyComplete = saved.storyComplete || false;
    started = saved.started || false;
  }

  return {
    list: MISSIONS,
    current, setupFor, startMission, marker, objectiveText, update,
    onEnemyDefeated, onItemCollected, saveState, loadState,
    isStoryComplete: () => storyComplete,
    isStarted: () => started,
  };
}
