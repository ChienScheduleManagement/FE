import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: () => void
  onClear?: () => void
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, onClear, value, onKeyDown, ...props }, ref) => {
    const hasValue = value !== undefined && value !== ''

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Enter' && onSearch) {
        onSearch()
      }
      onKeyDown?.(e)
    }

    return (
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg pointer-events-none">
          search
        </span>
        <input
          ref={ref}
          type="text"
          value={value}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-9 pr-16 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
          {hasValue && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
          {onSearch && (
            <button
              type="button"
              onClick={onSearch}
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <span className="material-symbols-outlined text-lg">search</span>
            </button>
          )}
        </div>
      </div>
    )
  },
)
SearchInput.displayName = 'SearchInput'

export { SearchInput }
