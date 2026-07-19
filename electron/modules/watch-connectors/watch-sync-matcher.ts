import type { RemoteMediaEntry } from '../../../src/features/watch-connectors/connector.types.js'
import type { WatchConfidence, WatchEntry, WatchMatchResult } from '../../../src/features/watch-tracking/watch.types.js'
import { normalizeWatchTitle } from '../watch-tracking/watch-history-normalizer.js'

export interface RemoteWatchMatch extends WatchMatchResult {
    entry: WatchEntry | null
}

function releaseYear(entry: WatchEntry) {
    const value = entry.metadata.releaseYear
    return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function titles(entry: RemoteMediaEntry) {
    return new Set([entry.title, ...entry.alternativeTitles].map(normalizeWatchTitle).filter(Boolean))
}

function scoreCandidate(remote: RemoteMediaEntry, local: WatchEntry): { confidence: WatchConfidence; reasons: string[] } {
    const remoteTitles = titles(remote)
    const localTitles = [local.title, local.originalTitle, local.seriesTitle].filter((value): value is string => Boolean(value)).map(normalizeWatchTitle)
    const titleMatch = localTitles.some((title) => remoteTitles.has(title))
    if (!titleMatch) return { confidence: 'unmatched', reasons: ['Titre normalisé différent.'] }

    const localYear = releaseYear(local)
    if (localYear !== null && remote.releaseYear !== null && localYear !== remote.releaseYear) return { confidence: 'low', reasons: ['Titre identique mais année différente.'] }

    if (local.seasonNumber !== null && local.seasonNumber > 1) return { confidence: 'medium', reasons: ['Titre compatible, saison locale à confirmer.'] }
    if (remote.releaseYear !== null && localYear === remote.releaseYear) return { confidence: 'high', reasons: ['Titre et année concordent.'] }
    return { confidence: 'medium', reasons: ['Titre concordant sans identifiant ni année commune.'] }
}

export function matchRemoteWatchEntry(remote: RemoteMediaEntry, entries: readonly WatchEntry[]): RemoteWatchMatch {
    const exactId = entries.find((entry) => entry.externalIds[remote.provider] === remote.providerMediaId)
    if (exactId) return { confidence: 'exact', entry: exactId, entryId: exactId.id, reasons: [`Identifiant ${remote.provider} identique.`] }

    const providerEntry = entries.find((entry) => entry.primaryProvider === remote.provider && entry.providerEntryId === remote.providerEntryId)
    if (providerEntry) return { confidence: 'exact', entry: providerEntry, entryId: providerEntry.id, reasons: ['Identifiant d’entrée distante identique.'] }

    let best: { confidence: WatchConfidence; entry: WatchEntry; reasons: string[] } | null = null
    const rank: Record<WatchConfidence, number> = { exact: 5, high: 4, low: 2, medium: 3, unmatched: 1 }
    for (const entry of entries) {
        const candidate = scoreCandidate(remote, entry)
        if (!best || rank[candidate.confidence] > rank[best.confidence]) best = { ...candidate, entry }
    }
    if (!best || best.confidence === 'unmatched') return { confidence: 'unmatched', entry: null, entryId: null, reasons: ['Aucune identité locale suffisamment proche.'] }

    const equallyStrong = entries.filter((entry) => entry.id !== best.entry.id && scoreCandidate(remote, entry).confidence === best.confidence)
    if (equallyStrong.length > 0 && (best.confidence === 'high' || best.confidence === 'medium')) {
        return { confidence: 'medium', entry: best.entry, entryId: best.entry.id, reasons: [...best.reasons, 'Plusieurs candidats locaux sont possibles.'] }
    }
    return { confidence: best.confidence, entry: best.entry, entryId: best.entry.id, reasons: best.reasons }
}
