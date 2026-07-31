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
