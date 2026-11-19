import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/*
 * Supabase connection. The URL and publishable (anon) key are public by
 * design: they end up in every visitor's browser. What protects data is
 * row-level security in the database (supabase/migrations/0001_accounts.sql).
 *
 * Never put the service_role / secret key in this app.
 *
 * Without the two env vars the app runs as a local-only demo.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, {
        // PKCE puts the sign-in code in the query string (?code=), leaving the
        // #/ hash free for the app's own routes.
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }) : null

export const cloudEnabled = supabase !== null

/** Turn Supabase auth errors into messages people can act on. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'That email and password don’t match'
  if (m.includes('email not confirmed')) return 'Confirm your email first: check your inbox for the link'
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with that email already exists. Try signing in'
  if (m.includes('database error saving new user')) return 'That username is taken. Try another'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) return 'Too many attempts. Wait a minute and try again'
  if (m.includes('password should be') || m.includes('weak')) return 'Choose a stronger password: at least 8 characters'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Can’t reach the server. Check your connection'
  return message
}
