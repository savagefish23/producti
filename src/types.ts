/** A calendar day as an ISO string, e.g. "2026-11-13". Never a timestamp. */
export type ISODate = string

/** 0 = Sunday … 6 = Saturday (same as Date#getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const CATEGORIES = ['Health', 'Focus', 'Study', 'Fitness'] as const
export type Category = (typeof CATEGORIES)[number]

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const STATUSES = ['Deep Work', 'At the Gym', 'Reading', 'Idle'] as const
export type StatusKind = (typeof STATUSES)[number]

export type Theme = 'light' | 'dark'

export interface Habit {
  id: string
  title: string
  /** Key into the icon registry (components/icons.ts). */
  icon: string
  category: Category
  difficulty: Difficulty
  /** Weekdays this habit is due on. All seven = daily. */
  schedule: Weekday[]
  createdOn: ISODate
  /** Days the habit was completed. */
  completions: ISODate[]
  /** Set when the user removes a habit. Kept so earned XP is never lost. */
  archivedOn?: ISODate
}

/** A missed scheduled day that was covered by that week's Streak Freeze token. */
export interface FreezeUse {
  habitId: string
  date: ISODate
  /** Monday of the week the token belongs to. */
  weekStart: ISODate
}

export interface Friend {
  id: string
  name: string
  /** Key into the avatar colour map. */
  color: string
  /** 0–1: chance the friend is active on any given day. */
  consistency: number
  /** Typical XP earned on an active day. */
  intensity: number
  habits: string[]
}

export type FeedKind = 'checkin' | 'status' | 'thanks' | 'cheer'

export interface FeedItem {
  id: string
  /** A friend id, or "me". */
  actor: string
  kind: FeedKind
  text: string
  streak?: number
  date: ISODate
  /** Local wall-clock time "HH:mm" — display only. */
  time: string
  /** The user has cheered this item. */
  cheered?: boolean
}

export interface AppState {
  profile: { name: string; handle: string; status: StatusKind }
  theme: Theme
  habits: Habit[]
  freezes: FreezeUse[]
  friends: Friend[]
  /** Newest first. */
  feed: FeedItem[]
  /** Extra XP friends earned from scripted reactions (e.g. after a nudge). */
  friendBonus: { friendId: string; date: ISODate; xp: number }[]
  nudges: { friendId: string; date: ISODate }[]
  /** Last day the app processed. Days between this and today get "rolled over". */
  lastSeenDate: ISODate
  /** Dev time-travel: days added to the real date. */
  dayOffset: number
  /** Dev: shorten scripted friend replies to a few seconds. */
  fastReplies: boolean
  nextId: number
}
