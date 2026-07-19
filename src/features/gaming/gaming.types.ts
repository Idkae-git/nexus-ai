export const LAUNCHER_IDS = ['steam', 'epic', 'ubisoft', 'battlenet', 'riot', 'ea', 'gog', 'xbox'] as const
export const GAME_PROVIDER_IDS = ['steam', 'epic', 'ubisoft', 'battlenet', 'riot'] as const

export type LauncherId = typeof LAUNCHER_IDS[number]
export type GameProviderId = typeof GAME_PROVIDER_IDS[number]
export type GameId = `${GameProviderId}:${string}`
export type LauncherInstallStatus = 'installed' | 'not-installed' | 'unknown'
export type LauncherRuntimeStatus = 'running' | 'stopped' | 'unknown'
export type GameInstallStatus = 'installed' | 'partial' | 'unknown'
export type GameRuntimeStatus = 'running' | 'stopped' | 'unknown'
export type GameSessionStatus = 'launching' | 'running' | 'ended' | 'failed' | 'unknown'
export type GameLibraryFilter = 'all' | 'installed' | 'running' | 'favorites' | GameProviderId
export type GameLibrarySortMode = 'alphabetical' | 'favorites' | 'recent' | 'provider' | 'running' | 'updated'

export interface LauncherDefinition {
  applicationId: 'steam' | 'epic-games' | 'ubisoft-connect' | 'battle-net' | 'riot-client' | null
  capabilities: {
    close: boolean
    directGameLaunch: boolean
    libraryScan: boolean
    launch: boolean
  }
  id: LauncherId
  manifestLocations: readonly string[]
  name: string
  processNames: readonly string[]
  providerId: GameProviderId | null
}

export interface DetectedLauncher extends LauncherDefinition {
  error: string | null
  executablePath: string | null
  gameCount: number
  installDirectory: string | null
  installStatus: LauncherInstallStatus
  runtimeStatus: LauncherRuntimeStatus
  source: string
}

export type GameLaunchStrategy =
  | { type: 'uri'; uri: string }
  | { arguments: readonly string[]; launcherId: LauncherId; type: 'launcher-arguments' }
  | { arguments: readonly string[]; executablePath: string; type: 'validated-executable' }

export interface GameCapabilities {
  close: boolean
  launch: boolean
  trackProcess: boolean
}

export interface DetectedGame {
  artworkPath: string | null
  capabilities: GameCapabilities
  executablePath: string | null
  gameProcessNames: readonly string[]
  id: GameId
  installDirectory: string | null
  installStatus: GameInstallStatus
  lastLaunchedAt: number | null
  lastUpdatedAt: number | null
  launchCount: number
  launcherId: LauncherId
  launchStrategy: GameLaunchStrategy
  metadata: Readonly<Record<string, string | number | boolean | null>>
  provider: GameProviderId
  providerGameId: string
  remoteArtworkUrl: string | null
  runtimeStatus: GameRuntimeStatus
  sizeOnDisk: number | null
  source: string
  tags: readonly string[]
  title: string
}

export interface ProviderScanError {
  message: string
  provider: GameProviderId
}

export interface GameLibraryScanSummary {
  durationMs: number
  gamesDetected: number
  providerErrors: ProviderScanError[]
  providersInspected: GameProviderId[]
  providersSucceeded: GameProviderId[]
  scannedAt: number
  warnings: string[]
}

export interface GameLibraryScanResult {
  games: DetectedGame[]
  launchers: DetectedLauncher[]
  summary: GameLibraryScanSummary
}

export interface GameLaunchResult {
  gameId: GameId
  launchedAt: number
  launcherStarted: boolean
  provider: GameProviderId
  sessionId: string
  strategy: GameLaunchStrategy['type']
  success: true
}

export interface GameCloseResult {
  closedProcesses: readonly string[]
  gameId: GameId
  success: true
}

export interface GameRuntimeResult {
  gameId: GameId
  runtimeStatus: GameRuntimeStatus
}

export interface LauncherOpenResult {
  launcherId: LauncherId
  openedAt: number
  success: true
}

export interface LauncherPayload { launcherId: LauncherId }

export interface GameSession {
  detectedRunningAt: number | null
  durationMs: number | null
  endedAt: number | null
  error?: string
  gameId: GameId
  id: string
  processDetection: 'process-name' | 'unavailable'
  provider: GameProviderId
  startedAt: number
  status: GameSessionStatus
}

export interface GameFavorite {
  createdAt: number
  gameId: GameId
  order: number
}

export interface GameRecentEntry {
  durationMs: number | null
  error?: string
  gameId: GameId
  sessionId?: string
  success: boolean
  timestamp: number
}

export interface GamePayload { gameId: GameId }
export interface GameFavoritePayload extends GamePayload { favorite: boolean }
