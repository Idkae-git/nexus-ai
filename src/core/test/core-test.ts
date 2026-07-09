import { CommandExecutor } from '../commands/command-executor.js'
import { CommandRegistry } from '../commands/command-registry.js'
import type { NexusCommand } from '../commands/command.types.js'
import { PendingCommandStore } from '../commands/pending-command-store.js'
import { PermissionManager } from '../permissions/permission-manager.js'

interface PingResult {
    message: string
    timestamp: number
}

const registry = new CommandRegistry()
const permissionManager = new PermissionManager()
const pendingCommandStore = new PendingCommandStore()

const executor = new CommandExecutor(
    registry,
    permissionManager,
    pendingCommandStore,
)

const pingCommand: NexusCommand<void, PingResult> = {
    id: 'system.ping',
    module: 'system',
    description: 'Test the NEXUS Core command pipeline',
    permission: 'system.read',
    confirmation: 'none',
    platforms: ['windows'],

    async execute() {
        return {
            message: 'NEXUS CORE ONLINE',
            timestamp: Date.now(),
        }
    },
}

const shutdownCommand: NexusCommand<void, void> = {
    id: 'system.shutdown',
    module: 'system',
    description: 'Shutdown the local computer',
    permission: 'system.power',
    confirmation: 'critical',
    platforms: ['windows'],

    async execute() {
        throw new Error(
            'TEST FAILURE: shutdown handler must not execute without confirmation',
        )
    },
}

registry.register(pingCommand)
registry.register(shutdownCommand)

const pingResult = await executor.execute<PingResult>({
    id: crypto.randomUUID(),
    command: 'system.ping',
    target: {
        type: 'local',
    },
    payload: undefined,
    source: 'ui',
    createdAt: Date.now(),
})

const confirmationResult = await executor.execute({
    id: crypto.randomUUID(),
    command: 'system.shutdown',
    target: {
        type: 'local',
    },
    payload: undefined,
    source: 'ui',
    createdAt: Date.now(),
})

const remoteResult = await executor.execute({
    id: crypto.randomUUID(),
    command: 'system.ping',
    target: {
        type: 'local',
    },
    payload: undefined,
    source: 'remote',
    createdAt: Date.now(),
})

console.log('=== NEXUS CORE TEST ===')

console.log('PING:')
console.log(pingResult)

console.log('CONFIRMATION:')
console.log(confirmationResult)

console.log('REMOTE:')
console.log(remoteResult)

console.log('=== END TEST ===')