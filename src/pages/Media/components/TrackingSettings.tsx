import { Icon } from '../../../components/ui/Icon.tsx'
import type { WatchProviderDefinition, WatchProviderId, WatchStats } from '../../../features/watch-tracking/watch.types.ts'

const activeProviders: readonly WatchProviderId[] = ['nexus-local', 'vlc', 'netflix-import', 'crunchyroll-import', 'manual']

export function TrackingSettings({ onDeleteProvider, profileName, providers, stats }: { onDeleteProvider: (provider: WatchProviderId) => void; profileName: string; providers: readonly WatchProviderDefinition[]; stats: WatchStats | null }) {
  return <section className="watch-tracking-settings"><header><div><span>LOCAL PRIVACY</span><h2>Gestion des traces</h2></div><small>{profileName === 'all' ? 'Tous les profils' : `Profil · ${profileName}`}</small></header><div>{activeProviders.map((providerId) => { const provider = providers.find((entry) => entry.id === providerId); const count = stats?.sourceCounts[providerId] ?? 0; return <article key={providerId}><span><Icon name="lock" size={15} /></span><p><strong>{provider?.label ?? providerId}</strong><small>{count} entrée{count > 1 ? 's' : ''} locale{count > 1 ? 's' : ''}</small></p><button disabled={count === 0} onClick={() => onDeleteProvider(providerId)} type="button">Effacer</button></article> })}</div><footer>Une suppression par source passe par le Gateway sensible et exige une confirmation explicite. Les autres sources ne sont jamais touchées.</footer></section>
}
