import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from '@tanstack/react-router'
import { useGetDashboard } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { showError } from '@/api/utils'
import { formatPercent } from '@/lib/format'
import { APP_NAME } from '@/constants/ui'
import { PageHeader } from '@/components/PageHeader'
import { SkeletonRows } from '@/components/SkeletonRows'
import { Skeleton } from '@/components/ui/skeleton'

const STAT_CARDS = [
  {
    key: 'total',
    label: 'Tổng nhiệm vụ',
    field: 'totalTasks',
    icon: 'list_alt',
    color: 'bg-primary/10 text-primary',
    tab: 'all',
  },
  {
    key: 'overdue',
    label: 'Quá hạn',
    field: 'overdueTasks',
    icon: 'priority_high',
    color: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
    tab: 'overdue',
  },
  {
    key: 'upcoming',
    label: 'Sắp đến hạn (7 ngày)',
    field: 'upcomingTasks',
    icon: 'upcoming',
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
    tab: 'upcoming',
  },
  {
    key: 'dueToday',
    label: 'Hạn hôm nay',
    field: 'dueTodayTasks',
    icon: 'today',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    tab: 'due_today',
  },
  {
    key: 'completed',
    label: 'Đã hoàn thành',
    field: 'completedTasks',
    icon: 'task_alt',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    tab: 'completed',
  },
] as const

type DashboardData = {
  totalTasks: number
  overdueTasks: number
  upcomingTasks: number
  completedTasks: number
  dueTodayTasks: number
  departmentStats: Array<{
    departmentId: number
    departmentName: string
    inProgress: number
    overdue: number
    completed: number
    total: number
  }>
}

export function DashboardPage() {
  const { data: raw, isLoading, isError, error } = useGetDashboard()

  useEffect(() => {
    if (isError) showError(error)
  }, [isError, error])

  const dashboard = raw ? unwrapApiResponse<DashboardData>(raw) : undefined

  return (
    <>
      <Helmet>
        <title>Tổng quan - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-6">
        <PageHeader
          icon="dashboard"
          title="Tổng quan"
          description="Tình hình thực hiện nhiệm vụ của các đơn vị"
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {STAT_CARDS.map((card) => (
            <Link
              key={card.key}
              to="/tasks"
              search={{ tab: card.tab }}
              className="group rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className={`flex size-10 items-center justify-center rounded-xl ${card.color}`}>
                  <span className="material-symbols-outlined text-xl">{card.icon}</span>
                </span>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  Xem
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
                {card.key === 'completed' && dashboard?.totalTasks ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPercent(dashboard.completedTasks, dashboard.totalTasks)}%
                  </span>
                ) : null}
              </div>
              <div className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  (dashboard?.[card.field] ?? 0).toLocaleString('vi-VN')
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{card.label}</p>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Nhiệm vụ theo đơn vị</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Tiến độ thực hiện của từng phòng ban
              </p>
            </div>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              Xem tất cả
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4 p-5">
              <SkeletonRows rows={4} className="h-12 w-full" />
            </div>
          ) : !dashboard?.departmentStats.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu nhiệm vụ
            </div>
          ) : (
            <div className="divide-y">
              {dashboard.departmentStats.map((dept) => {
                const completedPct = formatPercent(dept.completed, dept.total)
                return (
                  <div key={dept.departmentId} className="flex items-center gap-4 p-4 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {dept.departmentName}
                      </p>
                      <div className="mt-2 flex h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                          style={{ width: `${completedPct}%` }}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all duration-700"
                          style={{ width: `${formatPercent(dept.inProgress, dept.total)}%` }}
                        />
                        <div
                          className="h-full bg-red-500 transition-all duration-700"
                          style={{ width: `${formatPercent(dept.overdue, dept.total)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
                      <span className="text-emerald-600 dark:text-emerald-400">{dept.completed} xong</span>
                      <span className="text-amber-600 dark:text-amber-400">{dept.inProgress} đang làm</span>
                      <span className="text-red-600 dark:text-red-400">{dept.overdue} quá hạn</span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {dept.total}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
