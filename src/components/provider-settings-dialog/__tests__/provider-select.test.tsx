// Ghost AI by Brendigo
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ProviderSelect } from '../provider-select'
import { BUILTIN_PROVIDERS } from '../constants'
import type { Provider } from '@/types'

const custom: Provider = {
  id: 'custom-1',
  name: 'Internal endpoint',
  provider_type: 'custom_openai',
  api_key: '',
  base_url: 'http://127.0.0.1:5555/v1',
  api_style: 'chat_completions',
  is_enabled: true,
  created_at: '2026-11-22T00:00:00Z',
  updated_at: '2026-11-22T00:00:00Z',
}

describe('responsive provider picker', () => {
  it('switches built-in providers without opening a second sidebar', () => {
    const onSelectProvider = vi.fn()
    render(
      <ProviderSelect
        selectedProvider={BUILTIN_PROVIDERS[0]}
        storeProviders={[]}
        onSelectProvider={onSelectProvider}
      />
    )
    fireEvent.change(screen.getByRole('combobox', { name: 'AI provider' }), {
      target: { value: BUILTIN_PROVIDERS[1].id },
    })
    expect(onSelectProvider).toHaveBeenCalledWith(BUILTIN_PROVIDERS[1])
  })

  it('selects a saved custom provider with its endpoint', () => {
    const onSelectProvider = vi.fn()
    render(
      <ProviderSelect
        selectedProvider={BUILTIN_PROVIDERS[0]}
        storeProviders={[custom]}
        onSelectProvider={onSelectProvider}
      />
    )
    fireEvent.change(screen.getByRole('combobox', { name: 'AI provider' }), {
      target: { value: 'custom:custom-1' },
    })
    expect(onSelectProvider).toHaveBeenCalledWith(expect.objectContaining({
      name: custom.name,
      baseUrl: custom.base_url,
      isCustom: true,
    }))
  })
})
