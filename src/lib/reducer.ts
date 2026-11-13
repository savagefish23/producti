import type {
  AppState,
  Category,
  Difficulty,
  FeedItem,
  ISODate,
  StatusKind,
  Theme,
  Weekday,
} from '../types'
import { addDays } from './dates'
import { createSeed } from './seed'
import {
  CHEER_LINES,
  friendCheckins,
  NUDGE_BONUS_XP,
  NUDGE_LINES,
  pickLine,
  sortFeed,
  THANKS_LINES,
} from './social'
import { currentStreak, isCompleted, isScheduled, settleFreezes } from './streaks'

/*
 * Every state change in the app goes through this pure reducer. Anything
 * impure (the clock, randomness) is read by the caller and passed in on the
 * action, so each transition is deterministic and unit-testable.
 */

/** When something happened: calendar day + wall-clock "HH:mm". */
interface Stamp {
  date: ISODate
  time: string
}

export interface NewHabit {
  title: string
  icon: string
  category: Category
  difficulty: Difficulty
  schedule: Weekday[]
}

export type Action =
  | ({ type: 'toggleHabit'; habitId: string } & Stamp)
  | ({ type: 'addHabit'; habit: NewHabit } & Stamp)
  | ({ type: 'archiveHabit'; habitId: string } & Stamp)
  | ({ type: 'setStatus'; status: StatusKind } & Stamp)
  | { type: 'cheer'; itemId: string }
  | ({ type: 'nudge'; friendId: string } & Stamp)
  | ({ type: 'friendThanks'; friendId: string; variant: number } & Stamp)
  | ({ type: 'friendCheer'; friendId: string; habitId: string; variant: number } & Stamp)
  | ({ type: 'friendNudgedCheckin'; friendId: string; variant: number } & Stamp)
  | ({ type: 'rollover' } & Stamp)
  | { type: 'setTheme'; theme: Theme }
  | { type: 'advanceDays'; days: number }
  | { type: 'setFastReplies'; on: boolean }
  | ({ type: 'resetDemo' } & Stamp)
  | ({ type: 'clearAll' } & Stamp)

const FEED_LIMIT = 60

function pushFeed(state: AppState, item: Omit<FeedItem, 'id'>, id?: string): AppState {
  const feedItem: FeedItem = { ...item, id: id ?? `f${state.nextId}` }
  return {
    ...state,
    feed: [feedItem, ...state.feed].slice(0, FEED_LIMIT),
    nextId: state.nextId + 1,
  }
}

const myCheckinId = (habitId: string, date: ISODate) => `me-${habitId}-${date}`

export function hasNudged(state: AppState, friendId: string, date: ISODate): boolean {
  return state.nudges.some((n) => n.friendId === friendId && n.date === date)
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'toggleHabit': {
      const habit = state.habits.find((h) => h.id === action.habitId)
      // Only today's scheduled habits can be checked — the past is read-only.
      if (!habit || habit.archivedOn || !isScheduled(habit, action.date)) return state

      const wasDone = isCompleted(habit, action.date)
      const updated = {
        ...habit,
        completions: wasDone
          ? habit.completions.filter((d) => d !== action.date)
          : [...habit.completions, action.date],
      }
      const next = { ...state, habits: state.habits.map((h) => (h.id === habit.id ? updated : h)) }
      const feedId = myCheckinId(habit.id, action.date)

      if (wasDone) return { ...next, feed: next.feed.filter((f) => f.id !== feedId) }
      return pushFeed(
        next,
        {
          actor: 'me',
          kind: 'checkin',
          text: `checked in ${habit.title}`,
          streak: currentStreak(updated, action.date, state.freezes),
          date: action.date,
          time: action.time,
        },
        feedId,
      )
    }

    case 'addHabit': {
      const title = action.habit.title.trim()
      if (!title || action.habit.schedule.length === 0) return state
      return {
        ...state,
        habits: [
          ...state.habits,
          {
            ...action.habit,
            title,
            id: `h${state.nextId}-${action.date}`,
            createdOn: action.date,
            completions: [],
          },
        ],
        nextId: state.nextId + 1,
      }
    }

    case 'archiveHabit':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.habitId ? { ...h, archivedOn: action.date } : h,
        ),
      }

    case 'setStatus': {
      if (state.profile.status === action.status) return state
      const next = { ...state, profile: { ...state.profile, status: action.status } }
      const text = action.status === 'Idle' ? 'went idle' : `switched to ${action.status}`
      return pushFeed(next, { actor: 'me', kind: 'status', text, date: action.date, time: action.time })
    }

    case 'cheer':
      return {
        ...state,
        feed: state.feed.map((f) => (f.id === action.itemId ? { ...f, cheered: true } : f)),
      }

    case 'nudge':
      if (hasNudged(state, action.friendId, action.date)) return state
      return {
        ...state,
        // Only today's nudges matter; older ones are dropped as we go.
        nudges: [
          ...state.nudges.filter((n) => n.date === action.date),
          { friendId: action.friendId, date: action.date },
        ],
      }

    case 'friendThanks':
      return pushFeed(state, {
        actor: action.friendId,
        kind: 'thanks',
        text: pickLine(THANKS_LINES, action.variant),
        date: action.date,
        time: action.time,
      })

    case 'friendCheer': {
      const habit = state.habits.find((h) => h.id === action.habitId)
      // The user may have un-checked the habit before the reply landed.
      if (!habit || !isCompleted(habit, action.date)) return state
      return pushFeed(state, {
        actor: action.friendId,
        kind: 'cheer',
        text: pickLine(CHEER_LINES, action.variant, habit.title),
        date: action.date,
        time: action.time,
      })
    }

    case 'friendNudgedCheckin': {
      const friend = state.friends.find((f) => f.id === action.friendId)
      if (!friend) return state
      const habit = friend.habits[Math.abs(action.variant) % friend.habits.length]
      const next: AppState = {
        ...state,
        friendBonus: [
          ...state.friendBonus,
          { friendId: friend.id, date: action.date, xp: NUDGE_BONUS_XP },
        ],
      }
      return pushFeed(next, {
        actor: friend.id,
        kind: 'checkin',
        text: pickLine(NUDGE_LINES, action.variant, habit),
        date: action.date,
        time: action.time,
      })
    }

    case 'rollover': {
      const from = state.lastSeenDate
      if (action.date === from) return state
      // Clock moved backwards (e.g. a timezone change): nothing to settle.
      if (action.date < from) return { ...state, lastSeenDate: action.date }

      const freezes = settleFreezes(state.habits, state.freezes, from, action.date)

      // Friends kept going while the user was away: backfill up to three days.
      const firstNewDay = addDays(from, 1)
      const backfillFrom = addDays(action.date, -2) > firstNewDay ? addDays(action.date, -2) : firstNewDay
      let nextId = state.nextId
      const fresh: FeedItem[] = []
      for (let day = backfillFrom; day <= action.date; day = addDays(day, 1)) {
        const upTo = day === action.date ? action.time : undefined
        for (const item of friendCheckins(state.friends, day, upTo)) {
          fresh.push({ ...item, id: `f${nextId++}` })
        }
      }

      return {
        ...state,
        freezes,
        feed: sortFeed([...fresh, ...state.feed]).slice(0, FEED_LIMIT),
        lastSeenDate: action.date,
        nextId,
      }
    }

    case 'setTheme':
      return { ...state, theme: action.theme }

    case 'advanceDays':
      return { ...state, dayOffset: state.dayOffset + Math.max(0, action.days) }

    case 'setFastReplies':
      return { ...state, fastReplies: action.on }

    case 'resetDemo':
      return { ...createSeed(action.date, action.time, state.theme), fastReplies: state.fastReplies }

    case 'clearAll':
      // A genuinely fresh start: no habits, no history — shows the empty states.
      return {
        ...createSeed(action.date, action.time, state.theme),
        habits: [],
        freezes: [],
        fastReplies: state.fastReplies,
      }
  }
}
