import { Check, Snowflake, Trash2 } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { formatDay, lastDays, WEEKDAY_SHORT, weekdayOf } from '../lib/dates'
import { habitXp } from '../lib/game'
import { currentStreak, dayState, type DayState } from '../lib/streaks'
import type { FreezeUse, Habit, ISODate, Weekday } from '../types'
import { HabitGlyph } from './HabitGlyph'
import { Streak } from './Streak'
import { CATEGORY_DOT, DIFFICULTY_LABEL } from './styles'

interface Props {
  habit: Habit
  today: ISODate
  /** The day picked in the calendar strip. Only today can be checked off. */
  selected: ISODate
  freezes: FreezeUse[]
  onToggle: (habit: Habit) => void
  onArchive: (habit: Habit) => void
  /** Static preview (sign-in screen): no buttons. */
  preview?: boolean
}

/*
 * The log squares are this card's moment: a week of a habit drawn like
 * pencil marks in a training log.
 */
const SQUARE: Record<DayState, string> = {
  done: 'bg-ink text-canvas',
  frozen: 'text-ink-2 border border-line-strong',
  missed: 'text-muted border border-line-strong',
  pending: 'text-accent-text border-[1.5px] border-dashed border-accent',
  upcoming: 'text-muted border border-line',
  off: 'text-muted/50',
}

const HATCH: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, var(--line-strong) 0 1px, transparent 1px 5px)',
}

const SQUARE_LABEL: Record<DayState, string> = {
  done: 'done',
  frozen: 'missed, covered by Streak Freeze',
  missed: 'missed',
  pending: 'not done yet',
  upcoming: 'upcoming',
  off: 'not scheduled',
}

function scheduleLabel(habit: Habit): string {
  if (habit.schedule.length === 7) return 'Daily'
  return ([1, 2, 3, 4, 5, 6, 0] as Weekday[])
    .filter((d) => habit.schedule.includes(d))
    .map((d) => WEEKDAY_SHORT[d])
    .join(' ')
}

export function HabitCard({ habit, today, selected, freezes, onToggle, onArchive, preview = false }: Props) {
  const [confirming, setConfirming] = useState(false)
  // Bumped on each completion so the "+XP" note re-mounts and replays.
  const [burst, setBurst] = useState(0)

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
    <li className={`card flex items-center gap-4 p-4 ${off ? 'opacity-60' : ''}`}>
      <span
        className="bg-raised text-ink-2 hidden size-10 shrink-0 items-center justify-center rounded-lg sm:flex"
        aria-hidden="true"
      >
        <HabitGlyph name={habit.icon} className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-medium">{habit.title}</h3>
          <Streak count={streak} />
        </div>

        <p className="text-ink-2 mt-1 flex flex-wrap items-center gap-x-2 text-[13px]">
          <span className="inline-flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${CATEGORY_DOT[habit.category]}`} aria-hidden="true" />
            {habit.category}
          </span>
          <span className="text-muted" aria-hidden="true">
            ·
          </span>
          <span>{DIFFICULTY_LABEL[habit.difficulty]}</span>
          <span className="mono text-muted text-xs">+{xp} XP</span>
          <span className="mono text-muted hidden text-xs md:inline">{scheduleLabel(habit)}</span>
        </p>

        <ol className="mt-3 flex gap-1" aria-label="Last seven days">
          {lastDays(today, 7).map((day) => {
            const s = dayState(habit, day, today, freezes)
            return (
              <li
                key={day}
                title={`${formatDay(day)}: ${SQUARE_LABEL[s]}`}
                style={s === 'frozen' ? HATCH : undefined}
                className={`mono flex size-6 items-center justify-center rounded-md text-[11px] ${SQUARE[s]} ${
                  day === selected && !isToday ? 'ring-accent ring-offset-surface ring-2 ring-offset-1' : ''
                }`}
              >
                <span className="sr-only">
                  {formatDay(day)}: {SQUARE_LABEL[s]}
                </span>
                <span aria-hidden="true">
                  {s === 'frozen' ? (
                    <Snowflake className="size-3" strokeWidth={1.5} />
                  ) : (
                    WEEKDAY_SHORT[weekdayOf(day)][0]
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {!preview && (
        <div className="flex shrink-0 items-center gap-1">
          {confirming ? (
            <>
              <button
                type="button"
                onClick={() => onArchive(habit)}
                className="btn btn-sm btn-ghost text-negative hover:text-negative"
              >
                Remove
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="btn btn-sm btn-ghost">
                Keep
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Remove ${habit.title}`}
              title="Remove habit (earned XP is kept)"
              className="btn btn-sm btn-ghost btn-icon text-muted"
            >
              <Trash2 className="size-4" strokeWidth={1.5} />
            </button>
          )}

          {isToday && !off ? (
            <div className="relative">
              {burst > 0 && done && (
                <span
                  key={burst}
                  aria-hidden="true"
                  className="mono text-ink-2 animate-xp pointer-events-none absolute -top-4 right-0 text-xs font-medium whitespace-nowrap"
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
                className={`focus-ring flex size-11 items-center justify-center rounded-xl border transition-[background-color,border-color,color,transform] duration-150 ease-smooth active:scale-[0.97] ${
                  done
                    ? 'bg-ink text-canvas border-transparent'
                    : 'border-line-strong text-muted hover:border-accent hover:text-accent-text'
                }`}
              >
                <Check className="size-5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <StateLabel state={state} />
          )}
        </div>
      )}
    </li>
  )
}

function StateLabel({ state }: { state: DayState }) {
  const text: Partial<Record<DayState, string>> = { done: 'Done', frozen: 'Frozen', missed: 'Missed' }
  return <span className="mono text-muted w-14 text-right text-xs">{text[state] ?? 'Not due'}</span>
}
