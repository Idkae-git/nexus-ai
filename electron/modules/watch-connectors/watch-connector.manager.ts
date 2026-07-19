import { randomUUID } from 'node:crypto'

import { defaultSyncPreference } from '../../../src/features/watch-connectors/connector.constants.js'
import { nexusStatusFromRemote, type RemoteMediaEntry, type WatchConnectorConnection, type WatchConnectorId, type WatchConnectorView, type WatchSyncConflictResolution, type WatchSyncDirection, type WatchSyncOperation, type WatchSyncPlan, type WatchSyncPreference } from '../../../src/features/watch-connectors/connector.types.js'
import type { WatchEntry, WatchProviderId, WatchStatus } from '../../../src/features/watch-tracking/watch.types.js'
import { createWatchEntry } from '../watch-tracking/watch-history-normalizer.js'
import type { WatchHistoryRepository, WatchHistorySnapshot } from '../watch-tracking/watch-history.repository.js'
import { AniListClient, AniListClientError } from './providers/anilist/anilist.client.js'
import { AniListConnector } from './providers/anilist/anilist.connector.js'
import type { WatchConnector, RemotePushChange } from './watch-connector.types.js'
import { WatchAuthService } from './watch-auth.service.js'
import type { SecureCredentialReference } from './watch-credential.types.js'
import { WatchConnectorConfigurationService } from './watch-connector.config.js'
import { WatchConnectorRegistry } from './watch-connector.registry.js'
import { SecureTokenStore } from './secure-token-store.js'
import { WatchSyncExecutor } from './watch-sync-executor.js'
import { summarize, WatchSyncPlanner } from './watch-sync-planner.js'
import type { WatchSyncRepository } from './watch-sync.repository.js'

function defaultConnection(connectorId: WatchConnectorId, status: WatchConnectorConnection['status']): WatchConnectorConnection { return { connectorId, error: null, expiresAt: null, lastSyncAt: null, secureCredentialReference: null, status, user: null } }
function publicConnection(connection: WatchConnectorConnection): WatchConnectorView['connection'] { const { secureCredentialReference: _secretReference, ...view } = connection; return view }
function remoteStatus(status: WatchStatus): RemoteMediaEntry['status'] { if (status === 'completed') return 'completed'; if (status === 'dropped') return 'dropped'; if (status === 'planned') return 'planning'; if (status === 'in-progress') return 'current'; return 'unknown' }
function reference(connectorId: WatchConnectorId, key: string): SecureCredentialReference { return { connectorId, key } }

export class WatchConnectorManager {
    readonly #auth: WatchAuthService
    readonly #configuration: WatchConnectorConfigurationService
    readonly #history: WatchHistoryRepository
    readonly #registry: WatchConnectorRegistry
    readonly #repository: WatchSyncRepository
    readonly #tokens: SecureTokenStore
    readonly #planner = new WatchSyncPlanner()
    readonly #executor = new WatchSyncExecutor()
    readonly #plans = new Map<string, WatchSyncPlan>()
    #active: { controller: AbortController; planId: string } | null = null

    constructor(options: { auth: WatchAuthService; configuration: WatchConnectorConfigurationService; history: WatchHistoryRepository; registry: WatchConnectorRegistry; repository: WatchSyncRepository; tokens: SecureTokenStore }) { this.#auth = options.auth; this.#configuration = options.configuration; this.#history = options.history; this.#registry = options.registry; this.#repository = options.repository; this.#tokens = options.tokens }

    async list(): Promise<WatchConnectorView[]> { const snapshot = await this.#repository.read(); return this.#registry.list().map((definition) => ({ ...definition, connection: publicConnection(snapshot.connections[definition.id] ?? defaultConnection(definition.id, this.#initialStatus(definition.id))) })) }
    async get(id: WatchConnectorId) { const connector = (await this.list()).find((item) => item.id === id); if (!connector) throw new Error('Connecteur inconnu.'); return connector }
    capabilities(id: WatchConnectorId) { return this.#registry.get(id).capabilities }

    async connect(id: WatchConnectorId) {
        if (id !== 'anilist') throw new Error(id === 'simkl' ? 'Le connecteur Simkl est préparé mais pas activé dans cette version.' : 'Ce connecteur n’est pas encore implémenté.')
        if (!this.#configuration.isConfigured(id)) throw new Error('Configuration OAuth AniList requise. Consultez .env.example.')
        await this.#setConnection(id, { error: null, status: 'connecting' })
        try {
            const credential = await this.#auth.authenticateAniList(this.#configuration.get(id))
            const secureReference = await this.#tokens.save(id, credential)
            const connector = new AniListConnector(this.#registry.get(id), new AniListClient(credential.accessToken))
            const user = await connector.getCurrentUser()
            await this.#setConnection(id, { error: null, expiresAt: credential.expiresAt, secureCredentialReference: secureReference.key, status: 'connected', user })
            return this.get(id)
        } catch (error) {
            await this.#tokens.delete(id)
            await this.#setConnection(id, { error: error instanceof Error ? error.message : 'Connexion AniList impossible.', expiresAt: null, secureCredentialReference: null, status: 'error', user: null })
            throw error
        }
    }

    async disconnect(id: WatchConnectorId, deleteImportedData = false) {
        this.#auth.cancel(id)
        if (this.#active) this.#active.controller.abort()
        await this.#tokens.delete(id)
        await this.#setConnection(id, { error: null, expiresAt: null, secureCredentialReference: null, status: this.#initialStatus(id), user: null })
        if (deleteImportedData) await this.#history.update((draft) => { draft.entries = draft.entries.filter((entry) => entry.primaryProvider !== id); draft.identities = draft.identities.map((identity) => ({ ...identity, entryIds: identity.entryIds.filter((entryId) => draft.entries.some((entry) => entry.id === entryId)) })).filter((identity) => identity.entryIds.length > 0) })
        return this.get(id)
    }

    async test(id: WatchConnectorId) { return this.#withAuthenticationState(id, async () => (await this.#connector(id)).testConnection()) }
    async user(id: WatchConnectorId) { return this.#withAuthenticationState(id, async () => (await this.#connector(id)).getCurrentUser()) }

    async createPlan(id: WatchConnectorId, direction: WatchSyncDirection, profileName: string) {
        return this.#withAuthenticationState(id, async () => {
            const connector = await this.#connector(id)
            const remoteEntries = await connector.pullHistory()
            const localEntries = (await this.#history.read()).entries.filter((entry) => entry.profileName === profileName)
            const { conflicts, plan } = this.#planner.build({ connectorId: id, direction, localEntries, profileName, remoteEntries })
            this.#plans.set(plan.id, plan)
            await this.#repository.update((draft) => { draft.conflicts.unshift(...conflicts); draft.conflicts = draft.conflicts.slice(0, 500) })
            return plan
        })
    }
    preview(planId: string) { const plan = this.#plans.get(planId); if (!plan) throw new Error('Plan de synchronisation inconnu ou expiré.'); if (Date.now() > plan.expiresAt) { this.#plans.delete(planId); throw new Error('Le plan de synchronisation a expiré.'); } return structuredClone(plan) }

    async execute(planId: string, confirmedOperationIds: readonly string[]) {
        if (this.#active) throw new Error('Une synchronisation est déjà en cours.')
        const plan = this.preview(planId)
        const connector = await this.#connector(plan.connectorId)
        const connection = (await this.#repository.read()).connections[plan.connectorId]
        const controller = new AbortController(); this.#active = { controller, planId }
        const startedAt = Date.now()
        try {
            const execution = await this.#executor.execute(plan, confirmedOperationIds, {
                applyLocal: (operations) => this.#applyLocal(operations, plan.profileName),
                applyRemote: (operation, signal) => this.#applyRemote(connector, operation, signal),
            }, controller.signal)
            plan.operations = execution.operations
            this.#plans.set(plan.id, plan)
            if (execution.operations.some((item) => item.error?.includes('Authentification AniList'))) { await this.#tokens.delete(plan.connectorId); await this.#setConnection(plan.connectorId, { error: 'Authentification AniList expirée ou invalide.', secureCredentialReference: null, status: 'expired' }) }
            await this.#repository.update((draft) => {
                const current = draft.connections[plan.connectorId] ?? defaultConnection(plan.connectorId, 'connected')
                draft.connections[plan.connectorId] = { ...current, lastSyncAt: execution.result.completedAt }
                draft.history.unshift({ ...execution.result, direction: plan.direction, errors: execution.operations.flatMap((item) => item.error ? [item.error] : []), id: randomUUID(), remoteUser: connection?.user?.displayName ?? null, startedAt, summary: `${execution.result.succeeded} réussie(s), ${execution.result.failed} échec(s).` })
                draft.history = draft.history.slice(0, 100)
            })
            return { ...execution.result, operations: execution.operations }
        } finally { this.#active = null }
    }

    cancel(planId: string) { if (!this.#active || this.#active.planId !== planId) return false; this.#active.controller.abort(); return true }
    status() { return this.#executor.getStatus() }
    async history() { return (await this.#repository.read()).history }
    async conflicts() { return (await this.#repository.read()).conflicts.filter((item) => !item.resolution) }
    async resolveConflict(id: string, resolution: WatchSyncConflictResolution) {
        const snapshot = await this.#repository.update((draft) => { const item = draft.conflicts.find((conflict) => conflict.id === id); if (!item) throw new Error('Conflit de synchronisation inconnu.'); item.resolution = resolution })
        for (const plan of this.#plans.values()) {
            const operation = plan.operations.find((item) => item.conflictId === id)
            if (!operation) continue
            if (resolution === 'ignore') { operation.included = false; operation.state = 'excluded'; operation.type = 'skip'; operation.reason = 'Conflit ignoré explicitement.' }
            else { operation.included = true; operation.state = 'pending'; operation.type = resolution === 'keep-local' ? 'update-remote' : 'update-local'; operation.reason = resolution === 'keep-local' ? 'Résolution explicite : conserver la valeur locale.' : resolution === 'merge' ? 'Résolution explicite : fusion prudente vers NEXUS.' : 'Résolution explicite : conserver la valeur distante.' }
            plan.summary = summarize(plan.operations)
        }
        return snapshot.conflicts.find((item) => item.id === id)
    }
    async preferences(id: WatchConnectorId) { return (await this.#repository.read()).preferences[id] ?? defaultSyncPreference(id) }
    async updatePreferences(id: WatchConnectorId, changes: Partial<Omit<WatchSyncPreference, 'connectorId'>>) { const current = await this.preferences(id); const next = { ...current, ...changes, connectorId: id }; await this.#repository.update((draft) => { draft.preferences[id] = next }); return next }
    dispose() { this.#active?.controller.abort(); for (const id of this.#registry.list().map((item) => item.id)) this.#auth.cancel(id) }

    #initialStatus(id: WatchConnectorId): WatchConnectorConnection['status'] { if (id === 'anilist') return this.#configuration.isConfigured(id) ? 'disconnected' : 'configuration-required'; if (id === 'simkl') return this.#configuration.isConfigured(id) ? 'unsupported' : 'configuration-required'; return 'unsupported' }
    async #setConnection(id: WatchConnectorId, changes: Partial<WatchConnectorConnection>) { await this.#repository.update((draft) => { draft.connections[id] = { ...(draft.connections[id] ?? defaultConnection(id, this.#initialStatus(id))), ...changes, connectorId: id } }) }
    async #connector(id: WatchConnectorId): Promise<WatchConnector> {
        if (id !== 'anilist') throw new Error('Connecteur réseau non implémenté.')
        const connection = (await this.#repository.read()).connections[id]
        if (!connection?.secureCredentialReference) throw new Error('AniList n’est pas connecté.')
        const credential = await this.#tokens.read(reference(id, connection.secureCredentialReference))
        if (!credential) { await this.#setConnection(id, { status: 'expired' }); throw new Error('Le token AniList est absent ou illisible.') }
        if (credential.expiresAt !== null && credential.expiresAt <= Date.now()) { await this.#setConnection(id, { status: 'expired' }); throw new Error('Le token AniList a expiré.') }
        return new AniListConnector(this.#registry.get(id), new AniListClient(credential.accessToken))
    }
    async #withAuthenticationState<T>(id: WatchConnectorId, action: () => Promise<T>) {
        try { return await action() }
        catch (error) {
            if (error instanceof AniListClientError && error.status === 401) { await this.#tokens.delete(id); await this.#setConnection(id, { error: error.message, secureCredentialReference: null, status: 'expired' }) }
            throw error
        }
    }

    async #applyRemote(connector: WatchConnector, operation: WatchSyncOperation, signal: AbortSignal) {
        const local = operation.localEntry; if (!local) throw new Error('Entrée locale absente.')
        const mediaId = operation.remoteEntry?.providerMediaId ?? local.externalIds.anilist
        if (!mediaId) throw new Error('Identifiant AniList fiable absent.')
        const progress = typeof local.metadata.remoteProgress === 'number' ? local.metadata.remoteProgress : local.episodeNumber
        if (progress !== null && operation.remoteEntry?.episodeCount !== null && operation.remoteEntry?.episodeCount !== undefined && progress > operation.remoteEntry.episodeCount) throw new Error('La progression dépasse le nombre d’épisodes AniList.')
        const change: RemotePushChange = { mediaId, progress, score: null, status: remoteStatus(local.status) }
        const result = await connector.pushChange(change, signal)
        return `${result.title} mis à jour sur AniList.`
    }

    async #applyLocal(operations: readonly WatchSyncOperation[], profileName: string) {
        await this.#history.update((draft) => { for (const operation of operations) { const remote = operation.remoteEntry; if (!remote) continue; if (operation.type === 'create-local') draft.entries.push(this.#entryFromRemote(remote, profileName)); else if (operation.type === 'update-local' && operation.localEntry) this.#mergeRemote(draft, operation.localEntry.id, remote) } })
    }
    #entryFromRemote(remote: RemoteMediaEntry, profileName: string) {
        const entry = createWatchEntry({ automatic: true, confidence: 'exact', mediaType: remote.mediaType === 'movie' ? 'movie' : 'anime', precision: 'watched-only', profileName, provider: remote.provider as WatchProviderId, providerEntryId: remote.providerEntryId, status: nexusStatusFromRemote(remote.status), title: remote.title })
        return { ...entry, externalIds: { ...remote.externalIds, [remote.provider]: remote.providerMediaId }, metadata: this.#remoteMetadata(remote), updatedAt: remote.updatedAt ?? entry.updatedAt }
    }
    #mergeRemote(draft: WatchHistorySnapshot, id: string, remote: RemoteMediaEntry) {
        const index = draft.entries.findIndex((entry) => entry.id === id); const current = draft.entries[index]; if (!current || current.manuallyEdited) return
        const hasSource = current.sources.some((source) => source.provider === remote.provider)
        draft.entries[index] = { ...current, externalIds: { ...current.externalIds, ...remote.externalIds, [remote.provider]: remote.providerMediaId }, metadata: { ...current.metadata, ...this.#remoteMetadata(remote) }, providerEntryId: current.providerEntryId ?? remote.providerEntryId, sources: hasSource ? current.sources : [...current.sources, { automatic: true, importedAt: Date.now(), precision: 'watched-only', provider: remote.provider as WatchProviderId, sourceFileName: null, syncedAt: Date.now() }], status: nexusStatusFromRemote(remote.status), updatedAt: Date.now() }
    }
    #remoteMetadata(remote: RemoteMediaEntry): WatchEntry['metadata'] { return { episodeCount: remote.episodeCount, remoteProgress: remote.progress, remoteScore: remote.score, remoteStatus: remote.status, releaseYear: remote.releaseYear } }
}
