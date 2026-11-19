import {
  CATEGORIES,
  STATUSES,
  type AppState,
  type FeedItem,
  type FeedKind,
  type FreezeUse,
  type Friend,
  type Habit,
  type ISODate,
  type Weekday,
} from '../types'
import { isValidEmail, isValidUsername, normalizeEmail, normalizeUsername, PROFILE_LIMITS } from './profile'

/*
 * Saved data is untrusted: it can be edited in dev tools, by an extension,
 * or left half-written by an old build. Everything loaded from storage passes
 * through `sanitizeState`, which keeps what is valid, repairs or drops what
 * is not, and never lets a bad value reach the UI (where it could crash a
 * render or freeze the page in a loop).
 *
 * Rules: unknown enum values fall back to a default, strings are length
 * capped, numbers are clamped, malformed list items are dropped. If the core
 * shape is missing entirely the result is null and the caller starts fresh.
 */

export const LIMITS = {
  name: 24,
  habitTitle: 40,
  feedText: 160,
  habits: 100,
  completionsPerHabit: 5000,
  feed: 60,
  friends: 20,
  /** Time travel is a demo tool; ten years is plenty. */
  dayOffset: 3650,
} as const

type Rec = Record<string, unknown>

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)

const ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
/** Ids are ours: short and plain. Anything else is rejected. */
const ID = /^[\w-]{1,64}$/

export const isISODate = (v: unknown): v is ISODate => typeof v === 'string' && ISO.test(v)

function str(v: unknown, max: number, fallback = ''): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}

function int(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.trunc(v))) : fallback
}

function list(v: unknown, max: number): unknown[] {
  return Array.isArray(v) ? v.slice(0, max) : []
}

function habit(v: unknown, isIcon: (key: string) => boolean): Habit | null {
  if (!isRec(v) || typeof v.id !== 'string' || !ID.test(v.id) || !isISODate(v.createdOn)) return null
  const title = str(v.title, LIMITS.habitTitle).trim()
  const schedule = [...new Set(list(v.schedule, 7).filter((d): d is Weekday => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6))]
  if (!title || schedule.length === 0) return null
  const icon = typeof v.icon === 'string' && isIcon(v.icon) ? v.icon : 'sparkles'
  return {
    id: v.id,
    title,
    icon,
    category: oneOf(v.category, CATEGORIES, 'Health'),
    schedule: schedule.sort(),
    createdOn: v.createdOn,
    completions: [...new Set(list(v.completions, LIMITS.completionsPerHabit).filter(isISODate))],
    ...(isISODate(v.archivedOn) ? { archivedOn: v.archivedOn } : {}),
  }
}

function freeze(v: unknown): FreezeUse | null {
  if (!isRec(v) || typeof v.habitId !== 'string' || !isISODate(v.date) || !isISODate(v.weekStart)) return null
  return { habitId: v.habitId, date: v.date, weekStart: v.weekStart }
}

function friend(v: unknown): Friend | null {
  if (!isRec(v) || typeof v.id !== 'string' || !ID.test(v.id) || v.id === 'me') return null
  const name = str(v.name, LIMITS.name).trim()
  const habits = list(v.habits, 10).filter((h): h is string => typeof h === 'string').map((h) => h.slice(0, LIMITS.habitTitle))
  if (!name || habits.length === 0) return null
  return {
    id: v.id,
    name,
    color: str(v.color, 16, 'violet'),
    consistency: typeof v.consistency === 'number' && v.consistency >= 0 && v.consistency <= 1 ? v.consistency : 0.5,
    intensity: int(v.intensity, 10, 500, 60),
    habits,
  }
}

const FEED_KINDS: readonly FeedKind[] = ['checkin', 'status', 'thanks', 'cheer']

function feedItem(v: unknown): FeedItem | null {
  if (!isRec(v) || typeof v.id !== 'string' || !ID.test(v.id) || typeof v.actor !== 'string' || !ID.test(v.actor)) return null
  if (!isISODate(v.date) || typeof v.time !== 'string' || !TIME.test(v.time)) return null
  const text = str(v.text, LIMITS.feedText)
  if (!text) return null
  return {
    id: v.id,
    actor: v.actor,
    kind: oneOf(v.kind, FEED_KINDS, 'checkin'),
    text,
    ...(typeof v.streak === 'number' ? { streak: int(v.streak, 0, 100000, 0) } : {}),
    date: v.date,
    time: v.time,
    ...(v.cheered === true ? { cheered: true } : {}),
  }
}

const keep = <T,>(items: (T | null)[]): T[] => items.filter((x): x is T => x !== null)

/**
 * Validate and repair loaded state. `fallbackToday` replaces a missing or
 * corrupt `lastSeenDate`. Returns null when the data is not app state at all.
 */
export function sanitizeState(
  raw: unknown,
  fallbackToday: ISODate,
  isIcon: (key: string) => boolean,
): AppState | null {
  if (!isRec(raw) || !Array.isArray(raw.habits) || !isRec(raw.profile)) return null
  const profile = raw.profile

  const habits = keep(list(raw.habits, LIMITS.habits).map((h) => habit(h, isIcon)))
  // Ids must be unique, or toggling one habit would toggle another.
  const seen = new Set<string>()
  const uniqueHabits = habits.filter((h) => !seen.has(h.id) && seen.add(h.id))

  const friends = keep(list(raw.friends, LIMITS.friends).map(friend))
  const friendIds = new Set(friends.map((f) => f.id))
  const knownActor = (actor: string) => actor === 'me' || friendIds.has(actor)

  return {
    signedIn: raw.signedIn === true,
    profile: {
      name: str(profile.name, PROFILE_LIMITS.fullName).trim() || 'Guest',
      username: (() => {
        const u = normalizeUsername(str(profile.username, 64))
        return isValidUsername(u) ? u : 'you'
      })(),
      email: (() => {
        const e = normalizeEmail(str(profile.email, PROFILE_LIMITS.email + 1))
        return isValidEmail(e) ? e : ''
      })(),
      notifications: profile.notifications === true,
      status: oneOf(profile.status, STATUSES, 'Idle'),
    },
    theme: raw.theme === 'dark' ? 'dark' : 'light',
    habits: uniqueHabits,
    freezes: keep(list(raw.freezes, 1000).map(freeze)),
    friends,
    feed: keep(list(raw.feed, LIMITS.feed).map(feedItem)).filter((f) => knownActor(f.actor)),
    friendBonus: list(raw.friendBonus, 500).flatMap((b) =>
      isRec(b) && typeof b.friendId === 'string' && friendIds.has(b.friendId) && isISODate(b.date)
        ? [{ friendId: b.friendId, date: b.date, xp: int(b.xp, 0, 100, 0) }]
        : [],
    ),
    nudges: list(raw.nudges, 100).flatMap((n) =>
      isRec(n) && typeof n.friendId === 'string' && isISODate(n.date) ? [{ friendId: n.friendId, date: n.date }] : [],
    ),
    lastSeenDate: isISODate(raw.lastSeenDate) ? raw.lastSeenDate : fallbackToday,
    dayOffset: int(raw.dayOffset, 0, LIMITS.dayOffset, 0),
    fastReplies: raw.fastReplies === true,
    nextId: int(raw.nextId, 1, Number.MAX_SAFE_INTEGER, 1),
  }
}
