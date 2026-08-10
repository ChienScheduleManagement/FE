import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {useQueryClient} from '@tanstack/react-query'
import {
  useCreateSalaryHistories,
  useDeleteSalaryHistoriesById,
  useGetSalaryHistories,
  useUpdateSalaryHistoriesById,
} from '@/api/generated'
import {showError, toastSmartPromise} from '@/api/utils'
import {ConfirmDialog} from '@/components/ConfirmDialog'
import {ErrorState} from '@/components/ErrorState'
import {TooltipButton} from '@/components/TooltipButton'
import {DateTimePicker} from '@/components/ui/date-time-picker'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {
  salaryHistoryFormSchema,
  type SalaryHistoryFormValues,
} from '@/schemas/employee.schema'
import type {EmployeeVm, SalaryHistoryVm} from '@/types/api'

interface Props {
  employee: EmployeeVm | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_FORM: SalaryHistoryFormValues = {
  salaryCoefficient: '2.34',
  allowance: '0',
  effectiveFrom: '',
  effectiveTo: '',
  reason: '',
}

export function SalaryHistoryDialog({ employee, open, onOpenChange }: Props) {
  const employeeId = employee?.id ?? ''
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingHistory, setEditingHistory] = useState<SalaryHistoryVm | null>(null)
  const [deletingHistory, setDeletingHistory] = useState<SalaryHistoryVm | null>(null)
  const [deleting, setDeleting] = useState(false)
  const form = useForm<SalaryHistoryFormValues>({
    resolver: zodResolver(salaryHistoryFormSchema),
    defaultValues: EMPTY_FORM,
  })

  const {
    data: historyRaw,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSalaryHistories(
    { employeeId },
    { query: { enabled: open && !!employeeId } },
  )

  const histories = historyRaw ? unwrapApiResponse<SalaryHistoryVm[]>(historyRaw) : []

  const openCreate = () => {
    setEditingHistory(null)
    form.reset({
      ...EMPTY_FORM,
      effectiveFrom: new Date().toISOString().split('T')[0],
    })
    setFormOpen(true)
  }

  const openEdit = (h: SalaryHistoryVm) => {
    setEditingHistory(h)
    form.reset({
      salaryCoefficient: String(h.salaryCoefficient),
      allowance: String(h.allowance),
      effectiveFrom: h.effectiveFrom ? h.effectiveFrom.split('T')[0] : '',
      effectiveTo: h.effectiveTo ? h.effectiveTo.split('T')[0] : '',
      reason: h.reason ?? '',
    })
    setFormOpen(true)
  }

  const { mutateAsync: createHistory, isPending: creating } = useCreateSalaryHistories()
  const { mutateAsync: updateHistory, isPending: updating } = useUpdateSalaryHistoriesById()
  const { mutateAsync: deleteHistory } = useDeleteSalaryHistoriesById()
  const isSaving = creating || updating

  const onSubmit = async (values: SalaryHistoryFormValues) => {
    const payload = {
      salaryCoefficient: Number(values.salaryCoefficient),
      allowance: Number(values.allowance),
      effectiveFrom: values.effectiveFrom,
      effectiveTo: values.effectiveTo ? values.effectiveTo : null,
      reason: values.reason || null,
    }
    try {
      if (editingHistory) {
        await toastSmartPromise(
          updateHistory({ id: editingHistory.id, data: payload }),
          { loading: 'Đang lưu...', success: 'Cập nhật mốc hệ số lương thành công!' },
        )
      } else {
        await toastSmartPromise(
          createHistory({ data: { employeeId, ...payload } }),
          { loading: 'Đang tạo mới...', success: 'Thêm mốc hệ số lương thành công!' },
        )
      }
      setFormOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['/api/salary-histories'] })
      await refetch()
    } catch (err) {
      showError(err)
    }
  }

  const handleDelete = async () => {
    if (!deletingHistory || deleting) return
    setDeleting(true)
    try {
      await toastSmartPromise(
        deleteHistory({ id: deletingHistory.id }),
        { loading: 'Đang xóa...', success: 'Xóa mốc hệ số lương thành công!' },
      )
      setDeletingHistory(null)
      await refetch()
    } catch (err) {
      showError(err)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (d?: string | null) => {
    if (!d) return '—'
    const date = new Date(d)
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Hệ số lương - {employee?.fullName} ({employee?.employeeCode})
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Quản lý hệ số lương và phụ cấp theo thời điểm. Mốc mới nhất có hiệu lực sẽ được dùng để tính lương.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center my-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Danh sách mốc hệ số lương ({histories.length})
            </div>
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <span className="material-symbols-outlined text-base">add</span>
              Thêm mốc hệ số
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <phantom-ui loading={isLoading} animation="shimmer" reveal={0.1} class="block">
              {isLoading ? (
                [0, 1, 2].map((v) => (
                  <div
                    key={`salary-placeholder-row-${v}`}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                          Hệ số 2,34
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                          Phụ cấp 500.000đ
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>Từ ngày: 01/01/2026 — Đến ngày: Hiện nay</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : isError ? (
                <ErrorState error={error} title="Không tải được lịch sử lương" />
              ) : histories.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 border border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                  Chưa có dữ liệu hệ số lương nào.
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
                              Hệ số {h.salaryCoefficient.toLocaleString('vi-VN')}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                              Phụ cấp {h.allowance.toLocaleString('vi-VN')}đ
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                                Hiện tại
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            <span>
                              Từ ngày: <strong className="text-slate-900 dark:text-slate-200">{formatDate(h.effectiveFrom)}</strong>
                            </span>
                            <span>—</span>
                            <span>
                              Đến ngày:{' '}
                              <strong className="text-slate-900 dark:text-slate-200">
                                {h.effectiveTo ? formatDate(h.effectiveTo) : 'Hiện nay'}
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
            </phantom-ui>
          </div>

          <DialogFooter className="pt-4 border-t mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Thêm mới / Chỉnh sửa mốc hệ số lương */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {editingHistory ? 'Chỉnh sửa mốc hệ số lương' : 'Thêm mốc hệ số lương'}
              </DialogTitle>
              <DialogDescription>
                Nhập hệ số lương, phụ cấp và khoảng thời gian hiệu lực cho cán bộ.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="salary-coef">
                    Hệ số lương <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="salary-coef"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="VD: 2.34"
                    {...form.register('salaryCoefficient')}
                  />
                  {form.formState.errors.salaryCoefficient && (
                    <p className="text-xs text-red-500">{form.formState.errors.salaryCoefficient.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="salary-allow">Phụ cấp</Label>
                  <Input
                    id="salary-allow"
                    type="number"
                    min={0}
                    step={100000}
                    placeholder="1500000"
                    {...form.register('allowance')}
                  />
                  {form.formState.errors.allowance && (
                    <p className="text-xs text-red-500">{form.formState.errors.allowance.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="salary-from">
                    Từ ngày <span className="text-red-500">*</span>
                  </Label>
                  <DateTimePicker
                    id="salary-from"
                    value={form.watch('effectiveFrom')}
                    placeholder="Chọn ngày..."
                    onChange={(v) => form.setValue('effectiveFrom', v)}
                  />
                  {form.formState.errors.effectiveFrom && (
                    <p className="text-xs text-red-500">{form.formState.errors.effectiveFrom.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="salary-to">Đến ngày (để trống nếu đến nay)</Label>
                  <DateTimePicker
                    id="salary-to"
                    value={form.watch('effectiveTo')}
                    placeholder="Chọn ngày..."
                    onChange={(v) => form.setValue('effectiveTo', v)}
                  />
                  {form.formState.errors.effectiveTo && (
                    <p className="text-xs text-red-500">{form.formState.errors.effectiveTo.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="salary-reason">Lý do / Ghi chú</Label>
                <Input
                  id="salary-reason"
                  placeholder="VD: Nâng lương thường xuyên, Quyết định số 123..."
                  {...form.register('reason')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu lại'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deletingHistory}
        onOpenChange={(o) => !o && setDeletingHistory(null)}
        title="Xác nhận xóa mốc hệ số lương"
        description={`Bạn có chắc chắn muốn xóa mốc hệ số ${deletingHistory?.salaryCoefficient ?? ''} của cán bộ này không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa mốc"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
