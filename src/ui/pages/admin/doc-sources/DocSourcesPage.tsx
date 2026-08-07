import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { bulkDeleteDocSources, createDocSource, deleteDocSource, updateDocSource, useGetDocSources } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, toastSmartPromise } from '@/api/utils'
import { APP_NAME } from '@/constants/ui'
import { DOC_SOURCE_LEVEL, DOC_SOURCE_LEVELS, type DocSourceLevel } from '@/constants/task'
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
import type { DocSourceVm } from '@/types/api'

interface FormValues {
  code: string
  name: string
  level: DocSourceLevel
  displayOrder: string
}

const EMPTY_FORM: FormValues = { code: '', name: '', level: DOC_SOURCE_LEVEL.COMMUNE, displayOrder: '0' }

export function DocSourcesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DocSourceVm | null>(null)
  const [deleting, setDeleting] = useState<DocSourceVm | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { data: raw, isLoading, isError, error } = useGetDocSources()

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const sources = raw ? unwrapApiResponse<DocSourceVm[]>(raw) : undefined

  const columns: ColumnDef<DocSourceVm>[] = [
    selectColumn<DocSourceVm>(),
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên nguồn ban hành" />,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'level',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cấp" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {levelLabel(row.original.level)}
        </span>
      ),
      size: 140,
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
    await queryClient.invalidateQueries({ queryKey: ['/api/doc-sources'] })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (source: DocSourceVm) => {
    setEditing(source)
    setForm({
      code: source.code,
      name: source.name,
      level: source.level as DocSourceLevel,
      displayOrder: String(source.displayOrder),
    })
    setErrors({})
    setDialogOpen(true)
  }

  const setField = (key: keyof FormValues, value: string) => {
    setForm((prev) => {
      if (key === 'level') return { ...prev, level: Number(value) as DocSourceLevel }
      return { ...prev, [key]: value }
    })
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSave = async () => {
    const nextErrors: typeof errors = {}
    if (!form.code.trim()) nextErrors.code = 'Mã nguồn không được để trống.'
    if (!form.name.trim()) nextErrors.name = 'Tên nguồn không được để trống.'
    if (Number(form.displayOrder) < 0) nextErrors.displayOrder = 'Độ ưu tiên không được âm.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await toastSmartPromise(
          updateDocSource(editing.id, {
            code: form.code,
            name: form.name,
            level: form.level,
            displayOrder: Number(form.displayOrder) || 0,
          }).then(unwrapApiResponse),
          { loading: 'Đang cập nhật...', success: 'Cập nhật nguồn văn bản thành công!' },
        )
      } else {
        await toastSmartPromise(
          createDocSource({
            code: form.code,
            name: form.name,
            level: form.level,
            displayOrder: Number(form.displayOrder) || 0,
          }).then(unwrapApiResponse),
          { loading: 'Đang thêm...', success: 'Thêm nguồn văn bản thành công!' },
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
        deleteDocSource(deleting.id).then(unwrapApiResponse),
        { loading: 'Đang xóa...', success: 'Xóa nguồn văn bản thành công!' },
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
        bulkDeleteDocSources(ids).then(unwrapApiResponse),
        { loading: 'Đang xóa nhiều nguồn...', success: 'Đã xóa các nguồn văn bản đã chọn!' },
      )
      await invalidate()
      setBulkDeleteOpen(false)
      setRowSelection({})
    } finally {
      setBulkDeleting(false)
    }
  }

  const levelLabel = (level: number) =>
    DOC_SOURCE_LEVELS.find((l) => l.value === level)?.label ?? 'Không xác định'

  return (
    <>
      <Helmet>
        <title>Quản lý nguồn văn bản - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="import_contacts"
          title="Quản lý nguồn văn bản"
          description="Các cơ quan ban hành văn bản (tỉnh, huyện, xã...)"
          actions={
            <Button onClick={openCreate}>
              <span className="material-symbols-outlined text-base mr-1">add</span>
              Thêm nguồn
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
            data={sources ?? []}
            searchKey="tên nguồn"
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
            <DialogTitle>{editing ? 'Chỉnh sửa nguồn văn bản' : 'Thêm nguồn văn bản mới'}</DialogTitle>
            <DialogDescription>
              Nhập thông tin cơ quan ban hành. Các trường có dấu (*) là bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="src-code">
                Mã nguồn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="src-code"
                placeholder="VD: UBND-HUYEN"
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
              />
              {errors.code ? (
                <p className="text-xs font-medium text-red-500">{errors.code}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Cấp ban hành</Label>
              <Select value={String(form.level)} onValueChange={(v) => setField('level', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_SOURCE_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={String(l.value)}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="src-name">
                Tên nguồn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="src-name"
                placeholder="Tên cơ quan ban hành..."
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              {errors.name ? (
                <p className="text-xs font-medium text-red-500">{errors.name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="src-order">Thứ tự hiển thị</Label>
              <Input
                id="src-order"
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) => setField('displayOrder', e.target.value)}
              />
              {errors.displayOrder ? (
                <p className="text-xs font-medium text-red-500">{errors.displayOrder}</p>
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
        title="Xóa nguồn văn bản"
        description={
          <>
            Bạn có chắc chắn muốn xóa nguồn{' '}
            <span className="font-semibold text-foreground">{deleting?.name}</span>?
          </>
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Xóa nhiều nguồn văn bản"
        description={`Bạn có chắc chắn muốn xóa ${Object.keys(rowSelection).length} nguồn văn bản đã chọn? Hành động này không thể hoàn tác.`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}
