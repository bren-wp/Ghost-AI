import { useState } from 'react'
import { exit } from '@tauri-apps/plugin-process'
import { ChatPage } from './pages/chat-page'
import eulaEnglish from '../legal/EULA-EN.md?raw'
import eulaCroatian from '../legal/EULA-HR.md?raw'
import './App.css'

const ACCEPT_KEY = 'ghost_ai_terms_accepted_v1'

function readAcceptance(): boolean {
  try {
    return window.localStorage.getItem(ACCEPT_KEY) === 'accepted'
  } catch {
    return false
  }
}

function App() {
  const [accepted, setAccepted] = useState(readAcceptance)
  const [language, setLanguage] = useState<'en' | 'hr'>('en')

  if (accepted) return <ChatPage />

  const accept = () => {
    try {
      localStorage.setItem(ACCEPT_KEY, 'accepted')
      setAccepted(true)
    } catch {
      // Do not continue without storing the user's choice.
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080F1A] px-4 py-6 text-[#E5E7EB]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ghost-ai-terms-title"
        className="flex max-h-[min(92vh,820px)] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-[#324057] bg-[#111827] shadow-2xl"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#324057] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <img src="/ghost-ai-icon.png" width="48" height="48" alt="Ghost AI" className="rounded-xl" />
            <div>
              <h1 id="ghost-ai-terms-title" className="text-lg font-bold">Ghost AI</h1>
              <p className="text-xs text-[#9EAFCB]">by Brendigo · Terms of use</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-lg border border-[#324057] p-1" role="group" aria-label="Legal document language">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${language === 'en' ? 'bg-[#874CFF] text-white' : 'text-[#B7C4DE] hover:bg-[#202A45]'}`}
              aria-pressed={language === 'en'}
              onClick={() => setLanguage('en')}
            >English</button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${language === 'hr' ? 'bg-[#874CFF] text-white' : 'text-[#B7C4DE] hover:bg-[#202A45]'}`}
              aria-pressed={language === 'hr'}
              onClick={() => setLanguage('hr')}
            >Hrvatski</button>
          </div>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-[13px] leading-6 text-[#C8D4E8] whitespace-pre-wrap sm:px-7"
          tabIndex={0}
          aria-label="End user license agreement"
        >
          {language === 'en' ? eulaEnglish : eulaCroatian}
        </div>
        <footer className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#324057] px-5 py-4 sm:flex-row sm:items-center sm:px-7">
          <p className="max-w-sm text-xs text-[#A8B3C8]">
            By continuing, you accept the Ghost AI license agreement.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void exit(0)}
              className="min-h-10 rounded-lg border border-[#40506B] px-4 py-2 text-sm hover:bg-[#202A45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E5FF]"
            >Exit</button>
            <button
              type="button"
              onClick={accept}
              className="min-h-10 rounded-lg bg-[#874CFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7140DC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E5FF]"
            >Accept &amp; Continue</button>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default App
