import { BarChart3, CalendarCheck, CalendarDays, UserRound, Users, type LucideIcon } from 'lucide-react'

export type Page = 'today' | 'calendar' | 'friends' | 'stats' | 'profile'

export const PAGES: { id: Page; label: string; href: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', href: '#/', icon: CalendarCheck },
  { id: 'calendar', label: 'Calendar', href: '#/calendar', icon: CalendarDays },
  { id: 'friends', label: 'Friends', href: '#/friends', icon: Users },
  { id: 'stats', label: 'Stats', href: '#/stats', icon: BarChart3 },
  { id: 'profile', label: 'Profile', href: '#/profile', icon: UserRound },
]
