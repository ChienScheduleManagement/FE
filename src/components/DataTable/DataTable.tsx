import { useEffect, useRef, useState } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type PaginationState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { DataTablePagination } from './DataTablePagination'
import { DataTableToolbar } from './DataTableToolbar'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  loading?: boolean
  hideToolbar?: boolean
  // Optional Server-side Props
  pageCount?: number
  pagination?: PaginationState
  onPaginationChange?: (pagination: PaginationState) => void
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  manualSorting?: boolean
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  // Row selection
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
  getRowId?: (row: TData) => string | number
  totalItems?: number
  onRowClick?: (row: TData) => void
  initialVisibility?: VisibilityState
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  loading = false,
  hideToolbar = false,
  pageCount,
  totalItems,
  pagination: controlledPagination,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  manualSorting = false,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  getRowId,
  onRowClick,
  initialVisibility,
}: DataTableProps<TData, TValue>) {
  // INTERNAL states for client-side fallback
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [internalGlobalFilter, setInternalGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialVisibility ?? columns.reduce((acc, col) => {
      // Hide ID column by default
      const key = (col as { accessorKey?: string; id?: string }).accessorKey || (col as { id?: string }).id
      if (key === 'id') {
        acc[key] = false
      }
      return acc
    }, {} as VisibilityState)
  )
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({})
  const [panning, setPanning] = useState(false)
  const [spaceActive, setSpaceActive] = useState(false)
  const scrollXRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef<HTMLDivElement>(null)
  const spaceHeldRef = useRef(false)
  const panStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)

  // Kéo để cuộn: giữ phím Space + kéo chuột trái (hoặc chỉ cần kéo) để pan bảng.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      spaceHeldRef.current = true
      setSpaceActive(true)
      if (scrollXRef.current?.contains(e.target as Node)) {
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      spaceHeldRef.current = false
      setSpaceActive(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const handlePanMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const xEl = scrollXRef.current
    const yEl = scrollYRef.current
    if (!xEl) return
    const isSpacePan = spaceHeldRef.current && e.button === 0
    if (!isSpacePan) return
    e.preventDefault()
    panStart.current = { x: e.clientX, y: e.clientY, scrollLeft: xEl.scrollLeft, scrollTop: yEl?.scrollTop ?? 0 }
    setPanning(true)
  }

  const handlePanMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const xEl = scrollXRef.current
    const start = panStart.current
    if (!start || !xEl) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    xEl.scrollLeft = start.scrollLeft - dx
    if (scrollYRef.current) scrollYRef.current.scrollTop = start.scrollTop - dy
  }

  const handlePanMouseUp = () => {
    panStart.current = null
    setPanning(false)
  }

  const rowSelection = controlledRowSelection ?? internalRowSelection
  const setRowSelection = onRowSelectionChange ?? setInternalRowSelection

  // Determine if we are in Server-side mode
  const isServerSide = !!onPaginationChange

  const table = useReactTable({
    data,
    columns,
    // Server-side specific
    pageCount: pageCount ?? -1,
    manualPagination: isServerSide,
    manualSorting,
    manualFiltering: isServerSide,
    enableRowSelection,
    getRowId: getRowId as never,
    state: {
      sorting: controlledSorting ?? internalSorting,
      pagination: controlledPagination ?? internalPagination,
      globalFilter: controlledGlobalFilter ?? internalGlobalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: (updater) => {
      if (manualSorting) {
        const next = typeof updater === 'function' ? updater(controlledSorting ?? internalSorting) : updater
        onSortingChange?.(next)
      } else {
        setInternalSorting(updater)
      }
    },
    onPaginationChange: (updater) => {
      if (isServerSide) {
        const next = typeof updater === 'function' ? updater(controlledPagination ?? internalPagination) : updater
        onPaginationChange?.(next)
      } else {
        setInternalPagination(updater)
      }
    },
    onGlobalFilterChange: (value) => {
      if (isServerSide) {
        onGlobalFilterChange?.(value)
      } else {
        setInternalGlobalFilter(value)
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(next)
    },
    getCoreRowModel: getCoreRowModel(),
    // Conditional models to save performance
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    getFilteredRowModel: isServerSide ? undefined : getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      {!hideToolbar && <DataTableToolbar table={table} searchKey={searchKey || ''} />}
      <div
        ref={scrollXRef}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handlePanMouseMove}
        onMouseUp={handlePanMouseUp}
        onMouseLeave={handlePanMouseUp}
        style={{ cursor: panning ? 'grabbing' : spaceActive ? 'grab' : undefined }}
        className={cn(
          "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto relative shadow-sm scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800",
          panning && "select-none",
        )}
      >
        <div
          ref={scrollYRef}
          className="overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
        >
          <Table className="relative min-w-full border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => {
                    const isActions = header.id === 'actions'
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800",
                          isActions && "sticky right-0 z-40 shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)] border-l"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64">
                    <div className="space-y-4 p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40 rounded-full" />
                        <Skeleton className="h-3 w-72 max-w-full rounded-full" />
                      </div>
                      <div className="grid gap-3">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-5/6 rounded-xl" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "animate-in fade-in-0 duration-200 group",
                      onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800' : ''
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isActions = cell.column.id === 'actions'
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            isActions && "sticky right-0 bg-white dark:bg-slate-900 z-10 shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 dark:group-hover:bg-neutral-800 transition-colors"
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 border-0 p-0">
                    <EmptyState
                      icon="search_off"
                      title="Không tìm thấy dữ liệu"
                      description="Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc."
                      className="py-12"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} totalItems={totalItems} />
    </div>
  )
}
