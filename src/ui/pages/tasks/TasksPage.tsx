import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, PaginationState } from '@tanstack/react-table'
import {
  completeTaskById,
  createTask,
  deleteTask,
  exportTasks,
  updateTask,
  useGetDepartments,
  useGetTasks,
} from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError, showSuccess, toastSmartPromise } from '@/api/utils'
import { formatDateTime, toUtcIso } from '@/lib/format'
import { APP_NAME } from '@/constants/ui'
import { DEFAULT_PAGE_SIZE, TASK_TABS } from '@/constants/task'
import { PageHeader } from '@/components/PageHeader'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StatusBadge, DeadlineBadge } from '@/components/StatusBadge'
import { DataTable, DataTableColumnHeader } from '@/components/DataTable'
import { TooltipButton } from '@/components/TooltipButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TaskFormDialog, type TaskFormValues } from './components/TaskFormDialog'
import { CompleteTaskDialog } from './components/CompleteTaskDialog'
import type { PagedResponse, TaskItemVm } from '@/types/api'

export function TasksPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const search = useSearch({ from: '/app-layout/tasks' })

  const [tab, setTab] = useState(
      () => (search.tab && TASK_TABS.some((t) => t.value === search.tab) ? search.tab : 'all'),
  )
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TaskItemVm | null>(null)
  const [deleting, setDeleting] = useState<TaskItemVm | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [completing, setCompleting] = useState<TaskItemVm | null>(null)
  const [exporting, setExporting] = useState(false)

  const params = useMemo(
    () => ({
      Tab: tab === 'all' ? undefined : tab,
      Page: pagination.pageIndex + 1,
      PageSize: pagination.pageSize,
      Keyword: searchText || undefined,
      DepartmentId: departmentId ? Number(departmentId) : undefined,
    }),
    [tab, pagination.pageIndex, pagination.pageSize, searchText, departmentId],
  )

  const { data: raw, isLoading, isError, error } = useGetTasks(params)

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  useEffect(() => {
    if (search.create) {
      setDialogOpen(true)
      router.navigate({ to: '/tasks', search: {}, replace: true })
    }
  }, [search.create, router])

  const tasks = raw ? unwrapApiResponse<PagedResponse<TaskItemVm>>(raw) : undefined

  const { data: deptRaw } = useGetDepartments({ activeOnly: true })
  const departments = useMemo(
    () =>
      deptRaw
        ? unwrapApiResponse<Array<{ id: number; name: string }>>(deptRaw)
        : undefined,
    [deptRaw],
  )

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })
  }

  const handleSave = async (values: TaskFormValues) => {
    if (editing) {
      await toastSmartPromise(
        updateTask(editing.id, {
          taskContent: values.taskContent,
          mainDepartmentId: values.mainDepartmentId ? Number(values.mainDepartmentId) : undefined,
          coDepartmentIds: values.coDepartmentIds?.length
            ? values.coDepartmentIds.join(',')
            : undefined,
          assigneeName: values.assigneeName || null,
          dueDate: toUtcIso(values.dueDate),
          status: values.status || undefined,
          latestResult: values.latestResult || null,
        }).then(unwrapApiResponse),
        { loading: 'Đang cập nhật nhiệm vụ...', success: 'Cập nhật nhiệm vụ thành công!' },
      )
    } else {
      await toastSmartPromise(
        getTasksCreate(values),
        { loading: 'Đang thêm nhiệm vụ...', success: 'Thêm nhiệm vụ thành công!' },
      )
    }
    await invalidate()
  }

  const getTasksCreate = async (values: TaskFormValues) => {
    return createTask({
      documentId: values.documentId,
      taskContent: values.taskContent,
      mainDepartmentId: Number(values.mainDepartmentId),
      coDepartmentIds: values.coDepartmentIds?.length ? values.coDepartmentIds.join(',') : null,
      assigneeName: values.assigneeName || null,
      dueDate: toUtcIso(values.dueDate),
      initialNote: values.initialNote || null,
      createdBy: undefined,
    }).then(unwrapApiResponse)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await toastSmartPromise(
        deleteTask(deleting.id).then(unwrapApiResponse),
        { loading: 'Đang xóa nhiệm vụ...', success: 'Xóa nhiệm vụ thành công!' },
      )
      await invalidate()
      setDeleting(null)
      if (tasks?.items.length === 1 && pagination.pageIndex > 0) {
        setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleComplete = async (latestResult: string) => {
    if (!completing) return
    await toastSmartPromise(
      completeTaskById(completing.id, { latestResult: latestResult || undefined }).then(
        unwrapApiResponse,
      ),
      { loading: 'Đang hoàn thành nhiệm vụ...', success: 'Nhiệm vụ đã hoàn thành!' },
    )
    await invalidate()
    setCompleting(null)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await exportTasks({
        Tab: tab === 'all' ? undefined : tab,
        DepartmentId: departmentId ? Number(departmentId) : undefined,
        Keyword: searchText || undefined,
      })
      const data = unwrapApiResponse<unknown>(result)
      const base64 = typeof data === 'string' ? data : String(data ?? '')
      if (!base64) {
        showError(new Error('Máy chủ trả về dữ liệu rỗng'))
        return
      }
      downloadExcel(base64, `Bao-cao-nhiem-vu-${tab}.xlsx`)
      showSuccess('Xuất Excel thành công!')
    } catch (err) {
      showError(err)
    } finally {
      setExporting(false)
    }
  }

  const applySearch = () => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
    setSearchText(keyword.trim())
  }

  const columns: ColumnDef<TaskItemVm>[] = [
    {
      accessorKey: 'docNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Số VB" />,
      cell: ({ row }) =>
        row.original.docNumber ? (
          <Link
            to="/documents/$id"
            params={{ id: row.original.documentId }}
            className="font-semibold text-primary hover:underline"
          >
            {row.original.docNumber}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
      size: 120,
    },
    {
      accessorKey: 'taskContent',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nội dung nhiệm vụ" />,
      cell: ({ row }) => (
        <div className="max-w-md">
          <Link
            to="/tasks/$id"
            params={{ id: row.original.id }}
            className="line-clamp-2 font-medium text-slate-900 hover:underline dark:text-slate-100"
          >
            {row.original.taskContent}
          </Link>
          {row.original.coDepartmentNames.length ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Phối hợp: {row.original.coDepartmentNames.join(', ')}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: 'mainDepartmentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Đơn vị chủ trì" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.mainDepartmentName ?? '—'}</span>
      ),
      size: 170,
    },
    {
      accessorKey: 'assigneeName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="CB phụ trách" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.assigneeName ?? '—'}</span>
      ),
      size: 120,
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Hạn xử lý" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{formatDateTime(row.original.dueDate)}</span>
      ),
      size: 110,
    },
    {
      accessorKey: 'deadlineStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Hạn còn lại" />,
      cell: ({ row }) => <DeadlineBadge status={row.original.deadlineStatus} />,
      size: 110,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 120,
    },
    {
      id: 'actions',
      header: () => <span className="text-right">Thao tác</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {row.original.status !== 'COMPLETED' ? (
            <TooltipButton
              variant="ghost"
              size="icon"
              label="Hoàn thành"
              className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              onClick={() => setCompleting(row.original)}
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </TooltipButton>
          ) : null}
          <TooltipButton
            variant="ghost"
            size="icon"
            label="Chỉnh sửa"
            onClick={() => {
              setEditing(row.original)
              setDialogOpen(true)
            }}
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
      size: 130,
    },
  ]

  return (
    <>
      <Helmet>
        <title>Quản lý nhiệm vụ - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="task_alt"
          title="Quản lý nhiệm vụ"
          description="Theo dõi tiến độ thực hiện nhiệm vụ của các đơn vị"
          actions={
            <>
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                <span className="material-symbols-outlined text-base mr-1">
                  {exporting ? 'progress_activity' : 'file_download'}
                </span>
                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
              </Button>
              <Button
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
              >
                <span className="material-symbols-outlined text-base mr-1">add</span>
                Thêm nhiệm vụ
              </Button>
            </>
          }
        />

        <div className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
          {TASK_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setTab(t.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                tab === t.value
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
              search
            </span>
            <Input
              className="pl-10"
              placeholder="Tìm nội dung / số văn bản..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>
          <div className="sm:w-56">
            <Select
              value={departmentId}
              onValueChange={(v) => {
                setDepartmentId(v === 'all' ? '' : v)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả đơn vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đơn vị</SelectItem>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" onClick={applySearch}>
            Tìm kiếm
          </Button>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-4">
          <DataTable
            columns={columns}
            data={tasks?.items ?? []}
            loading={isLoading}
            hideToolbar
            pageCount={tasks?.totalPages ?? 0}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalItems={tasks?.totalItems ?? 0}
            getRowId={(row) => row.id}
          />
        </div>
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}
        editing={editing}
        presetDocumentId={search.create ? search.documentId : undefined}
        presetDocNumber={search.create ? search.docNumber : undefined}
        onSave={handleSave}
      />

      <CompleteTaskDialog
        task={completing}
        onOpenChange={(open) => { if (!open) setCompleting(null) }}
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Xóa nhiệm vụ"
        description="Bạn có chắc chắn muốn xóa nhiệm vụ này? Lịch sử cập nhật tiến độ cũng sẽ bị xóa."
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  )
}

function downloadExcel(base64: string, filename: string) {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
