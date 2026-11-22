// Ghost AI by Brendigo
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { openUrl } from '@tauri-apps/plugin-opener'
import eulaEnglish from '../../../legal/EULA-EN.md?raw'
import eulaCroatian from '../../../legal/EULA-HR.md?raw'
import commercialTerms from '../../../legal/COMMERCIAL-LICENSE-HR.md?raw'
import privacyTerms from '../../../legal/PRIVACY-HR.md?raw'
import notices from '../../../legal/THIRD_PARTY_NOTICES.md?raw'

type DocumentKey = 'eula' | 'commercial' | 'privacy' | 'notices'
const documents: { code: DocumentKey; name: string }[] = [
  { code: 'eula', name: 'EULA' },
  { code: 'commercial', name: 'Commercial terms' },
  { code: 'privacy', name: 'Privacy policy' },
  { code: 'notices', name: 'Third-party notices' },
]

/** Read-only legal documents; no misleading implicit consent recording. */
export function GhostLegalDocuments() {
  const [selected, setSelected] = useState<DocumentKey>('eula')
  const [language, setLanguage] = useState<'en' | 'hr'>('en')
  const text = {
    eula: language === 'hr' ? eulaCroatian : eulaEnglish,
    commercial: commercialTerms,
    privacy: privacyTerms,
    notices,
  }[selected]

  return (
    <section aria-label="Legal information" className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="text-base font-semibold">Legal information</h3>
      <p className="text-sm text-muted-foreground">
        Ghost AI by Brendigo · Documents are available at any time without a separate startup screen.
      </p>
      <div role="group" aria-label="Legal documents" className="flex flex-wrap gap-2">
        {documents.map(({ code, name }) => (
          <button
            key={code}
            type="button"
            aria-pressed={selected === code}
            onClick={() => setSelected(code)}
            className={`rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring ${selected === code ? 'border-primary bg-accent text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            {name}
          </button>
        ))}
      </div>
      {selected === 'eula' && (
        <div className="flex items-center gap-3 text-sm">
          <label htmlFor="ghost-legal-language">Document language</label>
          <select
            id="ghost-legal-language"
            className="rounded-lg border border-input bg-background px-3 py-2 text-foreground"
            value={language}
            onChange={(event) => setLanguage(event.target.value === 'hr' ? 'hr' : 'en')}
          >
            <option value="en">English</option>
            <option value="hr">Hrvatski</option>
          </select>
        </div>
      )}
      <article tabIndex={0} aria-label={documents.find((item) => item.code === selected)?.name} className="ghost-legal-markdown max-h-72 min-w-0 overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-background p-4 text-sm leading-6 text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          skipHtml
          components={{
            a: ({ href, children }) =>
              href && /^https:\/\/(www\.)?brendigo\.com(\/|$)/i.test(href)
                ? <button type="button" className="text-primary underline underline-offset-4" onClick={() => void openUrl(href)}>{children}</button>
                : <span>{children}</span>,
          }}
        >{text}</ReactMarkdown>
      </article>
    </section>
  )
}
