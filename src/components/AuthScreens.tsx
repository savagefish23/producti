import { KeyRound, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { friendlyAuthError, supabase } from '../lib/supabase'
import { inputClass, passwordError } from './formHelpers'
import { Wordmark } from './Logo'
import { Field } from './SignIn'

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-10">
        <Wordmark size={26} />
      </div>
      <div className="animate-enter w-full max-w-sm">{children}</div>
    </div>
  )
}

/** Shown while the session is checked or the account's data is loading. */
export function Splash({ message, error, onRetry, onSignOut }: { message: string; error?: string | null; onRetry?: () => void; onSignOut?: () => void }) {
  return (
    <Centered>
      <div className="text-center">
        {error ? (
          <>
            <p className="font-medium">Couldn't load your data</p>
            <p className="text-ink-2 mt-1 text-sm">{error}</p>
            <div className="mt-6 flex justify-center gap-2">
              {onRetry && (
                <button type="button" onClick={onRetry} className="btn btn-primary">
                  Try again
                </button>
              )}
              {onSignOut && (
                <button type="button" onClick={onSignOut} className="btn btn-secondary">
                  Sign out
                </button>
              )}
            </div>
          </>
        ) : (
          <p role="status" className="text-ink-2 flex items-center justify-center gap-2 text-sm">
            <LoaderCircle className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
            {message}
          </p>
        )}
      </div>
    </Centered>
  )
}

/** Opened from the password-reset email: choose a new password. */
export function ResetPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pwError = submitted ? passwordError(password) : undefined
  const matchError = submitted && !pwError && confirm !== password ? 'The passwords don’t match' : undefined

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    if (!supabase || passwordError(password) || confirm !== password) return
    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) setError(friendlyAuthError(err.message))
    else onDone()
  }

  return (
    <Centered>
      <span className="bg-accent-soft text-accent-text flex size-12 items-center justify-center rounded-full">
        <KeyRound className="size-6" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">Choose a new password</h1>
      <p className="text-ink-2 mt-1 text-sm">You'll stay signed in on this device.</p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Field id="reset-password" label="New password" error={pwError} hint="At least 8 characters">
          <input id="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus className={inputClass(!!pwError)} />
        </Field>
        <Field id="reset-confirm" label="Confirm password" error={matchError}>
          <input id="reset-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputClass(!!matchError)} />
        </Field>
        {error && (
          <p role="alert" className="bg-negative/10 text-negative rounded-lg px-3 py-2 text-[13px]">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary h-11 w-full">
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </Centered>
  )
}
