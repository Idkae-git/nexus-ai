import { access, readdir, stat } from 'node:fs/promises'

export interface MediaDirectoryEntry {
    isDirectory: boolean
    isSymbolicLink: boolean
    name: string
}

export interface MediaFileStat {
    birthtimeMs: number
    mtimeMs: number
    size: number
}

export interface MediaFileSystem {
    exists(targetPath: string): Promise<boolean>
    readDirectory(directoryPath: string): Promise<MediaDirectoryEntry[]>
    stat(filePath: string): Promise<MediaFileStat>
}

export class NodeMediaFileSystem implements MediaFileSystem {
    async exists(targetPath: string) {
        try { await access(targetPath); return true } catch { return false }
    }

    async readDirectory(directoryPath: string) {
        const entries = await readdir(directoryPath, { withFileTypes: true })
        return entries.map((entry) => ({ isDirectory: entry.isDirectory(), isSymbolicLink: entry.isSymbolicLink(), name: entry.name }))
    }

    async stat(filePath: string) {
        const result = await stat(filePath)
        return { birthtimeMs: result.birthtimeMs, mtimeMs: result.mtimeMs, size: result.size }
    }
}
