import type { Difficulty, Habit, ISODate } from '../types'
import { addDays, lastDays, startOfWeek } from './dates'
import { isCompleted, isScheduled } from './streaks'

/*
 * XP is always derived from completions — it is never stored. Un-checking a
 * habit therefore removes exactly the XP it granted, and there is no counter
 * to farm by toggling.
 */

export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
}

export function habitXp(habit: Habit): number {
  return Object.hasOwn(XP_BY_DIFFICULTY, habit.difficulty) ? XP_BY_DIFFICULTY[habit.difficulty] : 0
}

/** Lifetime XP. Archived habits still count: earned XP is never taken away. */
export function totalXp(habits: Habit[]): number {
  return habits.reduce((sum, h) => sum + h.completions.length * habitXp(h), 0)
}

/** XP earned on days in [from, to], inclusive. */
export function xpBetween(habits: Habit[], from: ISODate, to: ISODate): number {
  return habits.reduce(
    (sum, h) => sum + h.completions.filter((d) => d >= from && d <= to).length * habitXp(h),
    0,
  )
}

/** XP earned so far in the week (Mon → Sun) containing `today`. */
export function weeklyXp(habits: Habit[], today: ISODate): number {
  return xpBetween(habits, startOfWeek(today), today)
}

// ── Ranks ────────────────────────────────────────────────────────────────

export const RANKS = [
  { name: 'Bronze', minXp: 0 },
  { name: 'Silver', minXp: 750 },
  { name: 'Gold', minXp: 2750 },
  { name: 'Diamond', minXp: 6000 },
] as const

export type RankName = (typeof RANKS)[number]['name']

export interface RankInfo {
  name: RankName
  /** Index into RANKS. */
  tier: number
  /** Next tier, or null at the top. */
  next: RankName | null
  /** XP still needed for the next tier (0 at the top). */
  xpToNext: number
  /** 0–1 progress through the current tier (1 at the top). */
  progress: number
}

export function rankFor(xp: number): RankInfo {
  let tier = 0
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].minXp) tier = i
  const current = RANKS[tier]
  const next = RANKS[tier + 1]
  if (!next) return { name: current.name, tier, next: null, xpToNext: 0, progress: 1 }
  return {
    name: current.name,
    tier,
    next: next.name,
    xpToNext: next.minXp - xp,
    progress: (xp - current.minXp) / (next.minXp - current.minXp),
  }
}

// ── Daily & weekly completion ────────────────────────────────────────────

export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.archivedOn)
}

export function habitsDueOn(habits: Habit[], date: ISODate): Habit[] {
  return activeHabits(habits).filter((h) => isScheduled(h, date))
}

export interface DayProgress {
  date: ISODate
  done: number
  due: number
  /** 0–1; 0 when nothing is due. */
  ratio: number
}

export function dayProgress(habits: Habit[], date: ISODate): DayProgress {
  const due = habitsDueOn(habits, date)
  const done = due.filter((h) => isCompleted(h, date)).length
  return { date, done, due: due.length, ratio: due.length ? done / due.length : 0 }
}

/** Completion for the seven days ending on `today` (oldest first). */
export function recentProgress(habits: Habit[], today: ISODate): DayProgress[] {
  return lastDays(today, 7).map((d) => dayProgress(habits, d))
}

// ── Streak summaries ─────────────────────────────────────────────────────

/** Consecutive days (ending today or yesterday) with at least one completion. */
export function activeDayStreak(habits: Habit[], today: ISODate): number {
  const days = new Set(habits.flatMap((h) => h.completions))
  let streak = days.has(today) ? 1 : 0
  for (let day = addDays(today, -1); days.has(day); day = addDays(day, -1)) streak += 1
  return streak
}
