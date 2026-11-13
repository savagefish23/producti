import { Flame, Heart, MessageCircleHeart } from 'lucide-react'
import { formatWhen } from '../lib/dates'
import type { FeedItem, Friend, ISODate } from '../types'
import { Avatar } from './Avatar'

interface Props {
  feed: FeedItem[]
  friends: Friend[]
  today: ISODate
  myName: string
  onCheer: (item: FeedItem) => void
}

const VISIBLE = 14

export function FriendFeed({ feed, friends, today, myName, onCheer }: Props) {
  const byId = new Map(friends.map((f) => [f.id, f]))
  const items = feed.slice(0, VISIBLE)

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="feed-title">
      <h2 id="feed-title" className="section-title">
        Check-in feed
      </h2>

      {items.length === 0 ? (
        <div className="py-8 text-center">
          <MessageCircleHeart className="text-muted/50 mx-auto size-9" aria-hidden="true" />
          <p className="text-ink mt-2 text-sm font-bold">It's quiet… for now</p>
          <p className="text-muted text-xs">Check in a habit and your friends will see it here.</p>
        </div>
      ) : (
        <ul className="divide-line mt-1 divide-y" aria-live="polite">
          {items.map((item) => {
            const friend = byId.get(item.actor)
            const mine = item.actor === 'me'
            const name = mine ? myName : (friend?.name ?? 'Someone')
            const first = name.split(' ')[0]
            // Only a friend's own check-in can be cheered.
            const cheerable = !mine && item.kind === 'checkin'
            return (
              <li key={item.id} className="flex animate-rise items-start gap-3 py-3">
                <Avatar name={name} color={mine ? 'me' : (friend?.color ?? 'violet')} size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm leading-snug">
                    <span className="font-bold">{mine ? 'You' : first}</span>{' '}
                    {item.kind === 'thanks' ? <span>replied: “{item.text}”</span> : item.text}
                  </p>
                  <p className="text-muted mt-0.5 flex items-center gap-2 text-xs">
                    <span>{formatWhen(item.date, item.time, today)}</span>
                    {item.streak !== undefined && item.streak > 0 && (
                      <span className="inline-flex items-center gap-0.5 font-bold text-orange-500">
                        <Flame className="size-3.5 fill-orange-400" aria-hidden="true" />
                        {item.streak}
                        <span className="sr-only"> day streak</span>
                      </span>
                    )}
                  </p>
                </div>
                {cheerable && (
                  <button
                    type="button"
                    disabled={item.cheered}
                    onClick={() => onCheer(item)}
                    aria-label={item.cheered ? `You cheered ${first}` : `Cheer ${first}`}
                    className={`focus-ring inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition active:scale-90 ${
                      item.cheered
                        ? 'bg-rose-500/12 text-rose-600 dark:text-rose-300'
                        : 'bg-sunken text-muted hover:bg-rose-500/12 hover:text-rose-600 dark:hover:text-rose-300'
                    }`}
                  >
                    <Heart
                      className={`size-3.5 ${item.cheered ? 'animate-pop fill-rose-500 text-rose-500' : ''}`}
                      aria-hidden="true"
                    />
                    {item.cheered ? 'Cheered' : 'Cheer'}
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
