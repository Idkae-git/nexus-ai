import type { WatchHistoryFilter, WatchHistorySortMode, WatchProviderDefinition } from './watch.types.ts'

export const WATCH_COMPLETION_PERCENT = 90
export const WATCH_COMPLETION_REMAINING_SECONDS = 300
export const WATCH_IMPORT_MAX_BYTES = 10 * 1024 * 1024

export const WATCH_FILTERS: readonly { id: WatchHistoryFilter; label: string }[] = [
  { id: 'all', label: 'Tout' }, { id: 'in-progress', label: 'En cours' }, { id: 'completed', label: 'Terminés' },
  { id: 'movies', label: 'Films' }, { id: 'series', label: 'Séries' }, { id: 'anime', label: 'Animés' },
  { id: 'netflix-import', label: 'Netflix' }, { id: 'crunchyroll-import', label: 'Crunchyroll' },
  { id: 'nexus-local', label: 'Local' }, { id: 'vlc', label: 'VLC' }, { id: 'manual', label: 'Manuel' },
  { id: 'conflicts', label: 'Conflits' }, { id: 'exact-progress', label: 'Progression exacte' }, { id: 'unknown-progress', label: 'Progression inconnue' },
]

export const WATCH_SORTS: readonly { id: WatchHistorySortMode; label: string }[] = [
  { id: 'recently-watched', label: 'Récemment regardé' }, { id: 'recently-imported', label: 'Récemment importé' },
  { id: 'title', label: 'Titre' }, { id: 'progress', label: 'Progression' }, { id: 'source', label: 'Source' }, { id: 'status', label: 'Statut' },
]

export const WATCH_PROVIDERS: readonly WatchProviderDefinition[] = [
  { id: 'nexus-local', label: 'Local NEXUS', requiresAuthentication: false, supportsAutomaticRefresh: true, supportsExactProgress: true, supportsExport: true, supportsImport: false, supportsProfiles: true, supportsSync: true },
  { id: 'vlc', label: 'VLC', requiresAuthentication: false, supportsAutomaticRefresh: false, supportsExactProgress: false, supportsExport: true, supportsImport: false, supportsProfiles: true, supportsSync: false },
  { id: 'netflix-import', label: 'Netflix', requiresAuthentication: false, supportsAutomaticRefresh: false, supportsExactProgress: false, supportsExport: true, supportsImport: true, supportsProfiles: true, supportsSync: false },
  { id: 'crunchyroll-import', label: 'Crunchyroll', requiresAuthentication: false, supportsAutomaticRefresh: false, supportsExactProgress: false, supportsExport: true, supportsImport: true, supportsProfiles: true, supportsSync: false },
  { id: 'manual', label: 'Manuel / NEXUS', requiresAuthentication: false, supportsAutomaticRefresh: false, supportsExactProgress: true, supportsExport: true, supportsImport: true, supportsProfiles: true, supportsSync: false },
  ...(['plex', 'jellyfin', 'emby', 'trakt', 'simkl', 'anilist', 'myanimelist'] as const).map((id) => ({ id, label: id[0].toLocaleUpperCase() + id.slice(1), requiresAuthentication: true, supportsAutomaticRefresh: false, supportsExactProgress: false, supportsExport: false, supportsImport: false, supportsProfiles: true, supportsSync: false })),
]
