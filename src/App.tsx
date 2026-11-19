import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { AddHabitModal } from './components/AddHabitModal'
import { DevPanel } from './components/DevPanel'
import { FriendFeed } from './components/FriendFeed'
import { HabitStats } from './components/HabitStats'
import { HappeningNow } from './components/HappeningNow'
import { Leaderboard, type LeaderboardEntry } from './components/Leaderboard'
import { MyHabits } from './components/MyHabits'
import { Overview, PageHeader, StatusControl } from './components/Overview'
import { MobileBars, Sidebar } from './components/Sidebar'
import type { Page } from './components/nav'
import { WeeklyChart } from './components/WeeklyChart'
import { Legal } from './components/Legal'
import { SignIn } from './components/SignIn'
import { Toasts, type Toast } from './components/Toasts'
import { isHabitIcon } from './components/icons'
import { navigate, useHashRoute } from './hooks/useHashRoute'
import { useToday } from './hooks/useToday'
import { addDays, diffDays, formatDay, localTime, localToday } from './lib/dates'
import {
  activeDayStreak,
  dayProgress,
  habitXp,
  rankFor,
  recentProgress,
  totalXp,
  weeklyXp,
} from './lib/game'
import { chance, randomBetween, randomInt } from './lib/random'
import { hasNudged, reducer, type NewHabit } from './lib/reducer'
import { createSeed } from './lib/seed'
import { friendStreak, friendWeeklyXp } from './lib/social'
import { loadState, saveState } from './lib/storage'
import { isCompleted } from './lib/streaks'
import { notify, requestNotifications } from './notifications'
import type { AppState, FeedItem, Friend, Habit, ISODate, StatusKind } from './types'

function initState(): AppState {
  const saved = loadState(localToday(), isHabitIcon)
  if (saved) return saved
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return createSeed(localToday(), localTime(), prefersDark ? 'dark' : 'light')
}

const ROUTE_PAGE: Record<string, Page> = { '/': 'today', '/friends': 'friends', '/stats': 'stats' }

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const [picked, setPicked] = useState<ISODate | null>(null)
  const [adding, setAdding] = useState(false)
  const [devOpen, setDevOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  // Friend replies received, and how many of them the user has seen.
  const [replies, setReplies] = useState(0)
  const [seenReplies, setSeenReplies] = useState(0)

  // "Today" is the real local day plus any dev time-travel offset.
  const realToday = useToday()
  const route = useHashRoute()
  const page: Page = Object.hasOwn(ROUTE_PAGE, route) ? ROUTE_PAGE[route] : 'today'
  const today = addDays(realToday, state.dayOffset)
  // The strip shows the last seven days; anything outside falls back to today.
  const selected = picked && picked <= today && diffDays(picked, today) < 7 ? picked : today

  // Latest state for scripted replies that fire from timers.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  // Being on Friends marks every reply as seen (adjusting state during render).
  if (page === 'friends' && seenReplies !== replies) setSeenReplies(replies)
  const unseen = page === 'friends' ? 0 : replies - seenReplies

  useEffect(() => saveState(state), [state])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state.theme])

  // Day changed (midnight, a long absence, or time travel): settle what was missed.
  useEffect(() => {
    if (state.lastSeenDate !== today) dispatch({ type: 'rollover', date: today, time: localTime() })
  }, [today, state.lastSeenDate])

  // Hidden dev panel: Alt+Shift+T.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyT') {
        e.preventDefault()
        setDevOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Timers for toasts and the scripted social simulation ───────────────
  const timers = useRef(new Set<number>())
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  const later = useCallback((ms: number, run: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      run()
    }, ms)
    timers.current.add(id)
  }, [])

  const toastId = useRef(0)
  const toast = useCallback(
    (text: string) => {
      const id = ++toastId.current
      setToasts((list) => [...list.slice(-2), { id, text }])
      later(4000, () => setToasts((list) => list.filter((t) => t.id !== id)))
    },
    [later],
  )

  /** A friend reacted: in-app toast, plus a browser notification if turned on. */
  const friendNews = (text: string) => {
    toast(text)
    if (stateRef.current.profile.notifications) notify(text)
  }

  /** Current app date + wall-clock time, read at the moment something happens. */
  const stamp = () => ({
    date: addDays(localToday(), stateRef.current.dayOffset),
    time: localTime(),
  })

  /** Run a friend's scripted reply after a randomised delay (seconds). */
  const friendReplies = (minSec: number, maxSec: number, run: () => void) => {
    const ms = state.fastReplies ? randomBetween(2000, 3500) : randomBetween(minSec, maxSec) * 1000
    later(ms, () => {
      run()
      setReplies((n) => n + 1)
    })
  }

  const variant = () => randomInt(1000)
  const firstName = (friend: Friend) => friend.name.split(' ')[0]

  // ── Handlers ───────────────────────────────────────────────────────────
  const xp = totalXp(state.habits)

  const handleToggle = (habit: Habit) => {
    const completing = !isCompleted(habit, today)
    dispatch({ type: 'toggleHabit', habitId: habit.id, date: today, time: localTime() })
    if (!completing) return

    const before = rankFor(xp)
    const after = rankFor(xp + habitXp(habit))
    if (after.tier > before.tier) toast(`Rank up: you reached ${after.name}`)

    // Occasionally a friend cheers back.
    if (state.friends.length > 0 && (state.fastReplies || chance(0.4))) {
      const friend = state.friends[randomInt(state.friends.length)]
      friendReplies(6, 16, () => {
        const now = stamp()
        const current = stateRef.current.habits.find((h) => h.id === habit.id)
        if (!current || !isCompleted(current, now.date)) return // un-checked meanwhile
        dispatch({ type: 'friendCheer', friendId: friend.id, habitId: habit.id, variant: variant(), ...now })
        friendNews(`${firstName(friend)} cheered your check-in`)
      })
    }
  }

  const handleCheer = (item: FeedItem) => {
    if (item.cheered) return
    dispatch({ type: 'cheer', itemId: item.id })
    const friend = state.friends.find((f) => f.id === item.actor)
    if (!friend) return
    // They thank you ~30s later.
    friendReplies(22, 38, () => {
      dispatch({ type: 'friendThanks', friendId: friend.id, variant: variant(), ...stamp() })
      friendNews(`${firstName(friend)} thanked you for the cheer`)
    })
  }

  const handleNudge = (friend: Friend) => {
    if (hasNudged(state, friend.id, today)) return
    dispatch({ type: 'nudge', friendId: friend.id, date: today, time: localTime() })
    toast(`Nudge sent to ${firstName(friend)}`)
    friendReplies(12, 30, () => {
      dispatch({ type: 'friendNudgedCheckin', friendId: friend.id, variant: variant(), ...stamp() })
      friendNews(`${firstName(friend)} checked in after your nudge`)
    })
  }

  const handleStatus = (status: StatusKind) =>
    dispatch({ type: 'setStatus', status, date: today, time: localTime() })

  const handleAdd = (habit: NewHabit) => {
    dispatch({ type: 'addHabit', habit, date: today, time: localTime() })
    setPicked(null)
  }

  // ── Derived view data (all from pure functions in lib/) ────────────────
  const week = recentProgress(state.habits, today)
  const entries: LeaderboardEntry[] = [
    {
      id: 'me',
      name: state.profile.name,
      isMe: true,
      weeklyXp: weeklyXp(state.habits, today),
      streak: activeDayStreak(state.habits, today),
    },
    ...state.friends.map((friend) => ({
      id: friend.id,
      name: friend.name,
      isMe: false,
      weeklyXp: friendWeeklyXp(friend, today, state.friendBonus),
      streak: friendStreak(friend, today),
    })),
  ]

  const toggleTheme = () =>
    dispatch({ type: 'setTheme', theme: state.theme === 'dark' ? 'light' : 'dark' })

  const toggleNotifications = async () => {
    if (state.profile.notifications) {
      dispatch({ type: 'setNotifications', on: false })
      return
    }
    const allowed = await requestNotifications()
    dispatch({ type: 'setNotifications', on: allowed })
    toast(allowed ? 'Notifications on' : 'Notifications are blocked in your browser settings')
  }

  const signOut = () => {
    dispatch({ type: 'signOut', date: realToday, time: localTime() })
    setDevOpen(false)
    navigate('/')
  }

  if (route === '/privacy' || route === '/terms') {
    return <Legal page={route === '/privacy' ? 'privacy' : 'terms'} />
  }

  if (!state.signedIn) {
    return (
      <SignIn
        today={today}
        theme={state.theme}
        onToggleTheme={toggleTheme}
        onSignIn={(fields, sampleData) => {
          dispatch({ type: 'signIn', fields, sampleData, date: today, time: localTime() })
          setPicked(null)
          navigate('/')
        }}
      />
    )
  }

  const feed = (props: { title?: string; limit?: number; viewAllHref?: string; compact?: boolean }) => (
    <FriendFeed
      feed={state.feed}
      friends={state.friends}
      today={today}
      myName={state.profile.name}
      onCheer={handleCheer}
      {...props}
    />
  )

  return (
    <div className="min-h-dvh lg:pl-64">
      <Sidebar
        page={page}
        unseen={unseen}
        name={state.profile.name}
        username={state.profile.username}
        notifications={state.profile.notifications}
        onToggleNotifications={toggleNotifications}
        theme={state.theme}
        dayOffset={state.dayOffset}
        onToggleTheme={toggleTheme}
        onSignOut={signOut}
      />
      <MobileBars
        page={page}
        unseen={unseen}
        name={state.profile.name}
        username={state.profile.username}
        notifications={state.profile.notifications}
        onToggleNotifications={toggleNotifications}
        theme={state.theme}
        onToggleTheme={toggleTheme}
        onSignOut={signOut}
      />

      <main key={page} className="animate-enter mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-8 lg:pt-10 lg:pb-16">
        {page === 'today' && (
          <div className="space-y-8">
            <PageHeader title="Today" subtitle={formatDay(today)}>
              <StatusControl status={state.profile.status} onStatus={handleStatus} />
            </PageHeader>
            <Overview xp={xp} rank={rankFor(xp)} progress={dayProgress(state.habits, today)} />
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
              <MyHabits
                habits={state.habits}
                freezes={state.freezes}
                today={today}
                selected={selected}
                week={week}
                onSelect={setPicked}
                onToggle={handleToggle}
                onArchive={(habit) =>
                  dispatch({ type: 'archiveHabit', habitId: habit.id, date: today, time: localTime() })
                }
                onOpenAdd={() => setAdding(true)}
                onQuickAdd={handleAdd}
              />
              <div className="hidden xl:block">
                {feed({ title: 'Friends today', limit: 6, viewAllHref: '#/friends', compact: true })}
              </div>
            </div>
          </div>
        )}

        {page === 'friends' && (
          <div className="space-y-8">
            <PageHeader title="Friends" subtitle="This week, with simulated friends" />
            <HappeningNow
              friends={state.friends}
              today={today}
              myName={state.profile.name}
              myStatus={state.profile.status}
              nudged={(friendId) => hasNudged(state, friendId, today)}
              onNudge={handleNudge}
            />
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              {feed({})}
              <Leaderboard entries={entries} />
            </div>
          </div>
        )}

        {page === 'stats' && (
          <div className="space-y-8">
            <PageHeader title="Stats" subtitle="How your habits are going" />
            <WeeklyChart days={week} today={today} selected={selected} onSelect={setPicked} />
            <HabitStats habits={state.habits} freezes={state.freezes} today={today} />
          </div>
        )}

        <footer className="text-muted mt-16 flex gap-4 text-xs">
          <span>Producti, a demo</span>
          <a href="#/privacy" className="hover:text-ink underline-offset-2 hover:underline">
            Privacy
          </a>
          <a href="#/terms" className="hover:text-ink underline-offset-2 hover:underline">
            Terms
          </a>
        </footer>
      </main>

      {adding && <AddHabitModal onAdd={handleAdd} onClose={() => setAdding(false)} />}

      {devOpen && (
        <DevPanel
          today={today}
          dayOffset={state.dayOffset}
          fastReplies={state.fastReplies}
          onAdvance={(days) => {
            dispatch({ type: 'advanceDays', days })
            setPicked(null)
          }}
          onFastReplies={(on) => dispatch({ type: 'setFastReplies', on })}
          onReset={() => {
            dispatch({ type: 'resetDemo', date: realToday, time: localTime() })
            setPicked(null)
          }}
          onClearAll={() => {
            dispatch({ type: 'clearAll', date: realToday, time: localTime() })
            setPicked(null)
          }}
          onClose={() => setDevOpen(false)}
        />
      )}

      <Toasts toasts={toasts} />
    </div>
  )
}
