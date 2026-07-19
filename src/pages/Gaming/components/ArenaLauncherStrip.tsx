import { Icon } from '../../../components/ui/Icon.tsx'
import type { DetectedLauncher, LauncherId } from '../../../features/gaming/gaming.types.ts'

export function ArenaLauncherStrip({ launchers, onOpen, onScan, scanning }: { launchers: readonly DetectedLauncher[]; onOpen: (launcherId: LauncherId) => void; onScan: () => void; scanning: boolean }) {
  return (
    <section className="arena-launcher-strip">
      <header><div><span>Connected platforms</span><h2>Launchers</h2></div><button aria-label="Refresh launchers" disabled={scanning} onClick={onScan} type="button"><Icon name="refresh" size={14} />{scanning ? 'Scanning' : 'Refresh'}</button></header>
      <div className="arena-launcher-track">
        {launchers.map((launcher) => (
          <button className={launcher.runtimeStatus === 'running' ? 'is-running' : ''} disabled={launcher.installStatus !== 'installed' || !launcher.capabilities.launch} key={launcher.id} onClick={() => onOpen(launcher.id)} type="button">
            <span className="arena-launcher-logo">{launcher.id === 'steam' ? <Icon name="steam" size={22} /> : launcher.name.slice(0, 2).toLocaleUpperCase()}</span>
            <span><strong>{launcher.name}</strong><small>{launcher.installStatus === 'installed' ? `${launcher.gameCount} games` : 'Not detected'}</small></span>
            <span className="arena-launcher-status"><i />{launcher.runtimeStatus === 'running' ? 'Active' : launcher.installStatus === 'installed' ? 'Ready' : 'Offline'}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
