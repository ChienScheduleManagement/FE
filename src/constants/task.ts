export const TASK_STATUS = { PENDING: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: 4 } as const

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

export const TASK_STATUSES: TaskStatus[] = [
  TASK_STATUS.PENDING,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.COMPLETED,
  TASK_STATUS.CANCELLED,
]

export const TASK_STATUS_META: Record<number, { label: string; badge: string; dot: string }> = {
  [TASK_STATUS.PENDING]: {
    label: 'Mới nhận',
    badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  [TASK_STATUS.IN_PROGRESS]: {
    label: 'Đang thực hiện',
    badge: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  [TASK_STATUS.COMPLETED]: {
    label: 'Đã hoàn thành',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  [TASK_STATUS.CANCELLED]: {
    label: 'Đã hủy',
    badge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
}

export const getTaskStatusMeta = (status?: number | null) =>
  TASK_STATUS_META[status ?? -1] ?? {
    label: 'Không xác định',
    badge: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
    dot: 'bg-slate-400',
  }

export const DEADLINE_STATUS = { NORMAL: 1, UPCOMING: 2, DUE_TODAY: 3, OVERDUE: 4, COMPLETED: 5 } as const

export const DEADLINE_STATUS_META: Record<number, { label: string; badge: string }> = {
  [DEADLINE_STATUS.OVERDUE]: {
    label: 'Quá hạn',
    badge: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  },
  [DEADLINE_STATUS.DUE_TODAY]: {
    label: 'Hạn hôm nay',
    badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  [DEADLINE_STATUS.UPCOMING]: {
    label: 'Sắp đến hạn',
    badge: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
  },
  [DEADLINE_STATUS.COMPLETED]: {
    label: 'Đã hoàn thành',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  [DEADLINE_STATUS.NORMAL]: {
    label: 'Còn hạn',
    badge: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
  },
}

export const getDeadlineStatusMeta = (status?: number | null) =>
  DEADLINE_STATUS_META[status ?? -1] ?? DEADLINE_STATUS_META[DEADLINE_STATUS.NORMAL]

export const TASK_TAB: Record<string, TaskTab | undefined> = {
  all: undefined,
  overdue: 1,
  upcoming: 2,
  due_today: 3,
  completed: 4,
}

export type TaskTab = number | undefined

export const TASK_TABS = [
  { value: 'all', label: 'Tất cả', icon: 'list_alt' },
  { value: 'overdue', label: 'Quá hạn', icon: 'priority_high' },
  { value: 'upcoming', label: 'Sắp đến hạn', icon: 'upcoming' },
  { value: 'due_today', label: 'Hạn hôm nay', icon: 'today' },
  { value: 'completed', label: 'Đã hoàn thành', icon: 'task_alt' },
] as const

export const CATEGORY_TYPE = { DOC_TYPE: 1, FIELD: 2 } as const

export type CategoryType = (typeof CATEGORY_TYPE)[keyof typeof CATEGORY_TYPE]

export const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: CATEGORY_TYPE.DOC_TYPE, label: 'Loại văn bản' },
  { value: CATEGORY_TYPE.FIELD, label: 'Lĩnh vực công tác' },
]

export const DOC_SOURCE_LEVEL = { COMMUNE: 1, DISTRICT: 2, PROVINCE: 3, CENTRAL: 4 } as const

export type DocSourceLevel = (typeof DOC_SOURCE_LEVEL)[keyof typeof DOC_SOURCE_LEVEL]

export const DOC_SOURCE_LEVELS: { value: DocSourceLevel; label: string }[] = [
  { value: DOC_SOURCE_LEVEL.COMMUNE, label: 'UBND xã' },
  { value: DOC_SOURCE_LEVEL.DISTRICT, label: 'Huyện' },
  { value: DOC_SOURCE_LEVEL.PROVINCE, label: 'Tỉnh' },
  { value: DOC_SOURCE_LEVEL.CENTRAL, label: 'Trung ương' },
]

export const USER_ROLE = { STAFF: 1, LEADER: 2, ADMIN: 3 } as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export const DEFAULT_PAGE_SIZE = 20
