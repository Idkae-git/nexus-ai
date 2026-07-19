import { createHash } from 'node:crypto'
import * as path from 'node:path'

import type { DetectedMedia, MediaFolder, MediaType } from '../../../../../src/features/media/media.types.js'
import type { MediaFileSystem } from '../../media-file-system.js'

const videoExtensions = new Set(['.mp4', '.mkv', '.avi', '.mov', '.webm'])
const audioExtensions = new Set(['.mp3', '.flac', '.wav', '.aac'])
const maximumDepth = 12
const maximumFiles = 20_000

export function classifyMedia(filePath: string): MediaType | null {
    const extension = path.extname(filePath).toLocaleLowerCase()
    if (audioExtensions.has(extension)) return 'music'
    if (!videoExtensions.has(extension)) return null
    const baseName = path.basename(filePath, extension)
    if (/\bS\d{1,2}E\d{1,3}\b/i.test(baseName) || /\b\d{1,2}x\d{1,3}\b/i.test(baseName)) return 'series'
    if (/\b(19|20)\d{2}\b/.test(baseName) || /(?:^|[\\/])(films?|movies?)(?:[\\/]|$)/i.test(filePath)) return 'film'
    return 'video'
}

export function mediaTitle(filePath: string) {
    const extension = path.extname(filePath)
    return path.basename(filePath, extension)
        .replace(/[._]+/g, ' ')
        .replace(/\s*[([]?(?:19|20)\d{2}[)\]]?\s*$/, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function mediaId(filePath: string) {
    const digest = createHash('sha256').update(path.normalize(filePath).toLocaleLowerCase()).digest('hex')
    return `local:${digest}` as const
}

export class LocalMediaScanner {
    readonly #fileSystem: MediaFileSystem

    constructor(fileSystem: MediaFileSystem) { this.#fileSystem = fileSystem }

    async scan(folders: readonly MediaFolder[]) {
        const items: DetectedMedia[] = []
        const warnings: string[] = []
        let skippedFiles = 0
        for (const folder of folders) {
            if (!await this.#fileSystem.exists(folder.path)) { warnings.push(`Dossier indisponible : ${folder.displayPath}`); continue }
            const queue = [{ depth: 0, directory: folder.path }]
            while (queue.length > 0 && items.length + skippedFiles < maximumFiles) {
                const current = queue.shift()
                if (!current) break
                let entries
                try { entries = await this.#fileSystem.readDirectory(current.directory) }
                catch (error) { warnings.push(`${current.directory}: ${error instanceof Error ? error.message : 'lecture impossible'}`); continue }
                for (const entry of entries) {
                    if (entry.isSymbolicLink) { skippedFiles += 1; continue }
                    const entryPath = path.join(current.directory, entry.name)
                    if (entry.isDirectory) {
                        if (current.depth < maximumDepth) queue.push({ depth: current.depth + 1, directory: entryPath })
                        continue
                    }
                    const type = classifyMedia(entryPath)
                    if (!type) { skippedFiles += 1; continue }
                    try {
                        const stats = await this.#fileSystem.stat(entryPath)
                        items.push({
                            dateAdded: stats.birthtimeMs > 0 ? stats.birthtimeMs : stats.mtimeMs,
                            durationMs: null,
                            extension: path.extname(entryPath).slice(1).toLocaleLowerCase(),
                            filePath: entryPath,
                            folderId: folder.id,
                            id: mediaId(entryPath),
                            metadata: {},
                            provider: 'local',
                            size: stats.size,
                            source: 'Configured local folder',
                            thumbnailPath: null,
                            title: mediaTitle(entryPath),
                            type,
                        })
                    } catch (error) { skippedFiles += 1; warnings.push(`${entryPath}: ${error instanceof Error ? error.message : 'métadonnées inaccessibles'}`) }
                }
            }
            if (items.length + skippedFiles >= maximumFiles) warnings.push('La limite de 20 000 fichiers a été atteinte.')
        }
        return { items, skippedFiles, warnings }
    }
}
