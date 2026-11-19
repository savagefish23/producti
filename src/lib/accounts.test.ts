import { describe, expect, it } from 'vitest'
import { passwordError } from '../components/formHelpers'
import { reducer } from './reducer'
import { createSeed } from './seed'
import { friendlyAuthError } from './supabase'
import { sanitizeState } from './validate'

describe('account helpers', () => {
  it('requires passwords of 8–72 characters', () => {
    expect(passwordError('short')).toMatch(/at least 8/)
    expect(passwordError('x'.repeat(73))).toMatch(/72/)
    expect(passwordError('correct horse')).toBeUndefined()
  })

  it('turns Supabase errors into plain messages', () => {
    expect(friendlyAuthError('Invalid login credentials')).toBe('That email and password don’t match')
    expect(friendlyAuthError('Email not confirmed')).toMatch(/Confirm your email/)
    expect(friendlyAuthError('User already registered')).toMatch(/already exists/)
    expect(friendlyAuthError('Database error saving new user')).toMatch(/username is taken/)
    expect(friendlyAuthError('For security purposes, you can only request this after 42 seconds.')).toMatch(/Too many attempts/)
    expect(friendlyAuthError('Something new')).toBe('Something new')
  })
})

describe('synced account state', () => {
  const id = '3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a12'

  it('keeps a valid account id and drops a malformed one', () => {
    const s = { ...createSeed('2026-11-19', '12:00'), cloudUserId: id }
    expect(sanitizeState(s, '2026-11-19', () => true)!.cloudUserId).toBe(id)
    const bad = { ...s, cloudUserId: "'; drop table users; --" }
    expect('cloudUserId' in sanitizeState(bad, '2026-11-19', () => true)!).toBe(false)
  })

  it('hydrate replaces the state, and sign-out clears the account', () => {
    const loaded = { ...createSeed('2026-11-19', '12:00'), signedIn: true, cloudUserId: id }
    const s1 = reducer(createSeed('2026-11-19', '12:00'), { type: 'hydrate', state: loaded })
    expect(s1).toBe(loaded)
    const s2 = reducer(s1, { type: 'signOut', date: '2026-11-19', time: '12:00' })
    expect(s2.signedIn).toBe(false)
    expect(s2.cloudUserId).toBeUndefined()
    expect(s2.habits).not.toBe(loaded.habits)
  })
})
