import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

import type { MediaIdentity, WatchConflict, WatchEntry, WatchImport } from '../../../src/features/watch-tracking/watch.types.js'

export interface WatchPreference { key: string; value: string | number | boolean }
export interface WatchHistorySnapshot { conflicts: WatchConflict[]; entries: WatchEntry[]; identities: MediaIdentity[]; imports: WatchImport[]; preferences: WatchPreference[]; version: 1 }

const emptySnapshot = (): WatchHistorySnapshot => ({ conflicts: [], entries: [], identities: [], imports: [], preferences: [], version: 1 })

export interface WatchHistoryRepository {
    read(): Promise<WatchHistorySnapshot>
    update(mutator: (snapshot: WatchHistorySnapshot) => void): Promise<WatchHistorySnapshot>
}

export class JsonWatchHistoryRepository implements WatchHistoryRepository {
    readonly #filePath: string
    #snapshot: WatchHistorySnapshot | null = null
    #saveQueue: Promise<void> = Promise.resolve()
    constructor(filePath: string) { this.#filePath = filePath }

    async read() { const snapshot = await this.#load(); return structuredClone(snapshot) }
    async update(mutator: (snapshot: WatchHistorySnapshot) => void) {
        const snapshot = await this.#load()
        mutator(snapshot)
        await this.#save(snapshot)
        return structuredClone(snapshot)
    }

    async #load() {
        if (this.#snapshot) return this.#snapshot
        try {
            const parsed: unknown = JSON.parse(await readFile(this.#filePath, 'utf8'))
            if (!parsed || typeof parsed !== 'object') throw new Error('Invalid watch history.')
            const value = parsed as Partial<WatchHistorySnapshot>
            this.#snapshot = { conflicts: Array.isArray(value.conflicts) ? value.conflicts : [], entries: Array.isArray(value.entries) ? value.entries : [], identities: Array.isArray(value.identities) ? value.identities : [], imports: Array.isArray(value.imports) ? value.imports : [], preferences: Array.isArray(value.preferences) ? value.preferences : [], version: 1 }
        } catch { this.#snapshot = emptySnapshot() }
        return this.#snapshot
    }

    #save(snapshot: WatchHistorySnapshot) {
        const serialized = JSON.stringify(snapshot, null, 2)
        this.#saveQueue = this.#saveQueue.then(async () => {
            await mkdir(path.dirname(this.#filePath), { recursive: true })
            const temporary = `${this.#filePath}.tmp`
            await writeFile(temporary, serialized, 'utf8')
            try { await rename(temporary, this.#filePath) } catch { await rm(this.#filePath, { force: true }); await rename(temporary, this.#filePath) }
        })
        return this.#saveQueue
    }
}
