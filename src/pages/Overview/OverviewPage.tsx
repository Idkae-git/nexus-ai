import type { NexusActivityEntry } from '../../core/activity/activity.types.js'
import type { SystemInfo } from '../../core/platform/system-info.js'
import { ActivityTimeline } from '../../components/activity/ActivityTimeline.tsx'
import { MetricCard } from '../../components/dashboard/MetricCard.tsx'
import { QuickActions } from '../../components/dashboard/QuickActions.tsx'

interface OverviewPageProps {
  coreStatus: 'connecting' | 'online' | 'offline'
  systemInfo: SystemInfo | null
  systemError: string | null
  isSystemLoading: boolean
  activities: NexusActivityEntry[]
  activitiesError: string | null
  actionMessage: string | null
  onQuickAction: (command: string) => Promise<void>
  onClearActivities: () => Promise<void>
}

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

export function OverviewPage(props: OverviewPageProps) {
  const disk = props.systemInfo?.disks[0]
  const unavailable = !props.systemInfo && !props.isSystemLoading

  return (
    <main className="main-content">
      <header className="topbar">
        <div><span className="eyebrow">NEXUS / OVERVIEW</span><h1>System Overview</h1><p>Live telemetry and local command control.</p></div>
        <div className="topbar-status"><span className={`status-orb status-orb-${props.coreStatus}`} /><div><span>NEXUS CORE</span><strong>{props.coreStatus.toUpperCase()}</strong></div></div>
      </header>

      {props.systemError && <div className="notice notice-error">{props.systemError}</div>}
      {props.actionMessage && <div className="notice">{props.actionMessage}</div>}

      <section className="system-hero">
        <div>
          <div className="hero-badge"><span className={`status-orb status-orb-${props.coreStatus}`} /> LOCAL WINDOWS NODE</div>
          <h2>{props.systemInfo?.hostname ?? (unavailable ? 'Unavailable' : 'Connecting…')}</h2>
          <p>{props.systemInfo ? `${props.systemInfo.windowsVersion} · ${props.systemInfo.architecture}` : 'Establishing a secure connection to NEXUS Core.'}</p>
        </div>
        <div className="hero-visual" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><strong>N</strong></div>
      </section>

      <section className="metrics-grid" aria-label="System metrics">
        <MetricCard label="CPU LOAD" value={unavailable ? '—' : `${props.systemInfo?.cpu.loadPercent ?? 0}%`} detail={props.systemInfo ? `${props.systemInfo.cpu.logicalProcessors} logical processors · ${props.systemInfo.cpu.model}` : 'Waiting for telemetry'} percentage={props.systemInfo?.cpu.loadPercent} loading={props.isSystemLoading && !props.systemInfo} />
        <MetricCard label="MEMORY" value={unavailable ? '—' : `${props.systemInfo?.memory.usedPercent ?? 0}%`} detail={props.systemInfo ? `${formatBytes(props.systemInfo.memory.usedBytes)} of ${formatBytes(props.systemInfo.memory.totalBytes)} used` : 'Waiting for telemetry'} percentage={props.systemInfo?.memory.usedPercent} loading={props.isSystemLoading && !props.systemInfo} />
        <MetricCard label="STORAGE" value={disk ? `${disk.usedPercent}%` : '—'} detail={disk ? `${disk.name} · ${formatBytes(disk.freeBytes)} available` : props.systemInfo ? 'No local disk reported' : 'Waiting for telemetry'} percentage={disk?.usedPercent} loading={props.isSystemLoading && !props.systemInfo} />
        <MetricCard label="UPTIME" value={props.systemInfo ? formatUptime(props.systemInfo.uptimeSeconds) : '—'} detail={props.systemInfo ? `${props.systemInfo.platform} · ${props.systemInfo.architecture}` : 'Waiting for telemetry'} loading={props.isSystemLoading && !props.systemInfo} />
      </section>

      <div className="dashboard-grid">
        <QuickActions disabled={props.coreStatus !== 'online'} onExecute={props.onQuickAction} />
        <ActivityTimeline activities={props.activities} error={props.activitiesError} onClear={props.onClearActivities} />
      </div>
    </main>
  )
}
