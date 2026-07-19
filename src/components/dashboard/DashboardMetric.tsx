import { Icon } from '../ui/Icon.tsx'
import type { IconName } from '../ui/Icon.tsx'

interface DashboardMetricProps {
  detail: string
  icon: IconName
  label: string
  loading?: boolean
  utilization?: number
  value: string
}

export function DashboardMetric({ detail, icon, label, loading, utilization, value }: DashboardMetricProps) {
  const normalizedUtilization = Math.min(100, Math.max(0, utilization ?? 0))

  return (
    <article className="dashboard-metric">
      <div className="dashboard-metric-heading">
        <span><Icon name={icon} size={16} /></span>
        <small>{label}</small>
        <i />
      </div>
      {loading ? (
        <div className="dashboard-metric-loading" aria-label={`Loading ${label}`} />
      ) : (
        <>
          <strong>{value}</strong>
          <p>{detail}</p>
          {utilization !== undefined && (
            <div className="dashboard-meter" aria-label={`${normalizedUtilization}%`}>
              <span style={{ width: `${normalizedUtilization}%` }} />
            </div>
          )}
        </>
      )}
    </article>
  )
}
