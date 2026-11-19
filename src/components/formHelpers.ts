/** Shared bits for the account forms. */

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

export const inputClass = (invalid: boolean) =>
  `bg-surface placeholder:text-muted mt-2 h-11 w-full rounded-lg border px-3 text-[15px] outline-none focus:ring-2 ${
    invalid
      ? 'border-negative focus:ring-(--negative)/20'
      : 'border-line-strong focus:border-accent focus:ring-(--accent-soft)'
  }`

export function passwordError(password: string): string | undefined {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters`
  if (password.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer`
  return undefined
}
