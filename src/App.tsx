// Ghost AI by Brendigo
import { useState } from 'react'
import { ChatPage } from './pages/chat-page'
import { GhostLicenseScreen } from './components/license/ghost-ai-license-screen'
import { hasAcceptedLicense, acceptLicense } from './lib/ghost-ai-license-consent'
import './App.css'

export default function App() {
  const [accepted, setAccepted] = useState(hasAcceptedLicense)

  if (accepted) return <ChatPage />
  return <GhostLicenseScreen onAccept={() => { if (acceptLicense()) setAccepted(true) }} />
}
