import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useGetCategories, useGetDocSources } from '@/api/generated'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DocumentVm } from '@/types/api'

export interface DocumentFormValues {
  docNumber: string
  title: string
  sourceId?: string
  docTypeId?: string
  issueDate?: string
  signer?: string
  filePath?: string
}

interface DocumentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: DocumentVm | null
  onSave: (values: DocumentFormValues) => Promise<void>
}

export function DocumentFormDialog({ open, onOpenChange, editing, onSave }: DocumentFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormValues>({
    defaultValues: {
      docNumber: '',
      title: '',
      sourceId: '',
      docTypeId: '',
      issueDate: '',
      signer: '',
      filePath: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!open) return
    reset({
      docNumber: editing?.docNumber ?? '',
      title: editing?.title ?? '',
      sourceId: editing?.sourceId != null ? String(editing.sourceId) : '',
      docTypeId: editing?.docTypeId != null ? String(editing.docTypeId) : '',
      issueDate: editing?.issueDate ?? '',
      signer: editing?.signer ?? '',
      filePath: editing?.filePath ?? '',
    })
  }, [open, editing, reset])

  const { data: sourceRaw } = useGetDocSources()
  const { data: typeRaw } = useGetCategories({ type: 'DOC_TYPE' })

  const sources = useMemo(
    () => (sourceRaw ? unwrapApiResponse<Array<{ id: number; name: string }>>(sourceRaw) : undefined),
    [sourceRaw],
  )
  const docTypes = useMemo(
    () => (typeRaw ? unwrapApiResponse<Array<{ id: number; name: string }>>(typeRaw) : undefined),
    [typeRaw],
  )

  const onSubmit = handleSubmit(async (values) => {
    await onSave(values)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Chỉnh sửa văn bản' : 'Thêm văn bản mới'}</DialogTitle>
          <DialogDescription>
            Nhập thông tin văn bản cần theo dõi. Các trường có dấu (*) là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="docNumber">
              Số văn bản <span className="text-red-500">*</span>
            </Label>
            <Input
              id="docNumber"
              placeholder="VD: 123/UBND-VP"
              {...register('docNumber', { required: 'Số văn bản không được để trống.' })}
            />
            {errors.docNumber ? (
              <p className="text-xs font-medium text-red-500">{errors.docNumber.message as string}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="issueDate">Ngày ban hành</Label>
            <Input id="issueDate" type="date" {...register('issueDate')} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">
              Trích yếu nội dung <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Trích yếu nội dung văn bản..."
              {...register('title', { required: 'Trích yếu không được để trống.' })}
            />
            {errors.title ? (
              <p className="text-xs font-medium text-red-500">{errors.title.message as string}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Nguồn ban hành</Label>
            <Select
              value={watch('sourceId') || ''}
              onValueChange={(v) => setValue('sourceId', v || '', { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nguồn ban hành" />
              </SelectTrigger>
              <SelectContent>
                {sources?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Loại văn bản</Label>
            <Select
              value={watch('docTypeId') || ''}
              onValueChange={(v) => setValue('docTypeId', v || '', { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại văn bản" />
              </SelectTrigger>
              <SelectContent>
                {docTypes?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signer">Người ký</Label>
            <Input id="signer" placeholder="Tên người ký..." {...register('signer')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filePath">Tệp đính kèm (đường dẫn)</Label>
            <Input id="filePath" placeholder="Link tệp văn bản..." {...register('filePath')} />
          </div>

          <DialogFooter className="sm:col-span-2 pt-2">
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
