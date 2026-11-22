// Ghost AI by Brendigo
import * as React from 'react'
import { useModelStore } from '@/stores/modelStore'
import type { Provider } from '@/types'
import type { LLMProvider, ModelItem } from './types'
import { isCustomProviderType } from './types'

export interface UseProviderDataReturn {
  existingProvider: Provider | null
  storeProviders: Provider[]
  isDataLoaded: boolean
  loadError: string | null
  loadExistingData: () => void
}

interface UseProviderDataParams {
  open: boolean
  selectedProvider: LLMProvider
  editingCustomProviderId: string | null
  setApiKey: (key: string) => void
  setApiBaseUrl: (url: string) => void
  setProviderName: (name: string) => void
  setApiStyle: (style: string) => void
  setCompatibilityType: (type: string) => void
  setModels: React.Dispatch<React.SetStateAction<ModelItem[]>>
  setOriginalModelNames: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setOriginalModelIds: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setModelsToDelete: React.Dispatch<React.SetStateAction<string[]>>
}

/**
 * Loads and manages existing provider data from the store
 */
export function useProviderData({
  open,
  selectedProvider,
  editingCustomProviderId,
  setApiKey,
  setApiBaseUrl,
  setProviderName,
  setApiStyle,
  setCompatibilityType,
  setModels,
  setOriginalModelNames,
  setOriginalModelIds,
  setModelsToDelete,
}: UseProviderDataParams): UseProviderDataReturn {
  const loadAll = useModelStore((state) => state.loadAll)
  const storeProviders = useModelStore((state) => state.providers)
  const storeModels = useModelStore((state) => state.models)
  const [isDataLoaded, setIsDataLoaded] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [existingProvider, setExistingProvider] = React.useState<Provider | null>(null)
  const activeLoadRef = React.useRef(0)
  // Data refreshes may arrive while the user edits a provider. Hydrate the
  // form only when the selected provider changes or a deliberate reload begins;
  // otherwise store updates would silently erase unsaved credentials/models.
  const lastHydratedRef = React.useRef<{
    provider: LLMProvider
    editingId: string | null
  } | null>(null)

  const loadExistingData = React.useCallback(() => {
    const request = ++activeLoadRef.current
    setIsDataLoaded(false)
    setLoadError(null)
    void loadAll()
      .then(() => {
        if (request !== activeLoadRef.current) return
        const error = useModelStore.getState().error
        if (error) {
          setLoadError(error)
          return
        }
        setIsDataLoaded(true)
      })
      .catch(() => {
        if (request === activeLoadRef.current) {
          setLoadError('Unable to load provider settings. Please retry.')
        }
      })
  }, [loadAll])

  React.useEffect(() => {
    if (open) {
      loadExistingData()
    } else {
      activeLoadRef.current += 1
      setIsDataLoaded(false)
      setLoadError(null)
    }
    return () => {
      activeLoadRef.current += 1
    }
  }, [open, loadExistingData])

  // Load existing provider data when provider type changes OR data is loaded
  React.useEffect(() => {
    if (!isDataLoaded) {
      lastHydratedRef.current = null
      return
    }
    const last = lastHydratedRef.current
    if (last?.provider === selectedProvider && last.editingId === editingCustomProviderId) {
      return
    }
    lastHydratedRef.current = { provider: selectedProvider, editingId: editingCustomProviderId }

    // Reset tracking state
    setModelsToDelete([])
    setOriginalModelNames({})
    setOriginalModelIds({})

    let existing: Provider | undefined

    if (editingCustomProviderId) {
      // Editing an existing custom provider by ID
      existing = storeProviders.find((p) => p.id === editingCustomProviderId)
    } else if (!isCustomProviderType(selectedProvider.id)) {
      // Built-in: match by provider_type (singleton)
      existing = storeProviders.find((p) => p.provider_type === selectedProvider.id)
    }
    // For custom provider types without editingCustomProviderId, we're creating a new one

    setExistingProvider(existing || null)

    if (existing) {
      setApiKey(existing.api_key || '')
      setApiBaseUrl(existing.base_url || selectedProvider.baseUrl)
      setProviderName(existing.name)
      setApiStyle(existing.api_style || 'chat_completions')
      setCompatibilityType(existing.provider_type === 'custom_anthropic' ? 'anthropic' : 'openai')

      const existingModels = storeModels
        .filter((m) => m.provider_id === existing!.id && !m.is_deleted)
        .map((m) => ({
          id: m.id,
          displayName: m.name,
          modelId: m.model_id,
          isExisting: true,
        }))
      setModels(existingModels)

      const nameMap: Record<string, string> = {}
      const idMap: Record<string, string> = {}
      existingModels.forEach((m) => {
        nameMap[m.id] = m.displayName
        idMap[m.id] = m.modelId
      })
      setOriginalModelNames(nameMap)
      setOriginalModelIds(idMap)
    } else {
      setApiKey('')
      setApiBaseUrl(selectedProvider.baseUrl)
      setProviderName('')
      setApiStyle('chat_completions')
      setCompatibilityType('openai')
      setModels([])
    }
  }, [
    selectedProvider,
    editingCustomProviderId,
    storeProviders,
    storeModels,
    isDataLoaded,
    setApiKey,
    setApiBaseUrl,
    setProviderName,
    setApiStyle,
    setCompatibilityType,
    setModels,
    setOriginalModelNames,
    setOriginalModelIds,
    setModelsToDelete,
  ])

  return {
    existingProvider,
    storeProviders,
    isDataLoaded,
    loadError,
    loadExistingData,
  }
}
