import type { DetectedGame, DetectedLauncher, GameProviderId } from '../../../../src/features/gaming/gaming.types.js'

export interface GamingFileSystem {
    exists(filePath: string): Promise<boolean>
    readDirectory(directoryPath: string): Promise<string[]>
    readText(filePath: string): Promise<string>
}

export interface GameProviderContext {
    environment: Readonly<Record<string, string | undefined>>
    fileSystem: GamingFileSystem
    launcher: DetectedLauncher
}

export interface ProviderScanResult {
    games: DetectedGame[]
    provider: GameProviderId
    warnings: string[]
}

export interface GameProvider {
    readonly id: GameProviderId
    scan(context: GameProviderContext): Promise<ProviderScanResult>
}
