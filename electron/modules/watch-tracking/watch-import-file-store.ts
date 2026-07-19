import { randomUUID } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import * as path from 'node:path'

import { WATCH_IMPORT_MAX_BYTES } from '../../../src/features/watch-tracking/watch.constants.js'
import type { WatchImportSelection } from '../../../src/features/watch-tracking/watch.types.js'

interface FileToken { createdAt: number; filePath: string; provider: WatchImportSelection['provider'] }

function decode(buffer: Buffer) {
    if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le')
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) return buffer.subarray(3).toString('utf8')
    return buffer.toString('utf8')
}

export class WatchImportFileStore {
    readonly #tokens = new Map<string, FileToken>()
    create(filePath: string, provider: WatchImportSelection['provider']): WatchImportSelection {
        const fileToken = randomUUID()
        this.#tokens.set(fileToken, { createdAt: Date.now(), filePath, provider })
        return { fileName: path.basename(filePath), fileToken, provider }
    }

    async read(fileToken: string, provider: WatchImportSelection['provider']) {
        const entry = this.#tokens.get(fileToken)
        if (!entry || entry.provider !== provider || Date.now() - entry.createdAt > 15 * 60_000) throw new Error('Jeton de fichier invalide ou expiré.')
        const extension = path.extname(entry.filePath).toLocaleLowerCase()
        const allowed = provider === 'netflix-import' ? new Set(['.csv']) : new Set(['.json', '.csv'])
        if (!allowed.has(extension)) throw new Error('Extension de fichier non autorisée pour ce provider.')
        const fileStats = await stat(entry.filePath)
        if (!fileStats.isFile() || fileStats.size <= 0 || fileStats.size > WATCH_IMPORT_MAX_BYTES) throw new Error('Fichier vide, illisible ou supérieur à 10 Mo.')
        return { content: decode(await readFile(entry.filePath)), extension, fileName: path.basename(entry.filePath) }
    }

    revoke(fileToken: string) { this.#tokens.delete(fileToken) }
}
