import { Flame, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DayProgress, RankInfo } from '../lib/game'
import { WEEKDAY_SHORT, weekdayOf } from '../lib/dates'
import type { ISODate } from '../types'
import { Gauge } from './Gauge'
import { RankEmblem } from './RankEmblem'
import { STATUS_LABEL, STATUSES, type StatusKind } from '../types'
import { STATUS_ICONS } from './icons'

/** Page header: title on the left, actions on the right. */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {subtitle && <p className="text-ink-2 text-[13px]">{subtitle}</p>}
        <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
      </div>
      {children}
    </div>
  )
}

export function StatusControl({ status, onStatus }: { status: StatusKind; onStatus: (s: StatusKind) => void }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span id="status-label" className="text-ink-2 shrink-0 text-[13px]">
        Status
      </span>
      <div role="radiogroup" aria-labelledby="status-label" className="seg no-scrollbar max-w-full overflow-x-auto">
        {STATUSES.map((option) => {
          const Icon = STATUS_ICONS[option]
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === status}
              onClick={() => onStatus(option)}
              className="seg-item"
            >
              <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
              {STATUS_LABEL[option]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface OverviewProps {
  xp: number
  rank: RankInfo
  progress: DayProgress
  bestStreak: number
  /** The last seven days, oldest first, with XP earned on each. */
  week: { date: ISODate; xp: number }[]
  today: ISODate
}

/** Today's hero row: rank, today's score and XP over the last week. */
export function Overview({ xp, rank, progress, bestStreak, week, today }: OverviewProps) {
  const score = progress.due === 0 ? null : Math.round(progress.ratio * 100)
  const maxXp = Math.max(1, ...week.map((d) => d.xp))
  const weekTotal = week.reduce((s, d) => s + d.xp, 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,1.25fr)]">
      {/* Rank */}
      <section className="card relative overflow-hidden p-5" aria-labelledby="rank-card-title">
        <h2 id="rank-card-title" className="text-ink-2 text-[13px]">
          Rank
        </h2>
        <div className="mt-2 flex items-center gap-4">
          <RankEmblem rank={rank} size={76} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-semibold tracking-[-0.02em]">{rank.name}</p>
            <p className="mono text-ink-2 flex items-center gap-1 text-sm">
              <Zap className="text-accent-text size-3.5" strokeWidth={2} aria-hidden="true" />
              {xp.toLocaleString('en-US')} XP
            </p>
          </div>
        </div>
        <div
          className="bg-raised mt-4 h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-label={rank.next ? `Progress to ${rank.next.name}` : 'Top rank'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(rank.progress * 100)}
        >
          <div
            className="bg-accent h-full origin-left rounded-full transition-transform duration-500 ease-smooth"
            style={{ transform: `scaleX(${rank.progress})` }}
          />
        </div>
        <div className="mono text-muted mt-2 flex justify-between text-xs">
          <span>{rank.next ? `${rank.xpToNext.toLocaleString('en-US')} XP to ${rank.next.name}` : 'Top rank reached'}</span>
          <span className="flex items-center gap-1">
            <Flame className="text-accent-text size-3.5" strokeWidth={2} aria-hidden="true" />
            best {bestStreak}d
          </span>
        </div>
      </section>

      {/* Today's score */}
      <section className="card flex flex-col items-center p-4" aria-labelledby="score-title">
        <h2 id="score-title" className="text-ink-2 self-start text-[13px]">
          Today's score
        </h2>
        <Gauge value={score} label={progress.due === 0 ? 'Rest day' : `${progress.done} of ${progress.due} done`} size={200} />
      </section>

      {/* Last 7 days XP */}
      <section className="card p-5 md:col-span-2 xl:col-span-1" aria-labelledby="week-xp-title">
        <div className="flex items-baseline justify-between">
          <h2 id="week-xp-title" className="text-ink-2 text-[13px]">
            XP, last 7 days
          </h2>
          <p className="mono text-sm font-medium">{weekTotal.toLocaleString('en-US')}</p>
        </div>
        <ol className="mt-4 grid h-32 grid-cols-7 items-end gap-2" aria-label="XP per day">
          {week.map((d) => (
            <li key={d.date} className="flex h-full flex-col items-center justify-end gap-1.5" title={`${d.xp} XP`}>
              <span className="mono text-muted text-[10px]">{d.xp || ''}</span>
              <span
                className={`w-full max-w-7 rounded-t-md ${d.date === today ? 'bg-accent' : 'bg-accent/45'}`}
                style={{ height: `${Math.max(4, (d.xp / maxXp) * 100)}%` }}
              />
              <span className={`text-[11px] ${d.date === today ? 'text-ink font-medium' : 'text-muted'}`}>
                {d.date === today ? 'Today' : WEEKDAY_SHORT[weekdayOf(d.date)]}
              </span>
              <span className="sr-only">{d.xp} XP</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
