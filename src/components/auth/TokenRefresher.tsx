import { useEffect, useRef } from 'react'
import { refreshAccessTokenFromCookie } from '@/api/client'
import { clearAuth, useAuthStore } from '@/store/auth.store'
import { debug } from '@/lib/debug'

/**
 * Component này dùng để tự động refresh token trước khi hết hạn 1 phút.
 * Được mount ở tầng root của ứng dụng.
 */
export function TokenRefresher() {
  const user = useAuthStore((state) => state.user)
  const isRefreshingRef = useRef(false)
  const lastRefreshedAtRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user || !user.refreshTokenExpiresAt) return

    if (lastRefreshedAtRef.current === user.refreshTokenExpiresAt) return

    const expiresAt = new Date(user.refreshTokenExpiresAt).getTime()
    const now = new Date().getTime()

    const delay = Math.max(0, expiresAt - now - 60000)

    if (delay < 2000 && isRefreshingRef.current) return

    debug.log(
      `Token expires at: ${user.refreshTokenExpiresAt}. Next refresh in ${Math.round(delay / 1000)}s`,
    )

    const timeoutId = setTimeout(async () => {
      if (isRefreshingRef.current) return

      try {
        isRefreshingRef.current = true
        debug.log('Refreshing token proactively...')
        const nextToken = await refreshAccessTokenFromCookie()

        if (nextToken) {
          const updatedUser = useAuthStore.getState().user
          if (updatedUser) {
            lastRefreshedAtRef.current = updatedUser.refreshTokenExpiresAt ?? null
          }
          debug.log('Token refreshed successfully.')
        }
      } catch (err) {
        debug.error(
          'Failed to refresh token. Logging out...',
          err,
        )
        clearAuth()
      } finally {
        isRefreshingRef.current = false
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [user])

  return null
}
