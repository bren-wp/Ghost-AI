// Ghost AI by Brendigo
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useModelList } from '../useModelList'
import { useModelStore } from '@/stores/modelStore'

beforeEach(() => {
  useModelStore.setState({ models: [], providers: [], error: null })
})
afterEach(() => vi.restoreAllMocks())

describe('model list identity and rapid actions', () => {
  it('generates unique draft IDs even when models are imported in one millisecond', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    const { result } = renderHook(() => useModelList())

    act(() => {
      result.current.handleToggleImportModel({ id: 'model-a', name: 'Model A' })
      result.current.handleToggleImportModel({ id: 'model-b', name: 'Model B' })
    })

    expect(result.current.models.map((m) => m.modelId)).toEqual(['model-a', 'model-b'])
    expect(new Set(result.current.models.map((m) => m.id)).size).toBe(2)
  })

  it('rejects duplicate manual models within the same React event batch', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    const { result } = renderHook(() => useModelList())
    const outcomes: boolean[] = []

    act(() => {
      outcomes.push(result.current.handleAddManualModel(' duplicate '))
      outcomes.push(result.current.handleAddManualModel('duplicate'))
      outcomes.push(result.current.handleAddManualModel('other'))
    })

    expect(outcomes).toEqual([true, false, true])
    expect(result.current.models).toHaveLength(2)
    expect(new Set(result.current.models.map((m) => m.id)).size).toBe(2)
    expect(result.current.models.map((m) => m.modelId)).toEqual(['duplicate', 'other'])
  })

  it('can restore a stored model after the user removes it', () => {
    const original = {
      id: 'stored-model',
      provider_id: 'provider-1',
      model_id: 'model-a',
      name: 'Stored model',
      is_starred: false,
      is_deleted: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    useModelStore.setState({ models: [original] })
    const { result } = renderHook(() => useModelList())

    act(() => result.current.setModels([
      { id: original.id, modelId: original.model_id, displayName: original.name, isExisting: true },
    ]))
    act(() => result.current.handleDeleteModel(original.id))
    expect(result.current.models).toHaveLength(0)
    expect(result.current.modelsToDelete).toEqual([original.id])

    act(() => result.current.handleToggleImportModel({ id: original.model_id, name: original.name }))
    expect(result.current.models.map((m) => m.id)).toEqual([original.id])
    expect(result.current.modelsToDelete).toEqual([])
  })
})
