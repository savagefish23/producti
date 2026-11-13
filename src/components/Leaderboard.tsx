import { Flame, Zap } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from './Avatar'

export interface LeaderboardEntry {
  id: string
  name: string
  color: string
  isMe: boolean
  weeklyXp: number
  streak: number
}

interface Props {
  entries: LeaderboardEntry[]
}

type Metric = 'weeklyXp' | 'streak'

const MEDAL = ['bg-yellow-400 text-yellow-950', 'bg-slate-300 text-slate-800', 'bg-orange-300 text-orange-950']

/** Weekly leaderboard: the user against the simulated friends. */
export function Leaderboard({ entries }: Props) {
  const [metric, setMetric] = useState<Metric>('weeklyXp')
  const other: Metric = metric === 'weeklyXp' ? 'streak' : 'weeklyXp'
  // Ties fall back to the other metric, then to name, so the order is stable.
  const ranked = [...entries].sort(
    (a, b) => b[metric] - a[metric] || b[other] - a[other] || a.name.localeCompare(b.name),
  )
  const top = Math.max(1, ...ranked.map((e) => e[metric]))

  const tab = (value: Metric, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={metric === value}
      onClick={() => setMetric(value)}
      className={`focus-ring rounded-full px-3 py-1 text-xs font-bold transition ${
        metric === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  )

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="board-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="board-title" className="section-title">
            Leaderboard
          </h2>
          <p className="text-muted text-xs">This week, Monday to today</p>
        </div>
        <div role="tablist" aria-label="Rank by" className="bg-sunken flex rounded-full p-0.5">
          {tab('weeklyXp', 'Weekly XP')}
          {tab('streak', 'Streak')}
        </div>
      </div>

      <ol className="mt-3 space-y-1.5">
        {ranked.map((entry, index) => (
          <li
            key={entry.id}
            aria-current={entry.isMe ? 'true' : undefined}
            className={`relative flex items-center gap-3 overflow-hidden rounded-xl px-2.5 py-2 ${
              entry.isMe ? 'bg-indigo-500/10 ring-1 ring-indigo-500/40' : ''
            }`}
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                MEDAL[index] ?? 'text-muted'
              }`}
            >
              {index + 1}
            </span>
            <Avatar name={entry.name} color={entry.color} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-ink truncate text-sm font-bold">
                {entry.isMe ? 'You' : entry.name}
              </p>
              <div className="bg-sunken mt-1 h-1.5 overflow-hidden rounded-full" aria-hidden="true">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                    entry.isMe ? 'bg-indigo-500' : 'bg-indigo-500/40 dark:bg-indigo-400/45'
                  }`}
                  style={{ width: `${(entry[metric] / top) * 100}%` }}
                />
              </div>
            </div>
            <div className="shrink-0 text-right text-xs">
              <p className={`flex items-center justify-end gap-0.5 font-extrabold ${metric === 'weeklyXp' ? 'text-ink text-sm' : 'text-muted'}`}>
                <Zap className="size-3.5 fill-yellow-400 text-yellow-500" aria-hidden="true" />
                {entry.weeklyXp}
                <span className="sr-only"> XP this week</span>
              </p>
              <p className={`flex items-center justify-end gap-0.5 font-extrabold ${metric === 'streak' ? 'text-ink text-sm' : 'text-muted'}`}>
                <Flame className="size-3.5 fill-orange-400 text-orange-500" aria-hidden="true" />
                {entry.streak}
                <span className="sr-only"> active streak days</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
