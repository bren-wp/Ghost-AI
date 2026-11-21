// Ghost AI by Brendigo
const CSS_COLOR_CHARACTERS = /^[a-z0-9#(),.%/+\s-]+$/i

export function safeChartIdentifier(value: string): string {
  const cleaned = value.replace(/[^a-z0-9_-]/gi, '')
  return cleaned || 'figure'
}

export function safeChartColor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  if (
    !cleaned ||
    cleaned.length > 160 ||
    !CSS_COLOR_CHARACTERS.test(cleaned) ||
    /url\s*\(|expression\s*\(|@import/i.test(cleaned)
  ) {
    return null
  }
  return cleaned
}
