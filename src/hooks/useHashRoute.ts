import { useEffect, useState } from 'react'

/**
 * The current hash route, e.g. "/privacy" for "#/privacy". Hash routing needs
 * no server rewrites, so it works as-is on Vercel's static hosting.
 */
export function useHashRoute(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

/** Go to a hash route, e.g. navigate('/friends'). */
export function navigate(path: string): void {
  window.location.hash = `#${path}`
}
