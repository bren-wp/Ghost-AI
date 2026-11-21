// Ghost AI by Brendigo
import { describe, expect, it, beforeEach } from 'vitest'
import { LICENSE_ACCEPTANCE_KEY, hasAcceptedLicense, acceptLicense } from '../ghost-ai-license-consent'

describe('Ghost AI EULA consent', () => {
  beforeEach(() => localStorage.clear())

  it('requires a user decision on first launch', () => {
    expect(hasAcceptedLicense()).toBe(false)
  })

  it('remembers an explicit acceptance', () => {
    expect(acceptLicense()).toBe(true)
    expect(localStorage.getItem(LICENSE_ACCEPTANCE_KEY)).toBe('accepted')
    expect(hasAcceptedLicense()).toBe(true)
  })

  it('does not treat other values as consent', () => {
    localStorage.setItem(LICENSE_ACCEPTANCE_KEY, 'declined')
    expect(hasAcceptedLicense()).toBe(false)
  })
})
