import { createElement } from 'react'
import { habitIcon } from './icons'

/** Renders the icon stored on a habit by its registry key. Decorative. */
export function HabitGlyph({ name, className }: { name: string; className?: string }) {
  return createElement(habitIcon(name), { className, 'aria-hidden': true })
}
