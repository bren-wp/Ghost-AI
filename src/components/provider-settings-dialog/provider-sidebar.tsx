// Ghost AI by Brendigo
'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Cloud, HardDrive, Plus, Search, Sparkles } from 'lucide-react'
import type { Provider } from '@/types'
import type { LLMProvider } from './types'
import { isCustomProviderType } from './types'
import { BUILTIN_PROVIDERS, CUSTOM_PROVIDER } from './constants'
import { ProviderLogo } from './provider-logo'
import { useModelStore } from '@/stores/modelStore'
import { modelCountsByProvider } from '@/lib/model-setup'
import { cn } from '@/lib/utils'

interface ProviderSidebarProps {
  selectedProvider: LLMProvider
  onSelectProvider: (provider: LLMProvider, storedProviderId?: string) => void
  storeProviders: Provider[]
  editingCustomProviderId?: string | null
  className?: string
}

const LOCAL_PROVIDER_IDS = new Set(['ollama', 'lmstudio', 'gpustack', 'ovms'])

export function ProviderSidebar({
  selectedProvider,
  onSelectProvider,
  storeProviders,
  editingCustomProviderId,
  className,
}: ProviderSidebarProps) {
  const { t } = useTranslation('providers')
  const [query, setQuery] = useState('')
  const models = useModelStore((state) => state.models)
  const modelCounts = useMemo(() => modelCountsByProvider(models), [models])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredProviders = useMemo(
    () => BUILTIN_PROVIDERS.filter((provider) => provider.name.toLocaleLowerCase().includes(normalizedQuery)),
    [normalizedQuery],
  )
  const cloudProviders = filteredProviders.filter((provider) => !LOCAL_PROVIDER_IDS.has(provider.id))
  const localProviders = filteredProviders.filter((provider) => LOCAL_PROVIDER_IDS.has(provider.id))
  const customProviders = storeProviders.filter(
    (provider) => isCustomProviderType(provider.provider_type) && provider.name.toLocaleLowerCase().includes(normalizedQuery),
  )

  const providerButton = (provider: LLMProvider) => {
    const saved = storeProviders.find((item) => item.provider_type === provider.id)
    const active = provider.id === selectedProvider.id && !editingCustomProviderId
    return (
      <button
        key={provider.id}
        type="button"
        aria-current={active ? 'page' : undefined}
        onClick={() => onSelectProvider(provider)}
        className={cn(
          'group flex min-h-10 w-full min-w-0 items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left text-sm transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E5FF]',
          active
            ? 'border-[#00E5FF]/25 bg-[#00E5FF]/10 font-medium text-[#91F4FF]'
            : 'text-[#B9C8DA] hover:bg-white/5 hover:text-white',
        )}
      >
        <span aria-hidden="true" className="shrink-0"><ProviderLogo providerType={provider.id} /></span>
        <span className="min-w-0 flex-1 truncate">{provider.name}</span>
        {saved && <ProviderStatus count={modelCounts[saved.id] ?? 0} />}
      </button>
    )
  }

  return (
    <aside className={cn('hidden h-full min-h-0 w-[236px] shrink-0 flex-col border-r border-[#30415D]/60 bg-[#0B1423] md:flex xl:w-[254px]', className)}>
      <div className="shrink-0 border-b border-[#30415D]/60 px-4 pb-4 pt-5">
        <div className="mb-5 flex items-center gap-3">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#874CFF] text-[#080F1A] shadow-[0_0_24px_rgba(0,229,255,0.12)]">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-white">Ghost AI</p>
            <p className="text-[11px] font-medium tracking-wide text-[#95A8C2]">by Brendigo</p>
          </div>
        </div>
        <label htmlFor="ghost-provider-search" className="sr-only">{t('searchProviders')}</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#93A7C2]" />
          <input
            id="ghost-provider-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchProviders')}
            className="h-10 w-full min-w-0 rounded-xl border border-[#34445E] bg-[#111F32] pl-9 pr-3 text-sm text-white placeholder:text-[#93A7C2] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#00E5FF]"
          />
        </div>
      </div>
      <nav aria-label={t('providers')} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
        {cloudProviders.length > 0 && (
          <section aria-label={t('cloudProviders')}>
            <h3 className="mb-2 flex items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA5C5]">
              <Cloud aria-hidden="true" className="size-3.5" /> {t('cloudProviders')}
            </h3>
            <div className="space-y-0.5">{cloudProviders.map(providerButton)}</div>
          </section>
        )}
        {localProviders.length > 0 && (
          <section aria-label={t('localRuntimes')}>
            <h3 className="mb-2 flex items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA5C5]">
              <HardDrive aria-hidden="true" className="size-3.5" /> {t('localRuntimes')}
            </h3>
            <div className="space-y-0.5">{localProviders.map(providerButton)}</div>
          </section>
        )}
        {(customProviders.length > 0 || !normalizedQuery) && (
          <section aria-label={t('custom')}>
            <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA5C5]">{t('custom')}</h3>
            <div className="space-y-0.5">
              {customProviders.map((cp) => {
                const active = editingCustomProviderId === cp.id
                return (
                  <button
                    key={cp.id}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => onSelectProvider({
                      id: cp.provider_type,
                      name: cp.name,
                      baseUrl: cp.base_url || '',
                      isCustom: true,
                    }, cp.id)}
                    className={cn(
                      'flex min-h-10 w-full min-w-0 items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-[#00E5FF]',
                      active ? 'border-[#00E5FF]/25 bg-[#00E5FF]/10 text-[#91F4FF]' : 'text-[#B9C8DA] hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <span aria-hidden="true" className="shrink-0"><ProviderLogo providerType={cp.provider_type} name={cp.name} /></span>
                    <span className="min-w-0 flex-1 truncate">{cp.name}</span>
                    <ProviderStatus count={modelCounts[cp.id] ?? 0} />
                  </button>
                )
              })}
              {!normalizedQuery && (
                <button
                  type="button"
                  onClick={() => onSelectProvider(CUSTOM_PROVIDER)}
                  className={cn(
                    'flex min-h-10 w-full items-center gap-3 rounded-xl border border-dashed border-[#405474] px-3 py-2 text-left text-sm text-[#A9E8F3] hover:border-[#00E5FF]/65 hover:bg-[#00E5FF]/10 focus-visible:outline-2 focus-visible:outline-[#00E5FF]',
                    selectedProvider.id === 'custom' && !editingCustomProviderId && 'bg-[#00E5FF]/10',
                  )}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  {t('addProvider')}
                </button>
              )}
            </div>
          </section>
        )}
        {cloudProviders.length === 0 && localProviders.length === 0 && customProviders.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-[#A8B3C8]">{t('noMatchingProviders')}</p>
        )}
      </nav>
    </aside>
  )
}

function ProviderStatus({ count }: { count: number }) {
  const { t } = useTranslation('providers')
  if (count === 0) {
    return (
      <span className="ml-auto" title={t('needsModels')}>
        <AlertTriangle className="size-3.5 text-warning" aria-hidden="true" />
        <span className="sr-only">{t('needsModels')}</span>
      </span>
    )
  }
  return (
    <span className="ml-auto rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-[#C5D5E8]" title={t('modelCount', { count })}>
      {count}
    </span>
  )
}
