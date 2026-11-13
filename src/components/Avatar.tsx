import { AVATAR_COLORS } from './styles'

interface Props {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-12 text-base' }

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Decorative initials avatar — the name is always shown next to it. */
export function Avatar({ name, color, size = 'md', className = '' }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${SIZES[size]} ${AVATAR_COLORS[color] ?? AVATAR_COLORS.violet} ${className}`}
    >
      {initials(name)}
    </span>
  )
}
