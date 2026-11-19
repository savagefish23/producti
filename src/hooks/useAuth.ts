import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface AuthState {
  /** False until Supabase has checked for an existing session. */
  ready: boolean
  session: Session | null
  /** The user arrived from a password-reset email and must choose a new password. */
  recovering: boolean
  clearRecovering: () => void
}

/** Follows the Supabase session. Without Supabase it is always ready and signed out. */
export function useAuth(): AuthState {
  const [ready, setReady] = useState(!supabase)
  const [session, setSession] = useState<Session | null>(null)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setReady(true)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return { ready, session, recovering, clearRecovering: () => setRecovering(false) }
}
