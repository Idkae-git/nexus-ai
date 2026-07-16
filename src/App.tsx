import { useEffect, useState } from 'react'

import './App.css'

interface NexusResult<T = unknown> {
  status:
  | 'success'
  | 'failed'
  | 'denied'
  | 'confirmation_required'

  requestId?: string

  data?: T

  error?: string
}

function App() {
  const [coreStatus, setCoreStatus] =
    useState('CONNECTING')

  const [coreOnline, setCoreOnline] =
    useState(false)

  const [
    pendingRequestId,
    setPendingRequestId,
  ] = useState<string | null>(null)

  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false)

  useEffect(() => {
    async function ping() {
      const result =
        (await window.nexus.ping()) as NexusResult<string>

      if (
        result.status === 'success' &&
        result.data ===
        'NEXUS CORE ONLINE'
      ) {
        setCoreStatus('ONLINE')
        setCoreOnline(true)
      } else {
        setCoreStatus('OFFLINE')
      }
    }

    void ping()
  }, [])

  async function executeCommand(
    command: string,
  ) {
    const result =
      await window.nexus.execute({
        id: crypto.randomUUID(),

        command,

        payload: undefined,

        source: 'ui',

        target: {
          type: 'local',
        },

        createdAt: Date.now(),
      })

    if (
      result.status ===
      'confirmation_required' &&
      result.requestId
    ) {
      setPendingRequestId(
        result.requestId,
      )
    }
  }

  async function confirm() {
    if (
      !pendingRequestId ||
      isConfirming
    ) {
      return
    }

    setIsConfirming(true)

    try {
      await window.nexus.confirm(
        pendingRequestId,
      )

      setPendingRequestId(null)
    } finally {
      setIsConfirming(false)
    }
  }

  async function cancel() {
    if (!pendingRequestId) {
      return
    }

    await window.nexus.cancel(
      pendingRequestId,
    )

    setPendingRequestId(null)
  }

  return (
    <main className="nexus-shell">
      <header className="nexus-header">
        <div>
          <span className="nexus-eyebrow">
            NEXUS AI
          </span>

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
        <span className="panel-label">
          LOCAL NODE
        </span>

        <h2>GAMING-PC</h2>

        <div className="core-data">
          <div>
            <span>PLATFORM</span>

            <strong>
              WINDOWS
            </strong>
          </div>

          <div>
            <span>CORE</span>

            <strong>
              {coreStatus}
            </strong>
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
            <span className="panel-label">
              SYSTEM
            </span>

            <h2>
              Power & Session
            </h2>
          </div>
        </div>

        <button
          className="danger-action"
          disabled={!coreOnline}
          onClick={() =>
            void executeCommand(
              'system.lock',
            )
          }
        >
          LOCK SYSTEM
        </button>
      </section>

      {pendingRequestId && (
        <div className="confirmation-backdrop">
          <section className="confirmation-modal">
            <span className="panel-label">
              CONFIRMATION
            </span>

            <h2>
              Execute command?
            </h2>

            <p>
              This command requires
              confirmation.
            </p>

            <div className="confirmation-actions">
              <button
                className="cancel-action"
                disabled={
                  isConfirming
                }
                onClick={() =>
                  void cancel()
                }
              >
                CANCEL
              </button>

              <button
                className="confirm-action"
                disabled={
                  isConfirming
                }
                onClick={() =>
                  void confirm()
                }
              >
                CONFIRM
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App