import type { AppState } from '../types'
import { SCHEMA_VERSION } from './storage'
import { supabase } from './supabase'

/*
 * Syncing a signed-in user's data with Supabase. The whole app state is one
 * JSON document per user (table user_state). Row-level security guarantees a
 * user can only ever read or write their own row.
 *
 * Loaded data goes through the same migrate + sanitize path as localStorage,
 * so the server is treated as untrusted input too.
 */

export interface CloudEnvelope {
  schemaVersion: number
  data: unknown
}

export async function loadCloudState(userId: string): Promise<CloudEnvelope | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_state')
    .select('state, schema_version')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? { schemaVersion: data.schema_version as number, data: data.state } : null
}

export async function saveCloudState(userId: string, state: AppState): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('user_state')
    .upsert({ user_id: userId, state, schema_version: SCHEMA_VERSION, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

/** True if nobody has this username. Null if the check itself failed. */
export async function usernameAvailable(username: string): Promise<boolean | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('username_available', { name: username })
  return error ? null : Boolean(data)
}

/** Update the public profile row (username + full name). */
export async function updateCloudProfile(userId: string, fields: { username: string; fullName: string }): Promise<string | null> {
  if (!supabase) return null
  const { error } = await supabase
    .from('profiles')
    .update({ username: fields.username, full_name: fields.fullName })
    .eq('id', userId)
  if (!error) return null
  return error.code === '23505' ? 'That username is taken. Try another' : error.message
}

/** Permanently delete the signed-in account and all its data. */
export async function deleteCloudAccount(): Promise<string | null> {
  if (!supabase) return null
  const { error } = await supabase.rpc('delete_my_account')
  if (error) return error.message
  await supabase.auth.signOut()
  return null
}
