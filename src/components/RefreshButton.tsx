import { Button } from '@/components/ui/button'

interface RefreshButtonProps {
  onClick: () => void
  loading?: boolean
  label?: string
}

export function RefreshButton({ onClick, loading, label = 'Làm mới' }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className="gap-1.5"
    >
      <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
        refresh
      </span>
      {loading ? 'Đang làm mới...' : label}
    </Button>
  )
}
