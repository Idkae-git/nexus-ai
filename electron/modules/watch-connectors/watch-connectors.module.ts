import { z } from 'zod'

import type { CommandRegistry } from '../../../src/core/commands/command-registry.js'
import type { NexusCommand } from '../../../src/core/commands/command.types.js'
import { WATCH_CONNECTOR_IDS } from '../../../src/features/watch-connectors/connector.types.js'
import type { WatchConnectorManager } from './watch-connector.manager.js'

const connectorId = z.enum(WATCH_CONNECTOR_IDS)
const direction = z.enum(['pull', 'push', 'bidirectional'])
const syncMode = z.enum(['manual', 'on-launch', 'on-forest-open', 'scheduled', 'after-local-change', 'disabled'])
const planId = z.string().uuid()
const conflictId = z.string().uuid()
const profileName = z.string().trim().min(1).max(80)
const connectorPayload = z.object({ connectorId }).strict()

function parse<T>(schema: z.ZodType<T>, payload: unknown, command: string) { const result = schema.safeParse(payload); if (!result.success) throw new Error(`Payload invalide pour ${command}.`); return result.data }
function none(payload: unknown, command: string) { if (payload !== undefined && payload !== null) throw new Error(`Payload invalide pour ${command}.`) }

export class WatchConnectorsModule {
    readonly #manager: WatchConnectorManager
    readonly #registry: CommandRegistry
    constructor(registry: CommandRegistry, manager: WatchConnectorManager) { this.#registry = registry; this.#manager = manager }

    register() {
        this.#registry.register(this.#read('watch.connectors.list', 'List sanitized watch connector states', (payload) => { none(payload, 'watch.connectors.list'); return this.#manager.list() }))
        this.#registry.register(this.#read('watch.connectors.get', 'Read one sanitized watch connector', (payload) => this.#manager.get(parse(connectorPayload, payload, 'watch.connectors.get').connectorId)))
        this.#registry.register(this.#control('watch.connectors.connect', 'Start official OAuth in the system browser', (payload) => this.#manager.connect(parse(connectorPayload, payload, 'watch.connectors.connect').connectorId)))
        this.#registry.register(this.#sensitive('watch.connectors.disconnect', 'Disconnect a watch connector and optionally remove linked data', (payload) => { const value = parse(z.object({ connectorId, deleteImportedData: z.boolean().optional() }).strict(), payload, 'watch.connectors.disconnect'); return this.#manager.disconnect(value.connectorId, value.deleteImportedData) }))
        this.#registry.register(this.#read('watch.connectors.test', 'Test a connected provider without exposing credentials', (payload) => this.#manager.test(parse(connectorPayload, payload, 'watch.connectors.test').connectorId)))
        this.#registry.register(this.#read('watch.connectors.user', 'Read the connected remote user', (payload) => this.#manager.user(parse(connectorPayload, payload, 'watch.connectors.user').connectorId)))
        this.#registry.register(this.#read('watch.connectors.capabilities', 'Read honest provider capabilities', async (payload) => this.#manager.capabilities(parse(connectorPayload, payload, 'watch.connectors.capabilities').connectorId)))
        this.#registry.register(this.#control('watch.sync.plan', 'Build a read-only watch synchronization plan', (payload) => { const value = parse(z.object({ connectorId, direction, profileName }).strict(), payload, 'watch.sync.plan'); return this.#manager.createPlan(value.connectorId, value.direction, value.profileName) }))
        this.#registry.register(this.#read('watch.sync.preview', 'Read an unexpired synchronization preview', async (payload) => this.#manager.preview(parse(z.object({ syncPlanId: planId }).strict(), payload, 'watch.sync.preview').syncPlanId)))
        this.#registry.register(this.#sensitive('watch.sync.execute', 'Execute only explicitly confirmed synchronization operations', (payload) => { const value = parse(z.object({ confirmedOperationIds: z.array(z.string().uuid()).max(2_000), syncPlanId: planId }).strict(), payload, 'watch.sync.execute'); return this.#manager.execute(value.syncPlanId, value.confirmedOperationIds) }))
        this.#registry.register(this.#control('watch.sync.cancel', 'Cancel the active watch synchronization', async (payload) => this.#manager.cancel(parse(z.object({ syncPlanId: planId }).strict(), payload, 'watch.sync.cancel').syncPlanId)))
        this.#registry.register(this.#read('watch.sync.status', 'Read synchronization progress', async (payload) => { none(payload, 'watch.sync.status'); return this.#manager.status() }))
        this.#registry.register(this.#read('watch.sync.history', 'Read local synchronization history', (payload) => { none(payload, 'watch.sync.history'); return this.#manager.history() }))
        this.#registry.register(this.#read('watch.sync.conflicts', 'Read unresolved synchronization conflicts', (payload) => { none(payload, 'watch.sync.conflicts'); return this.#manager.conflicts() }))
        this.#registry.register(this.#control('watch.sync.resolve', 'Resolve a synchronization conflict', (payload) => { const value = parse(z.object({ conflictId, resolution: z.enum(['keep-local', 'keep-remote', 'merge', 'ignore']) }).strict(), payload, 'watch.sync.resolve'); return this.#manager.resolveConflict(value.conflictId, value.resolution) }))
        this.#registry.register(this.#read('watch.sync.preferences.get', 'Read connector synchronization preferences', (payload) => this.#manager.preferences(parse(connectorPayload, payload, 'watch.sync.preferences.get').connectorId)))
        this.#registry.register(this.#control('watch.sync.preferences.update', 'Update connector synchronization preferences', (payload) => { const value = parse(z.object({ changes: z.object({ direction: direction.optional(), includeDates: z.boolean().optional(), includeProgress: z.boolean().optional(), includeRatings: z.boolean().optional(), includeStatuses: z.boolean().optional(), includeWatchlist: z.boolean().optional(), mode: syncMode.optional(), requirePreview: z.boolean().optional() }).strict(), connectorId }).strict(), payload, 'watch.sync.preferences.update'); return this.#manager.updatePreferences(value.connectorId, value.changes) }))
    }

    #read<TPayload, TResult>(id: string, description: string, execute: NexusCommand<TPayload, TResult>['execute']) { return this.#command(id, 'system.read', 'none', description, execute) }
    #control<TPayload, TResult>(id: string, description: string, execute: NexusCommand<TPayload, TResult>['execute']) { return this.#command(id, 'media.control', 'none', description, execute) }
    #sensitive<TPayload, TResult>(id: string, description: string, execute: NexusCommand<TPayload, TResult>['execute']) { return this.#command(id, 'media.control', 'sensitive', description, execute) }
    #command<TPayload, TResult>(id: string, permission: NexusCommand<TPayload, TResult>['permission'], confirmation: NexusCommand<TPayload, TResult>['confirmation'], description: string, execute: NexusCommand<TPayload, TResult>['execute']): NexusCommand<TPayload, TResult> { return { confirmation, description, execute, id, module: 'media', permission, platforms: ['windows'] } }
}
