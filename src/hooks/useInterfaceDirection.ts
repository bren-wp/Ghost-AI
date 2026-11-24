// Ghost AI by Brendigo
import { useTranslation } from 'react-i18next'
import { getInterfaceDirection } from '@/lib/interface-direction'

/** Subscribe to the selected language, including while a portal is open. */
export function useInterfaceDirection() {
  const { i18n } = useTranslation('common')
  return getInterfaceDirection(i18n?.language)
}
