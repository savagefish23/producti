import { describe, expect, it } from 'vitest'
import { createSeed } from './seed'
import { isValidEmail, isValidUsername, normalizeUsername, suggestUsername, validateSignIn } from './profile'
import { migrate, MIGRATIONS, SCHEMA_VERSION } from './storage'
import { sanitizeState } from './validate'

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
