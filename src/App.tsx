import { ListChecks, Users } from 'lucide-react'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { AddHabitModal } from './components/AddHabitModal'
import { DevPanel } from './components/DevPanel'
import { FriendFeed } from './components/FriendFeed'
import { HappeningNow } from './components/HappeningNow'
import { Header } from './components/Header'
import { Leaderboard, type LeaderboardEntry } from './components/Leaderboard'
import { MyHabits } from './components/MyHabits'
import { Toasts, type Toast } from './components/Toasts'
import { useToday } from './hooks/useToday'
import { addDays, diffDays, localTime, localToday } from './lib/dates'
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
import type { AppState, FeedItem, Friend, Habit, ISODate, StatusKind } from './types'

function initState(): AppState {
  const saved = loadState()
  if (saved) return saved
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return createSeed(localToday(), localTime(), prefersDark ? 'dark' : 'light')
}

type Tab = 'habits' | 'friends'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const [picked, setPicked] = useState<ISODate | null>(null)
  const [tab, setTab] = useState<Tab>('habits')
  const [adding, setAdding] = useState(false)
  const [devOpen, setDevOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [unseen, setUnseen] = useState(0)

  // "Today" is the real local day plus any dev time-travel offset.
  const realToday = useToday()
  const today = addDays(realToday, state.dayOffset)
  // The strip shows the last seven days; anything outside falls back to today.
  const selected = picked && picked <= today && diffDays(picked, today) < 7 ? picked : today

  // Latest state for scripted replies that fire from timers.
  const stateRef = useRef(state)
  const tabRef = useRef(tab)
  useEffect(() => {
    stateRef.current = state
    tabRef.current = tab
  })

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
      if (tabRef.current !== 'friends') setUnseen((n) => n + 1)
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
    if (after.tier > before.tier) toast(`🏆 Rank up! You reached ${after.name}`)

    // Occasionally a friend cheers back.
    if (state.friends.length > 0 && (state.fastReplies || chance(0.4))) {
      const friend = state.friends[randomInt(state.friends.length)]
      friendReplies(6, 16, () => {
        const now = stamp()
        const current = stateRef.current.habits.find((h) => h.id === habit.id)
        if (!current || !isCompleted(current, now.date)) return // un-checked meanwhile
        dispatch({ type: 'friendCheer', friendId: friend.id, habitId: habit.id, variant: variant(), ...now })
        toast(`👏 ${firstName(friend)} cheered your check-in`)
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
      toast(`💬 ${firstName(friend)} thanked you for the cheer`)
    })
  }

  const handleNudge = (friend: Friend) => {
    if (hasNudged(state, friend.id, today)) return
    dispatch({ type: 'nudge', friendId: friend.id, date: today, time: localTime() })
    toast(`🔔 Nudge sent to ${firstName(friend)}`)
    friendReplies(12, 30, () => {
      dispatch({ type: 'friendNudgedCheckin', friendId: friend.id, variant: variant(), ...stamp() })
      toast(`✅ ${firstName(friend)} checked in after your nudge`)
    })
  }

  const handleStatus = (status: StatusKind) =>
    dispatch({ type: 'setStatus', status, date: today, time: localTime() })

  const handleAdd = (habit: NewHabit) => {
    dispatch({ type: 'addHabit', habit, date: today, time: localTime() })
    setPicked(null)
  }

  const showTab = (next: Tab) => {
    setTab(next)
    if (next === 'friends') setUnseen(0)
  }

  // ── Derived view data (all from pure functions in lib/) ────────────────
  const week = recentProgress(state.habits, today)
  const entries: LeaderboardEntry[] = [
    {
      id: 'me',
      name: state.profile.name,
      color: 'me',
      isMe: true,
      weeklyXp: weeklyXp(state.habits, today),
      streak: activeDayStreak(state.habits, today),
    },
    ...state.friends.map((friend) => ({
      id: friend.id,
      name: friend.name,
      color: friend.color,
      isMe: false,
      weeklyXp: friendWeeklyXp(friend, today, state.friendBonus),
      streak: friendStreak(friend, today),
    })),
  ]

  const tabButton = (value: Tab, label: string, Icon: typeof Users) => (
    <button
      type="button"
      role="tab"
      id={`tab-${value}`}
      aria-selected={tab === value}
      aria-controls={`panel-${value}`}
      onClick={() => showTab(value)}
      className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition outline-none focus-visible:bg-indigo-500/10 ${
        tab === value ? 'text-indigo-600 dark:text-indigo-300' : 'text-muted'
      }`}
    >
      <span className="relative">
        <Icon className="size-5.5" aria-hidden="true" />
        {value === 'friends' && unseen > 0 && (
          <span className="absolute -top-1 -right-2 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] leading-4 text-white">
            {unseen}
            <span className="sr-only"> new</span>
          </span>
        )}
      </span>
      {label}
    </button>
  )

  return (
    <div className="min-h-dvh pb-24 lg:pb-10">
      <Header
        name={state.profile.name}
        today={today}
        xp={xp}
        rank={rankFor(xp)}
        progress={dayProgress(state.habits, today)}
        status={state.profile.status}
        onStatus={handleStatus}
        theme={state.theme}
        onToggleTheme={() =>
          dispatch({ type: 'setTheme', theme: state.theme === 'dark' ? 'light' : 'dark' })
        }
        dayOffset={state.dayOffset}
      />

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pt-5 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:pt-6">
        <section
          id="panel-habits"
          aria-label="My habits"
          className={`min-w-0 ${tab === 'habits' ? '' : 'hidden lg:block'}`}
        >
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
        </section>

        <section
          id="panel-friends"
          aria-label="Friends"
          className={`min-w-0 space-y-4 ${tab === 'friends' ? '' : 'hidden lg:block'}`}
        >
          <HappeningNow
            friends={state.friends}
            today={today}
            myName={state.profile.name}
            myStatus={state.profile.status}
            nudged={(friendId) => hasNudged(state, friendId, today)}
            onNudge={handleNudge}
          />
          <Leaderboard entries={entries} />
          <FriendFeed
            feed={state.feed}
            friends={state.friends}
            today={today}
            myName={state.profile.name}
            onCheer={handleCheer}
          />
        </section>
      </main>

      {/* Mobile tab bar */}
      <nav
        role="tablist"
        aria-label="Sections"
        className="border-line bg-surface/95 fixed inset-x-0 bottom-0 z-30 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {tabButton('habits', 'My Habits', ListChecks)}
        {tabButton('friends', 'Friends', Users)}
      </nav>

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
