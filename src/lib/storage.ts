import type { AppState, ISODate } from '../types'
import { sanitizeState } from './validate'

/*
 * The ONLY module that touches localStorage.
 *
 * Data is stored in a versioned envelope: { schemaVersion, data }. When the
 * shape of AppState changes, bump SCHEMA_VERSION and add a migration from the
 * previous version — existing data is upgraded step by step, never wiped.
 *
 * To move to a real backend later, re-implement `loadState` / `saveState`
 * against the API (making them async); nothing else in the app knows where
 * state lives.
 */

export const STORAGE_KEY = 'producti:state'
const BACKUP_KEY = 'producti:state:backup'

export const SCHEMA_VERSION = 4

/** Upgrades data from version N (the key) to version N + 1. */
export type Migration = (data: unknown) => unknown
export type Migrations = Record<number, Migration>

export const MIGRATIONS: Migrations = {
  // v2 added the sign-in screen. Anyone with saved v1 data was already using
  // the app, so they stay signed in.
  1: (data) => ({ ...(data as object), signedIn: true }),
  // v3 replaced the profile "handle" with username, email and a
  // notifications preference. The old handle becomes the username.
  2: (data) => {
    const s = data as { profile?: Record<string, unknown> }
    const profile = s.profile ?? {}
    const handle = typeof profile.handle === 'string' ? profile.handle.replace(/^@+/, '') : ''
    const { handle: _drop, ...rest } = profile
    void _drop
    return { ...s, profile: { ...rest, username: handle || 'you', email: '', notifications: false } }
  },
  // v4 removed per-habit difficulty: XP now comes from a flat base plus a
  // streak bonus, so users cannot pick a bigger reward.
  3: (data) => {
    const s = data as { habits?: unknown }
    if (!Array.isArray(s.habits)) return s
    return {
      ...s,
      habits: s.habits.map((h) => {
        if (typeof h !== 'object' || h === null) return h
        const { difficulty: _drop, ...rest } = h as Record<string, unknown>
        void _drop
        return rest
      }),
    }
  },
}

interface Envelope {
  schemaVersion: number
  data: unknown
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Envelope).schemaVersion === 'number' &&
    'data' in value
  )
}

/**
 * Bring a stored envelope up to `target`. Returns null when the data cannot
 * be used: unknown shape, a version newer than this build, or a missing step.
 */
export function migrate(
  raw: unknown,
  migrations: Migrations = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): unknown {
  if (!isEnvelope(raw) || raw.schemaVersion > target || raw.schemaVersion < 1) return null
  let data = raw.data
  for (let version = raw.schemaVersion; version < target; version++) {
    const step = migrations[version]
    if (!step) return null
    data = step(data)
  }
  return data
}

/**
 * The saved state, validated and repaired (see validate.ts), or null on first
 * run / unusable data. `isIcon` says which icon keys exist.
 */
export function loadState(today: ISODate, isIcon: (key: string) => boolean): AppState | null {
  let text: string | null
  try {
    text = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null // storage blocked (private mode etc.)
  }
  if (text === null) return null

  try {
    const state = sanitizeState(migrate(JSON.parse(text)), today, isIcon)
    if (state) return state
  } catch {
    // fall through to the backup below
  }

  // Unreadable data is set aside rather than destroyed, so it can be recovered.
  try {
    localStorage.setItem(BACKUP_KEY, text)
  } catch {
    // nothing more we can do
  }
  return null
}

/** Move saved data aside (kept as a backup) so the app starts fresh. */
export function resetStoredState(): void {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (text !== null) localStorage.setItem(BACKUP_KEY, text)
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage blocked: nothing saved, nothing to reset
  }
}

export function saveState(state: AppState): void {
  const envelope: Envelope = { schemaVersion: SCHEMA_VERSION, data: state }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    // Quota or blocked storage: the app keeps working in memory.
  }
}
