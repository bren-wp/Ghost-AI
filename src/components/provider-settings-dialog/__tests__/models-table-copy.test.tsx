// Ghost AI by Brendigo
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { ModelsTable } from '../models-table'
import '@/lib/i18n'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const noop = () => {}
const provider = { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' }
const models = [{
  id: 'model-1',
  modelId: 'gpt-model-test-123',
  displayName: 'Sample model',
  isExisting: true,
}]

beforeEach(() => {
  vi.clearAllMocks()
})

function renderModelList() {
  render(
    <ModelsTable
      models={models}
      selectedProvider={provider}
      apiKey="sk-test"
      apiBaseUrl={provider.baseUrl}
      onOpenFetchModal={noop}
      onOpenAddModelDialog={noop}
      onUpdateModelName={noop}
      onDeleteModel={noop}
      onModelSettings={noop}
    />,
  )
}

async function openCopyMenu() {
  const trigger = screen.getByRole('button', { name: 'Actions for Sample model' })
  fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' })
  return screen.findByRole('menuitem', { name: 'Copy Model ID' })
}

describe('model ID copy action', () => {
  it('copies the raw model ID (not the user-facing display name)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderModelList()
    fireEvent.click(await openCopyMenu())
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('gpt-model-test-123'))
    expect(toast.success).toHaveBeenCalledWith('Model ID copied')
  })

  it('reports clipboard permission failure without losing the model', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderModelList()
    fireEvent.click(await openCopyMenu())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      'Unable to copy model ID. Check clipboard permissions.',
    ))
    expect(screen.getByDisplayValue('Sample model')).toBeInTheDocument()
  })
})
