// Ghost AI by Brendigo
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { exit } from '@tauri-apps/plugin-process'
import eulaEnglish from '../../../legal/EULA-EN.md?raw'
import eulaCroatian from '../../../legal/EULA-HR.md?raw'
import commercialTerms from '../../../legal/COMMERCIAL-LICENSE-HR.md?raw'
import privacyTerms from '../../../legal/PRIVACY-HR.md?raw'

type Language = 'en' | 'hr'
type DocumentKey = 'eula' | 'commercial' | 'privacy'

interface Props {
  onAccept: () => void
}

const documentOptions: { value: DocumentKey; label: string }[] = [
  { value: 'eula', label: 'EULA' },
  { value: 'commercial', label: 'Commercial terms' },
  { value: 'privacy', label: 'Privacy' },
]

export function GhostLicenseScreen({ onAccept }: Props) {
  const [language, setLanguage] = useState<Language>('en')
  const [selected, setSelected] = useState<DocumentKey>('eula')
  const documents = {
    eula: language === 'hr' ? eulaCroatian : eulaEnglish,
    commercial: commercialTerms,
    privacy: privacyTerms,
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080F1A] px-3 py-4 text-[#E5E7EB] sm:px-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-title"
        className="flex max-h-[min(94vh,830px)] w-full max-w-[780px] flex-col overflow-hidden rounded-2xl border border-[#324057] bg-[#111827] shadow-2xl"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#324057] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <img src="/ghost-ai-icon.png" alt="" width="48" height="48" className="rounded-xl" />
            <div>
              <h1 id="license-title" className="text-lg font-semibold">Ghost AI</h1>
              <p className="text-xs text-[#A8B3C8]">by Brendigo · Usage terms</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-lg border border-[#324057] p-1" role="group" aria-label="EULA language">
            {(['en', 'hr'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={language === option}
                onClick={() => setLanguage(option)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${language === option ? 'bg-[#874CFF] text-white' : 'text-[#B7C4DE] hover:bg-[#202A45]'}`}
              >{option === 'en' ? 'English' : 'Hrvatski'}</button>
            ))}
          </div>
        </header>
        <nav className="flex flex-wrap gap-2 border-b border-[#324057] px-5 py-3 sm:px-7" aria-label="Legal documents">
          {documentOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => setSelected(option.value)}
              aria-current={selected === option.value ? 'page' : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm ${selected === option.value ? 'bg-[#273451] text-[#00E5FF]' : 'text-[#BCC9DE] hover:bg-[#202A45]'}`}
            >{option.label}</button>
          ))}
        </nav>
        <div tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[13px] leading-6 text-[#C8D4E8] sm:px-7">
          <article className="prose prose-invert prose-sm max-w-none prose-headings:text-[#E5E7EB] prose-a:text-[#00E5FF]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{documents[selected]}</ReactMarkdown>
          </article>
        </div>
        <footer className="flex flex-col gap-3 border-t border-[#324057] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-[#A8B3C8]">Official publisher: Brendigo · brendigo.com</p>
          <div className="flex gap-2 self-end">
            <button type="button" onClick={() => void exit(0)} className="min-h-10 rounded-lg border border-[#40506B] px-4 py-2 text-sm hover:bg-[#202A45] focus-visible:outline-2 focus-visible:outline-[#00E5FF]">Exit</button>
            <button type="button" onClick={onAccept} className="min-h-10 rounded-lg bg-[#874CFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7140DC] focus-visible:outline-2 focus-visible:outline-[#00E5FF]">Accept EULA</button>
          </div>
        </footer>
      </section>
    </main>
  )
}
