// Ghost AI by Brendigo
'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, ListChecks, MoreHorizontal, Plus, Search, Server } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ModelItem, LLMProvider } from './types'
import { isSupportedFetchProvider, requiresApiKeyForFetch } from './constants'
import { isValidProviderEndpoint } from './provider-endpoint'

interface ModelsTableProps {
  models: ModelItem[]
  selectedProvider: LLMProvider
  apiKey: string
  apiBaseUrl?: string
  onOpenFetchModal: () => void
  onOpenAddModelDialog: () => void
  onUpdateModelName: (id: string, newDisplayName: string) => void
  onDeleteModel: (id: string) => void
  onModelSettings: (model: ModelItem) => void
}

export function ModelsTable({
  models,
  selectedProvider,
  apiKey,
  apiBaseUrl,
  onOpenFetchModal,
  onOpenAddModelDialog,
  onUpdateModelName,
  onDeleteModel,
  onModelSettings,
}: ModelsTableProps) {
  const { t } = useTranslation('providers')
  const [search, setSearch] = useState('')
  useEffect(() => {
    setSearch('')
  }, [selectedProvider.id, selectedProvider.name, selectedProvider.baseUrl])
  useEffect(() => {
    if (models.length < 5) setSearch('')
  }, [models.length])
  const activeSearch = models.length >= 5 ? search.trim().toLocaleLowerCase() : ''
  const visibleModels = models.filter((model) =>
    [model.modelId, model.displayName].some((value) =>
      value.toLocaleLowerCase().includes(activeSearch)
    )
  )
  const canDiscoverModels =
    isSupportedFetchProvider(selectedProvider.id) &&
    (!apiBaseUrl?.trim() || isValidProviderEndpoint(apiBaseUrl)) &&
    (!requiresApiKeyForFetch(selectedProvider.id) || Boolean(apiKey.trim()))

  const copyModelId = async (modelId: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(modelId)
      toast.success(t('modelIdCopied'))
    } catch {
      toast.error(t('modelIdCopyFailed'))
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white">{t('models')}</h3>
          <p className="mt-1 text-xs text-[#B2C3D8]">
            {models.length
              ? t('modelCount', { count: models.length })
              : t('modelSectionDescription')}
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenAddModelDialog}
            className="border-[#405474] text-[#E5E7EB]"
          >
            <Plus aria-hidden="true" className="size-4" />
            {t('addModel')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenFetchModal}
            disabled={!canDiscoverModels}
            className="border-[#00E5FF]/45 bg-[#00E5FF]/10 text-[#A6F4FD] hover:bg-[#00E5FF]/20"
          >
            <ListChecks aria-hidden="true" className="size-4" />
            {t('manageModels')}
          </Button>
        </div>
      </div>

      {models.length >= 5 && (
        <div className="relative">
          <label htmlFor="ghost-model-search" className="sr-only">
            {t('searchConfiguredModels')}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#93A7C2]"
          />
          <Input
            id="ghost-model-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('searchConfiguredModels')}
            className="h-10 rounded-xl border-[#405474] bg-[#0D1726] pl-9"
          />
        </div>
      )}

      {models.length === 0 ? (
        <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#405474] bg-[#0D1726] px-4 py-6 text-center">
          <Server aria-hidden="true" className="size-7 text-[#75C9DA]" />
          <div>
            <p className="text-sm font-medium text-[#E5E7EB]">{t('noModelsAdded')}</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#A8B3C8]">
              {t('modelSectionDescription')}
            </p>
          </div>
          {canDiscoverModels && (
            <Button
              type="button"
              size="sm"
              onClick={onOpenFetchModal}
              className="bg-[#00E5FF] text-[#061524] hover:bg-[#5DEDFB]"
            >
              {t('fetchModels')}
            </Button>
          )}
        </div>
      ) : (
        <div role="list" aria-label={t('models')} className="min-w-0 space-y-2">
          {visibleModels.map((model) => (
            <div
              role="listitem"
              key={model.id}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#34445E] bg-[#0D1726] p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#223855] text-[#00E5FF]"
                >
                  <Server className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8FA5C5]">
                    {t('modelId')}
                  </p>
                  <p
                    className="break-all font-mono text-xs leading-relaxed text-[#D7E7F8]"
                    title={model.modelId}
                  >
                    {model.modelId}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`ghost-model-${model.id}`}
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8FA5C5]"
                  >
                    {t('modelName')}
                  </label>
                  <Input
                    id={`ghost-model-${model.id}`}
                    value={model.displayName}
                    onChange={(event) => onUpdateModelName(model.id, event.target.value)}
                    className="h-9 w-full min-w-0 rounded-lg border-[#405474] bg-[#162337]"
                    title={model.modelId}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${model.displayName}`}
                      className="mt-4 shrink-0 text-[#C9D7EA]"
                    >
                      <MoreHorizontal aria-hidden="true" className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => void copyModelId(model.modelId)}>
                      <Copy aria-hidden="true" className="mr-2 size-4" />
                      {t('copyModelId')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onModelSettings(model)}>
                      {t('common:edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDeleteModel(model.id)}
                    >
                      {t('common:delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          {visibleModels.length === 0 && (
            <p
              role="status"
              className="rounded-xl border border-dashed border-[#405474] p-5 text-center text-sm text-[#B2C3D8]"
            >
              {t('noMatchingModels')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
