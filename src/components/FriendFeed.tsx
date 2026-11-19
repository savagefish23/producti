import { ArrowRight, Heart, MessageCircle } from 'lucide-react'
import { formatWhen } from '../lib/dates'
import type { FeedItem, Friend, ISODate } from '../types'
import { Avatar } from './Avatar'
import { Streak } from './Streak'

interface Props {
  feed: FeedItem[]
  friends: Friend[]
  today: ISODate
  myName: string
  onCheer: (item: FeedItem) => void
  title?: string
  /** How many items to show. */
  limit?: number
  /** Adds a link to the full feed. */
  viewAllHref?: string
  /** Narrow column: icon-only cheer buttons. */
  compact?: boolean
}

export function FriendFeed({ feed, friends, today, myName, onCheer, title = 'Check-ins', limit = 14, viewAllHref, compact = false }: Props) {
  const byId = new Map(friends.map((f) => [f.id, f]))
  const items = feed.slice(0, limit)

  return (
    <section className="card p-5" aria-labelledby="feed-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="feed-title" className="text-base font-semibold">
          {title}
        </h2>
        {viewAllHref && (
          <a href={viewAllHref} className="btn btn-sm btn-ghost -mr-2">
            View all
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </a>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center">
          <MessageCircle className="text-muted mx-auto size-6" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-2 text-sm font-medium">No check-ins yet</p>
          <p className="text-ink-2 text-[13px]">Check in a habit and it shows up here</p>
        </div>
      ) : (
        <ul className="divide-line mt-2 divide-y" aria-live="polite">
          {items.map((item) => {
            const friend = byId.get(item.actor)
            const mine = item.actor === 'me'
            const name = mine ? myName : (friend?.name ?? 'Someone')
            const first = name.split(' ')[0]
            // Only a friend's own check-in can be cheered.
            const cheerable = !mine && item.kind === 'checkin'
            return (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <Avatar name={name} me={mine} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5">
                    <span className="font-medium">{mine ? 'You' : first}</span>{' '}
                    <span className="text-ink-2">
                      {item.kind === 'thanks' ? <>replied “{item.text}”</> : item.text}
                    </span>
                  </p>
                  <p className="mt-1 flex items-center gap-3">
                    <span className="mono text-muted text-xs">{formatWhen(item.date, item.time, today)}</span>
                    {item.streak !== undefined && item.streak > 0 && <Streak count={item.streak} size="sm" />}
                  </p>
                </div>
                {cheerable && (
                  <button
                    type="button"
                    disabled={item.cheered}
                    onClick={() => onCheer(item)}
                    aria-label={item.cheered ? `You cheered ${first}` : `Cheer ${first}`}
                    className={`btn btn-sm btn-ghost shrink-0 disabled:opacity-100 ${compact ? 'btn-icon' : ''} ${item.cheered ? 'text-ink' : ''}`}
                  >
                    <Heart
                      className="size-4"
                      strokeWidth={1.5}
                      fill={item.cheered ? 'currentColor' : 'none'}
                      aria-hidden="true"
                    />
                    {!compact && (item.cheered ? 'Cheered' : 'Cheer')}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
