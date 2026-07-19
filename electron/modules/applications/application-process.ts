import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { ApplicationCloseResult, ApplicationId, ApplicationRuntimeStatus } from '../../../src/features/applications/application.types.js'
import type { RegisteredApplicationDefinition } from './application.registry.js'

const executeFile = promisify(execFile)

export type ProcessCommandRunner = (executable: string, args: readonly string[]) => Promise<string>

async function runProcessCommand(executable: string, args: readonly string[]) {
    const result = await executeFile(executable, [...args], {
        encoding: 'utf8',
        windowsHide: true,
    })
    return result.stdout
}
export function parseTasklist(output: string) {
    const processes = new Set<string>()
    for (const line of output.split(/\r?\n/)) {
        const match = /^"((?:[^"]|"")+)"/.exec(line.trim())
        if (match?.[1]) processes.add(match[1].replace(/""/g, '"').toLocaleLowerCase())
    }
    return processes
}

export class ApplicationProcessService {
    readonly #run: ProcessCommandRunner

    constructor(run: ProcessCommandRunner = runProcessCommand) {
        this.#run = run
    }

    async listProcesses() {
        try {
            return parseTasklist(await this.#run('tasklist.exe', ['/FO', 'CSV', '/NH']))
        } catch {
            return null
        }
    }

    status(definition: RegisteredApplicationDefinition, processes: ReadonlySet<string> | null): ApplicationRuntimeStatus {
        if (!processes) return 'unknown'
        return definition.processNames.some((name) => processes.has(name.toLocaleLowerCase())) ? 'running' : 'stopped'
    }

    async close(definition: RegisteredApplicationDefinition): Promise<ApplicationCloseResult> {
        if (!definition.capabilities.close) throw new Error(`Closing ${definition.name} is not supported.`)
        const processes = await this.listProcesses()
        if (!processes) throw new Error('Application runtime status could not be determined.')
        const running = definition.processNames.filter((name) => processes.has(name.toLocaleLowerCase()))
        if (running.length === 0) throw new Error(`${definition.name} is not running.`)

        const closedProcesses: string[] = []
        for (const processName of running) {
            try {
                await this.#run('taskkill.exe', ['/IM', processName])
                closedProcesses.push(processName)
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown process error'
                throw new Error(`Could not close ${definition.name}: ${message}`)
            }
        }
        return { applicationId: definition.id as ApplicationId, closedProcesses, success: true }
    }
}
