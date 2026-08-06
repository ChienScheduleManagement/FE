import { useState } from 'react'
import {
  createEmploymentHistories,
  deleteEmploymentHistories,
  updateEmploymentHistories,
  useGetDepartments,
  useGETEmploymentHistoriesEmployeeEmployeeId,
  useGetPositions,
} from '@/api/generated'
import { showError, toastSmartPromise } from '@/api/utils'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TooltipButton } from '@/components/TooltipButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { unwrapApiResponse } from '@/lib/apiHandler'
import type { DepartmentVm, EmployeeVm, EmploymentHistoryVm, PositionVm } from '@/types/api'

interface Props {
  employee: EmployeeVm | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormState {
  departmentId: string
  positionId: string
  effectiveFrom: string
  effectiveTo: string
  reason: string
}

const EMPTY_FORM: FormState = {
  departmentId: '',
  positionId: '',
  effectiveFrom: '',
  effectiveTo: '',
  reason: '',
}

export function EmploymentHistoryDialog({ employee, open, onOpenChange }: Props) {
  const employeeId = employee?.id ?? ''
  const [formOpen, setFormOpen] = useState(false)
  const [editingHistory, setEditingHistory] = useState<EmploymentHistoryVm | null>(null)
  const [deletingHistory, setDeletingHistory] = useState<EmploymentHistoryVm | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const {
    data: historyRaw,
    isLoading,
    refetch,
  } = useGETEmploymentHistoriesEmployeeEmployeeId(employeeId, {
    query: { enabled: open && !!employeeId },
  })

  const { data: deptRaw } = useGetDepartments()
  const { data: posRaw } = useGetPositions()

  const histories = historyRaw ? unwrapApiResponse<EmploymentHistoryVm[]>(historyRaw) : []
  const departments = deptRaw ? unwrapApiResponse<DepartmentVm[]>(deptRaw) : []
  const positions = posRaw ? unwrapApiResponse<PositionVm[]>(posRaw) : []

  const openCreate = () => {
    setEditingHistory(null)
    setForm({
      departmentId: employee?.departmentId ? String(employee.departmentId) : '',
      positionId: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      reason: '',
    })
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (h: EmploymentHistoryVm) => {
    setEditingHistory(h)
    setForm({
      departmentId: String(h.departmentId),
      positionId: h.positionId ? String(h.positionId) : '',
      effectiveFrom: h.effectiveFrom ? h.effectiveFrom.split('T')[0] : '',
      effectiveTo: h.effectiveTo ? h.effectiveTo.split('T')[0] : '',
      reason: h.reason ?? '',
    })
    setErrors({})
    setFormOpen(true)
  }

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.departmentId) errs.departmentId = 'Vui lòng chọn đơn vị'
    if (!form.effectiveFrom) errs.effectiveFrom = 'Vui lòng nhập Từ ngày'
    if (form.effectiveFrom && form.effectiveTo && form.effectiveTo < form.effectiveFrom) {
      errs.effectiveTo = 'Đến ngày phải lớn hơn hoặc bằng Từ ngày'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || saving) return
    setSaving(true)

    try {
      if (editingHistory) {
        await toastSmartPromise(
          updateEmploymentHistories(editingHistory.id, {
            departmentId: Number(form.departmentId),
            positionId: form.positionId ? Number(form.positionId) : undefined,
            effectiveFrom: form.effectiveFrom,
            effectiveTo: form.effectiveTo ? form.effectiveTo : null,
            reason: form.reason || undefined,
          }).then(unwrapApiResponse),
          { loading: 'Đang lưu...', success: 'Cập nhật lịch sử công tác thành công!' },
        )
      } else {
        await toastSmartPromise(
          createEmploymentHistories({
            employeeId,
            departmentId: Number(form.departmentId),
            positionId: form.positionId ? Number(form.positionId) : undefined,
            effectiveFrom: form.effectiveFrom,
            effectiveTo: form.effectiveTo ? form.effectiveTo : undefined,
            reason: form.reason || undefined,
          }).then(unwrapApiResponse),
          { loading: 'Đang tạo mới...', success: 'Thêm lịch sử công tác thành công!' },
        )
      }
      setFormOpen(false)
      await refetch()
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingHistory || deleting) return
    setDeleting(true)
    try {
      await toastSmartPromise(
        deleteEmploymentHistories(deletingHistory.id).then(unwrapApiResponse),
        { loading: 'Đang xóa...', success: 'Xóa lịch sử công tác thành công!' },
      )
      setDeletingHistory(null)
      await refetch()
    } catch (err) {
      showError(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history_edu</span>
              Quá trình công tác - {employee?.fullName} ({employee?.employeeCode})
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Quản lý lịch sử luân chuyển phòng ban, bổ nhiệm chức vụ và theo dõi timeline công tác.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center my-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Danh sách mốc lịch sử ({histories.length})
            </div>
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <span className="material-symbols-outlined text-base">add</span>
              Thêm mốc quá trình
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-slate-400">Đang tải lịch sử công tác...</div>
            ) : histories.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 border border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                Chưa có dữ liệu quá trình công tác nào.
              </div>
            ) : (
              <div className="space-y-3">
                {histories.map((h) => {
                  const isCurrent = !h.effectiveTo
                  return (
                    <div
                      key={h.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCurrent
                          ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                            {h.departmentName}
                          </span>
                          {h.positionName && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              {h.positionName}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                              Hiện tại
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <span className="material-symbols-outlined text-sm">calendar_month</span>
                          <span>
                            Từ ngày: <strong className="text-slate-900 dark:text-slate-200">{h.effectiveFrom}</strong>
                          </span>
                          <span>—</span>
                          <span>
                            Đến ngày:{' '}
                            <strong className="text-slate-900 dark:text-slate-200">
                              {h.effectiveTo ? h.effectiveTo : 'Hiện nay'}
                            </strong>
                          </span>
                        </div>

                        {h.reason && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Lý do / Ghi chú: {h.reason}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 self-end md:self-center">
                        <TooltipButton variant="outline" size="sm" label="Chỉnh sửa" onClick={() => openEdit(h)}>
                          <span className="material-symbols-outlined text-base">edit</span>
                        </TooltipButton>
                        <TooltipButton
                          variant="ghost"
                          size="sm"
                          label="Xóa"
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          onClick={() => setDeletingHistory(h)}
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </TooltipButton>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Thêm mới / Chỉnh sửa mốc lịch sử */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {editingHistory ? 'Chỉnh sửa mốc quá trình công tác' : 'Thêm mốc quá trình công tác'}
              </DialogTitle>
              <DialogDescription>
                Nhập phòng ban, chức vụ và khoảng thời gian hiệu lực cho cán bộ.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="hist-dept">
                  Đơn vị / Phòng ban <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, departmentId: v }))}
                >
                  <SelectTrigger id="hist-dept">
                    <SelectValue placeholder="Chọn đơn vị công tác" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hist-pos">Chức vụ</Label>
                <Select
                  value={form.positionId}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, positionId: v }))}
                >
                  <SelectTrigger id="hist-pos">
                    <SelectValue placeholder="Chọn chức vụ (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hist-from">
                    Từ ngày <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hist-from"
                    type="date"
                    value={form.effectiveFrom}
                    onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                  />
                  {errors.effectiveFrom && <p className="text-xs text-red-500">{errors.effectiveFrom}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hist-to">Đến ngày (để trống nếu đến nay)</Label>
                  <Input
                    id="hist-to"
                    type="date"
                    value={form.effectiveTo}
                    onChange={(e) => setForm((prev) => ({ ...prev, effectiveTo: e.target.value }))}
                  />
                  {errors.effectiveTo && <p className="text-xs text-red-500">{errors.effectiveTo}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hist-reason">Lý do / Quyết định điều động</Label>
                <Input
                  id="hist-reason"
                  placeholder="VD: Quyết định bổ nhiệm số 123/QĐ-UBND..."
                  value={form.reason}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu lại'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deletingHistory}
        onOpenChange={(o) => !o && setDeletingHistory(null)}
        title="Xác nhận xóa mốc quá trình công tác"
        description={`Bạn có chắc chắn muốn xóa mốc công tác tại đơn vị "${deletingHistory?.departmentName}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa mốc"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
