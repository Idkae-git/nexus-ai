interface MetricCardProps {
  label: string
  value: string
  detail: string
  percentage?: number
  loading?: boolean
}

export function MetricCard({ label, value, detail, percentage, loading }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-card-head"><span className="eyebrow">{label}</span><span className="metric-pulse" /></div>
      {loading ? <div className="metric-skeleton" aria-label={`Loading ${label}`} /> : (
        <>
          <strong className="metric-value">{value}</strong>
          <span className="metric-detail">{detail}</span>
          {percentage !== undefined && <div className="progress-track" aria-label={`${percentage}%`}><span style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} /></div>}
        </>
      )}
    </article>
  )
}
