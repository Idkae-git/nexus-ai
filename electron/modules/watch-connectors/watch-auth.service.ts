import { randomBytes } from 'node:crypto'

import { z } from 'zod'

import { OAUTH_SESSION_TTL_MS } from '../../../src/features/watch-connectors/connector.constants.js'
import type { WatchConnectorId } from '../../../src/features/watch-connectors/connector.types.js'
import type { OAuthSession, StoredOAuthCredential, WatchConnectorConfiguration } from './watch-credential.types.js'

interface PendingCallback { reject: (error: Error) => void; resolve: (code: string) => void; session: OAuthSession; timeout: NodeJS.Timeout }

export class OAuthCallbackBroker {
    readonly #pending = new Map<WatchConnectorId, PendingCallback>()
    waitForCode(session: OAuthSession) {
        this.cancel(session.connectorId)
        return new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => { this.#pending.delete(session.connectorId); reject(new Error('La session OAuth a expiré.')) }, Math.max(1, session.expiresAt - Date.now()))
            this.#pending.set(session.connectorId, { reject, resolve, session, timeout })
        })
    }
    handle(url: string) {
        let parsed: URL
        try { parsed = new URL(url) } catch { return false }
        if (parsed.protocol !== 'nexus:' || parsed.hostname !== 'oauth') return false
        const connectorId = parsed.pathname.replace(/^\//u, '') as WatchConnectorId
        const pending = this.#pending.get(connectorId)
        if (!pending) return false
        const state = parsed.searchParams.get('state')
        const code = parsed.searchParams.get('code')
        const error = parsed.searchParams.get('error')
        clearTimeout(pending.timeout)
        this.#pending.delete(connectorId)
        if (Date.now() > pending.session.expiresAt) pending.reject(new Error('La session OAuth a expiré.'))
        else if (!state || !timingSafeTextEqual(state, pending.session.state)) pending.reject(new Error('État OAuth invalide. Connexion refusée.'))
        else if (error) pending.reject(new Error(`Autorisation refusée : ${error}.`))
        else if (!code) pending.reject(new Error('Le service OAuth n’a retourné aucun code.'))
        else pending.resolve(code)
        return true
    }
    cancel(connectorId: WatchConnectorId) { const pending = this.#pending.get(connectorId); if (!pending) return; clearTimeout(pending.timeout); this.#pending.delete(connectorId); pending.reject(new Error('Connexion OAuth annulée.')) }
}

function timingSafeTextEqual(left: string, right: string) {
    const leftBytes = Buffer.from(left); const rightBytes = Buffer.from(right)
    if (leftBytes.length !== rightBytes.length) return false
    let difference = 0
    for (let index = 0; index < leftBytes.length; index += 1) difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0)
    return difference === 0
}

export function createOAuthSession(connectorId: WatchConnectorId, redirectUri: string, now = Date.now()): OAuthSession {
    return { connectorId, createdAt: now, expiresAt: now + OAUTH_SESSION_TTL_MS, redirectUri, state: randomBytes(32).toString('base64url') }
}

export function validateOAuthSession(session: OAuthSession, state: string, now = Date.now()) {
    if (now > session.expiresAt) throw new Error('La session OAuth a expiré.')
    if (!timingSafeTextEqual(session.state, state)) throw new Error('État OAuth invalide.')
    return true
}

const tokenSchema = z.object({ access_token: z.string().min(20), expires_in: z.number().positive().optional(), token_type: z.string().optional() }).passthrough()

export type OpenExternal = (url: string) => Promise<unknown>
export type ConnectorFetch = (input: string | URL, init?: RequestInit) => Promise<Response>

export class WatchAuthService {
    readonly #broker: OAuthCallbackBroker; readonly #fetch: ConnectorFetch; readonly #openExternal: OpenExternal
    constructor(options: { broker: OAuthCallbackBroker; fetcher?: ConnectorFetch; openExternal: OpenExternal }) { this.#broker = options.broker; this.#fetch = options.fetcher ?? fetch; this.#openExternal = options.openExternal }
    async authenticateAniList(config: WatchConnectorConfiguration): Promise<StoredOAuthCredential> {
        if (!config.clientId || !config.clientSecret) throw new Error('Configuration OAuth AniList manquante.')
        const session = createOAuthSession('anilist', config.redirectUri)
        const authorize = new URL('https://anilist.co/api/v2/oauth/authorize')
        authorize.searchParams.set('client_id', config.clientId); authorize.searchParams.set('redirect_uri', config.redirectUri); authorize.searchParams.set('response_type', 'code'); authorize.searchParams.set('state', session.state)
        const codePromise = this.#broker.waitForCode(session)
        try {
            await this.#openExternal(authorize.toString())
        } catch (error) {
            this.#broker.cancel('anilist')
            await codePromise.catch(() => undefined)
            throw error
        }
        const code = await codePromise
        const response = await this.#fetch('https://anilist.co/api/v2/oauth/token', { body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, grant_type: 'authorization_code', redirect_uri: config.redirectUri }), headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, method: 'POST', signal: AbortSignal.timeout(12_000) })
        if (!response.ok) throw new Error(response.status === 401 ? 'AniList a refusé la configuration OAuth.' : `Échange OAuth AniList impossible (${response.status}).`)
        const parsed = tokenSchema.safeParse(await response.json())
        if (!parsed.success) throw new Error('Réponse OAuth AniList invalide.')
        return { accessToken: parsed.data.access_token, expiresAt: parsed.data.expires_in ? Date.now() + parsed.data.expires_in * 1_000 : null, tokenType: 'Bearer' }
    }
    cancel(connectorId: WatchConnectorId) { this.#broker.cancel(connectorId) }
}
