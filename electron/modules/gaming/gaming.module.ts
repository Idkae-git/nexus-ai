import { z } from 'zod'

import type { CommandRegistry } from '../../../src/core/commands/command-registry.js'
import type { NexusCommand } from '../../../src/core/commands/command.types.js'
import { GAME_PROVIDER_IDS, LAUNCHER_IDS } from '../../../src/features/gaming/gaming.types.js'
import type { GameId, LauncherId } from '../../../src/features/gaming/gaming.types.js'
import type { GamingManager } from './gaming-manager.js'

const gameIdSchema = z.string().refine((value): value is GameId => {
    const separator = value.indexOf(':')
    return separator > 0 && GAME_PROVIDER_IDS.includes(value.slice(0, separator) as typeof GAME_PROVIDER_IDS[number]) && value.length <= 180
}, 'A known provider-prefixed gameId is required.')
const gamePayloadSchema = z.object({ gameId: gameIdSchema }).strict()
const launcherPayloadSchema = z.object({ launcherId: z.enum(LAUNCHER_IDS) }).strict()
const favoritePayloadSchema = gamePayloadSchema.extend({ favorite: z.boolean() }).strict()
const limitPayloadSchema = z.object({ limit: z.number().int().min(0).max(100).optional() }).strict().optional()
const sessionPayloadSchema = z.object({ sessionId: z.string().min(1).max(100) }).strict()

function noPayload(payload: unknown, command: string) {
    if (payload !== undefined && payload !== null) throw new Error(`Invalid payload for ${command}. No payload is accepted.`)
}

function parseGameId(payload: unknown, command: string) {
    const result = gamePayloadSchema.safeParse(payload)
    if (!result.success) throw new Error(`Invalid payload for ${command}. A provider-prefixed gameId is required.`)
    return result.data.gameId
}

export class GamingModule {
    readonly #registry: CommandRegistry
    readonly #manager: GamingManager

    constructor(registry: CommandRegistry, manager: GamingManager) {
        this.#registry = registry
        this.#manager = manager
    }

    register() {
        this.#registry.register(this.#read('gaming.launchers.scan', 'Scan supported game launchers', (payload) => { noPayload(payload, 'gaming.launchers.scan'); return this.#manager.scanLaunchers() }))
        this.#registry.register(this.#read('gaming.launchers.list', 'List supported game launchers', (payload) => { noPayload(payload, 'gaming.launchers.list'); return this.#manager.listLaunchers() }))
        this.#registry.register(this.#read('gaming.launchers.refresh-status', 'Refresh launcher runtime status', (payload) => { noPayload(payload, 'gaming.launchers.refresh-status'); return this.#manager.refreshLauncherStatuses() }))
        this.#registry.register(this.#manageLauncher())
        this.#registry.register(this.#read('gaming.library.scan', 'Scan local game provider catalogs', (payload) => { noPayload(payload, 'gaming.library.scan'); return this.#manager.scanLibrary() }))
        this.#registry.register(this.#read('gaming.library.list', 'List cached detected games', (payload) => { noPayload(payload, 'gaming.library.list'); return this.#manager.listGames() }))
        this.#registry.register(this.#read('gaming.game.get', 'Read one detected game', (payload) => this.#manager.getGame(parseGameId(payload, 'gaming.game.get'))))
        this.#registry.register(this.#launchGame())
        this.#registry.register(this.#closeGame())
        this.#registry.register(this.#read('gaming.game.refresh-status', 'Refresh targeted game process statuses', (payload) => { noPayload(payload, 'gaming.game.refresh-status'); return this.#manager.refreshGameStatuses() }))
        this.#registry.register(this.#favoriteSet())
        this.#registry.register(this.#read('gaming.favorites.list', 'List favorite games', (payload) => { noPayload(payload, 'gaming.favorites.list'); return this.#manager.favorites() }))
        this.#registry.register(this.#read('gaming.recent.list', 'List games launched from NEXUS', (payload) => this.#manager.recent(this.#limit(payload, 'gaming.recent.list'))))
        this.#registry.register(this.#read('gaming.sessions.list', 'List tracked NEXUS gaming sessions', (payload) => this.#manager.sessions(this.#limit(payload, 'gaming.sessions.list'))))
        this.#registry.register(this.#read('gaming.sessions.active', 'List active tracked gaming sessions', (payload) => { noPayload(payload, 'gaming.sessions.active'); return Promise.resolve(this.#manager.activeSessions()) }))
        this.#registry.register(this.#stopTracking())
    }

    #manageLauncher(): NexusCommand<{ launcherId: LauncherId }, unknown> {
        return this.#command('gaming.launcher.open', 'gaming.launch', 'Open a detected game launcher', (payload) => {
            const result = launcherPayloadSchema.safeParse(payload)
            if (!result.success) throw new Error('Invalid payload for gaming.launcher.open.')
            return this.#manager.openLauncher(result.data.launcherId)
        })
    }

    #launchGame(): NexusCommand<{ gameId: GameId }, unknown> {
        return this.#command('gaming.game.launch', 'gaming.launch', 'Launch a detected game with its trusted provider strategy', (payload) => this.#manager.launchGame(parseGameId(payload, 'gaming.game.launch')))
    }

    #closeGame(): NexusCommand<{ gameId: GameId }, unknown> {
        return this.#command('gaming.game.close', 'gaming.manage', 'Soft-close explicitly associated game processes', (payload) => this.#manager.closeGame(parseGameId(payload, 'gaming.game.close')))
    }

    #favoriteSet(): NexusCommand<{ favorite: boolean; gameId: GameId }, unknown> {
        return this.#command('gaming.favorites.set', 'gaming.manage', 'Update a persisted game favorite', (payload) => {
            const result = favoritePayloadSchema.safeParse(payload)
            if (!result.success) throw new Error('Invalid payload for gaming.favorites.set.')
            return this.#manager.setFavorite(result.data.gameId, result.data.favorite)
        })
    }

    #stopTracking(): NexusCommand<{ sessionId: string }, unknown> {
        return this.#command('gaming.sessions.stop-tracking', 'gaming.manage', 'Stop tracking a NEXUS gaming session without closing the game', (payload) => {
            const result = sessionPayloadSchema.safeParse(payload)
            if (!result.success) throw new Error('Invalid payload for gaming.sessions.stop-tracking.')
            return this.#manager.stopTracking(result.data.sessionId)
        })
    }

    #limit(payload: unknown, command: string) {
        const result = limitPayloadSchema.safeParse(payload)
        if (!result.success) throw new Error(`Invalid payload for ${command}.`)
        return result.data?.limit
    }

    #read<TPayload, TResult>(id: string, description: string, execute: NexusCommand<TPayload, TResult>['execute']) {
        return this.#command(id, 'system.read', description, execute)
    }

    #command<TPayload, TResult>(
        id: string,
        permission: NexusCommand<TPayload, TResult>['permission'],
        description: string,
        execute: NexusCommand<TPayload, TResult>['execute'],
    ): NexusCommand<TPayload, TResult> {
        return { confirmation: 'none', description, execute, id, module: 'gaming', permission, platforms: ['windows'] }
    }
}
