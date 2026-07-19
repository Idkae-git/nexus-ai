import type { WatchSyncConflict, WatchSyncConflictResolution } from '../../../features/watch-connectors/connector.types.js'

export function SyncConflictList({ conflicts, onResolve }: { conflicts: WatchSyncConflict[]; onResolve: (id: string, resolution: WatchSyncConflictResolution) => void }) {
  if (conflicts.length === 0) return null
  return <section className="sync-conflict-list"><header><span>CONFLICT CLEARING</span><h3>Décisions en attente</h3></header><div>{conflicts.map((item) => <article key={item.id}><span><strong>{item.type.replaceAll('-', ' ')}</strong><small>Local : {String(item.localValue ?? 'inconnu')} · Distant : {String(item.remoteValue ?? 'inconnu')} · {item.confidence}</small></span><div><button onClick={() => onResolve(item.id, 'keep-local')} type="button">GARDER LOCAL</button><button onClick={() => onResolve(item.id, 'keep-remote')} type="button">GARDER DISTANT</button><button onClick={() => onResolve(item.id, 'ignore')} type="button">IGNORER</button></div></article>)}</div></section>
}
