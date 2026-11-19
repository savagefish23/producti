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
/*
 * A competitive ladder: seven tiers with three divisions each, then one top
 * rank. 22 steps in all:
 *
 *   Bronze I–III, Silver I–III, Gold I–III, Platinum I–III, Diamond I–III,
 *   Champion I–III, Overlord I–III, Eternal
 *
 * Step i (0–21) starts at 25·i² + 100·i XP, so each step takes a little longer
 * than the one before: Silver I at 525, Gold I at 1,500, Diamond I at 4,125,
 * Overlord I at 9,900 and Eternal at 13,125. At a steady 100–150 XP a day,
 * Eternal is a few months of showing up.
 */

export const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Overlord', 'Eternal'] as const
export type TierName = (typeof TIERS)[number]

const DIVISIONS = ['I', 'II', 'III'] as const
export const RANK_STEPS = TIERS.length * 3 - 2 // 7 tiers × 3 divisions + Eternal = 22

export function rankStartXp(step: number): number {
  return 25 * step * step + 100 * step
}

export interface RankStep {
  /** 0 (Bronze I) … 21 (Eternal). */
  step: number
  tier: TierName
  /** 0-based index into TIERS. */
  tierIndex: number
  /** 1–3, or null for Eternal. */
  division: 1 | 2 | 3 | null
  /** "Gold II", "Eternal". */
  name: string
  minXp: number
}

export function rankStep(step: number): RankStep {
  const s = Math.min(Math.max(Math.trunc(step), 0), RANK_STEPS - 1)
  const tierIndex = Math.floor(s / 3)
  const tier = TIERS[tierIndex]
  if (tier === 'Eternal') return { step: s, tier, tierIndex, division: null, name: 'Eternal', minXp: rankStartXp(s) }
  const division = ((s % 3) + 1) as 1 | 2 | 3
  return { step: s, tier, tierIndex, division, name: `${tier} ${DIVISIONS[division - 1]}`, minXp: rankStartXp(s) }
}

/** Every step, bottom to top. */
export const RANKS: RankStep[] = Array.from({ length: RANK_STEPS }, (_, i) => rankStep(i))

export interface RankInfo extends RankStep {
  /** The next step, or null at Eternal. */
  next: RankStep | null
  /** XP still needed for the next step (0 at the top). */
  xpToNext: number
  /** 0–1 progress through the current step (1 at the top). */
  progress: number
}

export function rankFor(xp: number): RankInfo {
  const safe = Number.isFinite(xp) ? Math.max(0, xp) : 0
  let step = 0
  while (step + 1 < RANK_STEPS && safe >= rankStartXp(step + 1)) step += 1
  const current = rankStep(step)
  if (step === RANK_STEPS - 1) return { ...current, next: null, xpToNext: 0, progress: 1 }
  const next = rankStep(step + 1)
  return {
    ...current,
    next,
    xpToNext: next.minXp - safe,
    progress: (safe - current.minXp) / (next.minXp - current.minXp),
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

// ── Chart data ───────────────────────────────────────────────────────────

/** XP earned on each of the given days. */
export function dailyXp(habits: Habit[], freezes: FreezeUse[], days: ISODate[]): number[] {
  const totals = new Map(days.map((d) => [d, 0]))
  for (const habit of habits) {
    for (const [day, xp] of completionXp(habit, freezes)) {
      if (totals.has(day)) totals.set(day, (totals.get(day) ?? 0) + xp)
    }
  }
  return days.map((d) => totals.get(d) ?? 0)
}

/** Check-ins per category over the `days` days ending today. */
export function checkinsByCategory(habits: Habit[], today: ISODate, days = 30): Map<Habit['category'], number> {
  const from = addDays(today, -(days - 1))
  const counts = new Map<Habit['category'], number>()
  for (const habit of habits) {
    const n = habit.completions.filter((d) => d >= from && d <= today).length
    if (n > 0) counts.set(habit.category, (counts.get(habit.category) ?? 0) + n)
  }
  return counts
}

/**
 * Share of scheduled habit-days completed over the `days` days ending
 * yesterday (plus today if done). 0–1, or null if nothing was due.
 */
export function consistency(habits: Habit[], today: ISODate, days = 30): number | null {
  let due = 0
  let done = 0
  for (const day of lastDays(today, days)) {
    for (const habit of activeHabits(habits)) {
      if (!isScheduled(habit, day)) continue
      const completed = isCompleted(habit, day)
      if (day === today && !completed) continue
      due += 1
      if (completed) done += 1
    }
  }
  return due === 0 ? null : done / due
}
