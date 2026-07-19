export const MEDIA_TYPES = ['film', 'series', 'video', 'music'] as const
export const MEDIA_FILTERS = ['all', ...MEDIA_TYPES, 'favorites', 'recent'] as const
export const MEDIA_SORT_MODES = ['title', 'recently-added', 'recently-watched', 'size'] as const

export type MediaType = typeof MEDIA_TYPES[number]
export type MediaFilter = typeof MEDIA_FILTERS[number]
export type MediaSortMode = typeof MEDIA_SORT_MODES[number]
export type MediaProviderId = 'local' | 'plex' | 'jellyfin' | 'emby'
export type MediaId = `${MediaProviderId}:${string}`

export interface MediaFolder {
  addedAt: number
  displayPath: string
  id: string
  label: string
  path: string
}

export interface DetectedMedia {
  dateAdded: number
  durationMs: number | null
  extension: string
  filePath: string
  folderId: string
  id: MediaId
  metadata: Readonly<Record<string, string | number | boolean | null>>
  provider: MediaProviderId
  size: number
  source: string
  thumbnailPath: string | null
  title: string
  type: MediaType
}

export interface MediaProviderError {
  message: string
  provider: MediaProviderId
}

export interface MediaScanSummary {
  durationMs: number
  foldersScanned: number
  itemsDetected: number
  providerErrors: MediaProviderError[]
  providersInspected: MediaProviderId[]
  scannedAt: number
  skippedFiles: number
  warnings: string[]
}

export interface MediaScanResult {
  items: DetectedMedia[]
  summary: MediaScanSummary
}

export interface MediaFavorite {
  createdAt: number
  mediaId: MediaId
  order: number
}

export interface MediaRecentEntry {
  mediaId: MediaId
  player: 'vlc' | 'internal'
  success: boolean
  timestamp: number
}

export interface MediaProgressEntry {
  completed: boolean
  durationMs: number | null
  mediaId: MediaId
  positionMs: number
  updatedAt: number
}

export type MediaPlayResult =
  | { launchedAt: number; mediaId: MediaId; player: 'vlc'; success: true }
  | { error: string; mediaId: MediaId; player: 'internal'; success: false }

export interface MediaPlayerStatus {
  internalAvailable: false
  vlcAvailable: boolean
  vlcRunning: boolean
}

export interface MediaPayload { mediaId: MediaId }
export interface MediaFavoritePayload extends MediaPayload { favorite: boolean }
export interface MediaProgressPayload extends MediaPayload {
  durationMs: number | null
  positionMs: number
}
export interface MediaFolderPayload { folderId: string }
