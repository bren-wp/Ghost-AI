// Ghost AI by Brendigo
export type InterfaceDirection = 'ltr' | 'rtl'

/** Direction is determined by the UI locale, not by conversation content. */
export function getInterfaceDirection(language?: string): InterfaceDirection {
  return language?.toLowerCase().split(/[-_]/)[0] === 'ar' ? 'rtl' : 'ltr'
}

export function applyInterfaceDirection(language: string, root: HTMLElement = document.documentElement) {
  root.lang = language
  root.dir = getInterfaceDirection(language)
}
