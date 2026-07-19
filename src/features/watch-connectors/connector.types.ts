import type { WatchConfidence, WatchEntry, WatchEntryId, WatchStatus } from '../watch-tracking/watch.types.ts'

export const WATCH_CONNECTOR_IDS = ['anilist', 'simkl', 'trakt', 'myanimelist', 'plex', 'jellyfin', 'emby'] as const
export type WatchConnectorId = typeof WATCH_CONNECTOR_IDS[number]
export type WatchConnectorStatus = 'disconnected' | 'connecting' | 'connected' | 'expired' | 'error' | 'configuration-required' | 'unsupported'
export type WatchSyncDirection = 'pull' | 'push' | 'bidirectional'
export type WatchSyncMode = 'manual' | 'on-launch' | 'on-forest-open' | 'scheduled' | 'after-local-change' | 'disabled'
export type WatchSyncOperationType = 'create-local' | 'update-local' | 'create-remote' | 'update-remote' | 'skip' | 'conflict' | 'unmatched'
export type WatchSyncOperationState = 'pending' | 'running' | 'success' | 'failed' | 'cancelled' | 'excluded'
export type WatchSyncConflictType = 'progress-divergence' | 'status-divergence' | 'identity-ambiguity' | 'local-manual-edit' | 'remote-newer' | 'local-newer' | 'deleted-remotely' | 'missing-remote-media' | 'unsupported-value' | 'score-divergence'
export type WatchSyncConflictResolution = 'keep-local' | 'keep-remote' | 'merge' | 'ignore'
export type RemoteMediaStatus = 'current' | 'completed' | 'planning' | 'dropped' | 'paused' | 'repeating' | 'unknown'

export interface WatchConnectorCapabilities {
  supportsAutomaticSync: boolean
  supportsEpisodeProgress: boolean
  supportsExactProgress: boolean
  supportsExport: boolean
  supportsImport: boolean
  supportsIncrementalSync: boolean
  supportsMovieProgress: boolean
  supportsProfiles: boolean
  supportsRatings: boolean
  supportsTwoWaySync: boolean
  supportsWatchlists: boolean
  supportsWebhooks: boolean
}

export interface WatchConnectorDefinition {
  authenticationType: 'oauth2-code' | 'oauth2-pkce' | 'api-token' | 'local' | 'none'
  capabilities: WatchConnectorCapabilities
  description: string
  displayName: string
  icon: string
  id: WatchConnectorId
  limitations: string[]
  requiredConfiguration: string[]
}

export interface WatchConnectorUser {
  avatarUrl: string | null
  displayName: string
  remoteUserId: string
}

export interface WatchConnectorConnection {
  connectorId: WatchConnectorId
  error: string | null
  expiresAt: number | null
  lastSyncAt: number | null
  secureCredentialReference: string | null
  status: WatchConnectorStatus
  user: WatchConnectorUser | null
}

export interface WatchConnectorView extends WatchConnectorDefinition {
  connection: Omit<WatchConnectorConnection, 'secureCredentialReference'>
}

export interface RemoteMediaEntry {
  alternativeTitles: string[]
  coverImageUrl: string | null
  episodeCount: number | null
  externalIds: Readonly<Record<string, string>>
  format: string | null
  mediaType: 'anime' | 'movie' | 'series' | 'unknown'
  progress: number | null
  provider: WatchConnectorId
  providerEntryId: string
  providerMediaId: string
  releaseYear: number | null
  repeatCount: number | null
  score: number | null
  startedAt: string | null
  completedAt: string | null
  status: RemoteMediaStatus
  title: string
  updatedAt: number | null
}

export interface WatchSyncConflict {
  confidence: WatchConfidence
  id: string
  localEntryId: WatchEntryId | null
  localUpdatedAt: number | null
  localValue: string | number | null
  recommendation: WatchSyncConflictResolution | null
  remoteEntryId: string | null
  remoteUpdatedAt: number | null
  remoteValue: string | number | null
  resolution: WatchSyncConflictResolution | null
  type: WatchSyncConflictType
}

export interface WatchSyncOperation {
  attempt: number
  confidence: WatchConfidence
  conflictId: string | null
  error: string | null
  id: string
  included: boolean
  localEntry: WatchEntry | null
  reason: string
  remoteEntry: RemoteMediaEntry | null
  result: string | null
  state: WatchSyncOperationState
  timestamp: number | null
  type: WatchSyncOperationType
}

export interface WatchSyncPlanSummary {
  conflicts: number
  createLocal: number
  createRemote: number
  skipped: number
  unchanged: number
  unmatched: number
  updateLocal: number
  updateRemote: number
}

export interface WatchSyncPlan {
  connectorId: WatchConnectorId
  createdAt: number
  direction: WatchSyncDirection
  expiresAt: number
  id: string
  operations: WatchSyncOperation[]
  profileName: string
  remoteItemsAnalyzed: number
  summary: WatchSyncPlanSummary
}

export interface WatchSyncResult {
  cancelled: boolean
  completedAt: number
  connectorId: WatchConnectorId
  failed: number
  planId: string
  succeeded: number
  total: number
}

export interface WatchSyncHistoryEntry extends WatchSyncResult {
  direction: WatchSyncDirection
  errors: string[]
  id: string
  remoteUser: string | null
  startedAt: number
  summary: string
}

export interface WatchSyncPreference {
  connectorId: WatchConnectorId
  direction: WatchSyncDirection
  includeDates: boolean
  includeProgress: boolean
  includeRatings: boolean
  includeStatuses: boolean
  includeWatchlist: boolean
  mode: WatchSyncMode
  requirePreview: boolean
}

export interface WatchSyncStatus {
  completed: number
  currentItem: string | null
  errors: number
  rateLimitedUntil: number | null
  running: boolean
  syncPlanId: string | null
  total: number
}

export function nexusStatusFromRemote(status: RemoteMediaStatus): WatchStatus {
  if (status === 'current' || status === 'repeating' || status === 'paused') return 'in-progress'
  if (status === 'completed') return 'completed'
  if (status === 'planning') return 'planned'
  if (status === 'dropped') return 'dropped'
  return 'unknown'
}
