import {useEffect, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import type {ColumnDef, RowSelectionState} from '@tanstack/react-table'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {showError, toastSmartPromise} from '@/api/utils'
import apiClient from '@/api/client'
import {APP_NAME} from '@/constants/ui'
import {PageHeader} from '@/components/PageHeader'
import {RefreshButton} from '@/components/RefreshButton'
import {ConfirmDialog} from '@/components/ConfirmDialog'
import {BulkActionBar, DataTable, DataTableColumnHeader} from '@/components/DataTable'
import {selectColumn} from '@/components/DataTable/selectColumn'
import {TooltipButton} from '@/components/TooltipButton'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface BaseSalaryVm {
  id: number
  amount: number
  effectiveFromYear: number
  effectiveFromMonth: number
  note?: string
  displayOrder: number
}

interface FormValues {
  amount: string
  effectiveFromYear: string
  effectiveFromMonth: string
  note: string
  displayOrder: string
}

const EMPTY_FORM: FormValues = {
  amount: '2340000',
  effectiveFromYear: String(new Date().getFullYear()),
  effectiveFromMonth: '7',
  note: '',
  displayOrder: '0',
}

export function BaseSalariesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BaseSalaryVm | null>(null)
  const [deleting, setDeleting] = useState<BaseSalaryVm | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { data: raw, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['/api/base-salaries'],
    queryFn: () => apiClient.get('/api/base-salaries').then((res) => res.data),
  })

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const baseSalaries = (raw ? unwrapApiResponse<BaseSalaryVm[]>(raw) : []) ?? []

  const columns: ColumnDef<BaseSalaryVm>[] = [
    selectColumn<BaseSalaryVm>(),
    {
      accessorKey: 'amount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mức lương cơ sở" />,
      cell: ({ row }) => (
        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400 font-mono">
          {row.original.amount.toLocaleString('vi-VN')} đ
        </span>
      ),
      size: 180,
    },
    {
      accessorKey: 'effectiveFrom',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thời điểm áp dụng" />,
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          Tháng {row.original.effectiveFromMonth}/{row.original.effectiveFromYear}
        </span>
      ),
      size: 160,
    },
    {
      accessorKey: 'note',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Căn cứ Nghị định / Ghi chú" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.note ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'displayOrder',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thứ tự" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.displayOrder}</span>,
      size: 80,
    },
    {
      id: 'actions',
      header: () => <span className="text-right">Thao tác</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <TooltipButton variant="ghost" size="icon" label="Chỉnh sửa" onClick={() => openEdit(row.original)}>
            <span className="material-symbols-outlined text-lg">edit</span>
          </TooltipButton>
          <TooltipButton
            variant="ghost"
            size="icon"
            label="Xóa"
            className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            onClick={() => setDeleting(row.original)}
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </TooltipButton>
        </div>
      ),
      size: 100,
    },
  ]

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/base-salaries'] })
    await queryClient.invalidateQueries({ queryKey: ['/api/salary'] })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (item: BaseSalaryVm) => {
    setEditing(item)
    setForm({
      amount: String(item.amount),
      effectiveFromYear: String(item.effectiveFromYear),
      effectiveFromMonth: String(item.effectiveFromMonth),
      note: item.note ?? '',
      displayOrder: String(item.displayOrder),
    })
    setErrors({})
    setDialogOpen(true)
  }

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSave = async () => {
    const nextErrors: typeof errors = {}
    const amt = Number(form.amount)
    const yr = Number(form.effectiveFromYear)
    const mo = Number(form.effectiveFromMonth)

    if (!form.amount || Number.isNaN(amt) || amt <= 0) nextErrors.amount = 'Nhập mức lương hợp lệ.'
    if (!form.effectiveFromYear || Number.isNaN(yr) || yr < 2000) nextErrors.effectiveFromYear = 'Năm không hợp lệ.'
    if (!form.effectiveFromMonth || Number.isNaN(mo) || mo < 1 || mo > 12) nextErrors.effectiveFromMonth = 'Tháng từ 1 đến 12.'

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      const payload = {
        amount: amt,
        effectiveFromYear: yr,
        effectiveFromMonth: mo,
        note: form.note.trim() || undefined,
        displayOrder: Number(form.displayOrder) || 0,
      }

      if (editing) {
        await toastSmartPromise(
          apiClient.put(`/api/base-salaries/${editing.id}`, payload).then((res) => unwrapApiResponse(res.data)),
          { loading: 'Đang cập nhật...', success: 'Cập nhật mức lương cơ sở thành công!' },
        )
      } else {
        await toastSmartPromise(
          apiClient.post('/api/base-salaries', payload).then((res) => unwrapApiResponse(res.data)),
          { loading: 'Đang thêm mới...', success: 'Thêm mức lương cơ sở mới thành công!' },
        )
      }
      await invalidate()
      setDialogOpen(false)
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await toastSmartPromise(
        apiClient.delete(`/api/base-salaries/${deleting.id}`).then((res) => unwrapApiResponse(res.data)),
        { loading: 'Đang xóa...', success: 'Đã xóa mức lương cơ sở!' },
      )
      await invalidate()
      setDeleting(null)
    } catch (err) {
      showError(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const selectedIds = Object.keys(rowSelection).map(
    (idx) => (baseSalaries ?? [])[Number(idx)]?.id,
  ).filter(Boolean) as number[]

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    setBulkDeleting(true)
    try {
      await toastSmartPromise(
        Promise.all(selectedIds.map((id) => apiClient.delete(`/api/base-salaries/${id}`))),
        { loading: 'Đang xóa các mục đã chọn...', success: 'Đã xóa danh sách mức lương!' },
      )
      setRowSelection({})
      await invalidate()
      setBulkDeleteOpen(false)
    } catch (err) {
      showError(err)
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <>
      <title>Mức lương cơ sở - {APP_NAME}</title>

      <div className="flex flex-col gap-5">
        <PageHeader
          icon="payments"
          title="Mức lương cơ sở"
          description="Quản lý lịch sử mức lương cơ sở Nhà nước qua các thời kỳ Nghị định"
          actions={
            <>
              <RefreshButton onClick={() => refetch()} loading={isRefetching} />
              <Button onClick={openCreate} className="gap-1.5">
                <span className="material-symbols-outlined text-base">add</span>
                Thêm mức lương mới
              </Button>
            </>
          }
        />

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <phantom-ui loading={isLoading} animation="shimmer" reveal={0.1} class="block">
            <DataTable
              columns={columns}
              data={baseSalaries}
              enableRowSelection
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          </phantom-ui>
        </div>

        <BulkActionBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setRowSelection({})}
          actions={[
            {
              label: 'Xóa mục đã chọn',
              icon: 'delete',
              onClick: () => setBulkDeleteOpen(true),
            },
          ]}
        />

        {/* Dialog thêm/sửa */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Chỉnh sửa mức lương cơ sở' : 'Thêm mức lương cơ sở mới'}</DialogTitle>
              <DialogDescription>
                Nhập số tiền và thời điểm Nghị định quy định bắt đầu áp dụng.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bs-amount">
                  Mức lương cơ sở (VNĐ) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bs-amount"
                  type="number"
                  placeholder="VD: 2340000"
                  value={form.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                />
                {errors.amount ? <p className="text-xs font-medium text-red-500">{errors.amount}</p> : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bs-month">
                    Áp dụng từ Tháng <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="bs-month"
                    value={form.effectiveFromMonth}
                    onChange={(e) => setField('effectiveFromMonth', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                  {errors.effectiveFromMonth ? <p className="text-xs font-medium text-red-500">{errors.effectiveFromMonth}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bs-year">
                    Từ Năm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bs-year"
                    type="number"
                    placeholder="VD: 2024"
                    value={form.effectiveFromYear}
                    onChange={(e) => setField('effectiveFromYear', e.target.value)}
                  />
                  {errors.effectiveFromYear ? <p className="text-xs font-medium text-red-500">{errors.effectiveFromYear}</p> : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bs-note">Căn cứ Nghị định / Ghi chú</Label>
                <Input
                  id="bs-note"
                  placeholder="VD: Nghị định 73/2024/NĐ-CP"
                  value={form.note}
                  onChange={(e) => setField('note', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bs-order">Thứ tự hiển thị</Label>
                <Input
                  id="bs-order"
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setField('displayOrder', e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
          title="Xác nhận xóa"
          description={`Bạn có chắc muốn xóa cấu hình mức lương cơ sở (${deleting?.amount.toLocaleString('vi-VN')} đ áp dụng từ Tháng ${deleting?.effectiveFromMonth}/${deleting?.effectiveFromYear})?`}
          confirmText="Xóa"
          loading={deleteLoading}
          onConfirm={handleDelete}
        />

        <ConfirmDialog
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          title="Xác nhận xóa danh sách"
          description={`Bạn có chắc muốn xóa ${selectedIds.length} cấu hình mức lương cơ sở đã chọn?`}
          confirmText="Xóa tất cả"
          loading={bulkDeleting}
          onConfirm={handleBulkDelete}
        />
      </div>
    </>
  )
}
