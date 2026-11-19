import { Check, Plus, Snowflake, Sprout } from 'lucide-react'
import { formatDay } from '../lib/dates'
import { activeHabits, type DayProgress } from '../lib/game'
import type { NewHabit } from '../lib/reducer'
import { freezeUsedInWeek, isScheduled } from '../lib/streaks'
import type { FreezeUse, Habit, ISODate } from '../types'
import { DayStrip } from './DayStrip'
import { HabitCard } from './HabitCard'

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
        <span className="bg-raised text-ink-2 flex size-12 items-center justify-center rounded-xl">
          <Sprout className="size-6" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-semibold">No habits yet</h2>
        <p className="text-ink-2 mt-2 max-w-sm text-sm">
          Check in each day to build a streak, earn XP and move from Bronze to Diamond. One small,
          specific habit is a good start.
        </p>
        <button type="button" onClick={onOpenAdd} className="btn btn-primary mt-6 h-10">
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          Create a habit
        </button>
        <p className="text-ink-2 mt-8 text-[13px]">Or start with one of these</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {STARTERS.map((starter) => (
            <button key={starter.title} type="button" onClick={() => onQuickAdd(starter)} className="btn btn-sm btn-secondary">
              {starter.title}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DayStrip days={week} today={today} selected={selected} onSelect={onSelect} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="text-lg font-semibold">{isToday ? 'Habits' : formatDay(selected)}</h2>
          {day && day.due > 0 && (
            <span className="mono text-ink-2 text-[13px]">
              {day.done} of {day.due} done
            </span>
          )}
          <button type="button" onClick={onOpenAdd} className="btn btn-primary ml-auto">
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Add habit
          </button>
        </div>

        <p
          className="text-ink-2 flex items-center gap-2 text-[13px]"
          title="One Streak Freeze per week. If you miss a scheduled day it is spent automatically to protect that streak."
        >
          <Snowflake className="text-muted size-4" strokeWidth={1.5} aria-hidden="true" />
          {freeze
            ? `Streak Freeze used on ${frozenHabit?.title ?? 'a habit'}, ${formatDay(freeze.date)}`
            : 'Streak Freeze ready, 1 per week'}
        </p>

        {!isToday && (
          <p className="text-ink-2 flex items-center gap-2 text-[13px]">
            Past days are read-only
            <button type="button" onClick={() => onSelect(today)} className="btn btn-sm btn-ghost text-accent-text">
              Back to today
            </button>
          </p>
        )}

        {allDone && (
          <p className="text-ink flex items-center gap-2 text-sm">
            <Check className="text-positive size-4" strokeWidth={2} aria-hidden="true" />
            All {due.length} done today
          </p>
        )}
      </div>

      {due.length === 0 ? (
        <p className="card text-ink-2 px-4 py-6 text-center text-sm">
          {isToday ? 'Nothing scheduled today' : 'Nothing scheduled on this day'}
        </p>
      ) : (
        <ul className="space-y-2">
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
          <h3 className="text-ink-2 mb-2 text-[13px]">Not scheduled {isToday ? 'today' : 'this day'}</h3>
          <ul className="space-y-2">
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

    </div>
  )
}
