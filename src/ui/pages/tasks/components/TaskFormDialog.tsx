import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useGetDepartments, useGetDocuments } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { TASK_STATUSES } from '@/constants/task'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { cn } from '@/lib/utils'
import { toInputValue } from '@/lib/format'
import type { DocumentVm, PagedResponse, TaskItemVm } from '@/types/api'

export interface TaskFormValues {
  documentId: string
  taskContent: string
  mainDepartmentId: string
  coDepartmentIds: string[]
  assigneeName?: string
  dueDate?: string
  status?: string
  initialNote?: string
  latestResult?: string
}

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: TaskItemVm | null
  presetDocumentId?: string
  presetDocNumber?: string
  onSave: (values: TaskFormValues) => Promise<void>
}

export function TaskFormDialog({
  open,
  onOpenChange,
  editing,
  presetDocumentId,
  presetDocNumber,
  onSave,
}: TaskFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    defaultValues: {
      documentId: '',
      taskContent: '',
      mainDepartmentId: '',
      coDepartmentIds: [],
      assigneeName: '',
      dueDate: '',
      status: 'IN_PROGRESS',
      initialNote: '',
      latestResult: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!open) return
    reset({
      documentId: editing?.documentId ?? presetDocumentId ?? '',
      taskContent: editing?.taskContent ?? '',
      mainDepartmentId: editing?.mainDepartmentId != null ? String(editing.mainDepartmentId) : '',
      coDepartmentIds: editing?.coDepartmentIds
        ? editing.coDepartmentIds
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : [],
      assigneeName: editing?.assigneeName ?? '',
      dueDate: editing?.dueDate ? toInputValue(editing.dueDate) : '',
      status: editing?.status ?? 'IN_PROGRESS',
      initialNote: '',
      latestResult: editing?.latestResult ?? '',
    })
  }, [open, editing, presetDocumentId, reset])

  const { data: deptRaw } = useGetDepartments({ activeOnly: true })
  const { data: docRaw } = useGetDocuments({ Page: 1, PageSize: 100 })

  const departments = useMemo(
    () => (deptRaw ? unwrapApiResponse<Array<{ id: number; name: string }>>(deptRaw) : undefined),
    [deptRaw],
  )
  const documents = useMemo(
    () =>
      docRaw
        ? unwrapApiResponse<PagedResponse<DocumentVm>>(docRaw).items
        : undefined,
    [docRaw],
  )

  const coDepartmentIds = watch('coDepartmentIds')

  const toggleCoDepartment = (id: string) => {
    const next = coDepartmentIds.includes(id)
      ? coDepartmentIds.filter((v) => v !== id)
      : [...coDepartmentIds, id]
    setValue('coDepartmentIds', next, { shouldDirty: true })
  }

  const selectedDoc = documents?.find((d) => d.id === watch('documentId'))
  const docLabel = editing?.docNumber ?? presetDocNumber ?? selectedDoc?.docNumber ?? ''

  const [deptSearch, setDeptSearch] = useState('')
  const filteredDepartments = useMemo(() => {
    const q = deptSearch.trim().toLowerCase()
    return q
      ? (departments ?? []).filter((d) => d.name.toLowerCase().includes(q))
      : (departments ?? [])
  }, [departments, deptSearch])

  const onSubmit = handleSubmit(async (values) => {
    await onSave(values)
    if (editing) {
      onOpenChange(false)
    } else {
      reset({
        documentId: presetDocumentId ?? '',
        taskContent: '',
        mainDepartmentId: '',
        coDepartmentIds: [],
        assigneeName: '',
        dueDate: '',
        status: 'IN_PROGRESS',
        initialNote: '',
        latestResult: '',
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}</DialogTitle>
          <DialogDescription>
            Phân công nhiệm vụ cho đơn vị chủ trì và đơn vị phối hợp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" {...register('documentId', { required: 'Vui lòng chọn văn bản liên quan.' })} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                Văn bản liên quan <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                id="documentId"
                value={watch('documentId') || ''}
                onValueChange={(v) => setValue('documentId', v, { shouldDirty: true })}
                items={(documents ?? []).map((d) => ({
                  value: d.id,
                  label: `${d.docNumber} - ${d.title}`,
                }))}
                placeholder="Tìm hoặc chọn văn bản..."
                triggerClassName={docLabel ? '' : 'text-muted-foreground'}
              />
              {presetDocNumber && !editing ? (
                <p className="text-xs text-muted-foreground">
                  Văn bản: <span className="font-medium text-foreground">{presetDocNumber}</span>
                </p>
              ) : null}
              {errors.documentId ? (
                <p className="text-xs font-medium text-red-500">
                  {errors.documentId.message as string}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="taskContent">
                Nội dung nhiệm vụ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="taskContent"
                rows={3}
                placeholder="Mô tả nội dung nhiệm vụ cần thực hiện..."
                {...register('taskContent', {
                  required: 'Nội dung nhiệm vụ không được để trống.',
                })}
              />
              {errors.taskContent ? (
                <p className="text-xs font-medium text-red-500">
                  {errors.taskContent.message as string}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>
                Đơn vị chủ trì <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                id="mainDepartmentId"
                value={watch('mainDepartmentId') || ''}
                onValueChange={(v) => setValue('mainDepartmentId', v, { shouldDirty: true })}
                items={(departments ?? []).map((d) => ({
                  value: String(d.id),
                  label: d.name,
                }))}
                placeholder="Tìm hoặc chọn đơn vị..."
              />
              {errors.mainDepartmentId ? (
                <p className="text-xs font-medium text-red-500">
                  {errors.mainDepartmentId.message as string}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assigneeName">CB phụ trách</Label>
              <Input
                id="assigneeName"
                placeholder="Tên cán bộ phụ trách..."
                {...register('assigneeName')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Hạn xử lý</Label>
              <DateTimePicker
                id="dueDate"
                value={watch('dueDate')}
                withTime
                placeholder="Chọn ngày và giờ..."
                onChange={(v) => setValue('dueDate', v, { shouldDirty: true })}
              />
            </div>

            {editing ? (
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select
                  value={watch('status') || ''}
                  onValueChange={(v) => setValue('status', v, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === 'PENDING'
                          ? 'Mới nhận'
                          : s === 'IN_PROGRESS'
                            ? 'Đang thực hiện'
                            : s === 'COMPLETED'
                              ? 'Đã hoàn thành'
                              : 'Đã hủy'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Đơn vị phối hợp</Label>
            {departments?.length ? (
              <>
                <Input
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Tìm đơn vị phối hợp..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault()
                  }}
                />
                {filteredDepartments.length ? (
                  <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-lg border p-2.5">
                    {filteredDepartments.map((d) => {
                      const selected = coDepartmentIds.includes(String(d.id))
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleCoDepartment(String(d.id))}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-slate-200 text-muted-foreground hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800',
                          )}
                        >
                          {d.name}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Không tìm thấy đơn vị phù hợp
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Chưa có dữ liệu phòng ban</p>
            )}
          </div>

          {!editing ? (
            <div className="space-y-1.5">
              <Label htmlFor="initialNote">Ghi chú ban đầu</Label>
              <Textarea
                id="initialNote"
                rows={2}
                placeholder="Ghi chú khi giao nhiệm vụ (sẽ lưu vào nhật ký tiến độ)..."
                {...register('initialNote')}
              />
            </div>
          ) : null}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-base mr-1">save</span>
              )}
              {isSubmitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
