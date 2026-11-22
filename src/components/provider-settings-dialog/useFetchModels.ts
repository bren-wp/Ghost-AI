// Ghost AI by Brendigo
import * as React from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { LLMProvider, ModelInfo } from './types'
import { logger } from '@/lib/logger'
import i18n from '@/lib/i18n'

export interface UseFetchModelsReturn {
  availableModels: ModelInfo[]
  isLoading: boolean
  fetchError: string | null
  fetchModalOpen: boolean
  setFetchModalOpen: (open: boolean) => void
  modelSearchQuery: string
  setModelSearchQuery: (query: string) => void
  handleFetchModels: () => Promise<void>
  handleOpenFetchModal: () => void
}

interface UseFetchModelsParams {
  selectedProvider: LLMProvider
  apiKey: string
  apiBaseUrl: string
  compatibilityType: string
}

// Providers that use the original dedicated fetch commands
const DEDICATED_FETCH_PROVIDERS = new Set(['openai', 'openrouter', 'ollama', 'anthropic'])

// Local providers that don't require API keys for model fetching
const LOCAL_PROVIDERS = new Set(['lmstudio', 'gpustack', 'ovms'])

class ProviderInputError extends Error {}

/**
 * Handles fetching models from provider APIs.
 * Uses dedicated commands for OpenAI/OpenRouter/Ollama and Anthropic
 * (including Anthropic-compatible custom providers),
 * and a generic OpenAI-compatible command for all other providers.
 */
export function useFetchModels({
  selectedProvider,
  apiKey,
  apiBaseUrl,
  compatibilityType,
}: UseFetchModelsParams): UseFetchModelsReturn {
  const [availableModels, setAvailableModels] = React.useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [fetchModalOpen, setFetchModalOpenState] = React.useState(false)
  const [modelSearchQuery, setModelSearchQuery] = React.useState('')
  const activeRequestRef = React.useRef(0)

  const setFetchModalOpen = React.useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      activeRequestRef.current += 1
      setIsLoading(false)
    }
    setFetchModalOpenState(nextOpen)
  }, [])

  // When credentials or provider change, old discovery results are no longer valid.
  React.useEffect(() => {
    activeRequestRef.current += 1
    setIsLoading(false)
    setAvailableModels([])
    setFetchError(null)
  }, [selectedProvider.id, apiKey, apiBaseUrl, compatibilityType])

  // Invalidate pending requests when the editor closes or unmounts.
  React.useEffect(() => () => {
    activeRequestRef.current += 1
  }, [])

  const handleFetchModels = React.useCallback(async () => {
    const requestId = ++activeRequestRef.current
    setIsLoading(true)
    setFetchError(null)
    setAvailableModels([])

    try {
      const providerId = selectedProvider.id
      let fetchedModels: ModelInfo[] = []

      if (providerId === 'openai') {
        if (!apiKey) {
          throw new ProviderInputError(i18n.t('providers:fetchModels.openaiApiKeyRequired'))
        }
        const baseUrl = apiBaseUrl || undefined
        fetchedModels = await invoke<ModelInfo[]>('fetch_openai_models', { apiKey, baseUrl })
      } else if (providerId === 'openrouter') {
        if (!apiKey) {
          throw new ProviderInputError(i18n.t('providers:fetchModels.openrouterApiKeyRequired'))
        }
        const baseUrl = apiBaseUrl || undefined
        fetchedModels = await invoke<ModelInfo[]>('fetch_openrouter_models', { apiKey, baseUrl })
      } else if (providerId === 'ollama') {
        const baseUrl = apiBaseUrl || 'http://localhost:11434'
        fetchedModels = await invoke<ModelInfo[]>('fetch_ollama_models', { baseUrl })
      } else if (
        providerId === 'custom_openai' ||
        (providerId === 'custom' && compatibilityType === 'openai')
      ) {
        if (!apiKey) {
          throw new ProviderInputError(i18n.t('providers:fetchModels.apiKeyRequired'))
        }
        if (!apiBaseUrl) {
          throw new ProviderInputError(i18n.t('providers:fetchModels.baseUrlRequiredCustom'))
        }
        fetchedModels = await invoke<ModelInfo[]>('fetch_provider_models', {
          providerType: 'openai',
          apiKey,
          baseUrl: apiBaseUrl,
        })
      } else if (providerId === 'anthropic') {
        if (!apiKey) {
          throw new ProviderInputError(
            i18n.t('providers:fetchModels.apiKeyRequiredForProvider', { provider: selectedProvider.name })
          )
        }
        const baseUrl = apiBaseUrl || selectedProvider.baseUrl || undefined
        fetchedModels = await invoke<ModelInfo[]>('fetch_anthropic_models', { apiKey, baseUrl })
      } else if (providerId === 'custom_anthropic' || providerId === 'custom') {
        if (!apiKey) {
          throw new ProviderInputError(i18n.t('providers:fetchModels.apiKeyRequired'))
        }
        if (!apiBaseUrl) {
          throw new ProviderInputError(i18n.t('providers:fetchModels.baseUrlRequiredCustom'))
        }
        fetchedModels = await invoke<ModelInfo[]>('fetch_anthropic_models', {
          apiKey,
          baseUrl: apiBaseUrl,
        })
      } else if (LOCAL_PROVIDERS.has(providerId)) {
        const baseUrl = apiBaseUrl || selectedProvider.baseUrl
        if (!baseUrl) {
          throw new ProviderInputError(
            i18n.t('providers:fetchModels.baseUrlRequired', { provider: selectedProvider.name })
          )
        }
        fetchedModels = await invoke<ModelInfo[]>('fetch_provider_models', {
          providerType: providerId,
          apiKey: apiKey || 'no-key',
          baseUrl,
        })
      } else if (!DEDICATED_FETCH_PROVIDERS.has(providerId)) {
        if (!apiKey) {
          throw new ProviderInputError(
            i18n.t('providers:fetchModels.apiKeyRequiredForProvider', { provider: selectedProvider.name })
          )
        }
        const baseUrl = apiBaseUrl || selectedProvider.baseUrl
        if (!baseUrl) {
          throw new ProviderInputError(
            i18n.t('providers:fetchModels.baseUrlRequired', { provider: selectedProvider.name })
          )
        }
        fetchedModels = await invoke<ModelInfo[]>('fetch_provider_models', {
          providerType: providerId,
          apiKey,
          baseUrl,
        })
      } else {
        throw new ProviderInputError(
          i18n.t('providers:fetchModels.modelFetchingNotSupported', { provider: selectedProvider.name })
        )
      }

      if (requestId === activeRequestRef.current) {
        setAvailableModels(Array.isArray(fetchedModels) ? fetchedModels : [])
      }
    } catch (error) {
      if (requestId !== activeRequestRef.current) return
      if (error instanceof ProviderInputError) {
        setFetchError(error.message)
      } else {
        // Do not expose raw network errors: they may include API keys or URL credentials.
        logger.warn('Model discovery failed for provider', selectedProvider.id)
        setFetchError(i18n.t('providers:fetchFailed'))
      }
    } finally {
      if (requestId === activeRequestRef.current) setIsLoading(false)
    }
  }, [selectedProvider, apiKey, apiBaseUrl, compatibilityType])

  const handleOpenFetchModal = React.useCallback(() => {
    setModelSearchQuery('')
    setFetchModalOpen(true)
    void handleFetchModels()
  }, [handleFetchModels])

  return {
    availableModels,
    isLoading,
    fetchError,
    fetchModalOpen,
    setFetchModalOpen,
    modelSearchQuery,
    setModelSearchQuery,
    handleFetchModels,
    handleOpenFetchModal,
  }
}
