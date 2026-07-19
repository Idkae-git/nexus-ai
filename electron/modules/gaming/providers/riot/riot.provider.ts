import * as path from 'node:path'

import type { DetectedGame } from '../../../../../src/features/gaming/gaming.types.js'
import type { GameProvider, GameProviderContext } from '../provider.types.js'

interface RiotProduct {
    arguments: readonly string[]
    directory: string
    executable: string
    id: 'league-of-legends' | 'valorant'
    processNames: readonly string[]
    title: string
}

const products: readonly RiotProduct[] = [
    {
        arguments: ['--launch-product=league_of_legends', '--launch-patchline=live'],
        directory: 'League of Legends',
        executable: 'LeagueClient.exe',
        id: 'league-of-legends',
        processNames: ['LeagueClient.exe', 'League of Legends.exe'],
        title: 'League of Legends',
    },
    {
        arguments: ['--launch-product=valorant', '--launch-patchline=live'],
        directory: path.join('VALORANT', 'live'),
        executable: path.join('ShooterGame', 'Binaries', 'Win64', 'VALORANT-Win64-Shipping.exe'),
        id: 'valorant',
        processNames: ['VALORANT.exe', 'VALORANT-Win64-Shipping.exe'],
        title: 'VALORANT',
    },
]

export class RiotProvider implements GameProvider {
    readonly id = 'riot' as const

    async scan(context: GameProviderContext) {
        const warnings: string[] = []
        if (context.launcher.installStatus !== 'installed') return { games: [], provider: this.id, warnings }
        const systemDrive = context.environment.SystemDrive ?? 'C:'
        const roots = new Set([
            path.join(systemDrive, 'Riot Games'),
            context.launcher.installDirectory ? path.dirname(context.launcher.installDirectory) : '',
        ].filter(Boolean))
        const games: DetectedGame[] = []
        for (const product of products) {
            for (const root of roots) {
                const installDirectory = path.join(root, product.directory)
                const executablePath = path.join(installDirectory, product.executable)
                if (!await context.fileSystem.exists(executablePath)) continue
                games.push({
                    artworkPath: null,
                    capabilities: { close: true, launch: true, trackProcess: true },
                    executablePath,
                    gameProcessNames: product.processNames,
                    id: `riot:${product.id}`,
                    installDirectory,
                    installStatus: 'installed',
                    lastLaunchedAt: null,
                    lastUpdatedAt: null,
                    launchCount: 0,
                    launcherId: 'riot',
                    launchStrategy: { arguments: product.arguments, launcherId: 'riot', type: 'launcher-arguments' },
                    metadata: { product: product.id },
                    provider: 'riot',
                    providerGameId: product.id,
                    remoteArtworkUrl: null,
                    runtimeStatus: 'unknown',
                    sizeOnDisk: null,
                    source: 'Known Riot Games product path',
                    tags: ['Riot Games'],
                    title: product.title,
                })
                break
            }
        }
        return { games, provider: this.id, warnings }
    }
}
