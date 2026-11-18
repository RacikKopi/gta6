// A small seeded random number generator (mulberry32) plus the helpers the game
// uses everywhere: the same seed always builds the same city, the same traffic
// and the same pedestrians, which is what makes the screenshot scenes repeatable.
// World generation never reads Math.random or the clock; it only reads these streams.

export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A float in [min, max). */
export function range(random, min, max) {
  return min + random() * (max - min);
}

/** An integer in [min, max]. */
export function int(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** One element of an array. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

/** True with the given probability. */
export function chance(random, probability) {
  return random() < probability;
}

/** A stable id string from a stream, for naming things the save file references. */
export function makeId(random) {
  return Math.floor(random() * 4294967296).toString(36);
}
