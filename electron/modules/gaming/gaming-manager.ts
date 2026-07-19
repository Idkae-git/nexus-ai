import type { ApplicationManager } from '../applications/application-manager.js'
import type {
    DetectedGame,
    GameFavorite,
    GameId,
    GameLaunchResult,
    GameRuntimeResult,
    LauncherId,
    LauncherOpenResult,
} from '../../../src/features/gaming/gaming.types.js'
import type { GameHistory } from './games/game-history.js'
import type { GameLauncher } from './games/game-launcher.js'
import type { GameLibrary } from './games/game-library.js'
import type { GameProcessService } from './games/game-process.js'
import type { GameSessionManager } from './games/game-session-manager.js'
import type { LauncherDetector } from './launchers/launcher-detector.js'
import type { LauncherRegistry } from './launchers/launcher.registry.js'

export class GamingManager {
    readonly #applications: ApplicationManager
    readonly #history: GameHistory
    readonly #launcherDetector: LauncherDetector
    readonly #launcherRegistry: LauncherRegistry
    readonly #gameLauncher: GameLauncher
    readonly #library: GameLibrary
    readonly #processes: GameProcessService
    readonly #sessions: GameSessionManager

    constructor(options: {
        applicationManager: ApplicationManager
        gameLauncher: GameLauncher
        history: GameHistory
        launcherDetector: LauncherDetector
        launcherRegistry: LauncherRegistry
        library: GameLibrary
        processService: GameProcessService
        sessions: GameSessionManager
    }) {
        this.#applications = options.applicationManager
        this.#gameLauncher = options.gameLauncher
        this.#history = options.history
        this.#launcherDetector = options.launcherDetector
        this.#launcherRegistry = options.launcherRegistry
        this.#library = options.library
        this.#processes = options.processService
        this.#sessions = options.sessions
    }

    scanLaunchers() { return this.#launcherDetector.scan() }
    listLaunchers() { return this.#library.launchers().length ? Promise.resolve(this.#library.launchers()) : this.#launcherDetector.list() }
    async refreshLauncherStatuses() {
        const refreshed = await this.#launcherDetector.refreshStatus()
        const counts = new Map<string, number>()
        for (const game of this.#library.list()) counts.set(game.provider, (counts.get(game.provider) ?? 0) + 1)
        return refreshed.map((launcher) => ({ ...launcher, gameCount: launcher.providerId ? counts.get(launcher.providerId) ?? 0 : 0 }))
    }

    async scanLibrary() {
        const scan = await this.#library.scan()
        await this.#enrichUsage(scan.games)
        await this.#sessions.restore(scan.games)
        return { ...scan, games: this.#library.list() }
    }

    async listGames() {
        if (this.#library.list().length === 0) await this.scanLibrary()
        await this.#enrichUsage(this.#library.list())
        return this.#library.list()
    }

    async getGame(gameId: GameId) {
        const game = (await this.listGames()).find((entry) => entry.id === gameId)
        if (!game) throw new Error(`Unknown or undetected game "${gameId}".`)
        return game
    }

    async launchGame(gameId: GameId): Promise<GameLaunchResult> {
        const game = await this.getGame(gameId)
        try {
            const launchers = await this.listLaunchers()
            const launcherStarted = launchers.find((launcher) => launcher.id === game.launcherId)?.runtimeStatus !== 'running'
            const strategy = await this.#gameLauncher.launch(game, launchers)
            const session = await this.#sessions.start(game)
            const launchedAt = Date.now()
            await this.#history.recordLaunch({ gameId, sessionId: session.id, success: true, timestamp: launchedAt, durationMs: null })
            await this.#enrichUsage([game])
            return { gameId, launchedAt, launcherStarted, provider: game.provider, sessionId: session.id, strategy, success: true }
        } catch (error) {
            await this.#history.recordLaunch({ gameId, success: false, timestamp: Date.now(), durationMs: null, error: error instanceof Error ? error.message : 'Unknown launch error' })
            throw error
        }
    }

    async closeGame(gameId: GameId) { return this.#processes.close(await this.getGame(gameId)) }

    async refreshGameStatuses(): Promise<GameRuntimeResult[]> {
        const games = await this.listGames()
        const processes = await this.#processes.listProcesses()
        const statuses = games.map((game) => ({ gameId: game.id, runtimeStatus: this.#processes.status(game, processes) }))
        const byId = new Map(statuses.map((status) => [status.gameId, status.runtimeStatus]))
        for (const game of this.#library.list()) game.runtimeStatus = byId.get(game.id) ?? 'unknown'
        await this.#sessions.refresh()
        return statuses
    }

    async setFavorite(gameId: GameId, favorite: boolean): Promise<GameFavorite[]> {
        await this.getGame(gameId)
        return this.#history.setFavorite(gameId, favorite)
    }

    favorites() { return this.#history.favorites() }
    recent(limit?: number) { return this.#history.recent(limit) }
    sessions(limit?: number) { return this.#sessions.list(limit) }
    activeSessions() { return this.#sessions.active() }
    stopTracking(sessionId: string) { return this.#sessions.stopTracking(sessionId) }

    async openLauncher(launcherId: LauncherId): Promise<LauncherOpenResult> {
        const definition = this.#launcherRegistry.get(launcherId)
        if (!definition.applicationId) throw new Error(`${definition.name} is not connected to the Application Registry yet.`)
        await this.#applications.launch(definition.applicationId)
        return { launcherId, openedAt: Date.now(), success: true }
    }

    dispose() { this.#sessions.dispose() }

    async #enrichUsage(games: readonly DetectedGame[]) {
        await Promise.all(games.map(async (game) => Object.assign(game, await this.#history.usage(game.id))))
    }
}
