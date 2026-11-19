import { Crown, Gem, Medal, Shield, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DayProgress, RankInfo, RankName } from '../lib/game'
import { STATUS_LABEL, STATUSES, type StatusKind } from '../types'
import { STATUS_ICONS } from './icons'
import { formatNumber } from './styles'

const RANK_ICON: Record<RankName, LucideIcon> = {
  Bronze: Shield,
  Silver: Medal,
  Gold: Crown,
  Diamond: Gem,
}

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

/** The three headline figures: XP, rank, today's progress. */
export function Overview({ xp, rank, progress }: { xp: number; rank: RankInfo; progress: DayProgress }) {
  const RankIcon = RANK_ICON[rank.name]
  return (
    <dl className="card divide-line grid grid-cols-3 divide-x">
      <Stat label="Total XP" value={formatNumber(xp)} mono>
        All time
      </Stat>
      <Stat
        label="Rank"
        value={
          <span className="inline-flex items-center gap-2">
            <RankIcon className="text-ink-2 hidden size-5 sm:block" strokeWidth={1.75} aria-hidden="true" />
            {rank.name}
          </span>
        }
      >
        <Meter value={rank.progress} label={rank.next ? `Progress to ${rank.next}` : 'Rank progress'} />
        <span className="mono">
          {rank.next ? (
            <>
              {formatNumber(rank.xpToNext)} XP<span className="hidden sm:inline"> to {rank.next}</span>
            </>
          ) : (
            'Top rank'
          )}
        </span>
      </Stat>
      <Stat label="Done today" value={progress.due === 0 ? '0/0' : `${progress.done}/${progress.due}`} mono>
        <Meter value={progress.ratio} label="Today's habits done" accent />
        <span>{progress.due === 0 ? 'Rest day' : 'Habits'}</span>
      </Stat>
    </dl>
  )
}

function Stat({ label, value, mono = false, children }: { label: string; value: ReactNode; mono?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-4 sm:px-5">
      <dt className="text-ink-2 text-[13px]">{label}</dt>
      <dd className={`truncate text-xl leading-8 font-medium tracking-[-0.01em] sm:text-[26px] sm:leading-9 ${mono ? 'mono' : ''}`}>
        {value}
      </dd>
      <dd className="text-muted flex flex-col gap-2 text-xs">{children}</dd>
    </div>
  )
}

function Meter({ value, label, accent = false }: { value: number; label: string; accent?: boolean }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      className="bg-raised h-1 overflow-hidden rounded-full"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div
        className={`h-full origin-left rounded-full transition-transform duration-500 ease-smooth ${accent ? 'bg-accent' : 'bg-ink-2'}`}
        style={{ transform: `scaleX(${percent / 100})` }}
      />
    </div>
  )
}
