import type { WatchEntry, WatchImportError, WatchProviderId } from '../../../src/features/watch-tracking/watch.types.js'

export interface ParsedWatchImport {
    columns: string[]
    entries: WatchEntry[]
    errors: WatchImportError[]
    profileName: string
    provider: WatchProviderId
    totalRows: number
    warnings: string[]
}
