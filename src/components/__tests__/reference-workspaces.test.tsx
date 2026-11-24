// Ghost AI by Brendigo
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import i18n from '@/lib/i18n'
import { AgentsWorkspace, DocumentsWorkspace, ProvidersWorkspace, SettingsWorkspace } from '../reference-workspaces'
import { useAssistantStore } from '@/stores/assistantStore'
import type { Assistant } from '@/types/assistant'

void i18n

describe('reference workspaces', () => {
  beforeEach(() => useAssistantStore.setState({ assistants: [], isLoading: false, error: null }))

  it('does not invent assistants and opens the real create action', () => {
    const onCreate = vi.fn()
    const onSelect = vi.fn()
    render(<AgentsWorkspace onCreate={onCreate} onSelect={onSelect} />)
    expect(screen.getByText(/No assistants yet/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create an assistant' }))
    expect(onCreate).toHaveBeenCalledOnce()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('opens the selected stored assistant without running it', () => {
    const assistant: Assistant = { id: 'agent-1', name: 'Research agent', description: 'Review sources', system_prompt: '', model_id: 'model', tool_ids: [], skill_ids: [], avatar_type: 'text', is_starred: false, created_at: '', updated_at: '' }
    useAssistantStore.setState({ assistants: [assistant] })
    const onSelect = vi.fn()
    render(<AgentsWorkspace onCreate={vi.fn()} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /Research agent/ }))
    expect(onSelect).toHaveBeenCalledWith('agent-1')
  })

  it('does not present fake document results', () => {
    const onStart = vi.fn()
    render(<DocumentsWorkspace onStart={onStart} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Open document conversation' }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('routes cloud and local cards to the existing provider editor', () => {
    const onConfigure = vi.fn()
    render(<ProvidersWorkspace onConfigure={onConfigure} />)
    fireEvent.click(screen.getByRole('button', { name: /Cloud providers/ }))
    fireEvent.click(screen.getByRole('button', { name: /Local models/ }))
    fireEvent.click(screen.getByRole('button', { name: /Connection settings/ }))
    expect(onConfigure.mock.calls).toEqual([['openai'], ['ollama'], []])
  })

  it('routes settings cards to real sections', () => {
    const onOpen = vi.fn()
    render(<SettingsWorkspace onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /Appearance/ }))
    fireEvent.click(screen.getByRole('button', { name: /Security/ }))
    fireEvent.click(screen.getByRole('button', { name: /Updates/ }))
    expect(onOpen.mock.calls).toEqual([['appearance'], ['permissions'], ['about']])
  })
})
