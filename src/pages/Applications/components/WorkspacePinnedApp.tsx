import { Icon } from '../../../components/ui/Icon.tsx'
import type { ApplicationActionState, DetectedApplication } from '../../../features/applications/application.types.ts'
import { WorkspaceAppIcon } from './WorkspaceAppIcon.tsx'

export function WorkspacePinnedApp({ actionState = 'idle', application, onClose, onLaunch, onSelect, onToggleFavorite, selected }: { actionState?: ApplicationActionState; application: DetectedApplication; onClose: () => void; onLaunch: () => void; onSelect: () => void; onToggleFavorite: () => void; selected: boolean }) {
  const running = application.runtimeStatus === 'running'
  const busy = actionState === 'launching' || actionState === 'closing'
  return (
    <article className={`workspace-pinned-app${selected ? ' is-selected' : ''}`} onClick={onSelect}>
      <header><WorkspaceAppIcon applicationId={application.id} size={27} /><button aria-label={`Unpin ${application.name}`} onClick={(event) => { event.stopPropagation(); onToggleFavorite() }} type="button"><Icon name="sparkles" size={14} /></button></header>
      <div><small>{application.category}</small><h3>{application.name}</h3><p>{application.description}</p></div>
      <footer><span><i className={running ? 'is-running' : ''} />{running ? 'Open now' : application.installStatus}</span><button disabled={application.installStatus !== 'installed' || busy || (running && !application.capabilities.close)} onClick={(event) => { event.stopPropagation(); if (running) onClose(); else onLaunch() }} type="button">{busy ? actionState : running ? 'Close' : 'Open'}<Icon name="arrow-up-right" size={13} /></button></footer>
    </article>
  )
}
