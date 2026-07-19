import { Icon } from '../ui/Icon.tsx'
import { MEDIA_TYPE_LABELS } from '../../features/media/media.constants.ts'
import type { DetectedMedia, MediaId, MediaProgressEntry } from '../../features/media/media.types.ts'

interface MediaCardProps {
  favorite: boolean
  item: DetectedMedia
  onFavorite: (mediaId: MediaId) => void
  onPlay: (mediaId: MediaId) => void
  onSelect: (mediaId: MediaId) => void
  playing: boolean
  progress?: MediaProgressEntry
  selected?: boolean
  variant?: 'landscape' | 'portrait'
}

function size(bytes: number) { return bytes < 1_073_741_824 ? `${(bytes / 1_048_576).toFixed(0)} MB` : `${(bytes / 1_073_741_824).toFixed(1)} GB` }

export function MediaCard({ favorite, item, onFavorite, onPlay, onSelect, playing, progress, selected = false, variant = 'portrait' }: MediaCardProps) {
  const percentage = progress?.durationMs ? Math.min(100, progress.positionMs / progress.durationMs * 100) : null
  return (
    <article className={`media-card media-card-${variant} media-card-${item.type}${selected ? ' is-selected' : ''}`} onClick={() => onSelect(item.id)}>
      <div className="media-card-art">
        {item.thumbnailPath ? <img alt="" src={`file://${item.thumbnailPath}`} /> : <span className="media-poster-monogram">{item.title.slice(0, 2).toLocaleUpperCase()}</span>}
        <span className="media-category">{MEDIA_TYPE_LABELS[item.type]}</span>
        <button aria-label={favorite ? `Retirer ${item.title} des favoris` : `Ajouter ${item.title} aux favoris`} className={`media-favorite${favorite ? ' is-favorite' : ''}`} onClick={(event) => { event.stopPropagation(); onFavorite(item.id) }} type="button">★</button>
        <button aria-label={`Lire ${item.title}`} className="media-play" disabled={playing} onClick={(event) => { event.stopPropagation(); onPlay(item.id) }} type="button"><Icon name={playing ? 'refresh' : 'play'} size={18} /></button>
        <span className="media-grain" />
      </div>
      <div className="media-card-copy">
        <span>{item.extension.toLocaleUpperCase()} · {size(item.size)}</span>
        <strong>{item.title}</strong>
        {percentage !== null && <div className="media-progress"><span style={{ width: `${percentage}%` }} /></div>}
      </div>
    </article>
  )
}
