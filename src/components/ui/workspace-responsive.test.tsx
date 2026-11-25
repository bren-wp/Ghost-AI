// Ghost AI by Brendigo
import { fireEvent, render, screen } from '@testing-library/react'
import { FileText } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { Workspace, WorkspaceCard, WorkspaceGrid } from './workspace'

describe('reference workspace responsive contract', () => {
  it('uses the content container rather than the window for the two-column breakpoint', () => {
    const { container } = render(
      <Workspace title="Workspace" description="Choose an action">
        <WorkspaceGrid><span>Content</span></WorkspaceGrid>
      </Workspace>,
    )
    const elements = Array.from(container.querySelectorAll('div'))
    expect(elements.some(el => el.classList.contains('@container/workspace'))).toBe(true)
    expect(elements.some(el => el.classList.contains('@min-[480px]/workspace:grid-cols-2'))).toBe(true)
  })

  it('keeps a long localized title accessible and the action functional', () => {
    const onClick = vi.fn()
    const title = 'Dokumentenverarbeitungsarbeitsbereich'.repeat(3)
    const description = 'Analyze documents'
    render(
      <Workspace title="Workspace" description="Choose an action">
        <WorkspaceGrid>
          <WorkspaceCard icon={FileText} title={title} description={description} onClick={onClick} variant="home" />
        </WorkspaceGrid>
      </Workspace>,
    )
    const card = screen.getByRole('button', { name: title })
    expect(card.getAttribute('aria-describedby')).toBe(screen.getByText(description).id)
    expect(screen.getByText(title).classList.contains('[overflow-wrap:anywhere]')).toBe(true)
    fireEvent.click(card)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
