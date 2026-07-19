import type { WatchSyncOperation, WatchSyncPlan, WatchSyncResult, WatchSyncStatus } from '../../../src/features/watch-connectors/connector.types.js'

export interface WatchSyncExecutionHandlers {
    applyLocal(operations: readonly WatchSyncOperation[]): Promise<void>
    applyRemote(operation: WatchSyncOperation, signal: AbortSignal): Promise<string>
}

export interface WatchSyncExecution {
    operations: WatchSyncOperation[]
    result: WatchSyncResult
}

export class WatchSyncExecutor {
    readonly #status: WatchSyncStatus = { completed: 0, currentItem: null, errors: 0, rateLimitedUntil: null, running: false, syncPlanId: null, total: 0 }
    getStatus() { return { ...this.#status } }

    async execute(plan: WatchSyncPlan, confirmedOperationIds: readonly string[], handlers: WatchSyncExecutionHandlers, signal: AbortSignal): Promise<WatchSyncExecution> {
        if (Date.now() > plan.expiresAt) throw new Error('Le plan de synchronisation a expiré. Créez un nouvel aperçu.')
        const confirmed = new Set(confirmedOperationIds)
        const knownOperationIds = new Set(plan.operations.map((item) => item.id))
        if (confirmedOperationIds.some((id) => !knownOperationIds.has(id))) throw new Error('Le plan contient un identifiant d’opération inconnu.')
        const operations: WatchSyncOperation[] = structuredClone(plan.operations).map((item) => ({ ...item, included: item.included && confirmed.has(item.id), state: item.included && confirmed.has(item.id) ? 'pending' : 'excluded' }))
        const selected = operations.filter((item) => item.included && ['create-local', 'update-local', 'create-remote', 'update-remote'].includes(item.type))
        Object.assign(this.#status, { completed: 0, currentItem: null, errors: 0, rateLimitedUntil: null, running: true, syncPlanId: plan.id, total: selected.length })
        const local: WatchSyncOperation[] = []
        try {
            for (const item of selected) {
                if (signal.aborted) { item.state = 'cancelled'; continue }
                item.attempt += 1; item.state = 'running'; item.timestamp = Date.now(); this.#status.currentItem = item.remoteEntry?.title ?? item.localEntry?.title ?? null
                if (item.type === 'create-local' || item.type === 'update-local') { local.push(item); continue }
                try { item.result = await handlers.applyRemote(item, signal); item.state = 'success' }
                catch (error) { item.error = error instanceof Error ? error.message : 'Erreur distante inconnue.'; item.state = signal.aborted ? 'cancelled' : 'failed'; this.#status.errors += 1 }
                this.#status.completed += 1
            }
            if (!signal.aborted && local.length > 0) {
                try { await handlers.applyLocal(local); for (const item of local) { item.result = 'Mise à jour locale enregistrée.'; item.state = 'success'; this.#status.completed += 1 } }
                catch (error) { for (const item of local) { item.error = error instanceof Error ? error.message : 'Erreur locale inconnue.'; item.state = 'failed'; this.#status.completed += 1; this.#status.errors += 1 } }
            } else if (signal.aborted) for (const item of local) item.state = 'cancelled'
        } finally { Object.assign(this.#status, { currentItem: null, running: false }) }
        const succeeded = operations.filter((item) => item.state === 'success').length
        const failed = operations.filter((item) => item.state === 'failed').length
        return { operations, result: { cancelled: signal.aborted, completedAt: Date.now(), connectorId: plan.connectorId, failed, planId: plan.id, succeeded, total: selected.length } }
    }
}
