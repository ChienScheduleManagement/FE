import {useEffect, useState} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import type {ColumnDef, RowSelectionState} from '@tanstack/react-table'
import {
  useBulkDepartments,
  useCreateDepartments,
  useDeleteDepartmentsById,
  useGetDepartments,
  useUpdateDepartmentsById
} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {showError, toastSmartPromise} from '@/api/utils'
import {PageHeader} from '@/components/PageHeader'
import {RefreshButton} from '@/components/RefreshButton'
import {ConfirmDialog} from '@/components/ConfirmDialog'
import {BulkActionBar, DataTable, DataTableColumnHeader} from '@/components/DataTable'
import {selectColumn} from '@/components/DataTable/selectColumn'
import {TooltipButton} from '@/components/TooltipButton'
import {FormDialog, FormField} from '@/components/FormDialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {cn} from '@/lib/utils'
import type {DepartmentVm} from '@/types/api'

interface FormValues {
  code: string
  name: string
  shortName?: string
  leaderName?: string
  phoneNumber?: string
  displayOrder: string
}

const EMPTY_FORM: FormValues = {
  code: '',
  name: '',
  shortName: '',
  leaderName: '',
  phoneNumber: '',
  displayOrder: '0',
}

export function DepartmentsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DepartmentVm | null>(null)
  const [deleting, setDeleting] = useState<DepartmentVm | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { data: raw, isLoading, isError, error, refetch, isRefetching } = useGetDepartments()
  const { mutateAsync: createDepartment, isPending: creating } = useCreateDepartments()
  const { mutateAsync: updateDepartment, isPending: updating } = useUpdateDepartmentsById()
  const { mutateAsync: deleteDepartment, isPending: deletingPosition } = useDeleteDepartmentsById()
  const { mutateAsync: bulkDeleteDepartments, isPending: bulkDeleting } = useBulkDepartments()

  const saving = creating || updating

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const departments = raw ? unwrapApiResponse<DepartmentVm[]>(raw) : undefined

  const columns: ColumnDef<DepartmentVm>[] = [
    selectColumn<DepartmentVm>(),
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.code}</span>
      ),
      size: 110,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên phòng ban" />,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'shortName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên viết tắt" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.shortName ?? '—'}</span>
      ),
      size: 130,
    },
    {
      accessorKey: 'leaderName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lãnh đạo" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.leaderName ?? '—'}</span>
      ),
      size: 160,
    },
    {
      accessorKey: 'phoneNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Điện thoại" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.phoneNumber ?? '—'}</span>
      ),
      size: 130,
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
          {row.original.isActive ? 'Hoạt động' : 'Ngừng'}
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
    await queryClient.invalidateQueries({ queryKey: ['/api/departments'] })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (dept: DepartmentVm) => {
    setEditing(dept)
    setForm({
      code: dept.code,
      name: dept.name,
      shortName: dept.shortName ?? '',
      leaderName: dept.leaderName ?? '',
      phoneNumber: dept.phoneNumber ?? '',
      displayOrder: String(dept.displayOrder),
    })
    setErrors({})
    setDialogOpen(true)
  }

  const setField = (key: keyof FormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSave = async () => {
    const nextErrors: typeof errors = {}
    if (!form.code.trim()) nextErrors.code = 'Mã phòng ban không được để trống.'
    if (!form.name.trim()) nextErrors.name = 'Tên phòng ban không được để trống.'
    if (Number(form.displayOrder) < 0) nextErrors.displayOrder = 'Độ ưu tiên không được âm.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    if (editing) {
      await toastSmartPromise(
        updateDepartment({ id: editing.id, data: {
          code: form.code,
          name: form.name,
          shortName: form.shortName || null,
          leaderName: form.leaderName || null,
          phoneNumber: form.phoneNumber || null,
          displayOrder: Number(form.displayOrder) || 0,
        } }).then(unwrapApiResponse),
        { loading: 'Đang cập nhật...', success: 'Cập nhật phòng ban thành công!' },
      )
    } else {
      await toastSmartPromise(
        createDepartment({ data: {
          code: form.code,
          name: form.name,
          shortName: form.shortName || null,
          leaderName: form.leaderName || null,
          phoneNumber: form.phoneNumber || null,
          displayOrder: Number(form.displayOrder) || 0,
        } }).then(unwrapApiResponse),
        { loading: 'Đang thêm...', success: 'Thêm phòng ban thành công!' },
      )
    }
    await invalidate()
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    await toastSmartPromise(
      deleteDepartment({ id: deleting.id }).then(unwrapApiResponse),
      { loading: 'Đang xóa...', success: 'Xóa phòng ban thành công!' },
    )
    await invalidate()
    setDeleting(null)
  }

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection).map(Number)
    if (!ids.length) return
    await toastSmartPromise(
      bulkDeleteDepartments({ data: ids }).then(unwrapApiResponse),
      { loading: 'Đang xóa nhiều phòng ban...', success: 'Đã xóa các phòng ban đã chọn!' },
    )
    await invalidate()
    setBulkDeleteOpen(false)
    setRowSelection({})
  }

  return (
    <>
      <title>Quản lý phòng ban</title>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="account_balance"
          title="Quản lý phòng ban"
          description="Danh sách các đơn vị trực thuộc UBND xã"
          actions={
            <>
              <RefreshButton onClick={() => refetch()} loading={isRefetching} />
              <Button onClick={openCreate}>
                <span className="material-symbols-outlined text-base mr-1">add</span>
                Thêm phòng ban
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
              data={departments ?? []}
              searchKey="tên phòng ban"
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
        title={editing ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
        description="Nhập thông tin đơn vị. Các trường có dấu (*) là bắt buộc."
        editing={!!editing}
        loading={saving}
        onSave={handleSave}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Mã phòng ban" htmlFor="dept-code" required error={errors.code}>
            <Input
              id="dept-code"
              placeholder="VD: VP-UBND"
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
            />
          </FormField>
          <FormField label="Thứ tự hiển thị" htmlFor="dept-order" error={errors.displayOrder}>
            <Input
              id="dept-order"
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(e) => setField('displayOrder', e.target.value)}
            />
          </FormField>
          <FormField label="Tên phòng ban" htmlFor="dept-name" required error={errors.name}>
            <Input
              id="dept-name"
              placeholder="Tên đầy đủ của đơn vị..."
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </FormField>
          <FormField label="Tên viết tắt" htmlFor="dept-short">
            <Input
              id="dept-short"
              value={form.shortName ?? ''}
              onChange={(e) => setField('shortName', e.target.value)}
            />
          </FormField>
          <FormField label="Lãnh đạo đơn vị" htmlFor="dept-leader">
            <Input
              id="dept-leader"
              value={form.leaderName ?? ''}
              onChange={(e) => setField('leaderName', e.target.value)}
            />
          </FormField>
          <FormField label="Số điện thoại" htmlFor="dept-phone">
            <Input
              id="dept-phone"
              value={form.phoneNumber ?? ''}
              onChange={(e) => setField('phoneNumber', e.target.value)}
            />
          </FormField>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Xóa phòng ban"
        description={
          <>
            Bạn có chắc chắn muốn xóa phòng ban{' '}
            <span className="font-semibold text-foreground">{deleting?.name}</span>?
          </>
        }
        loading={deletingPosition}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Xóa nhiều phòng ban"
        description={`Bạn có chắc chắn muốn xóa ${Object.keys(rowSelection).length} phòng ban đã chọn? Hành động này không thể hoàn tác.`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}
