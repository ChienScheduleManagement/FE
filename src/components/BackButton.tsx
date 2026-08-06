import { Link, type LinkProps } from '@tanstack/react-router'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  to: LinkProps['to']
  label?: string
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function BackButton({
  to,
  label = 'Quay lại',
  tooltipSide = 'top',
  className,
}: BackButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          aria-label={label}
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:scale-105 hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-primary/20 dark:hover:text-primary-foreground',
            className,
          )}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} className="font-semibold">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
