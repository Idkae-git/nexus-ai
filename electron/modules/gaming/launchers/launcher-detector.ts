import type { ApplicationManager } from '../../applications/application-manager.js'
import type { DetectedApplication } from '../../../../src/features/applications/application.types.js'
import type { DetectedLauncher } from '../../../../src/features/gaming/gaming.types.js'
import type { LauncherRegistry } from './launcher.registry.js'

export class LauncherDetector {
    readonly #applications: ApplicationManager
    readonly #registry: LauncherRegistry

    constructor(applicationManager: ApplicationManager, registry: LauncherRegistry) {
        this.#applications = applicationManager
        this.#registry = registry
    }

    async scan() {
        const result = await this.#applications.scan()
        return this.#fromApplications(result.applications)
    }

    async list() {
        return this.#fromApplications(await this.#applications.list())
    }

    async refreshStatus() {
        await this.#applications.refreshRuntimeStatus()
        return this.list()
    }

    #fromApplications(applications: readonly DetectedApplication[]): DetectedLauncher[] {
        return this.#registry.list().map((definition) => {
            const application = definition.applicationId
                ? applications.find((candidate) => candidate.id === definition.applicationId)
                : null
            return {
                ...definition,
                error: null,
                executablePath: application?.executablePath ?? null,
                gameCount: 0,
                installDirectory: application?.installDirectory ?? null,
                installStatus: application?.installStatus ?? 'not-installed',
                runtimeStatus: application?.runtimeStatus ?? 'stopped',
                source: application?.source ?? 'unknown',
            }
        })
    }
}
