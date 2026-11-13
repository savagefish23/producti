import type { ReactNode } from 'react'

interface Props {
  /** 0–1 */
  value: number
  size?: number
  stroke?: number
  /** Tailwind stroke-* classes for the track and the progress arc. */
  trackClass?: string
  arcClass?: string
  children?: ReactNode
}

export function ProgressRing({
  value,
  size = 72,
  stroke = 7,
  trackClass = 'stroke-white/25',
  arcClass = 'stroke-white',
  children,
}: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, value))

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={`${arcClass} transition-[stroke-dashoffset] duration-500 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
