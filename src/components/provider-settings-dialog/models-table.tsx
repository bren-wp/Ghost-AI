// Ghost AI by Brendigo
'use client'

import { useTranslation } from 'react-i18next'
import { MoreHorizontal, ListChecks, Plus, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

  const copyModelId = async (modelId: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(modelId)
      toast.success(t('modelIdCopied'))
    } catch {
      // Browser permissions and insecure contexts can block the clipboard.
      toast.error(t('modelIdCopyFailed'))
    }
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <Label>{t('models')}</Label>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onOpenAddModelDialog}>
            <Plus className="size-4 mr-2" />
            {t('addModel')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenFetchModal}
            disabled={
              !isSupportedFetchProvider(selectedProvider.id) ||
              (Boolean(apiBaseUrl?.trim()) && !isValidProviderEndpoint(apiBaseUrl!)) ||
              (requiresApiKeyForFetch(selectedProvider.id) && !apiKey.trim())
            }
          >
            <ListChecks className="size-4 mr-2" />
            {t('manageModels')}
          </Button>
        </div>
      </div>
      <div className="min-w-0 max-w-full overflow-x-auto rounded-md border">
        <Table className="min-w-[340px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">{t('modelId')}</TableHead>
              <TableHead className="w-[45%]">{t('modelName')}</TableHead>
              <TableHead className="w-[10%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.length > 0 ? (
              models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div className="truncate" title={model.modelId}>
                      {model.modelId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={model.displayName}
                      onChange={(e) => onUpdateModelName(model.id, e.target.value)}
                      className="h-8 w-full"
                      title={model.modelId} // Show raw model ID on hover
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${model.displayName}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => void copyModelId(model.modelId)}>
                          <Copy className="mr-2 size-4" aria-hidden="true" />
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
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  {t('noModelsAdded')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
