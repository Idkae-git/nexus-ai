import { create } from 'zustand'

import { mediaService } from './media.service.ts'
import type {
  DetectedMedia, MediaFavorite, MediaFilter, MediaFolder, MediaId, MediaPlayerStatus,
  MediaProgressEntry, MediaRecentEntry, MediaScanSummary, MediaSortMode,
} from './media.types.ts'

interface MediaStoreState {
  addFolders: () => Promise<void>
  clearError: () => void
  error: string | null
  favorites: MediaFavorite[]
  filter: MediaFilter
  folders: MediaFolder[]
  items: DetectedMedia[]
  load: () => Promise<void>
  playingMediaId: MediaId | null
  playerStatus: MediaPlayerStatus | null
  playMedia: (mediaId: MediaId) => Promise<void>
  progress: MediaProgressEntry[]
  recent: MediaRecentEntry[]
  removeFolder: (folderId: string) => Promise<void>
  scan: () => Promise<void>
  scanning: boolean
  scanSummary: MediaScanSummary | null
  searchQuery: string
  selectedMediaId: MediaId | null
  selectMedia: (mediaId: MediaId | null) => void
  setFilter: (filter: MediaFilter) => void
  setSearchQuery: (query: string) => void
  setSortMode: (sortMode: MediaSortMode) => void
  sortMode: MediaSortMode
  toggleFavorite: (mediaId: MediaId) => Promise<void>
}

function message(error: unknown) { return error instanceof Error ? error.message : 'Une erreur Media Center inattendue est survenue.' }

async function supportingData() {
  const [folders, favorites, recent, progress, playerStatus] = await Promise.all([
    mediaService.folders(), mediaService.favorites(), mediaService.recent(), mediaService.progress(), mediaService.playerStatus(),
  ])
  return { favorites, folders, playerStatus, progress, recent }
}

export const useMediaStore = create<MediaStoreState>((set, get) => ({
  clearError: () => set({ error: null }),
  error: null,
  favorites: [],
  filter: 'all',
  folders: [],
  items: [],
  playingMediaId: null,
  playerStatus: null,
  progress: [],
  recent: [],
  scanning: false,
  scanSummary: null,
  searchQuery: '',
  selectedMediaId: null,
  sortMode: 'recently-added',

  async load() {
    set({ error: null })
    try {
      const [items, extra] = await Promise.all([mediaService.items(), supportingData()])
      set((state) => ({ ...extra, items, selectedMediaId: state.selectedMediaId ?? items[0]?.id ?? null }))
    } catch (error) { set({ error: message(error) }) }
  },

  async scan() {
    set({ error: null, scanning: true })
    try {
      const result = await mediaService.scan()
      set((state) => ({ items: result.items, scanSummary: result.summary, selectedMediaId: state.selectedMediaId ?? result.items[0]?.id ?? null }))
    } catch (error) { set({ error: message(error) }) }
    finally { set({ scanning: false }) }
  },

  async addFolders() {
    try { set({ folders: await mediaService.chooseFolders() }); await get().scan() }
    catch (error) { set({ error: message(error) }) }
  },

  async removeFolder(folderId) {
    try { set({ folders: await mediaService.removeFolder(folderId) }); await get().scan() }
    catch (error) { set({ error: message(error) }) }
  },

  async playMedia(mediaId) {
    set({ error: null, playingMediaId: mediaId })
    try {
      const result = await mediaService.play(mediaId)
      if (!result.success) set({ error: result.error })
      set({ recent: await mediaService.recent() })
    } catch (error) { set({ error: message(error) }) }
    finally { set({ playingMediaId: null }) }
  },

  async toggleFavorite(mediaId) {
    const favorite = !get().favorites.some((entry) => entry.mediaId === mediaId)
    try { set({ favorites: await mediaService.setFavorite(mediaId, favorite) }) }
    catch (error) { set({ error: message(error) }) }
  },

  selectMedia: (selectedMediaId) => set({ selectedMediaId }),
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortMode: (sortMode) => set({ sortMode }),
}))
