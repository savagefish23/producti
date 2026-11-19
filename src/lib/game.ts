import type { FreezeUse, Habit, ISODate } from '../types'
import { addDays, lastDays, startOfWeek } from './dates'
import { currentStreak, isCompleted, isScheduled } from './streaks'

/*
 * ─────────────────────────────── XP RULES ───────────────────────────────
 *
 * Users never choose how much a habit is worth, so there is nothing to
 * game: XP only grows by showing up.
 *
 *   XP for a check-in = BASE_XP + streak bonus
 *   streak bonus      = (streak on that day − 1), capped at STREAK_BONUS_CAP
 *
 * So day 1 of a streak earns 10, day 2 earns 11, … and day 21 onward earns
 * 30. The streak is counted by the same rules as everywhere else
 * (scheduled days only, frozen days bridge without adding).
 *
 * XP is always derived from completions — it is never stored. Un-checking a
 * habit removes exactly the XP it granted, and there is no counter to farm by
 * toggling. A check-in's XP depends only on earlier days, so it never
 * changes after the fact.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const BASE_XP = 10
export const STREAK_BONUS_CAP = 20

export function checkinXp(streak: number): number {
  return BASE_XP + Math.min(Math.max(streak - 1, 0), STREAK_BONUS_CAP)
}

/** XP earned by each completed day of a habit. */
export function completionXp(habit: Habit, freezes: FreezeUse[]): Map<ISODate, number> {
  const done = new Set(habit.completions)
  const frozen = new Set(freezes.filter((f) => f.habitId === habit.id).map((f) => f.date))
  const earned = new Map<ISODate, number>()
  const last = habit.completions.reduce((max, d) => (d > max ? d : max), habit.createdOn)

  let run = 0
  for (let day = habit.createdOn; day <= last; day = addDays(day, 1)) {
    if (!isScheduled(habit, day)) continue
    if (done.has(day)) earned.set(day, checkinXp(++run))
    else if (!frozen.has(day)) run = 0
  }
  // Completions outside the schedule (only possible in old data) earn the base.
  for (const day of done) if (!earned.has(day)) earned.set(day, BASE_XP)
  return earned
}

/** Lifetime XP of one habit. */
export function habitXp(habit: Habit, freezes: FreezeUse[]): number {
  let sum = 0
  for (const xp of completionXp(habit, freezes).values()) sum += xp
  return sum
}

/** What checking a habit in today earns (or earned, if already done). */
export function nextCheckinXp(habit: Habit, today: ISODate, freezes: FreezeUse[]): number {
  if (isCompleted(habit, today)) return completionXp(habit, freezes).get(today) ?? BASE_XP
  return checkinXp(currentStreak(habit, today, freezes) + 1)
}

/** Lifetime XP. Archived habits still count: earned XP is never taken away. */
export function totalXp(habits: Habit[], freezes: FreezeUse[]): number {
  return habits.reduce((sum, h) => sum + habitXp(h, freezes), 0)
}

/** XP earned on days in [from, to], inclusive. */
export function xpBetween(habits: Habit[], freezes: FreezeUse[], from: ISODate, to: ISODate): number {
  let sum = 0
  for (const habit of habits) {
    for (const [day, xp] of completionXp(habit, freezes)) if (day >= from && day <= to) sum += xp
  }
  return sum
}

/** XP earned so far in the week (Mon → Sun) containing `today`. */
export function weeklyXp(habits: Habit[], freezes: FreezeUse[], today: ISODate): number {
  return xpBetween(habits, freezes, startOfWeek(today), today)
}

// ── Ranks ────────────────────────────────────────────────────────────────

export const RANKS = [
  { name: 'Bronze', minXp: 0 },
  { name: 'Silver', minXp: 500 },
  { name: 'Gold', minXp: 1800 },
  { name: 'Diamond', minXp: 4500 },
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
