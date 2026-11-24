// Ghost AI by Brendigo
import { describe, expect, it } from 'vitest'
import { normalizeDiscoveredModels } from '../model-discovery'

describe('provider catalog normalization', () => {
  it('preserves order, removes duplicate IDs and rejects invalid records', () => {
    expect(normalizeDiscoveredModels([
      null, { id: '' }, { id: 'a', name: ' A ', context_length: 8192, pricing: { prompt: 0, completion: 0.2 } },
      { id: ' a ', name: 'duplicate' }, { id: 'b', name: null, context_length: -1 },
      { id: 'bad\nmodel' },
    ])).toEqual([
      { id: 'a', name: 'A', context_length: 8192, pricing: { prompt: 0, completion: 0.2 } },
      { id: 'b', name: 'b' },
    ])
  })
  it('distinguishes a valid empty catalog from malformed responses', () => {
    expect(normalizeDiscoveredModels([])).toEqual([])
    expect(() => normalizeDiscoveredModels({ error: 'denied' })).toThrow()
    expect(() => normalizeDiscoveredModels([{ id: 12 }])).toThrow()
  })
})
