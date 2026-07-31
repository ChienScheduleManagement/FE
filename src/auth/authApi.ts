import { loginUser, logoutUser, refreshUser } from '@/api/generated'
import { clearAuth, getAccessToken, setUser, updateAuthToken } from '@/store/auth.store'

import { extractAccessToken } from './token'

import type { ApiResponse, LoginResponse } from '@/types/api'

type LoginInput = {
  username: string
  password: string
}

export async function login(input: LoginInput) {
  const result = (await loginUser(input, {
    skipAuth: true,
  })) as ApiResponse<LoginResponse>
  const data = result.data as LoginResponse
  if (data?.token) {
    setUser(data)
  }
  return result
}

export async function refreshAccessToken() {
  const result = (await refreshUser({
    skipAuth: true,
  })) as ApiResponse<LoginResponse>

  const data = result.data as LoginResponse
  const accessToken = extractAccessToken(data)
  if (!accessToken || !data?.refreshTokenExpiresAt) {
    clearAuth()
    return null
  }

  updateAuthToken(accessToken, data.refreshTokenExpiresAt)
  return accessToken
}

export async function ensureAccessToken() {
  const existingToken = getAccessToken()
  if (existingToken) return existingToken
  return refreshAccessToken()
}

export async function logout() {
  try {
    await logoutUser({
      skipAuth: true,
    })
  } finally {
    clearAuth()
  }
}
