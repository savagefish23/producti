/*
 * A donut chart for shares (e.g. check-ins by category). Each segment is
 * labelled in the legend beside it, so identity is never colour alone.
 */

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface Props {
  segments: DonutSegment[]
  /** Text in the middle, e.g. the total. */
  center: string
  caption: string
  size?: number
}

export function Donut({ segments, center, caption, size = 132 }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const r = 42
  const circumference = 2 * Math.PI * r
  const gap = segments.length > 1 ? 3 : 0
  // Where each segment starts along the circle.
  const starts = segments.map((_, i) =>
    segments.slice(0, i).reduce((sum, prev) => sum + (prev.value / total) * circumference, 0),
  )

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90 shrink-0" role="img" aria-label={`${caption}: ${segments.map((s) => `${s.label} ${s.value}`).join(', ') || 'no data'}`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--raised)" strokeWidth="12" />
        {total > 0 &&
          segments.map((s, i) => {
            const length = (s.value / total) * circumference
            const dash = Math.max(length - gap, 0.5)
            return (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-starts[i]}
              />
            )
          })}
        <g className="rotate-90" style={{ transformOrigin: '50px 50px' }}>
          <text x="50" y="52" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--ink)" fontFamily="var(--font-mono)">
            {center}
          </text>
          <text x="50" y="66" textAnchor="middle" fontSize="8" fill="var(--muted)">
            {caption}
          </text>
        </g>
      </svg>
      <ul className="min-w-0 flex-1 space-y-2 text-[13px]">
        {segments.length === 0 && <li className="text-muted">No check-ins yet</li>}
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
            <span className="text-ink-2 flex-1 truncate">{s.label}</span>
            <span className="mono">{s.value}</span>
            <span className="mono text-muted w-10 text-right text-xs">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
