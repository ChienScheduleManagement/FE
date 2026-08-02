import { useEffect, useMemo, useRef, useState } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SearchableSelectItem {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  items: SearchableSelectItem[]
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  id?: string
  triggerClassName?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  items,
  placeholder,
  emptyText = 'Không tìm thấy kết quả',
  disabled,
  id,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selected = items.find((item) => item.value === value)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [items, search])

  useEffect(() => {
    setHighlightIndex(0)
  }, [search, open])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-highlighted="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex, open])

  const selectItem = (item: SearchableSelectItem | undefined) => {
    if (!item) return
    onValueChange(item.value)
    setSearch('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (disabled) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      setHighlightIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (open) setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open) {
        selectItem(filtered[highlightIndex])
      } else {
        setOpen(true)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (!open) setOpen(true)
  }

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (!disabled) setOpen(true)
  }

  const display = search !== '' ? search : (selected?.label ?? '')

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <div>
          <div className="relative">
            <Input
              ref={inputRef}
              id={id}
              value={display}
              placeholder={placeholder}
              disabled={disabled}
              onChange={handleInputChange}
              onClick={handleInputClick}
              onKeyDown={handleKeyDown}
              className={cn(
                'pr-8',
                !display && 'text-muted-foreground',
                triggerClassName,
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base opacity-50">
              <span className="material-symbols-outlined text-base">
                expand_more
              </span>
            </span>
          </div>
        </div>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-[60] max-h-72 w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {filtered.length ? (
            <div ref={listRef}>
              {filtered.map((item, index) => {
                const highlighted = index === highlightIndex
                return (
                  <button
                    key={item.value}
                    type="button"
                    data-highlighted={highlighted}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectItem(item)}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none',
                      highlighted && 'bg-accent text-accent-foreground',
                    )}
                  >
                    {item.label}
                    {item.value === value ? (
                      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                        <span className="material-symbols-outlined text-base">check</span>
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
