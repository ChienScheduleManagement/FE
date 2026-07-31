function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function extractAccessToken(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (!isRecord(payload)) {
    return null
  }

  const candidates = [
    payload.accessToken,
    payload.token,
    payload.jwt,
    payload.access_token,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return null
}
