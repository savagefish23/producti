import { Component, type ErrorInfo, type ReactNode } from 'react'
import { resetStoredState } from '../lib/storage'

interface State {
  failed: boolean
}

/**
 * Last line of defence: if rendering ever throws, show a way out instead of
 * a blank page. Resetting moves the saved data aside (it is kept as a backup)
 * and reloads, so a bad saved state can never lock someone out for good.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Producti crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <div className="card max-w-sm p-6 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-ink-2 mt-2 text-sm">
            The app hit an error, probably from damaged saved data. Resetting starts fresh and keeps
            a backup of the old data in this browser.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
              Try again
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                resetStoredState()
                window.location.reload()
              }}
            >
              Reset app data
            </button>
          </div>
        </div>
      </main>
    )
  }
}
