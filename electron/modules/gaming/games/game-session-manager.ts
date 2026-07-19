import { randomUUID } from 'node:crypto'

import type { DetectedGame, GameSession } from '../../../../src/features/gaming/gaming.types.js'
import type { GameHistory } from './game-history.js'
import type { GameProcessService } from './game-process.js'

export class GameSessionManager {
    readonly #history: GameHistory
    readonly #processes: GameProcessService
    readonly #now: () => number
    readonly #createId: () => string
    readonly #pollIntervalMs: number
    readonly #launchTimeoutMs: number
    readonly #games = new Map<string, DetectedGame>()
    readonly #active = new Map<string, GameSession>()
    #timer: ReturnType<typeof setInterval> | null = null
    #restored = false

    constructor(options: {
        createId?: () => string
        history: GameHistory
        launchTimeoutMs?: number
        now?: () => number
        pollIntervalMs?: number
        processService: GameProcessService
    }) {
        this.#createId = options.createId ?? randomUUID
        this.#history = options.history
        this.#launchTimeoutMs = options.launchTimeoutMs ?? 45_000
        this.#now = options.now ?? Date.now
        this.#pollIntervalMs = options.pollIntervalMs ?? 5_000
        this.#processes = options.processService
    }

    async start(game: DetectedGame) {
        const session: GameSession = {
            detectedRunningAt: null,
            durationMs: null,
            endedAt: null,
            gameId: game.id,
            id: this.#createId(),
            processDetection: game.capabilities.trackProcess ? 'process-name' : 'unavailable',
            provider: game.provider,
            startedAt: this.#now(),
            status: 'launching',
        }
        this.#games.set(game.id, game)
        this.#active.set(session.id, session)
        await this.#history.saveSession(session)
        this.#ensurePolling()
        return session
    }

    async refresh() {
        if (this.#active.size === 0) return []
        const processes = await this.#processes.listProcesses()
        const now = this.#now()
        for (const [id, current] of this.#active) {
            const game = this.#games.get(current.gameId)
            if (!game) continue
            const runtimeStatus = this.#processes.status(game, processes)
            let next = current
            if (runtimeStatus === 'running') {
                next = { ...current, detectedRunningAt: current.detectedRunningAt ?? now, status: 'running' }
            } else if (current.status === 'running' && runtimeStatus === 'stopped') {
                next = { ...current, durationMs: now - current.startedAt, endedAt: now, status: 'ended' }
            } else if (current.status === 'launching' && current.processDetection === 'unavailable') {
                next = { ...current, error: 'This provider does not expose a reliable process identity.', status: 'unknown' }
            } else if (current.status === 'launching' && now - current.startedAt >= this.#launchTimeoutMs) {
                next = { ...current, durationMs: now - current.startedAt, endedAt: now, error: 'Game launch detection timed out.', status: 'failed' }
            }
            this.#active.set(id, next)
            await this.#history.saveSession(next)
            if (next.status === 'ended' || next.status === 'failed' || next.status === 'unknown') this.#active.delete(id)
        }
        if (this.#active.size === 0) this.#stopPolling()
        return this.active()
    }

    async restore(games: readonly DetectedGame[]) {
        if (this.#restored) return
        this.#restored = true
        const unfinished = (await this.#history.sessions(100)).filter((session) => session.status === 'launching' || session.status === 'running')
        if (unfinished.length === 0) return
        const byId = new Map(games.map((game) => [game.id, game]))
        const processes = await this.#processes.listProcesses()
        const now = this.#now()
        for (const session of unfinished) {
            const game = byId.get(session.gameId)
            if (game && this.#processes.status(game, processes) === 'running') {
                this.#games.set(game.id, game)
                this.#active.set(session.id, session)
                continue
            }
            await this.#history.saveSession({ ...session, durationMs: now - session.startedAt, endedAt: now, error: 'Session recovered after NEXUS stopped tracking it.', status: 'ended' })
        }
        if (this.#active.size > 0) this.#ensurePolling()
    }

    active() { return [...this.#active.values()] }
    list(limit?: number) { return this.#history.sessions(limit) }

    async stopTracking(sessionId: string) {
        const session = this.#active.get(sessionId)
        if (!session) throw new Error(`Unknown active gaming session "${sessionId}".`)
        const now = this.#now()
        const ended = { ...session, durationMs: now - session.startedAt, endedAt: now, status: 'ended' as const }
        this.#active.delete(sessionId)
        await this.#history.saveSession(ended)
        if (this.#active.size === 0) this.#stopPolling()
        return ended
    }

    dispose() { this.#stopPolling() }

    #ensurePolling() {
        if (this.#timer) return
        this.#timer = setInterval(() => { void this.refresh() }, this.#pollIntervalMs)
        this.#timer.unref?.()
    }

    #stopPolling() {
        if (!this.#timer) return
        clearInterval(this.#timer)
        this.#timer = null
    }
}
