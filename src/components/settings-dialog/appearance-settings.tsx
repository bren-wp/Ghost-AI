// Ghost AI by Brendigo
import { Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function AppearanceSettings() {
  const { t } = useTranslation('settings')
  return (
    <section className="grid max-w-lg gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 text-foreground">
        <Moon aria-hidden="true" className="size-5 text-primary" />
        <h3 className="font-semibold">{t('themeDark')}</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Ghost AI uses its own consistent dark appearance across all screens.
      </p>
    </section>
  )
}
