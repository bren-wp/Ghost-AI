// Ghost AI by Brendigo
'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
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
    (!existingProvider && (isCustom || !requiresApiKeyForFetch(selectedProvider.id) || apiKey.trim().length > 0))

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

  const handleCustomProviderSelect = (provider: typeof selectedProvider, storedProviderId?: string) => {
    const storeProvider = storedProviderId
      ? storeProviders.find((p) => p.id === storedProviderId)
      : storeProviders.find((p) => p.provider_type === provider.id && p.name === provider.name)
    setEditingCustomProviderId(storeProvider?.id ?? null)
    setSelectedProvider(provider)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92dvh,760px)] w-[min(96vw,960px)] max-w-[96vw] min-w-0 flex-col gap-0 overflow-hidden p-0 sm:flex-row">
        <DialogTitle className="sr-only">{t('dialogTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('dialogDescription')}</DialogDescription>
        <SidebarProvider className="min-h-0 min-w-0 flex-1">
          <ProviderSidebar
            selectedProvider={selectedProvider}
            onSelectProvider={(p, storedId) => {
              if (p.isCustom) {
                handleCustomProviderSelect(p, storedId)
              } else {
                handleSidebarSelect(p)
              }
            }}
            storeProviders={storeProviders}
            editingCustomProviderId={editingCustomProviderId}
          />
          <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ProviderSelect
              className="shrink-0 border-b border-border p-3 md:hidden"
              selectedProvider={selectedProvider}
              editingCustomProviderId={editingCustomProviderId}
              storeProviders={storeProviders}
              onSelectProvider={(provider, storedId) => provider.isCustom ? handleCustomProviderSelect(provider, storedId) : handleSidebarSelect(provider)}
            />
            {loadError ? (
              <div role="alert" className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm">
                <p className="text-destructive">{loadError}</p>
                <Button type="button" variant="outline" onClick={retryLoad}>{t('common:retry')}</Button>
              </div>
            ) : !isDataLoaded ? (
              <div role="status" aria-live="polite" className="flex flex-1 items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                {t("common:loading")}
              </div>
            ) : (
              <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">{t('providers')}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{displayName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="min-w-0 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {existingProvider ? t('common:edit') : t('common:add')} {displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {existingProvider
                      ? t('manageProviderDescription', { name: displayName })
                      : isCustom
                        ? t('configureCustomEndpoint')
                        : t('configureApiSettings', { name: displayName })}
                  </p>
                </div>

                <Separator />

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

                <ModelsTable
                  models={models}
                  selectedProvider={selectedProvider}
                  apiKey={apiKey}
                  onOpenFetchModal={handleOpenFetchModal}
                  onOpenAddModelDialog={() => setAddModelDialogOpen(true)}
                  onUpdateModelName={handleUpdateModelName}
                  onDeleteModel={handleDeleteModel}
                  onModelSettings={handleModelSettings}
                />
              </div>
            </div>
            <DialogFooter className="shrink-0 flex flex-wrap items-center gap-2 border-t p-3 sm:justify-end sm:p-4">
              {savedWithoutModels && (
                <p className="mr-auto text-sm text-warning">{t('addModelsBeforeChatting')}</p>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                {t('common:cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  isSaving || !hasChanges || (requiresApiKeyForFetch(selectedProvider.id) && !apiKey.trim()) ||
                  (isCustom && (!providerName.trim() || !apiBaseUrl.trim()))
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
