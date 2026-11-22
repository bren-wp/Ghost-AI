// Ghost AI by Brendigo
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { openUrl } from '@tauri-apps/plugin-opener'
import { Check, Download, Globe, Heart, Loader2, RefreshCw, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useUpdaterStore, updateChannelAvailable } from '@/stores/updaterStore'
import { ReleaseNotes } from './release-notes'
import appIcon from '@/assets/app-icon.png'
import { GhostLegalDocuments } from '@/components/license/ghost-ai-legal-documents'

const WEBSITE = 'https://brendigo.com'

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 ** 3)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 ** 2)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export function GhostAboutSettings() {
  const { t } = useTranslation('settings')
  const status = useUpdaterStore((s) => s.status)
  const update = useUpdaterStore((s) => s.update)
  const version = useUpdaterStore((s) => s.currentVersion)
  const error = useUpdaterStore((s) => s.error)
  const downloadedBytes = useUpdaterStore((s) => s.downloadedBytes)
  const totalBytes = useUpdaterStore((s) => s.totalBytes)
  const autoCheckEnabled = useUpdaterStore((s) => s.autoCheckEnabled)
  const checkForUpdates = useUpdaterStore((s) => s.checkForUpdates)
  const downloadUpdate = useUpdaterStore((s) => s.downloadUpdate)
  const installAndRestart = useUpdaterStore((s) => s.installAndRestart)
  const setAutoCheck = useUpdaterStore((s) => s.setAutoCheck)
  const skipCurrentVersion = useUpdaterStore((s) => s.skipCurrentVersion)
  const loadPreferences = useUpdaterStore((s) => s.loadPreferences)
  const updateEnabled = updateChannelAvailable()

  React.useEffect(() => {
    void loadPreferences()
  }, [loadPreferences])

  async function openWebsite() {
    try {
      await openUrl(WEBSITE)
    } catch {
      toast.error(t('aboutIssuesDescription'))
    }
  }

  async function shareGhostAI() {
    try {
      await navigator.clipboard.writeText('Ghost AI by Brendigo — https://brendigo.com')
      toast.success(t('aboutRecommendCopied'))
    } catch {
      toast.error(t('aboutIssuesDescription'))
    }
  }

  async function checkUpdates() {
    if (!updateEnabled) {
      await openWebsite()
      return
    }
    const available = await checkForUpdates({ silent: false })
    if (available === null) {
      if (useUpdaterStore.getState().error) toast.error(t('updateCheckFailed'))
      else toast.success(t('updateUpToDate'))
    } else {
      toast.success(t('updateAvailableToast', { version: available.version }))
    }
  }

  return (
    <div className="grid w-full min-w-0 gap-4 pb-4 sm:gap-5">
      <section className="flex min-w-0 flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <img src={appIcon} alt="Ghost AI" className="size-16 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight">Ghost AI</h2>
          <p className="text-sm text-muted-foreground">by Brendigo</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">brendigo.com</p>
        </div>
        {version !== null && <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">v{version}</span>}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="grid content-start gap-3 rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold">{t('aboutSupportTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('aboutSupportDescription')}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void openWebsite()}>
              <Globe className="mr-2 size-4" aria-hidden="true" />{t('aboutSupportTitle')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void shareGhostAI()}>
              <Share2 className="mr-2 size-4" aria-hidden="true" />{t('aboutRecommendButton')}
            </Button>
          </div>
        </section>
        <section className="grid content-start gap-3 rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold">{t('aboutIssuesTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('aboutIssuesDescription')}</p>
          <Button variant="outline" size="sm" className="w-fit" onClick={() => void openWebsite()}>
            <Heart className="mr-2 size-4" aria-hidden="true" />Contact Brendigo
          </Button>
        </section>
      </div>

      <section className="grid min-w-0 gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div>
          <h3 className="font-semibold">{t('updateSectionTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{updateEnabled ? t('updateAutoCheckDescription') : 'Official downloads and updates are available at brendigo.com.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void checkUpdates()} disabled={status === 'checking' || status === 'downloading' || status === 'installing'}>
            {status === 'checking' ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="mr-2 size-4" aria-hidden="true" />}
            {updateEnabled ? (status === 'checking' ? t('updateChecking') : t('updateCheckButton')) : 'Visit official website'}
          </Button>
          {updateEnabled && update && status === 'idle' && (
            <>
              <Button size="sm" onClick={() => void downloadUpdate()}><Download className="mr-2 size-4" aria-hidden="true" />{t('updateDownloadButton')}</Button>
              <Button variant="outline" size="sm" onClick={() => void skipCurrentVersion()}>{t('updateSkipVersion')}</Button>
            </>
          )}
          {updateEnabled && (status === 'ready' || status === 'installing') && (
            <Button size="sm" onClick={() => void installAndRestart()} disabled={status === 'installing'}>
              {status === 'installing' ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Check className="mr-2 size-4" aria-hidden="true" />}
              {status === 'installing' ? t('updateInstalling') : t('updateReadyButton')}
            </Button>
          )}
        </div>
        {updateEnabled && update && status === 'idle' && (
          <div className="grid min-w-0 gap-2">
            <p className="text-xs text-muted-foreground">{t('updateAvailableLine', { version: update.version, current: update.currentVersion })}</p>
            <ReleaseNotes version={update.version} notes={update.body} />
          </div>
        )}
        {updateEnabled && status === 'downloading' && (
          <p aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {totalBytes > 0 ? t('updateDownloadingProgress', { received: formatSize(downloadedBytes), total: formatSize(totalBytes) }) : t('updateDownloading')}
          </p>
        )}
        {updateEnabled && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {updateEnabled && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <div className="min-w-0">
              <Label htmlFor="update-auto-check">{t('updateAutoCheckLabel')}</Label>
              <p className="text-xs text-muted-foreground">{t('updateAutoCheckDescription')}</p>
            </div>
            <Switch id="update-auto-check" checked={autoCheckEnabled} onCheckedChange={(checked) => void setAutoCheck(checked)} />
          </div>
        )}
      </section>
      <GhostLegalDocuments />
    </div>
  )
}
