import type { NexusActivityEntry } from '../../core/activity/activity.types.js'
import type { SystemInfo } from '../../core/platform/system-info.js'
import { TimelineItem } from '../../components/activity/TimelineItem.tsx'
import { DashboardMetric } from '../../components/dashboard/DashboardMetric.tsx'
import { ActionButton } from '../../components/ui/ActionButton.tsx'
import { Icon } from '../../components/ui/Icon.tsx'
import { QuickAction } from '../../components/ui/QuickAction.tsx'

interface OverviewPageProps {
  actionMessage: string | null
  activities: NexusActivityEntry[]
  coreStatus: 'connecting' | 'online' | 'offline'
  isSystemLoading: boolean
  onNavigateToActivity: () => void
  onNavigateToApplications: () => void
  onQuickAction: (command: string) => Promise<void>
  systemError: string | null
  systemInfo: SystemInfo | null
}

const quickActions = [
  { command: 'system.lock', description: 'Secure session', icon: 'lock' as const, label: 'Lock' },
  { command: 'system.sleep', description: 'Suspend activity', icon: 'moon' as const, label: 'Sleep' },
  { command: 'system.restart', description: 'Restart safely', icon: 'restart' as const, label: 'Restart' },
  { command: 'system.shutdown', description: 'Power down', icon: 'power' as const, label: 'Shutdown', critical: true },
]

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 GB'
  return `${(bytes / 1024 ** 3).toFixed(bytes >= 100 * 1024 ** 3 ? 0 : 1)} GB`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`
}

export function OverviewPage({
  actionMessage,
  activities,
  coreStatus,
  isSystemLoading,
  onNavigateToActivity,
  onNavigateToApplications,
  onQuickAction,
  systemError,
  systemInfo,
}: OverviewPageProps) {
  const disk = systemInfo?.disks[0]
  const unavailable = !systemInfo && !isSystemLoading
  const recentActivities = activities.slice(0, 4)
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    weekday: 'long',
  }).format(new Date())

  return (
    <div className="page page-overview">
      <header className="overview-header">
        <div>
          <span className="overview-context">WORLD 01 / MISSION CONTROL</span>
          <h1>The Core</h1>
        </div>
        <div className="overview-header-meta">
          <span>{dateLabel}</span>
          <div className="overview-core-chip">
            <i className={`status-orb status-orb-${coreStatus}`} />
            <span>CORE</span>
            <strong>{coreStatus.toUpperCase()}</strong>
          </div>
        </div>
      </header>

      {(systemError || actionMessage) && (
        <div className={`inline-notice${systemError ? ' inline-notice-error' : ''}`}>
          <Icon name={systemError ? 'activity' : 'check'} size={14} />
          <span>{systemError ?? actionMessage}</span>
        </div>
      )}

      <section className="overview-command-layout">
        <div className="overview-system-overview">
          <header>
            <span><i className={`status-orb status-orb-${coreStatus}`} /> LIVE SYSTEM</span>
            <small>TELEMETRY / 5 SEC</small>
          </header>
          <div className="overview-host-row">
            <div>
              <small>ACTIVE DEVICE</small>
              <h2>{systemInfo?.hostname ?? (unavailable ? 'System unavailable' : 'Connecting...')}</h2>
              <p>{systemInfo ? `${systemInfo.windowsVersion} · ${systemInfo.architecture}` : 'Waiting for local system telemetry.'}</p>
            </div>
            <span className="overview-health-score">{coreStatus === 'online' ? '100' : '—'}<small>HEALTH</small></span>
          </div>
          <div className="overview-telemetry-chart" aria-hidden="true">
            {Array.from({ length: 20 }, (_, index) => <i key={index} />)}
          </div>
          <footer>
            <span><b>CPU</b>{systemInfo?.cpu.loadPercent ?? 0}%</span>
            <span><b>MEM</b>{systemInfo?.memory.usedPercent ?? 0}%</span>
            <span><b>DISK</b>{disk?.usedPercent ?? 0}%</span>
            <span><b>THREADS</b>{systemInfo?.cpu.logicalProcessors ?? '—'}</span>
          </footer>
        </div>

        <aside className="overview-daily-brief">
          <header><span>DAILY BRIEF</span><small>LOCAL</small></header>
          <div className="overview-brief-primary">
            <small>UPTIME</small>
            <strong>{systemInfo ? formatUptime(systemInfo.uptimeSeconds) : '—'}</strong>
            <span>Continuous local session</span>
          </div>
          <dl>
            <div><dt>Core events</dt><dd>{activities.length}</dd></div>
            <div><dt>Storage free</dt><dd>{disk ? formatBytes(disk.freeBytes) : '—'}</dd></div>
            <div><dt>Control scope</dt><dd>LOCAL</dd></div>
          </dl>
          <button className="overview-pinned-apps" onClick={onNavigateToApplications}>
            <span><i>V</i><i>S</i><i>O</i></span>
            <span><small>PINNED APPS</small><strong>3 available</strong></span>
            <Icon name="chevron-right" size={14} />
          </button>
        </aside>
      </section>

      <section className="overview-metric-grid">
        <DashboardMetric detail={systemInfo?.cpu.model ?? 'Waiting for telemetry'} icon="cpu" label="Processor" loading={isSystemLoading && !systemInfo} utilization={systemInfo?.cpu.loadPercent} value={unavailable ? '—' : `${systemInfo?.cpu.loadPercent ?? 0}%`} />
        <DashboardMetric detail={systemInfo ? `${formatBytes(systemInfo.memory.usedBytes)} / ${formatBytes(systemInfo.memory.totalBytes)}` : 'Waiting for telemetry'} icon="memory" label="Memory" loading={isSystemLoading && !systemInfo} utilization={systemInfo?.memory.usedPercent} value={unavailable ? '—' : `${systemInfo?.memory.usedPercent ?? 0}%`} />
        <DashboardMetric detail={disk ? `${disk.name} · ${formatBytes(disk.freeBytes)} free` : 'No disk reported'} icon="drive" label="Primary storage" loading={isSystemLoading && !systemInfo} utilization={disk?.usedPercent} value={disk ? `${disk.usedPercent}%` : '—'} />
        <DashboardMetric detail="Current local session" icon="clock" label="System uptime" loading={isSystemLoading && !systemInfo} value={systemInfo ? formatUptime(systemInfo.uptimeSeconds) : '—'} />
      </section>

      <section className="overview-lower-layout">
        <div className="overview-actions-console">
          <header><div><span>CONTROL</span><h2>Quick actions</h2></div><small>SECURE GATEWAY</small></header>
          <div className="overview-action-grid">
            {quickActions.map((action) => <QuickAction {...action} disabled={coreStatus !== 'online'} key={action.command} onExecute={onQuickAction} />)}
          </div>
        </div>

        <div className="overview-activity-ledger">
          <header>
            <div><span>AUDIT</span><h2>Recent activity</h2></div>
            <ActionButton onClick={onNavigateToActivity} variant="ghost">Open ledger <Icon name="chevron-right" size={13} /></ActionButton>
          </header>
          {recentActivities.length > 0 ? (
            <ol className="compact-activity-list">{recentActivities.map((activity) => <TimelineItem activity={activity} key={activity.id} />)}</ol>
          ) : (
            <div className="overview-empty-ledger"><Icon name="activity" size={20} /><span><strong>No commands recorded</strong><small>The local audit stream is quiet.</small></span></div>
          )}
        </div>
      </section>
    </div>
  )
}
