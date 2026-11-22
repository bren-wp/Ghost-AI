// Ghost AI by Brendigo
// Ghost AI has one supported appearance: dark. Historic light/system choices
// are migrated to dark on startup; the old API remains safe for callers.
import { getCurrentWindow } from '@tauri-apps/api/window'
import { create } from 'zustand'
import { logger } from '@/lib/logger'

export type ThemePreference = 'dark'
export type ResolvedTheme = 'dark'
export const THEME_PREFERENCES = ['dark'] as const

const THEME_KEY = 'ghost_ai_theme'

function applyDark() {
  document.documentElement.classList.add('dark')
  document.documentElement.style.colorScheme = 'dark'
  try {
    localStorage.setItem(THEME_KEY, 'dark')
  } catch {
    // Restricted storage should not block startup.
  }
}

function updateNativeTheme() {
  if (!('__TAURI_INTERNALS__' in window)) return
  getCurrentWindow().setTheme('dark').catch((error) => logger.warn('Native theme:', error))
}

interface ThemeState {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'dark',
  resolved: 'dark',
  setPreference: () => {
    applyDark()
    updateNativeTheme()
    set({ preference: 'dark', resolved: 'dark' })
  },
}))

export function useResolvedTheme(): ResolvedTheme {
  return useThemeStore((state) => state.resolved)
}

export function initTheme() {
  applyDark()
  updateNativeTheme()
}
