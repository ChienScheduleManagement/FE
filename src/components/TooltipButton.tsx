import { Button, type ButtonProps } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface TooltipButtonProps extends ButtonProps {
  label: string
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Nút icon kèm tooltip giải thích chức năng.
 * Dùng cho các action dạng icon (chỉnh sửa, xóa, hoàn thành...).
 */
export function TooltipButton({
  label,
  tooltipSide = 'top',
  className,
  children,
  ...props
}: TooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className={cn('h-8 w-8 transition-transform active:scale-95', className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} className="font-semibold">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
