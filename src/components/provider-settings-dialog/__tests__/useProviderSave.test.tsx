// Ghost AI by Brendigo
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { logger } from '@/lib/logger'
import i18n from '@/lib/i18n'
import { useProviderSave } from '../useProviderSave'
import type { LLMProvider, ModelItem } from '../types'
import type { Provider } from '@/types'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

void i18n

const NOW = '2026-01-01T00:00:00Z'

const existingProvider: Provider = {
  id: 'provider-1',
  name: 'Acme',
  provider_type: 'custom_openai',
  base_url: 'http://127.0.0.1:18080/llm/v1',
  api_style: 'chat_completions',
  is_enabled: true,
  created_at: NOW,
  updated_at: NOW,
}

const newModel = (id: string): ModelItem => ({
  id,
  displayName: `Model ${id}`,
  modelId: id,
  isExisting: false,
})

function setup({
  models,
  modelsToDelete = [],
  existing = existingProvider,
  providerName = 'Acme',
  apiKey = 'sk-test',
  apiBaseUrl = 'http://127.0.0.1:18080/llm/v1',
  selected,
}: {
  models: ModelItem[]
  modelsToDelete?: string[]
  existing?: Provider | null
  providerName?: string
  apiKey?: string
  apiBaseUrl?: string
  selected?: LLMProvider
}) {
  const onOpenChange = vi.fn()
  const onSavedWithoutModels = vi.fn()
  const onProviderCreated = vi.fn()
  const { result } = renderHook(() =>
    useProviderSave({
      models,
      modelsToDelete,
      originalModelNames: {},
      originalModelIds: {},
      existingProvider: existing,
      apiKey,
      apiBaseUrl,
      providerName,
      apiStyle: 'chat_completions',
      compatibilityType: 'openai',
      selectedProvider: selected ?? (existing
        ? {
            id: existing.provider_type,
            name: existing.name,
            baseUrl: existing.base_url ?? '',
            isCustom: true,
          }
        : { id: 'custom', name: 'Custom', baseUrl: '', isCustom: true }),
      loadExistingData: vi.fn(),
      onOpenChange,
      onProviderCreated,
      onSavedWithoutModels,
    })
  )
  return { result, onOpenChange, onProviderCreated, onSavedWithoutModels }
}

beforeEach(() => {
  vi.mocked(invoke).mockReset()
})

describe('useProviderSave without models', () => {
  it('keeps the dialog open and asks the host to open model selection', async () => {
    vi.mocked(invoke).mockResolvedValue(existingProvider)
    const { result, onOpenChange, onSavedWithoutModels } = setup({ models: [] })

    await act(async () => {
      await result.current.handleSave()
    })

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onSavedWithoutModels).toHaveBeenCalledTimes(1)
    expect(result.current.savedWithoutModels).toBe(true)
  })

  it('closes normally once the provider has a model', async () => {
    vi.mocked(invoke).mockResolvedValue(existingProvider)
    const { result, onOpenChange, onSavedWithoutModels } = setup({ models: [newModel('acme-1')] })

    await act(async () => {
      await result.current.handleSave()
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSavedWithoutModels).not.toHaveBeenCalled()
    expect(result.current.savedWithoutModels).toBe(false)
  })

  it('treats deleting the last model as a zero-model save', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const { result, onOpenChange, onSavedWithoutModels } = setup({
      models: [{ id: 'model-row-1', displayName: 'Old', modelId: 'old', isExisting: true }],
      modelsToDelete: ['model-row-1'],
    })

    await act(async () => {
      await result.current.handleSave()
    })

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onSavedWithoutModels).toHaveBeenCalledTimes(1)
    expect(result.current.savedWithoutModels).toBe(true)
  })
})


describe('API key removal', () => {
  it('passes an explicit empty key so the backend erases a stored secret', async () => {
    const saved = { ...existingProvider, api_key: 'sk-will-be-removed' }
    vi.mocked(invoke).mockResolvedValue(saved)
    const { result } = setup({ models: [newModel('model-1')], existing: saved, apiKey: '' })
    await act(async () => { await result.current.handleSave() })
    expect(invoke).toHaveBeenCalledWith('update_provider', expect.objectContaining({
      id: saved.id,
      req: expect.objectContaining({ api_key: '' }),
    }))
  })
})

describe('API key preservation when the secure store is inaccessible', () => {
  it('omits an unreadable API key while saving unrelated provider changes', async () => {
    const saved = { ...existingProvider, api_key: undefined, name: 'Old name' }
    vi.mocked(invoke).mockResolvedValue(saved)
    const { result } = setup({ models: [], existing: saved, apiKey: '', providerName: 'New name' })
    await act(async () => { await result.current.handleSave() })
    expect(invoke).toHaveBeenCalledWith('update_provider', {
      id: saved.id,
      req: expect.objectContaining({ name: 'New name', api_key: undefined }),
    })
  })

  it('does not write a blank key when only a model is added', async () => {
    // Rust Option::None can serialize as null; generated TS types mark this
    // field optional, so deliberately exercise that runtime-only payload.
    const unreadable = { ...existingProvider, api_key: null } as unknown as Provider
    vi.mocked(invoke).mockResolvedValue(unreadable)
    const { result } = setup({ models: [newModel('new-model')], existing: unreadable, apiKey: '' })
    await act(async () => { await result.current.handleSave() })
    expect(invoke).not.toHaveBeenCalledWith('update_provider', expect.anything())
    expect(invoke).toHaveBeenCalledWith('create_model', {
      req: expect.objectContaining({ model_id: 'new-model' }),
    })
  })

  it('rotates an unreadable key only when a new non-empty key is provided', async () => {
    // Rust Option::None can serialize as null; generated TS types mark this
    // field optional, so deliberately exercise that runtime-only payload.
    const unreadable = { ...existingProvider, api_key: null } as unknown as Provider
    vi.mocked(invoke).mockResolvedValue(unreadable)
    const { result } = setup({ models: [], existing: unreadable, apiKey: 'sk-replacement' })
    await act(async () => { await result.current.handleSave() })
    expect(invoke).toHaveBeenCalledWith('update_provider', {
      id: unreadable.id,
      req: expect.objectContaining({ api_key: 'sk-replacement' }),
    })
  })

  it('does not assign a custom editor ID after creating a built-in provider', async () => {
    vi.mocked(invoke).mockResolvedValue({ ...existingProvider, id: 'saved-openai', provider_type: 'openai' })
    const { result, onProviderCreated } = setup({
      models: [],
      existing: null,
      selected: { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
    })
    await act(async () => { await result.current.handleSave() })
    expect(invoke).toHaveBeenCalledWith('create_provider', expect.anything())
    expect(onProviderCreated).not.toHaveBeenCalled()
  })
})

describe('useProviderSave security and reliability', () => {
  it('never logs an API key from the returned provider object', async () => {
    const apiSecret = 'sk-secret-should-never-appear-in-logs'
    vi.mocked(logger.info).mockClear()
    vi.mocked(invoke).mockResolvedValue({ ...existingProvider, api_key: apiSecret })
    const { result } = setup({ models: [], existing: null })

    await act(async () => {
      await result.current.handleSave()
    })

    expect(invoke).toHaveBeenCalledWith('create_provider', expect.anything())
    expect(JSON.stringify(vi.mocked(logger.info).mock.calls)).not.toContain(apiSecret)
  })

  it('normalizes custom provider names and endpoint whitespace', async () => {
    vi.mocked(invoke).mockResolvedValue(existingProvider)
    const { result } = setup({
      models: [],
      existing: null,
      providerName: '  Acme  ',
      apiBaseUrl: '  https://api.example.com/v1  ',
    })

    await act(async () => { await result.current.handleSave() })

    expect(invoke).toHaveBeenCalledWith('create_provider', {
      req: expect.objectContaining({
        name: 'Acme',
        base_url: 'https://api.example.com/v1',
      }),
    })
  })

  it('normalizes pasted API credentials before saving', async () => {
    vi.mocked(invoke).mockResolvedValue(existingProvider)
    const { result } = setup({ models: [], existing: null, apiKey: '  sk-test  ' })
    await act(async () => {
      await result.current.handleSave()
    })
    expect(invoke).toHaveBeenCalledWith('create_provider', {
      req: expect.objectContaining({ api_key: 'sk-test' }),
    })
  })

  it('rejects duplicate active model identifiers before mutating the provider', async () => {
    const { result } = setup({
      models: [newModel('one'), { ...newModel('two'), modelId: ' one ' }],
      existing: null,
    })
    await act(async () => {
      await result.current.handleSave()
    })
    expect(invoke).not.toHaveBeenCalled()
  })

  it('blocks malformed endpoints before calling native providers', async () => {
    const { result } = setup({ models: [], existing: null, apiBaseUrl: 'file:///secrets' })
    await act(async () => { await result.current.handleSave() })
    expect(invoke).not.toHaveBeenCalled()
  })

  it('rejects an empty custom provider name before contacting the backend', async () => {
    const { result } = setup({ models: [], existing: null, providerName: ' ' })
    await act(async () => {
      await result.current.handleSave()
    })
    expect(invoke).not.toHaveBeenCalled()
  })

  it('prevents duplicate creation while the first save is pending', async () => {
    let finish!: (value: Provider) => void
    const pending = new Promise<Provider>((resolve) => { finish = resolve })
    vi.mocked(invoke).mockReturnValue(pending as never)
    const { result } = setup({ models: [], existing: null })

    await act(async () => {
      const first = result.current.handleSave()
      const second = result.current.handleSave()
      expect(invoke).toHaveBeenCalledTimes(1)
      finish(existingProvider)
      await Promise.all([first, second])
    })

    expect(invoke).toHaveBeenCalledTimes(1)
  })
})
