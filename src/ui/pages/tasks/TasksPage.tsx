import {useEffect, useMemo, useState} from 'react'
import {Link, useRouter, useSearch} from '@tanstack/react-router'
import {useQueryClient} from '@tanstack/react-query'
import type {ColumnDef, PaginationState} from '@tanstack/react-table'
import {
  getExportTasks,
  useBulkStatusTasks,
  useBulkTasks,
  useCreateTasks,
  useDeleteTasksById,
  useGetDepartments,
  useGetTasks,
  usePatchTasksByIdComplete,
  useUpdateTasksById,
} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {showError, showSuccess, toastSmartPromise} from '@/api/utils'
import {formatDateTime, toUtcIso} from '@/lib/format'
import {
  DEFAULT_PAGE_SIZE,
  getDeadlineStatusMeta,
  getTaskStatusMeta,
  TASK_STATUS,
  TASK_STATUSES,
  TASK_TAB,
  TASK_TABS
} from '@/constants/task'
import {PageHeader} from '@/components/PageHeader'
import {RefreshButton} from '@/components/RefreshButton'
import {ConfirmDialog} from '@/components/ConfirmDialog'
import {DeadlineBadge, StatusBadge} from '@/components/StatusBadge'
import {DataTable, DataTableColumnHeader} from '@/components/DataTable'
import {TooltipButton} from '@/components/TooltipButton'
import {Button} from '@/components/ui/button'
import {SearchInput} from '@/components/ui/search-input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {TaskFormDialog, type TaskFormValues} from './components/TaskFormDialog'
import {CompleteTaskDialog} from './components/CompleteTaskDialog'
import type {PagedResponse, TaskItemVm} from '@/types/api'

const STATUS_LOOKUP: Record<string, number> = {
  'mới nhận': TASK_STATUS.PENDING,
  pending: TASK_STATUS.PENDING,
  'đang thực hiện': TASK_STATUS.IN_PROGRESS,
  'in_progress': TASK_STATUS.IN_PROGRESS,
  'in progress': TASK_STATUS.IN_PROGRESS,
  'đã hoàn thành': TASK_STATUS.COMPLETED,
  completed: TASK_STATUS.COMPLETED,
  'đã hủy': TASK_STATUS.CANCELLED,
  cancelled: TASK_STATUS.CANCELLED,
}

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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [selectedCells, setSelectedCells] = useState<ReadonlySet<string>>(new Set())
  const [cellMenu, setCellMenu] = useState<{ x: number; y: number } | null>(null)
  const [completingTask, setCompletingTask] = useState<TaskItemVm | null>(null)
  const [exporting, setExporting] = useState(false)

  const { mutateAsync: createTask } = useCreateTasks()
  const { mutateAsync: updateTask } = useUpdateTasksById()
  const { mutateAsync: deleteTask, isPending: deletingPosition } = useDeleteTasksById()
  const { mutateAsync: bulkDeleteTasks, isPending: bulkDeleting } = useBulkTasks()
  const { mutateAsync: bulkStatusTasks, isPending: statusUpdating } = useBulkStatusTasks()
  const { mutateAsync: completeTask } = usePatchTasksByIdComplete()

  const params = useMemo(
    () => ({
      Tab: TASK_TAB[tab],
      Page: pagination.pageIndex + 1,
      PageSize: pagination.pageSize,
      Keyword: searchText || undefined,
      DepartmentId: departmentId ? Number(departmentId) : undefined,
    }),
    [tab, pagination.pageIndex, pagination.pageSize, searchText, departmentId],
  )

  const { data: raw, isLoading, isError, error, refetch, isRefetching } = useGetTasks(params)

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

  const selectedTaskIds = useMemo(() => {
    const ids = new Set<string>()
    for (const key of selectedCells) {
      const [rowId] = key.split('::')
      if (rowId) ids.add(rowId)
    }
    return ids
  }, [selectedCells])

  const clearCellSelection = () => {
    setSelectedCells(new Set())
    setCellMenu(null)
  }

  const handlePageChange: typeof setPagination = (updater) => {
    setPagination(updater)
    clearCellSelection()
  }

  const handleTabChange = (value: string) => {
    setTab(value)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
    clearCellSelection()
  }

  const handleSave = async (values: TaskFormValues) => {
    if (editing) {
      await toastSmartPromise(
        updateTask({
          id: editing.id,
          data: {
            taskContent: values.taskContent,
            mainDepartmentId: values.mainDepartmentId ? Number(values.mainDepartmentId) : undefined,
            coDepartmentIds: values.coDepartmentIds?.length
              ? values.coDepartmentIds.join(',')
              : undefined,
            assigneeName: values.assigneeName || null,
            dueDate: toUtcIso(values.dueDate),
            status: values.status || undefined,
            latestResult: values.latestResult || null,
          },
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
      data: {
        documentId: values.documentId,
        taskContent: values.taskContent,
        mainDepartmentId: Number(values.mainDepartmentId),
        coDepartmentIds: values.coDepartmentIds?.length ? values.coDepartmentIds.join(',') : null,
        assigneeName: values.assigneeName || null,
        dueDate: toUtcIso(values.dueDate),
        initialNote: values.initialNote || null,
        createdBy: undefined,
      },
    }).then(unwrapApiResponse)
  }

  const handleDelete = async () => {
    if (!deleting) return
      await toastSmartPromise(
        deleteTask({ id: deleting.id }).then(unwrapApiResponse),
        { loading: 'Đang xóa nhiệm vụ...', success: 'Xóa nhiệm vụ thành công!' },
      )
      await invalidate()
      setDeleting(null)
      if (tasks?.items.length === 1 && pagination.pageIndex > 0) {
        setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
      }
  }

  const handleBulkDelete = async () => {
    if (!selectedTaskIds.size) return
      await toastSmartPromise(
        bulkDeleteTasks({ data: [...selectedTaskIds] }).then(unwrapApiResponse),
        { loading: 'Đang xóa nhiều nhiệm vụ...', success: 'Đã xóa các nhiệm vụ đã chọn!' },
      )
      await invalidate()
      setBulkDeleteOpen(false)
      const removed = selectedTaskIds.size
      clearCellSelection()
      if (removed >= (tasks?.items.length ?? 0) && pagination.pageIndex > 0) {
        setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
      }
  }

  const handleBulkStatusChange = async (status: number) => {
    if (!selectedTaskIds.size) return
      await toastSmartPromise(
        bulkStatusTasks({ data: { ids: [...selectedTaskIds], status } }).then(unwrapApiResponse),
        { loading: 'Đang cập nhật trạng thái...', success: `Đã cập nhật trạng thái cho ${selectedTaskIds.size} ô!` },
      )
      await invalidate()
      clearCellSelection()
    setCellMenu(null)
  }

  const handlePaste = async (text: string) => {
    const statusKeys = [...selectedCells].filter((k) => k.endsWith('::status'))
    if (!statusKeys.length) {
      showError('Hãy chọn ít nhất một ô ở cột Trạng thái để dán.')
      return
    }

    const values = text
      .split(/\r?\n/)
      .map((line) => line.split('\t')[0]?.trim() ?? '')
      .filter((v) => v.length)

    const orderIndex = new Map((tasks?.items ?? []).map((t, i) => [String(t.id), i]))
    statusKeys.sort((a, b) => {
      const [ar] = a.split('::')
      const [br] = b.split('::')
      return (orderIndex.get(ar) ?? 0) - (orderIndex.get(br) ?? 0)
    })

    const invalid: string[] = []
    const grouped = new Map<number, string[]>()
    statusKeys.forEach((key, i) => {
      const [rowId] = key.split('::')
      const value = values[Math.min(i, values.length - 1)] ?? ''
      const status = STATUS_LOOKUP[value.toLowerCase()]
      if (!status) {
        invalid.push(value)
        return
      }
      if (!grouped.has(status)) grouped.set(status, [])
      grouped.get(status)!.push(rowId)
    })

    if (invalid.length) {
      showError(`Không nhận dạng được trạng thái: ${[...new Set(invalid)].join(', ')}`)
      return
    }

    for (const [status, ids] of grouped) {
      await toastSmartPromise(
        bulkStatusTasks({ data: { ids, status } }).then(unwrapApiResponse),
        { loading: 'Đang cập nhật trạng thái...', success: `Đã cập nhật trạng thái cho ${ids.length} ô!` },
      )
    }
    await invalidate()
    clearCellSelection()
  }

  const handleComplete = async (latestResult: string) => {
    if (!completingTask) return
    await toastSmartPromise(
      completeTask({
        id: completingTask.id,
        data: { latestResult: latestResult || undefined },
      }).then(unwrapApiResponse),
      { loading: 'Đang hoàn thành nhiệm vụ...', success: 'Nhiệm vụ đã hoàn thành!' },
    )
    await invalidate()
    setCompletingTask(null)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await getExportTasks(
        {
          Tab: TASK_TAB[tab],
          DepartmentId: departmentId ? Number(departmentId) : undefined,
          Keyword: searchText || undefined,
        },
        { responseType: 'blob' },
      )
      downloadBlob(blob as unknown as Blob, `Bao-cao-nhiem-vu-${tab}.xlsx`)
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
    clearCellSelection()
  }

  const getCellText = (row: TaskItemVm, columnId: string): string => {
    switch (columnId) {
      case 'status':
        return getTaskStatusMeta(row.status).label
      case 'deadlineStatus':
        return getDeadlineStatusMeta(row.deadlineStatus).label
      case 'dueDate':
        return row.dueDate ? formatDateTime(row.dueDate) : ''
      case 'docNumber':
        return row.docNumber ?? ''
      case 'taskContent':
        return row.taskContent ?? ''
      case 'mainDepartmentName':
        return row.mainDepartmentName ?? ''
      case 'assigneeName':
        return row.assigneeName ?? ''
      default:
        return ''
    }
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
          {row.original.status !== TASK_STATUS.COMPLETED ? (
            <TooltipButton
              variant="ghost"
              size="icon"
              label="Hoàn thành"
              className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              onClick={() => setCompletingTask(row.original)}
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

  const menuWidth = 240

  return (
    <>
      <title>Quản lý nhiệm vụ</title>
      <div className="flex flex-col gap-5">
         <PageHeader
           icon="task_alt"
           title="Quản lý nhiệm vụ"
          description="Theo dõi tiến độ thực hiện nhiệm vụ của các đơn vị"
          actions={
            <>
              <RefreshButton onClick={() => refetch()} loading={isRefetching} />
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
              onClick={() => handleTabChange(t.value)}
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
          <div className="flex-1">
            <SearchInput
              placeholder="Tìm nội dung / số văn bản..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={applySearch}
              onClear={() => { setKeyword(''); setSearchText('') }}
            />
          </div>
          <div className="sm:w-56">
            <Select
              value={departmentId}
              onValueChange={(v) => {
                setDepartmentId(v === 'all' ? '' : v)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
                clearCellSelection()
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
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-4">
          <phantom-ui loading={isLoading} animation="shimmer" reveal={0.1} class="block">
            <DataTable
              columns={columns}
              data={tasks?.items ?? []}
              hideToolbar
              pageCount={tasks?.totalPages ?? 0}
              pagination={pagination}
              onPaginationChange={handlePageChange}
              totalItems={tasks?.totalItems ?? 0}
              getRowId={(row) => row.id}
              enableCellSelection
              selectedCells={selectedCells}
              onSelectedCellsChange={setSelectedCells}
              onCellContextMenu={(_row, _columnId, event) => {
                setCellMenu({ x: event.clientX, y: event.clientY })
              }}
              getCellText={getCellText}
              onPaste={(text) => void handlePaste(text)}
            />
          </phantom-ui>
          <p className="mt-3 text-xs text-muted-foreground">
            Mẹo: Ctrl + click để chọn nhiều ô · Shift + click để chọn liên tiếp theo hàng hoặc cột · Click
            chuột phải để đổi trạng thái hàng loạt · Ctrl + C / Ctrl + V để sao chép - dán trạng thái.
          </p>
        </div>
      </div>

      {cellMenu && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={() => setCellMenu(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setCellMenu(null)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              setCellMenu(null)
            }}
          />
          <div
            className="fixed z-50 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800"
            style={{
              left: Math.min(cellMenu.x, window.innerWidth - menuWidth - 8),
              top: Math.min(cellMenu.y, window.innerHeight - 260),
            }}
          >
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Đổi trạng thái ({selectedTaskIds.size} ô)
            </div>
            {TASK_STATUSES.map((status) => {
              const meta = getTaskStatusMeta(status)
              return (
                <button
                  key={status}
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => void handleBulkStatusChange(status)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span className={`size-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              )
            })}
            <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              onClick={() => {
                setBulkDeleteOpen(true)
                setCellMenu(null)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              Xóa {selectedTaskIds.size} nhiệm vụ đã chọn
            </button>
            <button
              type="button"
              onClick={clearCellSelection}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span className="material-symbols-outlined text-base">close</span>
              Bỏ chọn
            </button>
          </div>
        </>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}
        editing={editing}
        presetDocumentId={search.create ? search.documentId : undefined}
        presetDocNumber={search.create ? search.docNumber : undefined}
        onSave={handleSave}
      />

      <CompleteTaskDialog
        task={completingTask}
        onOpenChange={(open) => { if (!open) setCompletingTask(null) }}
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Xóa nhiệm vụ"
        description="Bạn có chắc chắn muốn xóa nhiệm vụ này? Lịch sử cập nhật tiến độ cũng sẽ bị xóa."
        loading={deletingPosition}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Xóa nhiều nhiệm vụ"
        description={`Bạn có chắc chắn muốn xóa ${selectedTaskIds.size} nhiệm vụ đã chọn? Hành động này không thể hoàn tác.`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
