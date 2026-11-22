// Ghost AI by Brendigo
import { describe, expect, it } from 'vitest'
import { isPlaintextRemoteEndpoint, isValidProviderEndpoint } from '../provider-endpoint'

describe('provider endpoint validation', () => {
  it.each([
    'https://api.example.com/v1',
    'http://localhost:1234/v1',
    'http://127.0.0.1:11434',
    'http://192.168.1.8:8000/v1',
    'http://[::1]:1234/v1',
  ])('allows configured HTTP(S) API server: %s', (url) => {
    expect(isValidProviderEndpoint(url)).toBe(true)
  })

  it.each([
    '',
    'not-a-url',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'data:text/plain,hello',
    'ftp://api.example.com',
    'https://user:password@api.example.com/v1',
    'https://api.example.com/\nAuthorization: key',
  ])('rejects invalid or secret-bearing endpoint: %s', (url) => {
    expect(isValidProviderEndpoint(url)).toBe(false)
  })

  it('warns only for remote unencrypted endpoints', () => {
    expect(isPlaintextRemoteEndpoint('http://192.168.1.8:8000')).toBe(true)
    expect(isPlaintextRemoteEndpoint('http://api.example.com/v1')).toBe(true)
    expect(isPlaintextRemoteEndpoint('http://localhost:1234/v1')).toBe(false)
    expect(isPlaintextRemoteEndpoint('https://api.example.com/v1')).toBe(false)
  })
})
