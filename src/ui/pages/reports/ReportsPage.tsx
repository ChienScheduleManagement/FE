import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useGetAttendance, useGetSalary, useGetLeaveReasons, useGetDepartments } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { APP_NAME } from '@/constants/ui'
import { PageHeader } from '@/components/PageHeader'
import { RefreshButton } from '@/components/RefreshButton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AttendanceGridVm, SalaryVm, LeaveReasonVm, DepartmentVm } from '@/types/api'

export function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [departmentId, setDepartmentId] = useState<string>('all')

  const { data: gridRaw, refetch: refetchGrid, isRefetching: refetchingGrid } = useGetAttendance({
    year,
    month,
    departmentId: departmentId === 'all' ? undefined : Number(departmentId),
  })

  const { data: salaryRaw, refetch: refetchSalary, isRefetching: refetchingSalary } = useGetSalary({
    Year: year,
    Month: month,
    DepartmentId: departmentId === 'all' ? undefined : Number(departmentId),
  })

  const { data: reasonsRaw, refetch: refetchReasons, isRefetching: refetchingReasons } = useGetLeaveReasons()
  const { data: deptsRaw, refetch: refetchDepts, isRefetching: refetchingDepts } = useGetDepartments()

  const gridData = gridRaw ? unwrapApiResponse<AttendanceGridVm>(gridRaw) : undefined
  const salaryData = salaryRaw ? unwrapApiResponse<SalaryVm>(salaryRaw) : undefined
  const reasons = reasonsRaw ? unwrapApiResponse<LeaveReasonVm[]>(reasonsRaw) : []
  const departments = deptsRaw ? unwrapApiResponse<DepartmentVm[]>(deptsRaw) : []

  const refreshing = refetchingGrid || refetchingSalary || refetchingReasons || refetchingDepts

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

  return (
    <>
      <Helmet>
        <title>Báo cáo & Thống kê - {APP_NAME}</title>
      </Helmet>

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

        {/* Overview Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground">Tổng số cán bộ</div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {gridData?.employees.length ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground">Tổng số lượt nghỉ</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {totalLeaveDays}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground">Tỷ lệ ngày công trung bình</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {gridData?.employees.length
                ? Math.round(
                    (gridData.employees.reduce((acc, e) => acc + e.workDays, 0) /
                      (gridData.employees.length * (gridData.daysInMonth || 30))) *
                      100
                  )
                : 0}
              %
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground">Tổng quỹ lương</div>
            <div className="text-2xl font-black text-primary mt-1">
              {totalPayroll.toLocaleString('vi-VN')} đ
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
              {reasons.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">Chưa có danh mục lý do.</div>
              ) : (
                reasons.map((r) => {
                  const count = reasonCounts.get(r.id) ?? 0
                  const pct = totalLeaveDays ? Math.round((count / totalLeaveDays) * 100) : 0

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
              {departments.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">Chưa có đơn vị nào.</div>
              ) : (
                departments.map((dept) => {
                  const deptEmps = gridData?.employees.filter((e) => e.departmentName === dept.name) ?? []
                  const deptLeaves = deptEmps.reduce((acc, e) => acc + e.leaveDays, 0)

                  return (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{dept.name}</div>
                        <div className="text-muted-foreground">{deptEmps.length} cán bộ</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-amber-600 dark:text-amber-400 text-sm">{deptLeaves}</div>
                        <div className="text-[10px] text-muted-foreground">lượt nghỉ</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}