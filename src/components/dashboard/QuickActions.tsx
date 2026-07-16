interface QuickActionsProps {
  disabled: boolean
  onExecute: (command: string) => Promise<void>
}

const actions = [
  { command: 'system.lock', label: 'Lock', detail: 'Secure session', glyph: '⌁' },
  { command: 'system.sleep', label: 'Sleep', detail: 'Suspend system', glyph: '☾' },
  { command: 'system.restart', label: 'Restart', detail: 'Reboot Windows', glyph: '↻' },
  { command: 'system.shutdown', label: 'Shutdown', detail: 'Power off safely', glyph: '○' },
]

export function QuickActions({ disabled, onExecute }: QuickActionsProps) {
  return (
    <section className="panel quick-actions-panel">
      <div className="section-heading">
        <div><span className="eyebrow">COMMAND CENTER</span><h2>Quick Actions</h2></div>
        <span className="section-meta">LOCAL TARGET</span>
      </div>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button className={`quick-action ${action.command.includes('shutdown') ? 'quick-action-critical' : ''}`} disabled={disabled} key={action.command} onClick={() => void onExecute(action.command)}>
            <span className="action-icon" aria-hidden="true">{action.glyph}</span>
            <span><strong>{action.label}</strong><small>{action.detail}</small></span>
            <span className="action-arrow" aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
    </section>
  )
}
