import type {
    MediaFavorite,
    MediaId,
    MediaProgressEntry,
} from '../../../src/features/media/media.types.js'
import type { MediaFolderRepository } from './media-folder-store.js'
import type { MediaHistory } from './media-history.js'
import type { MediaLibrary } from './media-library.js'
import type { MediaPlayer } from './media-player.js'
import type { DetectedMedia } from '../../../src/features/media/media.types.js'

export type MediaFolderChooser = () => Promise<string[]>
export interface MediaWatchTracker {
    recordLocalProgress(item: DetectedMedia, positionSeconds: number, durationSeconds: number | null): Promise<unknown>
    recordVlcLaunch(item: DetectedMedia): Promise<unknown>
}

export class MediaManager {
    readonly #chooseFolders: MediaFolderChooser
    readonly #folders: MediaFolderRepository
    readonly #history: MediaHistory
    readonly #library: MediaLibrary
    readonly #player: MediaPlayer
    readonly #watchTracker: MediaWatchTracker | null
    #scanned = false

    constructor(options: {
        chooseFolders: MediaFolderChooser
        folders: MediaFolderRepository
        history: MediaHistory
        library: MediaLibrary
        player: MediaPlayer
        watchTracker?: MediaWatchTracker
    }) {
        this.#chooseFolders = options.chooseFolders
        this.#folders = options.folders
        this.#history = options.history
        this.#library = options.library
        this.#player = options.player
        this.#watchTracker = options.watchTracker ?? null
    }

    folders() { return this.#folders.list() }

    async chooseFolders() {
        const selected = await this.#chooseFolders()
        for (const folderPath of selected) await this.#folders.add(folderPath)
        return this.#folders.list()
    }

    async removeFolder(folderId: string) {
        const folders = await this.#folders.remove(folderId)
        await this.scan()
        return folders
    }

    async scan() {
        const result = await this.#library.scan()
        this.#scanned = true
        return result
    }

    async list() {
        if (!this.#scanned) await this.scan()
        return this.#library.list()
    }

    async get(mediaId: MediaId) {
        const item = (await this.list()).find((candidate) => candidate.id === mediaId)
        if (!item) throw new Error(`Média inconnu ou non détecté : "${mediaId}".`)
        return item
    }

    async play(mediaId: MediaId) {
        const item = await this.get(mediaId)
        const result = await this.#player.play(item)
        await this.#history.recordRecent({ mediaId, player: result.player, success: result.success, timestamp: 'launchedAt' in result ? result.launchedAt : Date.now() })
        if (result.success && result.player === 'vlc') await this.#watchTracker?.recordVlcLaunch(item)
        return result
    }

    async setFavorite(mediaId: MediaId, favorite: boolean): Promise<MediaFavorite[]> {
        await this.get(mediaId)
        return this.#history.setFavorite(mediaId, favorite)
    }

    async setProgress(mediaId: MediaId, positionMs: number, durationMs: number | null): Promise<MediaProgressEntry[]> {
        await this.get(mediaId)
        if (durationMs !== null && positionMs > durationMs) throw new Error('La position ne peut pas dépasser la durée du média.')
        const progress = await this.#history.setProgress({ completed: durationMs !== null && durationMs > 0 && positionMs / durationMs >= 0.9, durationMs, mediaId, positionMs, updatedAt: Date.now() })
        await this.#watchTracker?.recordLocalProgress(await this.get(mediaId), positionMs / 1_000, durationMs === null ? null : durationMs / 1_000)
        return progress
    }

    favorites() { return this.#history.favorites() }
    recent(limit?: number) { return this.#history.recent(limit) }
    progress() { return this.#history.progress() }
    playerStatus() { return this.#player.status() }
}
