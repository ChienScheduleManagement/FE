import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { useBulkLeaveReasons, useCreateLeaveReasons, useDeleteLeaveReasonsById, useGetLeaveReasons, useUpdateLeaveReasonsById } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, toastSmartPromise } from '@/api/utils'
import { APP_NAME } from '@/constants/ui'
import { PageHeader } from '@/components/PageHeader'
import { RefreshButton } from '@/components/RefreshButton'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable, DataTableColumnHeader, BulkActionBar } from '@/components/DataTable'
import { selectColumn } from '@/components/DataTable/selectColumn'
import { TooltipButton } from '@/components/TooltipButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { LeaveReasonVm } from '@/types/api'

interface FormValues {
  code: string
  name: string
  symbol: string
  color: string
  isPaid: boolean
  salaryRatio: string
  displayOrder: string
}

const EMPTY_FORM: FormValues = {
  code: '',
  name: '',
  symbol: '',
  color: '#facc15',
  isPaid: true,
  salaryRatio: '1',
  displayOrder: '0',
}

const DEFAULT_COLORS = [
  '#facc15', '#fb923c', '#c084fc', '#38bdf8', '#2dd4bf', '#f87171', '#94a3b8', '#16a34a', '#a855f7', '#ec4899',
]

export function LeaveReasonsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LeaveReasonVm | null>(null)
  const [deleting, setDeleting] = useState<LeaveReasonVm | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { data: raw, isLoading, isError, error, refetch, isRefetching } = useGetLeaveReasons()
  const { mutateAsync: createLeaveReason, isPending: creating } = useCreateLeaveReasons()
  const { mutateAsync: updateLeaveReason, isPending: updating } = useUpdateLeaveReasonsById()
  const { mutateAsync: deleteLeaveReason, isPending: deletingPosition } = useDeleteLeaveReasonsById()
  const { mutateAsync: bulkDeleteLeaveReasons, isPending: bulkDeleting } = useBulkLeaveReasons()

  const saving = creating || updating

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const leaveReasons = raw ? unwrapApiResponse<LeaveReasonVm[]>(raw) : undefined

  const columns: ColumnDef<LeaveReasonVm>[] = [
    selectColumn<LeaveReasonVm>(),
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.code}</span>
      ),
      size: 90,
    },
    {
      accessorKey: 'symbol',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ký hiệu" />,
      cell: ({ row }) => (
        <span className="font-bold text-lg" style={{ color: row.original.color || undefined }}>
          {row.original.symbol ?? '—'}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên lý do" />,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'color',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Màu" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="size-6 rounded border"
            style={{ backgroundColor: row.original.color || '#facc15' }}
          />
          <span className="text-sm font-mono text-muted-foreground">{row.original.color}</span>
        </div>
      ),
      size: 130,
    },
    {
      accessorKey: 'isPaid',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tính lương" />,
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            row.original.isPaid
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          )}
        >
          {row.original.isPaid ? 'Có' : 'Không'}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'salaryRatio',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tỷ lệ %" />,
      cell: ({ row }) => (
        <span className="text-sm font-mono text-right">
          {Math.round((row.original.salaryRatio ?? 0) * 100)}%
        </span>
      ),
      size: 90,
    },
    {
      accessorKey: 'displayOrder',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thứ tự" />,
      cell: ({ row }) => <span className="text-sm">{row.original.displayOrder}</span>,
      size: 80,
    },
    {
      id: 'actions',
      header: () => <span className="text-right">Thao tác</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <TooltipButton
            variant="ghost"
            size="icon"
            label="Chỉnh sửa"
            onClick={() => openEdit(row.original)}
          >
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
      size: 110,
    },
  ]

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/leave-reasons'] })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (lr: LeaveReasonVm) => {
    setEditing(lr)
    setForm({
      code: lr.code,
      name: lr.name,
      symbol: lr.symbol ?? '',
      color: lr.color ?? '#facc15',
      isPaid: lr.isPaid,
      salaryRatio: String(lr.salaryRatio ?? 1),
      displayOrder: String(lr.displayOrder),
    })
    setErrors({})
    setDialogOpen(true)
  }

  const setField = (key: keyof FormValues, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSave = async () => {
    const nextErrors: typeof errors = {}
    if (!form.code.trim()) nextErrors.code = 'Mã lý do không được để trống.'
    if (!form.name.trim()) nextErrors.name = 'Tên lý do không được để trống.'
    if (!form.symbol.trim()) nextErrors.symbol = 'Ký hiệu không được để trống.'
    const ratio = Number(form.salaryRatio)
    if (isNaN(ratio) || ratio < 0 || ratio > 1) nextErrors.salaryRatio = 'Tỷ lệ hưởng lương phải từ 0 đến 1.'
    if (Number(form.displayOrder) < 0) nextErrors.displayOrder = 'Độ ưu tiên không được âm.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

      const payload = {
        code: form.code,
        name: form.name,
        symbol: form.symbol,
        color: form.color,
        isPaid: form.isPaid,
        salaryRatio: ratio,
        displayOrder: Number(form.displayOrder) || 0,
      }
      if (editing) {
        await toastSmartPromise(
          updateLeaveReason({ id: editing.id, data: payload }).then(unwrapApiResponse),
          { loading: 'Đang cập nhật...', success: 'Cập nhật lý do nghỉ thành công!' },
        )
      } else {
        await toastSmartPromise(
          createLeaveReason({ data: payload }).then(unwrapApiResponse),
          { loading: 'Đang thêm...', success: 'Thêm lý do nghỉ thành công!' },
        )
      }
      await invalidate()
      setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
      await toastSmartPromise(
        deleteLeaveReason({ id: deleting.id }).then(unwrapApiResponse),
        { loading: 'Đang xóa...', success: 'Xóa lý do nghỉ thành công!' },
      )
      await invalidate()
      setDeleting(null)
  }

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection).map(Number)
    if (!ids.length) return
      await toastSmartPromise(
        bulkDeleteLeaveReasons({ data: ids }).then(unwrapApiResponse),
        { loading: 'Đang xóa nhiều lý do...', success: 'Đã xóa các lý do đã chọn!' },
      )
      await invalidate()
      setBulkDeleteOpen(false)
      setRowSelection({})
  }

  return (
    <>
      <Helmet>
        <title>Danh mục lý do nghỉ - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="category"
          title="Danh mục lý do nghỉ"
          description="Quản lý các loại nghỉ phép, ốm, thai sản, công tác..."
          actions={
            <>
              <RefreshButton onClick={() => refetch()} loading={isRefetching} />
              <Button onClick={openCreate}>
                <span className="material-symbols-outlined text-base mr-1">add</span>
                Thêm lý do
              </Button>
            </>
          }
        />

        <div className="rounded-2xl border bg-card shadow-sm p-4">
          <BulkActionBar
            selectedCount={Object.keys(rowSelection).length}
            actions={[
              {
                label: 'Xóa nhiều',
                icon: 'delete_sweep',
                onClick: () => setBulkDeleteOpen(true),
                colorClass:
                  'text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950/40',
              },
            ]}
            onClearSelection={() => setRowSelection({})}
          />
          <DataTable
            columns={columns}
            data={leaveReasons ?? []}
            searchKey="tên, mã, ký hiệu"
            loading={isLoading}
            getRowId={(row) => row.id}
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa lý do nghỉ' : 'Thêm lý do nghỉ mới'}</DialogTitle>
            <DialogDescription>
              Nhập thông tin loại nghỉ. Các trường có dấu (*) là bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lr-code">
                Mã <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lr-code"
                placeholder="VD: PHEP"
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
              />
              {errors.code ? (
                <p className="text-xs font-medium text-red-500">{errors.code}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lr-order">Thứ tự</Label>
              <Input
                id="lr-order"
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) => setField('displayOrder', e.target.value)}
              />
              {errors.displayOrder ? (
                <p className="text-xs font-medium text-red-500">{errors.displayOrder}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lr-name">
                Tên lý do <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lr-name"
                placeholder="Tên đầy đủ..."
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              {errors.name ? (
                <p className="text-xs font-medium text-red-500">{errors.name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lr-sym">
                Ký hiệu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lr-sym"
                placeholder="P, Ô, TS..."
                maxLength={10}
                value={form.symbol}
                onChange={(e) => setField('symbol', e.target.value)}
              />
              {errors.symbol ? (
                <p className="text-xs font-medium text-red-500">{errors.symbol}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lr-color">Màu sắc</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setField('color', c)}
                    className={cn(
                      'size-8 rounded-lg border-2 transition-all',
                      form.color === c ? 'border-primary scale-110' : 'border-transparent hover:border-slate-300',
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lr-paid">Tính lương</Label>
              <select
                id="lr-paid"
                value={String(form.isPaid)}
                onChange={(e) => setField('isPaid', e.target.value === 'true')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="true">Có (tính lương)</option>
                <option value="false">Không (không lương)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lr-ratio">
                Tỷ lệ hưởng lương <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lr-ratio"
                type="number"
                min={0}
                max={1}
                step={0.05}
                placeholder="1.0"
                value={form.salaryRatio}
                onChange={(e) => setField('salaryRatio', e.target.value)}
              />
              {errors.salaryRatio ? (
                <p className="text-xs font-medium text-red-500">{errors.salaryRatio}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-base mr-1">save</span>
              )}
              {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Xóa lý do nghỉ"
        description={
          <>
            Bạn có chắc chắn muốn xóa{' '}
            <span className="font-semibold text-foreground">{deleting?.name}</span>?
          </>
        }
        loading={deletingPosition}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Xóa nhiều lý do nghỉ"
        description={`Bạn có chắc chắn muốn xóa ${Object.keys(rowSelection).length} lý do đã chọn? Hành động này không thể hoàn tác.`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}