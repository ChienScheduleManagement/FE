import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonRowsProps {
  rows?: number
  className?: string
}

export function SkeletonRows({ rows = 5, className }: SkeletonRowsProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder rows are static
        <Skeleton key={i} className={cn('h-12 w-full rounded-xl', className)} />
      ))}
    </div>
  )
}
