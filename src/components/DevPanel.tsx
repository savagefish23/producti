import { FastForward, RotateCcw, Sprout, Wrench, X } from 'lucide-react'
import { formatDay } from '../lib/dates'
import type { ISODate } from '../types'

interface Props {
  today: ISODate
  dayOffset: number
  fastReplies: boolean
  onAdvance: (days: number) => void
  onFastReplies: (on: boolean) => void
  onReset: () => void
  onClearAll: () => void
  onClose: () => void
}

const button =
  'focus-ring inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-bold text-ink transition hover:border-indigo-400 hover:bg-indigo-500/10'

/** Hidden developer panel (Alt+Shift+T): time travel and demo resets. */
export function DevPanel({
  today,
  dayOffset,
  fastReplies,
  onAdvance,
  onFastReplies,
  onReset,
  onClearAll,
  onClose,
}: Props) {
  return (
    <aside
      aria-label="Developer panel"
      className="card fixed bottom-20 left-4 z-40 w-72 animate-rise p-4 shadow-2xl lg:bottom-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-ink inline-flex items-center gap-1.5 text-sm font-extrabold">
          <Wrench className="size-4 text-indigo-500" aria-hidden="true" />
          Dev panel
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close developer panel"
          className="focus-ring text-muted hover:bg-sunken rounded-full p-1"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="text-muted mt-2 text-xs">
        App date: <span className="text-ink font-bold">{formatDay(today)}</span>
        {dayOffset > 0 && ` (real date +${dayOffset}d)`}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className={button} onClick={() => onAdvance(1)}>
          <FastForward className="size-3.5" aria-hidden="true" /> +1 day
        </button>
        <button type="button" className={button} onClick={() => onAdvance(7)}>
          <FastForward className="size-3.5" aria-hidden="true" /> +7 days
        </button>
      </div>
      <p className="text-muted mt-1.5 text-[11px] leading-snug">
        Skipped days count as missed: the weekly Streak Freeze is spent first, then streaks break.
      </p>

      <label className="text-ink mt-3 flex cursor-pointer items-center gap-2 text-xs font-semibold">
        <input
          type="checkbox"
          checked={fastReplies}
          onChange={(e) => onFastReplies(e.target.checked)}
          className="size-4 accent-indigo-600"
        />
        Fast friend replies (~3s, always cheer back)
      </label>

      <div className="border-line mt-3 grid grid-cols-2 gap-2 border-t pt-3">
        <button type="button" className={button} onClick={onReset}>
          <RotateCcw className="size-3.5" aria-hidden="true" /> Reset demo
        </button>
        <button type="button" className={button} onClick={onClearAll}>
          <Sprout className="size-3.5" aria-hidden="true" /> Fresh start
        </button>
      </div>
      <p className="text-muted mt-1.5 text-[11px] leading-snug">
        Reset restores the sample data. Fresh start removes all habits to show the first-run state.
      </p>
    </aside>
  )
}
