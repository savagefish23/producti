/*
 * The app's only source of real randomness. Used by event handlers to pick
 * delays and reply variants, which are then passed into the pure reducer.
 */

/** A float in [min, max). */
export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** An integer in [0, count). */
export function randomInt(count: number): number {
  return Math.floor(Math.random() * count)
}

/** True with the given probability (0–1). */
export function chance(probability: number): boolean {
  return Math.random() < probability
}
