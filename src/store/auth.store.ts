import type { LoginResponse } from '@/types/api'
import { create } from 'zustand'
import { debug } from '@/lib/debug'

type AuthState = {
  user: LoginResponse | null
  setUser: (user: LoginResponse) => void
  clearAuth: () => void
}

const STORAGE_KEY = 'schedule_user'

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })(),
  setUser: (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    set({ user })
  },
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ user: null })
  },
}))

export function getAccessToken() {
  return useAuthStore.getState().user?.token ?? null
}

export function clearAuth() {
  useAuthStore.getState().clearAuth()
}

export function getUser() {
  return useAuthStore.getState().user
}

export function setUser(user: LoginResponse) {
  useAuthStore.getState().setUser(user)
}

export const updateAuthToken = (token: string, refreshTokenExpiresAt: string) => {
  debug.log('Updating token in store...')
  useAuthStore.setState((state) => {
    if (!state.user) {
      debug.warn('Cannot update token: No user in state')
      return state
    }
    const newUser = { ...state.user, token, refreshTokenExpiresAt }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    debug.log('Token updated successfully.')
    return { user: newUser }
  })
}
