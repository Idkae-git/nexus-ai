import type { WatchConnectorId, WatchConnectorView } from '../../../features/watch-connectors/connector.types.js'
import { ConnectorCard } from './ConnectorCard.js'

interface ConnectedServicesProps { connecting: WatchConnectorId | null; connectors: WatchConnectorView[]; onConnect: (id: WatchConnectorId) => void; onOpen: (id: WatchConnectorId) => void; onSync: (id: WatchConnectorId) => void }

export function ConnectedServices({ connecting, connectors, onConnect, onOpen, onSync }: ConnectedServicesProps) {
  return <section className="connected-services"><header><div><span>CONNECTED SERVICES</span><h2>Les sanctuaires de synchronisation</h2></div><small>OAuth officiel · aperçu obligatoire · stockage local chiffré</small></header><div>{connectors.map((connector) => <ConnectorCard busy={connecting === connector.id} connector={connector} key={connector.id} onConnect={onConnect} onOpen={onOpen} onSync={onSync} />)}</div></section>
}
