import type { NexusCommandRequest } from '../../core/commands/command.types.js'
import type {
  DetectedGame,
  DetectedLauncher,
  GameCloseResult,
  GameFavorite,
  GameId,
  GameLaunchResult,
  GameLibraryScanResult,
  GameRecentEntry,
  GameRuntimeResult,
  GameSession,
  LauncherId,
  LauncherOpenResult,
} from './gaming.types.ts'

function request<TPayload>(command: string, payload: TPayload): NexusCommandRequest<TPayload> {
  return { command, createdAt: Date.now(), id: crypto.randomUUID(), payload, source: 'ui', target: { type: 'local' } }
}

async function execute<TPayload, TResult>(command: string, payload: TPayload) {
  if (!window.nexus) throw new Error('The NEXUS command gateway is unavailable.')
  const result = await window.nexus.execute<TPayload, TResult>(request(command, payload))
  if (result.status !== 'success' || result.data === undefined) throw new Error(result.error ?? `${command} failed.`)
  return result.data
}

export const gamingService = {
  activeSessions: () => execute<void, GameSession[]>('gaming.sessions.active', undefined),
  closeGame: (gameId: GameId) => execute<{ gameId: GameId }, GameCloseResult>('gaming.game.close', { gameId }),
  favorites: () => execute<void, GameFavorite[]>('gaming.favorites.list', undefined),
  launchGame: (gameId: GameId) => execute<{ gameId: GameId }, GameLaunchResult>('gaming.game.launch', { gameId }),
  listGames: () => execute<void, DetectedGame[]>('gaming.library.list', undefined),
  listLaunchers: () => execute<void, DetectedLauncher[]>('gaming.launchers.list', undefined),
  openLauncher: (launcherId: LauncherId) => execute<{ launcherId: LauncherId }, LauncherOpenResult>('gaming.launcher.open', { launcherId }),
  recent: () => execute<void, GameRecentEntry[]>('gaming.recent.list', undefined),
  refreshGameStatuses: () => execute<void, GameRuntimeResult[]>('gaming.game.refresh-status', undefined),
  refreshLauncherStatuses: () => execute<void, DetectedLauncher[]>('gaming.launchers.refresh-status', undefined),
  scanLibrary: () => execute<void, GameLibraryScanResult>('gaming.library.scan', undefined),
  sessions: () => execute<void, GameSession[]>('gaming.sessions.list', undefined),
  setFavorite: (gameId: GameId, favorite: boolean) => execute<{ favorite: boolean; gameId: GameId }, GameFavorite[]>('gaming.favorites.set', { favorite, gameId }),
  stopTracking: (sessionId: string) => execute<{ sessionId: string }, GameSession>('gaming.sessions.stop-tracking', { sessionId }),
}
