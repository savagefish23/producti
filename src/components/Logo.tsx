/** Flat mark: one ember tile with a check. Same as the favicon. */
export function Logo({ className = 'size-6' }: { className?: string }) {
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
