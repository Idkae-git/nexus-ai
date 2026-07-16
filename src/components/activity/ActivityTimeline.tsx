import type { NexusActivityEntry } from '../../core/activity/activity.types.js'

interface ActivityTimelineProps {
  activities: NexusActivityEntry[]
  error: string | null
  onClear: () => Promise<void>
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(timestamp)
}

export function ActivityTimeline({ activities, error, onClear }: ActivityTimelineProps) {
  return (
    <section className="panel activity-panel">
      <div className="section-heading">
        <div><span className="eyebrow">AUDIT STREAM</span><h2>Activity Timeline</h2></div>
        {activities.length > 0 && <button className="text-button" onClick={() => void onClear()}>Clear</button>}
      </div>
      {error ? (
        <div className="empty-state"><strong>Timeline unavailable</strong><span>{error}</span></div>
      ) : activities.length === 0 ? (
        <div className="empty-state"><strong>No activity yet</strong><span>Commands will appear here in real time.</span></div>
      ) : (
        <ol className="timeline-list">
          {activities.map((activity) => (
            <li className="timeline-item" key={activity.id}>
              <span className={`timeline-dot timeline-dot-${activity.status}`} />
              <div className="timeline-content">
                <div>
                  <strong>{activity.command.replace('system.', '')}</strong>
                  <span className={`status-chip status-${activity.status}`}>{activity.status.replace('_', ' ')}</span>
                </div>
                <span>{activity.source} · {formatTime(activity.createdAt)}{activity.durationMs !== undefined ? ` · ${activity.durationMs} ms` : ''}</span>
                {activity.error && <small>{activity.error}</small>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
