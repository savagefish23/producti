import { BellRing, Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { friendStatus } from '../lib/social'
import { STATUS_LABEL, type Friend, type ISODate, type StatusKind } from '../types'
import { Avatar } from './Avatar'

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
      <h2 id="now-title" className="mb-3 text-base font-semibold">
        Happening now
      </h2>
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <StatusCard name={myName} label="You" me status={myStatus} note={null} />
        {friends.map((friend) => {
          const { status, note } = friendStatus(friend, today)
          const wasNudged = nudged(friend.id)
          const first = friend.name.split(' ')[0]
          return (
            <StatusCard key={friend.id} name={friend.name} label={first} status={status} note={note}>
              <button
                type="button"
                disabled={wasNudged}
                onClick={() => onNudge(friend)}
                aria-label={wasNudged ? `${first} nudged today` : `Nudge ${first}`}
                className={`btn btn-sm mt-3 w-full ${wasNudged ? 'btn-ghost' : 'btn-secondary'}`}
              >
                {wasNudged ? (
                  <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <BellRing className="size-4" strokeWidth={1.5} aria-hidden="true" />
                )}
                {wasNudged ? 'Nudged' : 'Nudge'}
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
  me = false,
  status,
  note,
  children,
}: {
  name: string
  label: string
  me?: boolean
  status: StatusKind
  note: string | null
  children?: ReactNode
}) {
  const live = status !== 'Idle'
  return (
    <li className="card flex w-36 shrink-0 flex-col items-center p-4 text-center">
      <span className="relative">
        <Avatar name={name} me={me} />
        <span
          className={`border-surface absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 ${
            live ? 'bg-positive' : 'bg-muted'
          }`}
          aria-hidden="true"
        />
      </span>
      <p className="mt-2 w-full truncate text-sm font-medium">{label}</p>
      <p className="text-ink-2 w-full truncate text-xs">
        {STATUS_LABEL[status]}
        {note && <span className="mono text-muted"> · {note}</span>}
      </p>
      {children}
    </li>
  )
}
