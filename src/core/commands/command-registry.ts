import type { NexusCommand } from './command.types'

export class CommandRegistry {
    private readonly commands = new Map<string, NexusCommand>()

    register(command: NexusCommand): void {
        if (this.commands.has(command.id)) {
            throw new Error(`Command "${command.id}" is already registered`)
        }

        this.commands.set(command.id, command)
    }

    get(commandId: string): NexusCommand | undefined {
        return this.commands.get(commandId)
    }

    has(commandId: string): boolean {
        return this.commands.has(commandId)
    }

    list(): NexusCommand[] {
        return Array.from(this.commands.values())
    }
}