import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

import type { GameFavorite, GameId, GameRecentEntry, GameSession } from '../../../../src/features/gaming/gaming.types.js'

interface GameUsage {
    lastLaunchedAt: number | null
    launchCount: number
}

interface GamingSnapshot {
    favorites: GameFavorite[]
    recent: GameRecentEntry[]
    sessions: GameSession[]
    usage: Partial<Record<GameId, GameUsage>>
}

export interface GameHistory {
    favorites(): Promise<GameFavorite[]>
    recent(limit?: number): Promise<GameRecentEntry[]>
    recordLaunch(entry: GameRecentEntry): Promise<void>
    saveSession(session: GameSession): Promise<void>
    sessions(limit?: number): Promise<GameSession[]>
    setFavorite(gameId: GameId, favorite: boolean): Promise<GameFavorite[]>
    usage(gameId: GameId): Promise<GameUsage>
}

const emptySnapshot = (): GamingSnapshot => ({ favorites: [], recent: [], sessions: [], usage: {} })

export class GameHistoryStore implements GameHistory {
    readonly #filePath: string
    #snapshot: GamingSnapshot | null = null
    #saveQueue: Promise<void> = Promise.resolve()

    constructor(filePath: string) {
        this.#filePath = filePath
    }

    async favorites() { return [...(await this.#load()).favorites] }
    async recent(limit = 50) { return (await this.#load()).recent.slice(0, Math.max(0, limit)) }
    async sessions(limit = 50) { return (await this.#load()).sessions.slice(0, Math.max(0, limit)) }
    async usage(gameId: GameId) { return (await this.#load()).usage[gameId] ?? { lastLaunchedAt: null, launchCount: 0 } }

    async setFavorite(gameId: GameId, favorite: boolean) {
        const snapshot = await this.#load()
        const existing = snapshot.favorites.find((entry) => entry.gameId === gameId)
        if (favorite && !existing) snapshot.favorites.push({ createdAt: Date.now(), gameId, order: snapshot.favorites.length })
        if (!favorite && existing) snapshot.favorites = snapshot.favorites.filter((entry) => entry.gameId !== gameId)
        snapshot.favorites = snapshot.favorites.map((entry, order) => ({ ...entry, order }))
        await this.#save(snapshot)
        return [...snapshot.favorites]
    }

    async recordLaunch(entry: GameRecentEntry) {
        const snapshot = await this.#load()
        snapshot.recent.unshift(entry)
        snapshot.recent.length = Math.min(snapshot.recent.length, 100)
        if (entry.success) {
            const usage = snapshot.usage[entry.gameId] ?? { lastLaunchedAt: null, launchCount: 0 }
            snapshot.usage[entry.gameId] = { lastLaunchedAt: entry.timestamp, launchCount: usage.launchCount + 1 }
        }
        await this.#save(snapshot)
    }

    async saveSession(session: GameSession) {
        const snapshot = await this.#load()
        const index = snapshot.sessions.findIndex((entry) => entry.id === session.id)
        if (index >= 0) snapshot.sessions[index] = session
        else snapshot.sessions.unshift(session)
        snapshot.sessions.length = Math.min(snapshot.sessions.length, 100)
        const recent = snapshot.recent.find((entry) => entry.sessionId === session.id)
        if (recent && session.durationMs !== null) recent.durationMs = session.durationMs
        await this.#save(snapshot)
    }

    async #load() {
        if (this.#snapshot) return this.#snapshot
        try {
            const parsed: unknown = JSON.parse(await readFile(this.#filePath, 'utf8'))
            if (!parsed || typeof parsed !== 'object') throw new Error('Invalid gaming history.')
            const value = parsed as Partial<GamingSnapshot>
            this.#snapshot = {
                favorites: Array.isArray(value.favorites) ? value.favorites : [],
                recent: Array.isArray(value.recent) ? value.recent : [],
                sessions: Array.isArray(value.sessions) ? value.sessions : [],
                usage: value.usage && typeof value.usage === 'object' ? value.usage : {},
            }
        } catch {
            this.#snapshot = emptySnapshot()
        }
        return this.#snapshot
    }

    #save(snapshot: GamingSnapshot) {
        const serialized = JSON.stringify(snapshot, null, 2)
        this.#saveQueue = this.#saveQueue.then(async () => {
            await mkdir(path.dirname(this.#filePath), { recursive: true })
            const temporaryPath = `${this.#filePath}.tmp`
            await writeFile(temporaryPath, serialized, 'utf8')
            try {
                await rename(temporaryPath, this.#filePath)
            } catch {
                await rm(this.#filePath, { force: true })
                await rename(temporaryPath, this.#filePath)
            }
        })
        return this.#saveQueue
    }
}
