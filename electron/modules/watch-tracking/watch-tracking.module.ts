import { z } from 'zod'

import type { CommandRegistry } from '../../../src/core/commands/command-registry.js'
import type { NexusCommand } from '../../../src/core/commands/command.types.js'
import { WATCH_PROVIDER_IDS } from '../../../src/features/watch-tracking/watch.types.js'
import type { WatchProviderId } from '../../../src/features/watch-tracking/watch.types.js'
import type { WatchTrackingManager } from './watch-tracking.manager.js'

const entryId = z.string().min(3).max(160)
const provider = z.enum(WATCH_PROVIDER_IDS)
const importProvider = z.enum(['netflix-import', 'crunchyroll-import', 'manual'])
const status = z.enum(['planned', 'in-progress', 'completed', 'dropped', 'unknown'])
const mediaType = z.enum(['movie', 'series', 'season', 'episode', 'anime', 'unknown'])
const historyQuery = z.object({ filter: z.enum(['all', 'in-progress', 'completed', 'movies', 'series', 'anime', 'netflix-import', 'crunchyroll-import', 'nexus-local', 'vlc', 'manual', 'conflicts', 'exact-progress', 'unknown-progress']).optional(), profileName: z.string().min(1).max(80).optional(), query: z.string().max(200).optional(), sortMode: z.enum(['recently-watched', 'recently-imported', 'title', 'progress', 'source', 'status']).optional() }).strict().optional()
const updateChanges = z.object({ durationSeconds: z.number().nonnegative().nullable().optional(), episodeNumber: z.number().int().nonnegative().nullable().optional(), episodeTitle: z.string().max(300).nullable().optional(), mediaType: mediaType.optional(), positionSeconds: z.number().nonnegative().nullable().optional(), seasonNumber: z.number().int().nonnegative().nullable().optional(), seriesTitle: z.string().max(300).nullable().optional(), status: status.optional(), title: z.string().min(1).max(500).optional(), watchedAt: z.number().nonnegative().nullable().optional() }).strict()

function parse<T>(schema: z.ZodType<T>, payload: unknown, command: string) { const result = schema.safeParse(payload); if (!result.success) throw new Error(`Payload invalide pour ${command}.`); return result.data }
function none(payload: unknown, command: string) { if (payload !== undefined && payload !== null) throw new Error(`Payload invalide pour ${command}.`) }

export class WatchTrackingModule {
    readonly #manager: WatchTrackingManager
    readonly #registry: CommandRegistry
    constructor(registry: CommandRegistry, manager: WatchTrackingManager) { this.#registry = registry; this.#manager = manager }
    register() {
        this.#registry.register(this.#read('watch.history.list', 'List unified watch history', (payload) => this.#manager.history(parse(historyQuery, payload, 'watch.history.list'))))
        this.#registry.register(this.#read('watch.history.get', 'Read a watch entry', (payload) => this.#manager.get(parse(z.object({ watchEntryId: entryId }).strict(), payload, 'watch.history.get').watchEntryId)))
        this.#registry.register(this.#control('watch.history.create', 'Create a manual watch entry', (payload) => { const value = parse(z.object({ mediaType: mediaType.optional(), profileName: z.string().min(1).max(80), title: z.string().min(1).max(500) }).strict(), payload, 'watch.history.create'); return this.#manager.createManual(value.title, value.profileName, value.mediaType) }))
        this.#registry.register(this.#control('watch.history.update', 'Update a watch entry manually', (payload) => { const value = parse(z.object({ changes: updateChanges, watchEntryId: entryId }).strict(), payload, 'watch.history.update'); return this.#manager.update(value.watchEntryId, value.changes) }))
        this.#registry.register(this.#control('watch.history.delete', 'Delete a watch entry after UI confirmation', (payload) => this.#manager.delete(parse(z.object({ watchEntryId: entryId }).strict(), payload, 'watch.history.delete').watchEntryId)))
        this.#registry.register(this.#sensitive('watch.history.delete-provider', 'Delete provider watch history', (payload) => { const value = parse(z.object({ profileName: z.string().min(1).max(80).optional(), provider }).strict(), payload, 'watch.history.delete-provider'); return this.#manager.deleteProvider(value.provider as WatchProviderId, value.profileName) }))
        this.#registry.register(this.#control('watch.history.mark', 'Mark a watch entry', (payload) => { const value = parse(z.object({ status, watchEntryId: entryId }).strict(), payload, 'watch.history.mark'); return this.#manager.mark(value.watchEntryId, value.status) }))
        this.#registry.register(this.#control('watch.progress.update', 'Save exact local watch progress', (payload) => { const value = parse(z.object({ durationSeconds: z.number().positive().nullable(), positionSeconds: z.number().nonnegative(), watchEntryId: entryId }).strict(), payload, 'watch.progress.update'); return this.#manager.progress(value.watchEntryId, value.positionSeconds, value.durationSeconds) }))
        this.#registry.register(this.#control('watch.import.select', 'Select a watch history file securely', (payload) => this.#manager.selectImport(parse(z.object({ provider: importProvider }).strict(), payload, 'watch.import.select').provider)))
        this.#registry.register(this.#control('watch.import.preview', 'Preview a watch history import', (payload) => { const value = parse(z.object({ fileToken: z.string().uuid(), profileName: z.string().min(1).max(80), provider: importProvider }).strict(), payload, 'watch.import.preview'); return this.#manager.previewImport(value.provider, value.fileToken, value.profileName) }))
        this.#registry.register(this.#control('watch.import.commit', 'Commit a previewed watch import', (payload) => this.#manager.commitImport(parse(z.object({ importId: z.string().uuid() }).strict(), payload, 'watch.import.commit').importId)))
        this.#registry.register(this.#read('watch.import.list', 'List watch imports', (payload) => { none(payload, 'watch.import.list'); return this.#manager.imports() }))
        this.#registry.register(this.#control('watch.import.cancel', 'Cancel a watch import preview', (payload) => this.#manager.cancelImport(parse(z.object({ importId: z.string().uuid() }).strict(), payload, 'watch.import.cancel').importId)))
        this.#registry.register(this.#control('watch.export.create', 'Export watch history to NEXUS format', (payload) => this.#manager.exportHistory(parse(z.object({ profileName: z.string().min(1).max(80) }).strict(), payload, 'watch.export.create').profileName)))
        this.#registry.register(this.#read('watch.conflicts.list', 'List unresolved watch conflicts', (payload) => { none(payload, 'watch.conflicts.list'); return this.#manager.conflicts() }))
        this.#registry.register(this.#control('watch.conflicts.resolve', 'Resolve a watch conflict', (payload) => { const value = parse(z.object({ conflictId: z.string().uuid(), resolution: z.enum(['keep-existing', 'use-incoming', 'keep-separate', 'merged']) }).strict(), payload, 'watch.conflicts.resolve'); return this.#manager.resolveConflict(value.conflictId, value.resolution) }))
        this.#registry.register(this.#read('watch.providers.list', 'List watch tracker providers', async (payload) => { none(payload, 'watch.providers.list'); return this.#manager.providers() }))
        this.#registry.register(this.#read('watch.stats.get', 'Read honest watch statistics', (payload) => { none(payload, 'watch.stats.get'); return this.#manager.stats() }))
    }
    #read<TPayload, TResult>(id: string, description: string, execute: NexusCommand<TPayload, TResult>['execute']) { return this.#command(id, 'system.read', 'none', description, execute) }
    #control<TPayload, TResult>(id: string, description: string, execute: NexusCommand<TPayload, TResult>['execute']) { return this.#command(id, 'media.control', 'none', description, execute) }
    #sensitive<TPayload, TResult>(id: string, description: string, execute: NexusCommand<TPayload, TResult>['execute']) { return this.#command(id, 'media.control', 'sensitive', description, execute) }
    #command<TPayload, TResult>(id: string, permission: NexusCommand<TPayload, TResult>['permission'], confirmation: NexusCommand<TPayload, TResult>['confirmation'], description: string, execute: NexusCommand<TPayload, TResult>['execute']): NexusCommand<TPayload, TResult> { return { confirmation, description, execute, id, module: 'media', permission, platforms: ['windows'] } }
}
