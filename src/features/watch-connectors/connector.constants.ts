import type { WatchConnectorCapabilities, WatchConnectorId, WatchSyncPreference } from './connector.types.ts'

export const SYNC_PLAN_TTL_MS = 15 * 60 * 1_000
export const OAUTH_SESSION_TTL_MS = 5 * 60 * 1_000
export const CONNECTOR_HTTP_TIMEOUT_MS = 12_000

export const EMPTY_CAPABILITIES: WatchConnectorCapabilities = {
  supportsAutomaticSync: false, supportsEpisodeProgress: false, supportsExactProgress: false,
  supportsExport: false, supportsImport: false, supportsIncrementalSync: false,
  supportsMovieProgress: false, supportsProfiles: false, supportsRatings: false,
  supportsTwoWaySync: false, supportsWatchlists: false, supportsWebhooks: false,
}

export function defaultSyncPreference(connectorId: WatchConnectorId): WatchSyncPreference {
  return { connectorId, direction: 'pull', includeDates: false, includeProgress: true, includeRatings: false, includeStatuses: true, includeWatchlist: true, mode: 'manual', requirePreview: true }
}
