// Ghost AI by Brendigo
'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ModelItem } from './types'

interface EditModelDialogProps {
  open: boolean
  model: ModelItem | null
  onOpenChange: (open: boolean) => void
  onSave: (id: string, modelId: string, displayName: string) => void
}

export function EditModelDialog({ open, model, onOpenChange, onSave }: EditModelDialogProps) {
  const { t } = useTranslation('providers')
  const [modelId, setModelId] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open && model) {
      setModelId(model.modelId)
      setDisplayName(model.displayName)
      setError(null)
    }
  }, [open, model])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!modelId.trim()) {
      setError(t('modelIdRequired'))
      return
    }

    if (!displayName.trim()) {
      setError(t('displayNameRequired'))
      return
    }

    if (model) {
      onSave(model.id, modelId.trim(), displayName.trim())
      onOpenChange(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[490px] space-y-4 rounded-2xl border-[#30415D] bg-[#111C2D] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:max-w-[490px] sm:p-6">
        <DialogTitle className="pr-8 text-xl font-semibold text-white">
          {t('editModel')}
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-[#B2C3D8]">
          {t('modifyModelDetails')}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-model-id">{t('modelId')}</Label>
            <Input
              id="edit-model-id"
              value={modelId}
              onChange={(e) => {
                setModelId(e.target.value)
                setError(null)
              }}
              className="h-10 rounded-xl border-[#405474] bg-[#0D1726]"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-display-name">{t('displayName')}</Label>
            <Input
              id="edit-display-name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                setError(null)
              }}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2 border-t border-[#30415D] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-[#405474]"
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-[#00E5FF] font-semibold text-[#061524] hover:bg-[#5DEDFB]"
            >
              {t('common:save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
