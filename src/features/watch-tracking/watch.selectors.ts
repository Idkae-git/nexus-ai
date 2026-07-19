import type { WatchConflict, WatchEntry, WatchHistoryFilter, WatchHistorySortMode } from './watch.types.ts'

export function selectWatchHistory(entries: readonly WatchEntry[], conflicts: readonly WatchConflict[], query: string, filter: WatchHistoryFilter, sort: WatchHistorySortMode, profile: string) {
  const needle = query.trim().toLocaleLowerCase()
  const conflictIds = new Set(conflicts.filter((entry) => !entry.resolution).map((entry) => entry.existingEntryId))
  return entries.filter((entry) => {
    if (profile !== 'all' && entry.profileName !== profile) return false
    if (needle && ![entry.title, entry.seriesTitle, entry.episodeTitle, entry.primaryProvider, entry.profileName].some((value) => value?.toLocaleLowerCase().includes(needle))) return false
    switch (filter) {
      case 'all': return true
      case 'in-progress': return entry.status === 'in-progress'
      case 'completed': return entry.status === 'completed'
      case 'movies': return entry.mediaType === 'movie'
      case 'series': return ['series', 'season', 'episode'].includes(entry.mediaType)
      case 'anime': return entry.mediaType === 'anime'
      case 'conflicts': return conflictIds.has(entry.id)
      case 'exact-progress': return entry.progress.precision === 'exact'
      case 'unknown-progress': return entry.progress.percent === null
      default: return entry.primaryProvider === filter
    }
  }).toSorted((left, right) => {
    if (sort === 'title') return left.title.localeCompare(right.title)
    if (sort === 'progress') return (right.progress.percent ?? -1) - (left.progress.percent ?? -1)
    if (sort === 'source') return left.primaryProvider.localeCompare(right.primaryProvider)
    if (sort === 'status') return left.status.localeCompare(right.status)
    if (sort === 'recently-imported') return right.importedAt - left.importedAt
    return (right.watchedAt ?? right.updatedAt) - (left.watchedAt ?? left.updatedAt)
  })
}

export function selectContinueWatching(entries: readonly WatchEntry[]) { return entries.filter((entry) => entry.status === 'in-progress' && entry.progress.precision === 'exact' && entry.progress.percent !== null && entry.progress.percent > 0 && entry.progress.percent < 100).toSorted((left, right) => (right.lastProgressAt ?? 0) - (left.lastProgressAt ?? 0)) }
export function selectWatchProfiles(entries: readonly WatchEntry[]) { return ['all', ...new Set(entries.map((entry) => entry.profileName))] }
