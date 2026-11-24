// Ghost AI by Brendigo
import { Bot, Cloud, FileText, HardDrive, Info, MessageSquare, Paintbrush, Plus, Settings, Shield, Sparkles, RefreshCw } from 'lucide-react'
import { Workspace, WorkspaceCard, WorkspaceGrid } from '@/components/ui/workspace'
import { useTranslation } from 'react-i18next'
import { useAssistantStore } from '@/stores/assistantStore'
import { Button } from '@/components/ui/button'

export function AgentsWorkspace({ onSelect, onCreate }: { onSelect: (id: string) => void; onCreate: () => void }) {
  const { t } = useTranslation('chat')
  const assistants = useAssistantStore((s) => s.assistants)
  const loading = useAssistantStore((s) => s.isLoading)
  const error = useAssistantStore((s) => s.error)
  return (
    <Workspace title={t('reference_agentsTitle')} description={t('reference_agentsSubtitle')}>
      <div><Button onClick={onCreate}><Plus aria-hidden="true" />{t('reference_agentsCreate')}</Button></div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : loading ? (
        <p role="status" className="text-sm text-muted-foreground">{t('common:loading')}</p>
      ) : assistants.length === 0 ? (
        <WorkspaceCard icon={Bot} title={t('reference_agentsCreate')} description={t('reference_agentsEmpty')} />
      ) : (
        <WorkspaceGrid>
          {assistants.map((assistant) => (
            <WorkspaceCard key={assistant.id} icon={Bot} title={assistant.name} description={assistant.description || assistant.role || t('reference_agentsReview')} onClick={() => onSelect(assistant.id)} />
          ))}
        </WorkspaceGrid>
      )}
    </Workspace>
  )
}

export function DocumentsWorkspace({ onStart, starting = false }: { onStart: () => void; starting?: boolean }) {
  const { t } = useTranslation('chat')
  return (
    <Workspace title={t('reference_documentsTitle')} description={t('reference_documentsSubtitle')}>
      <section className="rounded-2xl border border-border bg-[#172338] p-5">
        <FileText aria-hidden="true" className="mb-3 size-7 text-primary" />
        <h3 className="font-semibold">{t('reference_documentsFiles')}</h3>
        <p className="my-3 text-sm leading-relaxed text-muted-foreground">{t('reference_documentsFilesDescription')}</p>
        <Button onClick={onStart} disabled={starting}>{starting ? t('common:loading') : t('reference_documentsStart')}</Button>
      </section>
      <WorkspaceGrid>
        <WorkspaceCard icon={Sparkles} title={t('reference_documentsSummary')} description={t('reference_documentsSummaryDescription')} />
        <WorkspaceCard icon={MessageSquare} title={t('reference_documentsFollowUp')} description={t('reference_documentsFollowUpDescription')} />
      </WorkspaceGrid>
    </Workspace>
  )
}

export function ProvidersWorkspace({ onConfigure }: { onConfigure: (id?: string) => void }) {
  const { t } = useTranslation('chat')
  return (
    <Workspace title={t('reference_providersTitle')} description={t('reference_providersSubtitle')}>
      <WorkspaceGrid>
        <WorkspaceCard icon={Cloud} title={t('reference_providersCloud')} description={t('reference_providersCloudDescription')} onClick={() => onConfigure('openai')} />
        <WorkspaceCard icon={HardDrive} title={t('reference_providersLocal')} description={t('reference_providersLocalDescription')} onClick={() => onConfigure('ollama')} />
      </WorkspaceGrid>
      <WorkspaceCard icon={Settings} title={t('reference_providersConnections')} description={t('reference_providersConnectionsDescription')} onClick={() => onConfigure()} />
    </Workspace>
  )
}

export function SettingsWorkspace({ onOpen }: { onOpen: (section?: string) => void }) {
  const { t } = useTranslation('chat')
  return (
    <Workspace title={t('reference_settingsTitle')} description={t('reference_settingsSubtitle')}>
      <WorkspaceGrid>
        <WorkspaceCard icon={Paintbrush} title={t('reference_settingsAppearance')} description={t('reference_settingsAppearanceDescription')} onClick={() => onOpen('appearance')} />
        <WorkspaceCard icon={Shield} title={t('reference_settingsSecurity')} description={t('reference_settingsSecurityDescription')} onClick={() => onOpen('permissions')} />
        <WorkspaceCard icon={RefreshCw} title={t('reference_settingsUpdates')} description={t('reference_settingsUpdatesDescription')} onClick={() => onOpen('about')} />
        <WorkspaceCard icon={Info} title={t('reference_settingsAbout')} description={t('reference_settingsAboutDescription')} onClick={() => onOpen('about')} />
      </WorkspaceGrid>
      <WorkspaceCard icon={Settings} title={t('reference_settingsAll')} description={t('reference_settingsAllDescription')} onClick={() => onOpen()} />
    </Workspace>
  )
}
