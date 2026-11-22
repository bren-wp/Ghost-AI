// Ghost AI by Brendigo
import React from 'react'
import ReactDOM from 'react-dom/client'
import { getCurrentWindow } from '@tauri-apps/api/window'
import App from './App'
import '@/lib/i18n'
import { initTheme } from '@/lib/theme'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore } from '@/stores/message'
import { useRunFoldStore } from '@/stores/runFoldStore'

// Dev builds expose the stores to the debug-only UI automation endpoint
// (src-tauri/src/ui_automation.rs), so tests can open conversations the way
// a click does.
if (import.meta.env.DEV) {
  Object.assign(window, {
    __ghost_aiTest: { useConversationStore, useMessageStore, useRunFoldStore },
  })
}

initTheme()

const root = document.getElementById('root')
if (!root) throw new Error('Ghost AI root element is missing')

if ('__TAURI_INTERNALS__' in window) {
  // The native window starts hidden. React replacing the inline dark splash
  // proves the first application surface is committed before we reveal it.
  // MutationObserver works even when requestAnimationFrame is throttled for
  // hidden windows.
  let requested = false
  let fallback: ReturnType<typeof setTimeout> | undefined
  const observer = new MutationObserver(() => {
    if (!root.querySelector('#splash') && root.childElementCount > 0) {
      show()
    }
  })
  function show() {
    if (requested) return
    requested = true
    observer.disconnect()
    if (fallback) clearTimeout(fallback)
    void getCurrentWindow().show().catch(() => {
      // A native watchdog also reveals the dark page after a timeout.
    })
  }
  observer.observe(root, { childList: true, subtree: true })
  fallback = setTimeout(show, 10_000)
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  if (!root.querySelector('#splash') && root.childElementCount > 0) show()
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
