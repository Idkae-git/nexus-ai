export const ANILIST_STATUSES = ['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING'] as const
export type AniListStatus = typeof ANILIST_STATUSES[number]

export interface AniListListEntry {
    completedAt: { day: number | null; month: number | null; year: number | null } | null
    id: number
    media: {
        coverImage: { large: string | null; medium: string | null } | null
        episodes: number | null
        format: string | null
        id: number
        idMal: number | null
        season: string | null
        seasonYear: number | null
        status: string | null
        synonyms: string[]
        title: { english: string | null; native: string | null; romaji: string | null; userPreferred: string }
        updatedAt: number | null
    }
    progress: number | null
    repeat: number | null
    score: number | null
    startedAt: { day: number | null; month: number | null; year: number | null } | null
    status: AniListStatus
    updatedAt: number | null
}
