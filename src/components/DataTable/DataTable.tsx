import {useEffect, useRef, useState} from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {EmptyState} from '@/components/EmptyState'
import {DataTablePagination} from './DataTablePagination'
import {DataTableToolbar} from './DataTableToolbar'
import {cn} from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
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
  // Cell selection (spreadsheet-like, opt-in)
  enableCellSelection?: boolean
  selectedCells?: ReadonlySet<string>
  onSelectedCellsChange?: (cells: Set<string>) => void
  onCellContextMenu?: (row: TData, columnId: string, event: React.MouseEvent) => void
  getCellText?: (row: TData, columnId: string) => string
  onPaste?: (text: string, cells: ReadonlySet<string>) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
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
  enableCellSelection = false,
  selectedCells,
  onSelectedCellsChange,
  onCellContextMenu,
  getCellText,
  onPaste,
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
  const [internalCellSelection, setInternalCellSelection] = useState<Set<string>>(new Set())
  const [panning, setPanning] = useState(false)
  const [spaceActive, setSpaceActive] = useState(false)
  const scrollXRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef<HTMLDivElement>(null)
  const spaceHeldRef = useRef(false)
  const panStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)
  const cellAnchorRef = useRef<{ rowId: string; colId: string } | null>(null)

  const rowSelection = controlledRowSelection ?? internalRowSelection
  const setRowSelection = onRowSelectionChange ?? setInternalRowSelection

  const cellSelection = selectedCells ?? internalCellSelection
  const setCellSelection = onSelectedCellsChange ?? setInternalCellSelection

  const cellSelectionRef = useRef(cellSelection)
  cellSelectionRef.current = cellSelection
  const onPasteRef = useRef(onPaste)
  onPasteRef.current = onPaste
  const getCellTextRef = useRef(getCellText)
  getCellTextRef.current = getCellText

  const getRowKey = (row: Row<TData>) =>
    getRowId ? String(getRowId(row.original)) : row.id

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

  // ===== Cell selection (spreadsheet-like) =====
  const cellKey = (rowId: string, colId: string) => `${rowId}::${colId}`

  const computeRange = (anchorRowId: string, anchorColId: string, targetRowId: string, targetColId: string): Set<string> => {
    const result = new Set<string>()
    const rows = table.getRowModel().rows
    const rowIds = rows.map((r) => getRowKey(r))
    const colIds = table.getVisibleLeafColumns().map((c) => c.id)
    const r1 = rowIds.indexOf(anchorRowId)
    const r2 = rowIds.indexOf(targetRowId)
    const c1 = colIds.indexOf(anchorColId)
    const c2 = colIds.indexOf(targetColId)
    if (r1 < 0 || r2 < 0 || c1 < 0 || c2 < 0) return result
    const [rMin, rMax] = [Math.min(r1, r2), Math.max(r1, r2)]
    const [cMin, cMax] = [Math.min(c1, c2), Math.max(c1, c2)]
    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        result.add(cellKey(rowIds[r], colIds[c]))
      }
    }
    return result
  }

  const handleCellMouseDown = (e: React.MouseEvent, row: Row<TData>, colId: string) => {
    if (!enableCellSelection || e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, select, textarea')) return
    e.preventDefault()
    scrollXRef.current?.focus()
    const rowId = getRowKey(row)
    const key = cellKey(rowId, colId)
    const isCtrl = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey
    const next = new Set(cellSelectionRef.current)

    if (isShift && cellAnchorRef.current) {
      next.clear()
      next.add(key)
      const anchor = cellAnchorRef.current
      if (anchor.rowId === rowId && anchor.colId !== colId) {
        const colIds = table.getVisibleLeafColumns().map((c) => c.id)
        const c1 = colIds.indexOf(anchor.colId)
        const c2 = colIds.indexOf(colId)
        const [cMin, cMax] = [Math.min(c1, c2), Math.max(c1, c2)]
        for (let c = cMin; c <= cMax; c++) next.add(cellKey(rowId, colIds[c]))
      } else if (anchor.colId === colId && anchor.rowId !== rowId) {
        const rows = table.getRowModel().rows
        const rowIds = rows.map((r) => getRowKey(r))
        const r1 = rowIds.indexOf(anchor.rowId)
        const r2 = rowIds.indexOf(rowId)
        const [rMin, rMax] = [Math.min(r1, r2), Math.max(r1, r2)]
        for (let r = rMin; r <= rMax; r++) next.add(cellKey(rowIds[r], colId))
      } else if (anchor.rowId !== rowId || anchor.colId !== colId) {
        for (const k of computeRange(anchor.rowId, anchor.colId, rowId, colId)) next.add(k)
      }
    } else if (isCtrl) {
      if (next.has(key)) next.delete(key)
      else next.add(key)
      cellAnchorRef.current = { rowId, colId }
    } else {
      next.clear()
      next.add(key)
      cellAnchorRef.current = { rowId, colId }
    }

    setCellSelection(next)
  }

  const handleCellContextMenu = (e: React.MouseEvent, row: Row<TData>, colId: string) => {
    if (!enableCellSelection) return
    e.preventDefault()
    const rowId = getRowKey(row)
    const key = cellKey(rowId, colId)
    const next = new Set(cellSelectionRef.current)
    if (!next.has(key)) {
      next.clear()
      next.add(key)
      cellAnchorRef.current = { rowId, colId }
      setCellSelection(next)
    }
    onCellContextMenu?.(row.original, colId, e)
  }

  const buildClipboardText = (): string => {
    const sel = cellSelectionRef.current
    if (!sel.size) return ''
    const rows = table.getRowModel().rows
    const rowIds = rows.map((r) => getRowKey(r))
    const colIds = table.getVisibleLeafColumns().map((c) => c.id)
    let rMin = Number.POSITIVE_INFINITY
    let rMax = -1
    let cMin = Number.POSITIVE_INFINITY
    let cMax = -1
    for (const key of sel) {
      const [rid, cid] = key.split('::')
      const ri = rowIds.indexOf(rid)
      const ci = colIds.indexOf(cid)
      if (ri < 0 || ci < 0) continue
      rMin = Math.min(rMin, ri)
      rMax = Math.max(rMax, ri)
      cMin = Math.min(cMin, ci)
      cMax = Math.max(cMax, ci)
    }
    if (rMax < 0 || cMax < 0) return ''
    const lines: string[] = []
    for (let r = rMin; r <= rMax; r++) {
      const cells: string[] = []
      for (let c = cMin; c <= cMax; c++) {
        const key = cellKey(rowIds[r], colIds[c])
        if (!sel.has(key)) {
          cells.push('')
          continue
        }
        const rowData = rows[r].original
        let text = ''
        if (getCellTextRef.current) {
          text = getCellTextRef.current(rowData, colIds[c])
        } else {
          const v = (rowData as Record<string, unknown>)[colIds[c]]
          text = v == null ? '' : String(v)
        }
        cells.push(text)
      }
      lines.push(cells.join('\t'))
    }
    return lines.join('\n')
  }

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enableCellSelection) return
    const mod = e.ctrlKey || e.metaKey
    if (!mod) return
    const key = e.key.toLowerCase()
    if (key === 'c') {
      e.preventDefault()
      const tsv = buildClipboardText()
      if (tsv) void navigator.clipboard?.writeText(tsv)
    } else if (key === 'v') {
      e.preventDefault()
      void navigator.clipboard?.readText().then((text) => {
        if (text) onPasteRef.current?.(text, cellSelectionRef.current)
      })
    }
  }

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
        tabIndex={enableCellSelection ? -1 : undefined}
        onKeyDown={handleTableKeyDown}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handlePanMouseMove}
        onMouseUp={handlePanMouseUp}
        onMouseLeave={handlePanMouseUp}
        style={{ cursor: panning ? 'grabbing' : spaceActive ? 'grab' : undefined }}
        className={cn(
          "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto relative shadow-sm scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800",
          (panning || enableCellSelection) && "select-none",
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => {
                      if (enableCellSelection) return
                      onRowClick?.(row.original)
                    }}
                    className={cn(
                      "animate-in fade-in-0 duration-200 group",
                      onRowClick && !enableCellSelection ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800' : ''
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isActions = cell.column.id === 'actions'
                      const isSelectedCell =
                        enableCellSelection && cellSelection.has(cellKey(getRowKey(row), cell.column.id))
                      return (
                        <TableCell
                          key={cell.id}
                          onMouseDown={(e) => handleCellMouseDown(e, row, cell.column.id)}
                          onClick={(e) => {
                            if (enableCellSelection && (e.ctrlKey || e.metaKey || e.shiftKey)) {
                              e.preventDefault()
                              e.stopPropagation()
                            }
                          }}
                          onContextMenu={(e) => handleCellContextMenu(e, row, cell.column.id)}
                          className={cn(
                            isActions && "sticky right-0 bg-white dark:bg-slate-900 z-10 shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 dark:group-hover:bg-neutral-800 transition-colors",
                            enableCellSelection && isSelectedCell && "bg-primary/15 ring-1 ring-inset ring-primary/80 dark:bg-primary/25"
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
