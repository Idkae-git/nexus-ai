import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

import type { MediaFavorite, MediaId, MediaProgressEntry, MediaRecentEntry } from '../../../src/features/media/media.types.js'

interface MediaHistorySnapshot {
    favorites: MediaFavorite[]
    progress: MediaProgressEntry[]
    recent: MediaRecentEntry[]
}

export interface MediaHistory {
    favorites(): Promise<MediaFavorite[]>
    progress(): Promise<MediaProgressEntry[]>
    recent(limit?: number): Promise<MediaRecentEntry[]>
    recordRecent(entry: MediaRecentEntry): Promise<void>
    setFavorite(mediaId: MediaId, favorite: boolean): Promise<MediaFavorite[]>
    setProgress(entry: MediaProgressEntry): Promise<MediaProgressEntry[]>
}

export class MediaHistoryStore implements MediaHistory {
    readonly #filePath: string
    #snapshot: MediaHistorySnapshot | null = null
    #saveQueue: Promise<void> = Promise.resolve()

    constructor(filePath: string) { this.#filePath = filePath }
    async favorites() { return [...(await this.#load()).favorites] }
    async progress() { return [...(await this.#load()).progress] }
    async recent(limit = 50) { return (await this.#load()).recent.slice(0, Math.max(0, limit)) }

    async setFavorite(mediaId: MediaId, favorite: boolean) {
        const snapshot = await this.#load()
        const exists = snapshot.favorites.some((entry) => entry.mediaId === mediaId)
        if (favorite && !exists) snapshot.favorites.push({ createdAt: Date.now(), mediaId, order: snapshot.favorites.length })
        if (!favorite && exists) snapshot.favorites = snapshot.favorites.filter((entry) => entry.mediaId !== mediaId)
        snapshot.favorites = snapshot.favorites.map((entry, order) => ({ ...entry, order }))
        await this.#save(snapshot)
        return [...snapshot.favorites]
    }

    async recordRecent(entry: MediaRecentEntry) {
        const snapshot = await this.#load()
        snapshot.recent = [entry, ...snapshot.recent.filter((candidate) => candidate.mediaId !== entry.mediaId)].slice(0, 100)
        await this.#save(snapshot)
    }

    async setProgress(entry: MediaProgressEntry) {
        const snapshot = await this.#load()
        snapshot.progress = [entry, ...snapshot.progress.filter((candidate) => candidate.mediaId !== entry.mediaId)].slice(0, 200)
        await this.#save(snapshot)
        return [...snapshot.progress]
    }

    async #load() {
        if (this.#snapshot) return this.#snapshot
        try {
            const parsed: unknown = JSON.parse(await readFile(this.#filePath, 'utf8'))
            if (!parsed || typeof parsed !== 'object') throw new Error('Invalid media history.')
            const value = parsed as Partial<MediaHistorySnapshot>
            this.#snapshot = { favorites: Array.isArray(value.favorites) ? value.favorites : [], progress: Array.isArray(value.progress) ? value.progress : [], recent: Array.isArray(value.recent) ? value.recent : [] }
        } catch { this.#snapshot = { favorites: [], progress: [], recent: [] } }
        return this.#snapshot
    }

    #save(snapshot: MediaHistorySnapshot) {
        const serialized = JSON.stringify(snapshot, null, 2)
        this.#saveQueue = this.#saveQueue.then(async () => {
            await mkdir(path.dirname(this.#filePath), { recursive: true })
            const temporaryPath = `${this.#filePath}.tmp`
            await writeFile(temporaryPath, serialized, 'utf8')
            try { await rename(temporaryPath, this.#filePath) }
            catch { await rm(this.#filePath, { force: true }); await rename(temporaryPath, this.#filePath) }
        })
        return this.#saveQueue
    }
}
