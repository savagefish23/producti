import { Heart, MailCheck, Moon, Sun } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { usernameAvailable } from '../lib/cloud'
import {
  normalizeEmail,
  normalizeUsername,
  PROFILE_LIMITS,
  suggestUsername,
  validateSignIn,
  type FieldErrors,
  type SignInFields,
} from '../lib/profile'
import { createSeed } from '../lib/seed'
import { cloudEnabled, friendlyAuthError, supabase } from '../lib/supabase'
import { notificationsSupported, requestNotifications } from '../notifications'
import type { ISODate, Theme } from '../types'
import { Avatar } from './Avatar'
import { HabitCard } from './HabitCard'
import { inputClass, PASSWORD_MAX, PASSWORD_MIN, passwordError } from './formHelpers'
import { Wordmark } from './Logo'

interface Props {
  today: ISODate
  theme: Theme
  onToggleTheme: () => void
  /** Local-only sign-in: the sample-data demo, or every sign-up when Supabase is not configured. */
  onSignIn: (fields: SignInFields, sampleData: boolean) => void
}

/** Profile used by "Explore with sample data": example.com is reserved for examples. */
const DEMO_FIELDS: SignInFields = {
  fullName: 'Demo User',
  username: 'demo',
  email: 'demo@example.com',
  notifications: false,
}

const RESEND_COOLDOWN = 60

type Mode = 'signup' | 'signin' | 'forgot' | 'sent'

const noop = () => {}

/**
 * Sign-up and sign-in. With Supabase configured these are real accounts
 * (email + password, confirmation email, password reset). "Explore with
 * sample data" is always a local-only demo.
 */
export function SignIn({ today, theme, onToggleTheme, onSignIn }: Props) {
  const [mode, setMode] = useState<Mode>('signup')
  const [sentTo, setSentTo] = useState({ email: '', why: '' })

  // The preview shows the real habit card with sample data.
  const preview = useMemo(() => createSeed(today, '08:00'), [today])
  const reading = preview.habits.find((h) => h.id === 'h3')!
  const gym = preview.habits.find((h) => h.id === 'h4')!

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
          {mode === 'signup' && (
            <>
              <Intro />
              <SignUpForm
                onLocal={(fields) => onSignIn(fields, false)}
                onSent={(email) => {
                  setSentTo({ email, why: 'confirm' })
                  setMode('sent')
                }}
              />
              {cloudEnabled && (
                <p className="text-ink-2 mt-4 text-center text-sm">
                  Already have an account? <LinkButton onClick={() => setMode('signin')}>Sign in</LinkButton>
                </p>
              )}
            </>
          )}

          {mode === 'signin' && (
            <>
              <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">Welcome back</h1>
              <p className="text-ink-2 mt-2">Sign in to pick up your streaks on any device.</p>
              <SignInForm onForgot={() => setMode('forgot')} />
              <p className="text-ink-2 mt-4 text-center text-sm">
                New here? <LinkButton onClick={() => setMode('signup')}>Create an account</LinkButton>
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">Reset your password</h1>
              <p className="text-ink-2 mt-2">We'll email you a link to choose a new one.</p>
              <ForgotForm
                onSent={(email) => {
                  setSentTo({ email, why: 'reset' })
                  setMode('sent')
                }}
              />
              <p className="text-ink-2 mt-4 text-center text-sm">
                <LinkButton onClick={() => setMode('signin')}>Back to sign in</LinkButton>
              </p>
            </>
          )}

          {mode === 'sent' && (
            <div className="text-center">
              <span className="bg-accent-soft text-accent-text mx-auto flex size-14 items-center justify-center rounded-full">
                <MailCheck className="size-7" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">Check your inbox</h1>
              <p className="text-ink-2 mt-2">
                We sent a link to <span className="text-ink font-medium">{sentTo.email}</span>.{' '}
                {sentTo.why === 'confirm' ? 'Open it to confirm your email, then sign in.' : 'Open it to choose a new password.'}
              </p>
              <p className="text-muted mt-2 text-[13px]">Can't find it? Check spam, or wait a minute and try again.</p>
              <button type="button" onClick={() => setMode('signin')} className="btn btn-secondary mt-6">
                Back to sign in
              </button>
            </div>
          )}

          {mode !== 'sent' && (
            <p className="text-ink-2 mt-3 text-center text-sm">
              Just looking? <LinkButton onClick={() => onSignIn(DEMO_FIELDS, true)}>Explore with sample data</LinkButton>
            </p>
          )}

          <p className="text-muted mt-6 text-[13px] leading-5">
            {cloudEnabled
              ? 'Accounts are stored securely with Supabase. Your email is used only to sign in and reset your password, and is never shown to other users. The sample-data demo stays in this browser, and its friends are simulated.'
              : 'This is a demo with no server. Your name, username and email are saved only in this browser and are never sent anywhere. The friends are simulated.'}
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

function Intro() {
  return (
    <>
      <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.02em] sm:text-4xl">
        A daily log for your habits, with friends who notice
      </h1>
      <p className="text-ink-2 mt-3 text-base leading-6">
        Check off today's habits, keep streaks alive with a weekly Streak Freeze, and see when your friends
        check in.
      </p>
    </>
  )
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-accent-text focus-ring rounded font-medium underline-offset-2 hover:underline">
      {children}
    </button>
  )
}

export function Field({
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

function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="bg-negative/10 text-negative rounded-lg px-3 py-2 text-[13px]">
      {message}
    </p>
  )
}

function SignUpForm({ onLocal, onSent }: { onLocal: (fields: SignInFields) => void; onSent: (email: string) => void }) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameEdited, setUsernameEdited] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notifications, setNotifications] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [taken, setTaken] = useState<string | null>(null)

  const shownUsername = usernameEdited ? username : suggestUsername(fullName)
  const fields: SignInFields = { fullName, username: shownUsername, email, notifications }
  const fieldErrors: FieldErrors & { password?: string } = submitted
    ? { ...validateSignIn(fields), ...(cloudEnabled ? { password: passwordError(password) } : {}) }
    : {}
  if (!fieldErrors.username && taken && taken === normalizeUsername(shownUsername)) fieldErrors.username = 'That username is taken. Try another'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    setServerError(null)
    const problems = { ...validateSignIn(fields), ...(cloudEnabled ? { password: passwordError(password) } : {}) }
    const first = (['fullName', 'username', 'email', 'password'] as const).find((k) => problems[k])
    if (first) {
      document.getElementById(`signup-${first}`)?.focus()
      return
    }
    setBusy(true)
    // The browser only shows its permission prompt in response to a click.
    const allowed = notifications ? await requestNotifications() : false

    if (!cloudEnabled || !supabase) {
      onLocal({ ...fields, notifications: allowed })
      return
    }

    const cleanUsername = normalizeUsername(shownUsername)
    if ((await usernameAvailable(cleanUsername)) === false) {
      setTaken(cleanUsername)
      setBusy(false)
      document.getElementById('signup-username')?.focus()
      return
    }
    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), username: cleanUsername, notifications: allowed },
      },
    })
    setBusy(false)
    if (error) {
      setServerError(friendlyAuthError(error.message))
      return
    }
    // With email confirmation on, there is no session until the link is opened.
    if (!data.session) onSent(normalizeEmail(email))
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-4" aria-label="Create your account">
      <Field id="signup-fullName" label="Full name" error={fieldErrors.fullName}>
        <input
          id="signup-fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={PROFILE_LIMITS.fullName}
          autoComplete="name"
          autoFocus
          placeholder="Sam Rivera"
          aria-invalid={!!fieldErrors.fullName}
          className={inputClass(!!fieldErrors.fullName)}
        />
      </Field>

      <Field id="signup-username" label="Username" error={fieldErrors.username} hint="Letters, numbers, _ or .">
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
            aria-invalid={!!fieldErrors.username}
            className={`${inputClass(!!fieldErrors.username)} pl-7`}
          />
        </div>
      </Field>

      <Field id="signup-email" label="Email" error={fieldErrors.email}>
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
          aria-invalid={!!fieldErrors.email}
          className={inputClass(!!fieldErrors.email)}
        />
      </Field>

      {cloudEnabled && (
        <Field id="signup-password" label="Password" error={fieldErrors.password} hint={`At least ${PASSWORD_MIN} characters`}>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={PASSWORD_MAX}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.password}
            className={inputClass(!!fieldErrors.password)}
          />
        </Field>
      )}

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

      <FormError message={serverError} />
      <button type="submit" disabled={busy} className="btn btn-primary h-11 w-full">
        {busy ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password')
      return
    }
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password })
    setBusy(false)
    // On success the session listener in App takes over.
    if (err) setError(friendlyAuthError(err.message))
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-4" aria-label="Sign in">
      <Field id="signin-email" label="Email">
        <input
          id="signin-email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          autoFocus
          className={inputClass(false)}
        />
      </Field>
      <div>
        <Field id="signin-password" label="Password">
          <input
            id="signin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass(false)}
          />
        </Field>
        <div className="mt-2 text-right">
          <LinkButton onClick={onForgot}>Forgot password?</LinkButton>
        </div>
      </div>
      <FormError message={error} />
      <button type="submit" disabled={busy} className="btn btn-primary h-11 w-full">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function ForgotForm({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Count down so the button can't be spammed (Supabase also rate-limits emails).
  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase || cooldown > 0) return
    setError(null)
    const clean = normalizeEmail(email)
    if (!clean) {
      setError('Enter the email you signed up with')
      return
    }
    setBusy(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: window.location.origin })
    setBusy(false)
    setCooldown(RESEND_COOLDOWN)
    if (err) {
      setError(friendlyAuthError(err.message))
      return
    }
    // Same message whether or not the account exists, so this can't be used to probe emails.
    onSent(clean)
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-4" aria-label="Reset password">
      <Field id="forgot-email" label="Email">
        <input
          id="forgot-email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          autoFocus
          className={inputClass(false)}
        />
      </Field>
      <FormError message={error} />
      <button type="submit" disabled={busy || cooldown > 0} className="btn btn-primary h-11 w-full">
        {cooldown > 0 ? `Try again in ${cooldown}s` : busy ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
