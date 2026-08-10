import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  error?: unknown
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function ErrorState({ error, title = 'Đã có lỗi xảy ra', description, action, className }: ErrorStateProps) {
  const detail =
    error instanceof Error ? error.message : description
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
        <span className="material-symbols-outlined text-3xl text-red-600">error</span>
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
