// Ghost AI by Brendigo
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const setTheme = vi.fn(() => Promise.resolve())
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ setTheme }),
}))

async function loadTheme() {
  vi.resetModules()
  return import('@/lib/theme')
}

describe('dark-only appearance', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    setTheme.mockClear()
    Object.assign(window, { __TAURI_INTERNALS__: {} })
  })
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__
  })

  it.each(['light', 'system', 'dark'])('migrates saved %s to dark before showing the app', async (oldPreference) => {
    localStorage.setItem('ghost_ai_theme', oldPreference)
    const { initTheme, useThemeStore } = await loadTheme()
    initTheme()
    expect(useThemeStore.getState().preference).toBe('dark')
    expect(useThemeStore.getState().resolved).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem('ghost_ai_theme')).toBe('dark')
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('never exposes a light or system setting', async () => {
    const { THEME_PREFERENCES, useThemeStore } = await loadTheme()
    expect(THEME_PREFERENCES).toEqual(['dark'])
    useThemeStore.getState().setPreference('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
