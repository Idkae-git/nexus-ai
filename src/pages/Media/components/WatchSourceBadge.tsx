import { Icon } from '../../../components/ui/Icon.tsx'
import type { IconName } from '../../../components/ui/Icon.tsx'
import type { WatchProgressPrecision, WatchProviderId } from '../../../features/watch-tracking/watch.types.ts'

const labels: Record<WatchProviderId, string> = { anilist: 'AniList', 'crunchyroll-import': 'Crunchyroll', emby: 'Emby', jellyfin: 'Jellyfin', manual: 'Manuel', myanimelist: 'MyAnimeList', 'netflix-import': 'Netflix', 'nexus-local': 'Local', plex: 'Plex', simkl: 'Simkl', trakt: 'Trakt', vlc: 'VLC' }
const icons: Partial<Record<WatchProviderId, IconName>> = { 'nexus-local': 'film', vlc: 'vlc', manual: 'user', 'netflix-import': 'media', 'crunchyroll-import': 'play' }
const precisionLabels: Record<WatchProgressPrecision, string> = { exact: 'progression exacte', estimated: 'progression estimée', 'watched-only': 'activité importée', unknown: 'progression inconnue' }

export function WatchSourceBadge({ precision, provider }: { precision: WatchProgressPrecision; provider: WatchProviderId }) {
  const title = `${labels[provider]} · ${precisionLabels[precision]}`
  return <span className={`watch-source-badge watch-source-${provider}`} title={title}><Icon name={icons[provider] ?? 'media'} size={12} /><b>{labels[provider]}</b><small>{precisionLabels[precision]}</small></span>
}
