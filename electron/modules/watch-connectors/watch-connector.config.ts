import type { WatchConnectorId } from '../../../src/features/watch-connectors/connector.types.js'
import type { WatchConnectorConfiguration } from './watch-credential.types.js'

const redirectUri = (id: WatchConnectorId) => `nexus://oauth/${id}`

export class WatchConnectorConfigurationService {
    get(id: WatchConnectorId): WatchConnectorConfiguration {
        if (id === 'anilist') return { clientId: process.env.NEXUS_ANILIST_CLIENT_ID?.trim() || null, clientSecret: process.env.NEXUS_ANILIST_CLIENT_SECRET?.trim() || null, redirectUri: process.env.NEXUS_ANILIST_REDIRECT_URI?.trim() || redirectUri(id) }
        if (id === 'simkl') return { clientId: process.env.NEXUS_SIMKL_CLIENT_ID?.trim() || null, clientSecret: null, redirectUri: process.env.NEXUS_SIMKL_REDIRECT_URI?.trim() || redirectUri(id) }
        return { clientId: null, clientSecret: null, redirectUri: redirectUri(id) }
    }
    isConfigured(id: WatchConnectorId) { const config = this.get(id); return id === 'anilist' ? Boolean(config.clientId && config.clientSecret) : id === 'simkl' ? Boolean(config.clientId) : false }
}
