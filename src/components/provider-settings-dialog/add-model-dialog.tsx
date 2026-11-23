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

interface AddModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddModel: (modelId: string, displayName?: string) => boolean
}

export function AddModelDialog({ open, onOpenChange, onAddModel }: AddModelDialogProps) {
  const { t } = useTranslation('providers')
  const [modelId, setModelId] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!modelId.trim()) {
      setError(t('modelIdRequired'))
      return
    }

    const success = onAddModel(modelId, displayName || undefined)
    if (!success) {
      setError(t('modelAlreadyExists'))
      return
    }

    setModelId('')
    setDisplayName('')
    onOpenChange(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setModelId('')
      setDisplayName('')
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[490px] space-y-4 rounded-2xl border-[#30415D] bg-[#111C2D] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:max-w-[490px] sm:p-6">
        <DialogTitle className="pr-8 text-xl font-semibold text-white">
          {t('addModelManually')}
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-[#B2C3D8]">
          {t('enterModelIdentifier')}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="model-id">{t('modelId')}</Label>
            <Input
              id="model-id"
              placeholder={t('modelIdPlaceholder')}
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
            <Label htmlFor="display-name">{t('displayNameOptional')}</Label>
            <Input
              id="display-name"
              placeholder={t('displayNamePlaceholder')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-10 rounded-xl border-[#405474] bg-[#0D1726]"
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
              {t('common:add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
