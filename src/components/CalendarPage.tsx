import { Check, ChevronLeft, ChevronRight, Clock, Snowflake } from 'lucide-react'
import { useState } from 'react'
import { addDays, dayOfMonth, formatDay, formatTime, startOfWeek, WEEKDAY_SHORT, weekdayOf } from '../lib/dates'
import { activeHabits } from '../lib/game'
import { dayState, isScheduled, type DayState } from '../lib/streaks'
import type { FreezeUse, Habit, ISODate } from '../types'
import { HabitGlyph } from './HabitGlyph'
import { PageHeader } from './Overview'
import { CATEGORY_HEX } from './styles'

interface Props {
  habits: Habit[]
  freezes: FreezeUse[]
  today: ISODate
  onToggle: (habit: Habit) => void
  onOpenAdd: () => void
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function minutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function endTime(time: string, duration: number): string {
  const total = (minutes(time) + duration) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function durationLabel(m: number): string {
  return m < 60 ? `${m}m` : m % 60 === 0 ? `${m / 60}h` : `${Math.floor(m / 60)}h ${m % 60}m`
}

/** Calendar: pick a day in the week, see its habits as "anytime" chips and a timeline. */
export function CalendarPage({ habits, freezes, today, onToggle, onOpenAdd }: Props) {
  const [selected, setSelected] = useState<ISODate>(today)
  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selected), i))
  const month = MONTHS[Number(selected.slice(5, 7)) - 1]
  const year = selected.slice(0, 4)

  const due = activeHabits(habits).filter((h) => isScheduled(h, selected))
  const anytime = due.filter((h) => !h.time)
  const timed = due.filter((h) => h.time).sort((a, b) => minutes(a.time!) - minutes(b.time!))
  const done = due.filter((h) => dayState(h, selected, today, freezes) === 'done').length

  return (
    <div className="space-y-8">
      <PageHeader title="Calendar" subtitle="Your day, planned">
        <button type="button" onClick={onOpenAdd} className="btn btn-primary">
          Add habit
        </button>
      </PageHeader>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card overflow-hidden" aria-label="Day planner">
          {/* Month + week strip */}
          <div className="border-line border-b px-5 pt-5 pb-4 sm:px-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-[-0.01em]">
                {month} <span className="text-accent-text">{year}</span>
              </h2>
              <div className="ml-auto flex items-center gap-1">
                {selected !== today && (
                  <button type="button" onClick={() => setSelected(today)} className="btn btn-sm btn-ghost">
                    Today
                  </button>
                )}
                <button type="button" onClick={() => setSelected(addDays(selected, -7))} aria-label="Previous week" className="btn btn-sm btn-ghost btn-icon">
                  <ChevronLeft className="size-4" strokeWidth={1.75} />
                </button>
                <button type="button" onClick={() => setSelected(addDays(selected, 7))} aria-label="Next week" className="btn btn-sm btn-ghost btn-icon">
                  <ChevronRight className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div role="group" aria-label="Days of the week" className="mt-4 grid grid-cols-7 gap-1">
              {week.map((day) => {
                const isSel = day === selected
                const isToday = day === today
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={isSel}
                    aria-label={`${formatDay(day)}${isToday ? ' (today)' : ''}`}
                    onClick={() => setSelected(day)}
                    className="focus-ring group flex flex-col items-center gap-1.5 rounded-xl py-1"
                  >
                    <span className="text-ink-2 text-xs">{WEEKDAY_SHORT[weekdayOf(day)]}</span>
                    <span
                      className={`mono flex size-9 items-center justify-center rounded-full text-[15px] font-medium transition-colors duration-150 ${
                        isSel ? 'bg-accent text-on-accent' : isToday ? 'text-accent-text group-hover:bg-raised' : 'group-hover:bg-raised'
                      }`}
                    >
                      {dayOfMonth(day)}
                    </span>
                    <span className={`size-1 rounded-full ${isToday && !isSel ? 'bg-accent' : 'bg-transparent'}`} aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            {due.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="text-muted mx-auto size-6" strokeWidth={1.5} aria-hidden="true" />
                <p className="mt-2 text-sm font-medium">Nothing planned for {selected === today ? 'today' : formatDay(selected)}</p>
                <p className="text-ink-2 text-[13px]">Add a habit with a time to see it on the timeline</p>
              </div>
            ) : (
              <>
                {anytime.length > 0 && (
                  <div>
                    <h3 className="text-ink-2 mb-3 text-xs">Anytime</h3>
                    <ul className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                      {anytime.map((habit) => (
                        <AnytimeChip key={habit.id} habit={habit} state={dayState(habit, selected, today, freezes)} canToggle={selected === today} onToggle={onToggle} />
                      ))}
                    </ul>
                  </div>
                )}

                {timed.length > 0 && (
                  <ol className={anytime.length > 0 ? 'mt-6' : ''} aria-label="Timeline">
                    {timed.map((habit, i) => (
                      <TimelineRow
                        key={habit.id}
                        habit={habit}
                        state={dayState(habit, selected, today, freezes)}
                        canToggle={selected === today}
                        onToggle={onToggle}
                        last={i === timed.length - 1}
                      />
                    ))}
                  </ol>
                )}
                {timed.length === 0 && (
                  <p className="text-muted mt-6 text-[13px]">No timed habits on this day. Give a habit a time when you add it to place it on the timeline.</p>
                )}
              </>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card flex flex-col items-center p-5" aria-labelledby="ring-title">
            <h2 id="ring-title" className="self-start text-base font-semibold">
              Your day
            </h2>
            <p className="text-ink-2 self-start text-[13px]">Timed habits around the clock</p>
            <DayRing habits={timed} selected={selected} today={today} freezes={freezes} done={done} due={due.length} />
          </section>
        </aside>
      </div>
    </div>
  )
}

function stateLabel(state: DayState): string {
  return { done: 'done', frozen: 'frozen', missed: 'missed', pending: 'to do', upcoming: 'upcoming', off: 'not scheduled' }[state]
}

function CheckCircle({ habit, state, canToggle, onToggle }: { habit: Habit; state: DayState; canToggle: boolean; onToggle: (h: Habit) => void }) {
  const color = CATEGORY_HEX[habit.category]
  const done = state === 'done'
  if (!canToggle) {
    return (
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full border-2"
        style={{ borderColor: color, background: done ? color : 'transparent', opacity: state === 'missed' ? 0.4 : 1 }}
        title={stateLabel(state)}
      >
        {done && <Check className="size-4 text-white" strokeWidth={3} aria-hidden="true" />}
        {state === 'frozen' && <Snowflake className="size-3.5" style={{ color }} strokeWidth={2} aria-hidden="true" />}
        <span className="sr-only">{stateLabel(state)}</span>
      </span>
    )
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={`${habit.title}: mark as ${done ? 'not done' : 'done'}`}
      onClick={() => onToggle(habit)}
      className="focus-ring flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,transform] duration-150 active:scale-[0.94]"
      style={{ borderColor: color, background: done ? color : 'transparent' }}
    >
      {done && <Check className="size-4 text-white" strokeWidth={3} aria-hidden="true" />}
    </button>
  )
}

function AnytimeChip({ habit, state, canToggle, onToggle }: { habit: Habit; state: DayState; canToggle: boolean; onToggle: (h: Habit) => void }) {
  const color = CATEGORY_HEX[habit.category]
  const done = state === 'done'
  const content = (
    <>
      <span className="relative flex size-14 items-center justify-center rounded-full" style={{ background: `${color}26`, color }}>
        <HabitGlyph name={habit.icon} className="size-6" />
        {done && (
          <span className="bg-accent text-on-accent absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full ring-2 ring-(--surface)">
            <Check className="size-3" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="w-20 text-center text-xs leading-4 font-medium">{habit.title}</span>
    </>
  )
  return (
    <li className="shrink-0">
      {canToggle ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`${habit.title}: mark as ${done ? 'not done' : 'done'}`}
          onClick={() => onToggle(habit)}
          className="focus-ring flex flex-col items-center gap-2 rounded-xl p-1"
        >
          {content}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2 p-1" title={stateLabel(state)} style={{ opacity: state === 'missed' ? 0.5 : 1 }}>
          {content}
        </div>
      )}
    </li>
  )
}

function TimelineRow({ habit, state, canToggle, onToggle, last }: { habit: Habit; state: DayState; canToggle: boolean; onToggle: (h: Habit) => void; last: boolean }) {
  const color = CATEGORY_HEX[habit.category]
  const start = habit.time!
  const duration = habit.duration ?? 15
  const end = endTime(start, duration)
  const tall = Math.min(96, 56 + duration / 2)
  const done = state === 'done'

  return (
    <li className="grid grid-cols-[64px_44px_minmax(0,1fr)_auto] gap-x-3 sm:gap-x-4">
      <div className="mono text-muted flex flex-col justify-between py-1 text-right text-[11px]" style={{ minHeight: tall }}>
        <span>{formatTime(start)}</span>
        <span>{formatTime(end)}</span>
      </div>

      <div className="flex flex-col items-center">
        <span
          className="flex w-11 items-center justify-center rounded-full text-white transition-opacity duration-150"
          style={{ background: color, height: tall, opacity: state === 'missed' ? 0.45 : 1 }}
        >
          <HabitGlyph name={habit.icon} className="size-5" />
        </span>
        {!last && <span className="bg-line-strong h-4 w-0.5" aria-hidden="true" />}
      </div>

      <div className="flex min-w-0 flex-col justify-center" style={{ minHeight: tall }}>
        <p className="mono text-muted text-xs">
          {formatTime(start)} – {formatTime(end)} ({durationLabel(duration)})
        </p>
        <p className={`truncate text-base font-medium ${done ? 'text-ink-2 line-through decoration-2' : ''}`}>{habit.title}</p>
      </div>

      <div className="flex items-center" style={{ minHeight: tall }}>
        <CheckCircle habit={habit} state={state} canToggle={canToggle} onToggle={onToggle} />
      </div>
    </li>
  )
}

/** 24-hour ring: one segment per hour, coloured where a timed habit runs. */
function DayRing({ habits, selected, today, freezes, done, due }: { habits: Habit[]; selected: ISODate; today: ISODate; freezes: FreezeUse[]; done: number; due: number }) {
  const cx = 100
  const cy = 100
  const segments = Array.from({ length: 24 }, (_, hour) => {
    const covering = habits.find((h) => {
      const s = minutes(h.time!)
      const e = s + (h.duration ?? 15)
      return s < (hour + 1) * 60 && e > hour * 60
    })
    return { hour, habit: covering }
  })

  const arcPath = (hour: number) => {
    const a0 = ((hour / 24) * 360 - 90 + 1.5) * (Math.PI / 180)
    const a1 = (((hour + 1) / 24) * 360 - 90 - 1.5) * (Math.PI / 180)
    const r0 = 62
    const r1 = 84
    const p = (r: number, a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`
    return `M ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`
  }

  return (
    <svg viewBox="0 0 200 200" className="mt-4 w-full max-w-[240px]" role="img" aria-label={`${done} of ${due} habits done; ${habits.length} timed habits on the clock`}>
      {segments.map(({ hour, habit }) => {
        const state = habit ? dayState(habit, selected, today, freezes) : null
        const fill = !habit ? 'var(--raised)' : state === 'done' ? 'var(--accent)' : CATEGORY_HEX[habit.category]
        return (
          <path key={hour} d={arcPath(hour)} fill={fill} opacity={habit && state !== 'done' ? 0.55 : 1}>
            <title>{habit ? `${String(hour).padStart(2, '0')}:00 – ${habit.title}` : `${String(hour).padStart(2, '0')}:00`}</title>
          </path>
        )
      })}
      {[0, 6, 12, 18].map((h) => {
        const a = ((h / 24) * 360 - 90) * (Math.PI / 180)
        return (
          <text key={h} x={cx + 96 * Math.cos(a)} y={cy + 96 * Math.sin(a) + 3.5} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)">
            {h}
          </text>
        )
      })}
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="28" fontWeight="600" fill="var(--ink)" fontFamily="var(--font-mono)">
        {done}/{due}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="11" fill="var(--ink-2)">
        done
      </text>
    </svg>
  )
}
