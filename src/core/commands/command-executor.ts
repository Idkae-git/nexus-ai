import type { PermissionDecision } from '../permissions/permission.types.js'
import { PermissionManager } from '../permissions/permission-manager.js'
import type {
    NexusCommandContext,
    NexusCommandRequest,
} from './command.types.js'
import { CommandRegistry } from './command-registry.js'
import { PendingCommandStore } from './pending-command-store.js'

export type CommandExecutionStatus =
    | 'success'
    | 'denied'
    | 'confirmation_required'
    | 'failed'

export interface CommandExecutionResult<TResult = unknown> {
    status: CommandExecutionStatus
    requestId?: string
    data?: TResult
    error?: string
}

export class CommandExecutor {
    private readonly registry: CommandRegistry
    private readonly permissionManager: PermissionManager
    private readonly pendingCommandStore: PendingCommandStore

    constructor(
        registry: CommandRegistry,
        permissionManager: PermissionManager,
        pendingCommandStore: PendingCommandStore,
    ) {
        this.registry = registry
        this.permissionManager = permissionManager
        this.pendingCommandStore = pendingCommandStore
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
            this.permissionManager.evaluate(
                command.confirmation,
                context,
            )

        if (decision === 'deny') {
            return {
                status: 'denied',
            }
        }

        if (decision === 'confirm') {
            this.pendingCommandStore.add(request)

            return {
                status: 'confirmation_required',
                requestId: request.id,
            }
        }

        return this.runCommand<TResult>(request)
    }

    async confirm<TResult = unknown>(
        requestId: string,
    ): Promise<CommandExecutionResult<TResult>> {
        const request = this.pendingCommandStore.take(requestId)

        if (!request) {
            return {
                status: 'failed',
                error: 'Pending command was not found or has expired',
            }
        }

        return this.runCommand<TResult>(request)
    }

    cancel(requestId: string): boolean {
        return this.pendingCommandStore.cancel(requestId)
    }

    private async runCommand<TResult>(
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

        try {
            const data = await command.execute(
                request.payload,
                context,
            )

            return {
                status: 'success',
                data: data as TResult,
            }
        } catch (error) {
            return {
                status: 'failed',
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error',
            }
        }
    }
}