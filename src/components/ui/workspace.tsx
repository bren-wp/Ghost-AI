// Ghost AI by Brendigo
import { useId, type ReactNode } from 'react'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkspaceProps {
  title: string
  description: string
  children: ReactNode
  headingId?: string
}

/** Shared reference layout; native window and feature-specific state remain separate. */
export function Workspace({ title, description, children, headingId }: WorkspaceProps) {
  return (
    <section
      className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background px-4 py-5 sm:px-8 sm:py-8"
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : title}
    >
      <div className="mx-auto flex w-full max-w-[930px] min-w-0 flex-col gap-6">
        <header className="space-y-2">
          <h2 id={headingId} className="text-[clamp(1.4rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </header>
        {children}
      </div>
    </section>
  )
}

export function WorkspaceGrid({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 grid-cols-1 gap-4 min-[680px]:grid-cols-2">{children}</div>
}

interface WorkspaceCardProps {
  id?: string
  title: string
  description: string
  icon: LucideIcon
  onClick?: () => void
  variant?: 'home' | 'standard'
}

/** Retain the reference-specific card variants, while sharing structure and accessibility. */
export function WorkspaceCard({ id, title, description, icon: Icon, onClick, variant = 'standard' }: WorkspaceCardProps) {
  const generatedId = useId()
  const labelId = id ?? generatedId
  const home = variant === 'home'
  const content = (
    <>
      {home ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : (
        <Icon aria-hidden="true" className="size-6 shrink-0 text-primary" />
      )}
      <span className={home ? 'min-w-0 space-y-1 pr-5' : 'min-w-0 space-y-2'}>
        <span id={`${labelId}-title`} className={cn('block break-words text-base font-semibold', home && 'text-foreground')}>{title}</span>
        <span id={`${labelId}-description`} className="block break-words text-sm leading-relaxed text-muted-foreground">{description}</span>
      </span>
      {onClick && <ArrowUpRight aria-hidden="true" className={cn('absolute right-4 top-4 size-4 text-muted-foreground', home && 'transition-colors group-hover:text-primary')} />}
    </>
  )
  const classes = cn(
    'relative flex min-h-[132px] min-w-0 flex-col items-start gap-3 rounded-2xl border border-border p-4 text-left lg:p-6',
    home ? 'group bg-card lg:min-h-[190px]' : 'bg-[#172338] pr-8 lg:min-h-[170px]',
    onClick && 'transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    home && onClick && 'hover:bg-accent/35'
  )
  return onClick ? (
    <button type="button" aria-labelledby={`${labelId}-title`} aria-describedby={`${labelId}-description`} className={classes} onClick={onClick}>{content}</button>
  ) : <div className={classes}>{content}</div>
}
