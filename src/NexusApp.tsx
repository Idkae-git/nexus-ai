import { useCallback, useEffect, useState } from 'react'

import type { NexusActivityEntry } from './core/activity/activity.types.js'
import type { NexusCommandRequest } from './core/commands/command.types.js'
import type { SystemInfo } from './core/platform/system-info.js'
import { Sidebar } from './components/layout/Sidebar.tsx'
import { ConfirmationModal } from './components/commands/ConfirmationModal.tsx'
import { OverviewPage } from './pages/Overview/OverviewPage.tsx'

import './App.css'

export interface PendingConfirmation {
  requestId: string
  command: string
  source: NexusCommandRequest['source']
  target: NexusCommandRequest['target']
}

function createRequest(command: string): NexusCommandRequest<void> {
  return {
    id: crypto.randomUUID(),
    command,
    payload: undefined,
    source: 'ui',
    target: { type: 'local' },
    createdAt: Date.now(),
  }
}

function NexusApp() {
  const [coreStatus, setCoreStatus] = useState<'connecting' | 'online' | 'offline'>('connecting')
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [systemError, setSystemError] = useState<string | null>(null)
  const [isSystemLoading, setIsSystemLoading] = useState(true)
  const [activities, setActivities] = useState<NexusActivityEntry[]>([])
  const [activitiesError, setActivitiesError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingConfirmation | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const refreshActivities = useCallback(async () => {
    try {
      const entries = await window.nexus.listActivities({ limit: 12 })
      setActivities(entries)
      setActivitiesError(null)
    } catch (error) {
      setActivitiesError(error instanceof Error ? error.message : 'Activity history is unavailable.')
    }
  }, [])

  const refreshSystemInfo = useCallback(async (showLoading = false) => {
    if (showLoading) setIsSystemLoading(true)

    try {
      if (!window.nexus) {
        throw new Error('NEXUS Core preload is unavailable.')
      }

      const result = await window.nexus.execute<void, SystemInfo>(createRequest('system.info'))

      if (result.status === 'success' && result.data) {
        setSystemInfo(result.data)
        setSystemError(null)
        setCoreStatus('online')
      } else {
        setSystemError(result.error ?? 'System metrics are unavailable.')
        setCoreStatus('offline')
      }
    } catch (error) {
      setSystemError(error instanceof Error ? error.message : 'System metrics are unavailable.')
      setCoreStatus('offline')
    } finally {
      setIsSystemLoading(false)
    }

    if (window.nexus) {
      await refreshActivities()
    }
  }, [refreshActivities])

  useEffect(() => {
    let active = true

    async function initialize() {
      try {
        const result = await window.nexus.execute<void, string>(createRequest('system.ping'))
        if (!active) return
        setCoreStatus(result.status === 'success' ? 'online' : 'offline')
        await refreshSystemInfo(true)
      } catch (error) {
        if (active) {
          setCoreStatus('offline')
          setSystemError(error instanceof Error ? error.message : 'NEXUS Core is unavailable.')
          setIsSystemLoading(false)
        }
      }
    }

    void initialize()
    const intervalId = window.setInterval(() => {
      if (active) void refreshSystemInfo()
    }, 5_000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [refreshSystemInfo])

  async function executeQuickAction(command: string) {
    setActionMessage(null)
    const request = createRequest(command)
    const result = await window.nexus.execute(request)

    if (result.status === 'confirmation_required' && result.requestId) {
      setPending({ requestId: result.requestId, command, source: request.source, target: request.target })
    } else if (result.status === 'success') {
      setActionMessage(`${command} completed successfully.`)
    } else {
      setActionMessage(result.error ?? `${command} was ${result.status}.`)
    }

    await refreshActivities()
  }

  async function confirmPending() {
    if (!pending || isResolving) return
    setIsResolving(true)

    try {
      const result = await window.nexus.confirm(pending.requestId)
      setActionMessage(result.status === 'success' ? `${pending.command} completed successfully.` : result.error ?? `${pending.command} failed.`)
      setPending(null)
      await refreshActivities()
    } finally {
      setIsResolving(false)
    }
  }

  async function cancelPending() {
    if (!pending || isResolving) return
    setIsResolving(true)

    try {
      await window.nexus.cancel(pending.requestId)
      setActionMessage(`${pending.command} was cancelled.`)
      setPending(null)
      await refreshActivities()
    } finally {
      setIsResolving(false)
    }
  }

  async function clearActivities() {
    await window.nexus.clearActivities()
    await refreshActivities()
  }

  return (
    <div className="app-shell">
      <Sidebar coreStatus={coreStatus} />
      <OverviewPage
        coreStatus={coreStatus}
        systemInfo={systemInfo}
        systemError={systemError}
        isSystemLoading={isSystemLoading}
        activities={activities}
        activitiesError={activitiesError}
        actionMessage={actionMessage}
        onQuickAction={executeQuickAction}
        onClearActivities={clearActivities}
      />
      {pending && (
        <ConfirmationModal pending={pending} isResolving={isResolving} onConfirm={confirmPending} onCancel={cancelPending} />
      )}
    </div>
  )
}

export default NexusApp
