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
 * Weekly consistency: share of scheduled habits completed per day.
 * One series, one hue; the selected day is the emphasised bar. Each bar is a
 * button (hover/focus shows the exact figures, click jumps to that day).
 */
export function WeeklyChart({ days, today, selected, onSelect }: Props) {
  const scheduled = days.filter((d) => d.due > 0)
  const done = scheduled.reduce((sum, d) => sum + d.done, 0)
  const due = scheduled.reduce((sum, d) => sum + d.due, 0)
  const average = due ? Math.round((done / due) * 100) : 0

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="chart-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="chart-title" className="section-title">
            Weekly consistency
          </h2>
          <p className="text-muted text-xs">Scheduled habits completed, last 7 days</p>
        </div>
        <p className="text-right">
          <span className="text-ink text-2xl leading-none font-extrabold">{average}%</span>
          <span className="text-muted block text-[11px] font-medium">
            {done} of {due} check-ins
          </span>
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        {/* Y axis */}
        <div className="text-muted flex h-36 w-7 flex-col justify-between text-right text-[10px] leading-none" aria-hidden="true">
          {GRID.map((g) => (
            <span key={g} className="first:-translate-y-1 last:translate-y-1">
              {g}%
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* Gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-36 flex-col justify-between" aria-hidden="true">
            {GRID.map((g) => (
              <span key={g} className="border-line block border-t border-dashed last:border-solid" />
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
                  className="group relative flex flex-col items-center rounded-lg outline-none"
                >
                  <span className="flex h-36 w-full items-end justify-center">
                    <span
                      className={`w-5 rounded-t transition-[height,background-color] duration-500 ease-out group-focus-visible:ring-2 group-focus-visible:ring-violet-500 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-(--surface) sm:w-7 ${
                        isSelected
                          ? 'bg-indigo-500'
                          : 'bg-indigo-500/35 group-hover:bg-indigo-500/60 dark:bg-indigo-400/35 dark:group-hover:bg-indigo-400/60'
                      }`}
                      style={{ height: day.due === 0 ? 2 : `max(2px, ${percent}%)` }}
                    />
                  </span>
                  <span
                    className={`mt-1.5 text-[11px] font-semibold ${isSelected ? 'text-ink' : 'text-muted'}`}
                    aria-hidden="true"
                  >
                    {day.date === today ? 'Today' : WEEKDAY_SHORT[weekdayOf(day.date)]}
                  </span>

                  {/* Tooltip */}
                  <span
                    role="presentation"
                    className="bg-ink text-surface pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-center text-[11px] leading-tight font-semibold whitespace-nowrap shadow-lg group-hover:block group-focus-visible:block"
                  >
                    {formatDay(day.date)}
                    <span className="block font-medium opacity-80">
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
