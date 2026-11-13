import { PartyPopper, Plus, Snowflake, Sprout } from 'lucide-react'
import { formatDay } from '../lib/dates'
import { activeHabits, type DayProgress } from '../lib/game'
import type { NewHabit } from '../lib/reducer'
import { freezeUsedInWeek, isScheduled } from '../lib/streaks'
import type { FreezeUse, Habit, ISODate } from '../types'
import { DayStrip } from './DayStrip'
import { HabitCard } from './HabitCard'
import { WeeklyChart } from './WeeklyChart'

interface Props {
  habits: Habit[]
  freezes: FreezeUse[]
  today: ISODate
  selected: ISODate
  /** Seven days ending today, oldest first. */
  week: DayProgress[]
  onSelect: (date: ISODate) => void
  onToggle: (habit: Habit) => void
  onArchive: (habit: Habit) => void
  onOpenAdd: () => void
  onQuickAdd: (habit: NewHabit) => void
}

const STARTERS: NewHabit[] = [
  { title: 'Drink 2L of water', icon: 'droplets', category: 'Health', difficulty: 'easy', schedule: [0, 1, 2, 3, 4, 5, 6] },
  { title: 'Read 20 pages', icon: 'book', category: 'Study', difficulty: 'medium', schedule: [0, 1, 2, 3, 4, 5, 6] },
  { title: 'Gym session', icon: 'dumbbell', category: 'Fitness', difficulty: 'hard', schedule: [1, 3, 5] },
]

export function MyHabits({
  habits,
  freezes,
  today,
  selected,
  week,
  onSelect,
  onToggle,
  onArchive,
  onOpenAdd,
  onQuickAdd,
}: Props) {
  const active = activeHabits(habits)
  const due = active.filter((h) => isScheduled(h, selected))
  const notDue = active.filter((h) => !isScheduled(h, selected))
  const day = week.find((d) => d.date === selected)
  const isToday = selected === today
  const allDone = isToday && due.length > 0 && day?.done === due.length

  const freeze = freezeUsedInWeek(freezes, today)
  const frozenHabit = freeze && habits.find((h) => h.id === freeze.habitId)

  if (active.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-12 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/30">
          <Sprout className="size-8" aria-hidden="true" />
        </span>
        <h2 className="text-ink mt-4 text-xl font-extrabold tracking-tight">Plant your first habit</h2>
        <p className="text-muted mt-1 max-w-sm text-sm">
          Check in each day to grow a streak, earn XP and climb from Bronze to Diamond. Start with one
          — small and specific works best.
        </p>
        <button
          type="button"
          onClick={onOpenAdd}
          className="focus-ring mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-700"
        >
          <Plus className="size-4" strokeWidth={3} aria-hidden="true" />
          Create a habit
        </button>
        <p className="text-muted mt-6 text-xs font-semibold">Or start with a popular one</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {STARTERS.map((starter) => (
            <button
              key={starter.title}
              type="button"
              onClick={() => onQuickAdd(starter)}
              className="focus-ring border-line text-ink rounded-full border px-3 py-1.5 text-xs font-bold transition hover:border-indigo-400 hover:bg-indigo-500/10"
            >
              + {starter.title}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DayStrip days={week} today={today} selected={selected} onSelect={onSelect} />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="section-title text-lg!">
          {isToday ? 'Today' : formatDay(selected)}
          {day && day.due > 0 && (
            <span className="text-muted ml-2 text-sm font-semibold">
              {day.done}/{day.due} done
            </span>
          )}
        </h2>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
            freeze ? 'bg-sunken text-muted' : 'bg-sky-400/15 text-sky-700 dark:text-sky-300'
          }`}
          title="One Streak Freeze per week. If you miss a scheduled day it is spent automatically to protect that streak."
        >
          <Snowflake className="size-3.5" aria-hidden="true" />
          {freeze
            ? `Freeze used · ${frozenHabit?.title ?? 'habit'}, ${formatDay(freeze.date)}`
            : 'Streak Freeze ready · 1 this week'}
        </span>

        <button
          type="button"
          onClick={onOpenAdd}
          className="focus-ring ml-auto inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-700"
        >
          <Plus className="size-4" strokeWidth={3} aria-hidden="true" />
          Add habit
        </button>
      </div>

      {!isToday && (
        <p className="text-muted flex items-center gap-2 text-xs font-medium">
          Past days are read-only.
          <button
            type="button"
            onClick={() => onSelect(today)}
            className="focus-ring rounded font-bold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
          >
            Back to today
          </button>
        </p>
      )}

      {allDone && (
        <p className="flex animate-rise items-center gap-2 rounded-2xl bg-emerald-500/12 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">
          <PartyPopper className="size-4.5" aria-hidden="true" />
          Everything done for today. See you tomorrow!
        </p>
      )}

      {due.length === 0 ? (
        <p className="card text-muted px-4 py-6 text-center text-sm font-medium">
          Nothing scheduled {isToday ? 'today — enjoy the rest day.' : 'on this day.'}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {due.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              today={today}
              selected={selected}
              freezes={freezes}
              onToggle={onToggle}
              onArchive={onArchive}
            />
          ))}
        </ul>
      )}

      {notDue.length > 0 && (
        <div>
          <h3 className="text-muted mb-2 text-xs font-bold tracking-wide uppercase">
            Not scheduled {isToday ? 'today' : 'this day'}
          </h3>
          <ul className="space-y-2.5">
            {notDue.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                today={today}
                selected={selected}
                freezes={freezes}
                onToggle={onToggle}
                onArchive={onArchive}
              />
            ))}
          </ul>
        </div>
      )}

      <WeeklyChart days={week} today={today} selected={selected} onSelect={onSelect} />
    </div>
  )
}
