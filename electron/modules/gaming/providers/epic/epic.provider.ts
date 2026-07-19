import * as path from 'node:path'

import type { GameProvider, GameProviderContext } from '../provider.types.js'
import { parseEpicManifest } from './epic-manifest-parser.js'

const genericEpicBootstrapExecutables = new Set(['launcher.exe', 'start_protected_game.exe'])
const knownEpicGameProcesses: Readonly<Record<string, readonly string[]>> = {
    Sugar: ['RocketLeague.exe'],
}

export class EpicProvider implements GameProvider {
    readonly id = 'epic' as const

    async scan(context: GameProviderContext) {
        const warnings: string[] = []
        const programData = context.environment.PROGRAMDATA
        if (!programData || context.launcher.installStatus !== 'installed') return { games: [], provider: this.id, warnings }
        const directory = path.join(programData, 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests')
        if (!await context.fileSystem.exists(directory)) return { games: [], provider: this.id, warnings: ['Epic manifest directory was not found.'] }
        let fileNames: string[]
        try {
            fileNames = await context.fileSystem.readDirectory(directory)
        } catch (error) {
            throw new Error(`Epic manifests could not be read: ${error instanceof Error ? error.message : 'read error'}`)
        }
        const games = []
        for (const fileName of fileNames.filter((entry) => entry.toLocaleLowerCase().endsWith('.item'))) {
            try {
                const manifest = parseEpicManifest(await context.fileSystem.readText(path.join(directory, fileName)))
                const installed = await context.fileSystem.exists(manifest.installLocation)
                const manifestProcess = manifest.launchExecutable ? path.basename(manifest.launchExecutable) : null
                const processNames = knownEpicGameProcesses[manifest.appName]
                    ?? (manifestProcess && !genericEpicBootstrapExecutables.has(manifestProcess.toLocaleLowerCase()) ? [manifestProcess] : [])
                const id = `epic:${manifest.catalogItemId}` as const
                games.push({
                    artworkPath: null,
                    capabilities: { close: processNames.length > 0, launch: true, trackProcess: processNames.length > 0 },
                    executablePath: manifest.launchExecutable ? path.resolve(manifest.installLocation, manifest.launchExecutable) : null,
                    gameProcessNames: processNames,
                    id,
                    installDirectory: manifest.installLocation,
                    installStatus: installed ? 'installed' as const : 'partial' as const,
                    lastLaunchedAt: null,
                    lastUpdatedAt: null,
                    launchCount: 0,
                    launcherId: 'epic' as const,
                    launchStrategy: {
                        type: 'uri' as const,
                        uri: `com.epicgames.launcher://apps/${encodeURIComponent(manifest.appName)}?action=launch&silent=true`,
                    },
                    metadata: { appName: manifest.appName, catalogItemId: manifest.catalogItemId },
                    provider: 'epic' as const,
                    providerGameId: manifest.catalogItemId,
                    remoteArtworkUrl: null,
                    runtimeStatus: 'unknown' as const,
                    sizeOnDisk: null,
                    source: `Epic manifest: ${fileName}`,
                    tags: ['Epic Games'],
                    title: manifest.displayName,
                })
            } catch (error) {
                warnings.push(`${fileName}: ${error instanceof Error ? error.message : 'invalid Epic manifest'}`)
            }
        }
        return { games, provider: this.id, warnings }
    }
}
