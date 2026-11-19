import type { Category, Difficulty } from '../types'

/*
 * Categories carry meaning, so each gets one muted hue — shown only as a
 * small dot. Everything else in the chrome stays on the neutral ramp.
 */
export const CATEGORY_DOT: Record<Category, string> = {
  Health: 'bg-[#5f8f62]',
  Focus: 'bg-[#5f7aa6]',
  Study: 'bg-[#b8892f]',
  Fitness: 'bg-[#9a5a7a]',
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const NUMBER = new Intl.NumberFormat('en-US')

/** One number format across the app: "2,515". */
export function formatNumber(n: number): string {
  return NUMBER.format(n)
}
