import type { PermissionDecision } from '../permissions/permission.types'
import { PermissionManager } from '../permissions/permission-manager'
import type {
    NexusCommandContext,
    NexusCommandRequest,
} from './command.types'
import { CommandRegistry } from './command-registry'

export type CommandExecutionStatus =
    | 'success'
    | 'denied'
    | 'confirmation_required'
    | 'failed'

export interface CommandExecutionResult<TResult = unknown> {
    status: CommandExecutionStatus
    data?: TResult
    error?: string
}

export class CommandExecutor {
    private readonly registry: CommandRegistry
    private readonly permissionManager: PermissionManager

    constructor(
        registry: CommandRegistry,
        permissionManager: PermissionManager,
    ) {
        this.registry = registry
        this.permissionManager = permissionManager
    }

    async execute<TResult = unknown>(
        request: NexusCommandRequest,
    ): Promise<CommandExecutionResult<TResult>> {
        const command = this.registry.get(request.command)

        if (!command) {
            return {
                status: 'failed',
                error: `Command "${request.command}" was not found`,
            }
        }

        const context: NexusCommandContext = {
            source: request.source,
            target: request.target,
        }

        const decision: PermissionDecision =
            this.permissionManager.evaluate(command.confirmation, context)

        if (decision === 'deny') {
            return {
                status: 'denied',
            }
        }

        if (decision === 'confirm') {
            return {
                status: 'confirmation_required',
            }
        }

        try {
            const data = await command.execute(request.payload, context)

            return {
                status: 'success',
                data: data as TResult,
            }
        } catch (error) {
            return {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    }
}