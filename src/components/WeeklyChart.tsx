import { formatDay, WEEKDAY_SHORT, weekdayOf } from '../lib/dates'
import type { DayProgress } from '../lib/game'
import type { ISODate } from '../types'

interface Props {
  /** Seven days ending today, oldest first. */
  days: DayProgress[]
  today: ISODate
  selected: ISODate
  onSelect: (date: ISODate) => void
}

const GRID = [100, 50, 0]

/**
 * The main chart: share of scheduled habits completed per day. Neutral bars;
 * the selected day is the one bar in the accent. Hover or focus shows exact
 * figures, click jumps to that day.
 */
export function WeeklyChart({ days, today, selected, onSelect }: Props) {
  const scheduled = days.filter((d) => d.due > 0)
  const done = scheduled.reduce((sum, d) => sum + d.done, 0)
  const due = scheduled.reduce((sum, d) => sum + d.due, 0)
  const average = due ? Math.round((done / due) * 100) : 0

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="chart-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="chart-title" className="text-base font-semibold">
            Weekly consistency
          </h2>
          <p className="text-ink-2 text-[13px]">Scheduled habits completed, last 7 days</p>
        </div>
        <div className="text-right">
          <p className="mono text-[28px] leading-9 font-medium">{average}%</p>
          <p className="mono text-muted text-xs">
            {done} of {due} check-ins
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <div
          className="mono text-muted flex h-48 w-8 flex-col justify-between text-right text-[11px] leading-none"
          aria-hidden="true"
        >
          {GRID.map((g) => (
            <span key={g}>{g}%</span>
          ))}
        </div>

        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-1 flex h-46 flex-col justify-between" aria-hidden="true">
            {GRID.map((g) => (
              <span key={g} className={`border-line block border-t ${g === 0 ? '' : 'border-dashed'}`} />
            ))}
          </div>

          <div className="relative grid grid-cols-7">
            {days.map((day) => {
              const percent = Math.round(day.ratio * 100)
              const isSelected = day.date === selected
              const label =
                day.due === 0
                  ? `${formatDay(day.date)}: nothing scheduled`
                  : `${formatDay(day.date)}: ${day.done} of ${day.due} done, ${percent}%`
              return (
                <button
                  key={day.date}
                  type="button"
                  aria-label={label}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(day.date)}
                  className="group relative flex flex-col items-center outline-none"
                >
                  <span className="flex h-47 w-full items-end justify-center pt-1">
                    <span
                      className={`w-6 rounded-t transition-colors duration-150 ease-smooth group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-(--accent) sm:w-8 ${
                        isSelected ? 'bg-accent' : 'bg-bar group-hover:bg-line-strong'
                      }`}
                      style={{ height: day.due === 0 ? 2 : `max(2px, ${percent}%)` }}
                    />
                  </span>
                  <span className={`mt-2 text-xs ${isSelected ? 'text-ink font-medium' : 'text-ink-2'}`} aria-hidden="true">
                    {day.date === today ? 'Today' : WEEKDAY_SHORT[weekdayOf(day.date)]}
                  </span>

                  <span
                    role="presentation"
                    className="bg-ink text-canvas pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg px-3 py-2 text-left text-xs whitespace-nowrap shadow-(--shadow-lg) group-hover:block group-focus-visible:block"
                  >
                    {formatDay(day.date)}
                    <span className="mono block opacity-70">
                      {day.due === 0 ? 'Nothing scheduled' : `${day.done} of ${day.due} · ${percent}%`}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
