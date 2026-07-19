export const APPLICATION_IDS = [
  'opera-gx',
  'steam',
  'discord',
  'spotify',
  'vscode',
  'vlc',
  'epic-games',
  'ubisoft-connect',
  'battle-net',
  'riot-client',
] as const

export type ApplicationId = typeof APPLICATION_IDS[number]
export type ApplicationInstallStatus = 'installed' | 'not-installed' | 'unknown'
export type ApplicationRuntimeStatus = 'running' | 'stopped' | 'unknown'
export type ApplicationSource = 'registry' | 'known-path' | 'unknown'
export type ApplicationCategory = 'browser' | 'communication' | 'development' | 'games' | 'media' | 'music'
export type ApplicationSearchFilter = 'all' | 'installed' | 'running' | 'favorites' | 'not-installed'
export type ApplicationSortMode = 'name' | 'favorites' | 'recent' | 'running' | 'installation'
export type ApplicationActionState = 'idle' | 'launching' | 'closing' | 'error'

export interface ApplicationDefinition {
  capabilities: {
    close: boolean
    forceClose: boolean
    launch: boolean
  }
  category: ApplicationCategory
  defaultArguments: readonly string[]
  description: string
  executableNames: readonly string[]
  iconId: string
  id: ApplicationId
  name: string
  processNames: readonly string[]
  publisher: string
}
export interface DetectedApplication extends ApplicationDefinition {
  executablePath: string | null
  installDirectory: string | null
  installStatus: ApplicationInstallStatus
  lastLaunchedAt: number | null
  launchCount: number
  metadata: Readonly<Record<string, string>>
  runtimeStatus: ApplicationRuntimeStatus
  source: ApplicationSource
}

export interface ApplicationLaunchResult {
  applicationId: ApplicationId
  executablePath: string
  launchedAt: number
  success: true
}

export interface ApplicationCloseResult {
  applicationId: ApplicationId
  closedProcesses: readonly string[]
  success: true
}

export interface ApplicationFavorite {
  applicationId: ApplicationId
  createdAt: number
  order: number
}

export interface ApplicationRecentEntry {
  applicationId: ApplicationId
  error?: string
  success: boolean
  timestamp: number
}

export interface ApplicationScanResult {
  applications: DetectedApplication[]
  scannedAt: number
}

export interface ApplicationRuntimeResult {
  applicationId: ApplicationId
  runtimeStatus: ApplicationRuntimeStatus
}

export interface ApplicationLaunchPayload {
  applicationId: ApplicationId
}

export interface ApplicationClosePayload {
  applicationId: ApplicationId
}

export interface ApplicationGetPayload {
  applicationId: ApplicationId
}
