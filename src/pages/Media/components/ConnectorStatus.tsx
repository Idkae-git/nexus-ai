import type { WatchConnectorStatus } from '../../../features/watch-connectors/connector.types.js'

const labels: Record<WatchConnectorStatus, string> = { connected: 'CONNECTÉ', connecting: 'CONNEXION', 'configuration-required': 'CONFIGURATION REQUISE', disconnected: 'NON CONNECTÉ', error: 'ERREUR', expired: 'AUTH EXPIRÉE', unsupported: 'PRÉPARÉ' }

export function ConnectorStatus({ status }: { status: WatchConnectorStatus }) { return <span className={`connector-status connector-status-${status}`}><i />{labels[status]}</span> }
