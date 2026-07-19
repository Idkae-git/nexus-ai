import { z } from 'zod'

import type { CommandRegistry } from '../../../src/core/commands/command-registry.js'
import type { NexusCommand } from '../../../src/core/commands/command.types.js'
import { APPLICATION_IDS } from '../../../src/features/applications/application.types.js'
import type {
    ApplicationClosePayload,
    ApplicationCloseResult,
    ApplicationGetPayload,
    ApplicationId,
    ApplicationLaunchPayload,
    ApplicationLaunchResult,
    ApplicationRecentEntry,
    ApplicationRuntimeResult,
    ApplicationScanResult,
    DetectedApplication,
} from '../../../src/features/applications/application.types.js'
import type { ApplicationManager } from './application-manager.js'

const applicationIdSchema = z.enum(APPLICATION_IDS)
const applicationPayloadSchema = z.object({ applicationId: applicationIdSchema }).strict()
const recentPayloadSchema = z.object({ limit: z.number().int().min(0).max(100).optional() }).strict().optional()

function applicationId(payload: unknown, command: string): ApplicationId {
    const result = applicationPayloadSchema.safeParse(payload)
    if (!result.success) throw new Error(`Invalid payload for ${command}. A known applicationId is required.`)
    return result.data.applicationId
}

function noPayload(payload: unknown, command: string) {
    if (payload !== undefined && payload !== null) throw new Error(`Invalid payload for ${command}. No payload is accepted.`)
}

export class ApplicationsModule {
    readonly #registry: CommandRegistry
    readonly #manager: ApplicationManager

    constructor(registry: CommandRegistry, manager: ApplicationManager) {
        this.#registry = registry
        this.#manager = manager
    }

    register() {
        this.#registry.register(this.#scanCommand())
        this.#registry.register(this.#listCommand())
        this.#registry.register(this.#getCommand())
        this.#registry.register(this.#launchCommand())
        this.#registry.register(this.#closeCommand())
        this.#registry.register(this.#refreshStatusCommand())
        this.#registry.register(this.#runningCommand())
        this.#registry.register(this.#recentCommand())
    }

    #scanCommand(): NexusCommand<void, ApplicationScanResult> {
        return this.#readCommand('applications.scan', 'Scan known Windows application locations', (payload) => {
            noPayload(payload, 'applications.scan')
            return this.#manager.scan()
        })
    }

    #listCommand(): NexusCommand<void, DetectedApplication[]> {
        return this.#readCommand('applications.list', 'List detected Windows applications', (payload) => {
            noPayload(payload, 'applications.list')
            return this.#manager.list()
        })
    }

    #getCommand(): NexusCommand<ApplicationGetPayload, DetectedApplication> {
        return this.#readCommand('applications.get', 'Read one detected Windows application', (payload) => (
            this.#manager.get(applicationId(payload, 'applications.get'))
        ))
    }

    #launchCommand(): NexusCommand<ApplicationLaunchPayload, ApplicationLaunchResult> {
        return {
            id: 'applications.launch',
            module: 'apps',
            description: 'Launch a registered Windows application',
            permission: 'app.launch',
            confirmation: 'none',
            platforms: ['windows'],
            execute: (payload) => this.#manager.launch(applicationId(payload, 'applications.launch')),
        }
    }

    #closeCommand(): NexusCommand<ApplicationClosePayload, ApplicationCloseResult> {
        return {
            id: 'applications.close',
            module: 'apps',
            description: 'Close a registered Windows application without force',
            permission: 'app.manage',
            confirmation: 'none',
            platforms: ['windows'],
            execute: (payload) => this.#manager.close(applicationId(payload, 'applications.close')),
        }
    }

    #refreshStatusCommand(): NexusCommand<void, ApplicationRuntimeResult[]> {
        return this.#readCommand('applications.refresh-status', 'Refresh application process statuses', (payload) => {
            noPayload(payload, 'applications.refresh-status')
            return this.#manager.refreshRuntimeStatus()
        })
    }

    #runningCommand(): NexusCommand<void, DetectedApplication[]> {
        return this.#readCommand('applications.running.list', 'List running registered applications', (payload) => {
            noPayload(payload, 'applications.running.list')
            return this.#manager.running()
        })
    }

    #recentCommand(): NexusCommand<{ limit?: number } | undefined, ApplicationRecentEntry[]> {
        return this.#readCommand('applications.recent.list', 'List applications launched from NEXUS', (payload) => {
            const result = recentPayloadSchema.safeParse(payload)
            if (!result.success) throw new Error('Invalid payload for applications.recent.list.')
            return this.#manager.recent(result.data?.limit)
        })
    }

    #readCommand<TPayload, TResult>(
        id: string,
        description: string,
        execute: NexusCommand<TPayload, TResult>['execute'],
    ): NexusCommand<TPayload, TResult> {
        return {
            id,
            module: 'apps',
            description,
            permission: 'system.read',
            confirmation: 'none',
            platforms: ['windows'],
            execute,
        }
    }
}
