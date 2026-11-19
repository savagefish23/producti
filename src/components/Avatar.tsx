interface Props {
  name: string
  /** The signed-in user gets the ink fill; friends sit on the raised surface. */
  me?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const SIZES = { sm: 'size-8 text-xs', md: 'size-10 text-sm' }

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Decorative initials avatar — the name is always shown next to it. */
export function Avatar({ name, me = false, size = 'md', className = '' }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${SIZES[size]} ${
        me ? 'bg-ink text-canvas' : 'bg-raised text-ink-2'
      } ${className}`}
    >
      {initials(name)}
    </span>
  )
}
