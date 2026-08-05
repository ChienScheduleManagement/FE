import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  createDayOff,
  deleteDayOff,
  updateDayOff,
  useGetDayOffs,
} from '@/api/generated'
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
import type { DayOffVm } from '@/types/api'

const RECURRING_OPTIONS = [
  { value: 1, label: 'Một ngày cụ thể' },
  { value: 2, label: 'Lặp theo năm' },
  { value: 3, label: 'Lặp theo tuần' },
] as const

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Chủ nhật' },
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
] as const

interface FormValues {
  name: string
  symbol: string
  color: string
  recurringType: number
  date: string
  yearlyMonth: string
  yearlyDay: string
  weekDay: string
  displayOrder: string
  isActive: boolean
}

const EMPTY_FORM: FormValues = {
  name: '',
  symbol: 'Lễ',
  color: '#f87171',
  recurringType: 2,
  date: '',
  yearlyMonth: '',
  yearlyDay: '',
  weekDay: '0',
  displayOrder: '0',
  isActive: true,
}

export function DayOffsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DayOffVm | null>(null)
  const [deleting, setDeleting] = useState<DayOffVm | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { data: raw, isLoading, isError, error } = useGetDayOffs()

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const dayOffs = raw ? unwrapApiResponse<DayOffVm[]>(raw) : undefined

  const ruleSummary = (r: DayOffVm) => {
    if (r.recurringType === 1) return r.date ?? '—'
    if (r.recurringType === 2) return `${String(r.yearlyDay ?? '').padStart(2, '0')}/${String(r.yearlyMonth ?? '').padStart(2, '0')} hằng năm`
    return WEEKDAY_OPTIONS.find((w) => w.value === r.weekDay)?.label ?? '—'
  }

  const columns: ColumnDef<DayOffVm>[] = [
    selectColumn<DayOffVm>(),
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên ngày nghỉ" />,
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'rule',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quy tắc" />,
      cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-400">
          {RECURRING_OPTIONS.find((o) => o.value === row.original.recurringType)?.label}&nbsp;•&nbsp;
          <span className="font-medium">{ruleSummary(row.original)}</span>
        </span>
      ),
    },
    {
      accessorKey: 'symbol',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ký hiệu" />,
      cell: ({ row }) => (
        <span
          className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold"
          style={{ backgroundColor: `${row.original.color ?? '#94a3b8'}30`, color: row.original.color ?? undefined }}
        >
          {row.original.symbol}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
      cell: ({ row }) => (
        <span
          className={
            row.original.isActive
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 font-bold'
          }
        >
          {row.original.isActive ? 'Đang dùng' : 'Tắt'}
        </span>
      ),
      size: 100,
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
      size: 110,
    },
  ]

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/day-offs'] })
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, yearlyMonth: String(new Date().getMonth() + 1), yearlyDay: '1' })
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (d: DayOffVm) => {
    setEditing(d)
    setForm({
      name: d.name,
      symbol: d.symbol ?? '',
      color: d.color ?? '#f87171',
      recurringType: d.recurringType,
      date: d.date ?? '',
      yearlyMonth: d.yearlyMonth != null ? String(d.yearlyMonth) : '',
      yearlyDay: d.yearlyDay != null ? String(d.yearlyDay) : '',
      weekDay: d.weekDay != null ? String(d.weekDay) : '0',
      displayOrder: String(d.displayOrder),
      isActive: d.isActive,
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
    if (!form.name.trim()) nextErrors.name = 'Tên ngày nghỉ không được để trống.'
    if (form.recurringType === 1 && !form.date) nextErrors.date = 'Chọn ngày nghỉ cụ thể.'
    if (form.recurringType === 2 && (!form.yearlyMonth || !form.yearlyDay))
      nextErrors.yearlyMonth = 'Nhập đầy đủ tháng và ngày.'
    if (form.recurringType === 3 && form.weekDay === '') nextErrors.weekDay = 'Chọn ngày trong tuần.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        symbol: form.symbol || undefined,
        color: form.color || undefined,
        recurringType: form.recurringType,
        date: form.recurringType === 1 && form.date ? form.date : undefined,
        yearlyMonth: form.recurringType === 2 && form.yearlyMonth ? Number(form.yearlyMonth) : undefined,
        yearlyDay: form.recurringType === 2 && form.yearlyDay ? Number(form.yearlyDay) : undefined,
        weekDay: form.recurringType === 3 ? Number(form.weekDay) : undefined,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      }
      if (editing) {
        await toastSmartPromise(
          updateDayOff(editing.id, payload).then(unwrapApiResponse),
          { loading: 'Đang cập nhật...', success: 'Cập nhật ngày nghỉ thành công!' },
        )
      } else {
        await toastSmartPromise(
          createDayOff(payload).then(unwrapApiResponse),
          { loading: 'Đang thêm...', success: 'Thêm ngày nghỉ thành công!' },
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
        deleteDayOff(deleting.id).then(unwrapApiResponse),
        { loading: 'Đang xóa...', success: 'Đã xóa ngày nghỉ!' },
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
        Promise.all(ids.map((id) => deleteDayOff(id).then(unwrapApiResponse))),
        { loading: 'Đang xóa nhiều...', success: 'Đã xóa các ngày nghỉ đã chọn!' },
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
        <title>Lịch nghỉ - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="event_busy"
          title="Quản lý lịch nghỉ"
          description="Định nghĩa các ngày nghỉ của đơn vị: ngày lễ, cuối tuần... Admin có thể sửa/xóa thoải mái"
          actions={
            <Button onClick={openCreate}>
              <span className="material-symbols-outlined text-base mr-1">add</span>
              Thêm ngày nghỉ
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
            data={dayOffs ?? []}
            searchKey="ngày nghỉ, ký hiệu"
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
            <DialogTitle>{editing ? 'Chỉnh sửa ngày nghỉ' : 'Thêm ngày nghỉ mới'}</DialogTitle>
            <DialogDescription>
              Chọn loại lặp và nhập đầy đủ thông tin theo loại đó. Các ngày khớp sẽ được tô trên bảng chấm công.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="do-name">
                Tên ngày nghỉ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="do-name"
                placeholder="VD: Tết Nguyên đán, Chủ nhật..."
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              {errors.name ? <p className="text-xs font-medium text-red-500">{errors.name}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="do-type">Loại lặp</Label>
              <select
                id="do-type"
                value={String(form.recurringType)}
                onChange={(e) => setField('recurringType', Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {RECURRING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {form.recurringType === 1 ? (
              <div className="space-y-1.5">
                <Label htmlFor="do-date">
                  Ngày cụ thể <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="do-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                />
                {errors.date ? <p className="text-xs font-medium text-red-500">{errors.date}</p> : null}
              </div>
            ) : null}

            {form.recurringType === 2 ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="do-month">Tháng</Label>
                  <select
                    id="do-month"
                    value={form.yearlyMonth}
                    onChange={(e) => setField('yearlyMonth', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="do-day">Ngày</Label>
                  <select
                    id="do-day"
                    value={form.yearlyDay}
                    onChange={(e) => setField('yearlyDay', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Ngày {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
            {errors.yearlyMonth ? (
              <p className="text-xs font-medium text-red-500 sm:col-span-2">{errors.yearlyMonth}</p>
            ) : null}

            {form.recurringType === 3 ? (
              <div className="space-y-1.5">
                <Label htmlFor="do-weekday">
                  Ngày trong tuần <span className="text-red-500">*</span>
                </Label>
                <select
                  id="do-weekday"
                  value={form.weekDay}
                  onChange={(e) => setField('weekDay', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {WEEKDAY_OPTIONS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
                {errors.weekDay ? <p className="text-xs font-medium text-red-500">{errors.weekDay}</p> : null}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="do-symbol">Ký hiệu</Label>
                <Input
                  id="do-symbol"
                  placeholder="VD: Lễ, CN"
                  maxLength={10}
                  value={form.symbol}
                  onChange={(e) => setField('symbol', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="do-color">Màu</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="do-color"
                    type="color"
                    className="h-9 w-12 p-1"
                    value={form.color}
                    onChange={(e) => setField('color', e.target.value)}
                  />
                  <Input
                    className="h-9 font-mono text-xs"
                    value={form.color}
                    onChange={(e) => setField('color', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="do-order">Thứ tự hiển thị</Label>
              <Input
                id="do-order"
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) => setField('displayOrder', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="do-active">Trạng thái</Label>
              <select
                id="do-active"
                value={String(form.isActive)}
                onChange={(e) => setField('isActive', e.target.value === 'true')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="true">Đang dùng</option>
                <option value="false">Tắt</option>
              </select>
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
        title="Xóa ngày nghỉ"
        description={
          <>
            Bạn có chắc muốn xóa <span className="font-semibold text-foreground">{deleting?.name}</span>?
            Ngày này sẽ trở lại là ngày đi làm bình thường.
          </>
        }
        loading={deleteLoading}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Xóa nhiều ngày nghỉ"
        description={`Bạn có chắc muốn xóa ${Object.keys(rowSelection).length} ngày nghỉ đã chọn?`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}