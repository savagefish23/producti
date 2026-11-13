import {
  Apple,
  BedDouble,
  Bike,
  BookOpen,
  Brain,
  Code,
  Coffee,
  Droplets,
  Dumbbell,
  Footprints,
  Heart,
  Languages,
  Music,
  PenLine,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type { StatusKind } from '../types'

/** Icons a habit can use, keyed by the name stored on the habit. */
export const HABIT_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  target: { icon: Target, label: 'Target' },
  book: { icon: BookOpen, label: 'Book' },
  dumbbell: { icon: Dumbbell, label: 'Dumbbell' },
  droplets: { icon: Droplets, label: 'Water' },
  brain: { icon: Brain, label: 'Mind' },
  footprints: { icon: Footprints, label: 'Steps' },
  apple: { icon: Apple, label: 'Food' },
  pen: { icon: PenLine, label: 'Writing' },
  code: { icon: Code, label: 'Code' },
  music: { icon: Music, label: 'Music' },
  bike: { icon: Bike, label: 'Cycling' },
  languages: { icon: Languages, label: 'Languages' },
  bed: { icon: BedDouble, label: 'Sleep' },
  heart: { icon: Heart, label: 'Heart' },
  coffee: { icon: Coffee, label: 'Break' },
  sparkles: { icon: Sparkles, label: 'Other' },
}

export function habitIcon(key: string): LucideIcon {
  return (HABIT_ICONS[key] ?? HABIT_ICONS.sparkles).icon
}

export const STATUS_ICONS: Record<StatusKind, LucideIcon> = {
  'Deep Work': Brain,
  'At the Gym': Dumbbell,
  Reading: BookOpen,
  Idle: Coffee,
}
