import { randomUUID } from 'node:crypto'

import { SYNC_PLAN_TTL_MS } from '../../../src/features/watch-connectors/connector.constants.js'
import { nexusStatusFromRemote, type RemoteMediaEntry, type WatchConnectorId, type WatchSyncConflict, type WatchSyncDirection, type WatchSyncOperation, type WatchSyncOperationType, type WatchSyncPlan, type WatchSyncPlanSummary } from '../../../src/features/watch-connectors/connector.types.js'
import type { WatchEntry } from '../../../src/features/watch-tracking/watch.types.js'
import { matchRemoteWatchEntry } from './watch-sync-matcher.js'

function emptySummary(): WatchSyncPlanSummary { return { conflicts: 0, createLocal: 0, createRemote: 0, skipped: 0, unchanged: 0, unmatched: 0, updateLocal: 0, updateRemote: 0 } }

function localEpisodeProgress(entry: WatchEntry) {
    const saved = entry.metadata.remoteProgress
    if (typeof saved === 'number' && Number.isInteger(saved) && saved >= 0) return saved
    return entry.episodeNumber
}

function differs(local: WatchEntry, remote: RemoteMediaEntry) {
    const statusDiffers = local.status !== nexusStatusFromRemote(remote.status)
    const localProgress = localEpisodeProgress(local)
    const progressDiffers = localProgress !== null && remote.progress !== null && localProgress !== remote.progress
    return { localProgress, progressDiffers, statusDiffers }
}

function operation(type: WatchSyncOperationType, reason: string, remoteEntry: RemoteMediaEntry | null, localEntry: WatchEntry | null, confidence: WatchSyncOperation['confidence'], included = true, conflictId: string | null = null): WatchSyncOperation {
    return { attempt: 0, confidence, conflictId, error: null, id: randomUUID(), included, localEntry, reason, remoteEntry, result: null, state: included ? 'pending' : 'excluded', timestamp: null, type }
}

function conflict(type: WatchSyncConflict['type'], local: WatchEntry, remote: RemoteMediaEntry, localValue: string | number | null, remoteValue: string | number | null, confidence: WatchSyncConflict['confidence']): WatchSyncConflict {
    return { confidence, id: randomUUID(), localEntryId: local.id, localUpdatedAt: local.updatedAt, localValue, recommendation: local.manuallyEdited ? 'keep-local' : null, remoteEntryId: remote.providerEntryId, remoteUpdatedAt: remote.updatedAt, remoteValue, resolution: null, type }
}

function includeRemote(remote: RemoteMediaEntry, local: WatchEntry, direction: WatchSyncDirection, confidence: WatchSyncOperation['confidence']) {
    const comparison = differs(local, remote)
    if (!comparison.progressDiffers && !comparison.statusDiffers) return { conflicts: [] as WatchSyncConflict[], operations: [operation('skip', 'Aucune différence.', remote, local, confidence, false)] }

    if (local.manuallyEdited) {
        const value = comparison.progressDiffers ? comparison.localProgress : local.status
        const remoteValue = comparison.progressDiffers ? remote.progress : remote.status
        const item = conflict('local-manual-edit', local, remote, value, remoteValue, confidence)
        return { conflicts: [item], operations: [operation('conflict', 'La correction manuelle locale est protégée.', remote, local, confidence, false, item.id)] }
    }

    if (comparison.progressDiffers) {
        const item = conflict('progress-divergence', local, remote, comparison.localProgress, remote.progress, confidence)
        return { conflicts: [item], operations: [operation('conflict', 'Les progressions locale et distante divergent.', remote, local, confidence, false, item.id)] }
    }

    const type = direction === 'push' ? 'update-remote' : direction === 'pull' ? 'update-local' : remote.updatedAt !== null && remote.updatedAt > local.updatedAt ? 'update-local' : 'update-remote'
    return { conflicts: [] as WatchSyncConflict[], operations: [operation(type, type === 'update-local' ? 'Le statut AniList mettra à jour NEXUS.' : 'Le statut NEXUS mettra à jour AniList.', remote, local, confidence)] }
}

export class WatchSyncPlanner {
    build(options: { connectorId: WatchConnectorId; direction: WatchSyncDirection; localEntries: readonly WatchEntry[]; profileName: string; remoteEntries: readonly RemoteMediaEntry[]; now?: number }): { conflicts: WatchSyncConflict[]; plan: WatchSyncPlan } {
        const now = options.now ?? Date.now()
        const operations: WatchSyncOperation[] = []
        const conflicts: WatchSyncConflict[] = []
        const matchedLocalIds = new Set<string>()

        for (const remote of options.remoteEntries) {
            const match = matchRemoteWatchEntry(remote, options.localEntries)
            if (!match.entry || match.confidence === 'unmatched') {
                operations.push(operation(options.direction === 'push' ? 'skip' : 'create-local', options.direction === 'push' ? 'Aucune entrée locale à envoyer.' : 'Nouvelle entrée distante à créer dans NEXUS.', remote, null, match.confidence, options.direction !== 'push'))
                continue
            }
            matchedLocalIds.add(match.entry.id)
            if (match.confidence === 'low' || match.confidence === 'medium') {
                const item = conflict('identity-ambiguity', match.entry, remote, match.entry.title, remote.title, match.confidence)
                conflicts.push(item)
                operations.push(operation('unmatched', 'Correspondance incertaine à confirmer manuellement.', remote, match.entry, match.confidence, false, item.id))
                continue
            }
            const planned = includeRemote(remote, match.entry, options.direction, match.confidence)
            conflicts.push(...planned.conflicts)
            operations.push(...planned.operations)
        }

        if (options.direction !== 'pull') {
            for (const local of options.localEntries) {
                if (matchedLocalIds.has(local.id)) continue
                const mediaId = local.externalIds[options.connectorId]
                operations.push(operation(mediaId ? 'create-remote' : 'unmatched', mediaId ? 'Entrée locale associée à créer sur le service.' : 'Aucun identifiant distant fiable : envoi interdit.', null, local, mediaId ? 'exact' : 'unmatched', Boolean(mediaId)))
            }
        }

        const summary = summarize(operations)
        return { conflicts, plan: { connectorId: options.connectorId, createdAt: now, direction: options.direction, expiresAt: now + SYNC_PLAN_TTL_MS, id: randomUUID(), operations, profileName: options.profileName, remoteItemsAnalyzed: options.remoteEntries.length, summary } }
    }
}

export function summarize(operations: readonly WatchSyncOperation[]): WatchSyncPlanSummary {
    const summary = emptySummary()
    for (const item of operations) {
        if (item.type === 'conflict') summary.conflicts += 1
        else if (item.type === 'create-local') summary.createLocal += 1
        else if (item.type === 'create-remote') summary.createRemote += 1
        else if (item.type === 'update-local') summary.updateLocal += 1
        else if (item.type === 'update-remote') summary.updateRemote += 1
        else if (item.type === 'unmatched') summary.unmatched += 1
        else if (item.reason === 'Aucune différence.') summary.unchanged += 1
        else summary.skipped += 1
    }
    return summary
}
