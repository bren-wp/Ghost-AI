// Ghost AI by Brendigo
import { useCallback } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { type Attachment, SUPPORTED_DOCUMENT_EXTENSIONS, SUPPORTED_IMAGE_EXTENSIONS } from '../types'
import { isRejected, readDocumentFromPath, readImageFromPath, reportRejected, type RejectedFile } from '../attachment-ingest'
import { logger } from '@/lib/logger'

type PickerKind = 'document' | 'image'

/**
 * Shared native picker pipeline. Document reads continue after individual errors
 * (with a user notification); image reads retain their existing fail-fast behavior.
 * Paths and raw backend error details are not written to frontend diagnostics.
 */
export function useNativeAttachmentPicker(
  kind: PickerKind,
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>
): () => Promise<void> {
  const { t } = useTranslation('messages')
  return useCallback(async () => {
    const image = kind === 'image'
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: image ? 'Images' : 'Documents',
          extensions: image ? SUPPORTED_IMAGE_EXTENSIONS : SUPPORTED_DOCUMENT_EXTENSIONS,
        }],
      })
      if (!selected) return
      const files = Array.isArray(selected) ? selected : [selected]
      const rejected: RejectedFile[] = []
      for (const path of files) {
        // Preserve the established basename fallback and format policy.
        const name = path.split('/').pop() || path.split('\\').pop() || (image ? 'image' : 'file')
        try {
          const result = image
            ? await readImageFromPath(path, name)
            : await readDocumentFromPath(t, path, name)
          if (isRejected(result)) {
            rejected.push(result)
          } else {
            setAttachments((prev) => [...prev, result])
          }
        } catch (error) {
          if (image) throw error
          logger.error('[AttachmentPicker] Failed to read selected document')
          toast.error(t('failedToReadFile', { file: name }), {
            description: error instanceof Error ? error.message : String(error),
          })
        }
      }
      reportRejected(t, rejected)
    } catch {
      logger.error('[AttachmentPicker] Failed to select or read attachment')
    }
  }, [kind, setAttachments, t])
}
