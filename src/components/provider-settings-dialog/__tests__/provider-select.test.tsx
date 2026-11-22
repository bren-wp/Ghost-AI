// Ghost AI by Brendigo
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/lib/i18n'
import { ProviderSelect } from '../provider-select'
import type { Provider } from '@/types'

const NOW = '2026-01-01T00:00:00Z'
const storedBuiltin: Provider = {
  id: 'builtin-anthropic-row',
  name: 'Anthropic',
  provider_type: 'anthropic',
  base_url: 'https://api.anthropic.com',
  is_enabled: true,
  created_at: NOW,
  updated_at: NOW,
}
const storedCustom: Provider = {
  ...storedBuiltin,
  id: 'custom-row',
  name: 'My inference server',
  provider_type: 'custom_openai',
  base_url: 'http://localhost:1234/v1',
}

afterEach(async () => { await i18n.changeLanguage('en') })

describe('provider selection navigation', () => {
  it('keeps a built-in selected even if a saved row ID is present', () => {
    render(
      <ProviderSelect
        selectedProvider={{ id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com' }}
        editingCustomProviderId={storedBuiltin.id}
        storeProviders={[storedBuiltin, storedCustom]}
        onSelectProvider={vi.fn()}
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Select a provider' })).toHaveValue('anthropic')
  })

  it('selects a stored custom provider by its real ID', () => {
    render(
      <ProviderSelect
        selectedProvider={{ id: 'custom_openai', name: 'My inference server', baseUrl: storedCustom.base_url!, isCustom: true }}
        editingCustomProviderId={storedCustom.id}
        storeProviders={[storedBuiltin, storedCustom]}
        onSelectProvider={vi.fn()}
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Select a provider' })).toHaveValue('custom:custom-row')
  })

  it('uses the providers translation for the label and add action', async () => {
    await i18n.changeLanguage('zh-CN')
    render(
      <ProviderSelect
        selectedProvider={{ id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' }}
        storeProviders={[]}
        onSelectProvider={vi.fn()}
      />,
    )
    expect(screen.getByRole('combobox', { name: '选择提供商' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '+ 添加提供商' })).toBeInTheDocument()
  })
})
