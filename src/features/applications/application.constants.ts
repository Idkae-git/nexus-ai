import type { ApplicationSearchFilter, ApplicationSortMode } from './application.types.ts'

export const APPLICATION_FAVORITES_STORAGE_KEY = 'nexus.application-favorites.v1'
export const APPLICATION_RUNTIME_REFRESH_MS = 12_000

export const applicationFilters: readonly ApplicationSearchFilter[] = [
  'all',
  'installed',
  'running',
  'favorites',
  'not-installed',
]
export const applicationSortModes: readonly ApplicationSortMode[] = [
  'favorites',
  'recent',
  'running',
  'installation',
  'name',
]
