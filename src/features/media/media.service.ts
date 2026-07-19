import type { NexusCommandRequest } from '../../core/commands/command.types.js'
import type {
  DetectedMedia, MediaFavorite, MediaFolder, MediaId, MediaPlayResult, MediaPlayerStatus,
  MediaProgressEntry, MediaRecentEntry, MediaScanResult,
} from './media.types.ts'

function request<TPayload>(command: string, payload: TPayload): NexusCommandRequest<TPayload> {
  return { command, createdAt: Date.now(), id: crypto.randomUUID(), payload, source: 'ui', target: { type: 'local' } }
}

async function execute<TPayload, TResult>(command: string, payload: TPayload) {
  if (!window.nexus) throw new Error('The NEXUS command gateway is unavailable.')
  const result = await window.nexus.execute<TPayload, TResult>(request(command, payload))
  if (result.status !== 'success' || result.data === undefined) throw new Error(result.error ?? `${command} failed.`)
  return result.data
}

export const mediaService = {
  chooseFolders: () => execute<void, MediaFolder[]>('media.folders.choose', undefined),
  favorites: () => execute<void, MediaFavorite[]>('media.favorites.list', undefined),
  folders: () => execute<void, MediaFolder[]>('media.folders.list', undefined),
  items: () => execute<void, DetectedMedia[]>('media.library.list', undefined),
  play: (mediaId: MediaId) => execute<{ mediaId: MediaId }, MediaPlayResult>('media.item.play', { mediaId }),
  playerStatus: () => execute<void, MediaPlayerStatus>('media.players.status', undefined),
  progress: () => execute<void, MediaProgressEntry[]>('media.progress.list', undefined),
  recent: () => execute<void, MediaRecentEntry[]>('media.recent.list', undefined),
  removeFolder: (folderId: string) => execute<{ folderId: string }, MediaFolder[]>('media.folders.remove', { folderId }),
  scan: () => execute<void, MediaScanResult>('media.library.scan', undefined),
  setFavorite: (mediaId: MediaId, favorite: boolean) => execute<{ favorite: boolean; mediaId: MediaId }, MediaFavorite[]>('media.favorites.set', { favorite, mediaId }),
}
