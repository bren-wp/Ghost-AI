// Ghost AI by Brendigo
import { act, renderHook } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFetchModels } from '../useFetchModels'

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

const invokeMock = vi.mocked(invoke)
const openAI = { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' }
const openRouter = { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' }
const local = { id: 'lmstudio', name: 'LM Studio', baseUrl: 'http://localhost:1234/v1' }

beforeEach(() => invokeMock.mockReset())

describe('model discovery reliability', () => {
  it('discovers local models without requiring an API key', async () => {
    invokeMock.mockResolvedValue([{ id: 'local-1', name: 'Local model' }])
    const { result } = renderHook(() => useFetchModels({
      selectedProvider: local,
      apiKey: '',
      apiBaseUrl: local.baseUrl,
      compatibilityType: 'openai',
    }))

    await act(async () => { await result.current.handleFetchModels() })
    expect(invokeMock).toHaveBeenCalledWith('fetch_provider_models', {
      providerType: 'lmstudio',
      apiKey: 'no-key',
      baseUrl: local.baseUrl,
    })
    expect(result.current.availableModels.map((model) => model.id)).toEqual(['local-1'])
  })

  it('ignores an old request after changing AI provider', async () => {
    let resolveOld!: (models: { id: string; name: string }[]) => void
    const oldRequest = new Promise<{ id: string; name: string }[]>((resolve) => {
      resolveOld = resolve
    })
    invokeMock.mockImplementation((async (command: string) =>
      command === 'fetch_openai_models'
        ? oldRequest
        : [{ id: 'new-model', name: 'Latest model' }]
    ) as never)

    const { result, rerender } = renderHook(
      ({ provider }) => useFetchModels({
        selectedProvider: provider,
        apiKey: 'test-key',
        apiBaseUrl: provider.baseUrl,
        compatibilityType: 'openai',
      }),
      { initialProps: { provider: openAI } },
    )

    let first!: Promise<void>
    act(() => { first = result.current.handleFetchModels() })
    rerender({ provider: openRouter })
    await act(async () => { await result.current.handleFetchModels() })
    await act(async () => {
      resolveOld([{ id: 'obsolete', name: 'Outdated model' }])
      await first
    })
    expect(result.current.availableModels.map((model) => model.id)).toEqual(['new-model'])
    expect(result.current.isLoading).toBe(false)
  })

  it('does not render secret-bearing backend errors', async () => {
    // Only the request under test rejects. Background Tauri setting calls
    // must not inherit an unhandled rejection from this shared mock.
    invokeMock.mockImplementation(((command: string) => {
      if (command === 'fetch_openai_models') {
        return Promise.reject(new Error('request failed, bearer sk-never-display'))
      }
      return Promise.resolve(null)
    }) as never)
    const { result } = renderHook(() => useFetchModels({
      selectedProvider: openAI,
      apiKey: 'sk-never-display',
      apiBaseUrl: openAI.baseUrl,
      compatibilityType: 'openai',
    }))
    await act(async () => { await result.current.handleFetchModels() })
    expect(invokeMock).toHaveBeenCalledWith('fetch_openai_models', {
      apiKey: 'sk-never-display',
      baseUrl: openAI.baseUrl,
    })
    expect(result.current.fetchError).toBe('Failed to fetch models')
    expect(result.current.fetchError).not.toContain('sk-never-display')
  })

  it('discards results when model selection is closed', async () => {
    let resolveRequest!: (models: { id: string; name: string }[]) => void
    invokeMock.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve }) as never)
    const { result } = renderHook(() => useFetchModels({
      selectedProvider: openAI,
      apiKey: 'test-key',
      apiBaseUrl: openAI.baseUrl,
      compatibilityType: 'openai',
    }))
    let pending!: Promise<void>
    act(() => { pending = result.current.handleFetchModels() })
    act(() => result.current.setFetchModalOpen(false))
    await act(async () => {
      resolveRequest([{ id: 'late', name: 'Late response' }])
      await pending
    })
    expect(result.current.availableModels).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })
})
