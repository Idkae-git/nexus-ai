import { create } from 'zustand'

import { gamingService } from './gaming.service.ts'
import type {
  DetectedGame,
  DetectedLauncher,
  GameFavorite,
  GameId,
  GameLibraryFilter,
  GameLibraryScanSummary,
  GameLibrarySortMode,
  GameRecentEntry,
  GameSession,
  LauncherId,
} from './gaming.types.ts'

interface GamingStoreState {
  activeSession: GameSession | null
  clearError: () => void
  closeGame: (gameId: GameId) => Promise<void>
  closingGameId: GameId | null
  error: string | null
  favorites: GameFavorite[]
  filter: GameLibraryFilter
  games: DetectedGame[]
  launchers: DetectedLauncher[]
  launchGame: (gameId: GameId) => Promise<void>
  launchingGameId: GameId | null
  load: () => Promise<void>
  openLauncher: (launcherId: LauncherId) => Promise<void>
  providerErrors: GameLibraryScanSummary['providerErrors']
  recentGames: GameRecentEntry[]
  refreshStatuses: () => Promise<void>
  scanLibrary: () => Promise<void>
  scanSummary: GameLibraryScanSummary | null
  scanning: boolean
  searchQuery: string
  selectedGameId: GameId | null
  sessions: GameSession[]
  setFilter: (filter: GameLibraryFilter) => void
  setSearchQuery: (query: string) => void
  setSortMode: (sortMode: GameLibrarySortMode) => void
  selectGame: (gameId: GameId | null) => void
  sortMode: GameLibrarySortMode
  stopTracking: (sessionId: string) => Promise<void>
  toggleFavorite: (gameId: GameId) => Promise<void>
}

function message(error: unknown) { return error instanceof Error ? error.message : 'An unexpected Gaming Hub error occurred.' }

async function companionData() {
  const [favorites, recentGames, sessions, activeSessions] = await Promise.all([
    gamingService.favorites(), gamingService.recent(), gamingService.sessions(), gamingService.activeSessions(),
  ])
  return { activeSession: activeSessions[0] ?? null, favorites, recentGames, sessions }
}

export const useGamingStore = create<GamingStoreState>((set, get) => ({
  activeSession: null,
  clearError: () => set({ error: null }),
  closingGameId: null,
  error: null,
  favorites: [],
  filter: 'all',
  games: [],
  launchers: [],
  launchingGameId: null,
  providerErrors: [],
  recentGames: [],
  scanSummary: null,
  scanning: false,
  searchQuery: '',
  selectedGameId: null,
  sessions: [],
  sortMode: 'favorites',

  async load() {
    set({ error: null })
    try {
      const [games, launchers, extra] = await Promise.all([gamingService.listGames(), gamingService.listLaunchers(), companionData()])
      set((state) => ({ ...extra, games, launchers, selectedGameId: state.selectedGameId ?? games[0]?.id ?? null }))
    } catch (error) { set({ error: message(error) }) }
  },

  async scanLibrary() {
    set({ error: null, scanning: true })
    try {
      const [scan, extra] = await Promise.all([gamingService.scanLibrary(), companionData()])
      set((state) => ({ ...extra, games: scan.games, launchers: scan.launchers, providerErrors: scan.summary.providerErrors, scanSummary: scan.summary, selectedGameId: state.selectedGameId ?? scan.games[0]?.id ?? null }))
    } catch (error) { set({ error: message(error) }) }
    finally { set({ scanning: false }) }
  },

  async refreshStatuses() {
    try {
      const [statuses, launchers, activeSessions, sessions] = await Promise.all([
        gamingService.refreshGameStatuses(), gamingService.refreshLauncherStatuses(), gamingService.activeSessions(), gamingService.sessions(),
      ])
      const byId = new Map(statuses.map((status) => [status.gameId, status.runtimeStatus]))
      set((state) => ({ activeSession: activeSessions[0] ?? null, games: state.games.map((game) => ({ ...game, runtimeStatus: byId.get(game.id) ?? game.runtimeStatus })), launchers, sessions }))
    } catch (error) { set({ error: message(error) }) }
  },

  async launchGame(gameId) {
    set({ error: null, launchingGameId: gameId })
    try { await gamingService.launchGame(gameId); await get().load() }
    catch (error) { set({ error: message(error) }) }
    finally { set({ launchingGameId: null }) }
  },

  async closeGame(gameId) {
    set({ closingGameId: gameId, error: null })
    try { await gamingService.closeGame(gameId); await get().refreshStatuses() }
    catch (error) { set({ error: message(error) }) }
    finally { set({ closingGameId: null }) }
  },

  async toggleFavorite(gameId) {
    const favorite = !get().favorites.some((entry) => entry.gameId === gameId)
    try { set({ favorites: await gamingService.setFavorite(gameId, favorite) }) }
    catch (error) { set({ error: message(error) }) }
  },

  async openLauncher(launcherId) {
    try { await gamingService.openLauncher(launcherId) }
    catch (error) { set({ error: message(error) }) }
  },

  async stopTracking(sessionId) {
    try { await gamingService.stopTracking(sessionId); await get().load() }
    catch (error) { set({ error: message(error) }) }
  },

  selectGame: (selectedGameId) => set({ selectedGameId }),
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortMode: (sortMode) => set({ sortMode }),
}))
