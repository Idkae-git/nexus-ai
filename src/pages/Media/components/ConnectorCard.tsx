import { Icon } from '../../../components/ui/Icon.js'
import type { WatchConnectorId, WatchConnectorView } from '../../../features/watch-connectors/connector.types.js'
import { ConnectorStatus } from './ConnectorStatus.js'

interface ConnectorCardProps { busy: boolean; connector: WatchConnectorView; onConnect: (id: WatchConnectorId) => void; onOpen: (id: WatchConnectorId) => void; onSync: (id: WatchConnectorId) => void }

export function ConnectorCard({ busy, connector, onConnect, onOpen, onSync }: ConnectorCardProps) {
  const connected = connector.connection.status === 'connected'
  const canConnect = connector.id === 'anilist' && connector.connection.status === 'disconnected'
  return <article className={`connector-card connector-${connector.id} ${connected ? 'is-connected' : ''}`}>
    <div className="connector-portal-mark"><span>{connector.displayName.slice(0, 2).toUpperCase()}</span><i /></div>
    <header><div><small>{connector.id === 'anilist' ? 'ANIME SANCTUARY' : connector.id === 'simkl' ? 'UNIVERSAL GROVE' : 'FUTURE PATH'}</small><h3>{connector.displayName}</h3></div><ConnectorStatus status={busy ? 'connecting' : connector.connection.status} /></header>
    <p>{connector.description}</p>
    {connector.connection.user && <div className="connector-user"><Icon name="user" size={13} /><span><b>{connector.connection.user.displayName}</b><small>Dernière synchro {connector.connection.lastSyncAt ? new Date(connector.connection.lastSyncAt).toLocaleString('fr-FR') : 'jamais'}</small></span></div>}
    {!connector.connection.user && <small className="connector-limitation">{connector.connection.error ?? connector.limitations[0]}</small>}
    <footer>
      {connected ? <><button onClick={() => onSync(connector.id)} type="button"><Icon name="refresh" size={12} /> SYNCHRONISER</button><button aria-label={`Paramètres ${connector.displayName}`} onClick={() => onOpen(connector.id)} type="button"><Icon name="settings" size={12} /></button></> : <button disabled={!canConnect || busy} onClick={() => onConnect(connector.id)} type="button">{connector.connection.status === 'configuration-required' ? 'CONFIGURER D’ABORD' : connector.connection.status === 'unsupported' ? 'BIENTÔT' : 'OUVRIR LE PORTAIL'}</button>}
    </footer>
  </article>
}
