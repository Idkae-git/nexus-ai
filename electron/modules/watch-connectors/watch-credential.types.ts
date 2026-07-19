import type { WatchConnectorId } from '../../../src/features/watch-connectors/connector.types.js'

export interface OAuthSession {
    connectorId: WatchConnectorId
    createdAt: number
    expiresAt: number
    redirectUri: string
    state: string
}

export interface SecureCredentialReference {
    connectorId: WatchConnectorId
    key: string
}

export interface StoredOAuthCredential {
    accessToken: string
    expiresAt: number | null
    tokenType: 'Bearer'
}

export interface WatchConnectorConfiguration {
    clientId: string | null
    clientSecret: string | null
    redirectUri: string
}
