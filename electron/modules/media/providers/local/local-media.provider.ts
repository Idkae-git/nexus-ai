import type { MediaProvider } from '../media-provider.types.js'
import { LocalMediaScanner } from './local-media-scanner.js'

export class LocalMediaProvider implements MediaProvider {
    readonly id = 'local' as const

    async scan(context: Parameters<MediaProvider['scan']>[0]) {
        const result = await new LocalMediaScanner(context.fileSystem).scan(context.folders)
        return { ...result, provider: this.id }
    }
}
