import { access, stat } from 'node:fs/promises'
import * as path from 'node:path'

import type { DetectedApplication } from '../../../src/features/applications/application.types.js'
import type { ApplicationProcessService } from './application-process.js'
import type { ApplicationRegistry, RegisteredApplicationDefinition } from './application.registry.js'
import type { RegistryValueReader } from './application-registry-reader.js'
import { normalizeExecutableCandidate, resolvePathCandidate } from './application-paths.js'

export type ExecutableFileCheck = (filePath: string) => Promise<boolean>

async function executableExists(filePath: string) {
    try {
        await access(filePath)
        return (await stat(filePath)).isFile()
    } catch {
        return false
    }
}

function executableIsAllowed(definition: RegisteredApplicationDefinition, filePath: string) {
    const basename = path.basename(filePath).toLocaleLowerCase()
    return definition.executableNames.some((name) => name.toLocaleLowerCase() === basename)
}

function publicDefinition(definition: RegisteredApplicationDefinition) {
    return {
        capabilities: definition.capabilities,
        category: definition.category,
        defaultArguments: definition.defaultArguments,
        description: definition.description,
        executableNames: definition.executableNames,
        iconId: definition.iconId,
        id: definition.id,
        name: definition.name,
        processNames: definition.processNames,
        publisher: definition.publisher,
    }
}

export class ApplicationDetector {
    readonly #registry: ApplicationRegistry
    readonly #registryReader: RegistryValueReader
    readonly #processes: ApplicationProcessService
    readonly #environment: NodeJS.ProcessEnv
    readonly #fileExists: ExecutableFileCheck

    constructor(options: {
        applicationRegistry: ApplicationRegistry
        environment?: NodeJS.ProcessEnv
        fileExists?: ExecutableFileCheck
        processService: ApplicationProcessService
        registryReader: RegistryValueReader
    }) {
        this.#registry = options.applicationRegistry
        this.#registryReader = options.registryReader
        this.#processes = options.processService
        this.#environment = options.environment ?? process.env
        this.#fileExists = options.fileExists ?? executableExists
    }

    async scan() {
        const processes = await this.#processes.listProcesses()
        return Promise.all(this.#registry.list().map((definition) => this.#detect(definition, processes)))
    }

    async #detect(definition: RegisteredApplicationDefinition, processes: ReadonlySet<string> | null): Promise<DetectedApplication> {
        for (const candidate of definition.registryCandidates) {
            const value = await this.#registryReader.read(candidate)
            if (!value) continue
            const executablePath = normalizeExecutableCandidate(value, candidate.appendExecutable)
            if (executableIsAllowed(definition, executablePath) && await this.#fileExists(executablePath)) {
                return this.#detected(definition, executablePath, 'registry', processes)
            }
        }

        for (const candidate of definition.pathCandidates) {
            const executablePath = resolvePathCandidate(candidate.path, this.#environment)
            if (executablePath && executableIsAllowed(definition, executablePath) && await this.#fileExists(executablePath)) {
                return this.#detected(definition, executablePath, candidate.source, processes)
            }
        }

        const runtimeStatus = this.#processes.status(definition, processes)
        return {
            ...publicDefinition(definition),
            executablePath: null,
            installDirectory: null,
            installStatus: runtimeStatus === 'running' ? 'unknown' : 'not-installed',
            lastLaunchedAt: null,
            launchCount: 0,
            metadata: {},
            runtimeStatus,
            source: 'unknown',
        }
    }

    #detected(
        definition: RegisteredApplicationDefinition,
        executablePath: string,
        source: DetectedApplication['source'],
        processes: ReadonlySet<string> | null,
    ): DetectedApplication {
        return {
            ...publicDefinition(definition),
            executablePath,
            installDirectory: path.dirname(executablePath),
            installStatus: 'installed',
            lastLaunchedAt: null,
            launchCount: 0,
            metadata: { detection: source },
            runtimeStatus: this.#processes.status(definition, processes),
            source,
        }
    }
}
