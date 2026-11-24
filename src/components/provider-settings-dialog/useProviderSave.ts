// Ghost AI by Brendigo
import * as React from 'react'
import { invoke } from '@tauri-apps/api/core'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { CreateProviderRequest, CreateModelRequest, Provider } from '@/types'
import type { LLMProvider, ModelItem } from './types'
import { isCustomProvider } from './types'
import { logger } from '@/lib/logger'
import { isValidProviderEndpoint } from './provider-endpoint'

export interface UseProviderSaveReturn {
  isSaving: boolean
  /** The last save left the provider with zero models (dialog stays open). */
  savedWithoutModels: boolean
  handleSave: () => Promise<void>
}

interface UseProviderSaveParams {
  models: ModelItem[]
  modelsToDelete: string[]
  originalModelNames: Record<string, string>
  originalModelIds: Record<string, string>
  existingProvider: Provider | null
  apiKey: string
  apiBaseUrl: string
  providerName: string
  apiStyle: string
  compatibilityType: string
  selectedProvider: LLMProvider
  loadExistingData: () => void
  onOpenChange: (open: boolean) => void
  onProviderCreated?: (providerId: string) => void
  /** Called instead of closing when the provider has no models after saving —
   * the host opens model selection so the saved provider becomes usable. */
  onSavedWithoutModels?: () => void
}

/**
 * Handles saving provider and model changes to the backend
 */
export function useProviderSave({
  models,
  modelsToDelete,
  originalModelNames,
  originalModelIds,
  existingProvider,
  apiKey,
  apiBaseUrl,
  providerName,
  apiStyle,
  compatibilityType,
  selectedProvider,
  loadExistingData,
  onOpenChange,
  onProviderCreated,
  onSavedWithoutModels,
}: UseProviderSaveParams): UseProviderSaveReturn {
  const { t } = useTranslation('messages')
  const [isSaving, setIsSaving] = React.useState(false)
  // A ref blocks rapid double clicks before the next React render commits.
  const saveInFlightRef = React.useRef(false)
  const [savedWithoutModels, setSavedWithoutModels] = React.useState(false)

  React.useEffect(() => {
    if (models.some((model) => !modelsToDelete.includes(model.id))) {
      setSavedWithoutModels(false)
    }
  }, [models, modelsToDelete])

  const handleSave = React.useCallback(async () => {
    if (saveInFlightRef.current) return
    const isCustom = isCustomProvider(selectedProvider)
    const normalizedBaseUrl = apiBaseUrl.trim()
    const normalizedApiKey = apiKey.trim()
    if (isCustom && (!providerName.trim() || !normalizedBaseUrl)) {
      toast.error(t('providers:requiredField'))
      return
    }
    if (normalizedBaseUrl && !isValidProviderEndpoint(normalizedBaseUrl)) {
      toast.error(t('providers:invalidBaseUrl'))
      return
    }
    const activeModels = models.filter((model) => !modelsToDelete.includes(model.id))
    const seenIds = new Set<string>()
    for (const model of activeModels) {
      const id = model.modelId.trim()
      if (!id) {
        toast.error(t('providers:modelIdRequired'))
        return
      }
      if (seenIds.has(id)) {
        toast.error(t('providers:modelAlreadyExists'))
        return
      }
      seenIds.add(id)
    }
    saveInFlightRef.current = true
    const newModels = activeModels.filter((m) => !m.isExisting)
    const modifiedModels = activeModels.filter(
      (m) =>
        m.isExisting &&
        (originalModelNames[m.id] !== m.displayName || originalModelIds[m.id] !== m.modelId)
    )

    const remainingModels = activeModels.length

    setIsSaving(true)
    try {
      let providerId: string
      const effectiveName = isCustom ? providerName.trim() : selectedProvider.name
      const effectiveProviderType = isCustom
        ? compatibilityType === 'anthropic'
          ? 'custom_anthropic'
          : 'custom_openai'
        : selectedProvider.id
      const effectiveApiStyle = compatibilityType === 'openai' && isCustom ? apiStyle : undefined

      if (existingProvider) {
        // A missing/decryption-inaccessible stored key hydrates as an empty
        // field but MUST NOT be interpreted as a request to delete ciphertext.
        // Only clearing a previously readable non-empty key sends '' to the
        // backend; a new non-empty key is explicitly rotated.
        const storedKey = existingProvider.api_key ?? ''
        const apiKeyChanged = storedKey !== normalizedApiKey
        const keyUpdate = apiKeyChanged ? normalizedApiKey : undefined
        const needsUpdate =
          apiKeyChanged ||
          (existingProvider.base_url || '') !== normalizedBaseUrl ||
          existingProvider.name !== effectiveName ||
          existingProvider.provider_type !== effectiveProviderType ||
          existingProvider.api_style !== effectiveApiStyle

        if (needsUpdate) {
          await invoke('update_provider', {
            id: existingProvider.id,
            req: {
              name: effectiveName,
              provider_type: effectiveProviderType,
              api_key: keyUpdate,
              base_url: normalizedBaseUrl || undefined,
              api_style: effectiveApiStyle,
              is_enabled: existingProvider.is_enabled,
            },
          })
          logger.info('Updated provider:', effectiveName)
        }
        providerId = existingProvider.id
      } else {
        const providerReq: CreateProviderRequest = {
          name: effectiveName,
          provider_type: effectiveProviderType,
          api_key: normalizedApiKey || undefined,
          base_url: normalizedBaseUrl || undefined,
          api_style: effectiveApiStyle,
          is_enabled: true,
        }

        const provider = await invoke<Provider>('create_provider', { req: providerReq })
        // Provider objects can contain credentials. Never write them to diagnostics.
        logger.info('Created provider:', { id: provider.id, type: effectiveProviderType })
        providerId = provider.id
        if (isCustom) onProviderCreated?.(providerId)
      }

      for (const modelId of new Set(modelsToDelete)) {
        if (models.some((model) => model.id === modelId && !model.isExisting)) continue
        await invoke('delete_model', { id: modelId })
        logger.info('Tombstoned model:', modelId)
      }

      for (const model of modifiedModels) {
        const modelReq: CreateModelRequest = {
          name: model.displayName.trim() || model.modelId.trim(),
          provider_id: providerId,
          model_id: model.modelId.trim(),
          is_starred: false,
        }
        await invoke('update_model', { id: model.id, req: modelReq })
        logger.info('Updated model', { id: model.id, newName: model.displayName })
      }

      for (const model of newModels) {
        const modelReq: CreateModelRequest = {
          name: model.displayName.trim() || model.modelId.trim(),
          provider_id: providerId,
          model_id: model.modelId.trim(),
          is_starred: false,
        }
        await invoke('create_model', { req: modelReq })
        logger.info('Created model', { name: model.displayName.trim() || model.modelId.trim(), id: model.modelId })
      }

      loadExistingData()
      setSavedWithoutModels(remainingModels === 0)
      if (remainingModels === 0) {
        // Saved credentials are real; a chat cannot send until a model is
        // added. Keep the editor open and let the host open model selection.
        toast.success(t('providerSavedNeedsModels'))
        onSavedWithoutModels?.()
        return
      }
      toast.success(t('providerSavedSuccessfully'))
      onOpenChange(false)
    } catch {
      // Backend errors could contain URLs, query strings or provider credentials.
      // Log the operation only, never the raw error or secret-bearing request.
      logger.error('Failed to save provider configuration')
      toast.error(t('failedToSaveProvider'))
    } finally {
      saveInFlightRef.current = false
      setIsSaving(false)
    }
  }, [
    models,
    modelsToDelete,
    originalModelNames,
    originalModelIds,
    existingProvider,
    apiKey,
    apiBaseUrl,
    providerName,
    apiStyle,
    compatibilityType,
    selectedProvider,
    loadExistingData,
    onOpenChange,
    onProviderCreated,
    onSavedWithoutModels,
  ])

  return {
    isSaving,
    savedWithoutModels,
    handleSave,
  }
}
