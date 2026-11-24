// Ghost AI by Brendigo
import type { Attachment } from '../types'
import { useNativeAttachmentPicker } from './useNativeAttachmentPicker'

export interface UseFileSelectReturn {
  handleFileSelect: () => Promise<void>
}

export function useFileSelect(
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>
): UseFileSelectReturn {
  const handleFileSelect = useNativeAttachmentPicker('document', setAttachments)
  return { handleFileSelect }
}
