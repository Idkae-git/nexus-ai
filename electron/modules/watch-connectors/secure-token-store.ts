import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

import type { WatchConnectorId } from '../../../src/features/watch-connectors/connector.types.js'
import type { SecureCredentialReference, StoredOAuthCredential } from './watch-credential.types.js'

export interface TokenEncryption {
    decrypt(value: Uint8Array): string
    encrypt(value: string): Uint8Array
    isAvailable(): boolean
}

interface TokenFile { credentials: Partial<Record<WatchConnectorId, string>>; version: 1 }
const emptyFile = (): TokenFile => ({ credentials: {}, version: 1 })

export class SecureTokenStore {
    readonly #encryption: TokenEncryption
    readonly #filePath: string
    constructor(filePath: string, encryption: TokenEncryption) { this.#filePath = filePath; this.#encryption = encryption }
    async save(connectorId: WatchConnectorId, credential: StoredOAuthCredential): Promise<SecureCredentialReference> {
        if (!this.#encryption.isAvailable()) throw new Error('Le stockage sécurisé Windows est indisponible. Le token ne sera pas conservé.')
        const file = await this.#readFile()
        file.credentials[connectorId] = Buffer.from(this.#encryption.encrypt(JSON.stringify(credential))).toString('base64')
        await this.#writeFile(file)
        return { connectorId, key: `safe-storage:${connectorId}` }
    }
    async read(reference: SecureCredentialReference): Promise<StoredOAuthCredential | null> {
        if (!this.#encryption.isAvailable()) return null
        const encoded = (await this.#readFile()).credentials[reference.connectorId]
        if (!encoded) return null
        try {
            const parsed: unknown = JSON.parse(this.#encryption.decrypt(Buffer.from(encoded, 'base64')))
            if (!parsed || typeof parsed !== 'object') return null
            const value = parsed as Partial<StoredOAuthCredential>
            return typeof value.accessToken === 'string' && (value.expiresAt === null || typeof value.expiresAt === 'number') && value.tokenType === 'Bearer' ? { accessToken: value.accessToken, expiresAt: value.expiresAt, tokenType: 'Bearer' } : null
        } catch { return null }
    }
    async delete(connectorId: WatchConnectorId) { const file = await this.#readFile(); delete file.credentials[connectorId]; await this.#writeFile(file) }
    async has(connectorId: WatchConnectorId) { return Boolean((await this.#readFile()).credentials[connectorId]) }
    async #readFile(): Promise<TokenFile> { try { const parsed: unknown = JSON.parse(await readFile(this.#filePath, 'utf8')); if (!parsed || typeof parsed !== 'object') return emptyFile(); const file = parsed as Partial<TokenFile>; return { credentials: file.credentials ?? {}, version: 1 } } catch { return emptyFile() } }
    async #writeFile(file: TokenFile) { await mkdir(path.dirname(this.#filePath), { recursive: true }); const temporary = `${this.#filePath}.tmp`; await writeFile(temporary, JSON.stringify(file, null, 2), 'utf8'); try { await rename(temporary, this.#filePath) } catch { await rm(this.#filePath, { force: true }); await rename(temporary, this.#filePath) } }
}
