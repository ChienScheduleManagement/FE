import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <span className="material-symbols-outlined text-3xl text-primary">{icon}</span>
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
