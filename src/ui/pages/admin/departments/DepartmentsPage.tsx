import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { createDepartment, deleteDepartment, updateDepartment, useGetDepartments } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, toastSmartPromise } from '@/api/utils'
import { APP_NAME } from '@/constants/ui'
import { PageHeader } from '@/components/PageHeader'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable, DataTableColumnHeader } from '@/components/DataTable'
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
import type { DepartmentVm } from '@/types/api'

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
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { data: raw, isLoading, isError, error } = useGetDepartments()

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const departments = raw ? unwrapApiResponse<DepartmentVm[]>(raw) : undefined

  const columns: ColumnDef<DepartmentVm>[] = [
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
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await toastSmartPromise(
          updateDepartment(editing.id, {
            code: form.code,
            name: form.name,
            shortName: form.shortName || null,
            leaderName: form.leaderName || null,
            phoneNumber: form.phoneNumber || null,
            displayOrder: Number(form.displayOrder) || 0,
          }).then(unwrapApiResponse),
          { loading: 'Đang cập nhật...', success: 'Cập nhật phòng ban thành công!' },
        )
      } else {
        await toastSmartPromise(
          createDepartment({
            code: form.code,
            name: form.name,
            shortName: form.shortName || null,
            leaderName: form.leaderName || null,
            phoneNumber: form.phoneNumber || null,
            displayOrder: Number(form.displayOrder) || 0,
          }).then(unwrapApiResponse),
          { loading: 'Đang thêm...', success: 'Thêm phòng ban thành công!' },
        )
      }
      await invalidate()
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await toastSmartPromise(
        deleteDepartment(deleting.id).then(unwrapApiResponse),
        { loading: 'Đang xóa...', success: 'Xóa phòng ban thành công!' },
      )
      await invalidate()
      setDeleting(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Quản lý phòng ban - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="account_balance"
          title="Quản lý phòng ban"
          description="Danh sách các đơn vị trực thuộc UBND xã"
          actions={
            <Button onClick={openCreate}>
              <span className="material-symbols-outlined text-base mr-1">add</span>
              Thêm phòng ban
            </Button>
          }
        />

        <div className="rounded-2xl border bg-card shadow-sm p-4">
          <DataTable
            columns={columns}
            data={departments ?? []}
            searchKey="tên phòng ban"
            loading={isLoading}
            getRowId={(row) => row.id}
          />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}</DialogTitle>
            <DialogDescription>
              Nhập thông tin đơn vị. Các trường có dấu (*) là bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dept-code">
                Mã phòng ban <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dept-code"
                placeholder="VD: VP-UBND"
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
              />
              {errors.code ? (
                <p className="text-xs font-medium text-red-500">{errors.code}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-order">Thứ tự hiển thị</Label>
              <Input
                id="dept-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setField('displayOrder', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dept-name">
                Tên phòng ban <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dept-name"
                placeholder="Tên đầy đủ của đơn vị..."
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              {errors.name ? (
                <p className="text-xs font-medium text-red-500">{errors.name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-short">Tên viết tắt</Label>
              <Input
                id="dept-short"
                value={form.shortName ?? ''}
                onChange={(e) => setField('shortName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-leader">Lãnh đạo đơn vị</Label>
              <Input
                id="dept-leader"
                value={form.leaderName ?? ''}
                onChange={(e) => setField('leaderName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dept-phone">Số điện thoại</Label>
              <Input
                id="dept-phone"
                value={form.phoneNumber ?? ''}
                onChange={(e) => setField('phoneNumber', e.target.value)}
              />
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
        title="Xóa phòng ban"
        description={
          <>
            Bạn có chắc chắn muốn xóa phòng ban{' '}
            <span className="font-semibold text-foreground">{deleting?.name}</span>?
          </>
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  )
}
