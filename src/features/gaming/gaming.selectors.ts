import type { DetectedGame, GameFavorite, GameLibraryFilter, GameLibrarySortMode } from './gaming.types.ts'

export function selectVisibleGames(
  games: readonly DetectedGame[],
  favorites: readonly GameFavorite[],
  query: string,
  filter: GameLibraryFilter,
  sortMode: GameLibrarySortMode,
) {
  const favoriteIds = new Set(favorites.map((favorite) => favorite.gameId))
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visible = games.filter((game) => {
    const matchesQuery = !normalizedQuery || [game.title, game.provider, game.launcherId, ...game.tags]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery))
    if (!matchesQuery) return false
    if (filter === 'all') return true
    if (filter === 'installed') return game.installStatus === 'installed'
    if (filter === 'running') return game.runtimeStatus === 'running'
    if (filter === 'favorites') return favoriteIds.has(game.id)
    return game.provider === filter
  })

  return [...visible].sort((left, right) => {
    if (sortMode === 'favorites') return Number(favoriteIds.has(right.id)) - Number(favoriteIds.has(left.id)) || left.title.localeCompare(right.title)
    if (sortMode === 'recent') return (right.lastLaunchedAt ?? 0) - (left.lastLaunchedAt ?? 0) || left.title.localeCompare(right.title)
    if (sortMode === 'provider') return left.provider.localeCompare(right.provider) || left.title.localeCompare(right.title)
    if (sortMode === 'running') return Number(right.runtimeStatus === 'running') - Number(left.runtimeStatus === 'running') || left.title.localeCompare(right.title)
    if (sortMode === 'updated') return (right.lastUpdatedAt ?? 0) - (left.lastUpdatedAt ?? 0) || left.title.localeCompare(right.title)
    return left.title.localeCompare(right.title)
  })
}
