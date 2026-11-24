// Ghost AI by Brendigo
import type { ModelInfo } from './types'

/** Treat external provider responses as data, never assume a valid catalog. */
export function normalizeDiscoveredModels(value: unknown): ModelInfo[] {
  if (!Array.isArray(value)) throw new Error('Invalid model catalog')
  const models = new Map<string, ModelInfo>()
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string') continue
    const id = entry.id.trim()
    if (!id || models.has(id) || /[\u0000-\u001f\u007f]/.test(id)) continue
    const name = typeof entry.name === 'string' ? entry.name.trim() || id : id
    const model: ModelInfo = { id, name }
    if (typeof entry.description === 'string') model.description = entry.description
    if (typeof entry.context_length === 'number' && Number.isSafeInteger(entry.context_length) && entry.context_length > 0) {
      model.context_length = entry.context_length
    }
    if (entry.pricing && typeof entry.pricing === 'object') {
      const pricing: NonNullable<ModelInfo['pricing']> = {}
      for (const key of ['prompt', 'completion'] as const) {
        const price = entry.pricing[key]
        if (typeof price === 'number' && Number.isFinite(price) && price >= 0) pricing[key] = price
      }
      if (Object.keys(pricing).length) model.pricing = pricing
    }
    models.set(id, model)
  }
  if (value.length > 0 && models.size === 0) throw new Error('Invalid model catalog entries')
  return [...models.values()]
}
