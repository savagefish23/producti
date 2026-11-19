import { BarChart3, CalendarCheck, Users, type LucideIcon } from 'lucide-react'

export type Page = 'today' | 'friends' | 'stats'

export const PAGES: { id: Page; label: string; href: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', href: '#/', icon: CalendarCheck },
  { id: 'friends', label: 'Friends', href: '#/friends', icon: Users },
  { id: 'stats', label: 'Stats', href: '#/stats', icon: BarChart3 },
]
