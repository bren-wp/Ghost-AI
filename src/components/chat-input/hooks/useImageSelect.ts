// Ghost AI by Brendigo
import type { Attachment } from '../types'
import { useNativeAttachmentPicker } from './useNativeAttachmentPicker'

export interface UseImageSelectReturn {
  handleImageSelect: () => Promise<void>
}

export function useImageSelect(
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>
): UseImageSelectReturn {
  const handleImageSelect = useNativeAttachmentPicker('image', setAttachments)
  return { handleImageSelect }
}
