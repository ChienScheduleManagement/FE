const isDev = import.meta.env.DEV

export const debug = {
  log: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
  warn: (...args: unknown[]) => isDev && console.warn('[DEBUG]', ...args),
  error: (...args: unknown[]) => isDev && console.error('[DEBUG]', ...args),
}
