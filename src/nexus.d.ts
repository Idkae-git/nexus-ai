import type {
    NexusCommandRequest,
    NexusCommandResult,
} from './core/commands/command.types.js'
import type {
    ActivityFilter,
    NexusActivityEntry,
} from './core/activity/activity.types.js'

declare global {
    interface Window {
        nexus: {
            ping(): Promise<NexusCommandResult<string>>

            execute<TPayload = unknown, TResult = unknown>(
                request: NexusCommandRequest<TPayload>,
            ): Promise<NexusCommandResult<TResult>>

            confirm(
                requestId: string,
            ): Promise<NexusCommandResult>

            cancel(
                requestId: string,
            ): Promise<boolean>

            listActivities(
                filter?: ActivityFilter,
            ): Promise<NexusActivityEntry[]>

            clearActivities(): Promise<void>
        }
    }
}

export { }
