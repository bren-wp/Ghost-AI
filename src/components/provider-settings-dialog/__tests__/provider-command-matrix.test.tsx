// Ghost AI by Brendigo
import { act, renderHook } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFetchModels } from '../useFetchModels'
import { BUILTIN_PROVIDERS, isSupportedFetchProvider } from '../constants'
import type { LLMProvider } from '../types'
import '@/lib/i18n'

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const mockInvoke = vi.mocked(invoke)

type ModelFetchCase = {
  provider: LLMProvider
  key: string
  compatibility: string
  command: string
  args: Record<string, string>
}

const scenarios: ModelFetchCase[] = [
  {
    provider: { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
    key: 'sk-test',
    compatibility: 'openai',
    command: 'fetch_openai_models',
    args: { apiKey: 'sk-test', baseUrl: 'https://api.openai.com/v1' },
  },
  {
    provider: { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
    key: 'sk-test',
    compatibility: 'openai',
    command: 'fetch_openrouter_models',
    args: { apiKey: 'sk-test', baseUrl: 'https://openrouter.ai/api/v1' },
  },
  {
    provider: { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com' },
    key: 'sk-test',
    compatibility: 'anthropic',
    command: 'fetch_anthropic_models',
    args: { apiKey: 'sk-test', baseUrl: 'https://api.anthropic.com' },
  },
  {
    provider: { id: 'ollama', name: 'Ollama', baseUrl: 'http://localhost:11434' },
    key: '',
    compatibility: 'openai',
    command: 'fetch_ollama_models',
    args: { baseUrl: 'http://localhost:11434' },
  },
  {
    provider: { id: 'lmstudio', name: 'LM Studio', baseUrl: 'http://localhost:1234/v1' },
    key: '',
    compatibility: 'openai',
    command: 'fetch_provider_models',
    args: { providerType: 'lmstudio', apiKey: 'no-key', baseUrl: 'http://localhost:1234/v1' },
  },
  {
    provider: { id: 'gpustack', name: 'GPUStack', baseUrl: 'http://localhost:8080/v1' },
    key: '',
    compatibility: 'openai',
    command: 'fetch_provider_models',
    args: { providerType: 'gpustack', apiKey: 'no-key', baseUrl: 'http://localhost:8080/v1' },
  },
  {
    provider: { id: 'ovms', name: 'OVMS', baseUrl: 'http://localhost:8000/v3' },
    key: '',
    compatibility: 'openai',
    command: 'fetch_provider_models',
    args: { providerType: 'ovms', apiKey: 'no-key', baseUrl: 'http://localhost:8000/v3' },
  },
  {
    provider: { id: 'custom_openai', name: 'Custom OpenAI', baseUrl: 'https://local.example.com/v1', isCustom: true },
    key: 'sk-custom',
    compatibility: 'openai',
    command: 'fetch_provider_models',
    args: { providerType: 'openai', apiKey: 'sk-custom', baseUrl: 'https://local.example.com/v1' },
  },
  {
    provider: { id: 'custom_anthropic', name: 'Custom Anthropic', baseUrl: 'https://local.example.com/anthropic', isCustom: true },
    key: 'sk-custom',
    compatibility: 'anthropic',
    command: 'fetch_anthropic_models',
    args: { apiKey: 'sk-custom', baseUrl: 'https://local.example.com/anthropic' },
  },
]

// Cover every visible provider that advertises automatic model discovery.
// Keep dedicated protocol cases above explicit rather than deriving them from
// the hook implementation.
const coveredProviders = new Set(scenarios.map(({ provider }) => provider.id))
for (const provider of BUILTIN_PROVIDERS) {
  if (!isSupportedFetchProvider(provider.id) || coveredProviders.has(provider.id)) continue
  scenarios.push({
    provider,
    key: 'sk-test',
    compatibility: 'openai',
    command: 'fetch_provider_models',
    args: { providerType: provider.id, apiKey: 'sk-test', baseUrl: provider.baseUrl },
  })
}
for (const provider of BUILTIN_PROVIDERS.filter(({ id }) =>
  ['lmstudio', 'gpustack', 'ovms'].includes(id)
)) {
  scenarios.push({
    provider,
    key: 'local-protected-key',
    compatibility: 'openai',
    command: 'fetch_provider_models',
    args: { providerType: provider.id, apiKey: 'local-protected-key', baseUrl: provider.baseUrl },
  })
}

beforeEach(() => mockInvoke.mockReset())

describe('AI provider command routing', () => {
  it.each(scenarios)('routes $provider.name model discovery via $command', async ({ provider, key, compatibility, command, args }) => {
    mockInvoke.mockResolvedValue([{ id: 'model-1', name: 'Ready' }])

    const { result } = renderHook(() => useFetchModels({
      selectedProvider: provider,
      apiKey: key,
      apiBaseUrl: provider.baseUrl,
      compatibilityType: compatibility,
    }))
    await act(async () => { await result.current.handleFetchModels() })

    const fetchCalls = mockInvoke.mock.calls.filter(([name]) => String(name).startsWith('fetch_'))
    expect(fetchCalls).toHaveLength(1)
    expect(mockInvoke).toHaveBeenCalledWith(command, args)
    expect(result.current.availableModels.map((model) => model.id)).toEqual(['model-1'])
    expect(result.current.fetchError).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('does not contact remote OpenAI without an API key', async () => {
    const provider: LLMProvider = { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' }
    const { result } = renderHook(() => useFetchModels({
      selectedProvider: provider,
      apiKey: '',
      apiBaseUrl: provider.baseUrl,
      compatibilityType: 'openai',
    }))
    await act(async () => { await result.current.handleFetchModels() })
    expect(mockInvoke.mock.calls.filter(([name]) => String(name).startsWith('fetch_'))).toHaveLength(0)
    expect(result.current.fetchError).toBeTruthy()
  })
})
