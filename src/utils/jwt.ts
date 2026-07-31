import { jwtDecode } from 'jwt-decode'

const roleClaimKey =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = jwtDecode<Record<string, unknown>>(token)
    return payload && typeof payload === 'object' ? payload : null
  } catch {
    return null
  }
}

function normalizeRoleValue(value: unknown) {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return []
}

export function getTokenRoles(token: string): string[] {
  const payload = parseJwtPayload(token)
  if (!payload) {
    return []
  }

  return [
    ...normalizeRoleValue(payload.role),
    ...normalizeRoleValue(payload.roles),
    ...normalizeRoleValue(payload[roleClaimKey]),
  ].map((role) => role.toLowerCase())
}

export function hasAnyRole(token: string, expectedRoles: string[]) {
  const currentRoles = new Set(getTokenRoles(token))
  return expectedRoles.some((role) => currentRoles.has(role.toLowerCase()))
}
