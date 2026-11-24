// Ghost AI by Brendigo
import { useId, type ReactNode } from 'react'
import { ArrowUpRight, Bot, Cloud, FileText, HardDrive, Info, MessageSquare, Paintbrush, Plus, Settings, Shield, Sparkles, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAssistantStore } from '@/stores/assistantStore'
import { Button } from '@/components/ui/button'

function Workspace({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background px-4 py-5 sm:px-8 sm:py-8" aria-label={title}>
      <div className="mx-auto flex w-full max-w-[930px] min-w-0 flex-col gap-6">
        <header className="space-y-2">
          <h2 className="text-[clamp(1.4rem,3vw,2.25rem)] font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </header>
        {children}
      </div>
    </section>
  )
}

type CardProps = { title: string; description: string; icon: typeof Bot; onClick?: () => void }
function WorkspaceCard({ title, description, icon: Icon, onClick }: CardProps) {
  const id = useId()
  const content = (
    <>
      <Icon aria-hidden="true" className="size-6 shrink-0 text-primary" />
      <span className="min-w-0 space-y-2">
        <span id={`${id}-title`} className="block break-words text-base font-semibold">{title}</span>
        <span id={`${id}-description`} className="block break-words text-sm leading-relaxed text-muted-foreground">{description}</span>
      </span>
      {onClick && <ArrowUpRight aria-hidden="true" className="absolute right-4 top-4 size-4 text-muted-foreground" />}
    </>
  )
  const classes = 'relative flex min-h-[132px] min-w-0 flex-col items-start gap-3 rounded-2xl border border-border bg-[#172338] p-4 pr-8 text-left lg:min-h-[170px] lg:p-6'
  return onClick ? (
    <button type="button" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} className={classes + ' transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'} onClick={onClick}>{content}</button>
  ) : <div className={classes}>{content}</div>
}

const gridClass = 'grid min-w-0 grid-cols-1 gap-4 min-[680px]:grid-cols-2'

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
        <div className={gridClass}>
          {assistants.map((assistant) => (
            <WorkspaceCard key={assistant.id} icon={Bot} title={assistant.name} description={assistant.description || assistant.role || t('reference_agentsReview')} onClick={() => onSelect(assistant.id)} />
          ))}
        </div>
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
      <div className={gridClass}>
        <WorkspaceCard icon={Sparkles} title={t('reference_documentsSummary')} description={t('reference_documentsSummaryDescription')} />
        <WorkspaceCard icon={MessageSquare} title={t('reference_documentsFollowUp')} description={t('reference_documentsFollowUpDescription')} />
      </div>
    </Workspace>
  )
}

export function ProvidersWorkspace({ onConfigure }: { onConfigure: (id?: string) => void }) {
  const { t } = useTranslation('chat')
  return (
    <Workspace title={t('reference_providersTitle')} description={t('reference_providersSubtitle')}>
      <div className={gridClass}>
        <WorkspaceCard icon={Cloud} title={t('reference_providersCloud')} description={t('reference_providersCloudDescription')} onClick={() => onConfigure('openai')} />
        <WorkspaceCard icon={HardDrive} title={t('reference_providersLocal')} description={t('reference_providersLocalDescription')} onClick={() => onConfigure('ollama')} />
      </div>
      <WorkspaceCard icon={Settings} title={t('reference_providersConnections')} description={t('reference_providersConnectionsDescription')} onClick={() => onConfigure()} />
    </Workspace>
  )
}

export function SettingsWorkspace({ onOpen }: { onOpen: (section?: string) => void }) {
  const { t } = useTranslation('chat')
  return (
    <Workspace title={t('reference_settingsTitle')} description={t('reference_settingsSubtitle')}>
      <div className={gridClass}>
        <WorkspaceCard icon={Paintbrush} title={t('reference_settingsAppearance')} description={t('reference_settingsAppearanceDescription')} onClick={() => onOpen('appearance')} />
        <WorkspaceCard icon={Shield} title={t('reference_settingsSecurity')} description={t('reference_settingsSecurityDescription')} onClick={() => onOpen('permissions')} />
        <WorkspaceCard icon={RefreshCw} title={t('reference_settingsUpdates')} description={t('reference_settingsUpdatesDescription')} onClick={() => onOpen('about')} />
        <WorkspaceCard icon={Info} title={t('reference_settingsAbout')} description={t('reference_settingsAboutDescription')} onClick={() => onOpen('about')} />
      </div>
      <WorkspaceCard icon={Settings} title={t('reference_settingsAll')} description={t('reference_settingsAllDescription')} onClick={() => onOpen()} />
    </Workspace>
  )
}
