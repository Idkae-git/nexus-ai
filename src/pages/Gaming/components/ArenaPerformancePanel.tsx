import type { SystemInfo } from '../../../core/platform/system-info.js'
import { Icon } from '../../../components/ui/Icon.tsx'

function Metric({ icon, label, value }: { icon: 'cpu' | 'memory' | 'activity'; label: string; value: string }) {
  return <div className="arena-performance-metric"><span><Icon name={icon} size={15} />{label}</span><strong>{value}</strong></div>
}

export function ArenaPerformancePanel({ systemInfo }: { systemInfo: SystemInfo | null }) {
  return (
    <section className="arena-performance-panel">
      <header><span>System performance</span><i className={systemInfo ? 'is-online' : ''} /></header>
      <div>
        <Metric icon="cpu" label="CPU load" value={systemInfo ? `${systemInfo.cpu.loadPercent}%` : '—'} />
        <Metric icon="memory" label="Memory" value={systemInfo ? `${systemInfo.memory.usedPercent}%` : '—'} />
        <Metric icon="activity" label="System" value={systemInfo ? 'Online' : 'Unavailable'} />
      </div>
      <footer><span>GPU and temperature</span><strong>Telemetry not connected</strong></footer>
    </section>
  )
}
