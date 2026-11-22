// Ghost AI by Brendigo

/** Accept standard API endpoints while rejecting unsafe URL schemes and embedded credentials. */
export function isValidProviderEndpoint(value: string): boolean {
  if (!value.trim() || /[\u0000-\u001f\u007f]/.test(value)) return false
  try {
    const url = new URL(value.trim())
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    )
  } catch {
    return false
  }
}

/** Show a warning for remote plaintext endpoints; never block legitimate LAN models. */
export function isPlaintextRemoteEndpoint(value: string): boolean {
  if (!isValidProviderEndpoint(value)) return false
  const url = new URL(value.trim())
  return (
    url.protocol === 'http:' &&
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  )
}
