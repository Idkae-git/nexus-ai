import { useEffect, useState } from 'react'

import './App.css'

interface NexusResult {
  status: string
  data?: unknown
  error?: string
}

function App() {
  const [coreStatus, setCoreStatus] = useState('CONNECTING')
  const [coreOnline, setCoreOnline] = useState(false)

  useEffect(() => {
    async function checkCore(): Promise<void> {
      try {
        const result = (await window.nexus.ping()) as NexusResult

        if (
          result.status === 'success' &&
          result.data === 'NEXUS CORE ONLINE'
        ) {
          setCoreStatus('ONLINE')
          setCoreOnline(true)
          return
        }

        setCoreStatus('DEGRADED')
      } catch {
        setCoreStatus('OFFLINE')
      }
    }

    void checkCore()
  }, [])

  return (
    <main className="nexus-shell">
      <header className="nexus-header">
        <div>
          <span className="nexus-eyebrow">NEXUS AI</span>
          <h1>System Core</h1>
        </div>

        <div className="core-status">
          <span
            className={
              coreOnline
                ? 'status-dot status-dot-online'
                : 'status-dot'
            }
          />

          <span>{coreStatus}</span>
        </div>
      </header>

      <section className="core-panel">
        <span className="panel-label">LOCAL NODE</span>

        <h2>GAMING-PC</h2>

        <div className="core-data">
          <div>
            <span>PLATFORM</span>
            <strong>WINDOWS</strong>
          </div>

          <div>
            <span>CORE</span>
            <strong>{coreStatus}</strong>
          </div>

          <div>
            <span>CONTROL</span>
            <strong>LOCAL</strong>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App