// Ghost AI by Brendigo
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { logger } from '@/lib/logger'
import i18n from '@/lib/i18n'
import { useProviderSave } from '../useProviderSave'
import type { ModelItem } from '../types'
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
}: {
  models: ModelItem[]
  modelsToDelete?: string[]
  existing?: Provider | null
  providerName?: string
  apiKey?: string
}) {
  const onOpenChange = vi.fn()
  const onSavedWithoutModels = vi.fn()
  const { result } = renderHook(() =>
    useProviderSave({
      models,
      modelsToDelete,
      originalModelNames: {},
      originalModelIds: {},
      existingProvider: existing,
      apiKey,
      apiBaseUrl: 'http://127.0.0.1:18080/llm/v1',
      providerName,
      apiStyle: 'chat_completions',
      compatibilityType: 'openai',
      selectedProvider: existing
        ? {
            id: existing.provider_type,
            name: existing.name,
            baseUrl: existing.base_url ?? '',
            isCustom: true,
          }
        : { id: 'custom', name: 'Custom', baseUrl: '', isCustom: true },
      loadExistingData: vi.fn(),
      onOpenChange,
      onSavedWithoutModels,
    })
  )
  return { result, onOpenChange, onSavedWithoutModels }
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
