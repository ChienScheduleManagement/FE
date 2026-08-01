import type { Result } from '@/api/model'

export type ApiResponse<T> = Result & { data: T }

export interface LoginResponse {
  token: string
  refreshToken: string
  fullName: string
  role: string
  refreshTokenExpiresAt: string
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface PaginationRequest {
  page?: number
  pageSize?: number
  sortBy?: string
  isDescending?: boolean
  query?: string
}

// ================= Domain VMs (tương ứng ViewModels bên BE) =================

export interface TaskItemVm {
  id: string
  documentId: string
  docNumber?: string | null
  docTitle?: string | null
  taskContent: string
  mainDepartmentId: number
  mainDepartmentName?: string | null
  coDepartmentIds?: string | null
  coDepartmentNames: string[]
  assigneeName?: string | null
  dueDate?: string | null
  status: string
  completedDate?: string | null
  latestResult?: string | null
  createdAt: string
  deadlineStatus: string
  daysRemaining?: number | null
}

export interface DocumentVm {
  id: string
  docNumber: string
  title: string
  sourceId?: number | null
  sourceName?: string | null
  docTypeId?: number | null
  docTypeName?: string | null
  issueDate?: string | null
  signer?: string | null
  filePath?: string | null
  createdBy?: string | null
  createdAt: string
  taskCount: number
}

export interface DocumentDetailVm extends DocumentVm {
  tasks: TaskItemVm[]
}

export interface TaskLogVm {
  id: number
  taskId: string
  logDate: string
  progressNote: string
  statusAtLog?: string | null
  updatedBy?: string | null
}

export interface DashboardVm {
  totalTasks: number
  overdueTasks: number
  upcomingTasks: number
  completedTasks: number
  dueTodayTasks: number
  departmentStats: DepartmentTaskStat[]
}

export interface DepartmentTaskStat {
  departmentId: number
  departmentName: string
  inProgress: number
  overdue: number
  completed: number
  total: number
}

export interface CategoryVm {
  id: number
  type: string
  code: string
  name: string
  displayOrder: number
}

export interface DepartmentVm {
  id: number
  code: string
  name: string
  shortName?: string | null
  leaderName?: string | null
  phoneNumber?: string | null
  displayOrder: number
  isActive: boolean
}

export interface DocSourceVm {
  id: number
  code: string
  name: string
  level: string
  displayOrder: number
}
