import { cn } from '@/lib/utils'
import { getDeadlineStatusMeta, getTaskStatusMeta } from '@/constants/task'

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const meta = getTaskStatusMeta(status)
  return (
    <span
      key={status ?? 'none'}
      className={cn(
        'inline-flex animate-in items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold fade-in-0 zoom-in-95 duration-200',
        meta.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export function DeadlineBadge({
  status,
  className,
}: {
  status?: string | null
  className?: string
}) {
  const meta = getDeadlineStatusMeta(status)
  return (
    <span
      key={status ?? 'none'}
      className={cn(
        'inline-flex animate-in items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold fade-in-0 zoom-in-95 duration-200',
        meta.badge,
        className,
      )}
    >
      {meta.label}
    </span>
  )
}
