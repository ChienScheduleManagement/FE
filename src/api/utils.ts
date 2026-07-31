import { toast } from 'sonner'
import type { Result } from '@/api/model'

/**
 * Lấy thông báo lỗi nghiệp vụ từ response BE.
 * BE luôn trả HTTP 200 nhưng set isError=true + errorMessage là chuỗi lỗi.
 */
export function extractBeError(data: Result | unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const r = data as Result
  if (!r.isError) return null
  if (typeof r.errorMessage === 'string' && r.errorMessage.trim())
    return r.errorMessage
  return 'Có lỗi xảy ra từ máy chủ'
}

/**
 * Kiểm tra response data có lỗi nghiệp vụ không.
 * Nếu có → throw Error để caller biết.
 * Trả về data nếu OK để chain tiếp.
 */
export function assertBeSuccess<T extends Result>(data: T): T {
  const msg = extractBeError(data)
  if (msg) {
    throw new Error(msg)
  }
  return data
}

/**
 * Hiển thị lỗi từ catch block.
 * Ưu tiên: message từ Error object (set bởi assertBeSuccess) > fallback
 */
const recentErrors = new Map<string, number>()
const ERROR_DEDUPE_MS = 3_000

export const showError = (error: unknown, fallback = 'Có lỗi xảy ra') => {
  const message =
    error instanceof Error && error.message
      ? error.message
      : typeof error === 'string' && error
        ? error
        : fallback

  const now = Date.now()
  const last = recentErrors.get(message)
  if (last && now - last < ERROR_DEDUPE_MS) {
    return
  }

  recentErrors.set(message, now)
  for (const [k, t] of recentErrors) {
    if (now - t > ERROR_DEDUPE_MS * 2) recentErrors.delete(k)
  }

  toast.error(message)
}

export const showSuccess = (msg?: string) => {
  toast.success(msg || 'Thành công!')
}

export const handleRefresh = <T extends { error?: unknown }>(
  fn: () => Promise<T>,
): (() => Promise<void>) => {
  return () =>
    fn().then((r) => {
      if (r.error) throw r.error
    })
}

/**
 * Hiển thị toast một cách thông minh: Chỉ hiện loading nếu tác vụ lâu hơn threshold (ms).
 * Giúp tránh hiện tượng nháy toast cho các tác vụ nhanh.
 */
export async function toastSmartPromise<T>(
  promise: Promise<T>,
  opts: { loading: string; success: string; error?: string },
  threshold = 700,
): Promise<T> {
  let isResolved = false
  let toastId: string | number | undefined

  const timeout = setTimeout(() => {
    if (!isResolved) {
      toastId = toast.loading(opts.loading)
    }
  }, threshold)

  try {
    const result = await promise
    isResolved = true
    clearTimeout(timeout)

    if (toastId) {
      toast.success(opts.success, { id: toastId })
    } else {
      toast.success(opts.success)
    }
    return result
  } catch (error: unknown) {
    isResolved = true
    clearTimeout(timeout)

    const errorMsg =
      error instanceof Error ? error.message : opts.error || 'Có lỗi xảy ra'
    if (toastId) {
      toast.error(errorMsg, { id: toastId })
    } else {
      toast.error(errorMsg)
    }
    throw error
  }
}
