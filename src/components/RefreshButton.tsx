import { TooltipButton } from '@/components/TooltipButton'

interface RefreshButtonProps {
  onClick: () => void
  loading?: boolean
  label?: string
}

export function RefreshButton({ onClick, loading, label = 'Làm mới' }: RefreshButtonProps) {
  return (
    <TooltipButton
      variant="outline"
      size="icon"
      label={label}
      onClick={onClick}
      disabled={loading}
    >
      <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>
        refresh
      </span>
    </TooltipButton>
  )
}
