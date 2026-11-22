// Ghost AI by Brendigo
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProviderForm } from '../provider-form'
import { ModelsTable } from '../models-table'
import type { LLMProvider, ModelItem } from '../types'
import '@/lib/i18n'

const localProvider: LLMProvider = {
  id: 'lmstudio',
  name: 'LM Studio',
  baseUrl: 'http://localhost:1234/v1',
}
const model: ModelItem = {
  id: 'local-model-1',
  modelId: 'local-model-1',
  displayName: 'Local Model',
  isExisting: true,
}
const noop = () => {}

describe('keyless local provider controls', () => {
  it('enables model discovery without an API key', () => {
    render(
      <ModelsTable
        models={[]}
        selectedProvider={localProvider}
        apiKey=""
        onOpenFetchModal={noop}
        onOpenAddModelDialog={noop}
        onUpdateModelName={noop}
        onDeleteModel={noop}
        onModelSettings={noop}
      />,
    )
    expect(screen.getByRole('button', { name: 'Manage Models' })).toBeEnabled()
  })

  it('enables connection testing for a configured local model', () => {
    render(
      <ProviderForm
        apiKey=""
        onApiKeyChange={noop}
        showApiKey={false}
        onShowApiKeyChange={noop}
        apiBaseUrl={localProvider.baseUrl}
        onApiBaseUrlChange={noop}
        selectedProvider={localProvider}
        providerName=""
        onProviderNameChange={noop}
        apiStyle="chat_completions"
        onApiStyleChange={noop}
        compatibilityType="openai"
        onCompatibilityTypeChange={noop}
        models={[model]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Test Connection' })).toBeEnabled()
  })
})
