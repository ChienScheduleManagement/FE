export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING: {
    label: 'Mới nhận',
    badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  IN_PROGRESS: {
    label: 'Đang thực hiện',
    badge: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
}

export const getTaskStatusMeta = (status?: string | null) =>
  TASK_STATUS_META[status ?? ''] ?? {
    label: status ?? 'Không xác định',
    badge: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
    dot: 'bg-slate-400',
  }

export const DEADLINE_STATUS_META: Record<string, { label: string; badge: string }> = {
  overdue: {
    label: 'Quá hạn',
    badge: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  },
  due_today: {
    label: 'Hạn hôm nay',
    badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  upcoming: {
    label: 'Sắp đến hạn',
    badge: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
  },
  completed: {
    label: 'Đã hoàn thành',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  normal: {
    label: 'Còn hạn',
    badge: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
  },
}

export const getDeadlineStatusMeta = (status?: string | null) =>
  DEADLINE_STATUS_META[status ?? ''] ?? DEADLINE_STATUS_META.normal

export const TASK_TABS = [
  { value: 'all', label: 'Tất cả', icon: 'list_alt' },
  { value: 'overdue', label: 'Quá hạn', icon: 'priority_high' },
  { value: 'upcoming', label: 'Sắp đến hạn', icon: 'upcoming' },
  { value: 'due_today', label: 'Hạn hôm nay', icon: 'today' },
  { value: 'completed', label: 'Đã hoàn thành', icon: 'task_alt' },
] as const

export const CATEGORY_TYPES = [
  { value: 'DOC_TYPE', label: 'Loại văn bản' },
  { value: 'FIELD', label: 'Lĩnh vực công tác' },
] as const

export const DOC_SOURCE_LEVELS = [
  { value: 'COMMUNE', label: 'UBND xã' },
  { value: 'DISTRICT', label: 'Huyện' },
  { value: 'PROVINCE', label: 'Tỉnh' },
  { value: 'CENTRAL', label: 'Trung ương' },
] as const

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export const DEFAULT_PAGE_SIZE = 10
