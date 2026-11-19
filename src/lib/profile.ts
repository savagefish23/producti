/*
 * Rules for the profile fields on the sign-in form. Used by the form (to
 * show errors), the reducer (to refuse bad input) and the loader (to repair
 * saved data), so all three agree.
 */

export const PROFILE_LIMITS = {
  fullName: 40,
  username: 20,
  email: 254,
} as const

export interface SignInFields {
  fullName: string
  username: string
  email: string
  notifications: boolean
}

export type FieldErrors = Partial<Record<'fullName' | 'username' | 'email', string>>

/** "@Sam.Rivera " → "sam.rivera": lowercase, no leading @, no spaces. */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase()
}

const USERNAME = /^[a-z0-9_.]{3,20}$/

export function isValidUsername(username: string): boolean {
  return USERNAME.test(username) && !username.startsWith('.') && !username.endsWith('.') && !username.includes('..')
}

/*
 * Deliberately simple: one @, something on both sides, a dot in the domain,
 * no spaces. Real validation is sending a confirmation email, which needs a
 * server.
 */
const EMAIL = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return email.length <= PROFILE_LIMITS.email && EMAIL.test(email)
}

export function validateSignIn(fields: SignInFields): FieldErrors {
  const errors: FieldErrors = {}
  const fullName = fields.fullName.trim()
  if (fullName.length < 2) errors.fullName = 'Enter your full name'
  else if (fullName.length > PROFILE_LIMITS.fullName) errors.fullName = `Use ${PROFILE_LIMITS.fullName} characters or fewer`

  const username = normalizeUsername(fields.username)
  if (!isValidUsername(username)) {
    errors.username = '3–20 characters: letters, numbers, underscores or dots'
  }

  if (!isValidEmail(normalizeEmail(fields.email))) errors.email = 'Enter a valid email address'
  return errors
}

/** A starting username from a name: "Sam Rivera" → "sam_rivera". */
export function suggestUsername(fullName: string): string {
  const base = fullName
    .normalize('NFKD')
    .replace(/[^\w\s.]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .slice(0, PROFILE_LIMITS.username)
  return isValidUsername(base) ? base : ''
}
