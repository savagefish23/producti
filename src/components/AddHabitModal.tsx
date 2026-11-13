import { X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { WEEKDAY_LONG, WEEKDAY_SHORT } from '../lib/dates'
import { XP_BY_DIFFICULTY } from '../lib/game'
import type { NewHabit } from '../lib/reducer'
import { CATEGORIES, DIFFICULTIES, type Category, type Difficulty, type Weekday } from '../types'
import { HABIT_ICONS } from './icons'
import { CATEGORY_STYLES, DIFFICULTY_LABEL } from './styles'

interface Props {
  onAdd: (habit: NewHabit) => void
  onClose: () => void
}

const ALL_DAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 0] // Monday first
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5]

const chip = (active: boolean) =>
  `focus-ring rounded-xl border px-3 py-2 text-sm font-semibold transition ${
    active
      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200'
      : 'border-line text-muted hover:border-indigo-300 hover:text-ink'
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
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [daily, setDaily] = useState(true)
  const [days, setDays] = useState<Weekday[]>(WEEKDAYS)

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
    onAdd({ title: title.trim(), icon, category, difficulty, schedule })
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
      className="bg-surface text-ink m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-2xl backdrop:bg-indigo-950/50 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={submit} className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="border-line flex items-center justify-between border-b px-5 py-4">
          <h2 id="add-habit-title" className="text-lg font-extrabold tracking-tight">
            New habit
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring text-muted hover:bg-sunken rounded-full p-1.5"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <label htmlFor="habit-title" className="text-sm font-bold">
              Title
            </label>
            <input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={40}
              autoFocus
              required
              placeholder="e.g. Walk 8,000 steps"
              className="border-line bg-sunken placeholder:text-muted/70 mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-bold">Icon</legend>
            <div className="mt-1.5 grid grid-cols-8 gap-1.5">
              {Object.entries(HABIT_ICONS).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={label}
                  aria-pressed={icon === key}
                  title={label}
                  onClick={() => setIcon(key)}
                  className={`focus-ring flex aspect-square items-center justify-center rounded-xl border transition ${
                    icon === key
                      ? `border-transparent ${CATEGORY_STYLES[category].solid}`
                      : 'border-line text-muted hover:text-ink hover:border-indigo-300'
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold">Category</legend>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={category === option}
                  onClick={() => setCategory(option)}
                  className={chip(category === option)}
                >
                  <span className={`mr-1.5 inline-block size-2 rounded-full ${CATEGORY_STYLES[option].bar}`} aria-hidden="true" />
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold">Difficulty</legend>
            <p className="text-muted text-xs">Harder habits earn more XP per check-in.</p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {DIFFICULTIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={difficulty === option}
                  onClick={() => setDifficulty(option)}
                  className={chip(difficulty === option)}
                >
                  {DIFFICULTY_LABEL[option]}
                  <span className="block text-xs font-bold opacity-80">+{XP_BY_DIFFICULTY[option]} XP</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold">Schedule</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <button type="button" aria-pressed={daily} onClick={() => setDaily(true)} className={chip(daily)}>
                Every day
              </button>
              <button type="button" aria-pressed={!daily} onClick={() => setDaily(false)} className={chip(!daily)}>
                Specific days
              </button>
            </div>
            {!daily && (
              <>
                <div className="mt-2 grid grid-cols-7 gap-1.5">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={days.includes(day)}
                      aria-label={WEEKDAY_LONG[day]}
                      onClick={() => toggleDay(day)}
                      className={`focus-ring rounded-xl border py-2 text-xs font-bold transition ${
                        days.includes(day)
                          ? 'border-transparent bg-indigo-600 text-white'
                          : 'border-line text-muted hover:border-indigo-300'
                      }`}
                    >
                      {WEEKDAY_SHORT[day]}
                    </button>
                  ))}
                </div>
                <p className="text-muted mt-2 text-xs" aria-live="polite">
                  {days.length === 0
                    ? 'Pick at least one day.'
                    : 'Your streak only counts these days — the others never break it.'}
                </p>
              </>
            )}
          </fieldset>
        </div>

        <div className="border-line flex justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring text-muted hover:bg-sunken rounded-xl px-4 py-2.5 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="focus-ring rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-700 disabled:opacity-40 disabled:shadow-none"
          >
            Add habit
          </button>
        </div>
      </form>
    </dialog>
  )
}
