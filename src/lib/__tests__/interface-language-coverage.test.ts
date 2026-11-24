// Ghost AI by Brendigo
import { describe, expect, it } from 'vitest'
import i18n, { changeLanguage, getInterfaceTranslationStatus, supportedLanguages } from '@/lib/i18n'
import providerEnglish from '@/locales/en/providers.json'
import onboardingEnglish from '@/locales/en/onboarding.json'
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


describe('interface reading direction', () => {
  it('sets the document locale and RTL direction, and restores LTR on switching back', async () => {
    const initial = i18n.language
    try {
      await changeLanguage('ar')
      expect(document.documentElement.lang).toBe('ar')
      expect(document.documentElement.dir).toBe('rtl')
      await changeLanguage('de')
      expect(document.documentElement.lang).toBe('de')
      expect(document.documentElement.dir).toBe('ltr')
    } finally {
      await i18n.changeLanguage(initial || 'en')
    }
  })
})


describe('onboarding locale completeness', () => {
  it.each(supportedLanguages.map(({ code }) => code))('has every onboarding key in %s', (code) => {
    for (const key of Object.keys(onboardingEnglish)) {
      expect(i18n.getResource(code, 'onboarding', key)).toEqual(expect.any(String))
      expect(i18n.getResource(code, 'onboarding', key).trim()).not.toBe('')
    }
  })
})
