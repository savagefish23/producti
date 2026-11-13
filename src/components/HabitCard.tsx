import { Check, Flame, Snowflake, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { formatDay, lastDays, WEEKDAY_SHORT, weekdayOf } from '../lib/dates'
import { habitXp } from '../lib/game'
import { currentStreak, dayState, type DayState } from '../lib/streaks'
import type { FreezeUse, Habit, ISODate, Weekday } from '../types'
import { HabitGlyph } from './HabitGlyph'
import { CATEGORY_STYLES, DIFFICULTY_LABEL } from './styles'

interface Props {
  habit: Habit
  today: ISODate
  /** The day picked in the calendar strip. Only today can be checked off. */
  selected: ISODate
  freezes: FreezeUse[]
  onToggle: (habit: Habit) => void
  onArchive: (habit: Habit) => void
}

const DOT_STYLE: Record<DayState, string> = {
  done: 'bg-indigo-500 text-white',
  frozen: 'bg-sky-400/20 text-sky-600 dark:text-sky-300',
  missed: 'bg-sunken text-muted line-through',
  pending: 'bg-sunken text-ink ring-2 ring-indigo-400/70',
  upcoming: 'bg-sunken text-muted',
  off: 'text-muted/50',
}

const DOT_LABEL: Record<DayState, string> = {
  done: 'done',
  frozen: 'missed, covered by Streak Freeze',
  missed: 'missed',
  pending: 'not done yet',
  upcoming: 'upcoming',
  off: 'not scheduled',
}

function scheduleLabel(habit: Habit): string {
  if (habit.schedule.length === 7) return 'Daily'
  // Monday-first order reads more naturally than Sunday-first.
  return [1, 2, 3, 4, 5, 6, 0]
    .filter((d) => habit.schedule.includes(d as Weekday))
    .map((d) => WEEKDAY_SHORT[d])
    .join(' · ')
}

export function HabitCard({ habit, today, selected, freezes, onToggle, onArchive }: Props) {
  const [confirming, setConfirming] = useState(false)
  // Bumped on each completion so the "+XP" burst re-mounts and replays.
  const [burst, setBurst] = useState(0)

  const styles = CATEGORY_STYLES[habit.category]
  const streak = currentStreak(habit, today, freezes)
  const state = dayState(habit, selected, today, freezes)
  const isToday = selected === today
  const done = state === 'done'
  const off = state === 'off'
  const xp = habitXp(habit)

  const handleToggle = () => {
    if (!done) setBurst((n) => n + 1)
    onToggle(habit)
  }

  return (
    <li
      className={`card relative flex animate-rise items-stretch gap-3 overflow-hidden py-3.5 pr-3.5 pl-5 transition sm:gap-4 ${
        off ? 'opacity-55' : ''
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${styles.bar}`} aria-hidden="true" />

      <span
        className={`flex size-11 shrink-0 items-center justify-center self-center rounded-xl ${styles.soft}`}
        aria-hidden="true"
      >
        <HabitGlyph name={habit.icon} className="size-5.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`truncate text-[15px] font-bold ${done ? 'text-muted line-through decoration-2' : 'text-ink'}`}>
            {habit.title}
          </h3>
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 text-sm font-extrabold ${
              streak > 0 ? 'text-orange-500' : 'text-muted/60'
            }`}
            aria-label={`${streak} day streak`}
            title="Current streak — counts scheduled days only"
          >
            <Flame
              key={streak}
              className={`size-4 ${streak > 0 ? 'animate-flicker fill-orange-400' : ''}`}
              aria-hidden="true"
            />
            {streak}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-semibold ${styles.soft}`}>{habit.category}</span>
          <span className="text-muted font-medium">
            {DIFFICULTY_LABEL[habit.difficulty]} · +{xp} XP
          </span>
          <span className="text-muted/70 hidden sm:inline">· {scheduleLabel(habit)}</span>
        </div>

        {/* Seven-day history: same window as the calendar strip. */}
        <ol className="mt-2.5 flex gap-1" aria-label="Last seven days">
          {lastDays(today, 7).map((day) => {
            const s = dayState(habit, day, today, freezes)
            return (
              <li
                key={day}
                title={`${formatDay(day)} — ${DOT_LABEL[s]}`}
                className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${DOT_STYLE[s]} ${
                  day === selected && s !== 'pending' ? 'outline-2 outline-offset-1 outline-indigo-400/60' : ''
                }`}
              >
                <span className="sr-only">
                  {formatDay(day)}: {DOT_LABEL[s]}
                </span>
                <span aria-hidden="true">
                  {s === 'frozen' ? <Snowflake className="size-3" /> : WEEKDAY_SHORT[weekdayOf(day)][0]}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onArchive(habit)}
              className="focus-ring rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-600"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              aria-label="Keep habit"
              className="focus-ring text-muted hover:bg-sunken rounded-full p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Remove ${habit.title}`}
            title="Remove habit (earned XP is kept)"
            className="focus-ring text-muted/60 hover:bg-sunken rounded-full p-1 transition hover:text-rose-500"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}

        {isToday && !off ? (
          <div className="relative">
            {burst > 0 && done && (
              <span
                key={burst}
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 right-0 animate-xp-float text-sm font-extrabold whitespace-nowrap text-emerald-500"
              >
                +{xp} XP
              </span>
            )}
            <button
              type="button"
              role="checkbox"
              aria-checked={done}
              aria-label={`${habit.title}: mark as ${done ? 'not done' : 'done'} for today`}
              onClick={handleToggle}
              className={`focus-ring flex size-12 items-center justify-center rounded-full border-2 transition active:scale-90 ${
                done
                  ? 'animate-pop border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'border-line text-muted/40 hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-500'
              }`}
            >
              <Check className="size-6" strokeWidth={3} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <StateBadge state={state} />
        )}
      </div>
    </li>
  )
}

function StateBadge({ state }: { state: DayState }) {
  const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold'
  switch (state) {
    case 'done':
      return (
        <span className={`${base} bg-emerald-500/12 text-emerald-700 dark:text-emerald-300`}>
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> Done
        </span>
      )
    case 'frozen':
      return (
        <span className={`${base} bg-sky-400/15 text-sky-700 dark:text-sky-300`}>
          <Snowflake className="size-3.5" aria-hidden="true" /> Frozen
        </span>
      )
    case 'missed':
      return <span className={`${base} bg-sunken text-muted`}>Missed</span>
    default:
      return <span className={`${base} bg-sunken text-muted`}>Not due</span>
  }
}
