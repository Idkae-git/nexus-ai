import type { NexusCommand } from './command.types.js'

type RegistryCommand = NexusCommand<any, any>

export interface CommandDescriptor {
    id: string
    module: string
    description: string
    confirmation: string
    permission: string
    platforms: readonly string[]
}

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

    unregister(commandId: string): boolean {
        return this.commands.delete(commandId)
    }

    clear(): void {
        this.commands.clear()
    }

    get(
        commandId: string,
    ): RegistryCommand | undefined {
        return this.commands.get(commandId)
    }

    has(commandId: string): boolean {
        return this.commands.has(commandId)
    }

    list(): RegistryCommand[] {
        return Array.from(this.commands.values())
    }

    descriptors(): CommandDescriptor[] {
        return this.list()
            .map((command) => ({
                id: command.id,
                module: command.module,
                description: command.description,
                confirmation:
                    command.confirmation,
                permission: command.permission,
                platforms: command.platforms,
            }))
            .sort((a, b) =>
                a.id.localeCompare(b.id),
            )
    }

    count(): number {
        return this.commands.size
    }
}