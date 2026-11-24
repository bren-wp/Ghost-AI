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

  it.each(['nl', 'ja', 'ar', 'unknown'])('reports fallback-only locale %s', (code) => {
    expect(getInterfaceTranslationStatus(code)).toBe('fallback')
  })

  it('returns a supported status for every declared locale', () => {
    for (const language of supportedLanguages) {
      expect(['complete', 'partial', 'fallback']).toContain(
        getInterfaceTranslationStatus(language.code)
      )
    }
  })
})
