import type { AppState, Friend, Habit, ISODate, Theme, Weekday } from '../types'
import { addDays, startOfWeek } from './dates'
import { friendCheckins, rand, sortFeed } from './social'
import { isScheduled } from './streaks'

const DAILY: Weekday[] = [0, 1, 2, 3, 4, 5, 6]

export const SEED_FRIENDS: Friend[] = [
  {
    id: 'alex',
    name: 'Alex Rivera',
    color: 'violet',
    consistency: 0.96,
    intensity: 110,
    habits: ['Deep work block', 'Morning run', 'Inbox zero'],
  },
  {
    id: 'maya',
    name: 'Maya Chen',
    color: 'rose',
    consistency: 0.9,
    intensity: 95,
    habits: ['Yoga flow', 'Read 30 pages', 'No sugar'],
  },
  {
    id: 'jordan',
    name: 'Jordan Blake',
    color: 'amber',
    consistency: 0.82,
    intensity: 80,
    habits: ['Gym session', 'Meal prep', 'Stretching'],
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    color: 'emerald',
    consistency: 0.88,
    intensity: 65,
    habits: ['Spanish practice', 'Journal', 'Walk 8k steps'],
  },
  {
    id: 'sam',
    name: 'Sam Okafor',
    color: 'sky',
    consistency: 0.7,
    intensity: 70,
    habits: ['Cold shower', 'Code kata', 'Sleep by 11'],
  },
]

interface SeedHabit {
  habit: Omit<Habit, 'completions' | 'createdOn'>
  /** Scheduled days immediately before today that are all completed. */
  liveDays: number
  /** Completion rate for the older, patchier history. */
  rate: number
}

const SEED_HABITS: SeedHabit[] = [
  {
    habit: { id: 'h1', title: 'Drink 2L of water', icon: 'droplets', category: 'Health', schedule: DAILY },
    liveDays: 12,
    rate: 0.85,
  },
  {
    habit: { id: 'h2', title: 'Deep work block', icon: 'target', category: 'Focus', schedule: [1, 2, 3, 4, 5] },
    liveDays: 9,
    rate: 0.8,
  },
  {
    habit: { id: 'h3', title: 'Read 20 pages', icon: 'book', category: 'Study', schedule: DAILY },
    liveDays: 28, // one gap at day −8, covered by a Streak Freeze
    rate: 1,
  },
  {
    habit: { id: 'h4', title: 'Gym session', icon: 'dumbbell', category: 'Fitness', schedule: [1, 3, 5] },
    liveDays: 8,
    rate: 0.75,
  },
  {
    habit: { id: 'h5', title: 'Meditate 10 min', icon: 'brain', category: 'Focus', schedule: DAILY },
    liveDays: 3,
    rate: 0.7,
  },
]

const HISTORY_DAYS = 28
/** The seeded missed day (relative to today) that last week's freeze covered. */
const FROZEN_DAYS_AGO = 8

/**
 * Realistic demo data, generated relative to `today` so a fresh install
 * always opens on live streaks and a populated week.
 */
export function createSeed(today: ISODate, time: string, theme: Theme = 'light'): AppState {
  const createdOn = addDays(today, -HISTORY_DAYS)
  const frozenDay = addDays(today, -FROZEN_DAYS_AGO)

  const habits: Habit[] = SEED_HABITS.map(({ habit, liveDays, rate }) => {
    const base: Habit = { ...habit, createdOn, completions: [] }
    const completions: ISODate[] = []
    for (let ago = HISTORY_DAYS; ago >= 1; ago--) {
      const day = addDays(today, -ago)
      if (!isScheduled(base, day)) continue
      if (habit.id === 'h3' && day === frozenDay) continue
      const live = ago <= liveDays
      const breaksStreak = ago === liveDays + 1
      if (live || (!breaksStreak && rand(`${habit.id}|${day}`) < rate)) completions.push(day)
    }
    return { ...base, completions }
  })

  const feed = sortFeed(
    [0, 1, 2]
      .flatMap((ago) => friendCheckins(SEED_FRIENDS, addDays(today, -ago), ago === 0 ? time : undefined))
      .map((item, i) => ({ ...item, id: `seed-${i}` })),
  )

  return {
    signedIn: false,
    profile: { name: 'You', username: 'you', email: '', notifications: false, status: 'Idle' },
    theme,
    habits,
    freezes: [{ habitId: 'h3', date: frozenDay, weekStart: startOfWeek(frozenDay) }],
    friends: SEED_FRIENDS,
    feed,
    friendBonus: [],
    nudges: [],
    lastSeenDate: today,
    dayOffset: 0,
    fastReplies: false,
    nextId: 1,
  }
}
