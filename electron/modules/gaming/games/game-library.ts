import type {
    DetectedGame,
    DetectedLauncher,
    GameLibraryScanResult,
    GameProviderId,
} from '../../../../src/features/gaming/gaming.types.js'
import type { LauncherDetector } from '../launchers/launcher-detector.js'
import type { GamingFileSystem, GameProvider } from '../providers/provider.types.js'

export class GameLibrary {
    readonly #launchers: LauncherDetector
    readonly #providers: readonly GameProvider[]
    readonly #fileSystem: GamingFileSystem
    readonly #environment: Readonly<Record<string, string | undefined>>
    #games: DetectedGame[] = []
    #detectedLaunchers: DetectedLauncher[] = []
    #scanPromise: Promise<GameLibraryScanResult> | null = null

    constructor(options: {
        environment?: Readonly<Record<string, string | undefined>>
        fileSystem: GamingFileSystem
        launcherDetector: LauncherDetector
        providers: readonly GameProvider[]
    }) {
        this.#environment = options.environment ?? process.env
        this.#fileSystem = options.fileSystem
        this.#launchers = options.launcherDetector
        this.#providers = options.providers
    }

    scan() {
        if (!this.#scanPromise) this.#scanPromise = this.#performScan().finally(() => { this.#scanPromise = null })
        return this.#scanPromise
    }

    list() { return [...this.#games] }
    launchers() { return [...this.#detectedLaunchers] }

    async #performScan(): Promise<GameLibraryScanResult> {
        const startedAt = Date.now()
        const launchers = await this.#launchers.scan()
        const launcherByProvider = new Map<GameProviderId, DetectedLauncher>()
        for (const launcher of launchers) if (launcher.providerId) launcherByProvider.set(launcher.providerId, launcher)

        const providerErrors: GameLibraryScanResult['summary']['providerErrors'] = []
        const warnings: string[] = []
        const providersSucceeded: GameProviderId[] = []
        const gamesById = new Map<string, DetectedGame>()
        await Promise.all(this.#providers.map(async (provider) => {
            const launcher = launcherByProvider.get(provider.id)
            if (!launcher) {
                providerErrors.push({ message: 'No launcher definition is associated with this provider.', provider: provider.id })
                return
            }
            try {
                const result = await provider.scan({ environment: this.#environment, fileSystem: this.#fileSystem, launcher })
                providersSucceeded.push(provider.id)
                warnings.push(...result.warnings)
                for (const game of result.games) {
                    const existing = gamesById.get(game.id)
                    if (!existing || existing.installStatus !== 'installed') gamesById.set(game.id, game)
                }
            } catch (error) {
                providerErrors.push({ message: error instanceof Error ? error.message : 'Unknown provider error', provider: provider.id })
            }
        }))

        this.#games = [...gamesById.values()].sort((left, right) => left.title.localeCompare(right.title))
        const countByProvider = new Map<GameProviderId, number>()
        for (const game of this.#games) countByProvider.set(game.provider, (countByProvider.get(game.provider) ?? 0) + 1)
        this.#detectedLaunchers = launchers.map((launcher) => ({
            ...launcher,
            error: providerErrors.find((error) => error.provider === launcher.providerId)?.message ?? null,
            gameCount: launcher.providerId ? countByProvider.get(launcher.providerId) ?? 0 : 0,
        }))
        return {
            games: this.list(),
            launchers: this.launchers(),
            summary: {
                durationMs: Date.now() - startedAt,
                gamesDetected: this.#games.length,
                providerErrors,
                providersInspected: this.#providers.map((provider) => provider.id),
                providersSucceeded,
                scannedAt: Date.now(),
                warnings,
            },
        }
    }
}
