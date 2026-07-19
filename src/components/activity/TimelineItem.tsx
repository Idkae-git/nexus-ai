import type { NexusActivityEntry } from '../../core/activity/activity.types.js'
import { Icon } from '../ui/Icon.tsx'
import type { IconName } from '../ui/Icon.tsx'

interface TimelineItemProps {
  activity: NexusActivityEntry
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
}

function commandIcon(command: string): IconName {
  if (command.includes('lock')) return 'lock'
  if (command.includes('sleep')) return 'moon'
  if (command.includes('restart')) return 'restart'
  if (command.includes('shutdown')) return 'power'
  if (command.includes('info')) return 'cpu'
  return 'activity'
}

export function TimelineItem({ activity }: TimelineItemProps) {
  const moduleName = activity.command.split('.')[0] ?? 'core'
  const commandName = activity.command.split('.').slice(1).join(' ') || activity.command

  return (
    <li className="activity-row">
      <span className={`activity-module-icon activity-module-${moduleName}`}>
        <Icon name={commandIcon(activity.command)} size={17} />
      </span>
      <div className="activity-row-main">
        <div className="activity-row-title">
          <strong>{commandName}</strong>
          <span className={`status-badge status-badge-${activity.status}`}>
            <i /> {activity.status.replaceAll('_', ' ')}
          </span>
        </div>
        <span className="activity-command">{activity.command}</span>
        {activity.error && <small className="activity-error">{activity.error}</small>}
      </div>
      <div className="activity-row-meta">
        <span>{formatTime(activity.createdAt)}</span>
        <small>{activity.durationMs !== undefined ? `${activity.durationMs} ms` : 'Pending'}</small>
      </div>
    </li>
  )
}
