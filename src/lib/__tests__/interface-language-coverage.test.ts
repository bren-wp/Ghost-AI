// Ghost AI by Brendigo
import { describe, expect, it } from 'vitest'
import { getInterfaceTranslationStatus, supportedLanguages } from '@/lib/i18n'

describe('bundled interface translation status', () => {
  it('reports English source resources as complete', () => {
    expect(getInterfaceTranslationStatus('en')).toBe('complete')
  })

  it.each(['hr', 'de', 'es', 'fr', 'pt', 'it', 'zh-CN'])(
    'does not count fallback keys as translations for %s',
    (code) => {
      expect(getInterfaceTranslationStatus(code)).toBe('partial')
    }
  )

  it('reports unknown locales as fallback-only', () => {
    expect(getInterfaceTranslationStatus('unknown')).toBe('fallback')
  })

  it('bundles actual core UI translations for every supported language', () => {
    for (const { code } of supportedLanguages) {
      expect(getInterfaceTranslationStatus(code)).not.toBe('fallback')
    }
  })

  it('returns a supported status for every declared locale', () => {
    for (const language of supportedLanguages) {
      expect(['complete', 'partial', 'fallback']).toContain(
        getInterfaceTranslationStatus(language.code)
      )
    }
  })
})
