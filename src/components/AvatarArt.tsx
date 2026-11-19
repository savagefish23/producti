import { useId } from 'react'
import type { BuiltAvatar } from '../lib/avatar'

/** A built avatar as flat SVG art. Decorative; the name is shown beside it. */
export function AvatarArt({ avatar, className = '' }: { avatar: BuiltAvatar; className?: string }) {
  const ink = '#1c1c22'
  // Unique per avatar: several can be on screen at once.
  const id = useId().replace(/:/g, '')
  const circle = `${id}-circle`
  const head = `${id}-head`
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <clipPath id={circle}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
        <clipPath id={head}>
          <circle cx="32" cy="29" r="13" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${circle})`}>
        <rect width="64" height="64" fill={avatar.background} />
        {/* Shoulders and neck */}
        <path d="M10 64 C12 50 22 45 32 45 C42 45 52 50 54 64 Z" fill="#ffffff" opacity="0.9" />
        <rect x="28" y="38" width="8" height="9" rx="3" fill={avatar.skin} />
        {/* Back hair for long styles sits behind the head */}
        {avatar.hair === 'long' && (
          <path d="M18 30 C17 15 25 10 32 10 C40 10 47 15 46 30 L46 44 C43 44 42 42 42 40 L22 40 C22 42 21 44 18 44 Z" fill={avatar.hairColor} />
        )}
        {avatar.hair === 'bun' && <circle cx="32" cy="10" r="5.5" fill={avatar.hairColor} />}
        <circle cx="32" cy="29" r="13" fill={avatar.skin} />
        <Hair style={avatar.hair} color={avatar.hairColor} />
        {avatar.accessory === 'headband' && (
          <rect x="18" y="19" width="28" height="3.2" fill="#ffffff" opacity="0.92" clipPath={`url(#${head})`} />
        )}
        <Eyes style={avatar.eyes} ink={ink} />
        <Mouth style={avatar.mouth} ink={ink} />
        {avatar.accessory === 'glasses' && (
          <g fill="none" stroke={ink} strokeWidth="1.4">
            <circle cx="27" cy="29.5" r="3.8" />
            <circle cx="37" cy="29.5" r="3.8" />
            <path d="M30.8 29.5 H33.2" />
          </g>
        )}
        {avatar.accessory === 'shades' && (
          <g fill={ink}>
            <rect x="22.5" y="26.5" width="8.5" height="5.5" rx="2" />
            <rect x="33" y="26.5" width="8.5" height="5.5" rx="2" />
            <rect x="30.5" y="28" width="3" height="1.4" />
          </g>
        )}
      </g>
    </svg>
  )
}

function Hair({ style, color }: { style: BuiltAvatar['hair']; color: string }) {
  switch (style) {
    case 'short':
    case 'bun':
      return <path d="M19 28 C18 16 25 11.5 32 11.5 C39 11.5 46 16 45 28 C42 21.5 37 19 32 19 C27 19 22 21.5 19 28 Z" fill={color} />
    case 'long':
      return <path d="M19 27 C19 16 25 12 32 12 C39 12 45 16 45 27 C41 21 37 19 32 19 C27 19 23 21 19 27 Z" fill={color} />
    case 'curly':
      return (
        <g fill={color}>
          {[
            [20, 23],
            [24.5, 17],
            [31, 14.5],
            [37.5, 16.5],
            [43, 22],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="5.6" />
          ))}
        </g>
      )
    case 'spiky':
      return <path d="M19 27 L20 15 L24.5 20 L27 10.5 L31.5 18 L35.5 10 L38.5 19 L43.5 14 L45 27 C41 21 37 19 32 19 C27 19 23 21 19 27 Z" fill={color} />
    default:
      return null
  }
}

function Eyes({ style, ink }: { style: BuiltAvatar['eyes']; ink: string }) {
  const stroke = { fill: 'none', stroke: ink, strokeWidth: 1.6, strokeLinecap: 'round' as const }
  switch (style) {
    case 'happy':
      return (
        <g {...stroke}>
          <path d="M25 30.5 Q27 27.8 29 30.5" />
          <path d="M35 30.5 Q37 27.8 39 30.5" />
        </g>
      )
    case 'wink':
      return (
        <g>
          <circle cx="27" cy="29.5" r="1.7" fill={ink} />
          <path d="M35 29.8 H39" {...stroke} />
        </g>
      )
    case 'sleepy':
      return (
        <g {...stroke}>
          <path d="M25 30 Q27 31.6 29 30" />
          <path d="M35 30 Q37 31.6 39 30" />
        </g>
      )
    default:
      return (
        <g fill={ink}>
          <circle cx="27" cy="29.5" r="1.7" />
          <circle cx="37" cy="29.5" r="1.7" />
        </g>
      )
  }
}

function Mouth({ style, ink }: { style: BuiltAvatar['mouth']; ink: string }) {
  switch (style) {
    case 'grin':
      return <path d="M27 34.5 Q32 40.5 37 34.5 Z" fill="#ffffff" stroke={ink} strokeWidth="1.3" strokeLinejoin="round" />
    case 'flat':
      return <path d="M29 36 H35" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
    case 'open':
      return <ellipse cx="32" cy="36" rx="2.2" ry="2.6" fill="#5a1f22" />
    default:
      return <path d="M28 35 Q32 38.6 36 35" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
  }
}
