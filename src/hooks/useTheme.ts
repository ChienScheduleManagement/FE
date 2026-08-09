import { useCallback, useEffect, useState } from 'react'
import { THEMES, THEME_CLASSES, THEME_ORDER, type Theme } from '@/constants/theme'

export const THEME_STORAGE_KEY = 'schedule_theme'

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return THEMES.light
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (THEME_ORDER.includes(stored as Theme)) return stored as Theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.dark : THEMES.light
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove(...Object.values(THEME_CLASSES).filter(Boolean))
  const className = THEME_CLASSES[theme]
  if (className) root.classList.add(className)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const index = THEME_ORDER.indexOf(prev)
      return THEME_ORDER[(index + 1) % THEME_ORDER.length]
    })
  }, [])

  const setThemeByIndex = useCallback((index: number) => {
    setTheme(THEME_ORDER[((index % THEME_ORDER.length) + THEME_ORDER.length) % THEME_ORDER.length])
  }, [])

  return { theme, toggleTheme, setThemeByIndex, themes: THEME_ORDER }
}
