export interface Toast {
  id: number
  text: string
}

/** Transient notices (friend replies, rank-ups). Announced to screen readers. */
export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <p
          key={toast.id}
          className="bg-ink text-surface animate-rise rounded-full px-4 py-2 text-sm font-bold shadow-xl"
        >
          {toast.text}
        </p>
      ))}
    </div>
  )
}
