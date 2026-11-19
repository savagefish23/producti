import { Crown, Gem, History, LogOut, Medal, Moon, Shield, Sun, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { formatDay } from '../lib/dates'
import type { DayProgress, RankInfo, RankName } from '../lib/game'
import { STATUS_LABEL, STATUSES, type ISODate, type StatusKind, type Theme } from '../types'
import { Avatar } from './Avatar'
import { STATUS_ICONS } from './icons'
import { Logo } from './Logo'
import { formatNumber } from './styles'

const RANK_ICON: Record<RankName, LucideIcon> = {
  Bronze: Shield,
  Silver: Medal,
  Gold: Crown,
  Diamond: Gem,
}

interface Props {
  name: string
  today: ISODate
  xp: number
  rank: RankInfo
  progress: DayProgress
  status: StatusKind
  onStatus: (status: StatusKind) => void
  theme: Theme
  onToggleTheme: () => void
  onSignOut: () => void
  dayOffset: number
}

/** Top bar, page title, status control and the three overview figures. */
export function Header({
  name,
  today,
  xp,
  rank,
  progress,
  status,
  onStatus,
  theme,
  onToggleTheme,
  onSignOut,
  dayOffset,
}: Props) {
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const RankIcon = RANK_ICON[rank.name]

  return (
    <header>
      <div className="border-line bg-surface border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <span className="text-[17px] font-semibold">Producti</span>
          <span
            className="mono text-muted hidden items-center gap-2 text-xs sm:inline-flex"
            title="Friends, their check-ins and replies are simulated on this device. Nothing is sent anywhere."
          >
            <span className="bg-muted size-1.5 rounded-full" aria-hidden="true" />
            Demo, simulated friends
          </span>
          <span className="mono text-muted text-xs sm:hidden" title="Friends are simulated on this device">
            Demo
          </span>
          {dayOffset > 0 && (
            <span className="mono text-accent-text inline-flex items-center gap-1 text-xs">
              <History className="size-3.5" strokeWidth={1.5} aria-hidden="true" />+{dayOffset}d
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="btn btn-ghost btn-icon"
            >
              {theme === 'dark' ? (
                <Sun className="size-4.5" strokeWidth={1.5} />
              ) : (
                <Moon className="size-4.5" strokeWidth={1.5} />
              )}
            </button>
            {confirmSignOut ? (
              <span className="flex items-center gap-1">
                <span className="text-ink-2 hidden text-[13px] md:inline">Clears this device</span>
                <button type="button" onClick={onSignOut} className="btn btn-sm btn-secondary">
                  Sign out
                </button>
                <button type="button" onClick={() => setConfirmSignOut(false)} className="btn btn-sm btn-ghost">
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className="btn btn-ghost h-9 gap-2 pr-2 pl-1"
                aria-label={`Signed in as ${name}. Sign out`}
              >
                <Avatar name={name} me size="sm" />
                <span className="text-ink hidden max-w-32 truncate sm:inline">{name}</span>
                <LogOut className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-ink-2 text-[13px]">{formatDay(today)}</p>
            <h1 className="text-[28px] leading-tight font-semibold">Today</h1>
          </div>

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
                    <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    {STATUS_LABEL[option]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <dl className="card divide-line mt-6 grid grid-cols-3 divide-x">
          <Stat label="Total XP" value={formatNumber(xp)} mono>
            All time
          </Stat>

          <Stat
            label="Rank"
            value={
              <span className="inline-flex items-center gap-2">
                <RankIcon className="text-ink-2 hidden size-5 sm:block" strokeWidth={1.5} aria-hidden="true" />
                {rank.name}
              </span>
            }
          >
            <Meter value={rank.progress} label={rank.next ? `Progress to ${rank.next}` : 'Rank progress'} />
            <span className="mono">
              {rank.next ? <>{formatNumber(rank.xpToNext)} XP<span className="hidden sm:inline"> to {rank.next}</span></> : 'Top rank'}
            </span>
          </Stat>

          <Stat label="Done today" value={progress.due === 0 ? '0/0' : `${progress.done}/${progress.due}`} mono>
            <Meter value={progress.ratio} label="Today's habits done" />
            <span>{progress.due === 0 ? 'Rest day' : 'Habits'}</span>
          </Stat>
        </dl>
      </div>
    </header>
  )
}

function Stat({
  label,
  value,
  mono = false,
  children,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-4 sm:px-5">
      <dt className="text-ink-2 text-[13px]">{label}</dt>
      <dd className={`truncate text-xl leading-8 font-medium sm:text-[28px] sm:leading-9 ${mono ? 'mono' : ''}`}>{value}</dd>
      <dd className="text-muted flex flex-col gap-2 text-xs">{children}</dd>
    </div>
  )
}

function Meter({ value, label }: { value: number; label: string }) {
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
        className="bg-ink-2 h-full origin-left rounded-full transition-transform duration-500 ease-smooth"
        style={{ transform: `scaleX(${percent / 100})` }}
      />
    </div>
  )
}
