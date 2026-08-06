import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

import { extractAccessToken } from '@/auth/token'
import { clearAuth, getAccessToken, updateAuthToken } from '@/store/auth.store'
import { router } from '@/app/routes'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean
    _retry?: boolean
  }
}

export const apiBaseUrl = import.meta.env.VITE_API_URL || ''

export const publicClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
  paramsSerializer: {
    indexes: null,
  },
})

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
  paramsSerializer: {
    indexes: null,
  },
})

let refreshPromise: Promise<string | null> | null = null

function isValidTokenFormat(token: string): boolean {
  return (
    typeof token === 'string' &&
    token.length > 20 &&
    !token.includes(' ') &&
    [...token].every((c) => c.charCodeAt(0) <= 0x7f)
  )
}

export async function refreshAccessTokenFromCookie() {
  if (refreshPromise) {
    console.log('[API Client] Joining existing refresh promise...')
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      console.log('[API Client] Refreshing token via public client...')
      const response = await publicClient.post(
        '/api/auth/refresh-token',
        undefined,
        {
          skipAuth: true,
        },
      )

      const data = response.data as { isError?: boolean; data?: unknown }
      if (data?.isError === true) {
        console.warn('[API Client] Refresh failed from server:', data)
        clearAuth()
        return null
      }

      const obj = data?.data as Record<string, unknown> | string | undefined
      const nextToken = extractAccessToken(obj)
      const expiresAt =
        obj && typeof obj === 'object' && typeof obj.refreshTokenExpiresAt === 'string'
          ? obj.refreshTokenExpiresAt
          : undefined

      if (!nextToken) {
        console.warn('[API Client] Refresh failed: No token in response')
        clearAuth()
        return null
      }

      console.log('[API Client] Token refresh success. Updating store...')
      updateAuthToken(
        nextToken,
        expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
      )
      return nextToken
    } catch (err) {
      console.error('[API Client] Token refresh error:', err)
      clearAuth()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config
  }

  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = undefined
  }

  const accessToken = getAccessToken()
  if (accessToken && isValidTokenFormat(accessToken)) {
    config.headers.Authorization = `Bearer ${accessToken}`
  } else if (accessToken) {
    console.error('[API Client] Invalid token format detected:', accessToken)
    clearAuth()
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const statusCode = error.response?.status
    const originalRequest = error.config

    if (statusCode === 403) {
      await router.navigate({ to: '/403', replace: true })
      return Promise.reject(error)
    }

    if (
      statusCode !== 401 ||
      !originalRequest ||
      originalRequest.skipAuth ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    const currentToken = getAccessToken()
    if (
      currentToken &&
      originalRequest.headers?.Authorization &&
      originalRequest.headers.Authorization !== `Bearer ${currentToken}`
    ) {
      originalRequest.headers.Authorization = `Bearer ${currentToken}`
      return apiClient(originalRequest)
    }

    const nextToken = await refreshAccessTokenFromCookie()
    if (!nextToken) {
      clearAuth()
      await router.navigate({ to: '/login', replace: true })
      return Promise.reject(error)
    }

    if (originalRequest.headers && isValidTokenFormat(nextToken)) {
      originalRequest.headers.Authorization = `Bearer ${nextToken}`
    }
    return apiClient(originalRequest)
  },
)

export const apiOrvalClient = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  try {
    const res = await apiClient({
      ...config,
      ...options,
    })
    if (res.config.responseType === 'blob' || res.config.responseType === 'arraybuffer') {
      return res.data as T
    }

    const data = res.data as {
      isError?: boolean
      errorMessage?: string | null
    }

    if (data && typeof data === 'object' && data.isError === true) {
      throw new Error(data.errorMessage || 'Có lỗi xảy ra từ máy chủ')
    }

    return data as T
  } catch (error: unknown) {
    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error
    }

    const axiosError = error as AxiosError<{
      errorMessage?: string | null
      message?: string
      object?: unknown
    }>
    const statusCode = axiosError.response?.status
    const data = axiosError.response?.data

    const message =
      data?.errorMessage && typeof data.errorMessage === 'string'
        ? data.errorMessage
        : typeof data?.object === 'string' && data.object
          ? data.object
          : data?.message

    if (statusCode === 401) {
      throw new Error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.')
    }

    const statusMessages: Record<number, string> = {
      400: 'Dữ liệu gửi lên không hợp lệ (400).',
      403: 'Bạn không có quyền thực hiện hành động này (403).',
      404: 'Không tìm thấy tài nguyên yêu cầu (404).',
      405: 'Phương thức không được hỗ trợ (405).',
      408: 'Yêu cầu quá thời gian xử lý (408).',
      409: 'Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.',
      413: 'Dữ liệu gửi lên quá lớn (413).',
      429: 'Hệ thống đang bận do có quá nhiều yêu cầu (429).',
      500: 'Máy chủ gặp lỗi xử lý bên trong (500).',
      502: 'Máy chủ Gateway gặp lỗi (502).',
      503: 'Dịch vụ hiện không khả dụng (503).',
      504: 'Hết thời gian chờ phản hồi từ máy chủ (504).',
    }

    if (statusCode && statusMessages[statusCode]) {
      throw new Error(message || statusMessages[statusCode])
    }

    if (message) {
      throw new Error(message)
    }

    if (!axiosError.response) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.')
    }

    throw new Error(message || `Có lỗi xảy ra (${statusCode || 'Unknown Error'})`)
  }
}

export default apiClient
