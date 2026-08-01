import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TaskItemVm } from '@/types/api'

interface CompleteTaskDialogProps {
  task: TaskItemVm | null
  onOpenChange: (open: boolean) => void
  onConfirm: (latestResult: string) => Promise<void>
}

export function CompleteTaskDialog({ task, onOpenChange, onConfirm }: CompleteTaskDialogProps) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (task) setNote('')
  }, [task])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onConfirm(note.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
            Hoàn thành nhiệm vụ
          </DialogTitle>
          <DialogDescription className="line-clamp-2 pt-1">{task?.taskContent}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900">
          <span className="text-muted-foreground">Hạn xử lý:</span>
          <span className="font-semibold">{formatDate(task?.dueDate)}</span>
          <span className="text-muted-foreground">Đơn vị:</span>
          <span className="font-semibold">{task?.mainDepartmentName ?? '—'}</span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="complete-note">Kết quả thực hiện</Label>
          <Textarea
            id="complete-note"
            rows={3}
            placeholder="Mô tả kết quả đã thực hiện (sẽ được lưu vào nhật ký tiến độ)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base mr-1">task_alt</span>
            )}
            {submitting ? 'Đang lưu...' : 'Xác nhận hoàn thành'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
