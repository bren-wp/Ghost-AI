// Ghost AI by Brendigo
'use client'

import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProviderForm } from '@/components/provider-settings-dialog/provider-form'
import { ModelsTable } from '@/components/provider-settings-dialog/models-table'
import { FetchModelsDialog } from '@/components/provider-settings-dialog/fetch-models-dialog'
import { AddModelDialog } from '@/components/provider-settings-dialog/add-model-dialog'
import { EditModelDialog } from '@/components/provider-settings-dialog/edit-model-dialog'
import { useProviderSettings } from '@/components/provider-settings-dialog/useProviderSettings'
import { ProviderSelect } from '@/components/provider-settings-dialog/provider-select'
import { requiresApiKeyForFetch } from '@/components/provider-settings-dialog/constants'
import { isValidProviderEndpoint } from '@/components/provider-settings-dialog/provider-endpoint'
import { isCustomProvider, type LLMProvider } from '@/components/provider-settings-dialog/types'

interface LLMProviderSettingsProps {
  open: boolean
}

export function LLMProviderSettings({ open }: LLMProviderSettingsProps) {
  const { t } = useTranslation('providers')
  const {
    selectedProvider,
    setSelectedProvider,
    apiKey,
    setApiKey,
    showApiKey,
    setShowApiKey,
    apiBaseUrl,
    setApiBaseUrl,
    providerName,
    setProviderName,
    apiStyle,
    setApiStyle,
    compatibilityType,
    setCompatibilityType,
    editingCustomProviderId,
    setEditingCustomProviderId,
    models,
    fetchModalOpen,
    setFetchModalOpen,
    availableModels,
    isLoading,
    fetchError,
    modelSearchQuery,
    setModelSearchQuery,
    isSaving,
    existingProvider,
    modelsToDelete,
    originalModelNames,
    originalModelIds,
    storeProviders,
    addModelDialogOpen,
    setAddModelDialogOpen,
    editModelDialogOpen,
    setEditModelDialogOpen,
    editingModel,
    handleEditModelSave,
    handleUpdateModelName,
    handleDeleteModel,
    handleModelSettings,
    handleFetchModels,
    handleOpenFetchModal,
    handleToggleImportModel,
    handleAddManualModel,
    isModelImported,
    handleSave,
    groupedModels,
    savedWithoutModels,
    isDataLoaded,
    loadError,
    retryLoad,
  } = useProviderSettings(open, () => {})

  const isCustom = isCustomProvider(selectedProvider)
  const displayName = existingProvider ? existingProvider.name : selectedProvider.name

  const effectiveProviderType = isCustom
    ? compatibilityType === 'anthropic'
      ? 'custom_anthropic'
      : 'custom_openai'
    : selectedProvider.id
  const effectiveApiStyle = isCustom && compatibilityType === 'openai' ? apiStyle : undefined

  const hasChanges =
    models.filter((m) => !m.isExisting).length > 0 ||
    modelsToDelete.length > 0 ||
    models.filter(
      (m) =>
        m.isExisting &&
        (originalModelNames[m.id] !== m.displayName || originalModelIds[m.id] !== m.modelId)
    ).length > 0 ||
    (existingProvider &&
      (existingProvider.api_key !== apiKey ||
        existingProvider.base_url !== apiBaseUrl ||
        existingProvider.name !== (isCustom ? providerName : selectedProvider.name) ||
        existingProvider.provider_type !== effectiveProviderType ||
        existingProvider.api_style !== effectiveApiStyle)) ||
    (!existingProvider && (isCustom || !requiresApiKeyForFetch(selectedProvider.id) || apiKey.trim().length > 0))

  const handleSelectProvider = (provider: LLMProvider, storedProviderId?: string) => {
    if (provider.isCustom) {
      const storeProvider = storedProviderId
        ? storeProviders.find((p) => p.id === storedProviderId)
        : storeProviders.find((p) => p.provider_type === provider.id && p.name === provider.name)
      // Selecting 'Add custom provider' must clear the previous edit target.
      setEditingCustomProviderId(storeProvider?.id ?? null)
    } else {
      setEditingCustomProviderId(null)
    }
    setSelectedProvider(provider)
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#30415D] bg-[#0B1423] px-4 py-4 sm:px-6">
        <ProviderSelect
          className="max-w-xl"
          selectedProvider={selectedProvider}
          editingCustomProviderId={editingCustomProviderId}
          storeProviders={storeProviders}
          onSelectProvider={handleSelectProvider}
        />
      </div>

      {loadError ? (
        <div role="alert" className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm">
          <p className="text-destructive">{loadError}</p>
          <Button type="button" variant="outline" onClick={retryLoad}>{t('common:retry')}</Button>
        </div>
      ) : !isDataLoaded ? (
        <div role="status" aria-live="polite" className="flex min-w-0 flex-1 items-center justify-center gap-2 p-6 text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          {t('common:loading')}
        </div>
      ) : (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#080F1A] p-4 sm:p-6">
          <div className="mx-auto w-full max-w-5xl min-w-0 space-y-5">
            <header className="rounded-2xl border border-[#30415D] bg-gradient-to-r from-[#12283B] to-[#211B39] px-5 py-6 sm:px-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8CDDE8]">{t('providerWorkspace')}</p>
              <h3 className="break-words text-2xl font-semibold text-white">{displayName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#B4C5DA]">
                {existingProvider
                  ? t('manageProviderDescription', { name: displayName })
                  : isCustom
                    ? t('configureCustomEndpoint')
                    : t('configureApiSettings', { name: displayName })}
              </p>
            </header>
            <section aria-label={t('connectionSettings')} className="min-w-0 space-y-5 rounded-2xl border border-[#30415D] bg-[#111C2D] p-4 sm:p-6">
              <div>
                <h4 className="text-base font-semibold text-white">{t('connectionSettings')}</h4>
                <p className="mt-1 text-xs text-[#B2C3D8]">{t('connectionSectionDescription')}</p>
              </div>
            <ProviderForm
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              showApiKey={showApiKey}
              onShowApiKeyChange={setShowApiKey}
              apiBaseUrl={apiBaseUrl}
              onApiBaseUrlChange={setApiBaseUrl}
              selectedProvider={selectedProvider}
              providerName={providerName}
              onProviderNameChange={setProviderName}
              apiStyle={apiStyle}
              onApiStyleChange={setApiStyle}
              compatibilityType={compatibilityType}
              onCompatibilityTypeChange={setCompatibilityType}
              models={models}
            />

            </section>
            <section aria-label={t('models')} className="min-w-0 rounded-2xl border border-[#30415D] bg-[#111C2D] p-4 sm:p-6">
            <ModelsTable
              models={models}
              selectedProvider={selectedProvider}
              apiKey={apiKey}
              apiBaseUrl={apiBaseUrl}
              onOpenFetchModal={handleOpenFetchModal}
              onOpenAddModelDialog={() => setAddModelDialogOpen(true)}
              onUpdateModelName={handleUpdateModelName}
              onDeleteModel={handleDeleteModel}
              onModelSettings={handleModelSettings}
            />

            </section>          </div>
        </div>

        {/* Footer with Save Button */}
        <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 border-t border-[#30415D] bg-[#0C1524] p-3 sm:p-4">
          {savedWithoutModels && (
            <p className="mr-auto text-sm text-warning">{t('addModelsBeforeChatting')}</p>
          )}
          <Button
            className="bg-[#00E5FF] font-semibold text-[#061524] hover:bg-[#5DEDFB]"
            onClick={handleSave}
            disabled={
              isSaving || !hasChanges || (requiresApiKeyForFetch(selectedProvider.id) && !apiKey.trim() && !existingProvider) ||
              (isCustom && (!providerName.trim() || !apiBaseUrl.trim())) ||
              (apiBaseUrl.trim().length > 0 && !isValidProviderEndpoint(apiBaseUrl))
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {t('common:saving')}
              </>
            ) : existingProvider ? (
              t('common:save')
            ) : (
              t('saveConfiguration')
            )}
          </Button>
        </div>
      </div>
      )}

      {/* Fetch Models Dialog */}
      <FetchModelsDialog
        open={fetchModalOpen}
        onOpenChange={setFetchModalOpen}
        selectedProvider={selectedProvider}
        isLoading={isLoading}
        fetchError={fetchError}
        availableModels={availableModels}
        modelSearchQuery={modelSearchQuery}
        onModelSearchQueryChange={setModelSearchQuery}
        groupedModels={groupedModels}
        onToggleImportModel={handleToggleImportModel}
        isModelImported={isModelImported}
        onRetry={handleFetchModels}
        onAddManually={() => {
          setFetchModalOpen(false)
          setAddModelDialogOpen(true)
        }}
      />

      {/* Manual Add Model Dialog */}
      <AddModelDialog
        open={addModelDialogOpen}
        onOpenChange={setAddModelDialogOpen}
        onAddModel={handleAddManualModel}
      />

      {/* Edit Model Dialog */}
      <EditModelDialog
        open={editModelDialogOpen}
        model={editingModel}
        onOpenChange={setEditModelDialogOpen}
        onSave={handleEditModelSave}
      />
    </div>
  )
}
