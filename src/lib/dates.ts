import type { ISODate, Weekday } from '../types'

/*
 * Every date in the app is a plain calendar day ("2026-11-13").
 * The only place a real clock is read is `localToday` / `localTime`; all
 * arithmetic below is done in UTC on the parsed parts, so it cannot be
 * shifted by timezones or daylight-saving changes.
 */

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(year: number, month: number, day: number): ISODate {
  return `${year}-${pad(month)}-${pad(day)}`
}

/** The user's local calendar day for a given instant. */
export function localToday(now: Date = new Date()): ISODate {
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/** Local wall-clock time "HH:mm" for a given instant. */
export function localTime(now: Date = new Date()): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function toUTC(iso: ISODate): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function fromUTC(ms: number): ISODate {
  const d = new Date(ms)
  return toISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

const DAY_MS = 86_400_000

export function addDays(iso: ISODate, days: number): ISODate {
  return fromUTC(toUTC(iso) + days * DAY_MS)
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY_MS)
}

export function weekdayOf(iso: ISODate): Weekday {
  return new Date(toUTC(iso)).getUTCDay() as Weekday
}

/** Monday of the week containing `iso`. Weeks run Monday → Sunday. */
export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, -((weekdayOf(iso) + 6) % 7))
}

/** The `count` days ending on `iso`, oldest first. */
export function lastDays(iso: ISODate, count: number): ISODate[] {
  return Array.from({ length: count }, (_, i) => addDays(iso, i - count + 1))
}

export function dayOfMonth(iso: ISODate): number {
  return Number(iso.slice(8, 10))
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/** "Fri 13 Nov" */
export function formatDay(iso: ISODate): string {
  const month = MONTH_SHORT[Number(iso.slice(5, 7)) - 1]
  return `${WEEKDAY_SHORT[weekdayOf(iso)]} ${dayOfMonth(iso)} ${month}`
}

/** "14:05" → "2:05 PM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`
}

/** A static (non-ticking) label for when a feed item happened. */
export function formatWhen(date: ISODate, time: string, today: ISODate): string {
  const ago = diffDays(date, today)
  if (ago <= 0) return formatTime(time)
  if (ago === 1) return `Yesterday, ${formatTime(time)}`
  return formatDay(date)
}
