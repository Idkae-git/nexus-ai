import type { DetectedMedia, MediaFolder, MediaProviderId } from '../../../../src/features/media/media.types.js'
import type { MediaFileSystem } from '../media-file-system.js'

export interface MediaProviderScanResult {
    items: DetectedMedia[]
    provider: MediaProviderId
    skippedFiles: number
    warnings: string[]
}

export interface MediaProvider {
    readonly id: MediaProviderId
    scan(context: { fileSystem: MediaFileSystem; folders: readonly MediaFolder[] }): Promise<MediaProviderScanResult>
}
