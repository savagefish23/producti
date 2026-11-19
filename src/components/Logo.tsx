/*
 * Brand: the "producti" wordmark. Its one distinctive detail is the dot of
 * the i, drawn as an emerald tile: the same tile, with a check, is the app
 * icon. Set in Geist 600 with tight tracking.
 */

interface WordmarkProps {
  /** Font size in px. */
  size?: number
  className?: string
}

export function Wordmark({ size = 20, className = '' }: WordmarkProps) {
  return (
    <span
      role="img"
      aria-label="Producti"
      className={`text-ink inline-flex items-baseline font-semibold select-none ${className}`}
      style={{ fontSize: size, lineHeight: 1, letterSpacing: '-0.035em' }}
    >
      <span aria-hidden="true">product</span>
      <span aria-hidden="true" className="relative">
        {/* Dotless i, with the tile standing in for the dot. */}
        {'ı'}
        <span
          className="bg-accent absolute left-1/2 -translate-x-1/2"
          style={{ width: '0.19em', height: '0.19em', bottom: '0.715em', borderRadius: '0.045em' }}
        />
      </span>
    </span>
  )
}

/** The app icon: the i's tile on its own, with a check. */
export function LogoTile({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path
        d="M9.5 16.5l4.5 4.5 8.5-9.5"
        fill="none"
        className="stroke-on-accent"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
