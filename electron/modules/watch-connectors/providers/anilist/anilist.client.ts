import { z } from 'zod'

import { CONNECTOR_HTTP_TIMEOUT_MS } from '../../../../../src/features/watch-connectors/connector.constants.js'
import type { ConnectorFetch } from '../../watch-auth.service.js'

const graphQLErrorSchema = z.object({ message: z.string(), status: z.number().optional() }).passthrough()
const graphQLResponseSchema = z.object({ data: z.unknown().nullable().optional(), errors: z.array(graphQLErrorSchema).optional() }).passthrough()

export class AniListClientError extends Error { readonly status: number | null; constructor(message: string, status: number | null = null) { super(message); this.name = 'AniListClientError'; this.status = status } }

export class AniListClient {
    readonly #fetch: ConnectorFetch; readonly #token: string
    constructor(token: string, fetcher: ConnectorFetch = fetch) { this.#token = token; this.#fetch = fetcher }
    async query<T>(query: string, variables: Readonly<Record<string, unknown>>, schema: z.ZodType<T>, signal?: AbortSignal) { return this.#request(query, variables, schema, false, signal) }
    async mutate<T>(query: string, variables: Readonly<Record<string, unknown>>, schema: z.ZodType<T>, signal?: AbortSignal) { return this.#request(query, variables, schema, true, signal) }
    async #request<T>(query: string, variables: Readonly<Record<string, unknown>>, schema: z.ZodType<T>, mutation: boolean, signal?: AbortSignal): Promise<T> {
        const attempts = mutation ? 1 : 3
        for (let attempt = 0; attempt < attempts; attempt += 1) {
            const timeout = AbortSignal.timeout(CONNECTOR_HTTP_TIMEOUT_MS)
            const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
            let response: Response
            try { response = await this.#fetch('https://graphql.anilist.co', { body: JSON.stringify({ query, variables }), headers: { Accept: 'application/json', Authorization: `Bearer ${this.#token}`, 'Content-Type': 'application/json' }, method: 'POST', signal: combined }) } catch (error) { if (attempt + 1 < attempts && !signal?.aborted) { await delay(250 * 2 ** attempt); continue } throw new AniListClientError(error instanceof Error ? error.message : 'Erreur réseau AniList.') }
            const payload = graphQLResponseSchema.safeParse(await response.json().catch(() => null))
            const graphError = payload.success ? payload.data.errors?.[0] : undefined
            if (response.status === 401 || graphError?.status === 401) throw new AniListClientError('Authentification AniList expirée ou invalide.', 401)
            if (response.status === 429 || graphError?.status === 429) { if (attempt + 1 < attempts) { await delay(retryDelay(response, attempt)); continue } throw new AniListClientError('Limite AniList atteinte. Réessayez plus tard.', 429) }
            if (!response.ok || !payload.success) { if (response.status >= 500 && attempt + 1 < attempts) { await delay(250 * 2 ** attempt); continue } throw new AniListClientError(`Réponse AniList invalide (${response.status}).`, response.status) }
            if (graphError) throw new AniListClientError(`AniList : ${graphError.message}`, graphError.status ?? null)
            const parsed = schema.safeParse(payload.data.data)
            if (!parsed.success) throw new AniListClientError('La réponse GraphQL AniList ne respecte pas le schéma attendu.')
            return parsed.data
        }
        throw new AniListClientError('AniList est temporairement indisponible.')
    }
}

function retryDelay(response: Response, attempt: number) { const seconds = Number(response.headers.get('Retry-After')); return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1_000, 5_000) : 500 * 2 ** attempt }
function delay(milliseconds: number) { return new Promise<void>((resolve) => setTimeout(resolve, milliseconds)) }
