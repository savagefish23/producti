import type { AppState, FeedItem, Friend, ISODate, StatusKind } from '../types'
import { STATUSES } from '../types'
import { addDays, startOfWeek } from './dates'

/*
 * The "friends" are simulated. Their activity is a deterministic function of
 * (friend, calendar day), so nothing about them needs to be stored and the
 * same day always looks the same — including after time travel or a reload.
 */

/** Deterministic pseudo-random number in [0, 1) for a string key. */
export function rand(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 16
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** XP a friend earned on a given day (0 on an off day). */
export function friendDayXp(friend: Friend, date: ISODate): number {
  if (rand(`${friend.id}|${date}|active`) >= friend.consistency) return 0
  const swing = 0.6 + 0.8 * rand(`${friend.id}|${date}|xp`)
  return Math.max(10, Math.round((friend.intensity * swing) / 5) * 5)
}

export function friendWeeklyXp(
  friend: Friend,
  today: ISODate,
  bonus: AppState['friendBonus'],
): number {
  const monday = startOfWeek(today)
  let xp = 0
  for (let day = monday; day <= today; day = addDays(day, 1)) xp += friendDayXp(friend, day)
  for (const b of bonus) {
    if (b.friendId === friend.id && b.date >= monday && b.date <= today) xp += b.xp
  }
  return xp
}

/** Consecutive active days ending today (or yesterday if today is still idle). */
export function friendStreak(friend: Friend, today: ISODate): number {
  let streak = friendDayXp(friend, today) > 0 ? 1 : 0
  for (let day = addDays(today, -1), i = 0; i < 365; day = addDays(day, -1), i++) {
    if (friendDayXp(friend, day) === 0) break
    streak += 1
  }
  return streak
}

/** Static status line for the "Happening Now" strip — fixed for the whole day. */
export function friendStatus(
  friend: Friend,
  today: ISODate,
): { status: StatusKind; note: string | null } {
  // A friend on an off day is idle; otherwise they are doing one of the active statuses.
  if (friendDayXp(friend, today) === 0) return { status: 'Idle', note: null }
  const active = STATUSES.filter((s) => s !== 'Idle')
  const status = active[Math.floor(rand(`${friend.id}|${today}|status`) * active.length)]
  return { status, note: `${10 + Math.floor(rand(`${friend.id}|${today}|mins`) * 80)}m` }
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The scripted check-ins friends post on `date`. `upToTime` ("HH:mm") limits
 * the result to what has "already happened" when `date` is today.
 */
export function friendCheckins(
  friends: Friend[],
  date: ISODate,
  upToTime = '23:59',
): Omit<FeedItem, 'id'>[] {
  const items: Omit<FeedItem, 'id'>[] = []
  for (const friend of friends) {
    if (friendDayXp(friend, date) === 0) continue
    const habit = friend.habits[Math.floor(rand(`${friend.id}|${date}|habit`) * friend.habits.length)]
    const minutes = 360 + Math.floor(rand(`${friend.id}|${date}|time`) * 960) // 06:00–21:59
    const time = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
    if (time > upToTime) continue
    items.push({
      actor: friend.id,
      kind: 'checkin',
      text: `checked in ${habit}`,
      streak: friendStreak(friend, date),
      date,
      time,
    })
  }
  return items
}

/** Newest first; stable for items sharing a minute. */
export function sortFeed(feed: FeedItem[]): FeedItem[] {
  return [...feed].sort((a, b) =>
    a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date),
  )
}

// ── Scripted replies ─────────────────────────────────────────────────────

export const THANKS_LINES = [
  'Thanks for the cheer! 🙌',
  'Appreciate it — needed that today.',
  'You legend. Right back at you 💪',
  'Thank you! Keeps me going.',
]

export const CHEER_LINES = [
  'cheered your check-in: {habit} 🔥',
  'saw you finished {habit} — nice work 👏',
  'is hyped about your {habit} streak ⚡',
]

export const NUDGE_LINES = [
  'got your nudge and checked in {habit} ✅',
  'needed that push — just finished {habit}',
  'is back on it after your nudge: {habit}',
]

export function pickLine(lines: string[], variant: number, habit = ''): string {
  return lines[Math.abs(variant) % lines.length].replace('{habit}', habit)
}

/** XP a friend gains from the check-in a nudge triggers. */
export const NUDGE_BONUS_XP = 25
