export const WATCH_PROVIDER_IDS = [
  'nexus-local', 'vlc', 'netflix-import', 'crunchyroll-import', 'manual',
  'plex', 'jellyfin', 'emby', 'trakt', 'simkl', 'anilist', 'myanimelist',
] as const

export type WatchProviderId = typeof WATCH_PROVIDER_IDS[number]
export type WatchEntryId = string
export type WatchMediaType = 'movie' | 'series' | 'season' | 'episode' | 'anime' | 'unknown'
export type WatchStatus = 'planned' | 'in-progress' | 'completed' | 'dropped' | 'unknown'
export type WatchProgressPrecision = 'exact' | 'estimated' | 'watched-only' | 'unknown'
export type WatchConfidence = 'exact' | 'high' | 'medium' | 'low' | 'unmatched'
export type WatchHistoryFilter = 'all' | 'in-progress' | 'completed' | 'movies' | 'series' | 'anime' | 'netflix-import' | 'crunchyroll-import' | 'nexus-local' | 'vlc' | 'manual' | 'conflicts' | 'exact-progress' | 'unknown-progress'
export type WatchHistorySortMode = 'recently-watched' | 'recently-imported' | 'title' | 'progress' | 'source' | 'status'

export interface WatchSource {
  automatic: boolean
  importedAt: number
  precision: WatchProgressPrecision
  provider: WatchProviderId
  sourceFileName: string | null
  syncedAt: number
}

export interface WatchProgress {
  durationSeconds: number | null
  percent: number | null
  positionSeconds: number | null
  precision: WatchProgressPrecision
  updatedAt: number | null
}

export interface WatchEntry {
  confidence: WatchConfidence
  externalIds: Readonly<Record<string, string>>
  id: WatchEntryId
  importedAt: number
  lastProgressAt: number | null
  manuallyEdited: boolean
  mediaType: WatchMediaType
  metadata: Readonly<Record<string, string | number | boolean | null>>
  normalizedTitle: string
  originalTitle: string | null
  primaryProvider: WatchProviderId
  profileName: string
  progress: WatchProgress
  providerEntryId: string | null
  seasonNumber: number | null
  episodeNumber: number | null
  episodeTitle: string | null
  seriesTitle: string | null
  sources: WatchSource[]
  status: WatchStatus
  title: string
  updatedAt: number
  watchedAt: number | null
}

export interface MediaIdentity {
  confidence: WatchConfidence
  entryIds: WatchEntryId[]
  externalIds?: Readonly<Record<string, string>>
  alternativeTitles?: string[]
  format?: string | null
  id: string
  normalizedTitle: string
  releaseYear?: number | null
  seasonNumber: number | null
  episodeNumber: number | null
}

export type WatchConflictKind = 'progress' | 'date' | 'possible-match' | 'manual-protection'
export type WatchConflictResolution = 'keep-existing' | 'use-incoming' | 'keep-separate' | 'merged'

export interface WatchConflict {
  createdAt: number
  existingEntryId: WatchEntryId
  id: string
  importId: string | null
  incomingEntry: WatchEntry
  kind: WatchConflictKind
  reason: string
  resolution: WatchConflictResolution | null
  resolvedAt: number | null
}

export interface WatchImportError {
  line: number | null
  message: string
  rawValue: string | null
}

export interface WatchImport {
  checksum: string
  committedAt: number | null
  conflicts: number
  createdAt: number
  errors: WatchImportError[]
  fileName: string
  id: string
  importedCount: number
  ignoredDuplicates: number
  profileName: string
  provider: WatchProviderId
  status: 'preview' | 'committed' | 'cancelled' | 'failed'
  totalRows: number
}

export interface WatchImportPreview {
  columns: string[]
  conflicts: number
  duplicateEntries: number
  errors: WatchImportError[]
  fileName: string
  importId: string
  matchedEntries: number
  newEntries: number
  profileName: string
  provider: WatchProviderId
  sample: WatchEntry[]
  totalRows: number
  validEntries: number
  warnings: string[]
}

export interface WatchImportResult {
  conflicts: number
  ignoredDuplicates: number
  importId: string
  importedCount: number
  success: boolean
}

export interface WatchMatchResult {
  confidence: WatchConfidence
  entryId: WatchEntryId | null
  reasons: string[]
}

export interface WatchProviderDefinition {
  id: WatchProviderId
  label: string
  requiresAuthentication: boolean
  supportsAutomaticRefresh: boolean
  supportsExactProgress: boolean
  supportsExport: boolean
  supportsImport: boolean
  supportsProfiles: boolean
  supportsSync: boolean
}

export interface WatchStats {
  activityWithoutDuration: number
  animeEntries: number
  completedEntries: number
  episodes: number
  estimatedDurationSeconds: number
  exactDurationSeconds: number
  movies: number
  sourceCounts: Partial<Record<WatchProviderId, number>>
  totalEntries: number
}

export interface NexusWatchHistoryExport {
  entries: WatchEntry[]
  exportedAt: number
  metadata: Readonly<Record<string, string | number | boolean | null>>
  profile: string
  provider: WatchProviderId | 'nexus'
  schemaVersion: 1
}

export interface WatchHistoryQuery {
  filter?: WatchHistoryFilter
  profileName?: string
  query?: string
  sortMode?: WatchHistorySortMode
}

export interface WatchEntryUpdate {
  durationSeconds?: number | null
  episodeNumber?: number | null
  episodeTitle?: string | null
  mediaType?: WatchMediaType
  positionSeconds?: number | null
  seasonNumber?: number | null
  seriesTitle?: string | null
  status?: WatchStatus
  title?: string
  watchedAt?: number | null
}

export interface WatchImportSelection {
  fileName: string
  fileToken: string
  provider: 'netflix-import' | 'crunchyroll-import' | 'manual'
}
