import { dayOfMonth, formatDay, WEEKDAY_SHORT, weekdayOf } from '../lib/dates'
import type { DayProgress } from '../lib/game'
import type { ISODate } from '../types'
import { ProgressRing } from './ProgressRing'

interface Props {
  /** Seven days ending today, oldest first. */
  days: DayProgress[]
  today: ISODate
  selected: ISODate
  onSelect: (date: ISODate) => void
}

/** Horizontal 7-day calendar strip. Each day carries a mini completion ring. */
export function DayStrip({ days, today, selected, onSelect }: Props) {
  return (
    <div role="group" aria-label="Last seven days" className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {days.map((day) => {
        const isSelected = day.date === selected
        const isToday = day.date === today
        const summary = day.due === 0 ? 'nothing scheduled' : `${day.done} of ${day.due} done`
        return (
          <button
            key={day.date}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${formatDay(day.date)}${isToday ? ' (today)' : ''}, ${summary}`}
            onClick={() => onSelect(day.date)}
            className={`focus-ring flex flex-col items-center gap-1 rounded-2xl border px-1 py-2 transition ${
              isSelected
                ? 'border-transparent bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'border-line bg-surface text-ink hover:border-indigo-300 dark:hover:border-indigo-500/60'
            }`}
          >
            <span className={`text-[11px] font-semibold ${isSelected ? 'text-white/80' : 'text-muted'}`}>
              {isToday ? 'Today' : WEEKDAY_SHORT[weekdayOf(day.date)]}
            </span>
            <ProgressRing
              value={day.ratio}
              size={34}
              stroke={3.5}
              trackClass={isSelected ? 'stroke-white/25' : 'stroke-(--sunken)'}
              arcClass={isSelected ? 'stroke-white' : 'stroke-indigo-500'}
            >
              <span className="text-xs font-bold">{dayOfMonth(day.date)}</span>
            </ProgressRing>
          </button>
        )
      })}
    </div>
  )
}
