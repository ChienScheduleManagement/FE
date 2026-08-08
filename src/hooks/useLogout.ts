import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { logout } from '@/auth/authApi'
import { clearAuth } from '@/store/auth.store'

export function useLogout() {
  const navigate = useNavigate()

  return useCallback(async () => {
    try {
      await logout()
    } catch {
      // logout API failed, but we still clear local auth state
    } finally {
      clearAuth()
    }
    navigate({ to: '/login' })
  }, [navigate])
}
