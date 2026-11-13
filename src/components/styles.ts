import type { Category, Difficulty, StatusKind } from '../types'

/* Static class maps — Tailwind needs to see full class names in source. */

export const CATEGORY_STYLES: Record<Category, { bar: string; soft: string; solid: string }> = {
  Health: {
    bar: 'bg-emerald-500',
    soft: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    solid: 'bg-emerald-500 text-white',
  },
  Focus: {
    bar: 'bg-violet-500',
    soft: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
    solid: 'bg-violet-500 text-white',
  },
  Study: {
    bar: 'bg-amber-500',
    soft: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    solid: 'bg-amber-500 text-white',
  },
  Fitness: {
    bar: 'bg-rose-500',
    soft: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
    solid: 'bg-rose-500 text-white',
  },
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const AVATAR_COLORS: Record<string, string> = {
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  me: 'bg-linear-to-br from-fuchsia-500 to-indigo-600',
}

export const STATUS_DOT: Record<StatusKind, string> = {
  'Deep Work': 'bg-violet-500',
  'At the Gym': 'bg-rose-500',
  Reading: 'bg-amber-500',
  Idle: 'bg-slate-400',
}
