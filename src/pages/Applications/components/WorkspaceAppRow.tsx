import { Icon } from '../../../components/ui/Icon.tsx'
import type { ApplicationActionState, DetectedApplication } from '../../../features/applications/application.types.ts'
import { WorkspaceAppIcon } from './WorkspaceAppIcon.tsx'

export function WorkspaceAppRow({ actionState = 'idle', application, favorite, featured, onClose, onLaunch, onSelect, onToggleFavorite, selected }: { actionState?: ApplicationActionState; application: DetectedApplication; favorite: boolean; featured: boolean; onClose: () => void; onLaunch: () => void; onSelect: () => void; onToggleFavorite: () => void; selected: boolean }) {
  const running = application.runtimeStatus === 'running'
  const busy = actionState === 'launching' || actionState === 'closing'
  return (
    <article className={`workspace-app-row${featured ? ' is-featured' : ''}${selected ? ' is-selected' : ''}`} onClick={onSelect}>
      <WorkspaceAppIcon applicationId={application.id} size={featured ? 28 : 19} />
      <div className="workspace-app-row-copy"><small>{application.publisher}</small><strong>{application.name}</strong>{featured && <p>{application.description}</p>}</div>
      <span className="workspace-app-row-category">{application.category}</span>
      <span className="workspace-app-row-state"><i className={running ? 'is-running' : ''} />{running ? 'Running' : application.installStatus}</span>
      <button aria-label={`${favorite ? 'Unpin' : 'Pin'} ${application.name}`} aria-pressed={favorite} className={favorite ? 'is-favorite' : ''} onClick={(event) => { event.stopPropagation(); onToggleFavorite() }} type="button"><Icon name="sparkles" size={14} /></button>
      <button className="workspace-app-row-action" disabled={application.installStatus !== 'installed' || busy || (running && !application.capabilities.close)} onClick={(event) => { event.stopPropagation(); if (running) onClose(); else onLaunch() }} type="button">{busy ? actionState : running ? 'Close' : 'Open'}<Icon name="chevron-right" size={14} /></button>
    </article>
  )
}
