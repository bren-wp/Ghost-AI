// Ghost AI by Brendigo
import { describe, expect, it } from 'vitest'
import i18n, { getInterfaceTranslationStatus, supportedLanguages } from '@/lib/i18n'
import providerEnglish from '@/locales/en/providers.json'
import { localeOverrides } from '@/lib/ghost-ai-locale-overrides'

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

  it.each(['hr', 'de'])('covers every provider key in %s without fallback', (code) => {
    expect(Object.keys(localeOverrides[code].providers).sort()).toEqual(Object.keys(providerEnglish).sort())
    expect(i18n.getResource(code, 'providers', 'testConnection')).toBe(localeOverrides[code].providers.testConnection)
  })

  it('returns a supported status for every declared locale', () => {
    for (const language of supportedLanguages) {
      expect(['complete', 'partial', 'fallback']).toContain(
        getInterfaceTranslationStatus(language.code)
      )
    }
  })
})
