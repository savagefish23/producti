import type { ProfileAvatar } from '../lib/avatar'
import { AvatarArt } from './AvatarArt'
import { useMeAvatar } from './meAvatar'

interface Props {
  name: string
  /** The signed-in user: shows their chosen picture. */
  me?: boolean
  /** Show this picture instead (e.g. a preview while editing). */
  avatar?: ProfileAvatar
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-24 text-3xl' }

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Decorative avatar — the name is always shown next to it. */
export function Avatar({ name, me = false, avatar, size = 'md', className = '' }: Props) {
  const mine = useMeAvatar()
  const picture: ProfileAvatar = avatar ?? (me ? mine : { kind: 'initials' })
  const box = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${SIZES[size]} ${className}`

  if (picture.kind === 'image') {
    return <img src={picture.dataUrl} alt="" aria-hidden="true" className={`${box} object-cover`} />
  }
  if (picture.kind === 'built') {
    return (
      <span aria-hidden="true" className={box}>
        <AvatarArt avatar={picture} className="size-full" />
      </span>
    )
  }
  return (
    <span aria-hidden="true" className={`${box} font-medium ${me || avatar ? 'bg-ink text-canvas' : 'bg-raised text-ink-2'}`}>
      {initials(name)}
    </span>
  )
}
