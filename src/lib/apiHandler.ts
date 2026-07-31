import type { Result } from '@/api/model'

export function unwrapApiResponse<T>(response?: Result): T {
  if (!response) {
    return undefined as T
  }

  if (response.isError) {
    const message =
      typeof response.errorMessage === 'string'
        ? response.errorMessage
        : 'Có lỗi xảy ra'
    throw new Error(message)
  }

  return response.data as T
}
