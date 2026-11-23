// Ghost AI by Brendigo
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import i18n from '@/lib/i18n'
import { ProviderSettingsDialog } from '../provider-settings-dialog'
import { LLMProviderSettings } from '@/components/settings-dialog/llm-provider-settings'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useModelStore } from '@/stores/modelStore'
import type { Model, Provider } from '@/types'

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

const mockedInvoke = vi.mocked(invoke)

const NOW = '2026-01-01T00:00:00Z'

const provider: Provider = {
  id: 'provider-1',
  name: 'Acme',
  provider_type: 'custom_openai',
  api_key: 'sk-test',
  base_url: 'http://127.0.0.1:18080/llm/v1',
  api_style: 'chat_completions',
  is_enabled: true,
  created_at: NOW,
  updated_at: NOW,
}

const model: Model = {
  id: 'model-1',
  provider_id: provider.id,
  name: 'Acme One',
  model_id: 'acme-1',
  is_starred: false,
  is_deleted: false,
  created_at: NOW,
  updated_at: NOW,
}

function mockBackend({ models, providers }: { models: Model[]; providers: Provider[] }) {
  mockedInvoke.mockImplementation((async (cmd: string) => {
    switch (cmd) {
      case 'list_all_models':
        return [...models]
      case 'list_providers':
        return [...providers]
      case 'fetch_provider_models':
      case 'fetch_anthropic_models':
        return [{ id: 'acme-1', name: 'Acme One' }]
      case 'is_keychain_available':
        return true
      default:
        return null
    }
  }) as never)
}

function renderDialog(initialProviderId?: string) {
  return render(
    <ProviderSettingsDialog open initialProviderId={initialProviderId} onOpenChange={vi.fn()} />
  )
}

beforeAll(async () => {
  await i18n.changeLanguage('en')
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

beforeEach(() => {
  mockedInvoke.mockReset()
  useModelStore.setState({ models: [], providers: [] })
})

describe('ProviderSettingsDialog deep link', () => {
  it('shows a safe retry state when provider loading fails', async () => {
    let available = false
    mockedInvoke.mockImplementation((async (command: string) => {
      if (command === 'list_all_models') return []
      if (command === 'list_providers') {
        if (!available) throw new Error('database error containing sk-private-value')
        return []
      }
      return null
    }) as never)

    renderDialog()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Unable to load AI providers or models')
    expect(alert).not.toHaveTextContent('sk-private-value')
    available = true
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('button', { name: 'Save Configuration' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('focuses the provider and opens model selection when it has no models', async () => {
    mockBackend({ models: [], providers: [provider] })

    renderDialog(provider.id)

    expect(await screen.findByText('Available Models')).toBeInTheDocument()
    expect(mockedInvoke).toHaveBeenCalledWith('fetch_provider_models', {
      providerType: 'openai',
      apiKey: 'sk-test',
      baseUrl: provider.base_url,
    })
  })

  it('preserves unsaved form edits when the model store refreshes in the background', async () => {
    mockBackend({ models: [model], providers: [provider] })
    renderDialog(provider.id)

    // The dialog initially renders the default provider before applying its
    // deep link. Re-query the actual focused provider field on every retry:
    // an element captured too early can belong to the previous form.
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toHaveValue('sk-test')
      expect(screen.getByDisplayValue(model.name)).toBeInTheDocument()
    })
    const key = screen.getByLabelText('API Key')
    const nameInput = screen.getByDisplayValue(model.name)

    fireEvent.change(key, { target: { value: 'sk-unsaved-edit' } })
    fireEvent.change(nameInput, { target: { value: 'Unsaved model name' } })

    act(() => {
      useModelStore.setState({
        providers: [{ ...provider }],
        models: [{ ...model, name: 'Refreshed backend model' }],
      })
    })

    expect(screen.getByLabelText('API Key')).toHaveValue('sk-unsaved-edit')
    expect(screen.getByDisplayValue('Unsaved model name')).toBeInTheDocument()
  })

  it('does not fetch when the focused provider already has a model', async () => {
    mockBackend({ models: [model], providers: [provider] })

    renderDialog(provider.id)

    await waitFor(() => {
      expect(screen.getAllByText('Acme').length).toBeGreaterThan(0)
    })
    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith('list_providers')
    })

    const fetched = mockedInvoke.mock.calls.some(([cmd]) => cmd === 'fetch_provider_models')
    expect(fetched).toBe(false)
  })

  it('does not auto-fetch for Anthropic-compatible custom providers', async () => {
    const anthropic: Provider = { ...provider, provider_type: 'custom_anthropic' }
    mockBackend({ models: [], providers: [anthropic] })

    renderDialog(anthropic.id)

    await waitFor(() => {
      expect(screen.getAllByText('Acme').length).toBeGreaterThan(0)
    })
    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith('list_providers')
    })

    const fetched = mockedInvoke.mock.calls.some(([cmd]) => cmd === 'fetch_provider_models')
    expect(fetched).toBe(false)
  })

  it('enables Save once a new provider has a key, even without models', async () => {
    mockBackend({ models: [], providers: [] })

    renderDialog()

    const save = await screen.findByRole('button', { name: 'Save Configuration' })
    expect(save).toBeDisabled()

    const key = screen.getByLabelText('API Key')
    fireEvent.change(key, { target: { value: 'sk-test' } })
    expect(key).toHaveValue('sk-test')

    // Re-query after React's async provider-hydration render; a captured DOM
    // node may have been replaced if the dialog finished loading.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Configuration' })).toBeEnabled()
    })
  })
})

describe.each(['dialog', 'settings'] as const)('Add Provider in %s', (entryPoint) => {
  function renderSettings() {
    if (entryPoint === 'dialog') return renderDialog()
    return render(
      <SidebarProvider>
        <LLMProviderSettings open />
      </SidebarProvider>
    )
  }

  // Both entry points expose a native picker. Test the real interaction
  // instead of looking for buttons removed by the responsive redesign.
  function selectProvider(value: string) {
    fireEvent.change(screen.getByRole('combobox', { name: 'Select a provider' }), {
      target: { value },
    })
  }

  function expectEmptyForm() {
    expect(screen.getByRole('textbox', { name: /^Provider Name/ })).toHaveValue('')
    expect(screen.getByLabelText('API Key')).toHaveValue('')
    expect(screen.getByLabelText(/^API Base URL/)).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Save Configuration' })).toBeDisabled()
    expect(screen.queryByText(model.name)).not.toBeInTheDocument()
  }

  it('starts a fresh form after editing a custom provider', async () => {
    mockBackend({ models: [model], providers: [provider] })
    renderSettings()

    await screen.findByRole('option', { name: provider.name })
    selectProvider(`custom:${provider.id}`)
    await waitFor(() => expect(screen.getByLabelText('API Key')).toHaveValue(provider.api_key))

    selectProvider('new')

    await waitFor(expectEmptyForm)
  })

  it('starts a fresh form after saving a new custom provider', async () => {
    const providers: Provider[] = []
    mockBackend({ models: [], providers })
    const backend = mockedInvoke.getMockImplementation()!
    mockedInvoke.mockImplementation((async (cmd: string, args: unknown) => {
      if (cmd === 'create_provider') {
        const saved = {
          ...provider,
          ...(args as { req: Partial<Provider> }).req,
        }
        providers.push(saved)
        return saved
      }
      return backend(cmd, args as never)
    }) as never)
    renderSettings()

    await waitFor(() => expect(mockedInvoke).toHaveBeenCalledWith('list_providers'))
    selectProvider('new')
    fireEvent.change(screen.getByRole('textbox', { name: /^Provider Name/ }), { target: { value: provider.name } })
    fireEvent.change(screen.getByLabelText('API Key'), { target: { value: provider.api_key } })
    fireEvent.change(screen.getByLabelText(/^API Base URL/), {
      target: { value: provider.base_url },
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Anthropic Compatible' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }))

    // Saved with zero models: the Anthropic model fetch opens right away.
    await waitFor(() =>
      expect(mockedInvoke).toHaveBeenCalledWith('fetch_anthropic_models', {
        apiKey: provider.api_key,
        baseUrl: provider.base_url,
      })
    )
    expect(mockedInvoke).toHaveBeenCalledWith('create_provider', expect.anything())
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument())

    selectProvider('new')

    await waitFor(expectEmptyForm)
  })
})
