import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { bulkDeleteCategories, createCategory, deleteCategory, updateCategory, useGetCategories } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, toastSmartPromise } from '@/api/utils'
import { APP_NAME } from '@/constants/ui'
import { CATEGORY_TYPES } from '@/constants/task'
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
import type { CategoryVm } from '@/types/api'

interface FormValues {
  type: string
  code: string
  name: string
  displayOrder: string
}

const EMPTY_FORM: FormValues = { type: 'DOC_TYPE', code: '', name: '', displayOrder: '0' }

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [type, setType] = useState('DOC_TYPE')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryVm | null>(null)
  const [deleting, setDeleting] = useState<CategoryVm | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { data: raw, isLoading, isError, error } = useGetCategories({ type })

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const categories = raw ? unwrapApiResponse<CategoryVm[]>(raw) : undefined

  const columns: ColumnDef<CategoryVm>[] = [
    selectColumn<CategoryVm>(),
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.code}</span>
      ),
      size: 130,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên danh mục" />,
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
    await queryClient.invalidateQueries({ queryKey: ['/api/categories'] })
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, type })
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (cat: CategoryVm) => {
    setEditing(cat)
    setForm({
      type: cat.type,
      code: cat.code,
      name: cat.name,
      displayOrder: String(cat.displayOrder),
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
    if (!form.code.trim()) nextErrors.code = 'Mã danh mục không được để trống.'
    if (!form.name.trim()) nextErrors.name = 'Tên danh mục không được để trống.'
    if (Number(form.displayOrder) < 0) nextErrors.displayOrder = 'Độ ưu tiên không được âm.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await toastSmartPromise(
          updateCategory(editing.id, {
            type: form.type,
            code: form.code,
            name: form.name,
            displayOrder: Number(form.displayOrder) || 0,
          }).then(unwrapApiResponse),
          { loading: 'Đang cập nhật...', success: 'Cập nhật danh mục thành công!' },
        )
      } else {
        await toastSmartPromise(
          createCategory({
            type: form.type,
            code: form.code,
            name: form.name,
            displayOrder: Number(form.displayOrder) || 0,
          }).then(unwrapApiResponse),
          { loading: 'Đang thêm...', success: 'Thêm danh mục thành công!' },
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
        deleteCategory(deleting.id).then(unwrapApiResponse),
        { loading: 'Đang xóa...', success: 'Xóa danh mục thành công!' },
      )
      await invalidate()
      setDeleting(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection).map(Number)
    if (!ids.length) return
    setBulkDeleting(true)
    try {
      await toastSmartPromise(
        bulkDeleteCategories(ids).then(unwrapApiResponse),
        { loading: 'Đang xóa nhiều danh mục...', success: 'Đã xóa các danh mục đã chọn!' },
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
        <title>Quản lý danh mục - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="category"
          title="Quản lý danh mục"
          description="Loại văn bản, lĩnh vực công tác dùng chung cho hệ thống"
          actions={
            <Button onClick={openCreate}>
              <span className="material-symbols-outlined text-base mr-1">add</span>
              Thêm danh mục
            </Button>
          }
        />

        <div className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
          {CATEGORY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                type === t.value
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

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
            data={categories ?? []}
            searchKey="tên danh mục"
            loading={isLoading}
            getRowId={(row) => row.id}
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
            <DialogDescription>
              Nhập thông tin danh mục. Các trường có dấu (*) là bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Loại danh mục</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setField('type', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-order">Thứ tự hiển thị</Label>
              <Input
                id="cat-order"
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
              <Label htmlFor="cat-code">
                Mã danh mục <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-code"
                placeholder="VD: THONG_BAO"
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
              />
              {errors.code ? (
                <p className="text-xs font-medium text-red-500">{errors.code}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">
                Tên danh mục <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="Tên hiển thị..."
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              {errors.name ? (
                <p className="text-xs font-medium text-red-500">{errors.name}</p>
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
        title="Xóa danh mục"
        description={
          <>
            Bạn có chắc chắn muốn xóa danh mục{' '}
            <span className="font-semibold text-foreground">{deleting?.name}</span>?
          </>
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Xóa nhiều danh mục"
        description={`Bạn có chắc chắn muốn xóa ${Object.keys(rowSelection).length} danh mục đã chọn? Hành động này không thể hoàn tác.`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}
