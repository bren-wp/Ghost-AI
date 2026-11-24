// Ghost AI by Brendigo
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import i18n from '@/lib/i18n'
import { WorkspaceHome } from '../workspace-home'

void i18n

describe('Ghost AI reference Home workspace', () => {
  it('renders the four reference actions and dispatches only the selected callback', () => {
    const onConversation = vi.fn()
    const onDocument = vi.fn()
    const onAgents = vi.fn()
    const onProviders = vi.fn()
    render(<WorkspaceHome {...{ onConversation, onDocument, onAgents, onProviders }} />)
    expect(screen.getByRole('heading', { name: 'Your workspace. Your ideas.' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Analyze a document' })).toHaveAccessibleDescription('Start a conversation and attach a file')
    fireEvent.click(screen.getByRole('button', { name: 'Start a conversation' }))
    expect(onConversation).toHaveBeenCalledTimes(1)
    expect(onDocument).not.toHaveBeenCalled()
    expect(onAgents).not.toHaveBeenCalled()
    expect(onProviders).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Analyze a document' }))
    fireEvent.click(screen.getByRole('button', { name: 'Run an agent' }))
    fireEvent.click(screen.getByRole('button', { name: 'Your AI providers' }))
    expect(onDocument).toHaveBeenCalledTimes(1)
    expect(onAgents).toHaveBeenCalledTimes(1)
    expect(onProviders).toHaveBeenCalledTimes(1)
  })
})
