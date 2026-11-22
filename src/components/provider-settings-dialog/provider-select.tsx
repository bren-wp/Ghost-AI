// Ghost AI by Brendigo
'use client'

import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { Provider } from '@/types'
import type { LLMProvider } from './types'
import { isCustomProviderType } from './types'
import { BUILTIN_PROVIDERS, CUSTOM_PROVIDER } from './constants'

interface ProviderSelectProps {
  selectedProvider: LLMProvider
  editingCustomProviderId?: string | null
  storeProviders: Provider[]
  onSelectProvider: (provider: LLMProvider, storedProviderId?: string) => void
  className?: string
}

/** Compact navigation never assumes enough width for a second sidebar. */
export function ProviderSelect({
  selectedProvider,
  editingCustomProviderId,
  storeProviders,
  onSelectProvider,
  className = '',
}: ProviderSelectProps) {
  const selectId = useId()
  const { t } = useTranslation('providers')
  const customProviders = storeProviders.filter((item) => isCustomProviderType(item.provider_type))
  // Only custom provider records have a custom: option. After saving a
  // built-in provider, the editor can hold its database row ID as well.
  // Never assign that ID to a missing select option (which visually reverts
  // to OpenAI while the form still edits another provider).
  const selectedCustom = customProviders.find((p) => p.id === editingCustomProviderId)
  const currentValue = selectedCustom
    ? `custom:${selectedCustom.id}`
    : isCustomProviderType(selectedProvider.id) ? 'new' : selectedProvider.id

  return (
    <div className={`min-w-0 space-y-1 ${className}`}>
      <label htmlFor={selectId} className="block text-xs font-medium text-muted-foreground">
        {t('selectProvider')}
      </label>
      <select
        id={selectId}
        aria-label={t('selectProvider')}
        className="h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        value={currentValue}
        onChange={(event) => {
          const value = event.target.value
          if (value === 'new') return onSelectProvider(CUSTOM_PROVIDER)
          if (value.startsWith('custom:')) {
            const provider = customProviders.find((item) => item.id === value.slice(7))
            if (!provider) return
            return onSelectProvider({
              id: provider.provider_type,
              name: provider.name,
              baseUrl: provider.base_url || '',
              isCustom: true,
            }, provider.id)
          }
          const builtin = BUILTIN_PROVIDERS.find((item) => item.id === value)
          if (builtin) onSelectProvider(builtin)
        }}
      >
        {BUILTIN_PROVIDERS.map((provider) => (
          <option value={provider.id} key={provider.id}>{provider.name}</option>
        ))}
        {customProviders.map((provider) => (
          <option value={`custom:${provider.id}`} key={provider.id}>{provider.name}</option>
        ))}
        <option value="new">+ {t('addProvider')}</option>
      </select>
    </div>
  )
}
