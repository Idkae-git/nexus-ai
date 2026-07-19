import type {
  ApplicationFavorite,
  ApplicationSearchFilter,
  ApplicationSortMode,
  DetectedApplication,
} from './application.types.ts'

export interface ApplicationSelectionOptions {
  favorites: readonly ApplicationFavorite[]
  filter: ApplicationSearchFilter
  query: string
  sortMode: ApplicationSortMode
}
function favoriteOrder(favorites: readonly ApplicationFavorite[], applicationId: string) {
  return favorites.find((favorite) => favorite.applicationId === applicationId)?.order ?? Number.MAX_SAFE_INTEGER
}

export function isFavorite(favorites: readonly ApplicationFavorite[], applicationId: string) {
  return favorites.some((favorite) => favorite.applicationId === applicationId)
}

export function selectApplications(
  applications: readonly DetectedApplication[],
  options: ApplicationSelectionOptions,
) {
  const normalizedQuery = options.query.trim().toLocaleLowerCase()
  const result = applications.filter((application) => {
    const matchesQuery = !normalizedQuery || [
      application.name,
      application.publisher,
      application.category,
      application.description,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery))

    if (!matchesQuery) return false
    switch (options.filter) {
      case 'installed': return application.installStatus === 'installed'
      case 'running': return application.runtimeStatus === 'running'
      case 'favorites': return isFavorite(options.favorites, application.id)
      case 'not-installed': return application.installStatus === 'not-installed'
      case 'all': return true
    }
  })

  return result.toSorted((left, right) => {
    switch (options.sortMode) {
      case 'favorites': {
        const order = favoriteOrder(options.favorites, left.id) - favoriteOrder(options.favorites, right.id)
        return order || left.name.localeCompare(right.name)
      }
      case 'recent': return (right.lastLaunchedAt ?? 0) - (left.lastLaunchedAt ?? 0) || left.name.localeCompare(right.name)
      case 'running': return Number(right.runtimeStatus === 'running') - Number(left.runtimeStatus === 'running') || left.name.localeCompare(right.name)
      case 'installation': return Number(right.installStatus === 'installed') - Number(left.installStatus === 'installed') || left.name.localeCompare(right.name)
      case 'name': return left.name.localeCompare(right.name)
    }
  })
}

export function selectFavoriteApplications(
  applications: readonly DetectedApplication[],
  favorites: readonly ApplicationFavorite[],
) {
  return applications
    .filter((application) => isFavorite(favorites, application.id))
    .toSorted((left, right) => favoriteOrder(favorites, left.id) - favoriteOrder(favorites, right.id))
}

export function selectRunningApplications(applications: readonly DetectedApplication[]) {
  return applications.filter((application) => application.runtimeStatus === 'running')
}
