import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGetCategories, useGetDepartments, useGetDocSources } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
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
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CATEGORY_TYPE } from '@/constants/task'
import {
  documentTaskFormSchema,
  type DocumentTaskFormValues,
} from '@/schemas/documentTask.schema'

interface DocumentTaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: DocumentTaskFormValues) => Promise<void>
}

export function DocumentTaskFormDialog({
  open,
  onOpenChange,
  onSave,
}: DocumentTaskFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DocumentTaskFormValues>({
    defaultValues: {
      docNumber: '',
      title: '',
      sourceId: '',
      docTypeId: '',
      issueDate: '',
      taskContent: '',
      mainDepartmentId: '',
      assigneeName: '',
      dueDate: '',
    },
    mode: 'onChange',
    resolver: zodResolver(documentTaskFormSchema),
  })

  useEffect(() => {
    if (!open) return
    reset({
      docNumber: '',
      title: '',
      sourceId: '',
      docTypeId: '',
      issueDate: '',
      taskContent: '',
      mainDepartmentId: '',
      assigneeName: '',
      dueDate: '',
    })
  }, [open, reset])

  const { data: sourceRaw } = useGetDocSources()
  const { data: typeRaw } = useGetCategories({ type: CATEGORY_TYPE.DOC_TYPE })
  const { data: deptRaw } = useGetDepartments({ activeOnly: true })

  const sources = useMemo(
    () =>
      sourceRaw
        ? unwrapApiResponse<Array<{ id: number; name: string }>>(sourceRaw)
        : undefined,
    [sourceRaw],
  )
  const docTypes = useMemo(
    () =>
      typeRaw
        ? unwrapApiResponse<Array<{ id: number; name: string }>>(typeRaw)
        : undefined,
    [typeRaw],
  )
  const departments = useMemo(
    () => (deptRaw ? unwrapApiResponse<Array<{ id: number; name: string }>>(deptRaw) : undefined),
    [deptRaw],
  )

  const onSubmit = handleSubmit(async (values) => {
    await onSave(values)
    reset({
      docNumber: '',
      title: '',
      sourceId: '',
      docTypeId: '',
      issueDate: '',
      taskContent: '',
      mainDepartmentId: '',
      assigneeName: '',
      dueDate: '',
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Thêm văn bản mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin văn bản và tạo nhiệm vụ đầu tiên phát sinh từ văn
            bản. Các trường có dấu (*) là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 rounded-xl border p-4">
            <p className="text-sm font-semibold text-foreground">
              Thông tin văn bản
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="docNumber">
                  Số văn bản <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="docNumber"
                  placeholder="VD: 123/UBND-VP"
                  {...register('docNumber')}
                />
                {errors.docNumber ? (
                  <p className="text-xs font-medium text-red-500">
                    {errors.docNumber.message as string}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="issueDate">Ngày ban hành</Label>
                <DateTimePicker
                  id="issueDate"
                  value={watch('issueDate')}
                  placeholder="Chọn ngày..."
                  onChange={(v) => setValue('issueDate', v, { shouldDirty: true })}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">
                  Trích yếu nội dung <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="title"
                  rows={3}
                  placeholder="Trích yếu nội dung văn bản..."
                  {...register('title')}
                />
                {errors.title ? (
                  <p className="text-xs font-medium text-red-500">
                    {errors.title.message as string}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>Nguồn ban hành</Label>
                <SearchableSelect
                  id="sourceId"
                  value={watch('sourceId') || ''}
                  onValueChange={(v) => setValue('sourceId', v || '', { shouldDirty: true })}
                  items={(sources ?? []).map((s) => ({
                    value: String(s.id),
                    label: s.name,
                  }))}
                  placeholder="Tìm hoặc chọn nguồn..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Loại văn bản</Label>
                <SearchableSelect
                  id="docTypeId"
                  value={watch('docTypeId') || ''}
                  onValueChange={(v) => setValue('docTypeId', v || '', { shouldDirty: true })}
                  items={(docTypes ?? []).map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  }))}
                  placeholder="Tìm hoặc chọn loại văn bản..."
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border p-4">
            <p className="text-sm font-semibold text-foreground">
              Nhiệm vụ phát sinh{' '}
              <span className="font-normal text-muted-foreground">
                (tùy chọn — nếu tạo nhiệm vụ cần điền nội dung và đơn vị chủ trì)
              </span>
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="taskContent">Nội dung nhiệm vụ</Label>
                <Textarea
                  id="taskContent"
                  rows={3}
                  placeholder="Mô tả nội dung nhiệm vụ cần thực hiện..."
                  {...register('taskContent')}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Đơn vị chủ trì</Label>
                <SearchableSelect
                  id="mainDepartmentId"
                  value={watch('mainDepartmentId') || ''}
                  onValueChange={(v) => setValue('mainDepartmentId', v || '', { shouldDirty: true })}
                  items={(departments ?? []).map((d) => ({
                    value: String(d.id),
                    label: d.name,
                  }))}
                  placeholder="Tìm hoặc chọn đơn vị..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assigneeName">CB phụ trách</Label>
                <Input
                  id="assigneeName"
                  placeholder="Tên cán bộ phụ trách..."
                  {...register('assigneeName')}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dueDate">Hạn xử lý</Label>
                <DateTimePicker
                  id="dueDate"
                  value={watch('dueDate')}
                  withTime
                  placeholder="Chọn ngày và giờ..."
                  onChange={(v) => setValue('dueDate', v, { shouldDirty: true })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-base">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-base mr-1">save</span>
              )}
              {isSubmitting ? 'Đang lưu...' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
