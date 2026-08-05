import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQueryClient } from '@tanstack/react-query'
import {
  useGetAttendance,
  useGetLeaveReasons,
  setAttendanceCell,
  bulkSetAttendance,
  useGetAttendanceHistory,
  useGetDepartments,
} from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, toastSmartPromise } from '@/api/utils'
import { APP_NAME } from '@/constants/ui'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type {
  AttendanceGridVm,
  AttendanceEmployeeVm,
  LeaveReasonVm,
  AttendanceChangeVm,
  DepartmentVm,
} from '@/types/api'

interface SelectedCell {
  employeeId: string
  date: string
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export function AttendancePage() {
  const queryClient = useQueryClient()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [departmentId, setDepartmentId] = useState<string>('all')
  const [showFullMonth, setShowFullMonth] = useState(false)
  const [showThisWeek, setShowThisWeek] = useState(false)

  // Selected employee for right panel
  const [selectedEmp, setSelectedEmp] = useState<AttendanceEmployeeVm | null>(null)

  // Multi-cell selection
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([])
  const [isMouseDown, setIsMouseDown] = useState(false)
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)

  // Context menu position
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  // Direction for month-nav animation
  const navDir = useRef(0)

  // Active popover cell
  const [activeCell, setActiveCell] = useState<{
    employeeId: string
    date: string
    leaveReasonId?: number | null
    note?: string
  } | null>(null)
  const [cellNote, setCellNote] = useState('')

  // Queries
  const { data: gridRaw, isLoading: gridLoading, isError: gridIsError, error: gridError } = useGetAttendance({
    year,
    month,
    departmentId: departmentId === 'all' ? undefined : Number(departmentId),
  })

  const { data: reasonsRaw } = useGetLeaveReasons()
  const { data: deptsRaw } = useGetDepartments()

  useEffect(() => {
    if (gridIsError) showError(gridError)
  }, [gridIsError, gridError])

  const gridData = gridRaw ? unwrapApiResponse<AttendanceGridVm>(gridRaw) : undefined
  const reasons = reasonsRaw ? unwrapApiResponse<LeaveReasonVm[]>(reasonsRaw) : []
  const departments = deptsRaw ? unwrapApiResponse<DepartmentVm[]>(deptsRaw) : []

  // Map reasons by ID for quick lookup
  const reasonMap = new Map<number, LeaveReasonVm>()
  for (const r of reasons) reasonMap.set(r.id, r)

  // Query change history for selected employee
  const { data: historyRaw } = useGetAttendanceHistory(
    selectedEmp?.employeeId ?? '',
    { year, month },
    { query: { enabled: !!selectedEmp } },
  )
  const history = historyRaw ? unwrapApiResponse<AttendanceChangeVm[]>(historyRaw) : []

  const daysInMonth = gridData?.daysInMonth ?? new Date(year, month, 0).getDate()
  const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const showTodayOnly = isCurrentMonth && !showFullMonth && !showThisWeek
  const visibleDays = showTodayOnly
    ? [now.getDate()]
    : showThisWeek
      ? (() => {
          const start = new Date(year, month - 1, 1)
          const dayOfWeek = start.getDay()
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
          const monday = new Date(year, month - 1, 1 + mondayOffset)
          const sunday = new Date(monday)
          sunday.setDate(sunday.getDate() + 6)
          const days: number[] = []
          for (let d = monday.getDate(); d <= sunday.getDate(); d++) {
            const checkDate = new Date(year, month - 1, d)
            if (checkDate.getMonth() === month - 1) days.push(d)
          }
          return days
        })()
      : showFullMonth
        ? Array.from({ length: daysInMonth }, (_, i) => i + 1)
        : [now.getDate()]

  // Day-off info theo ngày (rules là chung cho đơn vị nên giống nhau mọi nhân viên)
  const firstEmpDays = gridData?.employees[0]?.days ?? []
  const dayOffInfo = (dateStr: string) => {
    const d = firstEmpDays.find((x) => x.date === dateStr)
    return d?.isDayOff ? { symbol: d.dayOffSymbol, color: d.dayOffColor, name: d.dayOffName } : null
  }

  // Invalidate attendance query
  const invalidateGrid = () => {
    void queryClient.invalidateQueries({ queryKey: ['/api/attendance'] })
    if (selectedEmp) {
      void queryClient.invalidateQueries({ queryKey: ['/api/attendance', selectedEmp.employeeId, 'history'] })
    }
  }

  // Month navigation
  const changeMonth = (delta: number) => {
    navDir.current = delta
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
    setShowFullMonth(false)
  }

  // Handle cell click (single popover)
  const handleCellClick = (
    employeeId: string,
    date: string,
    leaveReasonId?: number | null,
    note?: string | null,
    e?: React.MouseEvent,
  ) => {
    if (e?.ctrlKey || e?.metaKey) return
    const start = mouseDownPos.current
    if (start && (Math.abs(e!.clientX - start.x) > 4 || Math.abs(e!.clientY - start.y) > 4)) return // là kéo chuột, không phải click
    mouseDownPos.current = null
    setSelectedCells([])
    setActiveCell({ employeeId, date, leaveReasonId, note: note ?? '' })
    setCellNote(note ?? '')
  }

  // Save single cell
  const handleSaveCell = async (reasonId: number | null) => {
    if (!activeCell) return
    try {
      await setAttendanceCell({
        employeeId: activeCell.employeeId,
        date: activeCell.date,
        leaveReasonId: reasonId ?? undefined,
        note: cellNote || undefined,
      })
      invalidateGrid()
      setActiveCell(null)
    } catch (err) {
      showError(err)
    }
  }

  // Mouse handlers for drag select
  const handleCellMouseDown = (employeeId: string, date: string, e: React.MouseEvent) => {
    if (e.button !== 0) return // Left click only
    mouseDownPos.current = { x: e.clientX, y: e.clientY }
    setIsMouseDown(true)
    if (e.ctrlKey || e.metaKey) {
      setSelectedCells((prev) => {
        const exists = prev.some((c) => c.employeeId === employeeId && c.date === date)
        if (exists) return prev.filter((c) => !(c.employeeId === employeeId && c.date === date))
        return [...prev, { employeeId, date }]
      })
    } else {
      setSelectedCells([{ employeeId, date }])
    }
  }

  const handleCellMouseEnter = (employeeId: string, date: string) => {
    if (!isMouseDown) return
    setSelectedCells((prev) => {
      const exists = prev.some((c) => c.employeeId === employeeId && c.date === date)
      if (exists) return prev
      return [...prev, { employeeId, date }]
    })
  }

  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false)
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // Đóng menu chuột phải khi click ra ngoài
  useEffect(() => {
    if (!contextMenu) return
    const handleClose = () => setContextMenu(null)
    window.addEventListener('mousedown', handleClose)
    return () => window.removeEventListener('mousedown', handleClose)
  }, [contextMenu])

  // ESC để bỏ chọn ô + đóng menu/popover
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setSelectedCells([])
      setContextMenu(null)
      setActiveCell(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Handle right click menu
  const handleContextMenu = (e: React.MouseEvent) => {
    if (selectedCells.length === 0) return
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  // Bulk set selected cells
  const handleBulkSetReason = async (reasonId: number | null) => {
    if (selectedCells.length === 0) return
    setContextMenu(null)
    const items = selectedCells.map((c) =>
      reasonId === null
        ? { employeeId: c.employeeId, date: c.date }
        : { employeeId: c.employeeId, date: c.date, leaveReasonId: reasonId },
    )
    try {
      await toastSmartPromise(
        bulkSetAttendance({ items }).then(unwrapApiResponse),
        { loading: 'Đang cập nhật...', success: `Đã cập nhật ${selectedCells.length} ô!` }
      )
      invalidateGrid()
      setSelectedCells([])
    } catch (err) {
      showError(err)
    }
  }

  const weekdayLabel = (dayNum: number) => WEEKDAY_LABELS[new Date(year, month - 1, dayNum).getDay()]

  // Daily totals for footer: present / leave per day
  const dayTotals = visibleDays.map((dayNum) => {
    let present = 0
    let leave = 0
    for (const emp of gridData?.employees ?? []) {
      const day = emp.days.find((x) => Number(x.date.split('-')[2]) === dayNum)
      if (!day) continue
      if (day.leaveReasonId) leave++
      else present++
    }
    return { day: dayNum, present, leave }
  })

  return (
    <>
      <Helmet>
        <title>Chấm công - {APP_NAME}</title>
      </Helmet>

      <div className="flex flex-col gap-5">
        <PageHeader
          icon="event_available"
          title="Bảng chấm công"
          description={`Chấm công và quản lý ngày nghỉ cán bộ - Tháng ${month}/${year}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9"
                  aria-label="Tháng trước"
                  onClick={() => changeMonth(-1)}
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9"
                  aria-label="Tháng sau"
                  onClick={() => changeMonth(1)}
                >
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </Button>
              </div>

              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Tháng" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      Tháng {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent>
                  {[year - 1, year, year + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Năm {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!isCurrentMonth ? (
                <Button
                  variant="outline"
                  className="size-9 px-0"
                  title="Về tháng hiện tại"
                  onClick={() => {
                    setYear(now.getFullYear())
                    setMonth(now.getMonth() + 1)
                  }}
                >
                  <span className="material-symbols-outlined text-base">today</span>
                </Button>
              ) : null}

              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Tất cả đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đơn vị</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* Bulk action bar - hiển thị khi có ô được chọn */}
        {selectedCells.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-2.5 shadow-sm animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mr-1">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white text-xs font-black">
                {selectedCells.length}
              </span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">ô đã chọn</span>
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-xl px-3 font-bold gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
              onClick={() => handleBulkSetReason(null)}
            >
              <span className="text-emerald-600 font-black">✓</span>
              Có mặt
            </Button>
            {reasons.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant="outline"
                className="h-9 rounded-xl px-3 font-bold gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
                onClick={() => handleBulkSetReason(r.id)}
              >
                <span className="font-black" style={{ color: r.color || undefined }}>
                  {r.symbol}
                </span>
                {r.name}
              </Button>
            ))}
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              className="h-9 rounded-xl px-3 font-bold text-slate-500 hover:text-slate-800 gap-1"
              onClick={() => setSelectedCells([])}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Bỏ chọn
            </Button>
          </div>
        ) : null}

        {/* Legend bar — trên grid */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm text-xs font-semibold">
          <span className="text-muted-foreground">Chú giải:</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <span>✓</span>
            <span>Có mặt</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            <span className="material-symbols-outlined text-xs">star</span>
            <span>Đi trực ngày nghỉ (+1 công)</span>
          </div>
          {reasons.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-900 dark:text-slate-100"
              style={{ backgroundColor: `${r.color}25` }}
            >
              <span className="font-bold" style={{ color: r.color || undefined }}>
                {r.symbol}
              </span>
              <span>{r.name}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {isCurrentMonth ? (
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                <button
                  type="button"
                  className={cn(
                    'px-3 py-1.5 font-bold transition-colors',
                    !showFullMonth && !showThisWeek
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                  onClick={() => { setShowFullMonth(false); setShowThisWeek(false) }}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  className={cn(
                    'px-3 py-1.5 font-bold transition-colors',
                    showThisWeek
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                  onClick={() => { setShowThisWeek(true); setShowFullMonth(false) }}
                >
                  Tuần này
                </button>
                <button
                  type="button"
                  className={cn(
                    'px-3 py-1.5 font-bold transition-colors',
                    showFullMonth
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                  onClick={() => { setShowFullMonth(true); setShowThisWeek(false) }}
                >
                  Cả tháng
                </button>
              </div>
            ) : null}
            <span className="text-muted-foreground italic">
              Kéo chuột chọn nhiều ô • chuột phải menu nhanh • ESC bỏ chọn
            </span>
          </div>
        </div>

        {/* Main Grid + Right Panel */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Data Grid */}
          <div className={cn('rounded-2xl border bg-card shadow-sm overflow-hidden transition-all', selectedEmp ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12')}>
            <div
              key={`${year}-${month}-${showTodayOnly ? 'today' : 'full'}`}
              className={cn(
                'overflow-auto max-h-[75vh] scrollbar-thin animate-in duration-300',
                navDir.current === 1 ? 'slide-in-from-right-8 fade-in' : 'slide-in-from-left-8 fade-in',
              )}
            >
              <table className="w-full text-xs border-collapse" onContextMenu={handleContextMenu}>
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-30">
                    <th className="p-2 border-r text-center sticky left-0 top-0 z-40 bg-slate-100 dark:bg-slate-800 min-w-[40px]">
                      STT
                    </th>
                    <th className="p-2 border-r text-left sticky left-[40px] top-0 z-40 bg-slate-100 dark:bg-slate-800 min-w-[160px]">
                      Họ tên
                    </th>
                    <th className="p-2 border-r text-left sticky left-[200px] top-0 z-30 bg-slate-100 dark:bg-slate-800 min-w-[120px]">
                      Chức vụ
                    </th>
                    {visibleDays.map((d) => {
                      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                      const off = dayOffInfo(dateStr)
                      const isToday = dateStr === todayStr
                      return (
                        <th
                          key={d}
                          className={cn(
                            'p-1 border-r text-center min-w-[36px] sticky top-0 z-20',
                            off
                              ? (off.color === '#94a3b8' || off.color === '#cbd5e1'
                                  ? 'bg-slate-300/80 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400'
                                  : 'bg-red-200/80 text-red-700 dark:bg-red-950/80 dark:text-red-300')
                              : undefined,
                            isToday && 'bg-primary/10 text-primary dark:bg-primary/20 ring-1 ring-inset ring-primary/30',
                          )}
                          title={off ? `Ngày nghỉ: ${off.name ?? ''}` : undefined}
                        >
                          <div className="text-[11px] leading-tight">{String(d).padStart(2, '0')}</div>
                          <div className={cn('text-[9px] font-semibold leading-tight', isToday ? 'text-primary' : off ? 'text-red-400 dark:text-red-300' : 'text-slate-400 dark:text-slate-500')}>
                            {off?.symbol ?? weekdayLabel(d)}
                          </div>
                        </th>
                      )
                    })}
                    <th className="p-2 border-r text-center min-w-[65px] bg-slate-50 dark:bg-slate-800 sticky top-0 right-[65px] z-30">
                      Công
                    </th>
                    <th className="p-2 text-center min-w-[65px] bg-slate-50 dark:bg-slate-800 sticky top-0 right-0 z-30">
                      Nghỉ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gridLoading ? (
                    <tr>
                      <td colSpan={visibleDays.length + 5} className="p-8 text-center text-muted-foreground">
                        Đang tải dữ liệu chấm công...
                      </td>
                    </tr>
                  ) : !gridData?.employees.length ? (
                    <tr>
                      <td colSpan={visibleDays.length + 5} className="p-8 text-center text-muted-foreground">
                        Chưa có dữ liệu cán bộ.
                      </td>
                    </tr>
                  ) : (
                    gridData.employees.map((emp, index) => {
                      const isEmpSelected = selectedEmp?.employeeId === emp.employeeId
                      return (
                        <tr
                          key={emp.employeeId}
                          className={cn(
                            'border-b transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
                            isEmpSelected && 'bg-primary/5 dark:bg-primary/10'
                          )}
                        >
                          <td className="p-2 border-r text-center sticky left-0 z-20 bg-card font-semibold text-slate-500">
                            {index + 1}
                          </td>
                          <td className="p-2 border-r sticky left-[40px] z-20 bg-card">
                            <button
                              type="button"
                              className="w-full text-left cursor-pointer hover:text-primary transition-colors"
                              onClick={() => setSelectedEmp(emp)}
                            >
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                                {emp.fullName}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">{emp.employeeCode}</div>
                            </button>
                          </td>
                          <td className="p-2 border-r text-left sticky left-[200px] z-20 bg-card text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                            {emp.position ?? '—'}
                          </td>

                          {/* Days Cells */}
                          {visibleDays.map((d) => {
                            const day = emp.days.find((x) => Number(x.date.split('-')[2]) === d)
                            if (!day) return null
                            const dateStr = day.date
                            const isToday = dateStr === todayStr
                            const isSelected = selectedCells.some(
                              (c) => c.employeeId === emp.employeeId && c.date === dateStr
                            )
                            const reason = day.leaveReasonId ? reasonMap.get(day.leaveReasonId) : null
                            const isTruc = day.isDayOff && day.hasRecord && !reason
                            const cellTitle = reason
                              ? `${reason.name}${day.note ? ` — ${day.note}` : ''}`
                              : isTruc
                                ? `Đi trực ngày nghỉ${day.note ? ` — ${day.note}` : ''}`
                                : day.isDayOff
                                  ? `Ngày nghỉ (${day.dayOffName ?? ''})`
                                  : 'Có mặt'

                            return (
                              <td
                                key={dateStr}
                                className={cn(
                                  'p-1 border-r text-center cursor-pointer select-none transition-all relative',
                                  day.isDayOff && 'bg-slate-200/60 dark:bg-slate-700/40',
                                  isToday && 'bg-primary/5 dark:bg-primary/10',
                                  isSelected && 'ring-2 ring-primary ring-inset bg-primary/20 z-10'
                                )}
                                onMouseDown={(e) => handleCellMouseDown(emp.employeeId, dateStr, e)}
                                onMouseEnter={() => handleCellMouseEnter(emp.employeeId, dateStr)}
                              >
                                <Popover
                                  open={
                                    activeCell?.employeeId === emp.employeeId && activeCell?.date === dateStr
                                  }
                                  onOpenChange={(open: boolean) => {
                                    if (!open) setActiveCell(null)
                                  }}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <PopoverTrigger asChild>
                                        <button
                                          type="button"
                                          aria-label={`${emp.fullName} ngày ${dateStr}`}
                                          className="w-full h-7 flex items-center justify-center rounded font-bold cursor-pointer"
                                          onClick={(e) => handleCellClick(emp.employeeId, dateStr, day.leaveReasonId, day.note, e)}
                                        >
                                          {reason ? (
                                            <span
                                              className="px-1 py-0.5 rounded text-[11px]"
                                              style={{
                                                backgroundColor: `${reason.color}30`,
                                                color: reason.color || undefined,
                                              }}
                                            >
                                              {reason.symbol}
                                            </span>
                                          ) : isTruc ? (
                                            <span
                                              className="material-symbols-outlined text-[13px] text-amber-500"
                                              style={{ fontSize: 14 }}
                                            >
                                              star
                                            </span>
                                          ) : day.isDayOff ? (
                                            <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600">
                                              —
                                            </span>
                                          ) : (
                                            <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                                          )}
                                        </button>
                                      </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="font-semibold max-w-[220px]">
                                      {cellTitle}
                                    </TooltipContent>
                                  </Tooltip>
                                  <PopoverContent className="w-64 p-3 space-y-3" side="bottom" align="center">
                                    <div className="font-bold text-xs border-b pb-1.5 flex justify-between items-center">
                                      <span>{emp.fullName}</span>
                                      <span className="text-muted-foreground font-mono">{dateStr}</span>
                                    </div>
                                    {day.isDayOff && !isTruc ? (
                                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 dark:text-red-300">
                                        <span className="material-symbols-outlined text-sm">event_busy</span>
                                        Ngày nghỉ theo lịch ({day.dayOffName ?? '—'}). Đánh Có mặt để tính công trực.
                                      </div>
                                    ) : null}

                                    <div className="grid grid-cols-2 gap-1.5">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className={cn(
                                          'h-8 text-xs justify-start gap-1.5',
                                          !activeCell?.leaveReasonId && 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        )}
                                        onClick={() => handleSaveCell(null)}
                                      >
                                        <span className="text-emerald-600 font-bold">✓</span>
                                        <span>Có mặt</span>
                                      </Button>
                                      {reasons.map((r) => (
                                        <Button
                                          key={r.id}
                                          size="sm"
                                          variant="outline"
                                          className={cn(
                                            'h-8 text-xs justify-start gap-1.5 truncate',
                                            activeCell?.leaveReasonId === r.id && 'border-primary bg-primary/10'
                                          )}
                                          onClick={() => handleSaveCell(r.id)}
                                        >
                                          <span className="font-bold" style={{ color: r.color || undefined }}>
                                            {r.symbol}
                                          </span>
                                          <span className="truncate">{r.name}</span>
                                        </Button>
                                      ))}
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-[11px]">Ghi chú:</Label>
                                      <Input
                                        className="h-7 text-xs"
                                        placeholder="Nhập ghi chú..."
                                        value={cellNote}
                                        onChange={(e) => setCellNote(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            void handleSaveCell(activeCell?.leaveReasonId ?? null)
                                          }
                                        }}
                                      />
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </td>
                            )
                          })}

                          <td className="p-2 border-r text-center font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50/50 dark:bg-slate-800/30 sticky right-[65px] z-20">
                            {emp.workDays}
                          </td>
                          <td className="p-2 text-center font-bold text-amber-600 dark:text-amber-400 bg-slate-50/50 dark:bg-slate-800/30 sticky right-0 z-20">
                            {emp.leaveDays}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {gridData?.employees.length ? (
                  <tfoot>
                    <tr className="sticky bottom-0 z-10 bg-slate-50 dark:bg-slate-800 font-bold text-[10px] border-t">
                      <td colSpan={3} className="p-1.5 border-r text-right text-muted-foreground sticky left-0 z-20 bg-slate-50 dark:bg-slate-800">
                        Có mặt / Nghỉ
                      </td>
                      {dayTotals.map((t) => (
                        <td
                          key={t.day}
                          className={cn(
                            'p-1 text-center border-r whitespace-nowrap',
                           dayOffInfo(`${year}-${String(month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`) &&
                               'bg-slate-200/60 dark:bg-slate-700/50'
                          )}
                        >
                          <span className="text-emerald-600 dark:text-emerald-400">{t.present}</span>
                          <span className="text-slate-300 dark:text-slate-600">/</span>
                          <span className="text-amber-600 dark:text-amber-400">{t.leave}</span>
                        </td>
                      ))}
                      <td className="p-1.5 border-r sticky right-[65px] bg-slate-50 dark:bg-slate-800" />
                      <td className="p-1.5 sticky right-0 bg-slate-50 dark:bg-slate-800" />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </div>

          {/* Right Panel - Employee Details & History */}
          {selectedEmp ? (
            <div className="lg:col-span-4 xl:col-span-3 rounded-2xl border bg-card p-4 shadow-sm space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">person</span>
                  Thông tin cán bộ
                </h3>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => setSelectedEmp(null)}>
                  <span className="material-symbols-outlined text-sm">close</span>
                </Button>
              </div>

              {/* Profile Card */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div className="size-12 rounded-full bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0">
                  {selectedEmp.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {selectedEmp.fullName}
                  </div>
                  <div className="text-xs text-muted-foreground">{selectedEmp.position ?? 'Cán bộ'}</div>
                  <div className="text-[11px] text-primary font-mono">{selectedEmp.departmentName}</div>
                </div>
              </div>

              {/* Month Summary Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-muted-foreground font-semibold">Ngày công</div>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {selectedEmp.workDays}
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-muted-foreground font-semibold">Ngày nghỉ</div>
                  <div className="text-xl font-black text-amber-700 dark:text-amber-400">
                    {selectedEmp.leaveDays}
                  </div>
                </div>
              </div>

              {/* History Log */}
              <div className="flex-1 space-y-2 min-h-[200px]">
                <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">history</span>
                  Lịch sử thay đổi chấm công
                </h4>

                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                  {history.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-6">
                      Chưa có lịch sử thay đổi trong tháng này.
                    </div>
                  ) : (
                    history.map((h) => (
                      <div key={h.id} className="text-xs border rounded-xl p-2.5 space-y-1 bg-card">
                        <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                          <span className="font-mono font-semibold">{h.date}</span>
                          <span>{new Date(h.changedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="font-medium flex items-center gap-1">
                          <span>{h.fromLeaveReasonName ?? 'Có mặt'}</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          <span className="font-bold text-primary">{h.toLeaveReasonName ?? 'Có mặt'}</span>
                        </div>
                        {h.note ? <div className="text-muted-foreground italic text-[11px]">"{h.note}"</div> : null}
                        <div className="text-[10px] text-right text-muted-foreground">Bởi: {h.changedBy}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right Click Context Menu for Bulk Actions */}
      {contextMenu ? (
      <div
        className="fixed z-50 bg-popover border shadow-lg rounded-xl p-1.5 w-48 text-xs font-semibold space-y-1 animate-in fade-in-0 zoom-in-95"
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 text-[10px] text-muted-foreground border-b font-mono">
            Đã chọn {selectedCells.length} ô
          </div>
          <button
            type="button"
            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 dark:hover:bg-emerald-950 flex items-center gap-1.5"
            onClick={() => handleBulkSetReason(null)}
          >
            <span>✓</span>
            <span>Đặt Có mặt</span>
          </button>
          {reasons.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-accent flex items-center gap-1.5 truncate"
              onClick={() => handleBulkSetReason(r.id)}
            >
              <span className="font-bold" style={{ color: r.color || undefined }}>
                {r.symbol}
              </span>
              <span className="truncate">Đặt {r.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}