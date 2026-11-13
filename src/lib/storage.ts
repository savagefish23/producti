import type { AppState } from '../types'

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

export const SCHEMA_VERSION = 1

/** Upgrades data from version N (the key) to version N + 1. */
export type Migration = (data: unknown) => unknown
export type Migrations = Record<number, Migration>

/*
 * Example — when v2 adds a `notes` field to habits:
 *
 *   1: (data) => {
 *     const s = data as V1State
 *     return { ...s, habits: s.habits.map((h) => ({ ...h, notes: '' })) }
 *   },
 */
const MIGRATIONS: Migrations = {}

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

function looksLikeState(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Partial<AppState>
  return (
    Array.isArray(s.habits) &&
    Array.isArray(s.friends) &&
    Array.isArray(s.feed) &&
    Array.isArray(s.freezes) &&
    typeof s.lastSeenDate === 'string' &&
    typeof s.profile === 'object' &&
    s.profile !== null
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

/** The saved state, or null on first run / unusable data. */
export function loadState(): AppState | null {
  let text: string | null
  try {
    text = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null // storage blocked (private mode etc.)
  }
  if (text === null) return null

  try {
    const data = migrate(JSON.parse(text))
    if (looksLikeState(data)) return data
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

export function saveState(state: AppState): void {
  const envelope: Envelope = { schemaVersion: SCHEMA_VERSION, data: state }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    // Quota or blocked storage: the app keeps working in memory.
  }
}
