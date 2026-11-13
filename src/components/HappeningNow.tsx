import { BellRing, Check } from 'lucide-react'
import { friendStatus } from '../lib/social'
import type { Friend, ISODate, StatusKind } from '../types'
import { Avatar } from './Avatar'
import { STATUS_DOT } from './styles'

interface Props {
  friends: Friend[]
  today: ISODate
  myName: string
  myStatus: StatusKind
  nudged: (friendId: string) => boolean
  onNudge: (friend: Friend) => void
}

/** Static status strip — text is fixed for the day, no live-ticking timers. */
export function HappeningNow({ friends, today, myName, myStatus, nudged, onNudge }: Props) {
  return (
    <section aria-labelledby="now-title">
      <h2 id="now-title" className="section-title mb-2.5">
        Happening now
      </h2>
      <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <StatusCard name={myName} label="You" color="me" status={myStatus} note={null} />
        {friends.map((friend) => {
          const { status, note } = friendStatus(friend, today)
          const wasNudged = nudged(friend.id)
          const first = friend.name.split(' ')[0]
          return (
            <StatusCard key={friend.id} name={friend.name} label={first} color={friend.color} status={status} note={note}>
              <button
                type="button"
                disabled={wasNudged}
                onClick={() => onNudge(friend)}
                aria-label={wasNudged ? `${first} nudged today` : `Nudge ${first}`}
                className={`focus-ring mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition ${
                  wasNudged
                    ? 'bg-sunken text-muted'
                    : 'bg-indigo-600/10 text-indigo-700 hover:bg-indigo-600 hover:text-white dark:text-indigo-300 dark:hover:text-white'
                }`}
              >
                {wasNudged ? (
                  <>
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> Nudged
                  </>
                ) : (
                  <>
                    <BellRing className="size-3.5" aria-hidden="true" /> Nudge
                  </>
                )}
              </button>
            </StatusCard>
          )
        })}
      </ul>
    </section>
  )
}

function StatusCard({
  name,
  label,
  color,
  status,
  note,
  children,
}: {
  name: string
  label: string
  color: string
  status: StatusKind
  note: string | null
  children?: React.ReactNode
}) {
  return (
    <li className="card w-34 shrink-0 p-3 text-center">
      <span className="relative inline-block">
        <Avatar name={name} color={color} />
        <span
          className={`absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-(--surface) ${STATUS_DOT[status]}`}
          aria-hidden="true"
        />
      </span>
      <p className="text-ink mt-1.5 truncate text-sm font-bold">{label}</p>
      <p className="text-muted truncate text-xs font-medium">
        {status}
        {note && ` — ${note}`}
      </p>
      {children}
    </li>
  )
}
