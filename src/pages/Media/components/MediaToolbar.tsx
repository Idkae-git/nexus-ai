import { Icon } from '../../../components/ui/Icon.tsx'
import { MEDIA_FILTER_OPTIONS, MEDIA_SORT_OPTIONS } from '../../../features/media/media.constants.ts'
import type { MediaFilter, MediaSortMode } from '../../../features/media/media.types.ts'

export function MediaToolbar({ filter, onFilter, onQuery, onSort, query, sortMode }: {
  filter: MediaFilter; onFilter: (filter: MediaFilter) => void; onQuery: (query: string) => void
  onSort: (sort: MediaSortMode) => void; query: string; sortMode: MediaSortMode
}) {
  return <section className="forest-media-toolbar">
    <label><Icon name="search" size={15} /><input onChange={(event) => onQuery(event.target.value)} placeholder="Rechercher dans la forêt…" value={query} /></label>
    <div>{MEDIA_FILTER_OPTIONS.map((entry) => <button className={filter === entry.id ? 'is-active' : ''} key={entry.id} onClick={() => onFilter(entry.id)} type="button">{entry.label}</button>)}</div>
    <select aria-label="Trier la bibliothèque" onChange={(event) => onSort(event.target.value as MediaSortMode)} value={sortMode}>{MEDIA_SORT_OPTIONS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select>
  </section>
}
