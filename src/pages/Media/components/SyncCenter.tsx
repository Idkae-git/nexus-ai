import { Icon } from '../../../components/ui/Icon.js'
import { defaultSyncPreference } from '../../../features/watch-connectors/connector.constants.js'
import { useConnectorStore } from '../../../features/watch-connectors/connector.store.js'
import { SyncConflictList } from './SyncConflictList.js'
import { SyncHistory } from './SyncHistory.js'
import { SyncPreview } from './SyncPreview.js'
import { SyncSettings } from './SyncSettings.js'

export function SyncCenter() {
  const store = useConnectorStore()
  if (!store.centerOpen || !store.activeConnectorId) return null
  const connector = store.connectors.find((item) => item.id === store.activeConnectorId)
  if (!connector) return null
  const preference = store.preferences[connector.id] ?? defaultSyncPreference(connector.id)
  const confirmedCount = store.syncPlan?.operations.filter((item) => item.included).length ?? 0
  return <div className="sync-center-backdrop"><aside aria-label="Centre de synchronisation" className="sync-center">
    <header><div><span>FOREST SYNC CENTER</span><h2>{connector.displayName}</h2><p>{connector.connection.user ? `Connecté en tant que ${connector.connection.user.displayName}` : connector.connection.status.replaceAll('-', ' ')}</p></div><button aria-label="Fermer" onClick={store.closeCenter} type="button"><Icon name="close" size={16} /></button></header>
    {store.error && <div className="sync-center-error" role="alert">{store.error}<button onClick={store.clearError} type="button">FERMER</button></div>}
    <nav><button disabled={connector.connection.status !== 'connected' || store.planning} onClick={() => void store.createSyncPlan(connector.id, 'pull')} type="button">PULL · VERS NEXUS</button><button disabled={connector.connection.status !== 'connected' || store.planning} onClick={() => void store.createSyncPlan(connector.id, 'push')} type="button">PUSH · VERS {connector.displayName.toUpperCase()}</button><button disabled={connector.connection.status !== 'connected' || store.planning} onClick={() => void store.createSyncPlan(connector.id, 'bidirectional')} type="button">COMPARAISON DOUBLE</button></nav>
    {store.planning && <div className="sync-center-loading"><i /><span>La forêt compare les deux historiques…</span></div>}
    {store.syncPlan && <SyncPreview onToggle={store.toggleSyncOperation} plan={store.syncPlan} />}
    {store.syncPlan && <div className="sync-execute-bar"><span><b>{confirmedCount}</b> opération(s) explicitement incluse(s)</span><button disabled={confirmedCount === 0 || store.syncing} onClick={() => void store.executeSyncPlan()} type="button">{store.syncing ? 'SYNCHRONISATION…' : 'CONFIRMER ET EXÉCUTER'}</button></div>}
    {store.syncing && store.syncStatus && <div className="sync-progress"><span><i style={{ width: `${store.syncStatus.total > 0 ? store.syncStatus.completed / store.syncStatus.total * 100 : 0}%` }} /></span><p><b>{store.syncStatus.completed}/{store.syncStatus.total}</b><small>{store.syncStatus.currentItem ?? 'Finalisation locale'}</small></p><button onClick={() => void store.cancelSync()} type="button">ANNULER</button></div>}
    {store.syncResult && <div className="sync-result"><Icon name={store.syncResult.failed > 0 ? 'activity' : 'check'} size={18} /><span><strong>{store.syncResult.succeeded} opération(s) réussie(s)</strong><small>{store.syncResult.failed} échec(s) · {store.syncResult.cancelled ? 'annulée' : 'terminée'}</small></span></div>}
    <div className="sync-center-columns"><SyncConflictList conflicts={store.conflicts.filter((item) => item.localEntryId !== null)} onResolve={(id, resolution) => void store.resolveConflict(id, resolution)} /><SyncSettings onChange={(changes) => void store.updatePreferences(connector.id, changes)} preference={preference} /></div>
    <SyncHistory entries={store.syncHistory.filter((entry) => entry.connectorId === connector.id)} />
    <footer><span><Icon name="lock" size={12} /> Les tokens ne quittent jamais Electron et ne sont jamais exposés au renderer.</span>{connector.connection.status === 'connected' && <div><button onClick={() => { if (window.confirm(`Déconnecter ${connector.displayName} ? L’historique local sera conservé.`)) void store.disconnectConnector(connector.id) }} type="button">DÉCONNECTER</button><button onClick={() => { if (window.confirm(`Déconnecter ${connector.displayName} ET supprimer ses entrées importées ? Cette action est définitive.`)) void store.disconnectConnector(connector.id, true) }} type="button">DÉCONNECTER + EFFACER</button></div>}</footer>
  </aside></div>
}
