import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

import type { WatchConnectorConnection, WatchConnectorId, WatchSyncConflict, WatchSyncHistoryEntry, WatchSyncPreference } from '../../../src/features/watch-connectors/connector.types.js'

export interface WatchSyncSnapshot { connections: Partial<Record<WatchConnectorId, WatchConnectorConnection>>; conflicts: WatchSyncConflict[]; history: WatchSyncHistoryEntry[]; preferences: Partial<Record<WatchConnectorId, WatchSyncPreference>>; version: 1 }
const emptySnapshot = (): WatchSyncSnapshot => ({ connections: {}, conflicts: [], history: [], preferences: {}, version: 1 })
export interface WatchSyncRepository { read(): Promise<WatchSyncSnapshot>; update(mutator: (snapshot: WatchSyncSnapshot) => void): Promise<WatchSyncSnapshot> }

export class JsonWatchSyncRepository implements WatchSyncRepository {
    readonly #filePath: string; #snapshot: WatchSyncSnapshot | null = null; #saveQueue: Promise<void> = Promise.resolve()
    constructor(filePath: string) { this.#filePath = filePath }
    async read() { return structuredClone(await this.#load()) }
    async update(mutator: (snapshot: WatchSyncSnapshot) => void) { const snapshot = await this.#load(); mutator(snapshot); await this.#save(snapshot); return structuredClone(snapshot) }
    async #load() { if (this.#snapshot) return this.#snapshot; try { const parsed: unknown = JSON.parse(await readFile(this.#filePath, 'utf8')); if (!parsed || typeof parsed !== 'object') throw new Error('Invalid connector state.'); const value = parsed as Partial<WatchSyncSnapshot>; this.#snapshot = { connections: value.connections ?? {}, conflicts: Array.isArray(value.conflicts) ? value.conflicts : [], history: Array.isArray(value.history) ? value.history : [], preferences: value.preferences ?? {}, version: 1 } } catch { this.#snapshot = emptySnapshot() } return this.#snapshot }
    #save(snapshot: WatchSyncSnapshot) { const serialized = JSON.stringify(snapshot, null, 2); this.#saveQueue = this.#saveQueue.then(async () => { await mkdir(path.dirname(this.#filePath), { recursive: true }); const temporary = `${this.#filePath}.tmp`; await writeFile(temporary, serialized, 'utf8'); try { await rename(temporary, this.#filePath) } catch { await rm(this.#filePath, { force: true }); await rename(temporary, this.#filePath) } }); return this.#saveQueue }
}
