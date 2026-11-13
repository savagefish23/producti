import { useEffect, useState } from 'react'
import { localToday } from '../lib/dates'
import type { ISODate } from '../types'

/**
 * The user's real local calendar day. Re-checked periodically and whenever
 * the tab regains attention, so the app rolls over at midnight (or after a
 * timezone change) without a reload.
 */
export function useToday(): ISODate {
  const [today, setToday] = useState(() => localToday())

  useEffect(() => {
    const check = () => setToday(localToday())
    const id = window.setInterval(check, 30_000)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])

  return today
}
