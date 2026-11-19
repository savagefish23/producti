import { X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { WEEKDAY_LONG, WEEKDAY_SHORT } from '../lib/dates'
import { BASE_XP, STREAK_BONUS_CAP } from '../lib/game'
import { DURATIONS } from '../lib/validate'
import type { NewHabit } from '../lib/reducer'
import { CATEGORIES, type Category, type Weekday } from '../types'
import { HABIT_ICONS } from './icons'
import { CATEGORY_DOT } from './styles'

interface Props {
  onAdd: (habit: NewHabit) => void
  onClose: () => void
}

const ALL_DAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 0] // Monday first
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5]

const option = (active: boolean) =>
  `focus-ring rounded-lg border text-sm transition-colors duration-150 ease-smooth ${
    active ? 'border-ink bg-raised text-ink font-medium' : 'border-line-strong text-ink-2 hover:bg-raised hover:text-ink'
  }`

/**
 * Mounted only while open, so the form always starts fresh. Uses a native
 * <dialog>: focus trapping, Esc-to-close and the backdrop come for free.
 */
export function AddHabitModal({ onAdd, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('target')
  const [category, setCategory] = useState<Category>('Health')
  const [daily, setDaily] = useState(true)
  const [days, setDays] = useState<Weekday[]>(WEEKDAYS)
  const [timed, setTimed] = useState(false)
  const [time, setTime] = useState('07:00')
  const [duration, setDuration] = useState(30)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const schedule = daily ? ALL_DAYS : days
  const valid = title.trim().length > 0 && schedule.length > 0

  const toggleDay = (day: Weekday) =>
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!valid) return
    onAdd({ title: title.trim(), icon, category, schedule, ...(timed && time ? { time, duration } : {}) })
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose() // click on the backdrop
      }}
      aria-labelledby="add-habit-title"
      className="bg-surface text-ink m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-(--shadow-lg) backdrop:bg-[#12110f]/50"
    >
      <form onSubmit={submit} className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="border-line flex items-center justify-between border-b py-3 pr-3 pl-6">
          <h2 id="add-habit-title" className="text-lg font-semibold">
            New habit
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost btn-icon">
            <X className="size-4.5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-6">
          <div>
            <label htmlFor="habit-title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={40}
              autoFocus
              required
              placeholder="Walk 8,000 steps"
              className="border-line-strong bg-raised placeholder:text-muted focus:border-accent mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-(--accent-soft)"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Icon</legend>
            <div className="mt-2 grid grid-cols-8 gap-1">
              {Object.entries(HABIT_ICONS).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={label}
                  aria-pressed={icon === key}
                  title={label}
                  onClick={() => setIcon(key)}
                  className={`focus-ring flex aspect-square items-center justify-center rounded-lg transition-colors duration-150 ease-smooth ${
                    icon === key ? 'bg-ink text-canvas' : 'text-ink-2 hover:bg-raised hover:text-ink'
                  }`}
                >
                  <Icon className="size-4.5" strokeWidth={1.5} aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium">Category</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={category === value}
                  onClick={() => setCategory(value)}
                  className={`${option(category === value)} inline-flex h-10 items-center justify-center gap-2`}
                >
                  <span className={`size-2 rounded-full ${CATEGORY_DOT[value]}`} aria-hidden="true" />
                  {value}
                </button>
              ))}
            </div>
          </fieldset>


          <fieldset>
            <legend className="text-sm font-medium">Schedule</legend>
            <div className="seg mt-2 w-full" role="radiogroup" aria-label="Schedule">
              <button type="button" role="radio" aria-checked={daily} onClick={() => setDaily(true)} className="seg-item flex-1 justify-center">
                Every day
              </button>
              <button type="button" role="radio" aria-checked={!daily} onClick={() => setDaily(false)} className="seg-item flex-1 justify-center">
                Specific days
              </button>
            </div>
            {!daily && (
              <>
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={days.includes(day)}
                      aria-label={WEEKDAY_LONG[day]}
                      onClick={() => toggleDay(day)}
                      className={`focus-ring h-10 rounded-lg text-[13px] transition-colors duration-150 ease-smooth ${
                        days.includes(day) ? 'bg-ink text-canvas' : 'border-line-strong text-ink-2 hover:bg-raised border'
                      }`}
                    >
                      {WEEKDAY_SHORT[day]}
                    </button>
                  ))}
                </div>
                <p className="text-ink-2 mt-2 text-[13px]" aria-live="polite">
                  {days.length === 0
                    ? 'Pick at least one day'
                    : 'Your streak counts only these days. The others never break it.'}
                </p>
              </>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium">Time</legend>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13px]">
              <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="size-4 accent-(--accent)" />
              Set a time so it appears on the calendar timeline
            </label>
            {timed && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-ink-2 text-xs">
                  Starts at
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="border-line-strong bg-raised text-ink focus:border-accent mt-1 h-10 w-full rounded-lg border px-3 text-sm outline-none"
                  />
                </label>
                <label className="text-ink-2 text-xs">
                  Lasts
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="border-line-strong bg-raised text-ink focus:border-accent mt-1 h-10 w-full rounded-lg border px-3 text-sm outline-none"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d < 60 ? `${d} min` : d % 60 === 0 ? `${d / 60} h` : `${Math.floor(d / 60)} h ${d % 60} min`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </fieldset>
        </div>

        <div className="border-line flex items-center justify-end gap-2 border-t px-6 py-4">
          <p className="text-muted mr-auto text-xs">
            Every check-in earns <span className="mono">{BASE_XP}</span> XP, plus{' '}
            <span className="mono">1</span> per streak day, up to <span className="mono">+{STREAK_BONUS_CAP}</span>
          </p>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={!valid} className="btn btn-primary">
            Add habit
          </button>
        </div>
      </form>
    </dialog>
  )
}
