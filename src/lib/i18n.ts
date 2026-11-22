// Ghost AI by Brendigo
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { localeOverrides } from './ghost-ai-locale-overrides'

import common_en from '@/locales/en/common.json'
import common_zhCN from '@/locales/zh-CN/common.json'
import chat_en from '@/locales/en/chat.json'
import chat_zhCN from '@/locales/zh-CN/chat.json'
import settings_en from '@/locales/en/settings.json'
import settings_zhCN from '@/locales/zh-CN/settings.json'
import providers_en from '@/locales/en/providers.json'
import providers_zhCN from '@/locales/zh-CN/providers.json'
import sidebar_en from '@/locales/en/sidebar.json'
import sidebar_zhCN from '@/locales/zh-CN/sidebar.json'
import onboarding_en from '@/locales/en/onboarding.json'
import onboarding_zhCN from '@/locales/zh-CN/onboarding.json'
import sync_en from '@/locales/en/sync.json'
import sync_zhCN from '@/locales/zh-CN/sync.json'
import assistants_en from '@/locales/en/assistants.json'
import assistants_zhCN from '@/locales/zh-CN/assistants.json'
import tools_en from '@/locales/en/tools.json'
import tools_zhCN from '@/locales/zh-CN/tools.json'
import prompts_en from '@/locales/en/prompts.json'
import prompts_zhCN from '@/locales/zh-CN/prompts.json'
import attachments_en from '@/locales/en/attachments.json'
import attachments_zhCN from '@/locales/zh-CN/attachments.json'
import messages_en from '@/locales/en/messages.json'
import messages_zhCN from '@/locales/zh-CN/messages.json'
import search_en from '@/locales/en/search.json'
import search_zhCN from '@/locales/zh-CN/search.json'
import skills_en from '@/locales/en/skills.json'
import skills_zhCN from '@/locales/zh-CN/skills.json'

const LANGUAGE_KEY = 'ghost_ai_language'

export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'cs', name: 'Čeština' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'sl', name: 'Slovenščina' },
  { code: 'hu', name: 'Magyar' },
  { code: 'ro', name: 'Română' },
  { code: 'bg', name: 'Български' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'uk', name: 'Українська' },
  { code: 'ru', name: 'Русский' },
  { code: 'sr', name: 'Srpski' },
  { code: 'bs', name: 'Bosanski' },
  { code: 'da', name: 'Dansk' },
  { code: 'sv', name: 'Svenska' },
  { code: 'no', name: 'Norsk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'et', name: 'Eesti' },
  { code: 'lv', name: 'Latviešu' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ไทย' },
] as const

export type SupportedLanguage = (typeof supportedLanguages)[number]['code']

const resources: Record<string, Record<string, Record<string, unknown>>> = {
  en: {
    common: common_en,
    chat: chat_en,
    settings: settings_en,
    providers: providers_en,
    sidebar: sidebar_en,
    onboarding: onboarding_en,
    sync: sync_en,
    assistants: assistants_en,
    tools: tools_en,
    prompts: prompts_en,
    attachments: attachments_en,
    messages: messages_en,
    search: search_en,
    skills: skills_en,
  },
  'zh-CN': {
    common: common_zhCN,
    chat: chat_zhCN,
    settings: settings_zhCN,
    providers: providers_zhCN,
    sidebar: sidebar_zhCN,
    onboarding: onboarding_zhCN,
    sync: sync_zhCN,
    assistants: assistants_zhCN,
    tools: tools_zhCN,
    prompts: prompts_zhCN,
    attachments: attachments_zhCN,
    messages: messages_zhCN,
    search: search_zhCN,
    skills: skills_zhCN,
  },
}

// Untranslated namespaces intentionally fall back to English rather than showing
// machine-generated or misleading text. Core UI overrides are bundled separately.
for (const { code } of supportedLanguages) {
  if (!resources[code]) resources[code] = localeOverrides[code] ?? {}
}

export const hasBundledTranslation = (code: string) =>
  code === 'en' || code === 'zh-CN' || Boolean(localeOverrides[code])

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lng: string) => void) => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY)
      if (saved && supportedLanguages.some((item) => item.code === saved)) {
        callback(saved)
        return
      }
    } catch {
      // Private mode may deny access to localStorage.
    }
    callback('en')
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    try { localStorage.setItem(LANGUAGE_KEY, lng) } catch { /* best effort */ }
  },
}

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'common',
      'chat',
      'settings',
      'providers',
      'sidebar',
      'onboarding',
      'assistants',
      'tools',
      'prompts',
      'attachments',
      'messages',
      'search',
      'skills',
    ],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n

export const changeLanguage = async (language: SupportedLanguage) => {
  await i18n.changeLanguage(language)
  try { localStorage.setItem(LANGUAGE_KEY, language) } catch { /* best effort */ }
}

export const getCurrentLanguage = (): SupportedLanguage => {
  return supportedLanguages.find((item) => item.code === i18n.language)?.code ?? 'en'
}
