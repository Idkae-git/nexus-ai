export const ANILIST_VIEWER_QUERY = `query ViewerForNexus { Viewer { id name avatar { large medium } } }`

export const ANILIST_LIBRARY_QUERY = `query NexusAnimeList($page: Int!, $perPage: Int!, $userId: Int!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage currentPage lastPage total }
    mediaList(type: ANIME, userId: $userId, sort: UPDATED_TIME_DESC) {
      id mediaId status score(format: POINT_100) progress repeat updatedAt
      startedAt { year month day }
      completedAt { year month day }
      media {
        id idMal format episodes season seasonYear status updatedAt synonyms
        title { romaji english native userPreferred }
        coverImage { large medium }
      }
    }
  }
}`

export const ANILIST_SAVE_ENTRY_MUTATION = `mutation SaveNexusMediaEntry($mediaId: Int!, $status: MediaListStatus, $progress: Int, $score: Int) {
  SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress, scoreRaw: $score) {
    id mediaId status score(format: POINT_100) progress repeat updatedAt
    startedAt { year month day }
    completedAt { year month day }
    media {
      id idMal format episodes season seasonYear status updatedAt synonyms
      title { romaji english native userPreferred }
      coverImage { large medium }
    }
  }
}`
