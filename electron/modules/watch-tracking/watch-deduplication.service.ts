import type { WatchConflict, WatchEntry, WatchMatchResult } from '../../../src/features/watch-tracking/watch.types.js'
import { createConflictId } from './watch-history-normalizer.js'

function sameDay(left: number | null, right: number | null) { return left !== null && right !== null && Math.floor(left / 86_400_000) === Math.floor(right / 86_400_000) }

export function matchWatchEntry(incoming: WatchEntry, existing: readonly WatchEntry[]): WatchMatchResult {
    const providerMatch = incoming.providerEntryId ? existing.find((entry) => entry.primaryProvider === incoming.primaryProvider && entry.providerEntryId === incoming.providerEntryId && entry.profileName === incoming.profileName) : undefined
    if (providerMatch) return { confidence: 'exact', entryId: providerMatch.id, reasons: ['Identifiant provider et profil identiques.'] }
    const exact = existing.find((entry) => entry.profileName === incoming.profileName && entry.normalizedTitle === incoming.normalizedTitle && entry.seasonNumber === incoming.seasonNumber && entry.episodeNumber === incoming.episodeNumber && sameDay(entry.watchedAt, incoming.watchedAt))
    if (exact) return { confidence: 'high', entryId: exact.id, reasons: ['Titre, saison, épisode, date et profil identiques.'] }
    const possible = existing.find((entry) => entry.profileName === incoming.profileName && entry.normalizedTitle === incoming.normalizedTitle && entry.seasonNumber === incoming.seasonNumber && entry.episodeNumber === incoming.episodeNumber)
    return possible ? { confidence: 'medium', entryId: possible.id, reasons: ['Identité média probable, date différente ou absente.'] } : { confidence: 'unmatched', entryId: null, reasons: [] }
}

export function mergeWatchEntries(existing: WatchEntry, incoming: WatchEntry) {
    if (existing.manuallyEdited) return existing
    const existingExact = existing.progress.precision === 'exact'
    const incomingExact = incoming.progress.precision === 'exact'
    const useIncomingProgress = incomingExact && !existingExact
    const sources = [...existing.sources]
    for (const source of incoming.sources) if (!sources.some((candidate) => candidate.provider === source.provider && candidate.sourceFileName === source.sourceFileName && candidate.importedAt === source.importedAt)) sources.push(source)
    return { ...existing, importedAt: Math.min(existing.importedAt, incoming.importedAt), progress: useIncomingProgress ? incoming.progress : existing.progress, sources, updatedAt: Math.max(existing.updatedAt, incoming.updatedAt), watchedAt: existing.watchedAt ?? incoming.watchedAt }
}

export function progressConflict(existing: WatchEntry, incoming: WatchEntry, importId: string): WatchConflict | null {
    if (existing.manuallyEdited) return { createdAt: Date.now(), existingEntryId: existing.id, id: createConflictId(), importId, incomingEntry: incoming, kind: 'manual-protection', reason: 'Une correction manuelle protège cette entrée.', resolution: null, resolvedAt: null }
    if (existing.progress.precision === 'exact' && incoming.progress.precision !== 'exact') return null
    if (existing.progress.precision === 'exact' && incoming.progress.precision === 'exact' && existing.progress.positionSeconds !== incoming.progress.positionSeconds) return { createdAt: Date.now(), existingEntryId: existing.id, id: createConflictId(), importId, incomingEntry: incoming, kind: 'progress', reason: 'Deux progressions exactes différentes.', resolution: null, resolvedAt: null }
    return null
}
