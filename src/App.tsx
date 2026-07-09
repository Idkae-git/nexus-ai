import { useEffect, useState } from 'react'

import './App.css'

interface NexusResult {
  status: string
  requestId?: string
  data?: unknown
  error?: string
}

function App() {
  const [coreStatus, setCoreStatus] = useState('CONNECTING')
  const [coreOnline, setCoreOnline] = useState(false)
  const [pendingRequestId, setPendingRequestId] = useState<
    string | null
  >(null)
  const [isConfirming, setIsConfirming] = useState(false)

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

  async function requestSystemLock(): Promise<void> {
    const result = (await window.nexus.lockSystem()) as NexusResult

    if (
      result.status === 'confirmation_required' &&
      result.requestId
    ) {
      setPendingRequestId(result.requestId)
    }
  }

  async function confirmSystemLock(): Promise<void> {
    if (!pendingRequestId || isConfirming) {
      return
    }

    setIsConfirming(true)

    try {
      await window.nexus.confirmCommand(pendingRequestId)
      setPendingRequestId(null)
    } finally {
      setIsConfirming(false)
    }
  }

  async function cancelSystemLock(): Promise<void> {
    if (!pendingRequestId) {
      return
    }

    await window.nexus.cancelCommand(pendingRequestId)
    setPendingRequestId(null)
  }

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

      <section className="control-panel">
        <div className="control-panel-heading">
          <div>
            <span className="panel-label">SYSTEM CONTROL</span>
            <h2>Power & Session</h2>
          </div>

          <span className="control-scope">LOCAL</span>
        </div>

        <button
          className="danger-action"
          type="button"
          disabled={!coreOnline}
          onClick={() => {
            void requestSystemLock()
          }}
        >
          <span>LOCK SYSTEM</span>
          <span className="action-arrow">↗</span>
        </button>
      </section>

      {pendingRequestId && (
        <div className="confirmation-backdrop">
          <section
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
          >
            <span className="panel-label">CRITICAL ACTION</span>

            <h2 id="confirmation-title">Lock this system?</h2>

            <p>
              NEXUS is requesting permission to lock the current
              Windows session.
            </p>

            <div className="confirmation-details">
              <div>
                <span>COMMAND</span>
                <strong>system.lock</strong>
              </div>

              <div>
                <span>TARGET</span>
                <strong>GAMING-PC</strong>
              </div>

              <div>
                <span>SOURCE</span>
                <strong>UI</strong>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                className="cancel-action"
                type="button"
                disabled={isConfirming}
                onClick={() => {
                  void cancelSystemLock()
                }}
              >
                CANCEL
              </button>

              <button
                className="confirm-action"
                type="button"
                disabled={isConfirming}
                onClick={() => {
                  void confirmSystemLock()
                }}
              >
                {isConfirming ? 'EXECUTING...' : 'CONFIRM'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App