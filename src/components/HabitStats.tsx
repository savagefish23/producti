import { activeHabits, habitXp } from '../lib/game'
import { completionRate, currentStreak, longestStreak } from '../lib/streaks'
import type { FreezeUse, Habit, ISODate } from '../types'
import { HabitGlyph } from './HabitGlyph'
import { Streak } from './Streak'
import { CATEGORY_DOT, formatNumber } from './styles'

interface Props {
  habits: Habit[]
  freezes: FreezeUse[]
  today: ISODate
}

/** Per-habit table: streaks, 30-day completion, check-ins and XP. */
export function HabitStats({ habits, freezes, today }: Props) {
  const rows = activeHabits(habits).map((habit) => ({
    habit,
    streak: currentStreak(habit, today, freezes),
    best: longestStreak(habit, today, freezes),
    rate: completionRate(habit, today, 30),
    checkins: habit.completions.length,
    xp: habit.completions.length * habitXp(habit),
  }))

  return (
    <section className="card overflow-hidden" aria-labelledby="habit-stats-title">
      <div className="px-5 pt-5 pb-4">
        <h2 id="habit-stats-title" className="text-base font-semibold">
          By habit
        </h2>
        <p className="text-ink-2 text-[13px]">Completion counts scheduled days in the last 30 days</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-ink-2 border-line border-t px-5 py-8 text-center text-sm">No habits yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-line text-ink-2 border-y text-left text-xs">
                <th scope="col" className="px-5 py-2 font-medium">Habit</th>
                <th scope="col" className="px-3 py-2 font-medium">Streak</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Best</th>
                <th scope="col" className="w-40 px-3 py-2 font-medium">30 days</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Check-ins</th>
                <th scope="col" className="px-5 py-2 text-right font-medium">XP</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map(({ habit, streak, best, rate, checkins, xp }) => (
                <tr key={habit.id} className="hover:bg-raised/50 transition-colors duration-150">
                  <th scope="row" className="px-5 py-3 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <span className="bg-raised text-ink-2 flex size-8 shrink-0 items-center justify-center rounded-lg" aria-hidden="true">
                        <HabitGlyph name={habit.icon} className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{habit.title}</span>
                        <span className="text-ink-2 flex items-center gap-1.5 text-xs">
                          <span className={`size-1.5 rounded-full ${CATEGORY_DOT[habit.category]}`} aria-hidden="true" />
                          {habit.category}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="px-3 py-3">
                    <Streak count={streak} size="sm" />
                  </td>
                  <td className="mono text-ink-2 px-3 py-3 text-right">{best}</td>
                  <td className="px-3 py-3">
                    {rate === null ? (
                      <span className="mono text-muted text-xs">–</span>
                    ) : (
                      <span className="flex items-center gap-3">
                        <span className="bg-raised h-1.5 flex-1 overflow-hidden rounded-full" aria-hidden="true">
                          <span
                            className="bg-accent block h-full origin-left rounded-full"
                            style={{ transform: `scaleX(${rate})` }}
                          />
                        </span>
                        <span className="mono w-10 text-right text-xs">{Math.round(rate * 100)}%</span>
                      </span>
                    )}
                  </td>
                  <td className="mono text-ink-2 px-3 py-3 text-right">{checkins}</td>
                  <td className="mono px-5 py-3 text-right">{formatNumber(xp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
