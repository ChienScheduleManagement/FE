import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useGetSalary, exportSalary, useGetDepartments } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, toastSmartPromise } from '@/api/utils'
import { APP_NAME } from '@/constants/ui'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SalaryVm, DepartmentVm } from '@/types/api'

export function SalaryPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [departmentId, setDepartmentId] = useState<string>('all')

  const { data: salaryRaw, isLoading, isError, error } = useGetSalary({
    Year: year,
    Month: month,
    DepartmentId: departmentId === 'all' ? undefined : Number(departmentId),
  })

  const { data: deptsRaw } = useGetDepartments()

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const salaryData = salaryRaw ? unwrapApiResponse<SalaryVm>(salaryRaw) : undefined
  const departments = deptsRaw ? unwrapApiResponse<DepartmentVm[]>(deptsRaw) : []

  const handleExport = async () => {
    try {
      await toastSmartPromise(
        exportSalary(
          {
            Year: year,
            Month: month,
            DepartmentId: departmentId === 'all' ? undefined : Number(departmentId),
          },
          { responseType: 'blob' },
        ).then((res) => {
          // Download blob
          const blob = res as unknown as Blob
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Bang_luong_thang_${month}_${year}.xlsx`
          a.click()
          window.URL.revokeObjectURL(url)
        }),
        { loading: 'Đang xuất Excel...', success: 'Xuất file thành công!' }
      )
    } catch (err) {
      showError(err)
    }
  }

  const totalFund = salaryData?.items.reduce((acc, item) => acc + item.netSalary, 0) ?? 0

  return (
    <>
      <Helmet>
        <title>Tính lương - {APP_NAME}</title>
      </Helmet>

      <div className="flex flex-col gap-5">
        <PageHeader
          icon="payments"
          title="Tính lương tự động"
          description={`Bảng tính lương cán bộ tháng ${month}/${year} dựa trên ngày công chấm công`}
          actions={
            <div className="flex flex-wrap items-center gap-3">
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

              <Button onClick={handleExport} variant="outline" className="gap-1.5">
                <span className="material-symbols-outlined text-base">download</span>
                Xuất Excel
              </Button>
            </div>
          }
        />

        {/* Stats Card */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground">Tổng số cán bộ</div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {salaryData?.items.length ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground">Ngày công tiêu chuẩn</div>
            <div className="text-2xl font-black text-primary mt-1">
              {salaryData?.standardDays ?? 0} ngày
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground">Tổng quỹ lương ước tính</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {totalFund.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <th className="p-3 text-center w-12">STT</th>
                <th className="p-3 w-28">Mã CB</th>
                <th className="p-3 min-w-[160px]">Họ tên</th>
                <th className="p-3 min-w-[120px]">Chức vụ</th>
                <th className="p-3 min-w-[150px]">Đơn vị</th>
                <th className="p-3 text-center w-24">Công QĐ</th>
                <th className="p-3 text-center w-24">Nghỉ</th>
                <th className="p-3 text-right min-w-[120px]">Lương cơ bản</th>
                <th className="p-3 text-right min-w-[110px]">Phụ cấp</th>
                <th className="p-3 text-right min-w-[130px]">Thực lĩnh</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    Đang tính lương...
                  </td>
                </tr>
              ) : !salaryData?.items.length ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                salaryData.items.map((item, idx) => (
                  <tr
                    key={item.employeeId}
                    className="border-b transition-colors odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-primary">{item.employeeCode}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{item.fullName}</td>
                    <td className="p-3 text-muted-foreground">{item.position ?? '—'}</td>
                    <td className="p-3 text-muted-foreground">{item.departmentName ?? '—'}</td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {item.workDays}
                    </td>
                    <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">
                      {item.leaveDays}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {item.baseSalary.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {item.allowance.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {item.netSalary.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}