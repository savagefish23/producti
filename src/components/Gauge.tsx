/*
 * A 240° score gauge (0–100). Neutral track, accent arc, the score in the
 * middle with tick labels around it.
 */

interface Props {
  /** 0–100, or null for "no data". */
  value: number | null
  label: string
  size?: number
}

const SWEEP = 240
const START = 150 // degrees, measured clockwise from +x; 150° is lower-left

function point(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = point(cx, cy, r, from)
  const [x2, y2] = point(cx, cy, r, to)
  const large = to - from > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

export function Gauge({ value, label, size = 180 }: Props) {
  const cx = 110
  const cy = 104
  const r = 76
  const v = value === null ? 0 : Math.min(100, Math.max(0, value))
  const end = START + (SWEEP * v) / 100

  return (
    <svg
      viewBox="0 0 220 170"
      width={size}
      height={(size * 170) / 220}
      role="img"
      aria-label={value === null ? `${label}: no data yet` : `${label}: ${Math.round(v)} out of 100`}
    >
      <path d={arc(cx, cy, r, START, START + SWEEP)} fill="none" stroke="var(--raised)" strokeWidth="16" strokeLinecap="round" />
      {value !== null && v > 0 && (
        <path
          d={arc(cx, cy, r, START, Math.max(end, START + 0.5))}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="16"
          strokeLinecap="round"
          className="transition-[d] duration-500"
        />
      )}
      {[0, 25, 50, 75, 100].map((t) => {
        const [lx, ly] = point(cx, cy, r + 20, START + (SWEEP * t) / 100)
        return (
          <text key={t} x={lx} y={ly + 4} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">
            {t}
          </text>
        )
      })}
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="40" fontWeight="600" fill="var(--ink)" fontFamily="var(--font-mono)">
        {value === null ? '–' : Math.round(v)}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize="12" fill="var(--ink-2)">
        {label}
      </text>
    </svg>
  )
}
