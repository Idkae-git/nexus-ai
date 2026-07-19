import { Icon } from '../../../components/ui/Icon.tsx'
import type { ApplicationActionState, DetectedApplication } from '../../../features/applications/application.types.ts'
import { WorkspaceAppIcon } from './WorkspaceAppIcon.tsx'

export function WorkspaceRunningApp({ actionState = 'idle', application, onClose, onSelect }: { actionState?: ApplicationActionState; application: DetectedApplication; onClose: () => void; onSelect: () => void }) {
  return <article className="workspace-running-app" onClick={onSelect}><WorkspaceAppIcon applicationId={application.id} /><span><strong>{application.name}</strong><small><i />Running</small></span><button aria-label={`Close ${application.name}`} disabled={actionState === 'closing' || !application.capabilities.close} onClick={(event) => { event.stopPropagation(); onClose() }} type="button"><Icon name="close" size={14} /></button></article>
}
