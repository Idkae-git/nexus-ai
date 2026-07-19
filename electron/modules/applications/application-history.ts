import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

import type { ApplicationId, ApplicationRecentEntry } from '../../../src/features/applications/application.types.js'

interface ApplicationUsage {
    lastLaunchedAt: number | null
    launchCount: number
}
interface ApplicationHistorySnapshot {
    recent: ApplicationRecentEntry[]
    usage: Partial<Record<ApplicationId, ApplicationUsage>>
}

export interface ApplicationHistory {
    listRecent(limit?: number): Promise<ApplicationRecentEntry[]>
    record(entry: ApplicationRecentEntry): Promise<void>
    usage(applicationId: ApplicationId): Promise<ApplicationUsage>
}

const emptySnapshot = (): ApplicationHistorySnapshot => ({ recent: [], usage: {} })

export class ApplicationHistoryStore implements ApplicationHistory {
    readonly #filePath: string
    #snapshot: ApplicationHistorySnapshot | null = null

    constructor(filePath: string) {
        this.#filePath = filePath
    }

    async listRecent(limit = 30) {
        const snapshot = await this.#load()
        return snapshot.recent.slice(0, Math.max(0, limit))
    }

    async usage(applicationId: ApplicationId) {
        const snapshot = await this.#load()
        return snapshot.usage[applicationId] ?? { lastLaunchedAt: null, launchCount: 0 }
    }

    async record(entry: ApplicationRecentEntry) {
        const snapshot = await this.#load()
        const previous = snapshot.recent[0]
        if (previous?.applicationId === entry.applicationId && entry.timestamp - previous.timestamp < 5_000) {
            snapshot.recent[0] = entry
        } else {
            snapshot.recent.unshift(entry)
            snapshot.recent.length = Math.min(snapshot.recent.length, 100)
        }

        if (entry.success) {
            const usage = snapshot.usage[entry.applicationId] ?? { lastLaunchedAt: null, launchCount: 0 }
            snapshot.usage[entry.applicationId] = {
                lastLaunchedAt: entry.timestamp,
                launchCount: usage.launchCount + 1,
            }
        }
        await this.#save(snapshot)
    }

    async #load() {
        if (this.#snapshot) return this.#snapshot
        try {
            const parsed: unknown = JSON.parse(await readFile(this.#filePath, 'utf8'))
            if (!parsed || typeof parsed !== 'object') throw new Error('Invalid application history.')
            const value = parsed as Partial<ApplicationHistorySnapshot>
            this.#snapshot = {
                recent: Array.isArray(value.recent) ? value.recent : [],
                usage: value.usage && typeof value.usage === 'object' ? value.usage : {},
            }
        } catch {
            this.#snapshot = emptySnapshot()
        }
        return this.#snapshot
    }

    async #save(snapshot: ApplicationHistorySnapshot) {
        await mkdir(path.dirname(this.#filePath), { recursive: true })
        const temporaryPath = `${this.#filePath}.tmp`
        await writeFile(temporaryPath, JSON.stringify(snapshot, null, 2), 'utf8')
        await rename(temporaryPath, this.#filePath)
    }
}
