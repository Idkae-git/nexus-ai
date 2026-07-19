import type {
    ApplicationCloseResult,
    ApplicationId,
    ApplicationLaunchResult,
    ApplicationRuntimeResult,
    ApplicationScanResult,
    DetectedApplication,
} from '../../../src/features/applications/application.types.js'
import type { ApplicationDetector } from './application-detector.js'
import type { ApplicationHistory } from './application-history.js'
import type { ApplicationLauncher } from './application-launcher.js'
import type { ApplicationProcessService } from './application-process.js'
import type { ApplicationRegistry } from './application.registry.js'

export class ApplicationManager {
    readonly #registry: ApplicationRegistry
    readonly #detector: ApplicationDetector
    readonly #launcher: ApplicationLauncher
    readonly #processes: ApplicationProcessService
    readonly #history: ApplicationHistory
    #applications: DetectedApplication[] | null = null
    #scanPromise: Promise<ApplicationScanResult> | null = null

    constructor(options: {
        detector: ApplicationDetector
        history: ApplicationHistory
        launcher: ApplicationLauncher
        processService: ApplicationProcessService
        registry: ApplicationRegistry
    }) {
        this.#registry = options.registry
        this.#detector = options.detector
        this.#launcher = options.launcher
        this.#processes = options.processService
        this.#history = options.history
    }

    scan() {
        if (!this.#scanPromise) {
            this.#scanPromise = this.#detector.scan()
                .then(async (applications) => {
                    this.#applications = await Promise.all(applications.map(async (application) => ({
                        ...application,
                        ...await this.#history.usage(application.id),
                    })))
                    return { applications: this.#applications, scannedAt: Date.now() }
                })
                .finally(() => {
                    this.#scanPromise = null
                })
        }
        return this.#scanPromise
    }

    async list() {
        if (!this.#applications) await this.scan()
        return this.#applications ?? []
    }

    async get(applicationId: ApplicationId) {
        this.#registry.get(applicationId)
        const applications = await this.list()
        const application = applications.find((entry) => entry.id === applicationId)
        if (!application) throw new Error(`Application "${applicationId}" was not detected.`)
        return application
    }

    async launch(applicationId: ApplicationId): Promise<ApplicationLaunchResult> {
        const application = await this.get(applicationId)
        try {
            const result = await this.#launcher.launch(application)
            await this.#history.record({ applicationId, success: true, timestamp: result.launchedAt })
            const usage = await this.#history.usage(applicationId)
            this.#applications = (await this.list()).map((entry) => entry.id === applicationId
                ? { ...entry, ...usage }
                : entry)
            return result
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown launch error'
            await this.#history.record({ applicationId, error: message, success: false, timestamp: Date.now() })
            throw error
        }
    }

    async close(applicationId: ApplicationId): Promise<ApplicationCloseResult> {
        const definition = this.#registry.get(applicationId)
        return this.#processes.close(definition)
    }

    async refreshRuntimeStatus(): Promise<ApplicationRuntimeResult[]> {
        const applications = await this.list()
        const processes = await this.#processes.listProcesses()
        const statuses = applications.map((application) => ({
            applicationId: application.id,
            runtimeStatus: this.#processes.status(this.#registry.get(application.id), processes),
        }))
        const byId = new Map(statuses.map((status) => [status.applicationId, status.runtimeStatus]))
        this.#applications = applications.map((application) => ({
            ...application,
            runtimeStatus: byId.get(application.id) ?? 'unknown',
        }))
        return statuses
    }

    async running() {
        await this.refreshRuntimeStatus()
        return (this.#applications ?? []).filter((application) => application.runtimeStatus === 'running')
    }

    recent(limit?: number) {
        return this.#history.listRecent(limit)
    }
}
