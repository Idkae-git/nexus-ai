import type { RemoteMediaEntry, WatchConnectorCapabilities, WatchConnectorDefinition, WatchConnectorUser } from '../../../src/features/watch-connectors/connector.types.js'

export interface RemotePushChange {
    mediaId: string
    progress: number | null
    score: number | null
    status: RemoteMediaEntry['status']
}

export interface WatchConnector {
    getCapabilities(): WatchConnectorCapabilities
    getCurrentUser(signal?: AbortSignal): Promise<WatchConnectorUser>
    getDefinition(): WatchConnectorDefinition
    pullHistory(signal?: AbortSignal): Promise<RemoteMediaEntry[]>
    pushChange(change: RemotePushChange, signal?: AbortSignal): Promise<RemoteMediaEntry>
    testConnection(signal?: AbortSignal): Promise<boolean>
}
