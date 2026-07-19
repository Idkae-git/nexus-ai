import type { GameLibraryFilter, GameLibrarySortMode, GameProviderId } from './gaming.types.ts'

export const GAMING_FILTERS: readonly { id: GameLibraryFilter; label: string }[] = [
  { id: 'all', label: 'All carts' },
  { id: 'installed', label: 'Installed' },
  { id: 'running', label: 'Active' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'steam', label: 'Steam' },
  { id: 'epic', label: 'Epic' },
  { id: 'ubisoft', label: 'Ubisoft' },
  { id: 'battlenet', label: 'Battle.net' },
  { id: 'riot', label: 'Riot' },
]

export const GAMING_SORTS: readonly { id: GameLibrarySortMode; label: string }[] = [
  { id: 'alphabetical', label: 'A–Z' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recent' },
  { id: 'provider', label: 'Provider' },
  { id: 'running', label: 'Active' },
  { id: 'updated', label: 'Updated' },
]

export const PROVIDER_LABELS: Readonly<Record<GameProviderId, string>> = {
  battlenet: 'Battle.net',
  epic: 'Epic Games',
  riot: 'Riot Games',
  steam: 'Steam',
  ubisoft: 'Ubisoft',
}
