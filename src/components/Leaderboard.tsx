import { useState } from 'react'
import { Avatar } from './Avatar'
import { formatNumber } from './styles'

export interface LeaderboardEntry {
  id: string
  name: string
  isMe: boolean
  weeklyXp: number
  streak: number
}

interface Props {
  entries: LeaderboardEntry[]
}

type Metric = 'weeklyXp' | 'streak'

const show = (metric: Metric, value: number) =>
  metric === 'weeklyXp' ? `${formatNumber(value)} XP` : `${value} ${value === 1 ? 'day' : 'days'}`

/** Weekly leaderboard: the user against the simulated friends. */
export function Leaderboard({ entries }: Props) {
  const [metric, setMetric] = useState<Metric>('weeklyXp')
  const other: Metric = metric === 'weeklyXp' ? 'streak' : 'weeklyXp'
  // Ties fall back to the other metric, then to name, so the order is stable.
  const ranked = [...entries].sort(
    (a, b) => b[metric] - a[metric] || b[other] - a[other] || a.name.localeCompare(b.name),
  )
  const top = Math.max(1, ...ranked.map((e) => e[metric]))

  return (
    <section className="card p-5" aria-labelledby="board-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="board-title" className="text-base font-semibold">
            Leaderboard
          </h2>
          <p className="text-ink-2 text-[13px]">This week, Monday to today</p>
        </div>
        <div role="tablist" aria-label="Rank by" className="seg">
          {(['weeklyXp', 'streak'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={metric === value}
              onClick={() => setMetric(value)}
              className="seg-item"
            >
              {value === 'weeklyXp' ? 'Weekly XP' : 'Streak'}
            </button>
          ))}
        </div>
      </div>

      {ranked.length >= 3 && <Podium top={ranked.slice(0, 3)} show={(e) => show(metric, e[metric])} />}

      <ol className="mt-4 space-y-1">
        {ranked.map((entry, index) => (
          <li
            key={entry.id}
            aria-current={entry.isMe ? 'true' : undefined}
            className={`flex h-14 items-center gap-3 rounded-lg px-3 ${entry.isMe ? 'bg-raised' : ''}`}
          >
            <span className="mono text-muted w-4 text-[13px]">{index + 1}</span>
            <Avatar name={entry.name} me={entry.isMe} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.isMe ? 'You' : entry.name}</p>
              <div className="bg-raised mt-1 h-1 overflow-hidden rounded-full" aria-hidden="true">
                <div
                  className={`h-full origin-left rounded-full transition-transform duration-500 ease-smooth ${
                    entry.isMe ? 'bg-accent' : 'bg-line-strong'
                  }`}
                  style={{ transform: `scaleX(${entry[metric] / top})` }}
                />
              </div>
            </div>
            <div className="mono shrink-0 text-right">
              <p className="text-sm font-medium">{show(metric, entry[metric])}</p>
              <p className="text-muted text-xs">{show(other, entry[other])}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/*
 * Top three on steps: 2nd, 1st, 3rd, like a sports podium. Step heights and
 * medal colours are the only decoration; names and figures stay in ink.
 */
const MEDAL = ['#e2b03b', '#a9b4c2', '#c58448']

function Podium({ top, show }: { top: LeaderboardEntry[]; show: (e: LeaderboardEntry) => string }) {
  const order = [1, 0, 2] // 2nd, 1st, 3rd
  const heights = ['h-24', 'h-16', 'h-12']
  return (
    <ol className="mt-5 grid grid-cols-3 items-end gap-2" aria-label="Top three">
      {order.map((i) => {
        const entry = top[i]
        return (
          <li key={entry.id} className="flex min-w-0 flex-col items-center">
            <div className="relative">
              <Avatar name={entry.name} me={entry.isMe} size={i === 0 ? "lg" : "md"} className="ring-surface ring-2" />
              <span
                className="mono ring-surface absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-[#1c1c22] ring-2"
                style={{ background: MEDAL[i] }}
              >
                {i + 1}
              </span>
            </div>
            <p className="mt-3 w-full truncate text-center text-[13px] font-medium">{entry.isMe ? 'You' : entry.name.split(' ')[0]}</p>
            <p className="mono text-muted text-xs">{show(entry)}</p>
            <div
              className={`mt-2 w-full rounded-t-lg ${heights[i]} ${entry.isMe ? 'bg-accent/25' : 'bg-raised'} flex items-start justify-center pt-2`}
              style={{ boxShadow: `inset 0 3px 0 ${MEDAL[i]}` }}
            >
              <span className="mono text-ink-2 text-lg font-semibold">{i + 1}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
