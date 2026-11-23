// Ghost AI by Brendigo
'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Cloud, HardDrive, Layers3, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { SidebarProvider } from '@/components/ui/sidebar'
import type { ProviderSettingsDialogProps } from './types'
import { isCustomProvider, isCustomProviderType } from './types'
import { useProviderSettings } from './useProviderSettings'
import { ProviderSidebar } from './provider-sidebar'
import { ProviderSelect } from './provider-select'
import { ProviderForm } from './provider-form'
import { ModelsTable } from './models-table'
import { FetchModelsDialog } from './fetch-models-dialog'
import { AddModelDialog } from './add-model-dialog'
import { EditModelDialog } from './edit-model-dialog'
import { BUILTIN_PROVIDERS } from './constants'
import { isSupportedFetchProvider, requiresApiKeyForFetch } from './constants'
import { isValidProviderEndpoint } from './provider-endpoint'
import { useModelStore } from '@/stores/modelStore'

export function ProviderSettingsDialog({
  open,
  onOpenChange,
  initialProviderId,
}: ProviderSettingsDialogProps) {
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
  } = useProviderSettings(open, onOpenChange)

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
    (!existingProvider &&
      (isCustom || !requiresApiKeyForFetch(selectedProvider.id) || apiKey.trim().length > 0))

  const appliedFocusRef = React.useRef<string | null>(null)
  const autoOpenedModelsRef = React.useRef<string | null>(null)

  // Focus the provider the composer asked for (setup CTA). Runs after the
  // dialog's data load so storeProviders carries the synced row.
  React.useEffect(() => {
    if (!open) {
      appliedFocusRef.current = null
      autoOpenedModelsRef.current = null
      return
    }
    if (!initialProviderId || !isDataLoaded) return
    if (appliedFocusRef.current === initialProviderId) return
    const provider = storeProviders.find((p) => p.id === initialProviderId)
    if (!provider) return
    appliedFocusRef.current = initialProviderId
    if (isCustomProviderType(provider.provider_type)) {
      setEditingCustomProviderId(provider.id)
      setSelectedProvider({
        id: provider.provider_type,
        name: provider.name,
        baseUrl: provider.base_url || '',
        isCustom: true,
      })
    } else {
      setEditingCustomProviderId(null)
      const template = BUILTIN_PROVIDERS.find((p) => p.id === provider.provider_type)
      if (template) setSelectedProvider(template)
    }
  }, [
    open,
    initialProviderId,
    isDataLoaded,
    storeProviders,
    setEditingCustomProviderId,
    setSelectedProvider,
  ])

  // A focused provider with zero models opens model selection immediately,
  // mirroring the iOS setup CTA. Only for the deep-linked entry point.
  React.useEffect(() => {
    if (!open || !initialProviderId || !isDataLoaded) return
    if (autoOpenedModelsRef.current === initialProviderId) return
    const provider = storeProviders.find((p) => p.id === initialProviderId)
    if (!provider) return
    const focusApplied = isCustomProviderType(provider.provider_type)
      ? editingCustomProviderId === provider.id
      : selectedProvider.id === provider.provider_type
    if (!focusApplied) return
    // Wait until the form holds THIS provider's credentials; otherwise the
    // auto-open can fire with the previous provider's key during the reload.
    if (existingProvider?.id !== provider.id) return
    const count = useModelStore
      .getState()
      .models.filter((model) => !model.is_deleted && model.provider_id === provider.id).length
    if (count > 0) {
      autoOpenedModelsRef.current = initialProviderId
      return
    }
    if (!isSupportedFetchProvider(provider.provider_type)) return
    if (requiresApiKeyForFetch(provider.provider_type) && !apiKey.trim()) return
    if (isCustomProviderType(provider.provider_type) && !apiBaseUrl.trim()) return
    autoOpenedModelsRef.current = initialProviderId
    handleOpenFetchModal()
  }, [
    open,
    initialProviderId,
    isDataLoaded,
    storeProviders,
    editingCustomProviderId,
    selectedProvider.id,
    existingProvider?.id,
    apiKey,
    apiBaseUrl,
    handleOpenFetchModal,
  ])

  const handleSidebarSelect = (provider: typeof selectedProvider) => {
    setEditingCustomProviderId(null)
    setSelectedProvider(provider)
  }

  const handleCustomProviderSelect = (
    provider: typeof selectedProvider,
    storedProviderId?: string
  ) => {
    const storeProvider = storedProviderId
      ? storeProviders.find((p) => p.id === storedProviderId)
      : storeProviders.find((p) => p.provider_type === provider.id && p.name === provider.name)
    setEditingCustomProviderId(storeProvider?.id ?? null)
    setSelectedProvider(provider)
  }

  const isLocalProvider = ['ollama', 'lmstudio', 'gpustack', 'ovms'].includes(selectedProvider.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="ghost-provider-workspace"
        className="flex h-[min(92dvh,820px)] min-h-[340px] w-[calc(100vw-32px)] max-w-[1120px] min-w-0 flex-col gap-0 overflow-hidden rounded-[22px] border-[#30415D] bg-[#080F1A] p-0 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:max-w-[1120px] md:flex-row"
      >
        <DialogTitle className="sr-only">{t('dialogTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('dialogDescription')}</DialogDescription>
        <SidebarProvider className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <ProviderSidebar
            selectedProvider={selectedProvider}
            onSelectProvider={(provider, storedId) => {
              if (provider.isCustom) {
                handleCustomProviderSelect(provider, storedId)
              } else {
                handleSidebarSelect(provider)
              }
            }}
            storeProviders={storeProviders}
            editingCustomProviderId={editingCustomProviderId}
          />
          <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ProviderSelect
              className="shrink-0 border-b border-[#30415D] bg-[#101A2B] px-5 py-3 md:hidden"
              selectedProvider={selectedProvider}
              editingCustomProviderId={editingCustomProviderId}
              storeProviders={storeProviders}
              onSelectProvider={(provider, storedId) =>
                provider.isCustom
                  ? handleCustomProviderSelect(provider, storedId)
                  : handleSidebarSelect(provider)
              }
            />
            {loadError ? (
              <div
                role="alert"
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm"
              >
                <p className="text-destructive">{loadError}</p>
                <Button type="button" variant="outline" onClick={retryLoad}>
                  {t('common:retry')}
                </Button>
              </div>
            ) : !isDataLoaded ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-1 items-center justify-center gap-3 text-sm text-muted-foreground"
              >
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                {t('common:loading')}
              </div>
            ) : (
              <>
                <header className="shrink-0 border-b border-[#30415D]/65 bg-gradient-to-r from-[#12283B] via-[#111D30] to-[#211B39] px-5 pb-5 pt-6 sm:px-7">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8CDDE8]">
                    <Layers3 aria-hidden="true" className="size-4" />
                    {t('providerWorkspace')}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 pr-5">
                    <div className="min-w-0">
                      <h2 className="break-words text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
                        {displayName}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#B4C5DA]">
                        {existingProvider
                          ? t('manageProviderDescription', { name: displayName })
                          : isCustom
                            ? t('configureCustomEndpoint')
                            : t('configureApiSettings', { name: displayName })}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#5C6A87]/50 bg-[#080F1A]/55 px-3 py-1.5 text-xs text-[#CFDBEE]">
                      {isLocalProvider ? (
                        <HardDrive aria-hidden="true" className="size-3.5 text-[#00E5FF]" />
                      ) : (
                        <Cloud aria-hidden="true" className="size-3.5 text-[#A58BFF]" />
                      )}
                      {isLocalProvider ? t('localRuntime') : t('cloudOrCustom')}
                    </span>
                  </div>
                </header>
                <div className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-6">
                  <section
                    aria-labelledby="provider-connection-heading"
                    className="min-w-0 rounded-2xl border border-[#30415D]/75 bg-[#111C2D] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.12)] sm:p-5"
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <div aria-hidden="true" className="h-8 w-1 rounded-full bg-[#00E5FF]" />
                      <div className="min-w-0">
                        <h3
                          id="provider-connection-heading"
                          className="text-base font-semibold text-white"
                        >
                          {t('connectionSettings')}
                        </h3>
                        <p className="mt-0.5 text-xs text-[#B2C3D8]">
                          {t('connectionSectionDescription')}
                        </p>
                      </div>
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
                  <section
                    aria-label={t('models')}
                    className="min-w-0 rounded-2xl border border-[#30415D]/75 bg-[#111C2D] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.12)] sm:p-5"
                  >
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
                  </section>
                </div>
                <DialogFooter className="shrink-0 flex flex-row flex-wrap items-center justify-end gap-2 border-t border-[#30415D] bg-[#0C1524] px-4 py-3 sm:px-7 sm:py-4">
                  {savedWithoutModels && (
                    <p className="mr-auto text-xs text-warning">{t('addModelsBeforeChatting')}</p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSaving}
                    className="border-[#405474] text-[#E5E7EB]"
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-[#00E5FF] font-semibold text-[#061524] hover:bg-[#5DEDFB]"
                    disabled={
                      isSaving ||
                      !hasChanges ||
                      (requiresApiKeyForFetch(selectedProvider.id) &&
                        !apiKey.trim() &&
                        !existingProvider) ||
                      (isCustom && (!providerName.trim() || !apiBaseUrl.trim())) ||
                      (apiBaseUrl.trim().length > 0 && !isValidProviderEndpoint(apiBaseUrl))
                    }
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                        {t('common:saving')}
                      </>
                    ) : existingProvider ? (
                      t('common:save')
                    ) : (
                      t('saveConfiguration')
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </main>
        </SidebarProvider>
      </DialogContent>

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
    </Dialog>
  )
}
