interface StatusBadgeProps {
  label: string
  tone?: 'default' | 'success' | 'warning'
}

export function StatusBadge({ label, tone = 'default' }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge-${tone}`}>
      <i /> {label}
    </span>
  )
}
