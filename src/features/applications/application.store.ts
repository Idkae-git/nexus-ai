import { create } from 'zustand'

import { APPLICATION_FAVORITES_STORAGE_KEY } from './application.constants.ts'
import { applicationService } from './application.service.ts'
import type {
  ApplicationActionState,
  ApplicationFavorite,
  ApplicationId,
  ApplicationRecentEntry,
  ApplicationSearchFilter,
  ApplicationSortMode,
  DetectedApplication,
} from './application.types.ts'

interface ApplicationStoreState {
  actionById: Partial<Record<ApplicationId, ApplicationActionState>>
  applications: DetectedApplication[]
  closeApplication: (applicationId: ApplicationId) => Promise<void>
  error: string | null
  favorites: ApplicationFavorite[]
  filter: ApplicationSearchFilter
  isLoading: boolean
  isScanning: boolean
  launchApplication: (applicationId: ApplicationId) => Promise<void>
  recent: ApplicationRecentEntry[]
  refreshApplications: () => Promise<void>
  refreshRuntimeStatus: () => Promise<void>
  scanApplications: () => Promise<void>
  searchQuery: string
  selectedApplicationId: ApplicationId | null
  setFilter: (filter: ApplicationSearchFilter) => void
  setSearchQuery: (query: string) => void
  setSelectedApplication: (applicationId: ApplicationId | null) => void
  setSortMode: (sortMode: ApplicationSortMode) => void
  sortMode: ApplicationSortMode
  toggleFavorite: (applicationId: ApplicationId) => void
}

function loadFavorites(): ApplicationFavorite[] {
  try {
    const stored = window.localStorage.getItem(APPLICATION_FAVORITES_STORAGE_KEY)
    if (!stored) return []
    const value: unknown = JSON.parse(stored)
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is ApplicationFavorite => (
      typeof entry === 'object'
      && entry !== null
      && typeof entry.applicationId === 'string'
      && typeof entry.createdAt === 'number'
      && typeof entry.order === 'number'
    ))
  } catch {
    return []
  }
}

function saveFavorites(favorites: readonly ApplicationFavorite[]) {
  try {
    window.localStorage.setItem(APPLICATION_FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  } catch {
    // The in-memory favorite state remains usable when storage is unavailable.
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected application error occurred.'
}

export const useApplicationStore = create<ApplicationStoreState>((set, get) => ({
  actionById: {},
  applications: [],
  error: null,
  favorites: loadFavorites(),
  filter: 'all',
  isLoading: false,
  isScanning: false,
  recent: [],
  searchQuery: '',
  selectedApplicationId: null,
  sortMode: 'favorites',

  async scanApplications() {
    set({ error: null, isScanning: true })
    try {
      const scan = await applicationService.scan()
      const recent = await applicationService.recent()
      set((state) => ({
        applications: scan.applications,
        recent,
        selectedApplicationId: state.selectedApplicationId ?? scan.applications[0]?.id ?? null,
      }))
    } catch (error) {
      set({ error: errorMessage(error) })
    } finally {
      set({ isScanning: false })
    }
  },

  async refreshApplications() {
    set({ error: null, isLoading: true })
    try {
      const [applications, recent] = await Promise.all([
        applicationService.list(),
        applicationService.recent(),
      ])
      set((state) => ({
        applications,
        recent,
        selectedApplicationId: state.selectedApplicationId ?? applications[0]?.id ?? null,
      }))
    } catch (error) {
      set({ error: errorMessage(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  async refreshRuntimeStatus() {
    try {
      const statuses = await applicationService.refreshRuntimeStatus()
      const byId = new Map(statuses.map((status) => [status.applicationId, status.runtimeStatus]))
      set((state) => ({
        applications: state.applications.map((application) => ({
          ...application,
          runtimeStatus: byId.get(application.id) ?? application.runtimeStatus,
        })),
      }))
    } catch (error) {
      set({ error: errorMessage(error) })
    }
  },

  async launchApplication(applicationId) {
    set((state) => ({ actionById: { ...state.actionById, [applicationId]: 'launching' }, error: null }))
    try {
      await applicationService.launch(applicationId)
      await get().refreshApplications()
      await get().refreshRuntimeStatus()
    } catch (error) {
      set((state) => ({
        actionById: { ...state.actionById, [applicationId]: 'error' },
        error: errorMessage(error),
      }))
      return
    }
    set((state) => ({ actionById: { ...state.actionById, [applicationId]: 'idle' } }))
  },

  async closeApplication(applicationId) {
    set((state) => ({ actionById: { ...state.actionById, [applicationId]: 'closing' }, error: null }))
    try {
      await applicationService.close(applicationId)
      await get().refreshRuntimeStatus()
    } catch (error) {
      set((state) => ({
        actionById: { ...state.actionById, [applicationId]: 'error' },
        error: errorMessage(error),
      }))
      return
    }
    set((state) => ({ actionById: { ...state.actionById, [applicationId]: 'idle' } }))
  },

  toggleFavorite(applicationId) {
    const current = get().favorites
    const existing = current.find((favorite) => favorite.applicationId === applicationId)
    const favorites = existing
      ? current.filter((favorite) => favorite.applicationId !== applicationId)
      : [...current, { applicationId, createdAt: Date.now(), order: current.length }]
        .map((favorite, order) => ({ ...favorite, order }))
    saveFavorites(favorites)
    set({ favorites })
  },

  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedApplication: (selectedApplicationId) => set({ selectedApplicationId }),
  setSortMode: (sortMode) => set({ sortMode }),
}))
