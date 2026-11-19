import { dayOfMonth, formatDay, WEEKDAY_SHORT, weekdayOf } from '../lib/dates'
import type { DayProgress } from '../lib/game'
import type { ISODate } from '../types'

interface Props {
  /** Seven days ending today, oldest first. */
  days: DayProgress[]
  today: ISODate
  selected: ISODate
  onSelect: (date: ISODate) => void
}

/** Horizontal 7-day calendar strip. */
export function DayStrip({ days, today, selected, onSelect }: Props) {
  return (
    <div role="group" aria-label="Last seven days" className="grid grid-cols-7 gap-2">
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
            className={`focus-ring flex h-20 flex-col items-center justify-center gap-1 rounded-xl border transition-colors duration-150 ease-smooth ${
              isSelected
                ? 'bg-ink text-canvas border-transparent'
                : 'border-line bg-surface hover:bg-raised'
            }`}
          >
            <span className={`text-xs ${isSelected ? 'opacity-70' : 'text-ink-2'}`}>
              {isToday ? 'Today' : WEEKDAY_SHORT[weekdayOf(day.date)]}
            </span>
            <span className={`mono text-base font-medium ${isToday && !isSelected ? 'text-accent-text' : ''}`}>
              {dayOfMonth(day.date)}
            </span>
            <span className={`mono text-[11px] ${isSelected ? 'opacity-70' : 'text-muted'}`}>
              {day.due === 0 ? '–' : `${day.done}/${day.due}`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
