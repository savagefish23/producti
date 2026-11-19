import { Heart, Moon, Sun } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { createSeed } from '../lib/seed'
import type { ISODate, Theme } from '../types'
import { Avatar } from './Avatar'
import { HabitCard } from './HabitCard'
import { Logo } from './Logo'

interface Props {
  today: ISODate
  theme: Theme
  onToggleTheme: () => void
  onSignIn: (name: string, sampleData: boolean) => void
}

const noop = () => {}

/**
 * Sign-in for the demo. There is no account server, so this asks only for a
 * name and says plainly that everything stays in this browser.
 */
export function SignIn({ today, theme, onToggleTheme, onSignIn }: Props) {
  const [name, setName] = useState('')
  // The preview shows the real habit card with sample data: one streak that
  // proves the headline, plus the friend reaction that goes with it.
  const preview = useMemo(() => createSeed(today, '08:00'), [today])
  const reading = preview.habits.find((h) => h.id === 'h3')!
  const gym = preview.habits.find((h) => h.id === 'h4')!

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSignIn(name, false)
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-[17px] font-semibold">Producti</span>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="btn btn-ghost btn-icon ml-auto"
          >
            {theme === 'dark' ? <Sun className="size-4.5" strokeWidth={1.5} /> : <Moon className="size-4.5" strokeWidth={1.5} />}
          </button>
        </div>

        <main className="animate-enter my-auto w-full max-w-md py-16">
          <h1 className="text-4xl leading-[1.08] font-medium tracking-[-0.02em] sm:text-[44px]">
            A daily log for your habits, with friends who notice
          </h1>
          <p className="text-ink-2 mt-4 text-lg leading-7">
            Check off today's habits, keep streaks alive with a weekly Streak Freeze, and see when your
            friends check in.
          </p>

          <form onSubmit={submit} className="mt-10">
            <label htmlFor="signin-name" className="text-sm font-medium">
              Your name
            </label>
            <input
              id="signin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              autoComplete="given-name"
              autoFocus
              placeholder="Sam"
              className="border-line-strong bg-surface placeholder:text-muted focus:border-accent mt-2 h-11 w-full rounded-lg border px-3 text-[15px] outline-none focus:ring-2 focus:ring-(--accent-soft)"
            />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="submit" className="btn btn-primary h-11 sm:flex-1">
                Start fresh
              </button>
              <button type="button" onClick={() => onSignIn(name, true)} className="btn btn-secondary h-11 sm:flex-1">
                Explore with sample data
              </button>
            </div>
          </form>

          <p className="text-muted mt-6 text-[13px] leading-5">
            This is a demo. There are no accounts or passwords: your habits are stored in this browser
            only, and the friends are simulated.
          </p>
        </main>

        <p className="text-muted flex gap-4 text-xs">
          <a href="#/privacy" className="hover:text-ink underline-offset-2 hover:underline">Privacy</a>
          <a href="#/terms" className="hover:text-ink underline-offset-2 hover:underline">Terms</a>
        </p>
      </div>

      <aside aria-label="Preview" className="bg-raised border-line flex items-center justify-center border-t px-6 py-12 lg:border-t-0 lg:border-l">
        <div className="w-full max-w-md space-y-3">
          <ul className="space-y-2">
            <HabitCard habit={reading} today={today} selected={today} freezes={preview.freezes} onToggle={noop} onArchive={noop} preview />
            <HabitCard habit={gym} today={today} selected={today} freezes={preview.freezes} onToggle={noop} onArchive={noop} preview />
          </ul>
          <div className="card flex items-center gap-3 p-4">
            <Avatar name="Maya Chen" size="sm" />
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-medium">Maya</span>{' '}
              <span className="text-ink-2">cheered your check-in: Gym session</span>
            </p>
            <Heart className="text-ink-2 size-4 shrink-0" strokeWidth={1.5} fill="currentColor" aria-hidden="true" />
          </div>
          <p className="mono text-muted text-center text-xs">Sample data</p>
        </div>
      </aside>
    </div>
  )
}
