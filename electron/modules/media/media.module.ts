import { z } from 'zod'

import type { CommandRegistry } from '../../../src/core/commands/command-registry.js'
import type { NexusCommand } from '../../../src/core/commands/command.types.js'
import type { MediaId } from '../../../src/features/media/media.types.js'
import type { MediaManager } from './media-manager.js'

const mediaIdSchema = z.string().min(10).max(100).refine((value): value is MediaId => /^(local|plex|jellyfin|emby):[a-zA-Z0-9._-]+$/.test(value))
const mediaPayloadSchema = z.object({ mediaId: mediaIdSchema }).strict()
const favoritePayloadSchema = mediaPayloadSchema.extend({ favorite: z.boolean() }).strict()
const progressPayloadSchema = mediaPayloadSchema.extend({ durationMs: z.number().nonnegative().nullable(), positionMs: z.number().nonnegative() }).strict()
const folderPayloadSchema = z.object({ folderId: z.string().regex(/^[a-f0-9]{20}$/) }).strict()
const limitPayloadSchema = z.object({ limit: z.number().int().min(0).max(100).optional() }).strict().optional()

function noPayload(payload: unknown, command: string) {
    if (payload !== undefined && payload !== null) throw new Error(`Payload invalide pour ${command}. Cette commande n'accepte aucun payload.`)
}

function mediaId(payload: unknown, command: string) {
    const result = mediaPayloadSchema.safeParse(payload)
    if (!result.success) throw new Error(`Payload invalide pour ${command}. Un mediaId connu est requis.`)
    return result.data.mediaId
}

export class MediaModule {
    readonly #manager: MediaManager
    readonly #registry: CommandRegistry

    constructor(registry: CommandRegistry, manager: MediaManager) { this.#registry = registry; this.#manager = manager }

    register() {
        this.#registry.register(this.#read('media.folders.list', 'List configured media folders', (payload) => { noPayload(payload, 'media.folders.list'); return this.#manager.folders() }))
        this.#registry.register(this.#control('media.folders.choose', 'Choose local media folders with the native dialog', (payload) => { noPayload(payload, 'media.folders.choose'); return this.#manager.chooseFolders() }))
        this.#registry.register(this.#control('media.folders.remove', 'Remove a configured media folder', (payload) => { const result = folderPayloadSchema.safeParse(payload); if (!result.success) throw new Error('Payload invalide pour media.folders.remove.'); return this.#manager.removeFolder(result.data.folderId) }))
        this.#registry.register(this.#read('media.library.scan', 'Scan configured local media folders', (payload) => { noPayload(payload, 'media.library.scan'); return this.#manager.scan() }))
        this.#registry.register(this.#read('media.library.list', 'List the cached media library', (payload) => { noPayload(payload, 'media.library.list'); return this.#manager.list() }))
        this.#registry.register(this.#read('media.item.get', 'Read a detected media item', (payload) => this.#manager.get(mediaId(payload, 'media.item.get'))))
        this.#registry.register(this.#control('media.item.play', 'Play a detected media item with a trusted local player', (payload) => this.#manager.play(mediaId(payload, 'media.item.play'))))
        this.#registry.register(this.#read('media.players.status', 'Read local media player availability', (payload) => { noPayload(payload, 'media.players.status'); return this.#manager.playerStatus() }))
        this.#registry.register(this.#read('media.favorites.list', 'List favorite media', (payload) => { noPayload(payload, 'media.favorites.list'); return this.#manager.favorites() }))
        this.#registry.register(this.#control('media.favorites.set', 'Update a persisted media favorite', (payload) => { const result = favoritePayloadSchema.safeParse(payload); if (!result.success) throw new Error('Payload invalide pour media.favorites.set.'); return this.#manager.setFavorite(result.data.mediaId, result.data.favorite) }))
        this.#registry.register(this.#read('media.recent.list', 'List media opened from NEXUS', (payload) => { const result = limitPayloadSchema.safeParse(payload); if (!result.success) throw new Error('Payload invalide pour media.recent.list.'); return this.#manager.recent(result.data?.limit) }))
        this.#registry.register(this.#read('media.progress.list', 'List prepared playback progress entries', (payload) => { noPayload(payload, 'media.progress.list'); return this.#manager.progress() }))
        this.#registry.register(this.#control('media.progress.set', 'Persist playback progress for a detected media', (payload) => { const result = progressPayloadSchema.safeParse(payload); if (!result.success) throw new Error('Payload invalide pour media.progress.set.'); return this.#manager.setProgress(result.data.mediaId, result.data.positionMs, result.data.durationMs) }))
    }

    #read<TPayload, TResult>(id: string, description: string, execute: NexusCommand<TPayload, TResult>['execute']) { return this.#command(id, 'system.read', description, execute) }
    #control<TPayload, TResult>(id: string, description: string, execute: NexusCommand<TPayload, TResult>['execute']) { return this.#command(id, 'media.control', description, execute) }
    #command<TPayload, TResult>(id: string, permission: NexusCommand<TPayload, TResult>['permission'], description: string, execute: NexusCommand<TPayload, TResult>['execute']): NexusCommand<TPayload, TResult> {
        return { confirmation: 'none', description, execute, id, module: 'media', permission, platforms: ['windows'] }
    }
}
