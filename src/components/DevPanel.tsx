import { FastForward, RotateCcw, Sprout, X } from 'lucide-react'
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
      className="card animate-enter fixed right-4 bottom-20 z-40 w-72 p-4 shadow-(--shadow-lg) lg:bottom-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          Dev panel
          <span className="flex gap-1 font-normal">
            <kbd className="keycap">Alt</kbd>
            <kbd className="keycap">Shift</kbd>
            <kbd className="keycap">T</kbd>
          </span>
        </h2>
        <button type="button" onClick={onClose} aria-label="Close developer panel" className="btn btn-sm btn-ghost btn-icon">
          <X className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      <p className="text-ink-2 mt-3 text-[13px]">
        App date <span className="mono text-ink">{formatDay(today)}</span>
        {dayOffset > 0 && <span className="mono text-muted"> (+{dayOffset}d)</span>}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => onAdvance(1)}>
          <FastForward className="size-4" strokeWidth={1.5} aria-hidden="true" />
          +1 day
        </button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => onAdvance(7)}>
          <FastForward className="size-4" strokeWidth={1.5} aria-hidden="true" />
          +7 days
        </button>
      </div>
      <p className="text-muted mt-2 text-xs">
        Skipped days count as missed. The weekly Streak Freeze is spent first, then streaks break.
      </p>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={fastReplies}
          onChange={(e) => onFastReplies(e.target.checked)}
          className="size-4 accent-(--accent)"
        />
        Fast friend replies, about 3s
      </label>

      <div className="border-line mt-4 grid grid-cols-2 gap-2 border-t pt-4">
        <button type="button" className="btn btn-sm btn-secondary" onClick={onReset}>
          <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Reset demo
        </button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={onClearAll}>
          <Sprout className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Fresh start
        </button>
      </div>
      <p className="text-muted mt-2 text-xs">
        Reset restores the sample data. Fresh start removes all habits to show the first-run state.
      </p>
    </aside>
  )
}
