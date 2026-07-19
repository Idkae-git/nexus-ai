import type { RemoteMediaEntry, RemoteMediaStatus } from '../../../../../src/features/watch-connectors/connector.types.js'
import type { WatchStatus } from '../../../../../src/features/watch-tracking/watch.types.js'
import type { AniListListEntry, AniListStatus } from './anilist.types.js'

const remoteStatuses: Record<AniListStatus, RemoteMediaStatus> = { COMPLETED: 'completed', CURRENT: 'current', DROPPED: 'dropped', PAUSED: 'paused', PLANNING: 'planning', REPEATING: 'repeating' }
const anilistStatuses: Record<Exclude<WatchStatus, 'unknown'>, AniListStatus> = { completed: 'COMPLETED', dropped: 'DROPPED', 'in-progress': 'CURRENT', planned: 'PLANNING' }

export function remoteStatusFromAniList(status: AniListStatus) { return remoteStatuses[status] }
export function aniListStatusFromNexus(status: WatchStatus): AniListStatus | null { return status === 'unknown' ? null : anilistStatuses[status] }

function fuzzyDate(value: AniListListEntry['startedAt']) {
    if (!value?.year) return null
    const month = value.month ? String(value.month).padStart(2, '0') : '01'; const day = value.day ? String(value.day).padStart(2, '0') : '01'
    return `${value.year}-${month}-${day}`
}

export function mapAniListEntry(entry: AniListListEntry): RemoteMediaEntry {
    const titles = [entry.media.title.romaji, entry.media.title.english, entry.media.title.native, ...entry.media.synonyms].filter((value): value is string => Boolean(value))
    return {
        alternativeTitles: [...new Set(titles.filter((title) => title !== entry.media.title.userPreferred))], completedAt: fuzzyDate(entry.completedAt),
        coverImageUrl: entry.media.coverImage?.large ?? entry.media.coverImage?.medium ?? null, episodeCount: entry.media.episodes,
        externalIds: { anilist: String(entry.media.id), ...(entry.media.idMal ? { myanimelist: String(entry.media.idMal) } : {}) }, format: entry.media.format,
        mediaType: entry.media.format === 'MOVIE' ? 'movie' : 'anime', progress: entry.progress, provider: 'anilist', providerEntryId: String(entry.id), providerMediaId: String(entry.media.id),
        releaseYear: entry.media.seasonYear, repeatCount: entry.repeat, score: entry.score, startedAt: fuzzyDate(entry.startedAt), status: remoteStatusFromAniList(entry.status),
        title: entry.media.title.userPreferred, updatedAt: entry.updatedAt ? entry.updatedAt * 1_000 : entry.media.updatedAt ? entry.media.updatedAt * 1_000 : null,
    }
}
