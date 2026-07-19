import type { NexusActivityEntry } from '../../core/activity/activity.types.js'
import { Icon } from '../ui/Icon.tsx'

interface TimelineEntryProps {
  activity: NexusActivityEntry
  index: number
}

function formatTerminalTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
}

export function TimelineEntry({ activity, index }: TimelineEntryProps) {
  const moduleName = activity.command.split('.')[0] ?? 'core'
  const statusLabel = activity.status.replaceAll('_', ' ')

  return (
    <li className={`terminal-entry terminal-entry-${activity.status}`}>
      <span className="terminal-entry-index">{String(index + 1).padStart(3, '0')}</span>
      <span className="terminal-entry-node"><i /></span>
      <div className="terminal-entry-main">
        <div className="terminal-entry-command">
          <span className="terminal-prompt">nexus@{moduleName}:~$</span>
          <strong>{activity.command}</strong>
        </div>
        {activity.error && <p>{activity.error}</p>}
        <div className="terminal-entry-tags">
          <span><Icon name="terminal" size={12} /> {activity.source}</span>
          <span>{moduleName}</span>
        </div>
      </div>
      <div className="terminal-entry-meta">
        <span className={`terminal-status terminal-status-${activity.status}`}><i /> {statusLabel}</span>
        <time>{formatTerminalTime(activity.createdAt)}</time>
        <small>{activity.durationMs !== undefined ? `${activity.durationMs} ms` : 'pending'}</small>
      </div>
    </li>
  )
}
