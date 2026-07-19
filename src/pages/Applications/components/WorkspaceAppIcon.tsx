import { Icon } from '../../../components/ui/Icon.tsx'
import type { IconName } from '../../../components/ui/Icon.tsx'
import type { ApplicationId } from '../../../features/applications/application.types.ts'

const applicationIcons: Readonly<Partial<Record<ApplicationId, IconName>>> = {
  'battle-net': 'gaming',
  discord: 'discord',
  'epic-games': 'gaming',
  'opera-gx': 'grid',
  'riot-client': 'gaming',
  spotify: 'wave',
  steam: 'steam',
  'ubisoft-connect': 'gaming',
  vlc: 'vlc',
  vscode: 'terminal',
}

export function WorkspaceAppIcon({ applicationId, size = 20 }: { applicationId: ApplicationId; size?: number }) {
  return <span className={`workspace-app-icon workspace-app-icon-${applicationId}`}><Icon name={applicationIcons[applicationId] ?? 'applications'} size={size} /></span>
}
