import { describe, expect, it } from 'vitest'
import type { AppState } from '../types'
import { addDays } from './dates'
import { totalXp } from './game'
import { reducer } from './reducer'
import { createSeed } from './seed'
import { LIMITS, sanitizeState } from './validate'

/*
 * Each case is an attack that was tried against the running app: tampered
 * saved data that used to crash it, freeze it or corrupt the numbers.
 */

const TODAY = '2026-11-19'
const isIcon = (key: string) => ['target', 'book', 'sparkles', 'droplets', 'dumbbell', 'brain'].includes(key)
const seed = (): AppState => ({ ...createSeed(TODAY, '12:00'), signedIn: true })
// Loose clone so tests can put the wrong types in.
const tamper = (edit: (s: any) => void): unknown => {
  const s = JSON.parse(JSON.stringify(seed()))
  edit(s)
  return s
}
const load = (raw: unknown) => sanitizeState(raw, TODAY, isIcon)

describe('sanitizeState: tampered saved data', () => {
  it('accepts untouched data unchanged', () => {
    expect(load(seed())).toEqual(seed())
  })

  it('replaces an icon key that would hit Object.prototype', () => {
    for (const icon of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      expect(load(tamper((s) => (s.habits[0].icon = icon)))!.habits[0].icon).toBe('sparkles')
    }
  })

  it('drops habits whose fields have the wrong type', () => {
    const out = load(
      tamper((s) => {
        s.habits[0].completions = 'oops'
        s.habits[1] = null
        s.habits[2].schedule = ['x', 99, null]
        s.habits[3].id = '<img src=x>'
      }),
    )!
    expect(out.habits[0].completions).toEqual([]) // repaired
    expect(out.habits.map((h) => h.title)).toEqual(['Drink 2L of water', 'Meditate 10 min'])
  })

  it('never lets XP become NaN', () => {
    const out = load(tamper((s) => (s.habits[0].difficulty = 'legendary')))!
    expect(out.habits[0].difficulty).toBe('medium')
    expect(Number.isFinite(totalXp(out.habits))).toBe(true)
  })

  it('repairs the profile and caps string lengths', () => {
    const out = load(
      tamper((s) => {
        s.profile.name = { evil: true }
        s.profile.status = 'Hacking'
        s.habits[0].title = 'x'.repeat(10_000)
      }),
    )!
    expect(out.profile).toMatchObject({ name: 'Guest', status: 'Idle' })
    expect(out.habits[0].title).toHaveLength(LIMITS.habitTitle)
  })

  it('drops malformed feed items and items from unknown actors', () => {
    const out = load(
      tamper((s) => {
        s.feed[0] = { id: 'x' }
        s.feed[1].actor = 'stranger'
        s.feed[2].time = '99:99'
      }),
    )!
    expect(out.feed).toHaveLength(seed().feed.length - 3)
  })

  it('clamps numbers that would freeze the page', () => {
    const out = load(
      tamper((s) => {
        s.dayOffset = 1e12
        s.nextId = -5
        s.lastSeenDate = 'not-a-date'
      }),
    )!
    expect(out.dayOffset).toBe(LIMITS.dayOffset)
    expect(out.nextId).toBe(1)
    expect(out.lastSeenDate).toBe(TODAY)
  })

  it('caps list sizes', () => {
    const out = load(tamper((s) => (s.habits = Array.from({ length: 500 }, (_, i) => ({ ...s.habits[0], id: `h${i}` })))))!
    expect(out.habits).toHaveLength(LIMITS.habits)
  })

  it('drops duplicate habit ids so one toggle cannot flip two habits', () => {
    const out = load(tamper((s) => (s.habits[1].id = s.habits[0].id)))!
    expect(new Set(out.habits.map((h) => h.id)).size).toBe(out.habits.length)
  })

  it('rejects things that are not app state at all', () => {
    for (const raw of [null, 'text', 42, [], {}, { habits: 'no' }]) expect(load(raw)).toBeNull()
  })
})

describe('reducer: bounded work', () => {
  it('a ten-year jump in dates finishes quickly', () => {
    const start = performance.now()
    const s = reducer(seed(), { type: 'rollover', date: addDays(TODAY, 3650), time: '09:00' })
    expect(s.lastSeenDate).toBe(addDays(TODAY, 3650))
    expect(performance.now() - start).toBeLessThan(500)
  })

  it('time travel is capped', () => {
    const s = reducer(seed(), { type: 'advanceDays', days: 1e12 })
    expect(s.dayOffset).toBe(LIMITS.dayOffset)
  })

  it('caps habit titles even if the form is bypassed', () => {
    const s = reducer(seed(), {
      type: 'addHabit',
      habit: { title: 'y'.repeat(500), icon: 'target', category: 'Focus', difficulty: 'easy', schedule: [1] },
      date: TODAY,
      time: '09:00',
    })
    expect(s.habits.at(-1)!.title).toHaveLength(LIMITS.habitTitle)
  })
})
