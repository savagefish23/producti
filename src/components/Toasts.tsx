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
      className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <p
          key={toast.id}
          className="bg-ink text-canvas animate-toast rounded-[10px] px-4 py-2 text-sm shadow-(--shadow-lg)"
        >
          {toast.text}
        </p>
      ))}
    </div>
  )
}
