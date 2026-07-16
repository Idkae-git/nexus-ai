import type { NexusCommandRequest } from './command.types.js'

export interface PendingCommand {
    request: NexusCommandRequest
    createdAt: number
    expiresAt: number
}

export class PendingCommandStore {
    private readonly commands = new Map<
        string,
        PendingCommand
    >()

    add(
        request: NexusCommandRequest,
        ttlMs = 60_000,
    ): void {
        const now = Date.now()

        this.commands.set(request.id, {
            request,
            createdAt: now,
            expiresAt: now + ttlMs,
        })
    }

    get(
        requestId: string,
    ): PendingCommand | undefined {
        const command =
            this.commands.get(requestId)

        if (!command) {
            return undefined
        }

        if (command.expiresAt < Date.now()) {
            this.commands.delete(requestId)
            return undefined
        }

        return command
    }

    take(
        requestId: string,
    ): NexusCommandRequest | undefined {
        const command =
            this.get(requestId)

        if (!command) {
            return undefined
        }

        this.commands.delete(requestId)

        return command.request
    }

    cancel(
        requestId: string,
    ): boolean {
        return this.commands.delete(
            requestId,
        )
    }

    clear(): void {
        this.commands.clear()
    }

    size(): number {
        this.cleanup()

        return this.commands.size
    }

    list(): PendingCommand[] {
        this.cleanup()

        return Array.from(
            this.commands.values(),
        )
    }

    cleanup(): number {
        const now = Date.now()

        let removed = 0

        for (const [
            id,
            command,
        ] of this.commands) {
            if (command.expiresAt <= now) {
                this.commands.delete(id)
                removed++
            }
        }

        return removed
    }
}