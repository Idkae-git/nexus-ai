import type { NexusCommandRequest } from './command.types.js'

interface PendingCommand {
    request: NexusCommandRequest
    expiresAt: number
}

export class PendingCommandStore {
    private readonly commands = new Map<string, PendingCommand>()

    add(
        request: NexusCommandRequest,
        ttlMs = 60_000,
    ): void {
        this.commands.set(request.id, {
            request,
            expiresAt: Date.now() + ttlMs,
        })
    }

    take(requestId: string): NexusCommandRequest | undefined {
        const pendingCommand = this.commands.get(requestId)

        if (!pendingCommand) {
            return undefined
        }

        this.commands.delete(requestId)

        if (pendingCommand.expiresAt < Date.now()) {
            return undefined
        }

        return pendingCommand.request
    }

    cancel(requestId: string): boolean {
        return this.commands.delete(requestId)
    }
}