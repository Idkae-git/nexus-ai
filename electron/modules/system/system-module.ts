import type { CommandRegistry } from '../../../src/core/commands/command-registry.js'
import type { NexusCommand } from '../../../src/core/commands/command.types.js'
import type { SystemBridge } from '../../../src/core/platform/system-bridge.js'

export class SystemModule {
    private readonly registry: CommandRegistry
    private readonly systemBridge: SystemBridge

    constructor(
        registry: CommandRegistry,
        systemBridge: SystemBridge,
    ) {
        this.registry = registry
        this.systemBridge = systemBridge
    }

    register(): void {
        this.registry.register(this.createPingCommand())
        this.registry.register(this.createLockCommand())
        this.registry.register(this.createShutdownCommand())
        this.registry.register(this.createRestartCommand())
        this.registry.register(this.createSleepCommand())
    }

    private createPingCommand(): NexusCommand<void, string> {
        return {
            id: 'system.ping',
            module: 'system',
            description: 'Check NEXUS Core availability',
            permission: 'system.read',
            confirmation: 'none',
            platforms: ['windows'],

            async execute() {
                return 'NEXUS CORE ONLINE'
            },
        }
    }

    private createLockCommand(): NexusCommand<void, void> {
        return this.createSystemCommand(
            'system.lock',
            'Lock the local Windows session',
            () => this.systemBridge.lock(),
        )
    }

    private createShutdownCommand(): NexusCommand<void, void> {
        return this.createSystemCommand(
            'system.shutdown',
            'Shutdown the local computer',
            () => this.systemBridge.shutdown(),
        )
    }

    private createRestartCommand(): NexusCommand<void, void> {
        return this.createSystemCommand(
            'system.restart',
            'Restart the local computer',
            () => this.systemBridge.restart(),
        )
    }

    private createSleepCommand(): NexusCommand<void, void> {
        return this.createSystemCommand(
            'system.sleep',
            'Put the local computer to sleep',
            () => this.systemBridge.sleep(),
        )
    }

    private createSystemCommand(
        id: string,
        description: string,
        execute: () => Promise<void>,
    ): NexusCommand<void, void> {
        return {
            id,
            module: 'system',
            description,
            permission: 'system.power',
            confirmation: 'critical',
            platforms: ['windows'],

            async execute() {
                await execute()
            },
        }
    }
}