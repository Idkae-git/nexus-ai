import { createHash, randomUUID } from 'node:crypto'

import type { WatchConfidence, WatchEntry, WatchMediaType, WatchProviderId } from '../../../src/features/watch-tracking/watch.types.js'

const qualityTokens = /\b(?:2160p|1080p|720p|480p|4k|uhd|hdr10?|web[- .]?dl|webrip|bluray|brrip|dvdrip|x26[45]|h\.?26[45]|hevc|aac|dts|proper|repack|multi|vostfr|french)\b/giu
const mediaFileExtension = /\.(?:mp4|mkv|avi|mov|webm|mp3|flac|wav|aac)$/iu
const seasonEpisode = /(?:\bS(?:aison|eason)?\s*0*(\d{1,3})\s*E(?:pisode|pisode)?\s*0*(\d{1,4})\b)|(?:\b0*(\d{1,3})x0*(\d{1,4})\b)/iu
const seasonLabel = /\b(?:season|saison)\s*0*(\d{1,3})\b/iu
const episodeLabel = /\b(?:episode|épisode)\s*0*(\d{1,4})\b/iu

export function normalizeWatchTitle(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(mediaFileExtension, ' ')
        .replace(qualityTokens, ' ')
        .replace(/\b(?:19|20)\d{2}\b/g, ' ')
        .replace(/[._:[\](){}'"!?–—-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleLowerCase()
}

export function extractWatchIdentity(title: string) {
    const match = seasonEpisode.exec(title)
    const seasonNumber = Number(match?.[1] ?? match?.[3] ?? seasonLabel.exec(title)?.[1] ?? '') || null
    const episodeNumber = Number(match?.[2] ?? match?.[4] ?? episodeLabel.exec(title)?.[1] ?? '') || null
    const seriesTitle = title
        .replace(mediaFileExtension, ' ')
        .replace(seasonEpisode, ' ')
        .replace(seasonLabel, ' ')
        .replace(episodeLabel, ' ')
        .replace(qualityTokens, ' ')
        .replace(/[._:-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    return { episodeNumber, normalizedTitle: normalizeWatchTitle(seriesTitle || title), seasonNumber, seriesTitle: seriesTitle || null }
}

export function stableWatchEntryId(provider: WatchProviderId, parts: readonly (string | number | null)[]) {
    const digest = createHash('sha256').update(parts.map((part) => part ?? '').join('|').toLocaleLowerCase()).digest('hex').slice(0, 24)
    return `${provider}:${digest}`
}

export function createWatchEntry(options: {
    automatic: boolean
    confidence?: WatchConfidence
    durationSeconds?: number | null
    episodeNumber?: number | null
    episodeTitle?: string | null
    importedAt?: number
    mediaType?: WatchMediaType
    originalTitle?: string | null
    positionSeconds?: number | null
    precision: WatchEntry['progress']['precision']
    profileName: string
    provider: WatchProviderId
    providerEntryId?: string | null
    seasonNumber?: number | null
    seriesTitle?: string | null
    sourceFileName?: string | null
    status?: WatchEntry['status']
    title: string
    watchedAt?: number | null
}) : WatchEntry {
    const now = options.importedAt ?? Date.now()
    const extracted = extractWatchIdentity(options.seriesTitle ?? options.title)
    const seasonNumber = options.seasonNumber ?? extracted.seasonNumber
    const episodeNumber = options.episodeNumber ?? extracted.episodeNumber
    const seriesTitle = options.seriesTitle ?? (seasonNumber !== null || episodeNumber !== null ? extracted.seriesTitle : null)
    const position = options.positionSeconds ?? null
    const duration = options.durationSeconds ?? null
    const percent = position !== null && duration !== null && duration > 0 ? Math.min(100, Math.max(0, position / duration * 100)) : null
    const watchedAt = options.watchedAt ?? null
    return {
        confidence: options.confidence ?? (options.providerEntryId ? 'exact' : 'high'),
        episodeNumber,
        episodeTitle: options.episodeTitle ?? null,
        externalIds: {},
        id: stableWatchEntryId(options.provider, [options.providerEntryId ?? null, options.profileName, options.title, watchedAt, seasonNumber, episodeNumber]),
        importedAt: now,
        lastProgressAt: position !== null ? now : null,
        manuallyEdited: false,
        mediaType: options.mediaType ?? (episodeNumber !== null ? 'episode' : 'unknown'),
        metadata: {},
        normalizedTitle: normalizeWatchTitle(seriesTitle ?? options.title),
        originalTitle: options.originalTitle ?? null,
        primaryProvider: options.provider,
        profileName: options.profileName,
        progress: { durationSeconds: duration, percent, positionSeconds: position, precision: options.precision, updatedAt: position !== null ? now : null },
        providerEntryId: options.providerEntryId ?? null,
        seasonNumber,
        seriesTitle,
        sources: [{ automatic: options.automatic, importedAt: now, precision: options.precision, provider: options.provider, sourceFileName: options.sourceFileName ?? null, syncedAt: now }],
        status: options.status ?? 'unknown',
        title: options.title.trim(),
        updatedAt: now,
        watchedAt,
    }
}

export function createConflictId() { return randomUUID() }
