import { createHash, randomUUID } from 'node:crypto'

import type { DetectedMedia } from '../../../src/features/media/media.types.js'
import { WATCH_PROVIDERS } from '../../../src/features/watch-tracking/watch.constants.js'
import type { NexusWatchHistoryExport, WatchConflictResolution, WatchEntry, WatchEntryId, WatchEntryUpdate, WatchHistoryQuery, WatchImportPreview, WatchImportResult, WatchImportSelection, WatchProviderId, WatchStatus } from '../../../src/features/watch-tracking/watch.types.js'
import { mergeWatchEntries, matchWatchEntry, progressConflict } from './watch-deduplication.service.js'
import { createWatchEntry, normalizeWatchTitle } from './watch-history-normalizer.js'
import type { WatchHistoryRepository } from './watch-history.repository.js'
import type { ParsedWatchImport } from './watch-import.types.js'
import { WatchImportFileStore } from './watch-import-file-store.js'
import { completionStatus, exactProgress } from './watch-progress.service.js'
import { calculateWatchStats } from './watch-stats.service.js'
import { parseCrunchyrollCsv, parseCrunchyrollJson } from './providers/crunchyroll/crunchyroll-history.parser.js'
import { parseNexusWatchHistory } from './providers/manual/nexus-watch.parser.js'
import { parseNetflixCsv } from './providers/netflix/netflix-csv.parser.js'

export type WatchFileChooser = (provider: WatchImportSelection['provider']) => Promise<string | null>
export type WatchExportWriter = (fileName: string, content: string) => Promise<{ cancelled: boolean; fileName: string | null }>

interface PendingImport { checksum: string; parsed: ParsedWatchImport }

function entryMatchesQuery(entry: WatchEntry, query: WatchHistoryQuery, conflictIds: ReadonlySet<string>) {
    if (query.profileName && entry.profileName !== query.profileName) return false
    const search = query.query?.trim().toLocaleLowerCase()
    if (search && ![entry.title, entry.seriesTitle, entry.episodeTitle, entry.primaryProvider, entry.profileName].some((value) => value?.toLocaleLowerCase().includes(search))) return false
    switch (query.filter ?? 'all') {
        case 'all': return true
        case 'in-progress': return entry.status === 'in-progress'
        case 'completed': return entry.status === 'completed'
        case 'movies': return entry.mediaType === 'movie'
        case 'series': return entry.mediaType === 'series' || entry.mediaType === 'season' || entry.mediaType === 'episode'
        case 'anime': return entry.mediaType === 'anime'
        case 'conflicts': return conflictIds.has(entry.id)
        case 'exact-progress': return entry.progress.precision === 'exact'
        case 'unknown-progress': return entry.progress.percent === null
        default: return entry.primaryProvider === query.filter
    }
}

function sortEntries(entries: WatchEntry[], mode = 'recently-watched') {
    return entries.sort((left, right) => {
        switch (mode) {
            case 'recently-imported': return right.importedAt - left.importedAt
            case 'title': return left.title.localeCompare(right.title)
            case 'progress': return (right.progress.percent ?? -1) - (left.progress.percent ?? -1)
            case 'source': return left.primaryProvider.localeCompare(right.primaryProvider)
            case 'status': return left.status.localeCompare(right.status)
            default: return (right.watchedAt ?? right.updatedAt) - (left.watchedAt ?? left.updatedAt)
        }
    })
}

export class WatchTrackingManager {
    readonly #chooseFile: WatchFileChooser
    readonly #exportWriter: WatchExportWriter
    readonly #files: WatchImportFileStore
    readonly #pending = new Map<string, PendingImport>()
    readonly #repository: WatchHistoryRepository
    constructor(options: { chooseFile: WatchFileChooser; exportWriter: WatchExportWriter; files: WatchImportFileStore; repository: WatchHistoryRepository }) { this.#chooseFile = options.chooseFile; this.#exportWriter = options.exportWriter; this.#files = options.files; this.#repository = options.repository }

    async history(query: WatchHistoryQuery = {}) {
        const snapshot = await this.#repository.read()
        const conflictIds = new Set(snapshot.conflicts.filter((conflict) => !conflict.resolution).map((conflict) => conflict.existingEntryId))
        return sortEntries(snapshot.entries.filter((entry) => entryMatchesQuery(entry, query, conflictIds)), query.sortMode)
    }
    async get(id: WatchEntryId) { const entry = (await this.#repository.read()).entries.find((candidate) => candidate.id === id); if (!entry) throw new Error('Entrée de suivi inconnue.'); return entry }
    async createManual(title: string, profileName: string, mediaType: WatchEntry['mediaType'] = 'unknown') { const entry = createWatchEntry({ automatic: false, confidence: 'exact', mediaType, precision: 'unknown', profileName, provider: 'manual', status: 'planned', title }); await this.#repository.update((draft) => { draft.entries.push({ ...entry, manuallyEdited: true }) }); return { ...entry, manuallyEdited: true } }
    async update(id: WatchEntryId, changes: WatchEntryUpdate) {
        const now = Date.now()
        const { durationSeconds, positionSeconds, ...entryChanges } = changes
        const snapshot = await this.#repository.update((draft) => {
            const index = draft.entries.findIndex((entry) => entry.id === id)
            if (index < 0) throw new Error('Entrée de suivi inconnue.')
            const current = draft.entries[index]
            if (!current) throw new Error('Entrée de suivi inconnue.')
            const position = positionSeconds === undefined ? current.progress.positionSeconds : positionSeconds
            const duration = durationSeconds === undefined ? current.progress.durationSeconds : durationSeconds
            draft.entries[index] = {
                ...current,
                ...entryChanges,
                manuallyEdited: true,
                normalizedTitle: changes.title ? normalizeWatchTitle(changes.title) : current.normalizedTitle,
                progress: position !== null
                    ? exactProgress(position, duration, now)
                    : { ...current.progress, durationSeconds: duration },
                updatedAt: now,
            }
        })
        return snapshot.entries.find((entry) => entry.id === id) as WatchEntry
    }
    async delete(id: WatchEntryId) { await this.#repository.update((draft) => { draft.entries = draft.entries.filter((entry) => entry.id !== id); draft.conflicts = draft.conflicts.filter((entry) => entry.existingEntryId !== id) }); return true }
    async deleteProvider(provider: WatchProviderId, profileName?: string) { const snapshot = await this.#repository.update((draft) => { const removed = new Set(draft.entries.filter((entry) => entry.primaryProvider === provider && (!profileName || entry.profileName === profileName)).map((entry) => entry.id)); draft.entries = draft.entries.filter((entry) => !removed.has(entry.id)); draft.conflicts = draft.conflicts.filter((entry) => !removed.has(entry.existingEntryId)); draft.imports = draft.imports.filter((entry) => entry.provider !== provider || (profileName && entry.profileName !== profileName)) }); return snapshot.entries }
    mark(id: WatchEntryId, status: WatchStatus) {
        return this.update(id, status === 'completed' ? { status, watchedAt: Date.now() } : { status })
    }
    progress(id: WatchEntryId, positionSeconds: number, durationSeconds: number | null) { return this.update(id, { durationSeconds, positionSeconds, status: completionStatus(positionSeconds, durationSeconds) }) }

    async selectImport(provider: WatchImportSelection['provider']) { const filePath = await this.#chooseFile(provider); return filePath ? this.#files.create(filePath, provider) : null }
    async previewImport(provider: WatchImportSelection['provider'], fileToken: string, profileName: string): Promise<WatchImportPreview> {
        const file = await this.#files.read(fileToken, provider)
        const checksum = createHash('sha256').update(file.content).digest('hex')
        let parsed: ParsedWatchImport
        if (provider === 'netflix-import') parsed = parseNetflixCsv(file.content, profileName, file.fileName)
        else if (provider === 'crunchyroll-import') parsed = file.extension === '.json' ? parseCrunchyrollJson(file.content, profileName, file.fileName) : parseCrunchyrollCsv(file.content, profileName, file.fileName)
        else parsed = parseNexusWatchHistory(file.content, file.fileName)
        const snapshot = await this.#repository.read()
        const alreadyImported = snapshot.imports.some((entry) => entry.checksum === checksum && entry.status === 'committed')
        let duplicateEntries = alreadyImported ? parsed.entries.length : 0; let matchedEntries = 0; let conflicts = 0
        if (!alreadyImported) for (const entry of parsed.entries) { const match = matchWatchEntry(entry, snapshot.entries); if (match.confidence === 'exact' || match.confidence === 'high') duplicateEntries += 1; else if (match.confidence === 'medium') { matchedEntries += 1; conflicts += 1 } }
        const importId = randomUUID()
        this.#pending.set(importId, { checksum, parsed })
        await this.#repository.update((draft) => { draft.imports.unshift({ checksum, committedAt: null, conflicts, createdAt: Date.now(), errors: parsed.errors, fileName: file.fileName, id: importId, ignoredDuplicates: 0, importedCount: 0, profileName: parsed.profileName, provider: parsed.provider, status: 'preview', totalRows: parsed.totalRows }) })
        return { columns: parsed.columns, conflicts, duplicateEntries, errors: parsed.errors, fileName: file.fileName, importId, matchedEntries, newEntries: Math.max(0, parsed.entries.length - duplicateEntries - conflicts), profileName: parsed.profileName, provider: parsed.provider, sample: parsed.entries.slice(0, 8), totalRows: parsed.totalRows, validEntries: parsed.entries.length, warnings: alreadyImported ? [...parsed.warnings, 'Ce fichier a déjà été importé : toutes les lignes seront ignorées.'] : parsed.warnings }
    }
    async commitImport(importId: string): Promise<WatchImportResult> {
        const pending = this.#pending.get(importId); if (!pending) throw new Error('Aperçu d’import expiré ou annulé.')
        let importedCount = 0; let ignoredDuplicates = 0; let conflicts = 0
        await this.#repository.update((draft) => {
            const previous = draft.imports.find((entry) => entry.checksum === pending.checksum && entry.status === 'committed')
            if (previous) ignoredDuplicates = pending.parsed.entries.length
            else for (const incoming of pending.parsed.entries) {
                const match = matchWatchEntry(incoming, draft.entries)
                const existingIndex = match.entryId ? draft.entries.findIndex((entry) => entry.id === match.entryId) : -1
                if (existingIndex >= 0) {
                    const existing = draft.entries[existingIndex]
                    if (!existing) continue
                    const conflict = progressConflict(existing, incoming, importId)
                    if (conflict || match.confidence === 'medium') { draft.conflicts.push(conflict ?? { createdAt: Date.now(), existingEntryId: existing.id, id: randomUUID(), importId, incomingEntry: incoming, kind: 'possible-match', reason: 'Correspondance possible à confirmer.', resolution: null, resolvedAt: null }); conflicts += 1 }
                    else { draft.entries[existingIndex] = mergeWatchEntries(existing, incoming); ignoredDuplicates += 1 }
                } else { draft.entries.push(incoming); importedCount += 1 }
            }
            const record = draft.imports.find((entry) => entry.id === importId); if (record) Object.assign(record, { committedAt: Date.now(), conflicts, ignoredDuplicates, importedCount, status: 'committed' as const })
        })
        this.#pending.delete(importId)
        return { conflicts, ignoredDuplicates, importId, importedCount, success: true }
    }
    async cancelImport(importId: string) { this.#pending.delete(importId); await this.#repository.update((draft) => { const record = draft.imports.find((entry) => entry.id === importId); if (record) record.status = 'cancelled' }); return true }
    async imports() { return (await this.#repository.read()).imports }
    async conflicts() { return (await this.#repository.read()).conflicts.filter((entry) => !entry.resolution) }
    async resolveConflict(id: string, resolution: WatchConflictResolution) { const snapshot = await this.#repository.update((draft) => { const conflict = draft.conflicts.find((entry) => entry.id === id); if (!conflict) throw new Error('Conflit inconnu.'); const index = draft.entries.findIndex((entry) => entry.id === conflict.existingEntryId); if (resolution === 'use-incoming' && index >= 0) draft.entries[index] = { ...conflict.incomingEntry, manuallyEdited: true }; else if (resolution === 'keep-separate') draft.entries.push({ ...conflict.incomingEntry, id: `${conflict.incomingEntry.id}:${randomUUID().slice(0, 8)}` }); else if (resolution === 'merged' && index >= 0 && draft.entries[index]) draft.entries[index] = { ...mergeWatchEntries(draft.entries[index], conflict.incomingEntry), manuallyEdited: true }; conflict.resolution = resolution; conflict.resolvedAt = Date.now() }); return snapshot.conflicts.find((entry) => entry.id === id) }
    providers() { return WATCH_PROVIDERS }
    async stats() { return calculateWatchStats((await this.#repository.read()).entries) }
    async exportHistory(profileName = 'Default') { const entries = (await this.#repository.read()).entries.filter((entry) => entry.profileName === profileName); const payload: NexusWatchHistoryExport = { entries, exportedAt: Date.now(), metadata: { application: 'NEXUS AI' }, profile: profileName, provider: 'nexus', schemaVersion: 1 }; return this.#exportWriter(`nexus-watch-history-${profileName.replace(/[^a-z0-9_-]+/gi, '-')}.json`, JSON.stringify(payload, null, 2)) }

    async recordVlcLaunch(item: DetectedMedia, profileName = 'Default') { return this.#upsertTracked(createWatchEntry({ automatic: true, mediaType: item.type === 'film' ? 'movie' : item.type === 'series' ? 'episode' : 'unknown', precision: 'unknown', profileName, provider: 'vlc', providerEntryId: item.id, status: 'unknown', title: item.title, watchedAt: Date.now() })) }
    async recordLocalProgress(item: DetectedMedia, positionSeconds: number, durationSeconds: number | null, profileName = 'Default') { return this.#upsertTracked(createWatchEntry({ automatic: true, durationSeconds, mediaType: item.type === 'film' ? 'movie' : item.type === 'series' ? 'episode' : 'unknown', positionSeconds, precision: 'exact', profileName, provider: 'nexus-local', providerEntryId: item.id, status: completionStatus(positionSeconds, durationSeconds), title: item.title, watchedAt: Date.now() })) }
    async #upsertTracked(incoming: WatchEntry) {
        const snapshot = await this.#repository.update((draft) => {
            const match = matchWatchEntry(incoming, draft.entries)
            const index = match.entryId ? draft.entries.findIndex((entry) => entry.id === match.entryId) : -1
            const existing = index >= 0 ? draft.entries[index] : undefined
            if (!existing) {
                draft.entries.push(incoming)
                return
            }

            const merged = mergeWatchEntries(existing, incoming)
            draft.entries[index] = existing.manuallyEdited
                ? merged
                : incoming.progress.precision !== 'exact'
                    ? { ...merged, status: incoming.status, watchedAt: incoming.watchedAt }
                : {
                    ...merged,
                    lastProgressAt: incoming.lastProgressAt,
                    progress: incoming.progress,
                    status: incoming.status,
                    updatedAt: incoming.updatedAt,
                    watchedAt: incoming.watchedAt,
                }
        })
        return snapshot.entries.find((entry) => entry.id === incoming.id) ?? incoming
    }
}
