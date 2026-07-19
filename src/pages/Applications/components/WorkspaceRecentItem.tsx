import { Icon } from '../../../components/ui/Icon.tsx'
import type { ApplicationRecentEntry, DetectedApplication } from '../../../features/applications/application.types.ts'
import { WorkspaceAppIcon } from './WorkspaceAppIcon.tsx'

export function WorkspaceRecentItem({ application, entry }: { application: DetectedApplication | undefined; entry: ApplicationRecentEntry }) {
  return <li className="workspace-recent-item">{application ? <WorkspaceAppIcon applicationId={application.id} size={17} /> : <span className="workspace-recent-fallback"><Icon name="applications" size={17} /></span>}<span><strong>{application?.name ?? entry.applicationId}</strong><small>{entry.success ? 'Opened through NEXUS' : entry.error ?? 'Launch failed'}</small></span><span className={entry.success ? 'is-success' : 'is-failed'}>{entry.success ? 'Opened' : 'Failed'}</span><time>{new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(entry.timestamp)}</time></li>
}
