import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { bulkDeleteEmployees, createEmployee, deleteEmployee, updateEmployee, useGetEmployees } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, toastSmartPromise } from '@/api/utils'
import { APP_NAME } from '@/constants/ui'
import { PageHeader } from '@/components/PageHeader'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DepartmentVm, EmployeeVm } from '@/types/api'
import { useGetDepartments } from '@/api/generated'

interface FormValues {
  employeeCode: string
  fullName: string
  departmentId: string
  position: string
  baseSalary: string
  allowance: string
  phoneNumber: string
  avatarUrl: string
  joinDate: string
}

const EMPTY_FORM: FormValues = {
  employeeCode: '',
  fullName: '',
  departmentId: '',
  position: '',
  baseSalary: '',
  allowance: '',
  phoneNumber: '',
  avatarUrl: '',
  joinDate: '',
}

export function EmployeesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeVm | null>(null)
  const [deleting, setDeleting] = useState<EmployeeVm | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const { data: raw, isLoading, isError, error } = useGetEmployees()
  const { data: deptRaw } = useGetDepartments()

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const employees = raw ? unwrapApiResponse<EmployeeVm[]>(raw) : undefined
  const departments = deptRaw ? unwrapApiResponse<DepartmentVm[]>(deptRaw) : []

  const columns: ColumnDef<EmployeeVm>[] = [
    selectColumn<EmployeeVm>(),
    {
      accessorKey: 'employeeCode',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã CB" />,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.employeeCode}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'fullName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Họ tên" />,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.fullName}</span>
      ),
    },
    {
      accessorKey: 'departmentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Đơn vị" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.departmentName ?? '—'}</span>
      ),
      size: 150,
    },
    {
      accessorKey: 'position',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Chức vụ" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.position ?? '—'}</span>
      ),
      size: 140,
    },
    {
      accessorKey: 'baseSalary',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lương cơ bản" />,
      cell: ({ row }) => (
        <span className="text-sm font-mono text-right">
          {row.original.baseSalary.toLocaleString('vi-VN')}
        </span>
      ),
      size: 130,
    },
    {
      accessorKey: 'allowance',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phụ cấp" />,
      cell: ({ row }) => (
        <span className="text-sm font-mono text-right">
          {row.original.allowance.toLocaleString('vi-VN')}
        </span>
      ),
      size: 120,
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
          {row.original.isActive ? 'Đang làm' : 'Nghỉ việc'}
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
    await queryClient.invalidateQueries({ queryKey: ['/api/employees'] })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (emp: EmployeeVm) => {
    setEditing(emp)
    setForm({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      departmentId: String(emp.departmentId),
      position: emp.position ?? '',
      baseSalary: String(emp.baseSalary),
      allowance: String(emp.allowance),
      phoneNumber: emp.phoneNumber ?? '',
      avatarUrl: emp.avatarUrl ?? '',
      joinDate: emp.joinDate ? emp.joinDate.split('T')[0] : '',
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
    if (!form.employeeCode.trim()) nextErrors.employeeCode = 'Mã cán bộ không được để trống.'
    if (!form.fullName.trim()) nextErrors.fullName = 'Họ tên không được để trống.'
    if (!form.departmentId) nextErrors.departmentId = 'Đơn vị công tác không được để trống.'
    const baseSalary = Number(form.baseSalary)
    if (isNaN(baseSalary) || baseSalary < 0) nextErrors.baseSalary = 'Lương cơ bản không được âm.'
    const allowance = Number(form.allowance)
    if (isNaN(allowance) || allowance < 0) nextErrors.allowance = 'Phụ cấp không được âm.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      const payload = {
        employeeCode: form.employeeCode,
        fullName: form.fullName,
        departmentId: Number(form.departmentId),
        position: form.position || null,
        baseSalary,
        allowance,
        phoneNumber: form.phoneNumber || null,
        avatarUrl: form.avatarUrl || null,
        joinDate: form.joinDate || null,
      }
      if (editing) {
        await toastSmartPromise(
          updateEmployee(editing.id, payload).then(unwrapApiResponse),
          { loading: 'Đang cập nhật...', success: 'Cập nhật cán bộ thành công!' },
        )
      } else {
        await toastSmartPromise(
          createEmployee(payload).then(unwrapApiResponse),
          { loading: 'Đang thêm...', success: 'Thêm cán bộ thành công!' },
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
        deleteEmployee(deleting.id).then(unwrapApiResponse),
        { loading: 'Đang xóa...', success: 'Xóa cán bộ thành công!' },
      )
      await invalidate()
      setDeleting(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection)
    if (!ids.length) return
    setBulkDeleting(true)
    try {
      await toastSmartPromise(
        bulkDeleteEmployees(ids).then(unwrapApiResponse),
        { loading: 'Đang xóa nhiều cán bộ...', success: 'Đã xóa các cán bộ đã chọn!' },
      )
      await invalidate()
      setBulkDeleteOpen(false)
      setRowSelection({})
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Quản lý cán bộ - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="person"
          title="Quản lý cán bộ"
          description="Danh sách cán bộ, viên chức UBND xã"
          actions={
            <Button onClick={openCreate}>
              <span className="material-symbols-outlined text-base mr-1">add</span>
              Thêm cán bộ
            </Button>
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
            data={employees ?? []}
            searchKey="tên, mã cán bộ"
            loading={isLoading}
            getRowId={(row) => row.id}
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa cán bộ' : 'Thêm cán bộ mới'}</DialogTitle>
            <DialogDescription>
              Nhập thông tin cán bộ. Các trường có dấu (*) là bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="emp-code">
                Mã cán bộ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="emp-code"
                placeholder="VD: CB001"
                value={form.employeeCode}
                onChange={(e) => setField('employeeCode', e.target.value)}
              />
              {errors.employeeCode ? (
                <p className="text-xs font-medium text-red-500">{errors.employeeCode}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-dept">
                Đơn vị <span className="text-red-500">*</span>
              </Label>
              <Select value={form.departmentId} onValueChange={(v) => setField('departmentId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId ? (
                <p className="text-xs font-medium text-red-500">{errors.departmentId}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">
                Họ tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="emp-name"
                placeholder="Họ và tên đầy đủ..."
                value={form.fullName}
                onChange={(e) => setField('fullName', e.target.value)}
              />
              {errors.fullName ? (
                <p className="text-xs font-medium text-red-500">{errors.fullName}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-pos">Chức vụ</Label>
              <Input
                id="emp-pos"
                placeholder="VD: Chuyên viên"
                value={form.position}
                onChange={(e) => setField('position', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-base">Lương cơ bản <span className="text-red-500">*</span></Label>
              <Input
                id="emp-base"
                type="number"
                min={0}
                step={100000}
                placeholder="8000000"
                value={form.baseSalary}
                onChange={(e) => setField('baseSalary', e.target.value)}
              />
              {errors.baseSalary ? (
                <p className="text-xs font-medium text-red-500">{errors.baseSalary}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-allow">Phụ cấp <span className="text-red-500">*</span></Label>
              <Input
                id="emp-allow"
                type="number"
                min={0}
                step={100000}
                placeholder="1500000"
                value={form.allowance}
                onChange={(e) => setField('allowance', e.target.value)}
              />
              {errors.allowance ? (
                <p className="text-xs font-medium text-red-500">{errors.allowance}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-phone">Số điện thoại</Label>
              <Input
                id="emp-phone"
                placeholder="0912345678"
                value={form.phoneNumber}
                onChange={(e) => setField('phoneNumber', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="emp-avatar">Ảnh đại diện (URL)</Label>
              <Input
                id="emp-avatar"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={(e) => setField('avatarUrl', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="emp-join">Ngày vào làm</Label>
              <Input
                id="emp-join"
                type="date"
                value={form.joinDate}
                onChange={(e) => setField('joinDate', e.target.value)}
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
        title="Xóa cán bộ"
        description={
          <>
            Bạn có chắc chắn muốn xóa cán bộ{' '}
            <span className="font-semibold text-foreground">{deleting?.fullName}</span>?
          </>
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Xóa nhiều cán bộ"
        description={`Bạn có chắc chắn muốn xóa ${Object.keys(rowSelection).length} cán bộ đã chọn? Hành động này không thể hoàn tác.`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}