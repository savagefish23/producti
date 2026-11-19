import { Heart, Moon, Sun } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  PROFILE_LIMITS,
  suggestUsername,
  validateSignIn,
  type FieldErrors,
  type SignInFields,
} from '../lib/profile'
import { createSeed } from '../lib/seed'
import { notificationsSupported, requestNotifications } from '../notifications'
import type { ISODate, Theme } from '../types'
import { Avatar } from './Avatar'
import { HabitCard } from './HabitCard'
import { Wordmark } from './Logo'

interface Props {
  today: ISODate
  theme: Theme
  onToggleTheme: () => void
  onSignIn: (fields: SignInFields, sampleData: boolean) => void
}

/** Profile used by "Look around first": example.com is reserved for examples. */
const DEMO_FIELDS: SignInFields = {
  fullName: 'Demo User',
  username: 'demo',
  email: 'demo@example.com',
  notifications: false,
}

const noop = () => {}

const inputClass = (invalid: boolean) =>
  `bg-surface placeholder:text-muted mt-2 h-11 w-full rounded-lg border px-3 text-[15px] outline-none focus:ring-2 ${
    invalid
      ? 'border-negative focus:ring-(--negative)/20'
      : 'border-line-strong focus:border-accent focus:ring-(--accent-soft)'
  }`

/**
 * Sign-up for the demo. It asks for a real-looking profile, but there is no
 * account server: everything stays in this browser, and the page says so.
 */
export function SignIn({ today, theme, onToggleTheme, onSignIn }: Props) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameEdited, setUsernameEdited] = useState(false)
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  // Until the user types their own, suggest a username from their name.
  const shownUsername = usernameEdited ? username : suggestUsername(fullName)
  const fields: SignInFields = { fullName, username: shownUsername, email, notifications }
  const errors: FieldErrors = submitted ? validateSignIn(fields) : {}

  // The preview shows the real habit card with sample data.
  const preview = useMemo(() => createSeed(today, '08:00'), [today])
  const reading = preview.habits.find((h) => h.id === 'h3')!
  const gym = preview.habits.find((h) => h.id === 'h4')!

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    const problems = validateSignIn(fields)
    if (Object.keys(problems).length > 0) {
      // Move focus to the first field that needs fixing.
      const first = (['fullName', 'username', 'email'] as const).find((k) => problems[k])
      document.getElementById(`signup-${first}`)?.focus()
      return
    }
    setBusy(true)
    // The browser only shows its permission prompt in response to a click.
    const allowed = notifications ? await requestNotifications() : false
    onSignIn({ ...fields, notifications: allowed }, false)
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center gap-3">
          <Wordmark size={22} />
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="btn btn-ghost btn-icon ml-auto"
          >
            {theme === 'dark' ? <Sun className="size-4.5" strokeWidth={1.5} /> : <Moon className="size-4.5" strokeWidth={1.5} />}
          </button>
        </div>

        <main className="animate-enter my-auto w-full max-w-md py-12">
          <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.02em] sm:text-4xl">
            A daily log for your habits, with friends who notice
          </h1>
          <p className="text-ink-2 mt-3 text-base leading-6">
            Check off today's habits, keep streaks alive with a weekly Streak Freeze, and see when your
            friends check in.
          </p>

          <form onSubmit={submit} noValidate className="mt-8 space-y-4" aria-label="Create your profile">
            <Field id="signup-fullName" label="Full name" error={errors.fullName}>
              <input
                id="signup-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={PROFILE_LIMITS.fullName}
                autoComplete="name"
                autoFocus
                placeholder="Sam Rivera"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'signup-fullName-error' : undefined}
                className={inputClass(!!errors.fullName)}
              />
            </Field>

            <Field id="signup-username" label="Username" error={errors.username} hint="Letters, numbers, _ or .">
              <div className="relative">
                <span className="text-muted pointer-events-none absolute top-1/2 left-3 mt-1 -translate-y-1/2 text-[15px]">@</span>
                <input
                  id="signup-username"
                  value={shownUsername}
                  onChange={(e) => {
                    setUsernameEdited(true)
                    setUsername(e.target.value.replace(/^@+/, ''))
                  }}
                  maxLength={PROFILE_LIMITS.username}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="sam_rivera"
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? 'signup-username-error' : 'signup-username-hint'}
                  className={`${inputClass(!!errors.username)} pl-7`}
                />
              </div>
            </Field>

            <Field id="signup-email" label="Email" error={errors.email}>
              <input
                id="signup-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={PROFILE_LIMITS.email}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="sam@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                className={inputClass(!!errors.email)}
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-3 pt-1">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                disabled={!notificationsSupported()}
                className="mt-0.5 size-4 shrink-0 accent-(--accent)"
              />
              <span className="text-sm">
                Turn on notifications
                <span className="text-ink-2 block text-[13px]">
                  {notificationsSupported()
                    ? 'Get a browser notification when a friend cheers or replies. Your browser will ask first.'
                    : 'This browser does not support notifications.'}
                </span>
              </span>
            </label>

            <button type="submit" disabled={busy} className="btn btn-primary h-11 w-full">
              Create account
            </button>
          </form>

          <p className="text-ink-2 mt-4 text-center text-sm">
            Just looking?{' '}
            <button
              type="button"
              onClick={() => onSignIn(DEMO_FIELDS, true)}
              className="text-accent-text focus-ring rounded font-medium underline-offset-2 hover:underline"
            >
              Explore with sample data
            </button>
          </p>

          <p className="text-muted mt-6 text-[13px] leading-5">
            This is a demo with no server. Your name, username and email are saved only in this browser
            and are never sent anywhere. There are no passwords, and the friends are simulated.
          </p>
        </main>

        <p className="text-muted flex gap-4 text-xs">
          <a href="/privacy" className="hover:text-ink underline-offset-2 hover:underline">Privacy</a>
          <a href="/terms" className="hover:text-ink underline-offset-2 hover:underline">Terms</a>
        </p>
      </div>

      <aside aria-label="Preview" className="bg-raised border-line hidden items-center justify-center border-l px-6 py-12 lg:flex">
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

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && !error && (
          <span id={`${id}-hint`} className="text-muted text-xs">
            {hint}
          </span>
        )}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-negative mt-1.5 text-[13px]">
          {error}
        </p>
      )}
    </div>
  )
}
