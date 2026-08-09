export const THEMES = {
  light: 'light',
  dark: 'dark',
  blue: 'blue',
} as const

export type Theme = (typeof THEMES)[keyof typeof THEMES]

export const THEME_ORDER: readonly Theme[] = [THEMES.light, THEMES.dark, THEMES.blue]

export const THEME_CLASSES: Record<Theme, string> = {
  [THEMES.light]: '',
  [THEMES.dark]: 'dark',
  [THEMES.blue]: 'blue',
}

export const THEME_LABELS: Record<Theme, string> = {
  [THEMES.light]: 'Chế độ sáng',
  [THEMES.dark]: 'Chế độ tối',
  [THEMES.blue]: 'Chế độ xanh',
}
