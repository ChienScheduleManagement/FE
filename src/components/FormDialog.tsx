import type { ReactNode } from 'react'
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

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  editing?: boolean
  loading?: boolean
  onSave: () => void
  saveText?: string
  saveIcon?: string
  cancelText?: string
  maxWidth?: string
  children: ReactNode
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  editing = false,
  loading = false,
  onSave,
  saveText,
  saveIcon = 'save',
  cancelText = 'Hủy',
  maxWidth = 'max-w-2xl',
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={maxWidth}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button onClick={onSave} disabled={loading}>
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base mr-1">{saveIcon}</span>
            )}
            {loading ? 'Đang lưu...' : saveText ?? (editing ? 'Cập nhật' : 'Thêm mới')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface FormFieldProps {
  label?: ReactNode
  htmlFor?: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, required, error, className, children }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  )
}
