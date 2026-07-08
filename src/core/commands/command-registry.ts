import type { NexusCommand } from './command.types.js'

type RegistryCommand = NexusCommand<any, any>

export class CommandRegistry {
    private readonly commands = new Map<
        string,
        RegistryCommand
    >()

    register<TPayload, TResult>(
        command: NexusCommand<TPayload, TResult>,
    ): void {
        if (this.commands.has(command.id)) {
            throw new Error(
                `Command "${command.id}" is already registered`,
            )
        }

        this.commands.set(command.id, command)
    }

    get(commandId: string): RegistryCommand | undefined {
        return this.commands.get(commandId)
    }

    has(commandId: string): boolean {
        return this.commands.has(commandId)
    }

    list(): RegistryCommand[] {
        return Array.from(this.commands.values())
    }
}