// Ghost AI by Brendigo
'use client'

import { useTranslation } from 'react-i18next'
import { ChevronDown, Loader2, Search, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import type { ModelInfo, LLMProvider } from './types'

interface FetchModelsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProvider: LLMProvider
  isLoading: boolean
  fetchError: string | null
  availableModels: ModelInfo[]
  modelSearchQuery: string
  onModelSearchQueryChange: (query: string) => void
  groupedModels: Record<string, ModelInfo[]>
  onToggleImportModel: (model: ModelInfo) => void
  isModelImported: (rawModelId: string) => boolean
  onRetry: () => void
  onAddManually: () => void
}

export function FetchModelsDialog({
  open,
  onOpenChange,
  selectedProvider,
  isLoading,
  fetchError,
  availableModels,
  modelSearchQuery,
  onModelSearchQueryChange,
  groupedModels,
  onToggleImportModel,
  isModelImported,
  onRetry,
  onAddManually,
}: FetchModelsDialogProps) {
  const { t } = useTranslation('providers')
  const groups = Object.entries(groupedModels)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(86dvh,710px)] min-h-[320px] w-[calc(100vw-32px)] max-w-[780px] flex-col gap-0 overflow-hidden border-[#30415D] bg-[#080F1A] p-0 sm:max-w-[780px]">
        <header className="shrink-0 border-b border-[#30415D] bg-gradient-to-r from-[#12283B] to-[#211B39] px-5 pb-5 pt-6 sm:px-6">
          <DialogTitle className="text-xl font-semibold text-white">{t('availableModels')}</DialogTitle>
          <DialogDescription className="mt-2 max-w-xl text-sm text-[#B4C5DA]">
            {t('selectModelsFrom', { provider: selectedProvider.name })}
          </DialogDescription>
        </header>

        {!isLoading && !fetchError && availableModels.length > 0 && (
          <div className="shrink-0 border-b border-[#30415D]/65 px-5 py-3 sm:px-6">
            <label htmlFor="ghost-discover-model-search" className="sr-only">{t('searchModels')}</label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#93A7C2]" />
              <Input
                id="ghost-discover-model-search"
                type="search"
                placeholder={t('searchModels')}
                value={modelSearchQuery}
                onChange={(event) => onModelSearchQueryChange(event.target.value)}
                className="h-10 rounded-xl border-[#405474] bg-[#111C2D] pl-9"
              />
            </div>
          </div>
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {isLoading ? (
            <div role="status" aria-live="polite" className="flex min-h-44 items-center justify-center gap-3 text-sm text-[#A8B3C8]">
              <Loader2 aria-hidden="true" className="size-6 animate-spin text-[#00E5FF]" />
              {t('fetchingModels')}
            </div>
          ) : fetchError ? (
            <div role="alert" className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center">
              <p className="text-sm font-semibold text-destructive">{t('fetchFailed')}</p>
              <p className="max-w-md break-words text-xs text-[#C0CCE0]">{fetchError}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>{t('common:retry')}</Button>
                <Button type="button" variant="outline" size="sm" onClick={onAddManually}>{t('addManually')}</Button>
              </div>
            </div>
          ) : availableModels.length > 0 ? (
            <div className="min-w-0 space-y-3">
              {groups.length === 0 && modelSearchQuery && (
                <div role="status" className="flex min-h-36 items-center justify-center text-center text-sm text-[#A8B3C8]">
                  {t('noModelsMatching', { query: modelSearchQuery })}
                </div>
              )}
              {groups.map(([groupName, groupModels]) => (
                <Collapsible key={groupName} defaultOpen={groups.length <= 5}>
                  <div className="min-w-0 overflow-hidden rounded-xl border border-[#34445E] bg-[#111C2D]">
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto min-h-12 w-full justify-between gap-2 rounded-none px-4 py-3 text-left hover:bg-[#223855]"
                      >
                        <span className="min-w-0 truncate font-semibold text-white">{groupName}</span>
                        <span className="flex shrink-0 items-center gap-2 text-xs text-[#A8B3C8]">
                          {groupModels.length} {groupModels.length === 1 ? t('modelUnit') : t('modelsUnit')}
                          <ChevronDown aria-hidden="true" className="size-4" />
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-1 border-t border-[#34445E] p-2">
                        {groupModels.map((model) => {
                          const imported = isModelImported(model.id)
                          return (
                            <div key={model.id} className="flex min-w-0 items-start gap-3 rounded-lg border border-transparent px-2 py-3 hover:border-[#00E5FF]/20 hover:bg-[#1B2C42]">
                              <Checkbox
                                checked={imported}
                                aria-label={`${t('addModel')}: ${model.name}`}
                                onCheckedChange={() => onToggleImportModel(model)}
                                className="mt-0.5 shrink-0"
                              />
                              <button type="button" onClick={() => onToggleImportModel(model)} className="min-w-0 flex-1 text-left focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-[#00E5FF]">
                                <span className="block break-words text-sm font-medium text-[#E5E7EB]">{model.name}</span>
                                <span className="mt-0.5 block break-all font-mono text-xs text-[#A8B3C8]">{model.id}</span>
                                {model.description && <span className="mt-1 block break-words text-xs leading-relaxed text-[#A9B9CE]">{model.description}</span>}
                                {model.context_length && (
                                  <span className="mt-1 inline-flex rounded-md bg-[#223855] px-2 py-0.5 text-[11px] text-[#9FE8F4]">
                                    {(model.context_length / 1000).toFixed(0)}K ctx
                                  </span>
                                )}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center gap-2 text-sm text-[#A8B3C8]">
              <Server aria-hidden="true" className="size-7 text-[#76C9DC]" />
              {t('noModelsFound')}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-[#30415D] bg-[#0C1524] p-4 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-[#405474]">
            {t('common:ok')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
