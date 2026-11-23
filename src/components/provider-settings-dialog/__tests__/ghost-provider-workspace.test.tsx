// Ghost AI by Brendigo — responsive provider workspace regression tests
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useModelStore } from '@/stores/modelStore'
import { ProviderSidebar } from '../provider-sidebar'
import { ProviderForm } from '../provider-form'
import { ModelsTable } from '../models-table'
import type { LLMProvider, ModelItem } from '../types'
import '@/lib/i18n'

const onSelectProvider = vi.fn()
const noop = () => {}
const ollama: LLMProvider = { id: 'ollama', name: 'Ollama', baseUrl: 'http://localhost:11434' }

const models: ModelItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: `model-${index}`,
  modelId: `llama-model-${index}`,
  displayName: `Llama ${index}`,
  isExisting: true,
}))

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      matches: false,
      media,
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
  onSelectProvider.mockReset()
  useModelStore.setState({ providers: [], models: [] })
})

describe('Ghost AI provider workspace', () => {
  it('filters cloud and local providers without losing navigation', () => {
    render(
      <SidebarProvider>
        <ProviderSidebar
          selectedProvider={ollama}
          onSelectProvider={onSelectProvider}
          storeProviders={[]}
        />
      </SidebarProvider>
    )
    expect(screen.getByRole('navigation', { name: 'Providers' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search providers...' }), {
      target: { value: 'ollama' },
    })
    expect(screen.getByRole('button', { name: 'Ollama' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: 'OpenAI' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ollama' }))
    expect(onSelectProvider).toHaveBeenCalledWith(ollama)
  })

  it('hides API credentials for keyless local runtimes and explains model-first testing', () => {
    render(
      <ProviderForm
        apiKey=""
        onApiKeyChange={noop}
        showApiKey={false}
        onShowApiKeyChange={noop}
        apiBaseUrl={ollama.baseUrl}
        onApiBaseUrlChange={noop}
        selectedProvider={ollama}
        providerName=""
        onProviderNameChange={noop}
        apiStyle="chat_completions"
        onApiStyleChange={noop}
        compatibilityType="openai"
        onCompatibilityTypeChange={noop}
        models={[]}
      />
    )
    expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument()
    expect(screen.getByText('No API key required')).toBeInTheDocument()
    expect(screen.getByLabelText('API Base URL')).toHaveValue(ollama.baseUrl)
    expect(screen.getByRole('button', { name: 'Test Connection' })).toBeDisabled()
    expect(
      screen.getByText('No model available for testing. Add a model first.')
    ).toBeInTheDocument()
  })

  it('renders full model identifiers without a clipped table and filters the configured list', () => {
    render(
      <ModelsTable
        models={models}
        selectedProvider={ollama}
        apiKey=""
        apiBaseUrl={ollama.baseUrl}
        onOpenFetchModal={noop}
        onOpenAddModelDialog={noop}
        onUpdateModelName={noop}
        onDeleteModel={noop}
        onModelSettings={noop}
      />
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText('llama-model-0')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search configured models...' }), {
      target: { value: 'llama-model-4' },
    })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('llama-model-4')).toBeInTheDocument()
  })
})
