import { ActionButton } from '../ui/ActionButton.tsx'
import { Icon } from '../ui/Icon.tsx'
import type { DetectedMedia, MediaId, MediaPlayerStatus } from '../../features/media/media.types.ts'
import { ForestAtmosphere } from './ForestAtmosphere.tsx'

export function MediaHero({ favorite, item, onFavorite, onPlay, playerStatus }: {
  favorite: boolean
  item: DetectedMedia | null
  onFavorite: (mediaId: MediaId) => void
  onPlay: (mediaId: MediaId) => void
  playerStatus: MediaPlayerStatus | null
}) {
  return (
    <section className="media-cinema-hero">
      <ForestAtmosphere />
      <div className="media-cinema-copy">
        <span className="media-premiere-label"><i /> {item ? 'LOCAL SELECTION' : 'THE FOREST CINEMA'}</span>
        <h1>{item?.title ?? <>Follow the light.<br />Find a story.</>}</h1>
        <p>{item ? `${item.filePath} · ${item.extension.toLocaleUpperCase()}` : 'Configure local clearings for your films, series, videos and music. Nothing outside those folders is ever scanned.'}</p>
        <div className="media-cinema-actions">
          <ActionButton disabled={!item || !playerStatus?.vlcAvailable} onClick={() => item && onPlay(item.id)}><Icon name="vlc" size={15} /> {playerStatus?.vlcAvailable ? 'Lire avec VLC' : 'VLC indisponible'}</ActionButton>
          {item && <ActionButton className={favorite ? 'is-favorite' : ''} onClick={() => onFavorite(item.id)} variant="secondary">★ {favorite ? 'Favori' : 'Ajouter aux favoris'}</ActionButton>}
        </div>
      </div>
      <div className="media-feature-index" aria-hidden="true"><span>{item ? '01' : '00'}</span><i /><span>LOCAL</span></div>
    </section>
  )
}
