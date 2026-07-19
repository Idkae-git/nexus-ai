import type { MediaFilter, MediaSortMode, MediaType } from './media.types.ts'

export const MEDIA_FILTER_OPTIONS: readonly { id: MediaFilter; label: string }[] = [
  { id: 'all', label: 'Tout' }, { id: 'film', label: 'Films' }, { id: 'series', label: 'Séries' },
  { id: 'video', label: 'Vidéos' }, { id: 'music', label: 'Musique' },
  { id: 'favorites', label: 'Favoris' }, { id: 'recent', label: 'Récents' },
]

export const MEDIA_SORT_OPTIONS: readonly { id: MediaSortMode; label: string }[] = [
  { id: 'recently-added', label: 'Ajouts récents' }, { id: 'title', label: 'Titre' },
  { id: 'recently-watched', label: 'Dernière lecture' }, { id: 'size', label: 'Taille' },
]

export const MEDIA_TYPE_LABELS: Readonly<Record<MediaType, string>> = {
  film: 'Film', music: 'Musique', series: 'Série', video: 'Vidéo',
}
