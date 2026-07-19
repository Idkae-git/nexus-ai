import { z } from 'zod'

import type { RemoteMediaEntry, WatchConnectorDefinition, WatchConnectorUser } from '../../../../../src/features/watch-connectors/connector.types.js'
import type { WatchConnector, RemotePushChange } from '../../watch-connector.types.js'
import { AniListClient } from './anilist.client.js'
import { mapAniListEntry } from './anilist.mapper.js'
import { ANILIST_LIBRARY_QUERY, ANILIST_SAVE_ENTRY_MUTATION, ANILIST_VIEWER_QUERY } from './anilist.queries.js'
import { ANILIST_STATUSES, type AniListListEntry } from './anilist.types.js'

const fuzzyDateSchema = z.object({ day: z.number().int().nullable(), month: z.number().int().nullable(), year: z.number().int().nullable() }).nullable()
const listEntrySchema: z.ZodType<AniListListEntry> = z.object({ completedAt: fuzzyDateSchema, id: z.number().int(), media: z.object({ coverImage: z.object({ large: z.string().nullable(), medium: z.string().nullable() }).nullable(), episodes: z.number().int().nullable(), format: z.string().nullable(), id: z.number().int(), idMal: z.number().int().nullable(), season: z.string().nullable(), seasonYear: z.number().int().nullable(), status: z.string().nullable(), synonyms: z.array(z.string()), title: z.object({ english: z.string().nullable(), native: z.string().nullable(), romaji: z.string().nullable(), userPreferred: z.string().min(1) }), updatedAt: z.number().int().nullable() }), progress: z.number().int().nullable(), repeat: z.number().int().nullable(), score: z.number().nullable(), startedAt: fuzzyDateSchema, status: z.enum(ANILIST_STATUSES), updatedAt: z.number().int().nullable() })
const viewerSchema = z.object({ Viewer: z.object({ avatar: z.object({ large: z.string().nullable(), medium: z.string().nullable() }).nullable(), id: z.number().int(), name: z.string().min(1) }) })
const pageSchema = z.object({ Page: z.object({ mediaList: z.array(listEntrySchema), pageInfo: z.object({ currentPage: z.number().int().nullable(), hasNextPage: z.boolean(), lastPage: z.number().int().nullable(), total: z.number().int().nullable() }) }) })
const mutationSchema = z.object({ SaveMediaListEntry: listEntrySchema })

export class AniListConnector implements WatchConnector {
    readonly #client: AniListClient; readonly #definition: WatchConnectorDefinition
    constructor(definition: WatchConnectorDefinition, client: AniListClient) { this.#definition = definition; this.#client = client }
    getCapabilities() { return this.#definition.capabilities }
    getDefinition() { return this.#definition }
    async getCurrentUser(signal?: AbortSignal): Promise<WatchConnectorUser> { const data = await this.#client.query(ANILIST_VIEWER_QUERY, {}, viewerSchema, signal); return { avatarUrl: data.Viewer.avatar?.large ?? data.Viewer.avatar?.medium ?? null, displayName: data.Viewer.name, remoteUserId: String(data.Viewer.id) } }
    async pullHistory(signal?: AbortSignal) { const user = await this.getCurrentUser(signal); const userId = Number(user.remoteUserId); if (!Number.isInteger(userId) || userId <= 0) throw new Error('Identifiant utilisateur AniList invalide.'); const entries: RemoteMediaEntry[] = []; let page = 1; let hasNextPage = true; while (hasNextPage) { const data = await this.#client.query(ANILIST_LIBRARY_QUERY, { page, perPage: 50, userId }, pageSchema, signal); entries.push(...data.Page.mediaList.map(mapAniListEntry)); hasNextPage = data.Page.pageInfo.hasNextPage; page += 1; if (page > 200) throw new Error('Pagination AniList anormalement longue, synchronisation interrompue.') } return entries }
    async pushChange(change: RemotePushChange, signal?: AbortSignal) { const mediaId = Number(change.mediaId); if (!Number.isInteger(mediaId) || mediaId <= 0) throw new Error('Identifiant AniList invalide.'); if (change.progress !== null && (!Number.isInteger(change.progress) || change.progress < 0)) throw new Error('Progression AniList invalide.'); if (change.score !== null && (!Number.isInteger(change.score) || change.score < 0 || change.score > 100)) throw new Error('Score AniList invalide.'); const status = remoteToAniListStatus(change.status); const data = await this.#client.mutate(ANILIST_SAVE_ENTRY_MUTATION, { mediaId, progress: change.progress, score: change.score, status }, mutationSchema, signal); if (change.progress !== null && data.SaveMediaListEntry.media.episodes !== null && change.progress > data.SaveMediaListEntry.media.episodes) throw new Error('La progression dépasse le nombre d’épisodes AniList.'); return mapAniListEntry(data.SaveMediaListEntry) }
    async testConnection(signal?: AbortSignal) { await this.getCurrentUser(signal); return true }
}

function remoteToAniListStatus(status: RemoteMediaEntry['status']) { const map = { completed: 'COMPLETED', current: 'CURRENT', dropped: 'DROPPED', paused: 'PAUSED', planning: 'PLANNING', repeating: 'REPEATING', unknown: null } as const; return map[status] }
