import { describe, expect, it } from 'vitest'
import { createSeed } from './seed'
import { isValidEmail, isValidUsername, normalizeUsername, suggestUsername, validateSignIn } from './profile'
import { migrate, MIGRATIONS, SCHEMA_VERSION } from './storage'
import { sanitizeState, timeFields } from './validate'
import { DEFAULT_BUILT, MAX_AVATAR_DATA_URL, randomBuilt, sanitizeAvatar } from './avatar'
import { reducer } from './reducer'

describe('profile fields', () => {
  it('normalizes and validates usernames', () => {
    expect(normalizeUsername('  @@Sam_Rivera ')).toBe('sam_rivera')
    for (const ok of ['sam', 'sam_rivera', 'sam.rivera', 'a1_b2']) expect(isValidUsername(ok)).toBe(true)
    for (const bad of ['ab', 'sam rivera', 'sam-rivera', '.sam', 'sam.', 'sa..m', 'x'.repeat(21), '<b>']) {
      expect(isValidUsername(bad)).toBe(false)
    }
  })

  it('validates emails', () => {
    for (const ok of ['sam@example.com', 'a.b+c@mail.co.uk']) expect(isValidEmail(ok)).toBe(true)
    for (const bad of ['', 'sam', 'sam@', '@example.com', 'sam@example', 'sam @example.com', 'a@b@c.com']) {
      expect(isValidEmail(bad)).toBe(false)
    }
  })

  it('reports one message per bad field', () => {
    expect(validateSignIn({ fullName: 'S', username: 'x', email: 'no', notifications: false })).toEqual({
      fullName: 'Enter your full name',
      username: expect.any(String),
      email: 'Enter a valid email address',
    })
    expect(validateSignIn({ fullName: 'Sam Rivera', username: 'sam', email: 'sam@example.com', notifications: false })).toEqual({})
  })

  it('suggests a username from a name', () => {
    expect(suggestUsername('Sam Rivera')).toBe('sam_rivera')
    expect(suggestUsername('José  Núñez')).toBe('jose_nunez')
    expect(suggestUsername('Al')).toBe('')
  })
})

describe('v2 → v3 migration', () => {
  it('turns the old handle into a username and adds empty email and notifications', () => {
    const v3 = createSeed('2026-11-19', '12:00')
    const { username: _u, email: _e, notifications: _n, ...rest } = v3.profile
    void _u; void _e; void _n
    const v2 = { ...v3, signedIn: true, profile: { ...rest, name: 'Sam', handle: '@sam' } }
    const out = sanitizeState(migrate({ schemaVersion: 2, data: v2 }, MIGRATIONS, SCHEMA_VERSION), '2026-11-19', () => true)!
    expect(out.profile).toMatchObject({ name: 'Sam', username: 'sam', email: '', notifications: false })
    expect('handle' in out.profile).toBe(false)
  })

  it('repairs a tampered email or username on load', () => {
    const s = createSeed('2026-11-19', '12:00') as any
    s.profile.email = '<script>@x'
    s.profile.username = 'Robert"); DROP TABLE'
    const out = sanitizeState(s, '2026-11-19', () => true)!
    expect(out.profile).toMatchObject({ email: '', username: 'you' })
  })
})

describe('v3 → v4 migration', () => {
  it('drops the old per-habit difficulty', () => {
    const v4 = createSeed('2026-11-19', '12:00')
    const v3 = { ...v4, signedIn: true, habits: v4.habits.map((h) => ({ ...h, difficulty: 'hard' })) }
    const migrated = migrate({ schemaVersion: 3, data: v3 }, MIGRATIONS, SCHEMA_VERSION) as typeof v4
    expect(migrated.habits.every((h) => !('difficulty' in h))).toBe(true)
    expect(migrated.habits).toHaveLength(v4.habits.length)
  })
})

describe('avatars and habit times', () => {
  const tiny = 'data:image/jpeg;base64,' + 'A'.repeat(100)

  it('keeps valid avatars and replaces anything else with initials', () => {
    expect(sanitizeAvatar({ kind: 'image', dataUrl: tiny })).toEqual({ kind: 'image', dataUrl: tiny })
    for (const bad of [
      { kind: 'image', dataUrl: 'javascript:alert(1)' },
      { kind: 'image', dataUrl: 'data:text/html;base64,PHNjcmlwdD4=' },
      { kind: 'image', dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }, // SVG can carry script
      { kind: 'image', dataUrl: 'data:image/png;base64,' + 'A'.repeat(MAX_AVATAR_DATA_URL) },
      { kind: 'weird' },
      null,
      'text',
    ]) {
      expect(sanitizeAvatar(bad)).toEqual({ kind: 'initials' })
    }
  })

  it('repairs built avatars part by part', () => {
    const out = sanitizeAvatar({ kind: 'built', ...DEFAULT_BUILT, hair: 'mohawk<script>', skin: 'red' })
    expect(out).toEqual({ kind: 'built', ...DEFAULT_BUILT })
    const shuffled = randomBuilt(() => 0.999)
    expect(sanitizeAvatar({ kind: 'built', ...shuffled })).toEqual({ kind: 'built', ...shuffled })
  })

  it('keeps only real habit times', () => {
    expect(timeFields('07:15', 30)).toEqual({ time: '07:15', duration: 30 })
    expect(timeFields('07:15', 999)).toEqual({ time: '07:15', duration: 15 })
    for (const bad of ['7:15', '24:00', '12:60', 'noon', 715, null]) expect(timeFields(bad, 30)).toEqual({})
  })

  it('v4 → v5 gives existing profiles an initials avatar', () => {
    const v5 = createSeed('2026-11-19', '12:00')
    const { avatar: _a, ...profile } = v5.profile
    void _a
    const out = sanitizeState(migrate({ schemaVersion: 4, data: { ...v5, profile } }, MIGRATIONS, SCHEMA_VERSION), '2026-11-19', () => true)!
    expect(out.profile.avatar).toEqual({ kind: 'initials' })
  })

  it('profile edits and avatar changes go through validation', () => {
    const s0 = { ...createSeed('2026-11-19', '12:00'), signedIn: true }
    const s1 = reducer(s0, { type: 'updateProfile', fields: { fullName: 'Ana Lima', username: '@Ana', email: 'ana@example.com' } })
    expect(s1.profile).toMatchObject({ name: 'Ana Lima', username: 'ana', email: 'ana@example.com' })
    expect(reducer(s1, { type: 'updateProfile', fields: { fullName: 'Ana', username: 'a b', email: 'x' } })).toBe(s1)
    const s2 = reducer(s1, { type: 'setAvatar', avatar: { kind: 'image', dataUrl: 'javascript:alert(1)' } })
    expect(s2.profile.avatar).toEqual({ kind: 'initials' })
  })
})
