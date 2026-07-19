import { Icon } from '../../../components/ui/Icon.tsx'
import type { ApplicationActionState, DetectedApplication } from '../../../features/applications/application.types.ts'
import { WorkspaceAppIcon } from './WorkspaceAppIcon.tsx'

function lastUse(timestamp: number | null) {
  return timestamp ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp) : 'Never through NEXUS'
}

export function WorkspaceInspector({ actionState = 'idle', application, favorite, onClose, onLaunch, onToggleFavorite }: { actionState?: ApplicationActionState; application: DetectedApplication | null; favorite: boolean; onClose: () => void; onLaunch: () => void; onToggleFavorite: () => void }) {
  if (!application) return <aside className="workspace-inspector workspace-inspector-empty"><Icon name="applications" size={26} /><strong>Select an application</strong><p>Details and trusted actions will appear here.</p></aside>
  const running = application.runtimeStatus === 'running'
  const busy = actionState === 'launching' || actionState === 'closing'
  return (
    <aside className="workspace-inspector">
      <header><span>Application inspector</span><button aria-label={`${favorite ? 'Unpin' : 'Pin'} ${application.name}`} aria-pressed={favorite} className={favorite ? 'is-favorite' : ''} onClick={onToggleFavorite} type="button"><Icon name="sparkles" size={15} /></button></header>
      <div className="workspace-inspector-identity"><WorkspaceAppIcon applicationId={application.id} size={30} /><div><small>{application.publisher}</small><h2>{application.name}</h2><p>{application.description}</p></div></div>
      <dl><div><dt>Status</dt><dd><i className={running ? 'is-running' : ''} />{application.runtimeStatus}</dd></div><div><dt>Installation</dt><dd>{application.installStatus}</dd></div><div><dt>Detection source</dt><dd>{application.source}</dd></div><div><dt>NEXUS launches</dt><dd>{application.launchCount}</dd></div><div><dt>Last used</dt><dd>{lastUse(application.lastLaunchedAt)}</dd></div></dl>
      <div className="workspace-inspector-path"><span>Detected executable</span><code>{application.executablePath ?? 'Executable not detected'}</code></div>
      <button className="workspace-inspector-primary" disabled={application.installStatus !== 'installed' || busy || (running && !application.capabilities.close)} onClick={running ? onClose : onLaunch} type="button"><Icon name={running ? 'close' : 'play'} size={15} />{busy ? actionState : running ? 'Close application' : 'Open application'}</button>
      <footer><Icon name="lock" size={12} />Validated by the secure Application Registry</footer>
    </aside>
  )
}
