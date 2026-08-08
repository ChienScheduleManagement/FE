import type { Result } from '@/api/model'

export type ApiResponse<T> = Result & { data: T }

export interface LoginResponse {
  token: string
  refreshToken: string
  fullName: string
  role: number
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
  status: number
  completedDate?: string | null
  latestResult?: string | null
  createdAt: string
  deadlineStatus: number
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
  statusAtLog?: number | null
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
  type: number
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
  level: number
  displayOrder: number
}

// ================= Nhân sự & Chấm công =================

export interface EmployeeVm {
  id: string
  employeeCode: string
  fullName: string
  departmentId: number
  departmentName?: string | null
  position?: string | null
  baseSalary: number
  allowance: number
  phoneNumber?: string | null
  avatarUrl?: string | null
  isActive: boolean
  displayOrder: number
  joinDate?: string | null
  createdAt: string
}

export interface LeaveReasonVm {
  id: number
  code: string
  name: string
  symbol?: string | null
  color?: string | null
  isPaid: boolean
  salaryRatio: number
  displayOrder: number
}

export interface PositionVm {
  id: number
  code: string
  name: string
  displayOrder: number
  isActive: boolean
  createdAt: string
}

export interface AttendanceDayVm {
  date: string
  leaveReasonId?: number | null
  note?: string | null
  hasRecord: boolean
  isDayOff: boolean
  dayOffSymbol?: string | null
  dayOffColor?: string | null
  dayOffName?: string | null
}

export interface DayOffVm {
  id: number
  name: string
  symbol?: string | null
  color?: string | null
  recurringType: number
  date?: string | null
  yearlyMonth?: number | null
  yearlyDay?: number | null
  weekDay?: number | null
  isActive: boolean
  displayOrder: number
  createdAt: string
}

export interface AttendanceEmployeeVm {
  employeeId: string
  employeeCode: string
  fullName: string
  position?: string | null
  departmentName?: string | null
  workDays: number
  leaveDays: number
  days: AttendanceDayVm[]
}

export interface AttendanceGridVm {
  year: number
  month: number
  daysInMonth: number
  employees: AttendanceEmployeeVm[]
}

export interface AttendanceChangeVm {
  id: string
  employeeId: string
  date: string
  fromLeaveReasonId?: number | null
  fromLeaveReasonName?: string | null
  toLeaveReasonId?: number | null
  toLeaveReasonName?: string | null
  note?: string | null
  changedBy?: string | null
  changedAt: string
}

export interface SalaryItemVm {
  employeeId: string
  employeeCode: string
  fullName: string
  position?: string | null
  departmentName?: string | null
  workDays: number
  leaveDays: number
  salaryCoefficient: number
  baseSalary: number
  allowance: number
  salaryRatio: number
  grossSalary: number
  netSalary: number
}

export interface SalaryVm {
  year: number
  month: number
  daysInMonth: number
  standardDays: number
  baseSalaryAmount: number
  items: SalaryItemVm[]
}

export interface EmploymentHistoryVm {
  id: string
  employeeId: string
  employeeName: string
  departmentId: number
  departmentName: string
  positionId?: number | null
  positionName?: string | null
  contractId?: string | null
  effectiveFrom: string
  effectiveTo?: string | null
  reason?: string | null
  createdAt: string
}

