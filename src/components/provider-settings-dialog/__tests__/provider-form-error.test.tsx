// Ghost AI by Brendigo
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { ProviderForm } from '../provider-form'
import '@/lib/i18n'

const invokeMock = vi.mocked(invoke)
const provider = { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' }
const model = { id: 'm1', modelId: 'gpt-test', displayName: 'Test model', isExisting: true }
const noop = () => {}

beforeEach(() => invokeMock.mockReset())

function renderProviderForm() {
  return render(
    <ProviderForm
      apiKey="sk-visible-only-to-backend"
      onApiKeyChange={noop}
      showApiKey={false}
      onShowApiKeyChange={noop}
      apiBaseUrl={provider.baseUrl}
      onApiBaseUrlChange={noop}
      selectedProvider={provider}
      providerName=""
      onProviderNameChange={noop}
      apiStyle="chat_completions"
      onApiStyleChange={noop}
      compatibilityType="openai"
      onCompatibilityTypeChange={noop}
      models={[model]}
    />,
  )
}

describe('AI provider connection error handling', () => {
  it('does not display secret-bearing provider error responses', async () => {
    invokeMock.mockResolvedValue({
      success: false, latency_ms: 10,
      error: 'https://api.example.com?token=other-secret bearer sk-visible-only-to-backend',
    })
    renderProviderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent('Connection failed')
    expect(screen.getByRole('alert').textContent).not.toContain('other-secret')
    expect(screen.getByRole('alert').textContent).not.toContain('sk-visible-only-to-backend')
  })

  it('does not display secret-bearing network exceptions', async () => {
    invokeMock.mockImplementation(((command: string) => {
      if (command === 'check_provider_api') return Promise.reject(new Error('secret-in-transport'))
      return Promise.resolve(null)
    }) as never)
    renderProviderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert').textContent).not.toContain('secret-in-transport')
  })
})
