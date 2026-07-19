import * as path from 'node:path'

import type { DetectedGame } from '../../../../../src/features/gaming/gaming.types.js'
import type { GameProvider, GameProviderContext, ProviderScanResult } from '../provider.types.js'
import { parseSteamAppManifest, parseSteamLibraryFolders } from './steam-manifest-parser.js'

const knownSteamSupportApps = new Set(['228980'])

export class SteamProvider implements GameProvider {
    readonly id = 'steam' as const

    async scan(context: GameProviderContext): Promise<ProviderScanResult> {
        const warnings: string[] = []
        const root = context.launcher.installDirectory
        if (!root || context.launcher.installStatus !== 'installed') return { games: [], provider: this.id, warnings }

        const libraries = new Set([root])
        const libraryFile = path.join(root, 'steamapps', 'libraryfolders.vdf')
        if (await context.fileSystem.exists(libraryFile)) {
            try {
                for (const library of parseSteamLibraryFolders(await context.fileSystem.readText(libraryFile))) {
                    libraries.add(path.normalize(library))
                }
            } catch (error) {
                warnings.push(`Steam libraryfolders.vdf: ${error instanceof Error ? error.message : 'invalid file'}`)
            }
        }

        const games = new Map<string, DetectedGame>()
        for (const library of libraries) await this.#scanLibrary(context, library, games, warnings)
        return { games: [...games.values()], provider: this.id, warnings }
    }

    async #scanLibrary(
        context: GameProviderContext,
        library: string,
        games: Map<string, DetectedGame>,
        warnings: string[],
    ) {
        const steamApps = path.join(library, 'steamapps')
        if (!await context.fileSystem.exists(steamApps)) {
            warnings.push(`Steam library unavailable: ${library}`)
            return
        }
        let entries: string[]
        try {
            entries = await context.fileSystem.readDirectory(steamApps)
        } catch (error) {
            warnings.push(`Steam library inaccessible (${library}): ${error instanceof Error ? error.message : 'read error'}`)
            return
        }
        for (const fileName of entries.filter((entry) => /^appmanifest_\d+\.acf$/i.test(entry))) {
            try {
                const manifest = parseSteamAppManifest(await context.fileSystem.readText(path.join(steamApps, fileName)))
                if (knownSteamSupportApps.has(manifest.appId)) continue
                const installDirectory = path.join(steamApps, 'common', manifest.installDirectoryName)
                const directoryExists = await context.fileSystem.exists(installDirectory)
                const fullyInstalled = manifest.stateFlags === null || (manifest.stateFlags & 4) === 4
                const id = `steam:${manifest.appId}` as const
                games.set(id, {
                    artworkPath: null,
                    capabilities: { close: false, launch: true, trackProcess: false },
                    executablePath: null,
                    gameProcessNames: [],
                    id,
                    installDirectory,
                    installStatus: directoryExists && fullyInstalled ? 'installed' : 'partial',
                    lastLaunchedAt: null,
                    lastUpdatedAt: manifest.lastUpdatedAt === null ? null : manifest.lastUpdatedAt * 1_000,
                    launchCount: 0,
                    launcherId: 'steam',
                    launchStrategy: { type: 'uri', uri: `steam://rungameid/${manifest.appId}` },
                    metadata: { appId: manifest.appId, stateFlags: manifest.stateFlags },
                    provider: 'steam',
                    providerGameId: manifest.appId,
                    remoteArtworkUrl: null,
                    runtimeStatus: 'unknown',
                    sizeOnDisk: manifest.sizeOnDisk,
                    source: `Steam manifest: ${fileName}`,
                    tags: ['Steam'],
                    title: manifest.name,
                })
            } catch (error) {
                warnings.push(`${fileName}: ${error instanceof Error ? error.message : 'invalid Steam manifest'}`)
            }
        }
    }
}
