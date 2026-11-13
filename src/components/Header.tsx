import { Crown, FlaskConical, Gem, History, Medal, Moon, Shield, Sun, Zap, type LucideIcon } from 'lucide-react'
import { formatDay } from '../lib/dates'
import type { DayProgress, RankInfo, RankName } from '../lib/game'
import { STATUSES, type ISODate, type StatusKind, type Theme } from '../types'
import { Avatar } from './Avatar'
import { STATUS_ICONS } from './icons'
import { ProgressRing } from './ProgressRing'

const RANK_STYLE: Record<RankName, { icon: LucideIcon; badge: string }> = {
  Bronze: { icon: Shield, badge: 'bg-orange-300 text-orange-950' },
  Silver: { icon: Medal, badge: 'bg-slate-200 text-slate-800' },
  Gold: { icon: Crown, badge: 'bg-yellow-300 text-yellow-950' },
  Diamond: { icon: Gem, badge: 'bg-cyan-200 text-cyan-950' },
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
  dayOffset: number
}

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
  dayOffset,
}: Props) {
  const RankIcon = RANK_STYLE[rank.name].icon
  const percent = Math.round(progress.ratio * 100)

  return (
    <header className="bg-linear-to-br from-violet-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/20 lg:rounded-b-3xl">
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-5 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight">Producti</span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold"
            title="Friends, their check-ins and replies are simulated on this device. Nothing is sent anywhere."
          >
            <FlaskConical className="size-3.5" aria-hidden="true" />
            Demo mode — simulated friends
          </span>
          {dayOffset > 0 && (
            <span className="hidden items-center gap-1 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-bold text-amber-950 sm:inline-flex">
              <History className="size-3.5" aria-hidden="true" />
              Time travel +{dayOffset}d
            </span>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-auto inline-flex size-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          </button>
        </div>

        {/* Profile + rank + ring */}
        <div className="mt-5 flex items-center gap-4">
          <Avatar name={name} color="me" size="lg" className="ring-2 ring-white/40" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/75">{formatDay(today)}</p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Hey, {name}</h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${RANK_STYLE[rank.name].badge}`}
              >
                <RankIcon className="size-3.5" aria-hidden="true" />
                {rank.name}
              </span>
            </div>

            <div className="mt-2.5 max-w-md">
              <div className="flex items-baseline justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-bold">
                  <Zap className="size-3.5 fill-yellow-300 text-yellow-300" aria-hidden="true" />
                  {xp.toLocaleString()} XP
                </span>
                <span className="text-white/75">
                  {rank.next ? `${rank.xpToNext.toLocaleString()} XP to ${rank.next}` : 'Top rank reached'}
                </span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20"
                role="progressbar"
                aria-label={rank.next ? `Progress to ${rank.next}` : 'Rank progress'}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(rank.progress * 100)}
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-yellow-300 to-amber-300 transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(3, rank.progress * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div
            role="img"
            aria-label={`Today: ${progress.done} of ${progress.due} habits done`}
            className="flex flex-col items-center gap-1"
          >
            <ProgressRing value={progress.ratio} size={76}>
              <span className="text-lg leading-none font-extrabold">
                {percent}
                <span className="text-xs font-bold">%</span>
              </span>
            </ProgressRing>
            <span className="text-[11px] font-semibold text-white/80">
              {progress.due === 0 ? 'Rest day' : `${progress.done}/${progress.due} today`}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 flex items-center gap-2.5">
          <span id="status-label" className="shrink-0 text-xs font-semibold text-white/75">
            Status
          </span>
          <div
            role="radiogroup"
            aria-labelledby="status-label"
            className="no-scrollbar flex gap-1.5 overflow-x-auto"
          >
            {STATUSES.map((option) => {
              const Icon = STATUS_ICONS[option]
              const active = option === status
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onStatus(option)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    active ? 'bg-white text-indigo-700 shadow-sm' : 'bg-white/12 text-white hover:bg-white/22'
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
