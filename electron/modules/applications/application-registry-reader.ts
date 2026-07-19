import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { ApplicationRegistryCandidate } from './application.registry.js'

const executeFile = promisify(execFile)

export interface RegistryValueReader {
    read(candidate: ApplicationRegistryCandidate): Promise<string | null>
}

export type RegistryCommandRunner = (args: readonly string[]) => Promise<string>

async function runRegistryCommand(args: readonly string[]) {
    const result = await executeFile('reg.exe', [...args], {
        encoding: 'utf8',
        windowsHide: true,
    })
    return result.stdout
}

export function parseRegistryValue(output: string) {
    for (const line of output.split(/\r?\n/)) {
        const match = /\sREG_(?:SZ|EXPAND_SZ)\s+(.+)$/i.exec(line)
        if (match?.[1]) return match[1].trim()
    }
    return null
}

export class WindowsRegistryReader implements RegistryValueReader {
    readonly #run: RegistryCommandRunner

    constructor(run: RegistryCommandRunner = runRegistryCommand) {
        this.#run = run
    }

    async read(candidate: ApplicationRegistryCandidate) {
        const values = await Promise.all(['64', '32'].map(async (view) => {
            const args = ['query', candidate.key]
            if (candidate.valueName) args.push('/v', candidate.valueName)
            else args.push('/ve')
            args.push(`/reg:${view}`)

            try {
                return parseRegistryValue(await this.#run(args))
            } catch {
                // Missing or inaccessible registry entries do not abort the scan.
                return null
            }
        }))
        return values.find((value) => value !== null) ?? null
    }
}
