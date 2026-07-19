import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

import type { MediaFolder } from '../../../src/features/media/media.types.js'

export interface MediaFolderRepository {
    add(folderPath: string): Promise<MediaFolder[]>
    list(): Promise<MediaFolder[]>
    remove(folderId: string): Promise<MediaFolder[]>
}

function folderId(folderPath: string) {
    return createHash('sha256').update(path.normalize(folderPath).toLocaleLowerCase()).digest('hex').slice(0, 20)
}

export class MediaFolderStore implements MediaFolderRepository {
    readonly #filePath: string
    #folders: MediaFolder[] | null = null
    #saveQueue: Promise<void> = Promise.resolve()

    constructor(filePath: string) { this.#filePath = filePath }

    async list() { return [...await this.#load()] }

    async add(folderPath: string) {
        const normalized = path.resolve(folderPath)
        const folders = await this.#load()
        const id = folderId(normalized)
        if (!folders.some((folder) => folder.id === id)) {
            folders.push({ addedAt: Date.now(), displayPath: normalized, id, label: path.basename(normalized) || normalized, path: normalized })
            await this.#save(folders)
        }
        return [...folders]
    }

    async remove(folderIdToRemove: string) {
        const folders = await this.#load()
        const next = folders.filter((folder) => folder.id !== folderIdToRemove)
        if (next.length === folders.length) throw new Error(`Unknown media folder "${folderIdToRemove}".`)
        this.#folders = next
        await this.#save(next)
        return [...next]
    }

    async #load() {
        if (this.#folders) return this.#folders
        try {
            const parsed: unknown = JSON.parse(await readFile(this.#filePath, 'utf8'))
            this.#folders = Array.isArray(parsed) ? parsed.filter((entry): entry is MediaFolder => Boolean(entry && typeof entry === 'object' && typeof (entry as MediaFolder).id === 'string' && typeof (entry as MediaFolder).path === 'string')) : []
        } catch { this.#folders = [] }
        return this.#folders
    }

    #save(folders: readonly MediaFolder[]) {
        const serialized = JSON.stringify(folders, null, 2)
        this.#saveQueue = this.#saveQueue.then(async () => {
            await mkdir(path.dirname(this.#filePath), { recursive: true })
            const temporaryPath = `${this.#filePath}.tmp`
            await writeFile(temporaryPath, serialized, 'utf8')
            try { await rename(temporaryPath, this.#filePath) }
            catch { await rm(this.#filePath, { force: true }); await rename(temporaryPath, this.#filePath) }
        })
        return this.#saveQueue
    }
}
