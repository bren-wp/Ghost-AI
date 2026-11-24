// Ghost AI by Brendigo
import { Bot, FileText, MessagesSquare, Plug } from 'lucide-react'
import { Workspace, WorkspaceCard, WorkspaceGrid } from '@/components/ui/workspace'
import { useTranslation } from 'react-i18next'

interface WorkspaceHomeProps {
  onConversation: () => void
  onDocument: () => void
  onAgents: () => void
  onProviders: () => void
}

/** Reference Home surface; every card opens an existing real feature. */
export function WorkspaceHome({ onConversation, onDocument, onAgents, onProviders }: WorkspaceHomeProps) {
  const { t } = useTranslation('chat')
  const actions = [
    { key: 'workspaceConversation', icon: MessagesSquare, run: onConversation },
    { key: 'workspaceDocument', icon: FileText, run: onDocument },
    { key: 'workspaceAgents', icon: Bot, run: onAgents },
    { key: 'workspaceProviders', icon: Plug, run: onProviders },
  ] as const

  return (
    <Workspace title={t('workspaceTitle')} description={t('workspaceSubtitle')} headingId="workspace-home-title">
      <WorkspaceGrid>
        {actions.map(({ key, icon, run }) => (
          <WorkspaceCard
            key={key}
            id={`home-action-${key}`}
            variant="home"
            icon={icon}
            title={t(key)}
            description={t(`${key}Description`)}
            onClick={run}
          />
        ))}
      </WorkspaceGrid>
    </Workspace>
  )
}
