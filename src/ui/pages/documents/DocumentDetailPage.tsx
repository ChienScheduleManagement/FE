import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from '@tanstack/react-router'
import { useGetDocumentById } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError } from '@/api/utils'
import { formatDate, formatDateTime } from '@/lib/format'
import { APP_NAME } from '@/constants/ui'
import { StatusBadge, DeadlineBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { SkeletonRows } from '@/components/SkeletonRows'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DocumentDetailVm } from '@/types/api'

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{value || '—'}</p>
    </div>
  )
}

export function DocumentDetailPage() {
  const { id } = useParams({ from: '/app-layout/documents/$id' })
  const { data: raw, isLoading, isError, error } = useGetDocumentById(id)

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const doc = raw ? unwrapApiResponse<DocumentDetailVm>(raw) : undefined

  return (
    <>
      <Helmet>
        <title>{doc ? doc.docNumber : 'Chi tiết văn bản'} - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="inline-flex size-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Chi tiết văn bản
            </p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isLoading ? 'Đang tải...' : doc?.docNumber}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-6 w-2/3" />
            <div className="grid gap-4 sm:grid-cols-3">
              <SkeletonRows rows={6} className="h-14 w-full" />
            </div>
          </div>
        ) : doc ? (
          <>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold leading-snug text-slate-900 dark:text-slate-100">
                {doc.title}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="Nguồn ban hành" value={doc.sourceName} />
                <InfoItem label="Loại văn bản" value={doc.docTypeName} />
                <InfoItem label="Ngày ban hành" value={formatDate(doc.issueDate)} />
                <InfoItem label="Người ký" value={doc.signer} />
                <InfoItem label="Người nhập" value={doc.createdBy} />
                <InfoItem label="Ngày nhập" value={formatDateTime(doc.createdAt)} />
              </div>
              {doc.filePath ? (
                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  Tải tệp văn bản
                </a>
              ) : null}
            </div>

            <div className="rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">
                    Nhiệm vụ phát sinh ({doc.tasks.length})
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Các nhiệm vụ cần theo dõi từ văn bản này
                  </p>
                </div>
                <Link
                  to="/tasks"
                  search={{ create: true, documentId: doc.id, docNumber: doc.docNumber }}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Thêm nhiệm vụ
                </Link>
              </div>

              {!doc.tasks.length ? (
                <EmptyState
                  icon="task_alt"
                  title="Chưa có nhiệm vụ nào"
                  description="Thêm nhiệm vụ phát sinh từ văn bản này để bắt đầu theo dõi tiến độ."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nội dung nhiệm vụ</TableHead>
                        <TableHead className="w-44">Đơn vị chủ trì</TableHead>
                        <TableHead className="w-36">CB phụ trách</TableHead>
                        <TableHead className="w-32">Hạn xử lý</TableHead>
                        <TableHead className="w-28">Hạn còn lại</TableHead>
                        <TableHead className="w-28">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doc.tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <Link
                              to="/tasks/$id"
                              params={{ id: task.id }}
                              className="line-clamp-2 font-medium text-slate-900 hover:underline dark:text-slate-100"
                            >
                              {task.taskContent}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {task.mainDepartmentName ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {task.assigneeName ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatDateTime(task.dueDate)}
                          </TableCell>
                          <TableCell>
                            <DeadlineBadge status={task.deadlineStatus} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={task.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
