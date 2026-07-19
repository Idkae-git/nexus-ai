import type { WatchSyncPreference } from '../../../features/watch-connectors/connector.types.js'

export function SyncSettings({ onChange, preference }: { onChange: (changes: Partial<Omit<WatchSyncPreference, 'connectorId'>>) => void; preference: WatchSyncPreference }) {
  return <section className="sync-settings"><header><span>SYNC BOUNDARIES</span><h3>Données autorisées</h3></header><div>{([['includeProgress', 'Progression'], ['includeStatuses', 'Statuts'], ['includeRatings', 'Scores'], ['includeDates', 'Dates'], ['includeWatchlist', 'Watchlist']] as const).map(([key, label]) => <label key={key}><input checked={preference[key]} onChange={(event) => onChange({ [key]: event.target.checked })} type="checkbox" /><span>{label}</span></label>)}</div><p>Mode par défaut : manuel. Aucun push automatique. Un aperçu reste requis avant toute écriture distante.</p></section>
}
