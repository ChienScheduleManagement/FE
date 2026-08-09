import {useEffect, useMemo, useState} from 'react'
import {Link} from '@tanstack/react-router'
import {useQueryClient} from '@tanstack/react-query'
import type {ColumnDef, PaginationState, RowSelectionState} from '@tanstack/react-table'
import {
  useBulkDocuments,
  useCreateDocuments,
  useDeleteDocumentsById,
  useGetDocSources,
  useGetDocuments,
  useUpdateDocumentsById,
} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {showError, toastSmartPromise} from '@/api/utils'
import {formatDate} from '@/lib/format'
import {DEFAULT_PAGE_SIZE} from '@/constants/task'
import {PageHeader} from '@/components/PageHeader'
import {RefreshButton} from '@/components/RefreshButton'
import {ConfirmDialog} from '@/components/ConfirmDialog'
import {BulkActionBar, DataTable, DataTableColumnHeader} from '@/components/DataTable'
import {selectColumn} from '@/components/DataTable/selectColumn'
import {TooltipButton} from '@/components/TooltipButton'
import {Button} from '@/components/ui/button'
import {SearchInput} from '@/components/ui/search-input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {DocumentFormDialog, type DocumentFormValues} from './components/DocumentFormDialog'
import type {DocumentVm, PagedResponse} from '@/types/api'

export function DocumentsPage() {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentVm | null>(null)
  const [deleting, setDeleting] = useState<DocumentVm | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { mutateAsync: updateDocument } = useUpdateDocumentsById()
  const { mutateAsync: createDocument } = useCreateDocuments()
  const { mutateAsync: deleteDocument, isPending: deletingPosition } = useDeleteDocumentsById()
  const { mutateAsync: bulkDeleteDocuments, isPending: bulkDeleting } = useBulkDocuments()

  const params = useMemo(
    () => ({
      Page: pagination.pageIndex + 1,
      PageSize: pagination.pageSize,
      Keyword: searchText || undefined,
      SourceId: sourceId && sourceId !== 'all' ? Number(sourceId) : undefined,
    }),
    [pagination.pageIndex, pagination.pageSize, searchText, sourceId],
  )

  const { data: raw, isLoading, isError, error, refetch, isRefetching } = useGetDocuments(params)

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const documents = raw ? unwrapApiResponse<PagedResponse<DocumentVm>>(raw) : undefined

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/documents'] })
  }

  const handleSave = async (values: DocumentFormValues) => {
    if (editing) {
      await toastSmartPromise(
        updateDocument({
          id: editing.id,
          data: {
            docNumber: values.docNumber,
            title: values.title,
            sourceId: values.sourceId ? Number(values.sourceId) : undefined,
            docTypeId: values.docTypeId ? Number(values.docTypeId) : undefined,
            issueDate: values.issueDate || null,
            signer: values.signer || null,
            filePath: values.filePath || null,
          },
        }).then(unwrapApiResponse),
        { loading: 'Đang cập nhật văn bản...', success: 'Cập nhật văn bản thành công!' },
      )
    } else {
      await toastSmartPromise(
        createDocument({
          data: {
            docNumber: values.docNumber,
            title: values.title,
            sourceId: values.sourceId ? Number(values.sourceId) : undefined,
            docTypeId: values.docTypeId ? Number(values.docTypeId) : undefined,
            issueDate: values.issueDate || null,
            signer: values.signer || null,
            filePath: values.filePath || null,
            createdBy: undefined,
          },
        }).then(unwrapApiResponse),
        { loading: 'Đang thêm văn bản...', success: 'Thêm văn bản thành công!' },
      )
    }
    await invalidate()
  }

  const handleDelete = async () => {
    if (!deleting) return
      await toastSmartPromise(
        deleteDocument({ id: deleting.id }).then(unwrapApiResponse),
        { loading: 'Đang xóa văn bản...', success: 'Xóa văn bản thành công!' },
      )
      await invalidate()
      setDeleting(null)
      if (documents?.items.length === 1 && pagination.pageIndex > 0) {
        setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
      }
  }

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection)
    if (!ids.length) return
      await toastSmartPromise(
        bulkDeleteDocuments({ data: ids }).then(unwrapApiResponse),
        { loading: 'Đang xóa nhiều văn bản...', success: 'Đã xóa các văn bản đã chọn!' },
      )
      await invalidate()
      setBulkDeleteOpen(false)
      setRowSelection({})
      if (ids.length >= (documents?.items.length ?? 0) && pagination.pageIndex > 0) {
        setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
      }
  }

  const applySearch = () => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
    setSearchText(keyword.trim())
  }

  const columns: ColumnDef<DocumentVm>[] = [
    selectColumn<DocumentVm>(),
    {
      accessorKey: 'docNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Số văn bản" />,
      cell: ({ row }) => (
        <Link
          to="/documents/$id"
          params={{ id: row.original.id }}
          className="font-semibold text-primary hover:underline"
        >
          {row.original.docNumber}
        </Link>
      ),
      size: 140,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Trích yếu" />,
      cell: ({ row }) => (
        <div className="max-w-md">
          <Link
            to="/documents/$id"
            params={{ id: row.original.id }}
            className="line-clamp-2 font-medium text-slate-900 hover:underline dark:text-slate-100"
          >
            {row.original.title}
          </Link>
          {row.original.signer ? (
            <p className="mt-0.5 text-xs text-muted-foreground">Người ký: {row.original.signer}</p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: 'sourceName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nguồn ban hành" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.sourceName ?? '—'}</span>
      ),
      size: 160,
    },
    {
      accessorKey: 'docTypeName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Loại văn bản" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.docTypeName ?? '—'}</span>
      ),
      size: 160,
    },
    {
      accessorKey: 'issueDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày ban hành" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {formatDate(row.original.issueDate)}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: 'taskCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nhiệm vụ" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          {row.original.taskCount}
        </span>
      ),
      size: 90,
    },
    {
      id: 'actions',
      header: () => <span className="text-right">Thao tác</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
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
      size: 110,
    },
  ]

  return (
    <>
      <title>Quản lý văn bản</title>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="description"
          title="Quản lý văn bản"
          description="Theo dõi các văn bản đến và nhiệm vụ phát sinh từ văn bản"
          actions={
            <>
              <RefreshButton onClick={() => refetch()} loading={isRefetching} />
              <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
                <span className="material-symbols-outlined text-base mr-1">add</span>
                Thêm văn bản
              </Button>
            </>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchInput
              placeholder="Tìm theo số văn bản hoặc trích yếu..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={applySearch}
              onClear={() => { setKeyword(''); setSearchText('') }}
            />
          </div>
          <div className="sm:w-56">
            <Select value={sourceId} onValueChange={(v) => { setSourceId(v); setPagination((p) => ({ ...p, pageIndex: 0 })) }}>
              <SelectTrigger>
                <SelectValue placeholder="Nguồn ban hành" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nguồn</SelectItem>
                <SourceOptions />
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-4">
          <BulkActionBar
            selectedCount={Object.keys(rowSelection).length}
            actions={[
              {
                label: 'Xóa nhiều',
                icon: 'delete_sweep',
                onClick: () => setBulkDeleteOpen(true),
                colorClass:
                  'text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950/40',
              },
            ]}
            onClearSelection={() => setRowSelection({})}
          />
          <phantom-ui loading={isLoading} animation="shimmer" reveal={0.1} class="block">
            <DataTable
              columns={columns}
              data={documents?.items ?? []}
              hideToolbar
              pageCount={documents?.totalPages ?? 0}
              pagination={pagination}
              onPaginationChange={setPagination}
              totalItems={documents?.totalItems ?? 0}
              getRowId={(row) => row.id}
              enableRowSelection
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          </phantom-ui>
        </div>
      </div>

      <DocumentFormDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}
        editing={editing}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Xóa văn bản"
        description={
          <>
            Bạn có chắc chắn muốn xóa văn bản{' '}
            <span className="font-semibold text-foreground">{deleting?.docNumber}</span>?
            <br />
            Các nhiệm vụ phát sinh từ văn bản này cũng sẽ bị xóa.
          </>
        }
        loading={deletingPosition}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Xóa nhiều văn bản"
        description={`Bạn có chắc chắn muốn xóa ${Object.keys(rowSelection).length} văn bản đã chọn? Các nhiệm vụ phát sinh từ các văn bản này cũng sẽ bị xóa.`}
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}

function SourceOptions() {
  const { data: raw } = useGetDocSources()
  const sources = raw ? unwrapApiResponse<Array<{ id: number; name: string }>>(raw) : undefined
  return sources?.map((s) => (
    <SelectItem key={s.id} value={String(s.id)}>
      {s.name}
    </SelectItem>
  ))
}
