import type { RankStep } from '../lib/game'

/*
 * Rank emblems: one shield per tier, growing more elaborate as you climb.
 * Tier colour is the one place the chrome allows a rich hue, because the
 * emblem is the reward. Divisions show as 1–3 bars at the foot of the shield.
 */

const TIER_COLOR: Record<RankStep['tier'], { main: string; dark: string; light: string }> = {
  Bronze: { main: '#b8743a', dark: '#7a4a22', light: '#e3a873' },
  Silver: { main: '#9ba7b6', dark: '#5e6877', light: '#d6dde6' },
  Gold: { main: '#e2b03b', dark: '#9a7317', light: '#f6dc8f' },
  Platinum: { main: '#4fbcb3', dark: '#21776f', light: '#a5e6df' },
  Diamond: { main: '#5b8def', dark: '#2b55b0', light: '#b3cbfb' },
  Champion: { main: '#9d6cf0', dark: '#5f35b0', light: '#d2bcfb' },
  Overlord: { main: '#e0527b', dark: '#962849', light: '#f6a9bf' },
  Eternal: { main: '#34d399', dark: '#047857', light: '#f5d77a' },
}

const SHIELD = 'M32 5 L53 13 V31 C53 45 44 54 32 59 C20 54 11 45 11 31 V13 Z'
const INNER = 'M32 11 L48 17 V31 C48 42 41 49 32 53 C23 49 16 42 16 31 V17 Z'

function Glyph({ tierIndex, fill }: { tierIndex: number; fill: string }) {
  switch (tierIndex) {
    case 0: // Bronze: single chevron
      return <path d="M24 30 L32 24 L40 30 L40 34 L32 28 L24 34 Z" fill={fill} />
    case 1: // Silver: double chevron
      return (
        <g fill={fill}>
          <path d="M24 26 L32 20 L40 26 L40 30 L32 24 L24 30 Z" />
          <path d="M24 34 L32 28 L40 34 L40 38 L32 32 L24 38 Z" />
        </g>
      )
    case 2: // Gold: triple chevron
      return (
        <g fill={fill}>
          <path d="M25 23 L32 18 L39 23 L39 26.5 L32 21.5 L25 26.5 Z" />
          <path d="M25 30 L32 25 L39 30 L39 33.5 L32 28.5 L25 33.5 Z" />
          <path d="M25 37 L32 32 L39 37 L39 40.5 L32 35.5 L25 40.5 Z" />
        </g>
      )
    case 3: // Platinum: cut gem
      return <path d="M24 26 L28 20 H36 L40 26 L32 40 Z M28 20 L32 26 L36 20 M24 26 H40" fill={fill} stroke="rgba(0,0,0,0.25)" strokeWidth="1" strokeLinejoin="round" />
    case 4: // Diamond: brilliant
      return (
        <g fill={fill} stroke="rgba(0,0,0,0.25)" strokeWidth="1" strokeLinejoin="round">
          <path d="M22 26 L27 19 H37 L42 26 L32 42 Z" />
          <path d="M22 26 H42 M27 19 L30 26 L32 42 L34 26 L37 19 M30 26 L32 19 L34 26" fill="none" />
        </g>
      )
    case 5: // Champion: star
      return <path d="M32 18 L35.5 26 L44 26.8 L37.6 32.4 L39.6 41 L32 36.5 L24.4 41 L26.4 32.4 L20 26.8 L28.5 26 Z" fill={fill} />
    case 6: // Overlord: crown
      return <path d="M21 38 L23 22 L28.5 29 L32 19 L35.5 29 L41 22 L43 38 Z M22 40 H42 V43 H22 Z" fill={fill} />
    default: // Eternal: star in a ring
      return (
        <g>
          <circle cx="32" cy="30" r="12" fill="none" stroke={fill} strokeWidth="2.5" />
          <path d="M32 21 L34.6 27 L41 27.6 L36.2 31.8 L37.7 38 L32 34.6 L26.3 38 L27.8 31.8 L23 27.6 L29.4 27 Z" fill={fill} />
        </g>
      )
  }
}

interface Props {
  rank: Pick<RankStep, 'tier' | 'tierIndex' | 'division' | 'name'>
  size?: number
  /** Greyed out, for ranks not reached yet. */
  locked?: boolean
  className?: string
}

export function RankEmblem({ rank, size = 56, locked = false, className = '' }: Props) {
  const c = TIER_COLOR[rank.tier]
  const main = locked ? 'var(--bar)' : c.main
  const dark = locked ? 'var(--line-strong)' : c.dark
  const light = locked ? 'var(--raised)' : c.light
  const wings = rank.tierIndex >= 5

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={`${rank.name} emblem`}>
      {wings && (
        <g fill={dark}>
          <path d="M11 20 C4 22 1 30 3 38 C6 34 9 33 11 33 Z" />
          <path d="M53 20 C60 22 63 30 61 38 C58 34 55 33 53 33 Z" />
        </g>
      )}
      <path d={SHIELD} fill={main} stroke={dark} strokeWidth="2" strokeLinejoin="round" />
      <path d={INNER} fill={dark} opacity="0.35" />
      <path d="M32 11 L48 17 V24 C42 21 37 20 32 20 C27 20 22 21 16 24 V17 Z" fill="#ffffff" opacity="0.18" />
      <Glyph tierIndex={rank.tierIndex} fill={light} />
      {rank.division !== null && (
        <g fill={light}>
          {Array.from({ length: rank.division }, (_, i) => {
            const width = 5
            const gap = 2
            const total = rank.division! * width + (rank.division! - 1) * gap
            return <rect key={i} x={32 - total / 2 + i * (width + gap)} y="46" width={width} height="2.5" rx="1" />
          })}
        </g>
      )}
    </svg>
  )
}
