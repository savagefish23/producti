import type { FreezeUse, Habit, ISODate } from '../types'
import { addDays, startOfWeek, weekdayOf } from './dates'

/*
 * ───────────────────────────── STREAK RULES ─────────────────────────────
 *
 * 1. A streak counts SCHEDULED days only. A Mon/Wed/Fri habit completed on
 *    Mon, Wed and Fri has a streak of 3; Tue/Thu/Sat/Sun are skipped — they
 *    neither add to the streak nor break it.
 *
 * 2. The streak is the number of completed scheduled days found walking
 *    backwards from today until the first scheduled day that was missed.
 *
 * 3. Today never breaks a streak. If today is scheduled and not yet done it
 *    is "pending": it adds nothing, and the walk continues from yesterday.
 *    Once completed, it adds 1.
 *
 * 4. A missed scheduled day covered by a Streak Freeze is skipped like an
 *    unscheduled day: the streak survives but does not grow.
 *
 * 5. Streak Freeze: the user has ONE token per week (weeks run Mon → Sun),
 *    shared across all habits. Tokens are spent automatically when a day
 *    ends ("rollover"), never by hand:
 *      - days are processed oldest first, habits in list order;
 *      - a missed scheduled day spends the week's token only if that habit
 *        had a live streak (> 0) to protect — tokens are never wasted;
 *      - if the token for that week is already spent, the streak breaks.
 *    Tokens do not carry over to the next week.
 *
 * 6. Days before the habit was created are ignored; the walk stops there.
 *
 * 7. Completing an unscheduled day is not possible in the UI; if one ever
 *    exists in the data it is ignored by the streak (but still earned XP).
 *
 * Everything is keyed on ISO calendar days, so a streak is unaffected by
 * the time of day, midnight passing mid-session, or a timezone change.
 * ─────────────────────────────────────────────────────────────────────────
 */

export function isScheduled(habit: Habit, date: ISODate): boolean {
  return date >= habit.createdOn && habit.schedule.includes(weekdayOf(date))
}

export function isCompleted(habit: Habit, date: ISODate): boolean {
  return habit.completions.includes(date)
}

export function isFrozen(habit: Habit, date: ISODate, freezes: FreezeUse[]): boolean {
  return freezes.some((f) => f.habitId === habit.id && f.date === date)
}

/** Current streak as seen on `today` (rules 1–4, 6). */
export function currentStreak(habit: Habit, today: ISODate, freezes: FreezeUse[]): number {
  const done = new Set(habit.completions)
  const frozen = new Set(freezes.filter((f) => f.habitId === habit.id).map((f) => f.date))

  let streak = isScheduled(habit, today) && done.has(today) ? 1 : 0
  for (let day = addDays(today, -1); day >= habit.createdOn; day = addDays(day, -1)) {
    if (!isScheduled(habit, day)) continue
    if (done.has(day)) streak += 1
    else if (frozen.has(day)) continue
    else break
  }
  return streak
}

/** Is this week's Streak Freeze token still unspent? */
export function freezeAvailable(freezes: FreezeUse[], date: ISODate): boolean {
  const week = startOfWeek(date)
  return !freezes.some((f) => f.weekStart === week)
}

/** The freeze spent in the week containing `date`, if any. */
export function freezeUsedInWeek(freezes: FreezeUse[], date: ISODate): FreezeUse | undefined {
  const week = startOfWeek(date)
  return freezes.find((f) => f.weekStart === week)
}

/**
 * Rule 5: settle every fully elapsed day in [from, today) and return the
 * updated freeze list. `from` is the last day the app processed.
 */
export function settleFreezes(
  habits: Habit[],
  freezes: FreezeUse[],
  from: ISODate,
  today: ISODate,
): FreezeUse[] {
  let result = freezes
  for (let day = from; day < today; day = addDays(day, 1)) {
    for (const habit of habits) {
      if (habit.archivedOn) continue
      if (!isScheduled(habit, day)) continue
      if (isCompleted(habit, day) || isFrozen(habit, day, result)) continue
      if (!freezeAvailable(result, day)) continue
      // The streak that would be lost: seen from `day`, where `day` is pending.
      if (currentStreak(habit, day, result) === 0) continue
      result = [...result, { habitId: habit.id, date: day, weekStart: startOfWeek(day) }]
    }
  }
  return result
}

export type DayState = 'done' | 'frozen' | 'missed' | 'pending' | 'upcoming' | 'off'

/** How a habit looks on a given day, relative to today. Drives the week dots. */
export function dayState(
  habit: Habit,
  date: ISODate,
  today: ISODate,
  freezes: FreezeUse[],
): DayState {
  if (!isScheduled(habit, date)) return 'off'
  if (isCompleted(habit, date)) return 'done'
  if (date > today) return 'upcoming'
  if (date === today) return 'pending'
  return isFrozen(habit, date, freezes) ? 'frozen' : 'missed'
}
