import { describe, expect, it } from 'vitest'
import type { AppState, FreezeUse, Habit, Weekday } from '../types'
import { addDays, diffDays, lastDays, localToday, startOfWeek, weekdayOf } from './dates'
import { activeDayStreak, dayProgress, rankFor, totalXp, weeklyXp } from './game'
import { reducer } from './reducer'
import { createSeed } from './seed'
import { friendDayXp, friendStreak, friendWeeklyXp } from './social'
import { migrate, MIGRATIONS, SCHEMA_VERSION } from './storage'
import { completionRate, currentStreak, dayState, freezeAvailable, longestStreak, settleFreezes } from './streaks'

const DAILY: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
const MWF: Weekday[] = [1, 3, 5]

// 2026-11-13 is a Friday.
const FRI = '2026-11-13'

function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: 'h',
    title: 'Test',
    icon: 'target',
    category: 'Focus',
    difficulty: 'medium',
    schedule: DAILY,
    createdOn: '2026-10-01',
    completions: [],
    ...over,
  }
}

describe('dates', () => {
  it('does calendar arithmetic across month, year and DST boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30') // EU DST change
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2)
  })

  it('knows weekdays and Monday-based weeks', () => {
    expect(weekdayOf(FRI)).toBe(5)
    expect(startOfWeek(FRI)).toBe('2026-11-09')
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09') // Sunday belongs to the same week
    expect(lastDays(FRI, 3)).toEqual(['2026-11-11', '2026-11-12', FRI])
  })

  it('reads the local calendar day, not the UTC one', () => {
    expect(localToday(new Date(2026, 10, 13, 23, 59))).toBe(FRI)
    expect(localToday(new Date(2026, 10, 13, 0, 1))).toBe(FRI)
  })
})

describe('streaks', () => {
  it('counts consecutive completed days', () => {
    const h = habit({ completions: ['2026-11-10', '2026-11-11', '2026-11-12'] })
    expect(currentStreak(h, FRI, [])).toBe(3) // today pending, not broken
    expect(currentStreak({ ...h, completions: [...h.completions, FRI] }, FRI, [])).toBe(4)
  })

  it('breaks on a missed scheduled day', () => {
    const h = habit({ completions: ['2026-11-09', '2026-11-10', '2026-11-12'] })
    expect(currentStreak(h, FRI, [])).toBe(1)
  })

  it('counts scheduled days only for partial-week habits', () => {
    // Mon 9, Wed 11 done; Fri 6 the week before done. Tue/Thu/weekend are skipped.
    const h = habit({ schedule: MWF, completions: ['2026-11-06', '2026-11-09', '2026-11-11'] })
    expect(currentStreak(h, FRI, [])).toBe(3)
    expect(currentStreak(h, '2026-11-12', [])).toBe(3) // seen from an off day
    expect(currentStreak({ ...h, completions: ['2026-11-06', '2026-11-11'] }, FRI, [])).toBe(1)
  })

  it('a frozen day keeps the streak alive without growing it', () => {
    const h = habit({ completions: ['2026-11-10', '2026-11-12'] })
    const freeze: FreezeUse = { habitId: 'h', date: '2026-11-11', weekStart: '2026-11-09' }
    expect(currentStreak(h, FRI, [])).toBe(1)
    expect(currentStreak(h, FRI, [freeze])).toBe(2)
    expect(dayState(h, '2026-11-11', FRI, [freeze])).toBe('frozen')
    expect(dayState(h, '2026-11-11', FRI, [])).toBe('missed')
  })

  it('ignores days before the habit existed', () => {
    const h = habit({ createdOn: '2026-11-12', completions: ['2026-11-12'] })
    expect(currentStreak(h, FRI, [])).toBe(1)
  })
})

describe('habit stats', () => {
  it('finds the longest streak, bridging frozen days', () => {
    const h = habit({ createdOn: '2026-11-01', completions: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-08', '2026-11-10', '2026-11-11'] })
    expect(longestStreak(h, FRI, [])).toBe(3)
    const freeze: FreezeUse = { habitId: 'h', date: '2026-11-09', weekStart: '2026-11-09' }
    expect(longestStreak(h, FRI, [freeze])).toBe(3) // 8, 10, 11 joined by the freeze
    expect(longestStreak({ ...h, completions: [...h.completions, '2026-11-12'] }, FRI, [freeze])).toBe(4)
  })

  it('computes the completion rate over scheduled days, leaving today open', () => {
    const h = habit({ schedule: MWF, createdOn: '2026-10-01', completions: ['2026-11-09', '2026-11-11'] })
    // Last 7 days ending Fri 13: Mon 9 done, Wed 11 done, Fri 13 still open.
    expect(completionRate(h, FRI, 7)).toBe(1)
    expect(completionRate({ ...h, completions: ['2026-11-09'] }, FRI, 7)).toBe(0.5)
    expect(completionRate(habit({ createdOn: FRI }), FRI, 7)).toBeNull()
  })
})

describe('streak freeze', () => {
  it('spends one token per week, then streaks break', () => {
    const a = habit({ id: 'a', completions: ['2026-11-09', '2026-11-10'] })
    const b = habit({ id: 'b', completions: ['2026-11-09', '2026-11-10'] })
    // Both miss Wed 11. Only the first habit in the list gets the token.
    const freezes = settleFreezes([a, b], [], '2026-11-11', '2026-11-12')
    expect(freezes).toEqual([{ habitId: 'a', date: '2026-11-11', weekStart: '2026-11-09' }])
    expect(currentStreak(a, '2026-11-12', freezes)).toBe(2)
    expect(currentStreak(b, '2026-11-12', freezes)).toBe(0)
    expect(freezeAvailable(freezes, FRI)).toBe(false)
    expect(freezeAvailable(freezes, '2026-11-16')).toBe(true) // new week, new token
  })

  it('never wastes a token on a habit with no streak', () => {
    const h = habit({ completions: [] })
    expect(settleFreezes([h], [], '2026-11-10', FRI)).toEqual([])
  })

  it('does not settle today or unscheduled days', () => {
    const h = habit({ schedule: MWF, completions: ['2026-11-09'] })
    // Tue 10 is unscheduled; Wed 11 is "today" and still pending.
    expect(settleFreezes([h], [], '2026-11-10', '2026-11-11')).toEqual([])
  })

  it('a long absence freezes one day per week and then the streak dies', () => {
    const h = habit({ completions: ['2026-11-11', '2026-11-12'] })
    const freezes = settleFreezes([h], [], FRI, '2026-11-20')
    // Fri 13 frozen (week of the 9th); Sat 14 breaks the streak, so nothing later is protected.
    expect(freezes.map((f) => f.date)).toEqual([FRI])
    expect(currentStreak(h, '2026-11-20', freezes)).toBe(0)
  })
})

describe('xp and ranks', () => {
  it('weights XP by difficulty', () => {
    const habits = [
      habit({ id: 'e', difficulty: 'easy', completions: [FRI] }),
      habit({ id: 'm', difficulty: 'medium', completions: [FRI, '2026-11-12'] }),
      habit({ id: 'x', difficulty: 'hard', completions: ['2026-11-01'] }),
    ]
    expect(totalXp(habits)).toBe(10 + 50 + 50)
    expect(weeklyXp(habits, FRI)).toBe(10 + 50) // the 1st is a previous week
  })

  it('maps XP to rank tiers', () => {
    expect(rankFor(0).name).toBe('Bronze')
    expect(rankFor(749).name).toBe('Bronze')
    expect(rankFor(750)).toMatchObject({ name: 'Silver', next: 'Gold', xpToNext: 2000, progress: 0 })
    expect(rankFor(2750).name).toBe('Gold')
    expect(rankFor(99999)).toMatchObject({ name: 'Diamond', next: null, progress: 1 })
  })

  it('computes daily progress from scheduled habits only', () => {
    const habits = [
      habit({ id: 'a', completions: [FRI] }),
      habit({ id: 'b' }),
      habit({ id: 'c', schedule: [2] }), // Tuesdays — not due on Friday
      habit({ id: 'd', archivedOn: '2026-11-01' }),
    ]
    expect(dayProgress(habits, FRI)).toMatchObject({ done: 1, due: 2, ratio: 0.5 })
  })

  it('counts consecutive active days', () => {
    const habits = [habit({ completions: ['2026-11-11', '2026-11-12'] })]
    expect(activeDayStreak(habits, FRI)).toBe(2)
    expect(activeDayStreak(habits, '2026-11-14')).toBe(0)
  })
})

describe('reducer', () => {
  const seed = (): AppState => createSeed(FRI, '12:00')

  it('toggling a habit adds then removes exactly its XP and feed item', () => {
    const s0 = seed()
    const water = s0.habits[0]
    const s1 = reducer(s0, { type: 'toggleHabit', habitId: water.id, date: FRI, time: '12:01' })
    expect(totalXp(s1.habits) - totalXp(s0.habits)).toBe(10)
    expect(s1.feed[0]).toMatchObject({ actor: 'me', kind: 'checkin', streak: 13 })
    const s2 = reducer(s1, { type: 'toggleHabit', habitId: water.id, date: FRI, time: '12:02' })
    expect(totalXp(s2.habits)).toBe(totalXp(s0.habits))
    expect(s2.feed).toEqual(s0.feed)
  })

  it('refuses to complete a habit on a day it is not scheduled', () => {
    const s0 = seed()
    const gym = s0.habits.find((h) => h.title === 'Gym session')!
    const sat = '2026-11-14'
    expect(reducer(s0, { type: 'toggleHabit', habitId: gym.id, date: sat, time: '09:00' })).toBe(s0)
  })

  it('rollover settles freezes and is idempotent', () => {
    const s0 = seed()
    const next = addDays(FRI, 1)
    const s1 = reducer(s0, { type: 'rollover', date: next, time: '08:00' })
    expect(s1.lastSeenDate).toBe(next)
    expect(s1.freezes).toHaveLength(2) // seeded one + this week's token
    expect(reducer(s1, { type: 'rollover', date: next, time: '09:00' })).toBe(s1)
  })

  it('signing in sets the name and starts fresh or with sample data', () => {
    const fresh = reducer(seed(), { type: 'signIn', name: '  Sam  ', sampleData: false, date: FRI, time: '09:00' })
    expect(fresh).toMatchObject({ signedIn: true, profile: { name: 'Sam' }, habits: [] })
    const sample = reducer(seed(), { type: 'signIn', name: '', sampleData: true, date: FRI, time: '09:00' })
    expect(sample.profile.name).toBe('Guest')
    expect(sample.habits.length).toBe(5)
    expect(reducer(sample, { type: 'signOut', date: FRI, time: '09:00' }).signedIn).toBe(false)
  })

  it('archiving keeps earned XP', () => {
    const s0 = seed()
    const s1 = reducer(s0, { type: 'archiveHabit', habitId: s0.habits[1].id, date: FRI, time: '12:00' })
    expect(totalXp(s1.habits)).toBe(totalXp(s0.habits))
    expect(dayProgress(s1.habits, FRI).due).toBe(dayProgress(s0.habits, FRI).due - 1)
  })

  it('a nudge works once per friend per day and the reply grants bonus XP', () => {
    const s0 = seed()
    const alex = s0.friends[0]
    const s1 = reducer(s0, { type: 'nudge', friendId: alex.id, date: FRI, time: '12:00' })
    expect(reducer(s1, { type: 'nudge', friendId: alex.id, date: FRI, time: '12:01' })).toBe(s1)
    const s2 = reducer(s1, { type: 'friendNudgedCheckin', friendId: alex.id, variant: 1, date: FRI, time: '12:01' })
    expect(friendWeeklyXp(alex, FRI, s2.friendBonus) - friendWeeklyXp(alex, FRI, s1.friendBonus)).toBe(25)
    expect(s2.feed[0].actor).toBe(alex.id)
  })
})

describe('seed', () => {
  it('opens on live streaks, a frozen day and Silver rank on any weekday', () => {
    for (let i = 0; i < 7; i++) {
      const today = addDays(FRI, i)
      const s = createSeed(today, '12:00')
      const [water, , read] = s.habits
      expect(currentStreak(water, today, s.freezes)).toBe(12)
      expect(currentStreak(read, today, s.freezes)).toBe(27)
      expect(freezeAvailable(s.freezes, today)).toBe(true)
      const rank = rankFor(totalXp(s.habits))
      expect(rank.name).toBe('Silver')
      expect(rank.xpToNext).toBeLessThan(300)
    }
  })
})

describe('friend simulation', () => {
  it('is deterministic per day', () => {
    const friend = createSeed(FRI, '12:00').friends[0]
    expect(friendDayXp(friend, FRI)).toBe(friendDayXp(friend, FRI))
    expect(friendStreak(friend, FRI)).toBeGreaterThanOrEqual(0)
  })
})

describe('storage migrations', () => {
  it('upgrades old data step by step without losing it', () => {
    const migrations = {
      1: (d: unknown) => ({ ...(d as object), b: 2 }),
      2: (d: unknown) => ({ ...(d as object), c: 3 }),
    }
    expect(migrate({ schemaVersion: 1, data: { a: 1 } }, migrations, 3)).toEqual({ a: 1, b: 2, c: 3 })
    expect(migrate({ schemaVersion: 3, data: { a: 1 } }, migrations, 3)).toEqual({ a: 1 })
  })

  it('migrates saved v1 data to the current version and keeps it signed in', () => {
    const v1 = { ...createSeed(FRI, '12:00') } as Partial<AppState>
    delete v1.signedIn
    const out = migrate({ schemaVersion: 1, data: v1 }, MIGRATIONS, SCHEMA_VERSION) as AppState
    expect(out.signedIn).toBe(true)
    expect(out.habits).toEqual(v1.habits)
  })

  it('rejects data it cannot understand', () => {
    expect(migrate({ schemaVersion: 9, data: {} }, {}, 3)).toBeNull() // from a newer build
    expect(migrate({ schemaVersion: 1, data: {} }, {}, 3)).toBeNull() // missing step
    expect(migrate('garbage')).toBeNull()
  })
})
