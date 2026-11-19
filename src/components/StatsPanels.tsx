import { Lock } from 'lucide-react'
import { checkinsByCategory, consistency, RANKS, type RankInfo } from '../lib/game'
import { CATEGORIES, type Habit, type ISODate } from '../types'
import { Donut } from './Donut'
import { Gauge } from './Gauge'
import { RankEmblem } from './RankEmblem'
import { CATEGORY_HEX } from './styles'

/** Stats header row: 30-day consistency score and check-ins by category. */
export function StatsSummary({ habits, today }: { habits: Habit[]; today: ISODate }) {
  const score = consistency(habits, today, 30)
  const byCategory = checkinsByCategory(habits, today, 30)
  const segments = CATEGORIES.filter((c) => byCategory.has(c)).map((c) => ({
    label: c,
    value: byCategory.get(c) ?? 0,
    color: CATEGORY_HEX[c],
  }))
  const total = segments.reduce((s, x) => s + x.value, 0)

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <section className="card flex flex-col items-center p-5" aria-labelledby="consistency-title">
        <h2 id="consistency-title" className="self-start text-base font-semibold">
          Consistency score
        </h2>
        <p className="text-ink-2 self-start text-[13px]">Scheduled check-ins kept, last 30 days</p>
        <Gauge value={score === null ? null : score * 100} label="out of 100" size={200} />
      </section>

      <section className="card p-5" aria-labelledby="category-title">
        <h2 id="category-title" className="text-base font-semibold">
          Where your effort goes
        </h2>
        <p className="text-ink-2 mb-5 text-[13px]">Check-ins by category, last 30 days</p>
        <Donut segments={segments} center={String(total)} caption="check-ins" size={150} />
      </section>
    </div>
  )
}

/** All 22 ranks, with the ones you have reached in colour. */
export function RankLadder({ rank }: { rank: RankInfo }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="ladder-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ladder-title" className="text-base font-semibold">
          Rank ladder
        </h2>
        <p className="text-ink-2 text-[13px]">
          {rank.step + 1} of {RANKS.length} reached
        </p>
      </div>
      <ol className="mt-5 grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11">
        {RANKS.map((r) => {
          const reached = r.step <= rank.step
          const current = r.step === rank.step
          return (
            <li
              key={r.step}
              aria-current={current ? 'step' : undefined}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center ${current ? 'bg-accent-soft ring-accent ring-1' : ''}`}
            >
              <span className="relative">
                <RankEmblem rank={r} size={44} locked={!reached} />
                {!reached && (
                  <Lock className="text-muted absolute -right-1 -bottom-1 size-3.5" strokeWidth={2} aria-hidden="true" />
                )}
              </span>
              <span className={`text-[11px] leading-tight ${reached ? 'font-medium' : 'text-muted'}`}>{r.name}</span>
              <span className="mono text-muted text-[10px]">{r.minXp.toLocaleString('en-US')}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
