import type { DetectedMedia, MediaFavorite, MediaFilter, MediaRecentEntry, MediaSortMode } from './media.types.ts'

export function selectMedia(
  items: readonly DetectedMedia[], favorites: readonly MediaFavorite[], recent: readonly MediaRecentEntry[],
  query: string, filter: MediaFilter, sortMode: MediaSortMode,
) {
  const favoriteIds = new Set(favorites.map((entry) => entry.mediaId))
  const recentById = new Map(recent.map((entry) => [entry.mediaId, entry.timestamp]))
  const normalizedQuery = query.trim().toLocaleLowerCase()
  return items.filter((item) => {
    if (normalizedQuery && !`${item.title} ${item.extension} ${item.type}`.toLocaleLowerCase().includes(normalizedQuery)) return false
    if (filter === 'all') return true
    if (filter === 'favorites') return favoriteIds.has(item.id)
    if (filter === 'recent') return recentById.has(item.id)
    return item.type === filter
  }).sort((left, right) => {
    if (sortMode === 'recently-added') return right.dateAdded - left.dateAdded || left.title.localeCompare(right.title)
    if (sortMode === 'recently-watched') return (recentById.get(right.id) ?? 0) - (recentById.get(left.id) ?? 0) || left.title.localeCompare(right.title)
    if (sortMode === 'size') return right.size - left.size || left.title.localeCompare(right.title)
    return left.title.localeCompare(right.title)
  })
}

export function selectRecommendations(items: readonly DetectedMedia[], favorites: readonly MediaFavorite[], recent: readonly MediaRecentEntry[]) {
  const seen = new Set(recent.map((entry) => entry.mediaId))
  const favoriteIds = new Set(favorites.map((entry) => entry.mediaId))
  return [...items].sort((left, right) => Number(favoriteIds.has(right.id)) - Number(favoriteIds.has(left.id)) || Number(!seen.has(right.id)) - Number(!seen.has(left.id)) || right.dateAdded - left.dateAdded).slice(0, 8)
}
