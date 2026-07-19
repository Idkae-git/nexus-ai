import { EMPTY_CAPABILITIES } from '../../../src/features/watch-connectors/connector.constants.js'
import type { WatchConnectorDefinition, WatchConnectorId } from '../../../src/features/watch-connectors/connector.types.js'

const definitions: readonly WatchConnectorDefinition[] = [
    {
        authenticationType: 'oauth2-code',
        capabilities: { supportsAutomaticSync: false, supportsEpisodeProgress: true, supportsExactProgress: false, supportsExport: true, supportsImport: true, supportsIncrementalSync: false, supportsMovieProgress: false, supportsProfiles: false, supportsRatings: false, supportsTwoWaySync: true, supportsWatchlists: true, supportsWebhooks: false },
        description: 'Listes d’animés, progression par épisode, statuts et scores.', displayName: 'AniList', icon: 'anilist', id: 'anilist',
        limitations: ['Aucun scope OAuth granulaire.', 'Token valable un an, sans refresh token.', 'Pas de progression vidéo exacte.'], requiredConfiguration: ['NEXUS_ANILIST_CLIENT_ID', 'NEXUS_ANILIST_CLIENT_SECRET'],
    },
    {
        authenticationType: 'oauth2-pkce',
        capabilities: EMPTY_CAPABILITIES,
        description: 'Films, séries et animés via le modèle de synchronisation incrémentale Simkl.', displayName: 'Simkl', icon: 'simkl', id: 'simkl',
        limitations: ['Connecteur réseau non activé dans cette version sans client_id vérifié.', 'Écritures limitées à une requête POST par seconde.'], requiredConfiguration: ['NEXUS_SIMKL_CLIENT_ID'],
    },
    ...([
        ['trakt', 'Trakt', 'Suivi films et séries préparé.'], ['myanimelist', 'MyAnimeList', 'Suivi anime préparé.'],
        ['plex', 'Plex', 'Serveur multimédia personnel préparé.'], ['jellyfin', 'Jellyfin', 'Serveur local préparé.'], ['emby', 'Emby', 'Serveur local préparé.'],
    ] as const).map(([id, displayName, description]) => ({ authenticationType: id === 'plex' || id === 'jellyfin' || id === 'emby' ? 'local' as const : 'oauth2-code' as const, capabilities: EMPTY_CAPABILITIES, description, displayName, icon: id, id, limitations: ['Architecture préparée, connecteur non implémenté.'], requiredConfiguration: [] })),
]

export class WatchConnectorRegistry {
    readonly #definitions = new Map<WatchConnectorId, WatchConnectorDefinition>(definitions.map((definition) => [definition.id, definition]))
    get(id: WatchConnectorId) { const definition = this.#definitions.get(id); if (!definition) throw new Error(`Connecteur inconnu : ${id}.`); return definition }
    list() { return [...this.#definitions.values()] }
}
