import { useEffect, useState } from 'react'

/** Pages that also have a real path (e.g. /privacy), for app stores and search engines. */
const PATH_ROUTES = new Set(['/privacy', '/terms'])

/**
 * The current route. In-app pages use the hash ("#/friends"), which needs no
 * server setup. The legal pages also live at real paths ("/privacy"), served
 * by a rewrite in vercel.json, because app stores ask for a plain URL.
 */
function readRoute(): string {
  const hash = window.location.hash.replace(/^#/, '')
  if (hash) return hash
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return PATH_ROUTES.has(path) ? path : '/'
}

export function useHashRoute(): string {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onChange = () => {
      setRoute(readRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

/** Go to an in-app route, e.g. navigate('/friends'). Leaves a legal page if on one. */
export function navigate(path: string): void {
  if (window.location.pathname !== '/') window.location.assign(`/#${path}`)
  else window.location.hash = `#${path}`
}
