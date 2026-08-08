import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useGetSalary, getExportSalary, useGetDepartments } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, toastSmartPromise } from '@/api/utils'
import { APP_NAME } from '@/constants/ui'
import { PageHeader } from '@/components/PageHeader'
import { RefreshButton } from '@/components/RefreshButton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SalaryVm, DepartmentVm } from '@/types/api'

export function SalaryPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [departmentId, setDepartmentId] = useState<string>('all')

  const { data: salaryRaw, isLoading, isError, error, refetch, isRefetching } = useGetSalary({
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
        getExportSalary(
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
              <RefreshButton onClick={() => refetch()} loading={isRefetching} />
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
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground">Lương cơ sở áp dụng</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {(salaryData?.baseSalaryAmount ?? 2340000).toLocaleString('vi-VN')} đ
            </div>
          </div>
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
                <th className="px-3 py-2.5 text-center w-10">STT</th>
                <th className="px-3 py-2.5 w-20">Mã CB</th>
                <th className="px-3 py-2.5 w-40">Họ tên</th>
                <th className="px-3 py-2.5 w-32">Chức vụ</th>
                <th className="px-3 py-2.5 w-36">Đơn vị</th>
                <th className="px-3 py-2.5 text-center w-14">Công</th>
                <th className="px-3 py-2.5 text-center w-12">Nghỉ</th>
                <th className="px-3 py-2.5 text-right w-16">Hệ số</th>
                <th className="px-3 py-2.5 text-right w-24">Lương CB</th>
                <th className="px-3 py-2.5 text-right w-24">Phụ cấp</th>
                <th className="px-3 py-2.5 text-right pr-5 w-28">Thực lĩnh</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">
                    Đang tính lương...
                  </td>
                </tr>
              ) : !salaryData?.items.length ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                salaryData.items.map((item, idx) => {
                  const baseSalaryAmount = salaryData.baseSalaryAmount ?? 2340000
                  const coefDisplay = item.salaryCoefficient > 0
                    ? item.salaryCoefficient.toLocaleString('vi-VN')
                    : '—'
                  const monthlyBaseAmount = item.salaryCoefficient > 0
                    ? Math.round(item.salaryCoefficient * baseSalaryAmount)
                    : item.baseSalary

                  return (
                    <tr
                      key={item.employeeId}
                      className="border-b transition-colors odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <td className="px-3 py-2.5 text-center font-semibold text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-primary">{item.employeeCode}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-slate-100">{item.fullName}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{item.position ?? '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{item.departmentName ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {item.workDays}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-600 dark:text-amber-400">
                        {item.leaveDays}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {coefDisplay}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {monthlyBaseAmount.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {item.allowance.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 pr-5">
                        {item.netSalary.toLocaleString('vi-VN')} ₫
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}