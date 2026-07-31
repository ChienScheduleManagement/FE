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
      clearAuth()
    }
    clearAuth()
    navigate({ to: '/login' })
  }, [navigate])
}
