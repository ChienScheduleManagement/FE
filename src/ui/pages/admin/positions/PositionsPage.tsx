import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { useBulkPositions, useCreatePositions, useDeletePositionsById, useGetPositions, useUpdatePositionsById } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, toastSmartPromise } from '@/api/utils'
import { PageHeader } from '@/components/PageHeader'
import { RefreshButton } from '@/components/RefreshButton'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable, DataTableColumnHeader, BulkActionBar } from '@/components/DataTable'
import { selectColumn } from '@/components/DataTable/selectColumn'
import { TooltipButton } from '@/components/TooltipButton'
import { FormDialog, FormField } from '@/components/FormDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { PositionVm } from '@/types/api'

interface FormValues {
  code: string
  name: string
  displayOrder: string
  isActive: boolean
}

const EMPTY_FORM: FormValues = {
  code: '',
  name: '',
  displayOrder: '0',
  isActive: true,
}

export function PositionsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PositionVm | null>(null)
  const [deleting, setDeleting] = useState<PositionVm | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { data: raw, isLoading, isError, error, refetch, isRefetching } = useGetPositions()
  const { mutateAsync: createPosition, isPending: creating } = useCreatePositions()
  const { mutateAsync: updatePosition, isPending: updating } = useUpdatePositionsById()
  const { mutateAsync: deletePosition, isPending: deletingPosition } = useDeletePositionsById()
  const { mutateAsync: bulkDeletePositions, isPending: bulkDeleting } = useBulkPositions()

  const saving = creating || updating

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const positions = raw ? unwrapApiResponse<PositionVm[]>(raw) : undefined

  const columns: ColumnDef<PositionVm>[] = [
    selectColumn<PositionVm>(),
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã chức vụ" />,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.code}</span>
      ),
      size: 140,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên chức vụ" />,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'displayOrder',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thứ tự" />,
      cell: ({ row }) => <span className="text-sm">{row.original.displayOrder}</span>,
      size: 80,
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            row.original.isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          )}
        >
          {row.original.isActive ? 'Đang dùng' : 'Tạm dừng'}
        </span>
      ),
      size: 100,
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
    await queryClient.invalidateQueries({ queryKey: ['/api/positions'] })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (p: PositionVm) => {
    setEditing(p)
    setForm({
      code: p.code,
      name: p.name,
      displayOrder: String(p.displayOrder),
      isActive: p.isActive,
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
    if (!form.code.trim()) nextErrors.code = 'Mã chức vụ không được để trống.'
    if (!form.name.trim()) nextErrors.name = 'Tên chức vụ không được để trống.'
    if (Number(form.displayOrder) < 0) nextErrors.displayOrder = 'Độ ưu tiên không được âm.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const payload = {
      code: form.code,
      name: form.name,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
    }
    if (editing) {
      await toastSmartPromise(
        updatePosition({ id: editing.id, data: payload }),
        { loading: 'Đang cập nhật...', success: 'Cập nhật chức vụ thành công!' },
      )
    } else {
      await toastSmartPromise(
        createPosition({ data: payload }),
        { loading: 'Đang thêm...', success: 'Thêm chức vụ thành công!' },
      )
    }
    await invalidate()
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    await toastSmartPromise(
      deletePosition({ id: deleting.id }),
      { loading: 'Đang xóa...', success: 'Xóa chức vụ thành công!' },
    )
    await invalidate()
    setDeleting(null)
  }

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection).map(Number)
    if (!ids.length) return
    await toastSmartPromise(
      bulkDeletePositions({ data: ids }),
      { loading: 'Đang xóa nhiều chức vụ...', success: 'Đã xóa các chức vụ đã chọn!' },
    )
    await invalidate()
    setBulkDeleteOpen(false)
    setRowSelection({})
  }

  return (
    <>
       <title>Chức vụ</title>
       <div className="flex flex-col gap-5">
        <PageHeader
          icon="workspace_premium"
          title="Quản lý chức vụ"
          description="Quản lý danh mục chức vụ của cán bộ, công chức trong xã"
          actions={
            <>
              <RefreshButton onClick={() => refetch()} loading={isRefetching} />
              <Button onClick={openCreate}>
                <span className="material-symbols-outlined text-base mr-1">add</span>
                Thêm chức vụ
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
          <phantom-ui loading={isLoading} animation="shimmer" reveal={0.1} class="block">
            <DataTable
              columns={columns}
              data={positions ?? []}
              searchKey="tên, mã"
              getRowId={(row) => row.id}
              enableRowSelection
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          </phantom-ui>
        </div>
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}
        description="Nhập thông tin chức vụ. Các trường có dấu (*) là bắt buộc."
        editing={!!editing}
        loading={saving}
        onSave={handleSave}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Mã chức vụ" htmlFor="pos-code" required error={errors.code}>
            <Input
              id="pos-code"
              placeholder="VD: CT_UBND"
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
            />
          </FormField>
          <FormField label="Thứ tự" htmlFor="pos-order" error={errors.displayOrder}>
            <Input
              id="pos-order"
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(e) => setField('displayOrder', e.target.value)}
            />
          </FormField>
          <FormField label="Tên chức vụ" htmlFor="pos-name" required error={errors.name}>
            <Input
              id="pos-name"
              placeholder="VD: Chủ tịch UBND xã"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </FormField>
          <FormField label="Trạng thái" htmlFor="pos-active">
            <select
              id="pos-active"
              value={String(form.isActive)}
              onChange={(e) => setField('isActive', e.target.value === 'true')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="true">Đang dùng</option>
              <option value="false">Tạm dừng</option>
            </select>
          </FormField>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Xóa chức vụ"
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
        title="Xóa nhiều chức vụ"
        description={`Bạn có chắc chắn muốn xóa ${Object.keys(rowSelection).length} chức vụ đã chọn? Hành động này không thể hoàn tác.`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}
