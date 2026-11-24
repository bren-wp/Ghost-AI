// Ghost AI by Brendigo
import { ArrowUpRight, Bot, FileText, MessagesSquare, Plug } from 'lucide-react'
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
    <section aria-labelledby="workspace-home-title" className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-[930px] min-w-0 flex-col gap-6">
        <header className="space-y-2">
          <h2 id="workspace-home-title" className="text-[clamp(1.4rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
            {t('workspaceTitle')}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('workspaceSubtitle')}</p>
        </header>
        <div className="grid min-w-0 grid-cols-1 gap-4 min-[680px]:grid-cols-2">
          {actions.map(({ key, icon: Icon, run }) => (
            <button
              type="button"
              key={key}
              onClick={run}
              className="group relative flex min-h-[132px] min-w-0 flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:min-h-[190px] lg:p-6"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 space-y-1 pr-5">
                <span className="block break-words text-base font-semibold text-foreground">{t(key)}</span>
                <span className="block break-words text-sm leading-relaxed text-muted-foreground">{t(`${key}Description`)}</span>
              </span>
              <ArrowUpRight aria-hidden="true" className="absolute right-4 top-4 size-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
