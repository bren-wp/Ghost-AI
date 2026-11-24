// Ghost AI by Brendigo
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FileText } from 'lucide-react'
import { Workspace, WorkspaceCard, WorkspaceGrid } from '../workspace'

describe('shared reference workspace components', () => {
  it('preserves the branded card variants and distinct accessible names', () => {
    const action = vi.fn()
    render(
      <Workspace title="Workspace" description="Description" headingId="workspace-title">
        <WorkspaceGrid>
          <WorkspaceCard id="home-file" variant="home" icon={FileText} title="Choose files" description="Home action" onClick={action} />
          <WorkspaceCard icon={FileText} title="Document summary" description="Read-only information" />
          <WorkspaceCard icon={FileText} title="Open settings" description="Standard action" onClick={action} />
        </WorkspaceGrid>
      </Workspace>
    )
    expect(screen.getByRole('region', { name: 'Workspace' })).toBeInTheDocument()
    const home = screen.getByRole('button', { name: 'Choose files' })
    const standard = screen.getByRole('button', { name: 'Open settings' })
    expect(home).toHaveAccessibleDescription('Home action')
    expect(home).toHaveClass('bg-card', 'lg:min-h-[190px]')
    expect(standard).toHaveClass('bg-[#172338]', 'lg:min-h-[170px]')
    expect(screen.getAllByRole('button')).toHaveLength(2)
    fireEvent.click(home)
    expect(action).toHaveBeenCalledTimes(1)
    fireEvent.click(standard)
    expect(action).toHaveBeenCalledTimes(2)
  })
})
