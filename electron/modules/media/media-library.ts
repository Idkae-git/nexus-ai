import type { DetectedMedia, MediaProviderError, MediaProviderId, MediaScanResult } from '../../../src/features/media/media.types.js'
import type { MediaFileSystem } from './media-file-system.js'
import type { MediaFolderRepository } from './media-folder-store.js'
import type { MediaProvider } from './providers/media-provider.types.js'

export class MediaLibrary {
    readonly #fileSystem: MediaFileSystem
    readonly #folders: MediaFolderRepository
    readonly #providers: readonly MediaProvider[]
    #items: DetectedMedia[] = []
    #scanPromise: Promise<MediaScanResult> | null = null

    constructor(options: { fileSystem: MediaFileSystem; folders: MediaFolderRepository; providers: readonly MediaProvider[] }) {
        this.#fileSystem = options.fileSystem
        this.#folders = options.folders
        this.#providers = options.providers
    }

    scan() {
        if (!this.#scanPromise) this.#scanPromise = this.#performScan().finally(() => { this.#scanPromise = null })
        return this.#scanPromise
    }

    list() { return [...this.#items] }

    async #performScan(): Promise<MediaScanResult> {
        const startedAt = Date.now()
        const folders = await this.#folders.list()
        const providerErrors: MediaProviderError[] = []
        const warnings: string[] = []
        const byId = new Map<string, DetectedMedia>()
        let skippedFiles = 0
        const successfulProviders: MediaProviderId[] = []
        await Promise.all(this.#providers.map(async (provider) => {
            try {
                const result = await provider.scan({ fileSystem: this.#fileSystem, folders })
                successfulProviders.push(provider.id)
                skippedFiles += result.skippedFiles
                warnings.push(...result.warnings)
                for (const item of result.items) if (!byId.has(item.id)) byId.set(item.id, item)
            } catch (error) { providerErrors.push({ message: error instanceof Error ? error.message : 'Unknown provider error', provider: provider.id }) }
        }))
        this.#items = [...byId.values()].sort((left, right) => right.dateAdded - left.dateAdded || left.title.localeCompare(right.title))
        return {
            items: this.list(),
            summary: {
                durationMs: Date.now() - startedAt,
                foldersScanned: folders.length,
                itemsDetected: this.#items.length,
                providerErrors,
                providersInspected: this.#providers.map((provider) => provider.id),
                scannedAt: Date.now(),
                skippedFiles,
                warnings: [...warnings, ...successfulProviders.length === 0 ? ['Aucun provider multimédia disponible.'] : []],
            },
        }
    }
}
