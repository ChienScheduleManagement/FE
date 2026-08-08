import {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet-async'
import {useParams, useRouter} from '@tanstack/react-router'
import {useQueryClient} from '@tanstack/react-query'
import {
  useDeleteTasksById,
  useGetTasksById,
  useGetTasksByTaskidLogs,
  usePatchTasksByIdComplete,
  usePostTasksByTaskidLogs,
} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {showError, toastSmartPromise} from '@/api/utils'
import {formatDate, formatDateTime} from '@/lib/format'
import {APP_NAME} from '@/constants/ui'
import {DeadlineBadge, StatusBadge} from '@/components/StatusBadge'
import {EmptyState} from '@/components/EmptyState'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'

import {ConfirmDialog} from '@/components/ConfirmDialog'
import {RefreshButton} from '@/components/RefreshButton'
import {CompleteTaskDialog} from './components/CompleteTaskDialog'
import {getTaskStatusMeta, TASK_STATUS} from '@/constants/task'
import type {TaskItemVm, TaskLogVm} from '@/types/api'
import {BackButton} from '@/components/BackButton'

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3.5 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value || '—'}
      </p>
    </div>
  )
}

export function TaskDetailPage() {
  const { id } = useParams({ from: '/app-layout/tasks/$id' })
  const router = useRouter()
  const queryClient = useQueryClient()
  const [logNote, setLogNote] = useState('')
  const [completingTask, setCompletingTask] = useState<TaskItemVm | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: raw, isLoading, isError, error, refetch, isRefetching } = useGetTasksById(id)
  const { data: logsRaw, isLoading: logsLoading } = useGetTasksByTaskidLogs(id)
  const { mutateAsync: addTaskLog, isPending: logSubmitting } = usePostTasksByTaskidLogs()
  const { mutateAsync: completeTask } = usePatchTasksByIdComplete()
  const { mutateAsync: deleteTask, isPending: deleteLoading } = useDeleteTasksById()

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const task = raw ? unwrapApiResponse<TaskItemVm>(raw) : undefined
  const logs = logsRaw ? unwrapApiResponse<TaskLogVm[]>(logsRaw) : undefined

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] }),
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}`] }),
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}/logs`] }),
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] }),
    ])
  }

  const handleAddLog = async () => {
    const note = logNote.trim()
    if (!note) return
    try {
      await toastSmartPromise(
        addTaskLog({ taskId: id, data: { progressNote: note, updatedBy: undefined } }).then(unwrapApiResponse),
        { loading: 'Đang lưu nhật ký...', success: 'Đã cập nhật tiến độ!' },
      )
      setLogNote('')
      await invalidate()
    } catch {
    }
  }

  const handleComplete = async (latestResult: string) => {
    await toastSmartPromise(
      completeTask({
        id,
        data: {
          latestResult: latestResult || undefined,
          completedDate: toLocalDateString(new Date()),
        },
      }).then(unwrapApiResponse),
      { loading: 'Đang hoàn thành nhiệm vụ...', success: 'Nhiệm vụ đã hoàn thành!' },
    )
    setCompletingTask(null)
    await invalidate()
  }

  const handleDelete = async () => {
    try {
      await toastSmartPromise(deleteTask({ id }).then(unwrapApiResponse), {
        loading: 'Đang xóa nhiệm vụ...',
        success: 'Xóa nhiệm vụ thành công!',
      })
      await invalidate()
      await router.navigate({ to: '/tasks', replace: true })
      setDeleteOpen(false)
    } catch {
    }
  }

  const statusMeta = getTaskStatusMeta(task?.status)

  return (
    <>
      <Helmet>
        <title>Chi tiết nhiệm vụ - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton to="/tasks" label="Quay lại danh sách nhiệm vụ" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Chi tiết nhiệm vụ
              </p>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {isLoading ? 'Đang tải...' : task?.docNumber ?? 'Nhiệm vụ'}
                </h1>
                {task ? <StatusBadge status={task.status} /> : null}
              </div>
            </div>
          </div>

          {task ? (
            <div className="flex items-center gap-2">
              <RefreshButton onClick={() => refetch()} loading={isRefetching} />
              {task.status !== TASK_STATUS.COMPLETED ? (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setCompletingTask(task)}
                >
                  <span className="material-symbols-outlined text-base mr-1">check_circle</span>
                  Hoàn thành
                </Button>
              ) : null}
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <span className="material-symbols-outlined text-base mr-1">delete</span>
                Xóa
              </Button>
            </div>
          ) : null}
        </div>

        <phantom-ui loading={isLoading} animation="shimmer" reveal={0.1} class="block">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Thông tin nhiệm vụ</h2>
                  {task ? <DeadlineBadge status={task.deadlineStatus} /> : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {task?.taskContent ?? '—'}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <DetailItem label="Số văn bản" value={task?.docNumber} />
                  <DetailItem label="Trích yếu văn bản" value={task?.docTitle} />
                  <DetailItem label="Đơn vị chủ trì" value={task?.mainDepartmentName} />
                  <DetailItem
                    label="Đơn vị phối hợp"
                    value={task?.coDepartmentNames?.length ? task.coDepartmentNames.join(', ') : null}
                  />
                  <DetailItem label="CB phụ trách" value={task?.assigneeName} />
                  <DetailItem label="Hạn xử lý" value={task?.dueDate ? formatDateTime(task.dueDate) : null} />
                  <DetailItem
                    label="Ngày hoàn thành"
                    value={task?.completedDate ? formatDate(task.completedDate) : null}
                  />
                  <DetailItem label="Ngày giao" value={task?.createdAt ? formatDateTime(task.createdAt) : null} />
                </div>

                {task?.latestResult ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      Kết quả mới nhất
                    </p>
                    <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                      {task.latestResult}
                    </p>
                  </div>
                ) : null}
              </div>

              {task && task.status !== TASK_STATUS.COMPLETED ? (
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Cập nhật tiến độ</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Ghi nhận kết quả thực hiện vào nhật ký của nhiệm vụ
                  </p>
                  <div className="mt-4 space-y-3">
                    <Textarea
                      rows={3}
                      placeholder="Nội dung cập nhật tiến độ..."
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                    />
                    <Button
                      onClick={handleAddLog}
                      disabled={!logNote.trim() || logSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {logSubmitting ? (
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-base mr-1">history_edu</span>
                      )}
                      {logSubmitting ? 'Đang lưu...' : 'Ghi nhận tiến độ'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border bg-card shadow-sm">
              <div className="border-b p-5">
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Nhật ký tiến độ</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Lịch sử cập nhật của nhiệm vụ ({logs?.length ?? 0})
                </p>
              </div>

              <phantom-ui loading={logsLoading} animation="shimmer" reveal={0.1} class="block">
                {!logs?.length ? (
                  <EmptyState icon="history" title="Chưa có nhật ký" description="Chưa có cập nhật tiến độ nào cho nhiệm vụ này." />
                ) : (
                  <div className="max-h-[520px] overflow-y-auto p-5">
                    <ol className="relative ml-3 space-y-6 border-l border-slate-200 dark:border-slate-800">
                      {[...logs].reverse().map((log) => (
                        <li key={log.id} className="relative pl-6">
                          <span
                            className={`absolute -left-[7px] top-1.5 size-3.5 rounded-full border-2 border-card ${statusMeta.dot}`}
                          />
                          <div className="rounded-xl border bg-slate-50 p-3.5 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-muted-foreground">
                                {log.updatedBy ?? 'Hệ thống'}
                              </p>
                              <time className="text-xs text-muted-foreground">
                                {formatDateTime(log.logDate)}
                              </time>
                            </div>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                              {log.progressNote}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </phantom-ui>
            </div>
          </div>
        </phantom-ui>
      </div>

      <CompleteTaskDialog
        task={completingTask}
        onOpenChange={(open) => { if (!open) setCompletingTask(null) }}
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa nhiệm vụ"
        description="Bạn có chắc chắn muốn xóa nhiệm vụ này? Lịch sử cập nhật tiến độ cũng sẽ bị xóa."
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  )
}
