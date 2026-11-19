import { Flame } from 'lucide-react'

/**
 * The signature detail: an ember flame beside a mono figure. Used only where
 * a streak is counted.
 */
export function Streak({ count, size = 'md' }: { count: number; size?: 'sm' | 'md' }) {
  const live = count > 0
  return (
    <span
      className={`mono inline-flex shrink-0 items-center gap-1 font-medium ${size === 'sm' ? 'text-xs' : 'text-[13px]'} ${
        live ? 'text-accent-text' : 'text-muted'
      }`}
      title="Streak: scheduled days in a row"
    >
      <Flame
        className={size === 'sm' ? 'size-3.5' : 'size-4'}
        strokeWidth={1.5}
        fill={live ? 'currentColor' : 'none'}
        fillOpacity={live ? 0.2 : 0}
        aria-hidden="true"
      />
      {count}
      <span className="sr-only"> day streak</span>
    </span>
  )
}
