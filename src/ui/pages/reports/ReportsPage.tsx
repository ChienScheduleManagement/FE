import {useState} from 'react'
import {useGetAttendance, useGetDepartments, useGetLeaveReasons, useGetSalary} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {APP_NAME} from '@/constants/ui'
import {PageHeader} from '@/components/PageHeader'
import {RefreshButton} from '@/components/RefreshButton'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import type {AttendanceGridVm, DepartmentVm, LeaveReasonVm, SalaryVm} from '@/types/api'

export function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [departmentId, setDepartmentId] = useState<string>('all')

  const { data: gridRaw, refetch: refetchGrid, isRefetching: refetchingGrid, isLoading: gridLoading } = useGetAttendance({
    year,
    month,
    departmentId: departmentId === 'all' ? undefined : Number(departmentId),
  })

  const { data: salaryRaw, refetch: refetchSalary, isRefetching: refetchingSalary, isLoading: salaryLoading } = useGetSalary({
    Year: year,
    Month: month,
    DepartmentId: departmentId === 'all' ? undefined : Number(departmentId),
  })

  const { data: reasonsRaw, refetch: refetchReasons, isRefetching: refetchingReasons, isLoading: reasonsLoading } = useGetLeaveReasons()
  const { data: deptsRaw, refetch: refetchDepts, isRefetching: refetchingDepts, isLoading: deptsLoading } = useGetDepartments()

  const gridData = gridRaw ? unwrapApiResponse<AttendanceGridVm>(gridRaw) : undefined
  const salaryData = salaryRaw ? unwrapApiResponse<SalaryVm>(salaryRaw) : undefined
  const reasons = reasonsRaw ? unwrapApiResponse<LeaveReasonVm[]>(reasonsRaw) : []
  const departments = deptsRaw ? unwrapApiResponse<DepartmentVm[]>(deptsRaw) : []

  const refreshing = refetchingGrid || refetchingSalary || refetchingReasons || refetchingDepts
  const initialLoading = gridLoading || salaryLoading || reasonsLoading || deptsLoading

  const handleRefresh = async () => {
    await Promise.all([refetchGrid(), refetchSalary(), refetchReasons(), refetchDepts()])
  }

  // Compute breakdown by leave reason
  const reasonCounts = new Map<number, number>()
  for (const emp of gridData?.employees ?? []) {
    for (const day of emp.days) {
      if (day.leaveReasonId) {
        reasonCounts.set(day.leaveReasonId, (reasonCounts.get(day.leaveReasonId) ?? 0) + 1)
      }
    }
  }

  // Total leave days
  const totalLeaveDays = Array.from(reasonCounts.values()).reduce((a, b) => a + b, 0)
  const totalPayroll = salaryData?.items.reduce((acc, item) => acc + item.netSalary, 0) ?? 0

  // Mock data for skeleton template when loading
  const displayEmployeesCount = initialLoading ? 45 : (gridData?.employees.length ?? 0)
  const displayLeaveDays = initialLoading ? 12 : totalLeaveDays
  const displayPayroll = initialLoading ? 124500000 : totalPayroll
  const displayAverageRatio = initialLoading
    ? 88
    : (gridData?.employees.length
        ? Math.round(
            (gridData.employees.reduce((acc, e) => acc + e.workDays, 0) /
              (gridData.employees.length * (gridData.daysInMonth || 30))) *
              100
          )
        : 0)

  const displayReasons = initialLoading
    ? [
        { id: 1, name: 'Nghỉ phép năm', symbol: 'P', color: '#3b82f6' },
        { id: 2, name: 'Nghỉ ốm đau', symbol: 'O', color: '#ef4444' },
        { id: 3, name: 'Nghỉ thai sản', symbol: 'TS', color: '#ec4899' },
        { id: 4, name: 'Nghỉ không lương', symbol: 'KL', color: '#6b7280' },
      ]
    : reasons

  const displayDepartments = initialLoading
    ? [
        { id: 1, name: 'Phòng Hành chính - Tổng hợp', employeesCount: 12, leavesCount: 4 },
        { id: 2, name: 'Phòng Kế hoạch - Tài chính', employeesCount: 8, leavesCount: 2 },
        { id: 3, name: 'Phòng Tổ chức cán bộ', employeesCount: 6, leavesCount: 1 },
        { id: 4, name: 'Phòng Công nghệ thông tin', employeesCount: 15, leavesCount: 5 },
      ]
    : departments.map(d => {
        const deptEmps = gridData?.employees.filter((e) => e.departmentName === d.name) ?? []
        const deptLeaves = deptEmps.reduce((acc, e) => acc + e.leaveDays, 0)
        return {
          id: d.id,
          name: d.name,
          employeesCount: deptEmps.length,
          leavesCount: deptLeaves
        }
      })

  return (
    <>
      <title>Báo cáo & Thống kê - {APP_NAME}</title>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="analytics"
          title="Báo cáo & Thống kê"
          description={`Thống kê tình hình chấm công và quỹ lương - Tháng ${month}/${year}`}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <RefreshButton onClick={handleRefresh} loading={refreshing} />
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="w-[120px]">
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
                <SelectTrigger className="w-[110px]">
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

              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-[180px]">
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

        <phantom-ui loading={initialLoading} animation="shimmer" reveal={0.1} class="block">
          <div className="flex flex-col gap-5">
            {/* Overview Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground">Tổng số cán bộ</div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {displayEmployeesCount}
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground">Tổng số lượt nghỉ</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {displayLeaveDays}
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground">Tỷ lệ ngày công trung bình</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {displayAverageRatio}%
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground">Tổng quỹ lương</div>
                <div className="text-2xl font-black text-primary mt-1">
                  {displayPayroll.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            {/* Reason Breakdown & Department Breakdown */}
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Reason Breakdown */}
              <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">pie_chart</span>
                  Phân bố loại nghỉ trong tháng
                </h3>

                <div className="space-y-3">
                  {displayReasons.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8">Chưa có danh mục lý do.</div>
                  ) : (
                    displayReasons.map((r) => {
                      const count = initialLoading ? (r.id === 1 ? 5 : r.id === 2 ? 3 : 2) : (reasonCounts.get(r.id) ?? 0)
                      const pct = displayLeaveDays ? Math.round((count / displayLeaveDays) * 100) : 0

                      return (
                        <div key={r.id} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="flex items-center gap-1.5">
                              <span className="size-2.5 rounded-full" style={{ backgroundColor: r.color || '#facc15' }} />
                              <span>{r.name} ({r.symbol})</span>
                            </span>
                            <span>
                              <strong className="text-slate-900 dark:text-slate-100">{count}</strong> lượt ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: r.color || '#facc15',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">domain</span>
                  Thống kê nghỉ theo đơn vị / phòng ban
                </h3>

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                  {displayDepartments.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8">Chưa có đơn vị nào.</div>
                  ) : (
                    displayDepartments.map((dept) => (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{dept.name}</div>
                          <div className="text-muted-foreground">{dept.employeesCount} cán bộ</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-amber-600 dark:text-amber-400 text-sm">{dept.leavesCount}</div>
                          <div className="text-[10px] text-muted-foreground">lượt nghỉ</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </phantom-ui>
      </div>
    </>
  )
}
