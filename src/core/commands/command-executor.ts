import type {
    NexusCommandContext,
    NexusCommandRequest,
    NexusCommandResult,
} from './command.types.js'

import { CommandRegistry } from './command-registry.js'
import { PendingCommandStore } from './pending-command-store.js'
import { PermissionManager } from '../permissions/permission-manager.js'
import type { PermissionDecision } from '../permissions/permission.types.js'
import { ActivityService } from '../activity/activity-service.js'

export class CommandExecutor {
    private readonly registry: CommandRegistry

    private readonly permissionManager: PermissionManager

    private readonly pendingStore: PendingCommandStore

    private readonly activityService: ActivityService

    constructor(
        registry: CommandRegistry,
        permissionManager: PermissionManager,
        pendingStore: PendingCommandStore,
        activityService: ActivityService,
    ) {
        this.registry = registry
        this.permissionManager = permissionManager
        this.pendingStore = pendingStore
        this.activityService = activityService
    }

    async execute<TResult = unknown>(
        request: NexusCommandRequest,
    ): Promise<NexusCommandResult<TResult>> {
        this.activityService.request({
            id: request.id,
            command: request.command,
            source: request.source,
            createdAt: request.createdAt,
        })

        const command =
            this.registry.get(request.command)

        if (!command) {
            const error = `Unknown command "${request.command}"`
            this.activityService.complete(
                request.id,
                'failed',
                { error },
            )

            return {
                status: 'failed',
                requestId: request.id,
                error,
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

        switch (decision) {
            case 'deny':
                this.activityService.complete(
                    request.id,
                    'denied',
                )

                return {
                    status: 'denied',
                    requestId: request.id,
                }

            case 'confirm':
                this.pendingStore.add(request)
                this.activityService.complete(
                    request.id,
                    'confirmation_required',
                )

                return {
                    status:
                        'confirmation_required',
                    requestId: request.id,
                }

            case 'allow':
                return this.run<TResult>(
                    command,
                    request,
                    context,
                )
        }
    }

    async confirm<TResult = unknown>(
        requestId: string,
    ): Promise<NexusCommandResult<TResult>> {
        const request =
            this.pendingStore.take(requestId)

        if (!request) {
            const error = 'Pending command not found or expired.'
            this.activityService.complete(
                requestId,
                'failed',
                { error },
            )

            return {
                status: 'failed',
                requestId,
                error,
            }
        }

        const command =
            this.registry.get(request.command)

        if (!command) {
            const error = 'Command no longer exists.'
            this.activityService.complete(
                requestId,
                'failed',
                { error },
            )

            return {
                status: 'failed',
                requestId,
                error,
            }
        }

        const context: NexusCommandContext = {
            source: request.source,
            target: request.target,
        }

        return this.run<TResult>(
            command,
            request,
            context,
        )
    }

    cancel(
        requestId: string,
    ): boolean {
        const cancelled = this.pendingStore.cancel(
            requestId,
        )

        if (cancelled) {
            this.activityService.complete(
                requestId,
                'cancelled',
            )
        } else if (this.activityService.get(requestId)) {
            this.activityService.complete(
                requestId,
                'failed',
                {
                    error: 'Pending command not found or expired.',
                },
            )
        }

        return cancelled
    }

    private async run<TResult>(
        command: NonNullable<
            ReturnType<
                CommandRegistry['get']
            >
        >,
        request: NexusCommandRequest,
        context: NexusCommandContext,
    ): Promise<NexusCommandResult<TResult>> {
        try {
            const result =
                await command.execute(
                    request.payload,
                    context,
                )

            this.activityService.complete(
                request.id,
                'success',
                { result },
            )

            return {
                status: 'success',
                requestId: request.id,
                data: result as TResult,
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown error'

            this.activityService.complete(
                request.id,
                'failed',
                { error: message },
            )

            return {
                status: 'failed',
                requestId: request.id,
                error: message,
            }
        }
    }
}
