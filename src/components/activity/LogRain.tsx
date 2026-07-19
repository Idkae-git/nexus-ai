const logFragments = [
  'core.listen()',
  'gateway.ready',
  'audit::local',
  'execute.pending',
  'permission.ok',
  'stream.follow',
  'activity.append',
  'source::ui',
]

export function LogRain() {
  return (
    <div aria-hidden="true" className="activity-log-rain world-effect-layer ambient-secondary">
      {logFragments.map((fragment, index) => <span key={fragment} style={{ '--log-index': index } as CSSProperties}>{fragment}</span>)}
    </div>
  )
}
import type { CSSProperties } from 'react'
