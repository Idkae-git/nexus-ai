import { z } from 'zod'

import { WATCH_PROVIDER_IDS } from '../../../../../src/features/watch-tracking/watch.types.js'
import type { NexusWatchHistoryExport } from '../../../../../src/features/watch-tracking/watch.types.js'
import type { ParsedWatchImport } from '../../watch-import.types.js'

const sourceSchema = z.object({ automatic: z.boolean(), importedAt: z.number(), precision: z.enum(['exact', 'estimated', 'watched-only', 'unknown']), provider: z.enum(WATCH_PROVIDER_IDS), sourceFileName: z.string().nullable(), syncedAt: z.number() }).strict()
const progressSchema = z.object({ durationSeconds: z.number().nonnegative().nullable(), percent: z.number().min(0).max(100).nullable(), positionSeconds: z.number().nonnegative().nullable(), precision: z.enum(['exact', 'estimated', 'watched-only', 'unknown']), updatedAt: z.number().nullable() }).strict()
const entrySchema = z.object({
    confidence: z.enum(['exact', 'high', 'medium', 'low', 'unmatched']), episodeNumber: z.number().int().nonnegative().nullable(), episodeTitle: z.string().nullable(), externalIds: z.record(z.string(), z.string()), id: z.string().min(3), importedAt: z.number(), lastProgressAt: z.number().nullable(), manuallyEdited: z.boolean(), mediaType: z.enum(['movie', 'series', 'season', 'episode', 'anime', 'unknown']), metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])), normalizedTitle: z.string(), originalTitle: z.string().nullable(), primaryProvider: z.enum(WATCH_PROVIDER_IDS), profileName: z.string().min(1), progress: progressSchema, providerEntryId: z.string().nullable(), seasonNumber: z.number().int().nonnegative().nullable(), seriesTitle: z.string().nullable(), sources: z.array(sourceSchema).min(1), status: z.enum(['planned', 'in-progress', 'completed', 'dropped', 'unknown']), title: z.string().min(1), updatedAt: z.number(), watchedAt: z.number().nullable(),
}).strict()

export const nexusWatchHistorySchema = z.object({ entries: z.array(entrySchema), exportedAt: z.number(), metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])), profile: z.string().min(1), provider: z.union([z.enum(WATCH_PROVIDER_IDS), z.literal('nexus')]), schemaVersion: z.literal(1) }).strict()

export function parseNexusWatchHistory(text: string, fileName = 'nexus-watch-history.json'): ParsedWatchImport {
    let raw: unknown
    try { raw = JSON.parse(text.replace(/^\uFEFF/, '')) } catch { throw new Error('Export NEXUS invalide : JSON illisible.') }
    const result = nexusWatchHistorySchema.safeParse(raw)
    if (!result.success) throw new Error('Export NEXUS incompatible : schemaVersion 1 et entrées strictement valides requis.')
    const data = result.data as NexusWatchHistoryExport
    const entries = data.entries.map((entry) => ({ ...entry, id: `${entry.primaryProvider}:${entry.id.split(':').at(-1) ?? entry.id}`, sources: entry.sources.map((source) => ({ ...source, sourceFileName: source.sourceFileName ?? fileName })) }))
    return { columns: ['NexusWatchHistoryExport'], entries, errors: [], profileName: data.profile, provider: 'manual', totalRows: entries.length, warnings: ['Import restauré depuis le format d’échange NEXUS version 1.'] }
}
