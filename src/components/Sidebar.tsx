import { Bell, BellOff, History, LogOut, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import type { Theme } from '../types'
import { Avatar } from './Avatar'
import { Wordmark } from './Logo'
import { PAGES, type Page } from './nav'


interface Props {
  page: Page
  unseen: number
  name: string
  username: string
  notifications: boolean
  onToggleNotifications: () => void
  theme: Theme
  dayOffset: number
  onToggleTheme: () => void
  onSignOut: () => void
}

/** Desktop navigation: wordmark, pages, and the account row at the bottom. */
export function Sidebar({ page, unseen, dayOffset, ...account }: Props) {
  return (
    <aside className="border-line bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
      <div className="flex h-16 items-center px-6">
        <a href="#/" className="focus-ring rounded-md">
          <Wordmark size={22} />
        </a>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-1 px-3 pt-2">
        {PAGES.map(({ id, label, href, icon: Icon }) => {
          const active = id === page
          return (
            <a
              key={id}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`focus-ring flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 ease-smooth ${
                active ? 'bg-raised text-ink font-medium' : 'text-ink-2 hover:bg-raised hover:text-ink'
              }`}
            >
              <Icon className={`size-4 ${active ? 'text-accent-text' : ''}`} strokeWidth={1.75} aria-hidden="true" />
              {label}
              {id === 'friends' && unseen > 0 && (
                <span className="mono bg-accent text-on-accent ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px]">
                  {unseen}
                  <span className="sr-only"> new</span>
                </span>
              )}
            </a>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3 p-3">
        <div className="text-muted px-3 text-xs leading-5">
          <p className="flex items-center gap-2">
            <span className="bg-muted size-1.5 rounded-full" aria-hidden="true" />
            Demo with simulated friends
          </p>
          {dayOffset > 0 && (
            <p className="mono text-accent-text mt-1 flex items-center gap-2">
              <History className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              Time travel +{dayOffset}d
            </p>
          )}
        </div>
        <AccountRow {...account} />
      </div>
    </aside>
  )
}

type AccountProps = Pick<
  Props,
  'name' | 'username' | 'notifications' | 'onToggleNotifications' | 'theme' | 'onToggleTheme' | 'onSignOut'
>

function AccountRow({ name, username, notifications, onToggleNotifications, theme, onToggleTheme, onSignOut }: AccountProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="border-line rounded-lg border p-3">
        <p className="text-ink-2 text-xs">Signing out clears the data on this device.</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={onSignOut} className="btn btn-sm btn-secondary flex-1">
            Sign out
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="btn btn-sm btn-ghost flex-1">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-line flex items-center gap-3 border-t px-2 pt-3">
      <Avatar name={name} me size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="mono text-muted block truncate text-xs">@{username}</span>
      </span>
      <NotificationsButton notifications={notifications} onToggleNotifications={onToggleNotifications} />
      <ThemeButton theme={theme} onToggleTheme={onToggleTheme} />
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Sign out"
        title="Sign out"
        className="btn btn-sm btn-ghost btn-icon"
      >
        <LogOut className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}

export function ThemeButton({ theme, onToggleTheme }: Pick<Props, 'theme' | 'onToggleTheme'>) {
  return (
    <button
      type="button"
      onClick={onToggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      className="btn btn-sm btn-ghost btn-icon"
    >
      {theme === 'dark' ? <Sun className="size-4" strokeWidth={1.75} /> : <Moon className="size-4" strokeWidth={1.75} />}
    </button>
  )
}

function NotificationsButton({ notifications, onToggleNotifications }: Pick<Props, 'notifications' | 'onToggleNotifications'>) {
  return (
    <button
      type="button"
      onClick={onToggleNotifications}
      aria-pressed={notifications}
      aria-label={notifications ? 'Turn notifications off' : 'Turn notifications on'}
      title={notifications ? 'Notifications on' : 'Notifications off'}
      className="btn btn-sm btn-ghost btn-icon"
    >
      {notifications ? (
        <Bell className="text-accent-text size-4" strokeWidth={1.75} />
      ) : (
        <BellOff className="size-4" strokeWidth={1.75} />
      )}
    </button>
  )
}

/** Phones and tablets: a slim top bar plus a bottom tab bar. */
export function MobileBars({
  page,
  unseen,
  name,
  notifications,
  onToggleNotifications,
  theme,
  onToggleTheme,
  onSignOut,
}: Omit<Props, 'dayOffset' | 'username'> & { username?: string }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <header className="border-line bg-sidebar sticky top-0 z-30 border-b lg:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          <a href="#/" className="focus-ring rounded-md">
            <Wordmark size={20} />
          </a>
          <span className="mono text-muted text-xs">demo</span>
          <div className="ml-auto flex items-center gap-1">
            <NotificationsButton notifications={notifications} onToggleNotifications={onToggleNotifications} />
            <ThemeButton theme={theme} onToggleTheme={onToggleTheme} />
            {confirming ? (
              <>
                <button type="button" onClick={onSignOut} className="btn btn-sm btn-secondary">
                  Sign out
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="btn btn-sm btn-ghost">
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label={`Signed in as ${name}. Sign out`}
                className="focus-ring rounded-full"
              >
                <Avatar name={name} me size="sm" />
              </button>
            )}
          </div>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="border-line bg-sidebar fixed inset-x-0 bottom-0 z-30 flex border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {PAGES.map(({ id, label, href, icon: Icon }) => {
          const active = id === page
          return (
            <a
              key={id}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`focus-visible:bg-raised flex h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium outline-none ${
                active ? 'text-ink' : 'text-muted'
              }`}
            >
              <span className="relative">
                <Icon className={`size-5 ${active ? 'text-accent-text' : ''}`} strokeWidth={1.75} aria-hidden="true" />
                {id === 'friends' && unseen > 0 && (
                  <span className="mono bg-accent text-on-accent absolute -top-1 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px]">
                    {unseen}
                    <span className="sr-only"> new</span>
                  </span>
                )}
              </span>
              {label}
            </a>
          )
        })}
      </nav>
    </>
  )
}
