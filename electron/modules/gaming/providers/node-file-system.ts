import { access, readdir, readFile } from 'node:fs/promises'

import type { GamingFileSystem } from './provider.types.js'

export class NodeGamingFileSystem implements GamingFileSystem {
    async exists(filePath: string) {
        try {
            await access(filePath)
            return true
        } catch {
            return false
        }
    }

    readDirectory(directoryPath: string) {
        return readdir(directoryPath)
    }

    readText(filePath: string) {
        return readFile(filePath, 'utf8')
    }
}
